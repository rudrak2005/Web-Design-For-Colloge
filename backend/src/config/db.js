const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    ...(connectionString ? { connectionString } : {}),
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
    console.error('Unexpected database client error on idle client:', err.message);
});

function assertDatabaseConfigured() {
    if (!connectionString) {
        throw new Error('DATABASE_URL is not configured. Set it to the Supabase PostgreSQL connection string; do not use the Supabase API secret key.');
    }
}

/**
 * Initialize PostgreSQL tables if they don't exist yet
 */
async function initDb() {
    assertDatabaseConfigured();
    const client = await pool.connect();
    try {
        console.log('🔄 Initializing Database schema on Supabase PostgreSQL...');

        await client.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'master')),
                avatar_url TEXT,
                phone TEXT,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS departments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                hod_name TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS faculty (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                employee_id TEXT UNIQUE NOT NULL,
                department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
                designation TEXT NOT NULL DEFAULT 'Assistant Professor',
                specialization TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS students (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                roll_number TEXT UNIQUE NOT NULL,
                department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
                semester INT NOT NULL DEFAULT 1,
                batch_year INT NOT NULL DEFAULT 2024,
                cgpa NUMERIC(4,2) DEFAULT 8.00,
                attendance_pct NUMERIC(5,2) DEFAULT 85.00,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
                semester INT NOT NULL DEFAULT 3,
                credits INT NOT NULL DEFAULT 4,
                description TEXT,
                faculty_name TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS attendance (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
                remarks TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (course_id, student_id, date)
            );

            CREATE TABLE IF NOT EXISTS marks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                assessment_name TEXT NOT NULL,
                max_marks NUMERIC(5,2) NOT NULL DEFAULT 100.00,
                obtained_marks NUMERIC(5,2) NOT NULL,
                updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
                remarks TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS assignments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                due_date TIMESTAMPTZ NOT NULL,
                max_points INT NOT NULL DEFAULT 100,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS submissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                content TEXT,
                file_url TEXT,
                status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
                grade NUMERIC(5,2),
                feedback TEXT,
                submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (assignment_id, student_id)
            );

            CREATE TABLE IF NOT EXISTS announcements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                audience TEXT NOT NULL CHECK (audience IN ('all', 'students', 'faculty', 'course')),
                course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
                priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
                created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                actor_name TEXT,
                actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
                action TEXT NOT NULL,
                entity TEXT NOT NULL,
                entity_id TEXT,
                details JSONB,
                ip_address TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // Seed default departments if none
        const deptCheck = await client.query('SELECT COUNT(*) FROM departments');
        if (parseInt(deptCheck.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO departments (code, name, hod_name) VALUES
                ('CSE', 'Computer Science & Engineering', 'Dr. Rajesh Sharma'),
                ('ECE', 'Electronics & Communication', 'Dr. Sunita Rao'),
                ('MECH', 'Mechanical Engineering', 'Dr. Arvind Verma');
            `);
        }

        // Seed default courses if none
        const courseCheck = await client.query('SELECT COUNT(*) FROM courses');
        if (parseInt(courseCheck.rows[0].count) === 0) {
            const cseDept = (await client.query("SELECT id FROM departments WHERE code = 'CSE' LIMIT 1")).rows[0]?.id;
            await client.query(`
                INSERT INTO courses (code, title, department_id, semester, credits, faculty_name) VALUES
                ('CS301', 'Data Structures & Algorithms', $1, 3, 4, 'Prof. Vikram Sen'),
                ('CS302', 'Database Management Systems', $1, 3, 4, 'Prof. Ananya Roy'),
                ('CS303', 'Operating Systems', $1, 3, 3, 'Prof. Vikram Sen'),
                ('CS304', 'Computer Networks', $1, 3, 4, 'Dr. Rajesh Sharma'),
                ('CS305', 'Software Engineering & Agile', $1, 3, 3, 'Prof. Vikram Sen');
            `, [cseDept]);
        }

        // Seed default initial Master / HOD if not exists
        const masterCheck = await client.query("SELECT id FROM profiles WHERE email = 'hod@bitcampus.com'");
        if (masterCheck.rows.length === 0) {
            const masterPassHash = await bcrypt.hash('master123', 10);
            await client.query(`
                INSERT INTO profiles (email, password_hash, full_name, role, status)
                VALUES ('hod@bitcampus.com', $1, 'Dr. Rajesh Sharma', 'master', 'active');
            `, [masterPassHash]);
            console.log('✅ Default Master / HOD account seeded: hod@bitcampus.com / master123');
        }

        // Seed default initial Faculty if not exists
        const facCheck = await client.query("SELECT id FROM profiles WHERE email = 'faculty@bitcampus.com'");
        if (facCheck.rows.length === 0) {
            const facPassHash = await bcrypt.hash('faculty123', 10);
            const facProf = await client.query(`
                INSERT INTO profiles (email, password_hash, full_name, role, status)
                VALUES ('faculty@bitcampus.com', $1, 'Prof. Vikram Sen', 'faculty', 'active')
                RETURNING id;
            `, [facPassHash]);

            const cseDept = (await client.query("SELECT id FROM departments WHERE code = 'CSE' LIMIT 1")).rows[0]?.id;
            await client.query(`
                INSERT INTO faculty (profile_id, employee_id, department_id, designation, specialization)
                VALUES ($1, 'FAC-CSE-101', $2, 'Associate Professor', 'Data Structures & Algorithms');
            `, [facProf.rows[0].id, cseDept]);
            console.log('✅ Default Faculty account seeded: faculty@bitcampus.com / faculty123');
        }

        // Seed default initial Student if not exists
        const studCheck = await client.query("SELECT id FROM profiles WHERE email = 'student@bitcampus.com'");
        if (studCheck.rows.length === 0) {
            const studPassHash = await bcrypt.hash('123456', 10);
            const studProf = await client.query(`
                INSERT INTO profiles (email, password_hash, full_name, role, status)
                VALUES ('student@bitcampus.com', $1, 'Rudraksh Kumar', 'student', 'active')
                RETURNING id;
            `, [studPassHash]);

            const cseDept = (await client.query("SELECT id FROM departments WHERE code = 'CSE' LIMIT 1")).rows[0]?.id;
            await client.query(`
                INSERT INTO students (profile_id, roll_number, department_id, semester, batch_year, cgpa, attendance_pct)
                VALUES ($1, 'BIT-2023-CS-042', $2, 3, 2023, 8.40, 86.50);
            `, [studProf.rows[0].id, cseDept]);
            console.log('✅ Default Student account seeded: student@bitcampus.com / 123456');
        }

        console.log('✅ Database schema and records initialized successfully on Supabase PostgreSQL!');
    } finally {
        client.release();
    }
}

function query(text, params) {
    assertDatabaseConfigured();
    return pool.query(text, params);
}

module.exports = {
    pool,
    query,
    isDatabaseConfigured: Boolean(connectionString),
    initDb
};
