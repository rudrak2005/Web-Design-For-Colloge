const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const authenticate = require('../middleware/authenticate');
const authorizeRole = require('../middleware/authorizeRole');
const { logAuditAction } = require('../middleware/auditLogger');

// All faculty routes require authentication and role faculty or master
router.use(authenticate, authorizeRole('faculty', 'master'));

/**
 * Helper to get faculty record id for currently authenticated profile
 */
async function getFacultyForUser(profileId) {
    const res = await query(`
        SELECT f.id, f.employee_id, f.designation, f.specialization, f.department_id,
               d.name as department_name, d.code as department_code
        FROM faculty f
        LEFT JOIN departments d ON f.department_id = d.id
        WHERE f.profile_id = $1
        LIMIT 1;
    `, [profileId]);
    return res.rows[0] || null;
}

/**
 * GET /api/faculty/profile
 */
router.get('/profile', async (req, res, next) => {
    try {
        const fac = await getFacultyForUser(req.user.id);
        res.json({
            success: true,
            data: {
                full_name: req.user.full_name,
                email: req.user.email,
                employee_id: fac ? fac.employee_id : 'FAC-CSE-101',
                department: fac ? fac.department_name : 'Computer Science & Engineering',
                department_code: fac ? fac.department_code : 'CSE',
                designation: fac ? fac.designation : 'Associate Professor',
                specialization: fac ? fac.specialization : 'Computer Science'
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/courses
 * Return all active courses with live enrolled student counts and pending assignments
 */
router.get('/courses', async (req, res, next) => {
    try {
        const coursesRes = await query(`
            SELECT 
                c.id, c.code, c.title, c.credits, c.semester, c.faculty_name, c.description,
                (SELECT COUNT(*) FROM students) as enrolled_students,
                (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) as pending_assignments
            FROM courses c
            ORDER BY c.code ASC;
        `);

        res.json({
            success: true,
            count: coursesRes.rows.length,
            data: coursesRes.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/courses/:courseId/students
 * Return real students roster for this course
 */
router.get('/courses/:courseId/students', async (req, res, next) => {
    try {
        const studentsRes = await query(`
            SELECT 
                s.id, s.roll_number, p.full_name, p.email, s.semester, s.cgpa, s.attendance_pct,
                d.name as department_name
            FROM students s
            JOIN profiles p ON s.profile_id = p.id
            LEFT JOIN departments d ON s.department_id = d.id
            ORDER BY s.roll_number ASC;
        `);

        res.json({
            success: true,
            count: studentsRes.rows.length,
            data: studentsRes.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/courses/:courseId/attendance
 */
router.get('/courses/:courseId/attendance', async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const result = await query(`
            SELECT a.*, s.roll_number, p.full_name as student_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN profiles p ON s.profile_id = p.id
            WHERE a.course_id = $1
            ORDER BY a.date DESC, s.roll_number ASC;
        `, [courseId]);

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
 * POST /api/faculty/courses/:courseId/attendance
 * Bulk save attendance for a class date and automatically update student attendance percentages
 */
router.post('/courses/:courseId/attendance', async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { date, attendanceList } = req.body;

        if (!date || !Array.isArray(attendanceList) || attendanceList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Class date and attendance list are required.'
            });
        }

        const fac = await getFacultyForUser(req.user.id);
        const facultyId = fac ? fac.id : null;

        for (const item of attendanceList) {
            if (!item.student_id) continue;

            // Upsert attendance record
            await query(`
                INSERT INTO attendance (course_id, student_id, faculty_id, date, status, remarks)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (course_id, student_id, date)
                DO UPDATE SET 
                    status = EXCLUDED.status,
                    remarks = EXCLUDED.remarks,
                    faculty_id = COALESCE(EXCLUDED.faculty_id, attendance.faculty_id),
                    created_at = NOW();
            `, [courseId, item.student_id, facultyId, date, item.status || 'present', item.remarks || '']);

            // Recalculate live overall attendance percentage for this student
            const statsRes = await query(`
                SELECT 
                    COUNT(*) as total_classes,
                    COUNT(*) FILTER (WHERE status = 'present') as present_classes,
                    COUNT(*) FILTER (WHERE status = 'late') as late_classes
                FROM attendance
                WHERE student_id = $1;
            `, [item.student_id]);

            const total = parseInt(statsRes.rows[0].total_classes, 10);
            const present = parseInt(statsRes.rows[0].present_classes, 10);
            const late = parseInt(statsRes.rows[0].late_classes, 10);

            if (total > 0) {
                const calculatedPct = Number(((present + (late * 0.5)) / total * 100).toFixed(2));
                await query('UPDATE students SET attendance_pct = $1 WHERE id = $2', [calculatedPct, item.student_id]);
            }
        }

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'RECORD_ATTENDANCE',
            entity: 'ATTENDANCE',
            entityId: courseId,
            details: `Recorded attendance for ${attendanceList.length} students on date ${date}`,
            req
        });

        res.json({
            success: true,
            message: `Attendance for ${attendanceList.length} students recorded and synced to database!`,
            count: attendanceList.length
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/courses/:courseId/marks
 */
router.get('/courses/:courseId/marks', async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const result = await query(`
            SELECT m.*, s.roll_number, p.full_name as student_name
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN profiles p ON s.profile_id = p.id
            WHERE m.course_id = $1
            ORDER BY m.created_at DESC, s.roll_number ASC;
        `, [courseId]);

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
 * POST /api/faculty/courses/:courseId/marks
 * Add or update marks for an assessment
 */
router.post('/courses/:courseId/marks', async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { marksList, assessment } = req.body;

        if (!assessment || !Array.isArray(marksList) || marksList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Assessment title and marks list are required.'
            });
        }

        for (const item of marksList) {
            if (!item.student_id) continue;

            const maxMarks = Number(item.max_marks || 100);
            const obtained = Number(item.obtained_marks || 0);

            // Check if record exists
            const check = await query(`
                SELECT id FROM marks 
                WHERE course_id = $1 AND student_id = $2 AND assessment_name = $3
                LIMIT 1;
            `, [courseId, item.student_id, assessment]);

            if (check.rows.length > 0) {
                await query(`
                    UPDATE marks 
                    SET obtained_marks = $1, max_marks = $2, remarks = $3, updated_by = $4
                    WHERE id = $5;
                `, [obtained, maxMarks, item.remarks || 'Graded by Faculty', req.user.id, check.rows[0].id]);
            } else {
                await query(`
                    INSERT INTO marks (course_id, student_id, assessment_name, max_marks, obtained_marks, remarks, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `, [courseId, item.student_id, assessment, maxMarks, obtained, item.remarks || 'Graded by Faculty', req.user.id]);
            }
        }

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'UPDATE_MARKS',
            entity: 'MARKS',
            entityId: courseId,
            details: `Entered marks for assessment: '${assessment}' (${marksList.length} students)`,
            req
        });

        res.json({
            success: true,
            message: `Marks for assessment '${assessment}' successfully recorded and live on Student Portal!`,
            count: marksList.length
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/assignments
 */
router.get('/assignments', async (req, res, next) => {
    try {
        const result = await query(`
            SELECT 
                a.*,
                c.code as course_code,
                c.title as course_title,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submissions_count
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            ORDER BY a.created_at DESC;
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
 * POST /api/faculty/assignments
 */
router.post('/assignments', async (req, res, next) => {
    try {
        const { course_id, title, description, due_date, max_points } = req.body;

        if (!title || !due_date || !course_id) {
            return res.status(400).json({
                success: false,
                message: 'Course, assignment title, and due date are required.'
            });
        }

        const fac = await getFacultyForUser(req.user.id);
        const facultyId = fac ? fac.id : null;

        const result = await query(`
            INSERT INTO assignments (course_id, faculty_id, title, description, due_date, max_points)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [course_id, facultyId, title, description || '', due_date, Number(max_points) || 100]);

        const newAssignment = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'CREATE_ASSIGNMENT',
            entity: 'ASSIGNMENTS',
            entityId: newAssignment.id,
            details: `Created assignment: '${title}'`,
            req
        });

        res.status(201).json({
            success: true,
            message: 'Assignment created and published to students.',
            data: newAssignment
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/assignments/:id/submissions
 */
router.get('/assignments/:id/submissions', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                s.*,
                st.roll_number,
                p.full_name as student_name,
                p.email as student_email
            FROM submissions s
            JOIN students st ON s.student_id = st.id
            JOIN profiles p ON st.profile_id = p.id
            WHERE s.assignment_id = $1
            ORDER BY s.submitted_at DESC;
        `, [id]);

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
 * POST /api/faculty/submissions/:submissionId/grade
 */
router.post('/submissions/:submissionId/grade', async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const { grade, feedback } = req.body;

        const updateRes = await query(`
            UPDATE submissions 
            SET grade = $1, feedback = $2, status = 'graded'
            WHERE id = $3
            RETURNING *;
        `, [Number(grade), feedback || '', submissionId]);

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Submission record not found.' });
        }

        const sub = updateRes.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'GRADE_SUBMISSION',
            entity: 'SUBMISSIONS',
            entityId: submissionId,
            details: `Graded submission with score ${grade}`,
            req
        });

        res.json({
            success: true,
            message: 'Submission graded successfully! Student can now view their grade.',
            data: sub
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/faculty/announcements
 */
router.post('/announcements', async (req, res, next) => {
    try {
        const { title, content, priority, audience, course_id } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }

        const result = await query(`
            INSERT INTO announcements (title, content, audience, priority, course_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [
            title, 
            content, 
            audience || 'students', 
            priority || 'normal', 
            course_id || null, 
            req.user.id
        ]);

        const anc = result.rows[0];

        await logAuditAction({
            actorId: req.user.id,
            actorName: req.user.full_name,
            action: 'FACULTY_ANNOUNCEMENT',
            entity: 'ANNOUNCEMENTS',
            entityId: anc.id,
            details: `Posted announcement: '${title}'`,
            req
        });

        res.status(201).json({
            success: true,
            message: 'Announcement broadcasted successfully.',
            data: anc
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/faculty/notifications
 * Real faculty notifications: pending submissions to grade, attendance defaulters, broadcasts
 */
router.get('/notifications', async (req, res, next) => {
    try {
        const pendingSubsRes = await query(`
            SELECT s.id, s.submitted_at, a.title as assignment_title, p.full_name as student_name, st.roll_number
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN students st ON s.student_id = st.id
            JOIN profiles p ON st.profile_id = p.id
            WHERE s.status = 'submitted' OR s.grade IS NULL
            ORDER BY s.submitted_at DESC
            LIMIT 10;
        `);

        const defaultersRes = await query(`
            SELECT s.id, s.roll_number, p.full_name, s.attendance_pct
            FROM students s
            JOIN profiles p ON s.profile_id = p.id
            WHERE s.attendance_pct < 75.0
            ORDER BY s.attendance_pct ASC
            LIMIT 5;
        `);

        const notifications = [];

        // Build notifications list
        pendingSubsRes.rows.forEach(sub => {
            notifications.push({
                id: `notif-sub-${sub.id}`,
                type: 'submission',
                priority: 'normal',
                title: 'New Student Submission to Grade',
                message: `${sub.student_name} (${sub.roll_number}) submitted '${sub.assignment_title}'.`,
                time: sub.submitted_at
            });
        });

        defaultersRes.rows.forEach(def => {
            notifications.push({
                id: `notif-def-${def.id}`,
                type: 'defaulter',
                priority: 'urgent',
                title: 'Attendance Defaulter Warning',
                message: `${def.full_name} (${def.roll_number}) attendance dropped to ${def.attendance_pct}%. Action required.`,
                time: new Date().toISOString()
            });
        });

        // Add campus broadcast notices
        const noticesRes = await query(`
            SELECT id, title, content, priority, created_at
            FROM announcements
            WHERE audience IN ('all', 'faculty')
            ORDER BY created_at DESC
            LIMIT 3;
        `);

        noticesRes.rows.forEach(notice => {
            notifications.push({
                id: `notif-anc-${notice.id}`,
                type: 'announcement',
                priority: notice.priority,
                title: notice.title,
                message: notice.content,
                time: notice.created_at
            });
        });

        res.json({
            success: true,
            unread_count: notifications.length,
            notifications
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
