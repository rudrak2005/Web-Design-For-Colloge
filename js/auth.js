/* =====================================
   BITCAMPUS TEMPORARY AUTH
===================================== */

const USERS = [
    {
        email: "student@bitcampus.com",
        password: "123456",
        name: "Rudraksh Kumar",
        course: "B.Tech CSE",
        semester: "Semester 3"
    },
    {
        email: "rudraksh@bitcampus.com",
        password: "bitcampus123",
        name: "Rudraksh Kumar",
        course: "B.Tech CSE",
        semester: "Semester 3"
    }
];


/* =====================================
   ELEMENTS
===================================== */

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");

const loginBtn = document.getElementById("loginBtn");
const loginText = document.getElementById("loginText");

const message = document.getElementById("message");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const togglePassword =
    document.getElementById("togglePassword");

const demoBtn =
    document.getElementById("demoBtn");

const forgotBtn =
    document.getElementById("forgotBtn");


/* =====================================
   PASSWORD SHOW / HIDE
===================================== */

if (togglePassword) {

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


/* =====================================
   CLEAR ERRORS
===================================== */

function clearErrors() {

    emailError.textContent = "";
    passwordError.textContent = "";

    message.textContent = "";
    message.className = "message";

}


/* =====================================
   VALIDATION
===================================== */

function validateForm() {

    clearErrors();

    let valid = true;

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value.trim();


    if (!email) {

        emailError.textContent =
            "Email is required.";

        valid = false;

    }


    if (!password) {

        passwordError.textContent =
            "Password is required.";

        valid = false;

    }


    return valid;
}


/* =====================================
   FIND USER
===================================== */

function findUser(email, password) {

    return USERS.find(user =>

        user.email.toLowerCase() ===
        email.toLowerCase() &&

        user.password === password

    );

}


/* =====================================
   SAVE SESSION
===================================== */

function saveSession(user) {

    const session = {

        loggedIn: true,

        email: user.email,

        name: user.name,

        course: user.course,

        semester: user.semester,

        loginTime: new Date().toISOString()

    };


    localStorage.removeItem("bitCampusSession");
    sessionStorage.removeItem("bitCampusSession");


    const storage =
        rememberInput.checked
            ? localStorage
            : sessionStorage;


    storage.setItem(
        "bitCampusSession",
        JSON.stringify(session)
    );

}


/* =====================================
   LOGIN
===================================== */

if (form) {

    form.addEventListener("submit", (event) => {

        event.preventDefault();


        if (!validateForm()) {
            return;
        }


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value.trim();


        const user =
            findUser(
                email,
                password
            );


        if (!user) {

            message.textContent =
                "Invalid email or password.";

            message.className =
                "message error";

            return;
        }


        /* Save session */

        saveSession(user);


        /* Loading state */

        loginBtn.disabled = true;
        loginBtn.classList.add("loading");


        message.textContent =
            "Login successful.";

        message.className =
            "message success";


        /*
         * Small delay so user sees
         * loading animation.
         */

        setTimeout(() => {

            window.location.replace(
                "../pages/dashboard.html"
            );

        }, 800);

    });

}


/* =====================================
   DEMO LOGIN
===================================== */

if (demoBtn) {

    demoBtn.addEventListener("click", () => {

        emailInput.value =
            "student@bitcampus.com";

        passwordInput.value =
            "123456";

        rememberInput.checked =
            true;


        form.requestSubmit();

    });

}


/* =====================================
   FORGOT PASSWORD
===================================== */

if (forgotBtn) {

    forgotBtn.addEventListener("click", () => {

        message.textContent =
            "Password recovery will be added later.";

        message.className =
            "message error";

    });

}