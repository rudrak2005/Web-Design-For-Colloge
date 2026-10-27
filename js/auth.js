/* ============================================================================
   BITCAMPUS AUTHENTICATION & REGISTRATION CONTROLLER
   Full Real Authentication & Account Creation for Student, Faculty & Master
============================================================================ */

// State
let currentMode = "signin"; // "signin" | "register"
let currentRole = "student"; // "student" | "faculty" | "master"

// Elements - Tabs & Role Switcher
const tabSignIn = document.getElementById("tabSignIn");
const tabRegister = document.getElementById("tabRegister");
const switchToRegisterBtn = document.getElementById("switchToRegisterBtn");
const switchToSignInBtn = document.getElementById("switchToSignInBtn");

const rolePills = document.querySelectorAll(".role-pill");
const portalLabel = document.getElementById("portalLabel");
const formHeading = document.getElementById("formHeading");
const formSubheading = document.getElementById("formSubheading");

// Forms
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// Role Field Containers in Register Form
const studentFieldsContainer = document.getElementById("studentFieldsContainer");
const facultyFieldsContainer = document.getElementById("facultyFieldsContainer");
const masterFieldsContainer = document.getElementById("masterFieldsContainer");

// Toggle Sign In vs Register Tabs
function setMode(mode) {
    currentMode = mode;
    if (mode === "signin") {
        tabSignIn.classList.add("active");
        tabRegister.classList.remove("active");
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        formHeading.textContent = "Welcome Back";
        formSubheading.textContent = "Sign in to continue to your academic workspace.";
    } else {
        tabRegister.classList.add("active");
        tabSignIn.classList.remove("active");
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        formHeading.textContent = "Create Real Account";
        formSubheading.textContent = `Register your official ${currentRole.toUpperCase()} credentials.`;
    }
    clearAllErrors();
}

if (tabSignIn) tabSignIn.addEventListener("click", () => setMode("signin"));
if (tabRegister) tabRegister.addEventListener("click", () => setMode("register"));
if (switchToRegisterBtn) switchToRegisterBtn.addEventListener("click", () => setMode("register"));
if (switchToSignInBtn) switchToSignInBtn.addEventListener("click", () => setMode("signin"));

// Role Selector Pills
rolePills.forEach(pill => {
    pill.addEventListener("click", () => {
        rolePills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentRole = pill.dataset.role;

        // Update Labels
        if (currentRole === "student") {
            portalLabel.textContent = "STUDENT ACCESS";
            document.getElementById("emailLabel").textContent = "Student Email";
            document.getElementById("email").placeholder = "student@bitcampus.com";
            if (studentFieldsContainer) studentFieldsContainer.style.display = "block";
            if (facultyFieldsContainer) facultyFieldsContainer.style.display = "none";
            if (masterFieldsContainer) masterFieldsContainer.style.display = "none";
        } else if (currentRole === "faculty") {
            portalLabel.textContent = "FACULTY PORTAL";
            document.getElementById("emailLabel").textContent = "Faculty Email / Staff ID";
            document.getElementById("email").placeholder = "faculty@bitcampus.com";
            if (studentFieldsContainer) studentFieldsContainer.style.display = "none";
            if (facultyFieldsContainer) facultyFieldsContainer.style.display = "block";
            if (masterFieldsContainer) masterFieldsContainer.style.display = "none";
        } else if (currentRole === "master") {
            portalLabel.textContent = "MASTER / HOD COMMAND";
            document.getElementById("emailLabel").textContent = "Administrator Email";
            document.getElementById("email").placeholder = "hod@bitcampus.com";
            if (studentFieldsContainer) studentFieldsContainer.style.display = "none";
            if (facultyFieldsContainer) facultyFieldsContainer.style.display = "none";
            if (masterFieldsContainer) masterFieldsContainer.style.display = "block";
        }

        if (currentMode === "register") {
            formSubheading.textContent = `Register your official ${currentRole.toUpperCase()} credentials.`;
        }
        clearAllErrors();
    });
});

// Password Toggle Button
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁";
        }
    });
}

function clearAllErrors() {
    document.querySelectorAll(".error").forEach(el => el.textContent = "");
    const loginMsg = document.getElementById("loginMessage");
    const regMsg = document.getElementById("registerMessage");
    if (loginMsg) { loginMsg.textContent = ""; loginMsg.className = "message"; }
    if (regMsg) { regMsg.textContent = ""; regMsg.className = "message"; }
}

