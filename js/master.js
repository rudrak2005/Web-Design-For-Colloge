/* ============================================================================
   BITCAMPUS MASTER / HOD COMMAND CENTER CONTROLLER
   Full Super Admin Authority: Students, Faculty, Departments, Courses, Defaulters, and Audits
============================================================================ */

// 1. Guard page strictly for 'master' role
if (!BitCampusAuth.requireRole('master')) {
    // Execution stops if unauthorized
}

// Global State
let allStudents = [];
let allFaculty = [];
let allDepartments = [];
let allCourses = [];

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');
const pageTitle = document.getElementById('pageTitle');
const globalAlert = document.getElementById('globalAlert');
const navButtons = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');

// Sidebar toggle for mobile
if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// Clock
function updateClock() {
    const now = new Date();
    if (clockTime) clockTime.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    if (clockDate) clockDate.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
updateClock();
setInterval(updateClock, 1000);

// Alert Notification
function showAlert(message, type = 'success', duration = 4000) {
    if (!globalAlert) return;
    globalAlert.textContent = message;
    globalAlert.className = `alert-box ${type}`;
    globalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
        globalAlert.style.display = 'none';
        globalAlert.className = 'alert-box';
    }, duration);
}

// Tab Switching
function masterSwitchTab(panelName) {
    panels.forEach(p => p.classList.remove('active'));
    navButtons.forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(`panel-${panelName}`);
    const targetNav = document.querySelector(`[data-panel="${panelName}"]`);

    if (targetPanel) targetPanel.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    const titles = {
        overview: 'Master Command Center',
        students: 'Student Records & Enrollment',
        faculty: 'Faculty Directory & Appointments',
        academics: 'Departments & Curriculum Hub',
        attendance: 'Attendance Defaulters & Cross-Dept Audit',
        broadcasts: 'Official Campus Broadcasts',
        audit: 'System Audit Trail & Security'
    };
    if (pageTitle) pageTitle.textContent = titles[panelName] || 'Master Portal';

    if (window.innerWidth <= 900 && sidebar) {
        sidebar.classList.remove('open');
    }
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (panel) masterSwitchTab(panel);
    });
});

// Generic Modal Management
const allModals = document.querySelectorAll('.modal-overlay');
const closeButtons = document.querySelectorAll('[data-close-modal], .modal-close');

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        allModals.forEach(m => m.classList.remove('open'));
    });
});

function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('open');
}

// Quick trigger buttons
document.getElementById('triggerAddStudentModal')?.addEventListener('click', () => openModal('addStudentModal'));
document.getElementById('openAddStudentBtn')?.addEventListener('click', () => openModal('addStudentModal'));

document.getElementById('triggerAddFacultyModal')?.addEventListener('click', () => openModal('addFacultyModal'));
document.getElementById('openAddFacultyBtn')?.addEventListener('click', () => openModal('addFacultyModal'));

document.getElementById('triggerAddDeptModal')?.addEventListener('click', () => openModal('addDeptModal'));
document.getElementById('openAddDeptBtn')?.addEventListener('click', () => openModal('addDeptModal'));

document.getElementById('triggerAddCourseModal')?.addEventListener('click', () => openModal('addCourseModal'));
document.getElementById('openAddCourseBtn')?.addEventListener('click', () => openModal('addCourseModal'));

// ============================================================================
// DATA INITIALIZATION
// ============================================================================
async function initMasterPortal() {
    try {
        const user = BitCampusAuth.getUser();
        if (user && user.full_name) {
            const adminNameDisplay = document.getElementById('adminNameDisplay');
            const welcomeGreeting = document.getElementById('welcomeGreeting');
            if (adminNameDisplay) adminNameDisplay.textContent = `${user.full_name} (HOD)`;
            if (welcomeGreeting) welcomeGreeting.textContent = `${user.full_name} — Campus Command`;
        }

        // 1. Stats
        await loadStats();

        // 2. Students
        await loadStudents();

        // 3. Faculty
        await loadFaculty();

        // 4. Academics (Depts & Courses)
        await loadAcademics();

        // 5. Attendance & Defaulters
        await loadAttendanceOverview();

        // 6. Broadcasts
        await loadBroadcasts();

        // 7. Audit Logs
        await loadAuditLogs();

    } catch (err) {
        console.error('Master Init Error:', err);
        showAlert('Could not initialize some master modules.', 'error');
    }
}

