/* ============================================================================
   BITCAMPUS STUDENT DASHBOARD SCRIPT (js/dashboard.js)
   Real Database Data, Live Synchronized Attendance & Assignments,
   Mobile Drawer Navigation, Theme Sync, and Dynamic Micro-Interactions
============================================================================ */

// 1. Session Verification
const rawSession =
    localStorage.getItem("bitCampusSession") ||
    sessionStorage.getItem("bitCampusSession");

if (!rawSession) {
    window.location.replace("../login.html");
}

let session;
try {
    session = JSON.parse(rawSession);
} catch (error) {
    localStorage.removeItem("bitCampusSession");
    sessionStorage.removeItem("bitCampusSession");
    window.location.replace("../login.html");
}

const currentUser = session.user || session;
const userRole = currentUser.role || "student";

// Helper for authenticated API calls
async function fetchStudentApi(endpoint) {
    const token = session.token;
    try {
        const res = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("bitCampusSession");
            sessionStorage.removeItem("bitCampusSession");
            window.location.replace("../login.html");
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`API fetch error for ${endpoint}:`, err);
        return null;
    }
}

// 2. Load Real Student Profile & Render Across Hero and Header
async function loadRealStudentDashboard() {
    try {
        // Fetch Real Student Profile
        const profRes = await fetchStudentApi('/api/student/profile');
        if (profRes && profRes.success && profRes.data) {
            const student = profRes.data;
            const fullName = student.full_name || currentUser.full_name || "Student";
            const firstName = fullName.split(" ")[0];
            const initial = firstName.charAt(0).toUpperCase();

            // Header elements
            const topStudentName = document.getElementById("topStudentName");
            if (topStudentName) topStudentName.textContent = firstName;

            const profileAvatar = document.querySelector(".profile-avatar");
            if (profileAvatar) profileAvatar.textContent = initial;

            // Hero elements
            const heroName = document.querySelector(".hero-paper h1");
            if (heroName) heroName.textContent = `${firstName}!`;

            const heroSmall = document.querySelector(".hero-small");
            if (heroSmall) {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? "GOOD MORNING," : hour < 17 ? "GOOD AFTERNOON," : "GOOD EVENING,";
                heroSmall.textContent = greeting;
            }

            // Hero tags: Semester & Department
            const heroTags = document.querySelectorAll(".hero-tags span");
            if (heroTags.length >= 2) {
                heroTags[0].textContent = `Semester ${student.semester || 3}`;
                heroTags[1].textContent = `${student.department_code || 'B.Tech CSE'}`;
            }

            // Update user in session cache if changed
            currentUser.full_name = fullName;
            session.user = currentUser;
            localStorage.setItem("bitCampusSession", JSON.stringify(session));
        }

        // 3. Fetch Real Attendance (Live Sync with Teacher Input)
        const attRes = await fetchStudentApi('/api/student/attendance');
        if (attRes && attRes.success) {
            const attPct = attRes.overall_percentage !== undefined ? attRes.overall_percentage : 85.0;
            const attCardStrong = document.querySelector(".stat-card.mint .stat-data strong");
            if (attCardStrong) {
                attCardStrong.textContent = `${attPct}%`;
            }

            const attSmall = document.querySelector(".stat-card.mint small");
            if (attSmall) {
                if (attPct >= 85) {
                    attSmall.textContent = `Excellent: ${attRes.attended_classes || 0}/${attRes.total_classes || 0} classes`;
                } else if (attPct >= 75) {
                    attSmall.textContent = `Safe: ${attRes.attended_classes || 0}/${attRes.total_classes || 0} classes`;
                } else {
                    attSmall.textContent = `⚠️ Below 75% threshold!`;
                    attSmall.style.color = 'var(--red, #b95f56)';
                    attSmall.style.fontWeight = 'bold';
                }
            }
        }

        // 4. Fetch Real Assignments & Submissions
        const asgRes = await fetchStudentApi('/api/student/assignments');
        if (asgRes && asgRes.success) {
            const assignments = asgRes.data || [];
            const pendingCount = assignments.filter(a => !a.is_submitted).length;

            const asgCardStrong = document.querySelector(".stat-card.pink .stat-data strong");
            if (asgCardStrong) {
                asgCardStrong.textContent = `${pendingCount}`;
            }

            const asgSmall = document.querySelector(".stat-card.pink small");
            if (asgSmall) {
                asgSmall.textContent = pendingCount === 0 ? "All caught up! 🎉" : `${pendingCount} due soon`;
            }
        }

        // 5. Fetch Real Courses Count
        const coursesRes = await fetchStudentApi('/api/student/courses');
        if (coursesRes && coursesRes.success) {
            const coursesCount = coursesRes.count || (coursesRes.data ? coursesRes.data.length : 5);
            const courseCardStrong = document.querySelector(".stat-card.lavender .stat-data strong");
            if (courseCardStrong) {
                courseCardStrong.textContent = `${coursesCount} Subjects`;
            }
            const courseCardSpan = document.querySelector(".stat-card.lavender .stat-data span");
            if (courseCardSpan) {
                courseCardSpan.textContent = "Active Courses";
            }
            const courseSmall = document.querySelector(".stat-card.lavender small");
            if (courseSmall) {
                courseSmall.textContent = "Enrolled Autumn 2026";
            }
        }

        // 6. Fetch Real Smart Notifications / Alerts
        const notifRes = await fetchStudentApi('/api/student/notifications');
        if (notifRes && notifRes.success) {
            const unread = notifRes.unread_count || 0;
            const notifVal = document.getElementById("smartNotificationCount");
            if (notifVal) notifVal.textContent = unread;
        }

    } catch (err) {
        console.error("Dashboard real data sync error:", err);
    }
}

