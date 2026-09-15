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
   MOBILE SIDEBAR
===================================== */

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");


function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("show");
    }

    document.body.classList.add("sidebar-open");
}


function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("show");
    }

    document.body.classList.remove("sidebar-open");
}


function toggleSidebar() {

    if (!sidebar) return;

    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }

}


/* Hamburger */
if (menuBtn) {

    menuBtn.type = "button";

    menuBtn.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        toggleSidebar();

    });

}


/* Overlay */
if (sidebarOverlay) {

    sidebarOverlay.addEventListener("click", function () {

        closeSidebar();

    });

}


/* Close after selecting a page */
if (sidebar) {

    sidebar.querySelectorAll("a").forEach(function (link) {

        link.addEventListener("click", function () {

            closeSidebar();

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

