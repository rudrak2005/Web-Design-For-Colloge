/* =====================================
   BITCAMPUS DASHBOARD
===================================== */

const rawSession =
    localStorage.getItem("bitCampusSession") ||
    sessionStorage.getItem("bitCampusSession");


/* =====================================
   LOGIN CHECK
===================================== */

if (!rawSession) {

    window.location.replace(
        "../login.html"
    );

}


/* =====================================
   SESSION
===================================== */

let session;

try {

    session = JSON.parse(rawSession);

} catch (error) {

    localStorage.removeItem("bitCampusSession");
    sessionStorage.removeItem("bitCampusSession");

    window.location.replace(
        "../login.html"
    );

}


/* =====================================
   SHOW USER
===================================== */

const topStudentName =
    document.getElementById("topStudentName");


if (topStudentName && session) {

    const firstName =
        session.name?.split(" ")[0] ||
        "Student";

    topStudentName.textContent =
        firstName;

}


/* =====================================
   LOGOUT
===================================== */

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("bitCampusSession");
        sessionStorage.removeItem("bitCampusSession");

        window.location.replace(
            "../login.html"
        );

    });

}


/* =====================================
   SIDEBAR
===================================== */

/* =====================================
   MOBILE SIDEBAR
===================================== */

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

let sidebarOverlay = document.getElementById("sidebarOverlay");

if (!sidebarOverlay) {
    sidebarOverlay = document.createElement("div");
    sidebarOverlay.id = "sidebarOverlay";
    sidebarOverlay.className = "sidebar-overlay";
    document.body.appendChild(sidebarOverlay);
}

if (menuBtn && sidebar) {

    const toggleSidebar = () => {
        sidebar.classList.toggle("open");
        sidebarOverlay.classList.toggle("show");
        document.body.classList.toggle("sidebar-open");
    };

    menuBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSidebar();
    });

    sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    });

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.remove("show");
            document.body.classList.remove("sidebar-open");
        });
    });
}


/* =====================================
   DATE / TIME
===================================== */

const currentTime =
    document.getElementById("currentTime");

const currentDate =
    document.getElementById("currentDate");


function updateClock() {

    const now = new Date();


    if (currentTime) {

        currentTime.textContent =
            now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

    }


    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric"
            });

    }

}


updateClock();

setInterval(
    updateClock,
    1000
);


/* =====================================
   NAVIGATION
===================================== */

const navLinks =
    document.querySelectorAll(".nav-link");


navLinks.forEach(link => {

    link.addEventListener("click", event => {

        const target =
            link.getAttribute("href");


        if (!target || target === "#") {

            event.preventDefault();
            return;

        }

    });

});

