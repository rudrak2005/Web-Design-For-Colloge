/* ============================================================================
   BITCAMPUS FACULTY PORTAL JAVASCRIPT CONTROLLER
   Full dynamic interaction for Attendance, Marks, Assignments, and Notices
============================================================================ */

// 1. Guard page for 'faculty' (or 'master') role
if (!BitCampusAuth.requireRole('faculty')) {
    // Execution stops if unauthorized
}

// Global State
let facultyCourses = [];
let enrolledStudents = [];
let facultyAssignments = [];
let allSubmissions = [];

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');
const pageTitle = document.getElementById('pageTitle');
const globalAlert = document.getElementById('globalAlert');
const navButtons = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');

// Sidebar toggle for mobile devices
if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// Clock updater
function updateClock() {
    const now = new Date();
    if (clockTime) {
        clockTime.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
    if (clockDate) {
        clockDate.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
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
function facultySwitchTab(panelName) {
    panels.forEach(p => p.classList.remove('active'));
    navButtons.forEach(b => b.classList.remove('active'));

    const targetPanel = document.getElementById(`panel-${panelName}`);
    const targetNav = document.querySelector(`[data-panel="${panelName}"]`);

    if (targetPanel) targetPanel.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    // Title update
    const titles = {
        overview: 'Faculty Workspace',
        courses: 'My Assigned Courses',
        attendance: 'Take Class Attendance',
        marks: 'Academic Marks & Evaluation',
        assignments: 'Assignments & Submissions',
        announcements: 'Campus Notices',
        notifications: 'Faculty Notifications & Action Items'
    };
    if (pageTitle) pageTitle.textContent = titles[panelName] || 'Faculty Portal';

    if (window.innerWidth <= 900 && sidebar) {
        sidebar.classList.remove('open');
    }
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (panel) facultySwitchTab(panel);
    });
});

// ============================================================================
// DATA LOADING
// ============================================================================
async function initFacultyPortal() {
    try {
        const user = BitCampusAuth.getUser();
        if (user && user.full_name) {
            const facultyNameDisplay = document.getElementById('facultyNameDisplay');
            const welcomeGreeting = document.getElementById('welcomeGreeting');
            if (facultyNameDisplay) facultyNameDisplay.textContent = user.full_name;
            if (welcomeGreeting) welcomeGreeting.textContent = `Welcome, ${user.full_name}`;
        }

        // Set default date for attendance
        const attDatePicker = document.getElementById('attDatePicker');
        if (attDatePicker) {
            attDatePicker.value = new Date().toISOString().split('T')[0];
        }

        // 1. Fetch Courses
        await loadCourses();

        // 2. Fetch Assignments & Submissions
        await loadAssignments();

        // 3. Fetch Announcements
        await loadAnnouncements();

        // 4. Fetch Faculty Notifications & Action Items
        await loadFacultyNotifications();

    } catch (err) {
        console.error('Initialization error:', err);
        showAlert('Could not load some portal data. Please refresh.', 'error');
    }
}

async function loadCourses() {
    try {
        const res = await bitFetch('/api/faculty/courses');
        if (res && res.success) {
            facultyCourses = res.data || [];
            renderCoursesTables(facultyCourses);
            populateCourseSelects(facultyCourses);

            // Update stats
            const statCoursesCount = document.getElementById('statCoursesCount');
            if (statCoursesCount) statCoursesCount.textContent = facultyCourses.length;

            if (facultyCourses.length > 0) {
                await loadStudentsForCourse(facultyCourses[0].id);
            }
        }
    } catch (err) {
        console.error('Courses fetch error:', err);
    }
}

