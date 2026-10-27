const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const authenticate = require('../middleware/authenticate');
const authorizeRole = require('../middleware/authorizeRole');
const { logAuditAction } = require('../middleware/auditLogger');

// All master routes require authentication and 'master' role strictly
router.use(authenticate, authorizeRole('master'));

/**
 * GET /api/master/stats
 * Real campus analytics from database
 */
router.get('/stats', async (req, res, next) => {
    try {
        const studentCountRes = await query('SELECT COUNT(*) FROM students');
        const facultyCountRes = await query('SELECT COUNT(*) FROM faculty');
        const courseCountRes = await query('SELECT COUNT(*) FROM courses');
        const deptCountRes = await query('SELECT COUNT(*) FROM departments');
        const asgCountRes = await query('SELECT COUNT(*) FROM assignments');
        const subCountRes = await query('SELECT COUNT(*) FROM submissions');
        const avgAttRes = await query('SELECT AVG(attendance_pct) as avg_att FROM students');

        const totalStudents = parseInt(studentCountRes.rows[0].count, 10);
        const totalFaculty = parseInt(facultyCountRes.rows[0].count, 10);
        const totalCourses = parseInt(courseCountRes.rows[0].count, 10);
        const totalDepartments = parseInt(deptCountRes.rows[0].count, 10);
        const totalAssignments = parseInt(asgCountRes.rows[0].count, 10);
        const totalSubmissions = parseInt(subCountRes.rows[0].count, 10);
        const avgAttendance = avgAttRes.rows[0].avg_att ? parseFloat(avgAttRes.rows[0].avg_att).toFixed(1) : '85.0';

        res.json({
            success: true,
            stats: {
                total_students: totalStudents,
                total_faculty: totalFaculty,
                total_courses: totalCourses,
                total_departments: totalDepartments,
                total_assignments: totalAssignments,
                total_submissions: totalSubmissions,
                avg_campus_attendance: avgAttendance,
                active_semester: 'Autumn 2026',
                system_status: 'Optimal / PostgreSQL Online'
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/master/students
 */
router.get('/students', async (req, res, next) => {
    try {
        const { query: searchQuery, department, semester } = req.query;

        let sql = `
            SELECT 
                s.id, s.profile_id, s.roll_number, s.semester, s.cgpa, s.attendance_pct, s.batch_year,
                p.full_name, p.email, p.phone, p.status,
                d.name as department_name, d.code as department_code
            FROM students s
            JOIN profiles p ON s.profile_id = p.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (searchQuery) {
            params.push(`%${searchQuery.trim().toLowerCase()}%`);
            sql += ` AND (LOWER(p.full_name) LIKE $${params.length} OR LOWER(s.roll_number) LIKE $${params.length} OR LOWER(p.email) LIKE $${params.length})`;
        }

        if (department && department !== 'all') {
            params.push(department);
            sql += ` AND (d.code = $${params.length} OR d.name = $${params.length})`;
        }

        if (semester && semester !== 'all') {
            params.push(parseInt(semester, 10));
            sql += ` AND s.semester = $${params.length}`;
        }

        sql += ` ORDER BY s.roll_number ASC;`;

        const result = await query(sql, params);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/master/students
 * Add a new student into database
 */
router.post('/students', async (req, res, next) => {
    try {
        const { roll_number, full_name, email, department, semester, cgpa, password } = req.body;

        if (!roll_number || !full_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Roll number, full name, and email are required.'
            });
        }

        // Check duplicate
        const check = await query(`
            SELECT id FROM profiles WHERE email = $1 
            UNION 
            SELECT id FROM students WHERE roll_number = $2;
        `, [email.toLowerCase().trim(), roll_number.trim()]);

        if (check.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A student with this roll number or email already exists.'
            });
        }

        // Department ID lookup
        let deptId = null;
        if (department) {
            const deptRes = await query('SELECT id FROM departments WHERE code = $1 OR name = $1 LIMIT 1', [department]);
            if (deptRes.rows.length > 0) deptId = deptRes.rows[0].id;
        }

        const passwordHash = await bcrypt.hash(password || '123456', 10);

        const profRes = await query(`
            INSERT INTO profiles (email, password_hash, full_name, role, status)
            VALUES ($1, $2, $3, 'student', 'active')
            RETURNING id;
        `, [email.toLowerCase().trim(), passwordHash, full_name.trim()]);

        const profileId = profRes.rows[0].id;

        const studRes = await query(`
            INSERT INTO students (profile_id, roll_number, department_id, semester, cgpa, attendance_pct)
            VALUES ($1, $2, $3, $4, $5, 100.0)
            RETURNING *;
        `, [profileId, roll_number.trim(), deptId, Number(semester) || 1, Number(cgpa) || 8.0]);

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'ADD_STUDENT',
            entity: 'STUDENTS',
            entityId: studRes.rows[0].id,
            details: `Enrolled student ${full_name} (${roll_number})`,
            req
        });

        res.status(201).json({
            success: true,
            message: `Student ${full_name} successfully enrolled!`,
            data: studRes.rows[0]
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/master/students/:id
 */
router.put('/students/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { full_name, semester, cgpa, attendance_pct, department } = req.body;

        const studCheck = await query('SELECT profile_id FROM students WHERE id = $1', [id]);
        if (studCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student record not found.' });
        }

        const profileId = studCheck.rows[0].profile_id;

        if (full_name) {
            await query('UPDATE profiles SET full_name = $1 WHERE id = $2', [full_name.trim(), profileId]);
        }

        let deptId = undefined;
        if (department) {
            const dRes = await query('SELECT id FROM departments WHERE code = $1 OR name = $1 LIMIT 1', [department]);
            if (dRes.rows.length > 0) deptId = dRes.rows[0].id;
        }

        const updateFields = [];
        const updateParams = [id];

        if (semester) {
            updateParams.push(Number(semester));
            updateFields.push(`semester = $${updateParams.length}`);
        }
        if (cgpa !== undefined) {
            updateParams.push(Number(cgpa));
            updateFields.push(`cgpa = $${updateParams.length}`);
        }
        if (attendance_pct !== undefined) {
            updateParams.push(Number(attendance_pct));
            updateFields.push(`attendance_pct = $${updateParams.length}`);
        }
        if (deptId !== undefined) {
            updateParams.push(deptId);
            updateFields.push(`department_id = $${updateParams.length}`);
        }

        if (updateFields.length > 0) {
            await query(`UPDATE students SET ${updateFields.join(', ')} WHERE id = $1`, updateParams);
        }

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'UPDATE_STUDENT',
            entity: 'STUDENTS',
            entityId: id,
            details: `Updated student record id ${id}`,
            req
        });

        res.json({
            success: true,
            message: 'Student record updated successfully in database.'
        });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/master/students/:id
 */
router.delete('/students/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const studCheck = await query('SELECT profile_id, roll_number FROM students WHERE id = $1', [id]);
        if (studCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student record not found.' });
        }

        const { profile_id, roll_number } = studCheck.rows[0];

        // Deleting profile cascades to students
        await query('DELETE FROM profiles WHERE id = $1', [profile_id]);

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'DELETE_STUDENT',
            entity: 'STUDENTS',
            entityId: id,
            details: `Deleted student record ${roll_number}`,
            req
        });

        res.json({
            success: true,
            message: `Student record ${roll_number} deleted successfully.`
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/master/faculty
 */
router.get('/faculty', async (req, res, next) => {
    try {
        const result = await query(`
            SELECT 
                f.id, f.profile_id, f.employee_id, f.designation, f.specialization,
                p.full_name, p.email, p.phone, p.status,
                d.name as department_name, d.code as department_code
            FROM faculty f
            JOIN profiles p ON f.profile_id = p.id
            LEFT JOIN departments d ON f.department_id = d.id
            ORDER BY f.employee_id ASC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/master/faculty
 */
router.post('/faculty', async (req, res, next) => {
    try {
        const { employee_id, full_name, email, department, designation, specialization, password } = req.body;

        if (!employee_id || !full_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID, full name, and email are required.'
            });
        }

        const check = await query(`
            SELECT id FROM profiles WHERE email = $1 
            UNION 
            SELECT id FROM faculty WHERE employee_id = $2;
        `, [email.toLowerCase().trim(), employee_id.trim()]);

        if (check.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A faculty member with this Employee ID or Email already exists.'
            });
        }

        let deptId = null;
        if (department) {
            const deptRes = await query('SELECT id FROM departments WHERE code = $1 OR name = $1 LIMIT 1', [department]);
            if (deptRes.rows.length > 0) deptId = deptRes.rows[0].id;
        }

        const passHash = await bcrypt.hash(password || 'faculty123', 10);

        const profRes = await query(`
            INSERT INTO profiles (email, password_hash, full_name, role, status)
            VALUES ($1, $2, $3, 'faculty', 'active')
            RETURNING id;
        `, [email.toLowerCase().trim(), passHash, full_name.trim()]);

        const profileId = profRes.rows[0].id;

        const facRes = await query(`
            INSERT INTO faculty (profile_id, employee_id, department_id, designation, specialization)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [profileId, employee_id.trim(), deptId, designation || 'Assistant Professor', specialization || 'Computer Science']);

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'ADD_FACULTY',
            entity: 'FACULTY',
            entityId: facRes.rows[0].id,
            details: `Registered faculty ${full_name} (${employee_id})`,
            req
        });

        res.status(201).json({
            success: true,
            message: `Faculty ${full_name} registered successfully.`,
            data: facRes.rows[0]
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/master/departments
 */
router.get('/departments', async (req, res, next) => {
    try {
        const result = await query('SELECT * FROM departments ORDER BY code ASC;');
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/master/departments
 */
router.post('/departments', async (req, res, next) => {
    try {
        const { code, name, hod_name } = req.body;
        if (!code || !name) {
            return res.status(400).json({ success: false, message: 'Department code and name are required.' });
        }

        const result = await query(`
            INSERT INTO departments (code, name, hod_name)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [code.toUpperCase().trim(), name.trim(), hod_name || 'TBA']);

        const newDept = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'CREATE_DEPARTMENT',
            entity: 'DEPARTMENTS',
            entityId: newDept.id,
            details: `Created department ${code} - ${name}`,
            req
        });

        res.status(201).json({ success: true, message: 'Department created.', data: newDept });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/master/courses
 */
router.get('/courses', async (req, res, next) => {
    try {
        const result = await query(`
            SELECT c.*, d.name as department_name, d.code as department_code
            FROM courses c
            LEFT JOIN departments d ON c.department_id = d.id
            ORDER BY c.code ASC;
        `);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/master/courses
 */
router.post('/courses', async (req, res, next) => {
    try {
        const { code, title, credits, semester, faculty_name, department_code } = req.body;
        if (!code || !title) {
            return res.status(400).json({ success: false, message: 'Course code and title are required.' });
        }

        let deptId = null;
        if (department_code) {
            const dRes = await query('SELECT id FROM departments WHERE code = $1 LIMIT 1', [department_code]);
            if (dRes.rows.length > 0) deptId = dRes.rows[0].id;
        }

        const result = await query(`
            INSERT INTO courses (code, title, credits, semester, faculty_name, department_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [code.toUpperCase().trim(), title.trim(), Number(credits) || 3, Number(semester) || 1, faculty_name || 'Unassigned', deptId]);

        const newCourse = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'CREATE_COURSE',
            entity: 'COURSES',
            entityId: newCourse.id,
            details: `Created course ${code} - ${title}`,
            req
        });

        res.status(201).json({ success: true, message: 'Course created.', data: newCourse });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/master/courses/assign
 */
router.post('/courses/assign', async (req, res, next) => {
    try {
        const { course_id, faculty_name } = req.body;
        const result = await query(`
            UPDATE courses SET faculty_name = $1 WHERE id = $2 RETURNING *;
        `, [faculty_name, course_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const course = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'ASSIGN_COURSE_FACULTY',
            entity: 'COURSES',
            entityId: course_id,
            details: `Assigned faculty ${faculty_name} to course ${course.code}`,
            req
        });

        res.json({ success: true, message: `Course ${course.code} assigned to ${faculty_name}.`, data: course });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/master/attendance/overview
 */
router.get('/attendance/overview', async (req, res, next) => {
    try {
        const defaultersRes = await query(`
            SELECT s.id, s.roll_number, p.full_name, s.attendance_pct, d.name as department_name
            FROM students s
            JOIN profiles p ON s.profile_id = p.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.attendance_pct < 75.0
            ORDER BY s.attendance_pct ASC;
        `);

        const totalRecordsRes = await query('SELECT COUNT(*) FROM attendance');
        const recentRes = await query(`
            SELECT a.*, s.roll_number, p.full_name as student_name, c.code as course_code
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN profiles p ON s.profile_id = p.id
            JOIN courses c ON a.course_id = c.id
            ORDER BY a.created_at DESC
            LIMIT 15;
        `);

        res.json({
            success: true,
            defaulters_count: defaultersRes.rows.length,
            defaulters: defaultersRes.rows,
            records_count: parseInt(totalRecordsRes.rows[0].count, 10),
            recent_records: recentRes.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/master/announcements
 */
router.post('/announcements', async (req, res, next) => {
    try {
        const { title, content, priority, audience } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }

        const result = await query(`
            INSERT INTO announcements (title, content, audience, priority, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [title, content, audience || 'all', priority || 'high', req.user.id]);

        const anc = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'OFFICIAL_BROADCAST',
            entity: 'ANNOUNCEMENTS',
            entityId: anc.id,
            details: `Published official college broadcast: '${title}'`,
            req
        });

        res.status(201).json({
            success: true,
            message: 'Campus notice published across portals!',
            data: anc
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/master/users/:id/role
 */
router.put('/users/:id/role', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_role } = req.body;

        if (!['student', 'faculty', 'master'].includes(new_role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        const result = await query(`
            UPDATE profiles SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *;
        `, [new_role, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        }

        const profile = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'CHANGE_USER_ROLE',
            entity: 'PROFILES',
            entityId: id,
            details: `Changed role of ${profile.full_name} (${profile.email}) to ${new_role}`,
            req
        });

        res.json({
            success: true,
            message: `Role changed to ${new_role} for ${profile.full_name}`,
            data: profile
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/master/audit-logs
 */
router.get('/audit-logs', async (req, res, next) => {
    try {
        const result = await query(`
            SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
