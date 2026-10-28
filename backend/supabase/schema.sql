-- ============================================================================
-- BITCAMPUS - COMPLETE SUPABASE POSTGRESQL SCHEMA & SEED SCRIPT
-- Role-based schema for: Student, Faculty, Master / HOD (Super Admin)
-- Run this in Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF NEEDED (Clean recreation)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS course_faculty CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. PROFILES TABLE (Linked with Supabase Auth or standalone user management)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'master')),
    avatar_url TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    hod_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FACULTY TABLE
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation TEXT NOT NULL DEFAULT 'Assistant Professor',
    specialization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. STUDENTS TABLE
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    semester INT NOT NULL DEFAULT 3,
    batch_year INT NOT NULL DEFAULT 2024,
    cgpa NUMERIC(3,2) DEFAULT 8.20,
    attendance_pct NUMERIC(5,2) DEFAULT 84.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. COURSES TABLE
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    semester INT NOT NULL DEFAULT 3,
    credits INT NOT NULL DEFAULT 4,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. COURSE_FACULTY (Mapping which faculty teaches which course)
CREATE TABLE course_faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, faculty_id, academic_year)
);

-- 9. ENROLLMENTS (Students enrolled in courses)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    semester INT NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

-- 10. ATTENDANCE (Course, student, date, status, recorded by faculty)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, student_id, date)
);

-- 11. MARKS / GRADES
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_name TEXT NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    obtained_marks NUMERIC(5,2) NOT NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ASSIGNMENTS
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_points INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SUBMISSIONS
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    grade NUMERIC(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);

-- 14. ANNOUNCEMENTS
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    audience TEXT NOT NULL CHECK (audience IN ('all', 'students', 'faculty', 'course')),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AUDIT LOGS (Master can review all critical system changes)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR FAST QUERYING
-- ============================================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_faculty_emp ON faculty(employee_id);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_attendance_lookup ON attendance(course_id, date);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role from auth.users or profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Master Role can do everything across all tables
CREATE POLICY "Master full access profiles" ON profiles FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access departments" ON departments FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access faculty" ON faculty FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access students" ON students FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access courses" ON courses FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access course_faculty" ON course_faculty FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access enrollments" ON enrollments FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access attendance" ON attendance FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access marks" ON marks FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access assignments" ON assignments FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access submissions" ON submissions FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access announcements" ON announcements FOR ALL USING (public.current_user_role() = 'master');
CREATE POLICY "Master full access audit_logs" ON audit_logs FOR ALL USING (public.current_user_role() = 'master');

-- General Read Policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR public.current_user_role() = 'master');
CREATE POLICY "Read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read courses" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read announcements" ON announcements FOR SELECT TO authenticated USING (true);

-- Student Policies
CREATE POLICY "Students can view own student record" ON students FOR SELECT USING (
    profile_id = auth.uid() OR public.current_user_role() IN ('faculty', 'master')
);
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()) OR public.current_user_role() IN ('faculty', 'master')
);
CREATE POLICY "Students can view own marks" ON marks FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()) OR public.current_user_role() IN ('faculty', 'master')
);
CREATE POLICY "Students can view assignments" ON assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can manage own submissions" ON submissions FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()) OR public.current_user_role() IN ('faculty', 'master')
);

-- Faculty Policies
CREATE POLICY "Faculty can update attendance" ON attendance FOR ALL USING (
    public.current_user_role() IN ('faculty', 'master')
);
CREATE POLICY "Faculty can manage marks" ON marks FOR ALL USING (
    public.current_user_role() IN ('faculty', 'master')
);
CREATE POLICY "Faculty can manage assignments" ON assignments FOR ALL USING (
    public.current_user_role() IN ('faculty', 'master')
);

-- ============================================================================
-- SEED INITIAL MOCK / STARTER DATA FOR DEMO & TESTING
-- ============================================================================

-- 1. Departments
INSERT INTO departments (id, code, name, hod_name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'CSE', 'Computer Science & Engineering', 'Dr. Rajesh Sharma'),
    ('22222222-2222-2222-2222-222222222222', 'ECE', 'Electronics & Communication', 'Dr. Sunita Rao'),
    ('33333333-3333-3333-3333-333333333333', 'MECH', 'Mechanical Engineering', 'Dr. Arvind Verma')
ON CONFLICT (code) DO NOTHING;

-- 2. Profiles (Master/HOD, Faculty, Student)
INSERT INTO profiles (id, email, full_name, role, phone, status) VALUES
    -- Master / HOD
    ('aaaa0000-0000-0000-0000-000000000001', 'hod@bitcampus.com', 'Dr. Rajesh Sharma', 'master', '+91 98765 43210', 'active'),
    -- Faculty 1
    ('bbbb0000-0000-0000-0000-000000000001', 'faculty@bitcampus.com', 'Prof. Vikram Sen', 'faculty', '+91 98765 12345', 'active'),
    -- Faculty 2
    ('bbbb0000-0000-0000-0000-000000000002', 'ananya@bitcampus.com', 'Prof. Ananya Roy', 'faculty', '+91 98765 54321', 'active'),
    -- Student 1
    ('cccc0000-0000-0000-0000-000000000001', 'student@bitcampus.com', 'Rudraksh Kumar', 'student', '+91 91234 56789', 'active'),
    -- Student 2
    ('cccc0000-0000-0000-0000-000000000002', 'priya@bitcampus.com', 'Priya Patel', 'student', '+91 91234 11223', 'active'),
    -- Student 3
    ('cccc0000-0000-0000-0000-000000000003', 'amit@bitcampus.com', 'Amit Verma', 'student', '+91 91234 44556', 'active')