function renderCoursesTables(courses) {
    const overviewTable = document.getElementById('overviewCoursesTable');
    const fullTable = document.getElementById('fullCoursesTable');

    if (courses.length === 0) {
        if (overviewTable) overviewTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">No courses assigned yet.</td></tr>';
        if (fullTable) fullTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">No courses found.</td></tr>';
        return;
    }

    const rows = courses.map(c => `
        <tr>
            <td><strong>${c.code}</strong></td>
            <td>${c.title}</td>
            <td>${c.credits || 4}</td>
            <td>Sem ${c.semester || 3}</td>
            <td><span class="status-badge present">${c.enrolled_students || 3} Enrolled</span></td>
            <td>
                <button class="btn-action" style="padding: 4px 8px; font-size: 11px;" onclick="selectCourseForAttendance('${c.id}')">📋 Take Attendance</button>
            </td>
        </tr>
    `).join('');

    if (overviewTable) overviewTable.innerHTML = rows;

    const fullRows = courses.map(c => `
        <tr>
            <td><strong>${c.code}</strong></td>
            <td><strong>${c.title}</strong></td>
            <td>Semester ${c.semester || 3}</td>
            <td>${c.credits || 4} Credits</td>
            <td>${c.enrolled_students || 3} Students</td>
            <td>
                <button class="btn-action primary" style="padding: 4px 10px; font-size: 11px;" onclick="selectCourseForAttendance('${c.id}')">Take Attendance</button>
                <button class="btn-action" style="padding: 4px 10px; font-size: 11px;" onclick="selectCourseForMarks('${c.id}')">Enter Marks</button>
            </td>
        </tr>
    `).join('');

    if (fullTable) fullTable.innerHTML = fullRows;
}

function populateCourseSelects(courses) {
    const attSelect = document.getElementById('attCourseSelect');
    const marksSelect = document.getElementById('marksCourseSelect');
    const asgSelect = document.getElementById('asgCourseSelect');

    const options = courses.map(c => `<option value="${c.id}">${c.code} — ${c.title}</option>`).join('');

    if (attSelect) {
        attSelect.innerHTML = options;
        attSelect.addEventListener('change', (e) => loadStudentsForCourse(e.target.value));
    }
    if (marksSelect) {
        marksSelect.innerHTML = options;
        marksSelect.addEventListener('change', (e) => loadStudentsForCourse(e.target.value));
    }
    if (asgSelect) {
        asgSelect.innerHTML = options;
    }
}

async function loadStudentsForCourse(courseId) {
    try {
        const res = await bitFetch(`/api/faculty/courses/${courseId}/students`);
        if (res && res.success) {
            enrolledStudents = res.data || [];
            renderAttendanceRoster(enrolledStudents);
            renderMarksRoster(enrolledStudents);

            const statStudentsCount = document.getElementById('statStudentsCount');
            if (statStudentsCount) statStudentsCount.textContent = enrolledStudents.length;
        }
    } catch (err) {
        console.error('Students fetch error:', err);
    }
}

// ============================================================================
// ATTENDANCE MODULE
// ============================================================================
function renderAttendanceRoster(students) {
    const table = document.getElementById('attendanceRosterTable');
    if (!table) return;

    if (students.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center;">No students enrolled in this course.</td></tr>';
        return;
    }

    table.innerHTML = students.map(s => `
        <tr data-student-id="${s.id}">
            <td><strong>${s.roll_number}</strong></td>
            <td>${s.full_name}</td>
            <td><strong>${s.attendance_pct || 85}%</strong></td>
            <td>
                <div class="attendance-pills" data-student-id="${s.id}">
                    <button type="button" class="attendance-pill p selected" data-status="present">Present</button>
                    <button type="button" class="attendance-pill a" data-status="absent">Absent</button>
                    <button type="button" class="attendance-pill l" data-status="late">Late</button>
                </div>
            </td>
            <td>
                <input type="text" class="student-att-remarks" placeholder="Optional remark..." style="padding: 4px 8px; font-size: 12px; width: 100%; border: 1px solid var(--border);">
            </td>
        </tr>
    `).join('');

    // Attach pill events
    const pillGroups = table.querySelectorAll('.attendance-pills');
    pillGroups.forEach(group => {
        const pills = group.querySelectorAll('.attendance-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
            });
        });
    });
}

// "Mark All Present" button
const markAllPresentBtn = document.getElementById('markAllPresentBtn');
if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener('click', () => {
        const pPills = document.querySelectorAll('.attendance-pill.p');
        pPills.forEach(p => {
            const group = p.closest('.attendance-pills');
            if (group) {
                group.querySelectorAll('.attendance-pill').forEach(pill => pill.classList.remove('selected'));
                p.classList.add('selected');
            }
        });
        showAlert('Marked all students as Present. Remember to click "Save Attendance"!', 'success');
    });
}