// 7. Role Banner for Faculty or Master visiting Student Portal
if (userRole === "master" || userRole === "faculty") {
    const adminBanner = document.createElement("div");
    adminBanner.style.cssText = "background: #26221e; color: #f2e3bd; padding: 10px 18px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 99999; border-bottom: 2px solid #e4bd58; box-shadow: 0 2px 10px rgba(0,0,0,0.3);";
    const targetUrl = userRole === "master" ? "./master-dashboard.html" : "./faculty-dashboard.html";
    const roleTitle = userRole === "master" ? "👑 Master / HOD Portal" : "👨‍🏫 Faculty Portal";
    adminBanner.innerHTML = `<span><strong>${roleTitle}:</strong> Logged in as <em>${currentUser.full_name || currentUser.name}</em></span> <a href="${targetUrl}" style="color: #e4bd58; font-weight: bold; text-decoration: underline; margin-left: 10px;">Return to ${userRole.toUpperCase()} Dashboard →</a>`;
    document.body.prepend(adminBanner);
}

// ============================================================================
// MOBILE SIDEBAR TOGGLE & BACKDROP OVERLAY
// ============================================================================
const menuBtn = document.getElementById("menuBtn") || document.querySelector(".menu-btn");
const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");

let backdrop = document.getElementById("sidebarBackdrop");
if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.65); z-index: 998; display: none; backdrop-filter: blur(3px); transition: opacity 0.3s ease;";
    document.body.appendChild(backdrop);
}

function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.style.display = "none";
    document.body.style.overflow = "";
}

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    backdrop.addEventListener("click", closeSidebar);

    const navLinks = sidebar.querySelectorAll("a, button");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 900) {
                closeSidebar();
            }
        });
    });
}

// ============================================================================
// LOGOUT BUTTON
// ============================================================================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("bitCampusSession");
        sessionStorage.removeItem("bitCampusSession");
        window.location.replace("../login.html");
    });
}

// ============================================================================
// DATE & TIME LIVE CLOCK
// ============================================================================
const currentTime = document.getElementById("currentTime");
const currentDate = document.getElementById("currentDate");

function updateClock() {
    const now = new Date();
    if (currentTime) {
        currentTime.textContent = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }
    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }
}
updateClock();
setInterval(updateClock, 1000);

// Initialize real database data on page load
document.addEventListener("DOMContentLoaded", loadRealStudentDashboard);
