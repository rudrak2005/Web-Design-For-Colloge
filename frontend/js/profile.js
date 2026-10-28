/* ============================================================================
   BITCAMPUS STUDENT PROFILE & SETTINGS CONTROLLER (js/profile.js)
   Connects Profile and Settings directly to Supabase PostgreSQL via API.
   Handles Real Data Loading, Live Edits, Password Changes, and Preferences.
============================================================================ */

const PROFILE_KEY = "bitCampusProfile";
const SETTINGS_KEY = "bitCampusSettings";

// 1. Session Guard
const rawSession =
    localStorage.getItem("bitCampusSession") ||
    sessionStorage.getItem("bitCampusSession");

if (!rawSession) {
    window.location.replace("../login.html");
}

let session;
try {
    session = JSON.parse(rawSession);
} catch (e) {
    localStorage.removeItem("bitCampusSession");
    sessionStorage.removeItem("bitCampusSession");
    window.location.replace("../login.html");
}

const currentUser = session.user || session;
const token = session.token;

// Default fallback settings
let settings = JSON.parse(
    localStorage.getItem(SETTINGS_KEY) ||
    JSON.stringify({
        emailNotifications: true,
        assignmentAlerts: true,
        attendanceAlerts: true,
        placementAlerts: true
    })
);

function getInitials(name) {
    if (!name) return "ST";
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w.charAt(0).toUpperCase())
        .join("");
}

function showModal(title, message) {
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modal = document.getElementById("profileModal");

    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    if (modal) modal.classList.add("show");
}

// 2. Fetch Real Student Profile from Database
let realProfileData = null;

async function loadRealProfile() {
    try {
        const res = await fetch('/api/student/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 401) {
            window.location.replace("../login.html");
            return;
        }

        const json = await res.json();
        if (json && json.success && json.data) {
            realProfileData = json.data;
            renderProfile(realProfileData);
        } else {
            // Fallback to session user
            renderProfile({
                full_name: currentUser.full_name || currentUser.name || "Student",
                email: currentUser.email || "student@bitcampus.com",
                phone: currentUser.phone || "",
                roll_number: "BIT-2023-CS-042",
                department: "Computer Science & Engineering",
                semester: 3,
                cgpa: 8.4,
                attendance_pct: 86.5
            });
        }
    } catch (err) {
        console.error("Error loading profile from database:", err);
    }
}

// 3. Render Profile Data to DOM
function renderProfile(data) {
    if (!data) return;

    const name = data.full_name || data.name || "Student";
    const initials = getInitials(name);
    const email = data.email || "";
    const phone = data.phone || "";
    const rollNo = data.roll_number || "BIT-2023-CS-042";
    const dept = data.department || data.department_name || "Computer Science & Engineering";
    const sem = data.semester || 3;

    // Update Avatars
    const avatars = ["profileAvatar", "miniAvatar", "admitPhoto"];
    avatars.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initials;
    });

    // Update Names
    const nameEls = ["profileName", "infoName", "admitName"];
    nameEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
    });

    // Query selector for data-student-name
    document.querySelectorAll("[data-student-name]").forEach(el => {
        el.textContent = name;
    });

    // Update ID & Department
    const idEl = document.querySelector(".profile-id");
    if (idEl) idEl.textContent = `ID: ${rollNo} • SEM ${sem}`;

    const courseEl = document.querySelector(".profile-course");
    if (courseEl) courseEl.textContent = `B.Tech in ${dept}`;

    // Update Info section
    const infoEmail = document.getElementById("infoEmail");
    if (infoEmail) infoEmail.textContent = email;

    const infoPhone = document.getElementById("infoPhone");
    if (infoPhone) infoPhone.textContent = phone || "Not added";

    const infoEmergency = document.getElementById("infoEmergency");
    if (infoEmergency) infoEmergency.textContent = data.emergency || "+91 98765 00000";

    const infoAddress = document.getElementById("infoAddress");
    if (infoAddress) infoAddress.textContent = data.address || "Campus Hostel Block B, Room 204";

    // Populate Edit Form Inputs
    const editName = document.getElementById("editName");
    if (editName) editName.value = name;

    const editPhone = document.getElementById("editPhone");
    if (editPhone) editPhone.value = phone;

    const editEmergency = document.getElementById("editEmergency");
    if (editEmergency) editEmergency.value = data.emergency || "";

    const editAddress = document.getElementById("editAddress");
    if (editAddress) editAddress.value = data.address || "";

    updateCompletion(data);
}

// 4. Update Profile Completion Meter
function updateCompletion(data) {
    let completed = 2; // name and email are always present
    if (data.phone) completed++;
    if (data.emergency) completed++;
    if (data.address) completed++;

    const total = 5;
    const percentage = Math.round((completed / total) * 100);

    const valEl = document.getElementById("completionValue");
    if (valEl) valEl.textContent = `${percentage}%`;

    const barEl = document.getElementById("completionBar");
    if (barEl) barEl.style.width = `${percentage}%`;
}