// Save Attendance
const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
if (saveAttendanceBtn) {
    saveAttendanceBtn.addEventListener('click', async () => {
        const courseId = document.getElementById('attCourseSelect').value;
        const date = document.getElementById('attDatePicker').value;

        if (!courseId || !date) {
            showAlert('Please select course and date.', 'error');
            return;
        }

        const rows = document.querySelectorAll('#attendanceRosterTable tr[data-student-id]');
        if (rows.length === 0) {
            showAlert('No students to save.', 'error');
            return;
        }

        const attendanceList = [];
        rows.forEach(row => {
            const studentId = row.dataset.studentId;
            const selectedPill = row.querySelector('.attendance-pill.selected');
            const status = selectedPill ? selectedPill.dataset.status : 'present';
            const remarks = row.querySelector('.student-att-remarks')?.value || '';

            attendanceList.push({
                student_id: studentId,
                status,
                remarks
            });
        });

        saveAttendanceBtn.disabled = true;
        saveAttendanceBtn.textContent = 'Saving...';

        try {
            const res = await bitFetch(`/api/faculty/courses/${courseId}/attendance`, {
                method: 'POST',
                body: JSON.stringify({ date, attendanceList })
            });

            if (res && res.success) {
                showAlert(res.message || 'Attendance saved to database successfully!', 'success');
            } else {
                showAlert(res.message || 'Failed to save attendance.', 'error');
            }
        } catch (err) {
            showAlert(err.message || 'Error saving attendance.', 'error');
        } finally {
            saveAttendanceBtn.disabled = false;
            saveAttendanceBtn.textContent = '💾 Save Attendance to Database';
        }
    });
}

function selectCourseForAttendance(courseId) {
    facultySwitchTab('attendance');
    const attSelect = document.getElementById('attCourseSelect');
    if (attSelect) {
        attSelect.value = courseId;
        loadStudentsForCourse(courseId);
    }
}

// ============================================================================
// MARKS MODULE
// ============================================================================
function renderMarksRoster(students) {
    const table = document.getElementById('marksRosterTable');
    if (!table) return;

    if (students.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center;">No students enrolled.</td></tr>';
        return;
    }

    const defaultMax = document.getElementById('maxMarksInput')?.value || 100;

    table.innerHTML = students.map((s, idx) => `
        <tr data-student-id="${s.id}">
            <td><strong>${s.roll_number}</strong></td>
            <td>${s.full_name}</td>
            <td class="cell-max-marks">${defaultMax}</td>
            <td>
                <input type="number" class="student-mark-input" value="${85 - idx * 4}" min="0" max="${defaultMax}" style="width: 80px; padding: 5px; font-weight: bold; border: 2px solid var(--border); text-align: center;">
            </td>
            <td>
                <input type="text" class="student-mark-remarks" value="Good performance" placeholder="Add feedback..." style="width: 100%; padding: 5px; border: 1px solid var(--border);">
            </td>
        </tr>
    `).join('');

    calculateMarksSummary();

    // Recalculate on any input change
    const markInputs = table.querySelectorAll('.student-mark-input');
    markInputs.forEach(input => input.addEventListener('input', calculateMarksSummary));
}

function calculateMarksSummary() {
    const inputs = document.querySelectorAll('.student-mark-input');
    const statsElem = document.getElementById('marksCalcStats');
    if (!statsElem || inputs.length === 0) return;

    let total = 0;
    let count = 0;
    let maxScored = 0;

    inputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val)) {
            total += val;
            count++;
            if (val > maxScored) maxScored = val;
        }
    });

    const avg = count > 0 ? (total / count).toFixed(1) : 0;
    statsElem.textContent = `Class Average: ${avg} / 100 | Highest: ${maxScored}`;
}