// 1. Stats
async function loadStats() {
    try {
        const res = await bitFetch('/api/master/stats');
        if (res && res.success) {
            const s = res.stats;
            document.getElementById('statTotalStudents').textContent = s.total_students;
            document.getElementById('statTotalFaculty').textContent = s.total_faculty;
            document.getElementById('statTotalCourses').textContent = s.total_courses;
            document.getElementById('statCampusAttendance').textContent = `${s.avg_campus_attendance}%`;
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// 2. Students Module
async function loadStudents(query = '', department = 'all', semester = 'all') {
    try {
        const url = `/api/master/students?query=${encodeURIComponent(query)}&department=${department}&semester=${semester}`;
        const res = await bitFetch(url);
        if (res && res.success) {
            allStudents = res.data || [];
            renderStudentsTable(allStudents);
            renderOverviewStudents(allStudents.slice(0, 5));
        }
    } catch (err) {
        console.error('Students load error:', err);
    }
}

function renderOverviewStudents(students) {
    const table = document.getElementById('overviewStudentsTable');
    if (!table) return;

    if (students.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found.</td></tr>';
        return;
    }

    table.innerHTML = students.map(s => `
        <tr>
            <td><strong>${s.roll_number}</strong></td>
            <td>${s.full_name}</td>
            <td>${s.department_code || s.department}</td>
            <td>Semester ${s.semester}</td>
            <td><strong>${s.cgpa || 8.0}</strong></td>
            <td><span class="status-badge ${s.attendance_pct < 75 ? 'defaulter' : 'active'}">${s.attendance_pct}%</span></td>
        </tr>
    `).join('');
}

function renderStudentsTable(students) {
    const table = document.getElementById('fullStudentsTable');
    if (!table) return;

    if (students.length === 0) {
        table.innerHTML = '<tr><td colspan="8" style="text-align: center;">No matching student records found.</td></tr>';
        return;
    }

    table.innerHTML = students.map(s => `
        <tr>
            <td><strong>${s.roll_number}</strong></td>
            <td>${s.full_name}</td>
            <td>${s.email}</td>
            <td>${s.department_code || 'CSE'}</td>
            <td>Sem ${s.semester}</td>
            <td><strong>${s.cgpa || 8.0}</strong></td>
            <td>
                <span class="status-badge ${s.attendance_pct < 75 ? 'defaulter' : 'active'}">
                    ${s.attendance_pct}%
                </span>
            </td>
            <td>
                <button class="btn-action" style="padding: 4px 8px; font-size: 11px;" onclick="openEditStudentModal('${s.id}', '${s.full_name}', ${s.semester}, ${s.cgpa}, ${s.attendance_pct})">✏️ Edit</button>
                <button class="btn-action" style="padding: 4px 8px; font-size: 11px; color: var(--ruby);" onclick="deleteStudent('${s.id}', '${s.full_name}')">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

// Student Search & Filter Listeners
const studentSearchInput = document.getElementById('studentSearchInput');
const studentDeptFilter = document.getElementById('studentDeptFilter');
const studentSemFilter = document.getElementById('studentSemFilter');

function triggerStudentFilter() {
    const q = studentSearchInput ? studentSearchInput.value.trim() : '';
    const d = studentDeptFilter ? studentDeptFilter.value : 'all';
    const s = studentSemFilter ? studentSemFilter.value : 'all';
    loadStudents(q, d, s);
}

if (studentSearchInput) studentSearchInput.addEventListener('input', triggerStudentFilter);
if (studentDeptFilter) studentDeptFilter.addEventListener('change', triggerStudentFilter);
if (studentSemFilter) studentSemFilter.addEventListener('change', triggerStudentFilter);

// Add Student Form
const addStudentForm = document.getElementById('addStudentForm');
if (addStudentForm) {
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const roll_number = document.getElementById('newRollNo').value.trim();
        const full_name = document.getElementById('newStudentName').value.trim();
        const email = document.getElementById('newStudentEmail').value.trim();
        const department = document.getElementById('newStudentDept').value;
        const semester = document.getElementById('newStudentSem').value;
        const cgpa = document.getElementById('newStudentCgpa').value;

        try {
            const res = await bitFetch('/api/master/students', {
                method: 'POST',
                body: JSON.stringify({ roll_number, full_name, email, department, semester, cgpa })
            });

            if (res && res.success) {
                showAlert(`Enrolled student ${full_name} (${roll_number}) successfully!`, 'success');
                document.getElementById('addStudentModal').classList.remove('open');
                addStudentForm.reset();
                await loadStudents();
                await loadStats();
            }
        } catch (err) {
            showAlert(err.message || 'Failed to enroll student.', 'error');
        }
    });
}

// Edit Student Modal
function openEditStudentModal(id, name, sem, cgpa, att) {
    document.getElementById('editStudentId').value = id;
    document.getElementById('editStudentName').value = name;
    document.getElementById('editStudentSem').value = sem;
    document.getElementById('editStudentCgpa').value = cgpa;
    document.getElementById('editStudentAtt').value = att;
    openModal('editStudentModal');
}

const editStudentForm = document.getElementById('editStudentForm');
if (editStudentForm) {
    editStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editStudentId').value;
        const full_name = document.getElementById('editStudentName').value.trim();
        const semester = document.getElementById('editStudentSem').value;
        const cgpa = document.getElementById('editStudentCgpa').value;
        const attendance_pct = document.getElementById('editStudentAtt').value;

        try {
            const res = await bitFetch(`/api/master/students/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ full_name, semester, cgpa, attendance_pct })
            });

            if (res && res.success) {
                showAlert('Student record updated successfully!', 'success');
                document.getElementById('editStudentModal').classList.remove('open');
                await loadStudents();
                await loadStats();
            }
        } catch (err) {
            showAlert(err.message || 'Error updating student.', 'error');
        }
    });
}