ON CONFLICT (email) DO NOTHING;

-- 3. Faculty details
INSERT INTO faculty (id, profile_id, employee_id, department_id, designation, specialization) VALUES
    ('fab10000-0000-0000-0000-000000000001', 'bbbb0000-0000-0000-0000-000000000001', 'FAC-CSE-101', '11111111-1111-1111-1111-111111111111', 'Associate Professor', 'Data Structures & Algorithms'),
    ('fab20000-0000-0000-0000-000000000002', 'bbbb0000-0000-0000-0000-000000000002', 'FAC-CSE-102', '11111111-1111-1111-1111-111111111111', 'Assistant Professor', 'Database Systems & Cloud')
ON CONFLICT (employee_id) DO NOTHING;

-- 4. Students details
INSERT INTO students (id, profile_id, roll_number, department_id, semester, batch_year, cgpa, attendance_pct) VALUES
    ('st010000-0000-0000-0000-000000000001', 'cccc0000-0000-0000-0000-000000000001', 'BIT-2023-CS-042', '11111111-1111-1111-1111-111111111111', 3, 2023, 8.20, 84.50),
    ('st020000-0000-0000-0000-000000000002', 'cccc0000-0000-0000-0000-000000000002', 'BIT-2023-CS-015', '11111111-1111-1111-1111-111111111111', 3, 2023, 8.90, 92.00),
    ('st030000-0000-0000-0000-000000000003', 'cccc0000-0000-0000-0000-000000000003', 'BIT-2023-CS-028', '11111111-1111-1111-1111-111111111111', 3, 2023, 7.45, 68.00)
ON CONFLICT (roll_number) DO NOTHING;

-- 5. Courses
INSERT INTO courses (id, code, title, department_id, semester, credits, description) VALUES
    ('c1010000-0000-0000-0000-000000000001', 'CS301', 'Data Structures & Algorithms', '11111111-1111-1111-1111-111111111111', 3, 4, 'Core computer science algorithms and data structures.'),
    ('c1020000-0000-0000-0000-000000000002', 'CS302', 'Database Management Systems', '11111111-1111-1111-1111-111111111111', 3, 4, 'Relational databases, SQL, transactions and normalization.'),
    ('c1030000-0000-0000-0000-000000000003', 'CS303', 'Operating Systems', '11111111-1111-1111-1111-111111111111', 3, 3, 'Processes, memory virtualization, file systems, and threads.'),
    ('c1040000-0000-0000-0000-000000000004', 'CS304', 'Computer Networks', '11111111-1111-1111-1111-111111111111', 3, 4, 'OSI model, TCP/IP protocol stack, routing algorithms.'),
    ('c1050000-0000-0000-0000-000000000005', 'CS305', 'Software Engineering & Agile', '11111111-1111-1111-1111-111111111111', 3, 3, 'SDLC, Agile methodology, testing, and modern workflows.')
ON CONFLICT (code) DO NOTHING;

-- 6. Course Faculty Mapping
INSERT INTO course_faculty (course_id, faculty_id, academic_year) VALUES
    ('c1010000-0000-0000-0000-000000000001', 'fab10000-0000-0000-0000-000000000001', '2025-2026'),
    ('c1020000-0000-0000-0000-000000000002', 'fab20000-0000-0000-0000-000000000002', '2025-2026'),
    ('c1030000-0000-0000-0000-000000000003', 'fab10000-0000-0000-0000-000000000001', '2025-2026')
ON CONFLICT DO NOTHING;

-- 7. Enrollments
INSERT INTO enrollments (student_id, course_id, semester) VALUES
    ('st010000-0000-0000-0000-000000000001', 'c1010000-0000-0000-0000-000000000001', 3),
    ('st010000-0000-0000-0000-000000000001', 'c1020000-0000-0000-0000-000000000002', 3),
    ('st010000-0000-0000-0000-000000000001', 'c1030000-0000-0000-0000-000000000003', 3),
    ('st020000-0000-0000-0000-000000000002', 'c1010000-0000-0000-0000-000000000001', 3),
    ('st030000-0000-0000-0000-000000000003', 'c1010000-0000-0000-0000-000000000001', 3)
ON CONFLICT DO NOTHING;

-- 8. Sample Announcements
INSERT INTO announcements (title, content, audience, priority) VALUES
    ('Mid-Semester Examination Schedule Published', 'Mid-semester examinations will commence from Nov 15th. Check your timetable section.', 'all', 'high'),
    ('Faculty Meeting with Dean Academics', 'All faculty members are requested to join the curriculum review meeting in Conference Hall A.', 'faculty', 'normal'),
    ('Placement Drive: Google & Microsoft Registration Open', 'Eligible 3rd and 4th-year students can register before Oct 30 on the placement desk.', 'students', 'urgent');

-- 9. Sample Audit Log
INSERT INTO audit_logs (actor_id, action, entity, entity_id, details) VALUES
    ('aaaa0000-0000-0000-0000-000000000001', 'INITIAL_SYSTEM_SETUP', 'SYSTEM', 'ROOT', '{"version": "1.0.0", "message": "BitCampus Database Initialized with Role-Based Security"}'::jsonb);