// Save Marks
const saveMarksBtn = document.getElementById('saveMarksBtn');
if (saveMarksBtn) {
    saveMarksBtn.addEventListener('click', async () => {
        const courseId = document.getElementById('marksCourseSelect').value;
        const assessment = document.getElementById('assessmentType').value.trim();
        const maxMarks = document.getElementById('maxMarksInput').value;

        if (!assessment) {
            showAlert('Please specify assessment title.', 'error');
            return;
        }

        const rows = document.querySelectorAll('#marksRosterTable tr[data-student-id]');
        const marksList = [];

        rows.forEach(row => {
            const studentId = row.dataset.studentId;
            const obtained = row.querySelector('.student-mark-input')?.value || 0;
            const remarks = row.querySelector('.student-mark-remarks')?.value || '';

            marksList.push({
                student_id: studentId,
                max_marks: maxMarks,
                obtained_marks: obtained,
                remarks
            });
        });

        saveMarksBtn.disabled = true;
        saveMarksBtn.textContent = 'Saving...';

        try {
            const res = await bitFetch(`/api/faculty/courses/${courseId}/marks`, {
                method: 'POST',
                body: JSON.stringify({ assessment, marksList })
            });

            if (res && res.success) {
                showAlert(res.message || 'Marks recorded successfully!', 'success');
            } else {
                showAlert(res.message || 'Failed to save marks.', 'error');
            }
        } catch (err) {
            showAlert(err.message || 'Error saving marks.', 'error');
        } finally {
            saveMarksBtn.disabled = false;
            saveMarksBtn.textContent = '💾 Save Marks Record';
        }
    });
}

function selectCourseForMarks(courseId) {
    facultySwitchTab('marks');
    const marksSelect = document.getElementById('marksCourseSelect');
    if (marksSelect) {
        marksSelect.value = courseId;
        loadStudentsForCourse(courseId);
    }
}

// ============================================================================
// ASSIGNMENTS & SUBMISSIONS MODULE
// ============================================================================
async function loadAssignments() {
    try {
        const res = await bitFetch('/api/faculty/assignments');
        if (res && res.success) {
            facultyAssignments = res.data || [];
            renderAssignmentsList(facultyAssignments);

            // Fetch submissions for all assignments
            allSubmissions = [];
            for (const asg of facultyAssignments) {
                const subRes = await bitFetch(`/api/faculty/assignments/${asg.id}/submissions`);
                if (subRes && subRes.success) {
                    allSubmissions.push(...subRes.data.map(s => ({ ...s, assignment_title: asg.title })));
                }
            }
            renderSubmissionsTable(allSubmissions);

            // Update pending review count
            const pending = allSubmissions.filter(s => s.status === 'submitted' || s.grade === null).length;
            const statPending = document.getElementById('statPendingReviews');
            if (statPending) statPending.textContent = pending;
        }
    } catch (err) {
        console.error('Assignments load error:', err);
    }
}

function renderAssignmentsList(assignments) {
    const table = document.getElementById('assignmentsListTable');
    if (!table) return;

    if (assignments.length === 0) {
        table.innerHTML = '<tr><td colspan="6" style="text-align: center;">No assignments created yet.</td></tr>';
        return;
    }

    table.innerHTML = assignments.map(a => `
        <tr>
            <td><strong>${a.course_code || 'CS301'}</strong></td>
            <td><strong>${a.title}</strong></td>
            <td>${new Date(a.due_date).toLocaleDateString()}</td>
            <td>${a.max_points || 100} Pts</td>
            <td><span class="status-badge present">${a.submissions_count || 1} Submissions</span></td>
            <td>
                <button class="btn-action" style="padding: 4px 8px; font-size: 11px;" onclick="facultySwitchTab('assignments')">Review</button>
            </td>
        </tr>
    `).join('');
}

