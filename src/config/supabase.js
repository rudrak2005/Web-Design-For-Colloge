const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

const isConfigured = 
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('your-project-ref') &&
    supabaseAnonKey && 
    !supabaseAnonKey.includes('your-supabase-anon');

let supabaseClient = null;
let supabaseAdminClient = null;

if (isConfigured) {
    try {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        if (supabaseServiceKey && !supabaseServiceKey.includes('your-supabase-service')) {
            supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
        } else {
            supabaseAdminClient = supabaseClient;
        }
        console.log('✅ [Supabase] Connected successfully to Cloud PostgreSQL:', supabaseUrl);
    } catch (err) {
        console.error('⚠️ [Supabase] Connection error:', err.message);
    }
} else {
    console.log('ℹ️ [Supabase] Notice: Real Supabase credentials not set in .env yet.');
    console.log('ℹ️ [Supabase] Using In-Memory Campus Data Store for seamless local preview.');
}

// In-Memory Data Store (Starter Data for Demo / Development when Supabase .env is pending)
const memoryStore = {
    profiles: [
        {
            id: 'aaaa0000-0000-0000-0000-000000000001',
            email: 'hod@bitcampus.com',
            full_name: 'Dr. Rajesh Sharma',
            role: 'master',
            phone: '+91 98765 43210',
            status: 'active'
        },
        {
            id: 'bbbb0000-0000-0000-0000-000000000001',
            email: 'faculty@bitcampus.com',
            full_name: 'Prof. Vikram Sen',
            role: 'faculty',
            phone: '+91 98765 12345',
            status: 'active'
        },
        {
            id: 'cccc0000-0000-0000-0000-000000000001',
            email: 'student@bitcampus.com',
            full_name: 'Rudraksh Kumar',
            role: 'student',
            phone: '+91 91234 56789',
            status: 'active'
        },
        {
            id: 'cccc0000-0000-0000-0000-000000000002',
            email: 'priya@bitcampus.com',
            full_name: 'Priya Patel',
            role: 'student',
            phone: '+91 91234 11223',
            status: 'active'
        },
        {
            id: 'cccc0000-0000-0000-0000-000000000003',
            email: 'amit@bitcampus.com',
            full_name: 'Amit Verma',
            role: 'student',
            phone: '+91 91234 44556',
            status: 'active'
        }
    ],
    students: [
        {
            id: 'st010000-0000-0000-0000-000000000001',
            profile_id: 'cccc0000-0000-0000-0000-000000000001',
            roll_number: 'BIT-2023-CS-042',
            full_name: 'Rudraksh Kumar',
            email: 'student@bitcampus.com',
            department: 'Computer Science & Engineering',
            department_code: 'CSE',
            semester: 3,
            cgpa: 8.20,
            attendance_pct: 84.5
        },
        {
            id: 'st020000-0000-0000-0000-000000000002',
            profile_id: 'cccc0000-0000-0000-0000-000000000002',
            roll_number: 'BIT-2023-CS-015',
            full_name: 'Priya Patel',
            email: 'priya@bitcampus.com',
            department: 'Computer Science & Engineering',
            department_code: 'CSE',
            semester: 3,
            cgpa: 8.90,
            attendance_pct: 92.0
        },
        {
            id: 'st030000-0000-0000-0000-000000000003',
            profile_id: 'cccc0000-0000-0000-0000-000000000003',
            roll_number: 'BIT-2023-CS-028',
            full_name: 'Amit Verma',
            email: 'amit@bitcampus.com',
            department: 'Computer Science & Engineering',
            department_code: 'CSE',
            semester: 3,
            cgpa: 7.45,
            attendance_pct: 68.0
        }
    ],
    faculty: [
        {
            id: 'fab10000-0000-0000-0000-000000000001',
            profile_id: 'bbbb0000-0000-0000-0000-000000000001',
            employee_id: 'FAC-CSE-101',
            full_name: 'Prof. Vikram Sen',
            email: 'faculty@bitcampus.com',
            department: 'Computer Science & Engineering',
            department_code: 'CSE',
            designation: 'Associate Professor',
            specialization: 'Data Structures & Algorithms'
        }
    ],
    departments: [
        { id: '11111111-1111-1111-1111-111111111111', code: 'CSE', name: 'Computer Science & Engineering', hod_name: 'Dr. Rajesh Sharma' },
        { id: '22222222-2222-2222-2222-222222222222', code: 'ECE', name: 'Electronics & Communication', hod_name: 'Dr. Sunita Rao' },
        { id: '33333333-3333-3333-3333-333333333333', code: 'MECH', name: 'Mechanical Engineering', hod_name: 'Dr. Arvind Verma' }
    ],
    courses: [
        { id: 'c1010000-0000-0000-0000-000000000001', code: 'CS301', title: 'Data Structures & Algorithms', credits: 4, semester: 3, faculty_name: 'Prof. Vikram Sen' },
        { id: 'c1020000-0000-0000-0000-000000000002', code: 'CS302', title: 'Database Management Systems', credits: 4, semester: 3, faculty_name: 'Prof. Ananya Roy' },
        { id: 'c1030000-0000-0000-0000-000000000003', code: 'CS303', title: 'Operating Systems', credits: 3, semester: 3, faculty_name: 'Prof. Vikram Sen' },
        { id: 'c1040000-0000-0000-0000-000000000004', code: 'CS304', title: 'Computer Networks', credits: 4, semester: 3, faculty_name: 'Dr. Rajesh Sharma' },
        { id: 'c1050000-0000-0000-0000-000000000005', code: 'CS305', title: 'Software Engineering', credits: 3, semester: 3, faculty_name: 'Prof. Vikram Sen' }
    ],
    attendanceRecords: [
        { id: 'att-1', course_id: 'c1010000-0000-0000-0000-000000000001', student_id: 'st010000-0000-0000-0000-000000000001', date: '2026-10-25', status: 'present', remarks: 'Active in class' },
        { id: 'att-2', course_id: 'c1010000-0000-0000-0000-000000000001', student_id: 'st020000-0000-0000-0000-000000000002', date: '2026-10-25', status: 'present', remarks: '' },
        { id: 'att-3', course_id: 'c1010000-0000-0000-0000-000000000001', student_id: 'st030000-0000-0000-0000-000000000003', date: '2026-10-25', status: 'absent', remarks: 'Uninformed leave' }
    ],
    marksRecords: [
        { id: 'mk-1', course_id: 'c1010000-0000-0000-0000-000000000001', course_name: 'Data Structures', student_id: 'st010000-0000-0000-0000-000000000001', assessment: 'Mid-Term Exam', max_marks: 100, obtained_marks: 88, remarks: 'Excellent performance' },
        { id: 'mk-2', course_id: 'c1020000-0000-0000-0000-000000000002', course_name: 'Database Systems', student_id: 'st010000-0000-0000-0000-000000000001', assessment: 'Mid-Term Exam', max_marks: 100, obtained_marks: 82, remarks: 'Good work on SQL' },
        { id: 'mk-3', course_id: 'c1030000-0000-0000-0000-000000000003', course_name: 'Operating Systems', student_id: 'st010000-0000-0000-0000-000000000001', assessment: 'Quiz 1', max_marks: 25, obtained_marks: 22, remarks: 'Solid concepts' },
        { id: 'mk-4', course_id: 'c1010000-0000-0000-0000-000000000001', course_name: 'Data Structures', student_id: 'st020000-0000-0000-0000-000000000002', assessment: 'Mid-Term Exam', max_marks: 100, obtained_marks: 95, remarks: 'Outstanding' },
        { id: 'mk-5', course_id: 'c1010000-0000-0000-0000-000000000001', course_name: 'Data Structures', student_id: 'st030000-0000-0000-0000-000000000003', assessment: 'Mid-Term Exam', max_marks: 100, obtained_marks: 64, remarks: 'Needs improvement' }
    ],
    assignments: [
        { id: 'asg-1', course_id: 'c1010000-0000-0000-0000-000000000001', course_code: 'CS301', course_title: 'Data Structures', faculty_id: 'fab10000-0000-0000-0000-000000000001', title: 'Binary Search Trees & AVL Trees Implementation', description: 'Implement AVL self-balancing tree insertion and deletion in C++ or Java with time complexity analysis.', due_date: '2026-11-05T23:59:00Z', max_points: 100, submissions_count: 2 },
        { id: 'asg-2', course_id: 'c1020000-0000-0000-0000-000000000002', course_code: 'CS302', course_title: 'Database Management Systems', faculty_id: 'fab10000-0000-0000-0000-000000000001', title: 'Relational Algebra and Complex SQL Queries', description: 'Solve the 15 queries covering nested joins, subqueries, and window functions.', due_date: '2026-11-10T23:59:00Z', max_points: 50, submissions_count: 1 }
    ],
    submissions: [
        { id: 'sub-1', assignment_id: 'asg-1', student_id: 'st010000-0000-0000-0000-000000000001', student_name: 'Rudraksh Kumar', roll_number: 'BIT-2023-CS-042', content: 'Github repo submitted: https://github.com/rudraksh/avl-trees-cpp', status: 'graded', grade: 96, feedback: 'Clean code and correct rotation logic!', submitted_at: '2026-10-24T14:30:00Z' },
        { id: 'sub-2', assignment_id: 'asg-1', student_id: 'st020000-0000-0000-0000-000000000002', student_name: 'Priya Patel', roll_number: 'BIT-2023-CS-015', content: 'Completed implementation with test suites.', status: 'submitted', grade: null, feedback: '', submitted_at: '2026-10-25T11:20:00Z' }
    ],
    announcements: [
        { id: 'anc-1', title: 'Mid-Semester Examination Schedule Published', content: 'Mid-semester examinations will commence from Nov 15th. Check your timetable section.', audience: 'all', priority: 'high', created_at: new Date().toISOString() },
        { id: 'anc-2', title: 'Department Faculty Meeting with HOD', content: 'All CSE faculty members are requested to attend curriculum review in Hall A.', audience: 'faculty', priority: 'normal', created_at: new Date().toISOString() },
        { id: 'anc-3', title: 'Placement Drive: Google & Microsoft Registration Open', content: 'Eligible 3rd and 4th-year students can register before Oct 30 on the placement desk.', audience: 'students', priority: 'urgent', created_at: new Date().toISOString() }
    ],
    auditLogs: [
        { id: 'aud-1', actor: 'Dr. Rajesh Sharma (HOD)', action: 'SYSTEM_BOOTSTRAP', entity: 'PORTAL', details: 'BitCampus System Initialized with Role-based Access Control', timestamp: new Date().toISOString() }
    ]
};

module.exports = {
    supabaseClient,
    supabaseAdminClient,
    isConfigured,
    memoryStore
};