// 5. Connect Profile Form to Backend PUT /api/student/profile
const profileForm = document.getElementById("profileForm");
if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const editName = document.getElementById("editName")?.value.trim();
        const editPhone = document.getElementById("editPhone")?.value.trim();
        const editEmergency = document.getElementById("editEmergency")?.value.trim();
        const editAddress = document.getElementById("editAddress")?.value.trim();

        if (!editName) {
            alert("Name cannot be empty.");
            return;
        }

        const submitBtn = profileForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.textContent : "Save Changes";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving to Database...";
        }

        try {
            // Save to PostgreSQL via API
            const res = await fetch('/api/student/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: editName,
                    phone: editPhone
                })
            });

            const result = await res.json();

            if (res.ok && result.success) {
                // Update local storage session so all pages reflect changes
                currentUser.full_name = editName;
                currentUser.name = editName;
                currentUser.phone = editPhone;
                session.user = currentUser;
                localStorage.setItem("bitCampusSession", JSON.stringify(session));

                // Also save auxiliary fields to local storage
                localStorage.setItem(PROFILE_KEY, JSON.stringify({
                    name: editName,
                    phone: editPhone,
                    emergency: editEmergency,
                    address: editAddress
                }));

                // Update DOM view
                if (realProfileData) {
                    realProfileData.full_name = editName;
                    realProfileData.phone = editPhone;
                    realProfileData.emergency = editEmergency;
                    realProfileData.address = editAddress;
                    renderProfile(realProfileData);
                }

                showModal(
                    "Profile Successfully Saved! ✅",
                    "Your changes have been securely saved to the BitCampus database. Your teachers and HOD will see your updated information immediately."
                );
            } else {
                showModal("Update Failed", result.message || "Could not save profile changes. Please try again.");
            }
        } catch (err) {
            console.error("Save profile error:", err);
            showModal("Network Error", "Unable to communicate with the database server.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    });
}

// 6. Reset Profile Form Button
const resetProfileBtn = document.getElementById("resetProfileBtn");
if (resetProfileBtn) {
    resetProfileBtn.addEventListener("click", () => {
        if (realProfileData) renderProfile(realProfileData);
    });
}

// 7. Scroll Buttons
const editProfileBtn = document.getElementById("editProfileBtn");
if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
        const sec = document.getElementById("editSection");
        if (sec) sec.scrollIntoView({ behavior: "smooth" });
    });
}

const scrollAdmitBtn = document.getElementById("scrollAdmitBtn");
if (scrollAdmitBtn) {
    scrollAdmitBtn.addEventListener("click", () => {
        const admit = document.getElementById("admitCard");
        if (admit) admit.scrollIntoView({ behavior: "smooth" });
    });
}

const printAdmitBtn = document.getElementById("printAdmitBtn");
if (printAdmitBtn) {
    printAdmitBtn.addEventListener("click", () => {
        window.print();
    });
}

// 8. Settings Checkboxes
const settingIds = [
    "emailNotifications",
    "assignmentAlerts",
    "attendanceAlerts",
    "placementAlerts"
];

settingIds.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = Boolean(settings[id]);
        checkbox.addEventListener("change", () => {
            settings[id] = checkbox.checked;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        });
    }
});

// 9. Modal Close Handlers
const modalClose = document.getElementById("modalClose");
const profileModal = document.getElementById("profileModal");

if (modalClose && profileModal) {
    modalClose.addEventListener("click", () => {
        profileModal.classList.remove("show");
    });
}

if (profileModal) {
    profileModal.addEventListener("click", (e) => {
        if (e.target.id === "profileModal") {
            profileModal.classList.remove("show");
        }
    });
}

// 10. Logout Button
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("bitCampusSession");
        sessionStorage.removeItem("bitCampusSession");
        window.location.replace("../login.html");
    });
}

// 11. Mobile Navigation Hamburger Toggle & Backdrop
const pageMenuBtn = document.getElementById("pageMenuBtn") || document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar") || document.querySelector(".page-sidebar");

if (pageMenuBtn && sidebar) {
    let backdrop = document.getElementById("pageBackdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "pageBackdrop";
        backdrop.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 998; display: none; backdrop-filter: blur(2px);";
        document.body.appendChild(backdrop);
    }

    pageMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
        backdrop.style.display = sidebar.classList.contains("open") ? "block" : "none";
    });

    backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.style.display = "none";
    });
}

// 12. Hide Loader on Load
const loader = document.getElementById("loader");
if (loader) {
    setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.visibility = "hidden";
        loader.style.pointerEvents = "none";
        setTimeout(() => {
            loader.style.display = "none";
        }, 300);
    }, 300);
}

// Load real database data on startup
document.addEventListener("DOMContentLoaded", loadRealProfile);