function renderSubmissionsTable(submissions) {
    const table = document.getElementById('submissionsTableBody');
    if (!table) return;

    if (submissions.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center;">No student submissions found.</td></tr>';
        return;
    }

    table.innerHTML = submissions.map(s => `
        <tr>
            <td><strong>${s.student_name}</strong></td>
            <td>${s.roll_number}</td>
            <td style="max-width: 250px; word-break: break-all;">${s.content || 'Attached file'}</td>
            <td>${new Date(s.submitted_at).toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${s.status === 'graded' ? 'present' : 'late'}">
                    ${s.status.toUpperCase()}
                </span>
            </td>
            <td><strong>${s.grade !== null && s.grade !== undefined ? (s.grade + ' / 100') : 'Not graded'}</strong></td>
            <td>
                <button class="btn-action primary" style="padding: 4px 8px; font-size: 11px;" onclick="openGradeModal('${s.id}', '${s.student_name}', '${s.roll_number}', '${encodeURIComponent(s.content || '')}', '${s.grade || ''}', '${encodeURIComponent(s.feedback || '')}')">
                    ✏️ Grade
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal: Create Assignment
const createAsgModal = document.getElementById('createAssignmentModal');
const openAsgBtns = document.querySelectorAll('#openCreateAssignmentBtn, #createAssignmentModalTrigger');
const closeAsgBtn = document.getElementById('closeAsgModalBtn');
const cancelAsgBtn = document.getElementById('cancelAsgModalBtn');
const createAsgForm = document.getElementById('createAssignmentForm');

openAsgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (createAsgModal) createAsgModal.classList.add('open');
    });
});

[closeAsgBtn, cancelAsgBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
        if (createAsgModal) createAsgModal.classList.remove('open');
    });
});

if (createAsgForm) {
    createAsgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const course_id = document.getElementById('asgCourseSelect').value;
        const title = document.getElementById('asgTitle').value.trim();
        const due_date = document.getElementById('asgDueDate').value;
        const max_points = document.getElementById('asgMaxPoints').value;
        const description = document.getElementById('asgDesc').value.trim();

        if (!title || !due_date) {
            showAlert('Title and due date are required.', 'error');
            return;
        }

        try {
            const res = await bitFetch('/api/faculty/assignments', {
                method: 'POST',
                body: JSON.stringify({ course_id, title, due_date, max_points, description })
            });

            if (res && res.success) {
                showAlert('Assignment published successfully!', 'success');
                createAsgModal.classList.remove('open');
                createAsgForm.reset();
                await loadAssignments();
            }
        } catch (err) {
            showAlert(err.message || 'Failed to create assignment.', 'error');
        }
    });
}

// Modal: Grade Submission
const gradeModal = document.getElementById('gradeSubmissionModal');
const closeGradeBtn = document.getElementById('closeGradeModalBtn');
const cancelGradeBtn = document.getElementById('cancelGradeModalBtn');
const gradeForm = document.getElementById('gradeSubmissionForm');

function openGradeModal(subId, studentName, rollNo, content, grade, feedback) {
    document.getElementById('gradeSubId').value = subId;
    document.getElementById('gradeStudentName').textContent = studentName;
    document.getElementById('gradeRollNo').textContent = rollNo;
    document.getElementById('gradeWorkContent').textContent = decodeURIComponent(content);
    document.getElementById('gradeScoreInput').value = grade || 90;
    document.getElementById('gradeFeedbackInput').value = decodeURIComponent(feedback || '');

    if (gradeModal) gradeModal.classList.add('open');
}

[closeGradeBtn, cancelGradeBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
        if (gradeModal) gradeModal.classList.remove('open');
    });
});

if (gradeForm) {
    gradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subId = document.getElementById('gradeSubId').value;
        const grade = document.getElementById('gradeScoreInput').value;
        const feedback = document.getElementById('gradeFeedbackInput').value.trim();

        try {
            const res = await bitFetch(`/api/faculty/submissions/${subId}/grade`, {
                method: 'POST',
                body: JSON.stringify({ grade, feedback })
            });

            if (res && res.success) {
                showAlert('Submission graded and saved!', 'success');
                gradeModal.classList.remove('open');
                await loadAssignments();
            }
        } catch (err) {
            showAlert(err.message || 'Failed to grade submission.', 'error');
        }
    });
}

// ============================================================================
// ANNOUNCEMENTS MODULE
// ============================================================================
async function loadAnnouncements() {
    try {
        const res = await bitFetch('/api/student/announcements');
        if (res && res.success) {
            const feed = document.getElementById('announcementsFeed');
            if (!feed) return;

            feed.innerHTML = res.data.map(a => `
                <div style="background: var(--paper-light); border: 1px solid var(--border); padding: 14px; margin-bottom: 12px; box-shadow: 2px 2px 0 var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong style="font-size: 15px;">${a.title}</strong>
                        <span class="status-badge ${a.priority === 'urgent' ? 'absent' : a.priority === 'high' ? 'late' : 'present'}">
                            ${a.priority.toUpperCase()}
                        </span>
                    </div>
                    <p style="font-size: 13.5px; color: var(--ink); line-height: 1.4;">${a.content}</p>
                    <small style="color: var(--ink-light); margin-top: 6px; display: block;">Audience: ${a.audience} • Published recently</small>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Announcements load error:', err);
    }
}