// Delete Student
async function deleteStudent(id, name) {
    if (!confirm(`Are you sure you want to permanently delete student ${name}? This action is audited.`)) {
        return;
    }

    try {
        const res = await bitFetch(`/api/master/students/${id}`, { method: 'DELETE' });
        if (res && res.success) {
            showAlert(`Student ${name} deleted.`, 'success');
            await loadStudents();
            await loadStats();
        }
    } catch (err) {
        showAlert(err.message || 'Could not delete student.', 'error');
    }
}

// 3. Faculty Module
async function loadFaculty() {
    try {
        const res = await bitFetch('/api/master/faculty');
        if (res && res.success) {
            allFaculty = res.data || [];
            renderFacultyTable(allFaculty);
        }
    } catch (err) {
        console.error('Faculty load error:', err);
    }
}

function renderFacultyTable(facultyList) {
    const table = document.getElementById('fullFacultyTable');
    if (!table) return;

    if (facultyList.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">No faculty members registered.</td></tr>';
        return;
    }

    table.innerHTML = facultyList.map(f => `
        <tr>
            <td><strong>${f.employee_id}</strong></td>
            <td>${f.full_name}</td>
            <td>${f.email}</td>
            <td>${f.department || 'CSE'}</td>
            <td>${f.designation}</td>
            <td>${f.specialization || 'Computer Science'}</td>
            <td>
                <span class="status-badge active">Active Staff</span>
            </td>
        </tr>
    `).join('');
}

const addFacultyForm = document.getElementById('addFacultyForm');
if (addFacultyForm) {
    addFacultyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const employee_id = document.getElementById('newFacId').value.trim();
        const full_name = document.getElementById('newFacName').value.trim();
        const email = document.getElementById('newFacEmail').value.trim();
        const department = document.getElementById('newFacDept').value;
        const designation = document.getElementById('newFacDesignation').value.trim();
        const specialization = document.getElementById('newFacSpec').value.trim();

        try {
            const res = await bitFetch('/api/master/faculty', {
                method: 'POST',
                body: JSON.stringify({ employee_id, full_name, email, department, designation, specialization })
            });

            if (res && res.success) {
                showAlert(`Faculty ${full_name} registered successfully!`, 'success');
                document.getElementById('addFacultyModal').classList.remove('open');
                addFacultyForm.reset();
                await loadFaculty();
                await loadStats();
            }
        } catch (err) {
            showAlert(err.message || 'Failed to add faculty.', 'error');
        }
    });
}