// ============================================================================
// 1. REAL SIGN IN SUBMISSION
// ============================================================================
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const remember = document.getElementById("remember")?.checked || true;
        const messageElem = document.getElementById("loginMessage");
        const loginBtn = document.getElementById("loginBtn");
        const loginText = document.getElementById("loginText");

        if (!email) {
            document.getElementById("emailError").textContent = "Email is required.";
            return;
        }
        if (!password) {
            document.getElementById("passwordError").textContent = "Password is required.";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.classList.add("loading");
        if (loginText) loginText.textContent = "AUTHENTICATING...";

        try {
            const res = await bitFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            if (res && res.success) {
                BitCampusAuth.setSession(res.token, res.user, remember);
                messageElem.textContent = res.message || "Login successful! Redirecting...";
                messageElem.className = "message success";

                setTimeout(() => {
                    window.location.replace(res.redirectUrl || "/pages/dashboard.html");
                }, 600);
            } else {
                throw new Error(res.message || "Invalid credentials.");
            }
        } catch (err) {
            messageElem.textContent = err.message || "Incorrect email or password.";
            messageElem.className = "message error";
            loginBtn.disabled = false;
            loginBtn.classList.remove("loading");
            if (loginText) loginText.textContent = "SIGN IN →";
        }
    });
}

// ============================================================================
// 2. REAL REGISTRATION SUBMISSION
// ============================================================================
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAllErrors();

        const full_name = document.getElementById("regFullName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const phone = document.getElementById("regPhone").value.trim();
        const password = document.getElementById("regPassword").value;
        const confirmPassword = document.getElementById("regConfirmPassword").value;
        const messageElem = document.getElementById("registerMessage");
        const registerBtn = document.getElementById("registerBtn");
        const registerText = document.getElementById("registerText");

        let isValid = true;

        if (!full_name) {
            document.getElementById("regNameError").textContent = "Full Name is required.";
            isValid = false;
        }

        if (!email) {
            document.getElementById("regEmailError").textContent = "Valid Email is required.";
            isValid = false;
        }

        if (!password || password.length < 6) {
            document.getElementById("regPassError").textContent = "Password must be at least 6 characters.";
            isValid = false;
        }

        if (password !== confirmPassword) {
            document.getElementById("regConfirmError").textContent = "Passwords do not match.";
            isValid = false;
        }

        // Role-specific validation & payload preparation
        const payload = {
            role: currentRole,
            full_name,
            email,
            phone,
            password
        };

        if (currentRole === "student") {
            const roll_number = document.getElementById("regRollNo").value.trim();
            const department_code = document.getElementById("regStudentDept").value;
            const semester = document.getElementById("regSemester").value;

            if (!roll_number) {
                document.getElementById("regRollError").textContent = "Roll / Enrollment number is required.";
                isValid = false;
            }

            payload.roll_number = roll_number;
            payload.department_code = department_code;
            payload.semester = semester;

        } else if (currentRole === "faculty") {
            const employee_id = document.getElementById("regEmpId").value.trim();
            const department_code = document.getElementById("regFacultyDept").value;
            const designation = document.getElementById("regDesignation").value;
            const specialization = document.getElementById("regSpecialization").value.trim();

            if (!employee_id) {
                document.getElementById("regEmpError").textContent = "Employee ID is required.";
                isValid = false;
            }

            payload.employee_id = employee_id;
            payload.department_code = department_code;
            payload.designation = designation;
            payload.specialization = specialization;

        } else if (currentRole === "master") {
            const master_code = document.getElementById("regMasterCode").value.trim();
            if (!master_code) {
                document.getElementById("regMasterError").textContent = "Security Passcode is required for Master / HOD creation.";
                isValid = false;
            }
            payload.master_code = master_code;
        }

        if (!isValid) return;

        registerBtn.disabled = true;
        registerBtn.classList.add("loading");
        if (registerText) registerText.textContent = "CREATING ACCOUNT...";

        try {
            const res = await bitFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res && res.success) {
                BitCampusAuth.setSession(res.token, res.user, true);
                messageElem.textContent = res.message || "Account created successfully! Loading your portal...";
                messageElem.className = "message success";

                setTimeout(() => {
                    window.location.replace(res.redirectUrl || "/pages/dashboard.html");
                }, 800);
            } else {
                throw new Error(res.message || "Registration failed.");
            }
        } catch (err) {
            messageElem.textContent = err.message || "Failed to register account.";
            messageElem.className = "message error";
            registerBtn.disabled = false;
            registerBtn.classList.remove("loading");
            if (registerText) registerText.textContent = "CREATE ACCOUNT →";
        }
    });
}

// Forgot Password link
const forgotBtn = document.getElementById("forgotBtn");
if (forgotBtn) {
    forgotBtn.addEventListener("click", async () => {
        const email = document.getElementById("email").value.trim();
        const messageElem = document.getElementById("loginMessage");
        if (!email) {
            messageElem.textContent = "Please enter your campus email above to initiate password recovery.";
            messageElem.className = "message error";
            return;
        }

        try {
            const res = await bitFetch("/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ email })
            });
            messageElem.textContent = res.message || "Password recovery initiated.";
            messageElem.className = "message success";
        } catch (e) {
            messageElem.textContent = e.message || "Password reset instructions dispatched if account exists.";
            messageElem.className = "message success";
        }
    });
}