const noticeForm = document.getElementById('facultyAnnouncementForm');
if (noticeForm) {
    noticeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('noticeTitle').value.trim();
        const audience = document.getElementById('noticeAudience').value;
        const priority = document.getElementById('noticePriority').value;
        const content = document.getElementById('noticeContent').value.trim();

        try {
            const res = await bitFetch('/api/faculty/announcements', {
                method: 'POST',
                body: JSON.stringify({ title, audience, priority, content })
            });

            if (res && res.success) {
                showAlert('Notice broadcasted to campus!', 'success');
                noticeForm.reset();
                await loadAnnouncements();
            }
        } catch (err) {
            showAlert(err.message || 'Error posting notice.', 'error');
        }
    });
}

// ============================================================================
// FACULTY NOTIFICATIONS MODULE
// ============================================================================
async function loadFacultyNotifications() {
    try {
        const res = await bitFetch('/api/faculty/notifications');
        if (res && res.success) {
            const notifs = res.notifications || [];
            const count = res.unread_count !== undefined ? res.unread_count : notifs.length;

            const badge = document.getElementById('facultyNotifBadge');
            const navCount = document.getElementById('facultyNavNotifCount');
            const countBadge = document.getElementById('facultyNotifCountBadge');

            if (badge) badge.textContent = count;
            if (navCount) navCount.textContent = count;
            if (countBadge) countBadge.textContent = `${count} Action Items`;

            const html = notifs.length === 0 
                ? '<div style="padding: 24px; text-align: center; color: var(--ink-light); background: var(--paper-light); border: 1px dashed var(--border);">No pending actions or urgent alerts. Everything is in order! 🎉</div>'
                : notifs.map(n => `
                    <div style="background: var(--paper-light); border: 1px solid var(--border); padding: 14px; margin-bottom: 12px; box-shadow: 2px 2px 0 var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <strong style="font-size: 14.5px;">${n.title}</strong>
                                <span class="status-badge ${n.priority === 'urgent' ? 'absent' : n.priority === 'high' ? 'late' : 'present'}">
                                    ${(n.type || 'ALERT').toUpperCase()}
                                </span>
                            </div>
                            <p style="font-size: 13.5px; color: var(--ink); margin: 0; line-height: 1.4;">${n.message}</p>
                            <small style="color: var(--ink-light); display: block; margin-top: 6px;">${new Date(n.time).toLocaleString()}</small>
                        </div>
                        ${n.type === 'submission' ? `<button class="btn-action primary" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;" onclick="facultySwitchTab('assignments')">Review Work</button>` : ''}
                        ${n.type === 'defaulter' ? `<button class="btn-action" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;" onclick="facultySwitchTab('attendance')">Check Class</button>` : ''}
                    </div>
                `).join('');

            const feed = document.getElementById('facultyNotificationsFeed');
            const modalList = document.getElementById('facultyModalNotifList');

            if (feed) feed.innerHTML = html;
            if (modalList) modalList.innerHTML = html;
        }
    } catch (err) {
        console.error('Error loading faculty notifications:', err);
    }
}

// Modal open/close listeners
const facultyNotifBtn = document.getElementById('facultyNotifBtn');
const facultyNotifModal = document.getElementById('facultyNotifModal');
const closeFacultyNotifModalBtn = document.getElementById('closeFacultyNotifModalBtn');
const viewAllNotifsBtn = document.getElementById('viewAllNotifsBtn');

if (facultyNotifBtn && facultyNotifModal) {
    facultyNotifBtn.addEventListener('click', () => {
        facultyNotifModal.classList.add('open');
        loadFacultyNotifications();
    });
}

if (closeFacultyNotifModalBtn && facultyNotifModal) {
    closeFacultyNotifModalBtn.addEventListener('click', () => {
        facultyNotifModal.classList.remove('open');
    });
}

if (viewAllNotifsBtn) {
    viewAllNotifsBtn.addEventListener('click', () => {
        if (facultyNotifModal) facultyNotifModal.classList.remove('open');
        facultySwitchTab('notifications');
    });
}

// Start Portal on page load
document.addEventListener('DOMContentLoaded', initFacultyPortal);