// 4. Academics Module (Depts & Courses)
async function loadAcademics() {
    try {
        // Load Depts
        const deptRes = await bitFetch('/api/master/departments');
        if (deptRes && deptRes.success) {
            allDepartments = deptRes.data || [];
            const dTable = document.getElementById('departmentsTable');
            if (dTable) {
                dTable.innerHTML = allDepartments.map(d => `
                    <tr>
                        <td><strong>${d.code}</strong></td>
                        <td>${d.name}</td>
                        <td><strong>${d.hod_name || 'Dr. Sharma'}</strong></td>
                    </tr>
                `).join('');
            }
        }

        // Load Courses
        const courseRes = await bitFetch('/api/master/courses');
        if (courseRes && courseRes.success) {
            allCourses = courseRes.data || [];
            const cTable = document.getElementById('coursesTable');
            if (cTable) {
                cTable.innerHTML = allCourses.map(c => `
                    <tr>
                        <td><strong>${c.code}</strong></td>
                        <td>${c.title}</td>
                        <td>Semester ${c.semester || 3}</td>
                        <td>${c.credits || 4} Credits</td>
                        <td><strong>${c.faculty_name || 'Prof. Vikram Sen'}</strong></td>
                        <td>
                            <button class="btn-action" style="padding: 4px 8px; font-size: 11px;" onclick="reassignCourseFaculty('${c.id}', '${c.code}')">Assign Instructor</button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Academics load error:', err);
    }
}

const addDeptForm = document.getElementById('addDeptForm');
if (addDeptForm) {
    addDeptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('newDeptCode').value.trim();
        const name = document.getElementById('newDeptName').value.trim();
        const hod_name = document.getElementById('newDeptHod').value.trim();

        try {
            const res = await bitFetch('/api/master/departments', {
                method: 'POST',
                body: JSON.stringify({ code, name, hod_name })
            });
            if (res && res.success) {
                showAlert(`Department ${code} created.`, 'success');
                document.getElementById('addDeptModal').classList.remove('open');
                addDeptForm.reset();
                await loadAcademics();
            }
        } catch (err) {
            showAlert(err.message || 'Error creating department.', 'error');
        }
    });
}

const addCourseForm = document.getElementById('addCourseForm');
if (addCourseForm) {
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('newCourseCode').value.trim();
        const title = document.getElementById('newCourseTitle').value.trim();
        const credits = document.getElementById('newCourseCredits').value;
        const semester = document.getElementById('newCourseSem').value;
        const faculty_name = document.getElementById('newCourseFaculty').value.trim();

        try {
            const res = await bitFetch('/api/master/courses', {
                method: 'POST',
                body: JSON.stringify({ code, title, credits, semester, faculty_name })
            });
            if (res && res.success) {
                showAlert(`Course ${code} created.`, 'success');
                document.getElementById('addCourseModal').classList.remove('open');
                addCourseForm.reset();
                await loadAcademics();
                await loadStats();
            }
        } catch (err) {
            showAlert(err.message || 'Error creating course.', 'error');
        }
    });
}

async function reassignCourseFaculty(courseId, code) {
    const profName = prompt(`Enter Faculty Name to assign for course ${code}:`, 'Prof. Vikram Sen');
    if (!profName) return;

    try {
        const res = await bitFetch('/api/master/courses/assign', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId, faculty_name: profName })
        });
        if (res && res.success) {
            showAlert(`Course ${code} assigned to ${profName}!`, 'success');
            await loadAcademics();
        }
    } catch (err) {
        showAlert(err.message || 'Could not assign faculty.', 'error');
    }
}

// 5. Attendance & Defaulters Module
async function loadAttendanceOverview() {
    try {
        const res = await bitFetch('/api/master/attendance/overview');
        if (res && res.success) {
            const defaulters = res.defaulters || [];
            const dBadge = document.getElementById('defaulterCountBadge');
            if (dBadge) dBadge.textContent = `${defaulters.length} Defaulters`;

            const dTable = document.getElementById('defaultersTable');
            if (dTable) {
                if (defaulters.length === 0) {
                    dTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--emerald);">✓ All students maintain above 75% attendance threshold.</td></tr>';
                } else {
                    dTable.innerHTML = defaulters.map(d => `
                        <tr>
                            <td><strong>${d.roll_number}</strong></td>
                            <td>${d.full_name}</td>
                            <td>${d.department_code || 'CSE'}</td>
                            <td>Semester ${d.semester}</td>
                            <td><span class="status-badge defaulter">${d.attendance_pct}%</span></td>
                            <td>
                                <button class="btn-action primary" style="padding: 4px 8px; font-size: 11px;" onclick="sendDefaulterNotice('${d.roll_number}', '${d.full_name}')">Send Notice</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }

            // Recent attendance table
            const recTable = document.getElementById('recentAttendanceTable');
            if (recTable) {
                const logs = res.recent_records || [];
                if (logs.length === 0) {
                    recTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent attendance records.</td></tr>';
                } else {
                    recTable.innerHTML = logs.map(l => `
                        <tr>
                            <td>${l.date}</td>
                            <td>${l.student_id}</td>
                            <td>${l.course_id}</td>
                            <td><span class="status-badge ${l.status === 'present' ? 'active' : 'defaulter'}">${l.status.toUpperCase()}</span></td>
                            <td>${l.remarks || 'Regular class session'}</td>
                        </tr>
                    `).join('');
                }
            }
        }
    } catch (err) {
        console.error('Defaulters load error:', err);
    }
}

function sendDefaulterNotice(roll, name) {
    showAlert(`Formal attendance deficit warning dispatched to ${name} (${roll}).`, 'success');
}

// 6. Broadcasts Module
async function loadBroadcasts() {
    try {
        const res = await bitFetch('/api/student/announcements');
        if (res && res.success) {
            const listElem = document.getElementById('masterNoticesList');
            if (!listElem) return;

            listElem.innerHTML = res.data.map(n => `
                <div style="background: var(--paper-light); border: 2px solid var(--border); padding: 16px; margin-bottom: 14px; box-shadow: 3px 3px 0 var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 16px; font-family: Georgia, serif;">${n.title}</strong>
                        <span class="status-badge ${n.priority === 'urgent' ? 'defaulter' : n.priority === 'high' ? 'pending' : 'active'}">
                            ${n.priority.toUpperCase()}
                        </span>
                    </div>
                    <p style="font-size: 13.5px; color: var(--ink); line-height: 1.45;">${n.content}</p>
                    <small style="color: var(--ink-light); display: block; margin-top: 8px;">
                        Audience: <strong>${n.audience.toUpperCase()}</strong> • Issued by College Administration
                    </small>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Broadcasts error:', err);
    }
}

const masterBroadcastForm = document.getElementById('masterBroadcastForm');
if (masterBroadcastForm) {
    masterBroadcastForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('broadcastTitle').value.trim();
        const audience = document.getElementById('broadcastAudience').value;
        const priority = document.getElementById('broadcastPriority').value;
        const content = document.getElementById('broadcastContent').value.trim();

        try {
            const res = await bitFetch('/api/master/announcements', {
                method: 'POST',
                body: JSON.stringify({ title, audience, priority, content })
            });

            if (res && res.success) {
                showAlert('Official campus notice published across all portals!', 'success');
                masterBroadcastForm.reset();
                await loadBroadcasts();
            }
        } catch (err) {
            showAlert(err.message || 'Error posting notice.', 'error');
        }
    });
}

// 7. Audit Trail Module
async function loadAuditLogs() {
    try {
        const res = await bitFetch('/api/master/audit-logs');
        if (res && res.success) {
            const table = document.getElementById('auditLogsTable');
            if (!table) return;

            const logs = res.data || [];
            if (logs.length === 0) {
                table.innerHTML = '<tr><td colspan="6" style="text-align: center;">No audit entries logged yet.</td></tr>';
                return;
            }

            table.innerHTML = logs.map(l => `
                <tr>
                    <td style="font-size: 12px; white-space: nowrap;">${new Date(l.timestamp).toLocaleString()}</td>
                    <td><strong>${l.actor || 'Administrator'}</strong></td>
                    <td><span class="status-badge active">${l.action}</span></td>
                    <td>${l.entity}</td>
                    <td style="max-width: 320px; word-break: break-all; font-size: 12.5px;">${l.details}</td>
                    <td style="font-size: 11.5px; color: var(--ink-light);">${l.ip_address || '127.0.0.1'}</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Audit logs error:', err);
    }
}

document.getElementById('refreshAuditBtn')?.addEventListener('click', async () => {
    await loadAuditLogs();
    showAlert('Audit logs refreshed.', 'success');
});

// Start Master Portal on load
document.addEventListener('DOMContentLoaded', initMasterPortal);
