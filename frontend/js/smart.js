/* =====================================
   BITCAMPUS SMART LAYER
===================================== */

const BITCAMPUS_STORAGE = {

    streak: "bitCampusStudyStreak",

    planner: "bitCampusStudyPlanner",

    settings: "bitCampusSmartSettings"

};


/* =====================================
   SAFE STORAGE
===================================== */

function smartGet(key, fallback = null) {

    try {

        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;

    }

}


function smartSet(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


/* =====================================
   GLOBAL SEARCH DATA
===================================== */

const BITCAMPUS_SEARCH_INDEX = [

    {
        title: "Dashboard",
        description: "Your main student dashboard",
        url: "./dashboard.html",
        keywords: "home dashboard student"
    },

    {
        title: "Student Profile",
        description: "Personal information and settings",
        url: "./profile.html",
        keywords: "profile student identity settings"
    },

    {
        title: "Academics",
        description: "Academic performance and semester information",
        url: "./academics.html",
        keywords: "academics cgpa semester credits"
    },

    {
        title: "Courses",
        description: "Courses and subject modules",
        url: "./courses.html",
        keywords: "courses subjects modules"
    },

    {
        title: "Attendance",
        description: "Attendance and smart predictor",
        url: "./attendance.html",
        keywords: "attendance present absent predictor"
    },

    {
        title: "Assignments",
        description: "Track assignments and deadlines",
        url: "./assignments.html",
        keywords: "assignment homework task deadline"
    },

    {
        title: "Timetable",
        description: "Weekly class timetable",
        url: "./timetable.html",
        keywords: "timetable classes schedule"
    },

    {
        title: "Results",
        description: "Marks SGPA CGPA and result analysis",
        url: "./results.html",
        keywords: "results marks sgpa cgpa"
    },

    {
        title: "Fees",
        description: "Fee status and transactions",
        url: "./fees.html",
        keywords: "fees payment pending transaction"
    },

    {
        title: "Registration",
        description: "Semester registration",
        url: "./registration.html",
        keywords: "registration semester form subjects"
    },

    {
        title: "Library",
        description: "Books and issued resources",
        url: "./library.html",
        keywords: "library books issue return"
    },

    {
        title: "Notices & News",
        description: "Campus announcements",
        url: "./notices.html",
        keywords: "notice news announcement campus"
    },

    {
        title: "Notifications",
        description: "Smart campus notifications",
        url: "./notifications.html",
        keywords: "notification alert smart"
    },

    {
        title: "Placement",
        description: "Jobs internships and applications",
        url: "./placement.html",
        keywords: "placement jobs internship career resume"
    },

    {
        title: "Student Support",
        description: "Feedback grievance and important links",
        url: "./support.html",
        keywords: "feedback grievance complaint help support"
    }

];


/* =====================================
   GLOBAL SEARCH
===================================== */

function initGlobalSearch() {

    const searchInput =
        document.getElementById(
            "globalSearch"
        );

    const searchResults =
        document.getElementById(
            "globalSearchResults"
        );


    if (
        !searchInput ||
        !searchResults
    ) {
        return;
    }


    function renderResults() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!query) {

            searchResults.innerHTML = "";

            searchResults.classList.remove(
                "show"
            );

            return;

        }


        const results =
            BITCAMPUS_SEARCH_INDEX.filter(
                item => {

                    const searchable =
                        `
                        ${item.title}
                        ${item.description}
                        ${item.keywords}
                        `.toLowerCase();

                    return searchable.includes(
                        query
                    );

                }
            ).slice(0, 7);


        if (!results.length) {

            searchResults.innerHTML = `
                <div class="smart-search-empty">
                    No BitCampus page found.
                </div>
            `;

            searchResults.classList.add(
                "show"
            );

            return;

        }


        searchResults.innerHTML =
            results.map(
                item => `

                    <a
                        href="${item.url}"
                        class="smart-search-result"
                    >

                        <div class="smart-search-icon">
                            →
                        </div>

                        <div>

                            <strong>
                                ${item.title}
                            </strong>

                            <small>
                                ${item.description}
                            </small>

                        </div>

                    </a>

                `
            ).join("");


        searchResults.classList.add(
            "show"
        );

    }


    searchInput.addEventListener(
        "input",
        renderResults
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !searchResults.contains(event.target) &&
                event.target !== searchInput
            ) {

                searchResults.classList.remove(
                    "show"
                );

            }

        }
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                searchResults.classList.remove(
                    "show"
                );

                searchInput.blur();

            }

        }
    );

}


/* =====================================
   EXAM COUNTDOWN
===================================== */

function getExamCountdown() {

    const examDate =
        new Date(
            "2026-09-29T09:00:00"
        );

    const now =
        new Date();

    const difference =
        examDate - now;


    if (difference <= 0) {

        return {

            days: 0,

            hours: 0,

            minutes: 0,

            text: "Exam day"

        };

    }


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );


    const hours =
        Math.floor(
            (
                difference %
                (1000 * 60 * 60 * 24)
            ) /
            (1000 * 60 * 60)
        );


    const minutes =
        Math.floor(
            (
                difference %
                (1000 * 60 * 60)
            ) /
            (1000 * 60)
        );


    return {

        days,

        hours,

        minutes,

        text:
            `${days}d ${hours}h ${minutes}m`

    };

}


/* =====================================
   STUDY STREAK
===================================== */

function getStreakData() {

    return smartGet(
        BITCAMPUS_STORAGE.streak,
        {
            current: 0,
            longest: 0,
            lastStudyDate: null
        }
    );

}


function markStudyToday() {

    const data =
        getStreakData();


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    if (
        data.lastStudyDate ===
        today
    ) {

        return data;

    }


    const yesterdayDate =
        new Date();

    yesterdayDate.setDate(
        yesterdayDate.getDate() - 1
    );


    const yesterday =
        yesterdayDate
            .toISOString()
            .split("T")[0];


    if (
        data.lastStudyDate ===
        yesterday
    ) {

        data.current += 1;

    } else {

        data.current = 1;

    }


    data.longest =
        Math.max(
            data.longest,
            data.current
        );


    data.lastStudyDate =
        today;


    smartSet(
        BITCAMPUS_STORAGE.streak,
        data
    );


    return data;

}


/* =====================================
   STUDY PLANNER
===================================== */

function getPlanner() {

    return smartGet(
        BITCAMPUS_STORAGE.planner,
        []
    );

}


function savePlanner(planner) {

    smartSet(
        BITCAMPUS_STORAGE.planner,
        planner
    );

}


function addStudyTask(
    subject,
    task,
    date,
    minutes
) {

    const planner =
        getPlanner();


    planner.push({

        id:
            Date.now(),

        subject,

        task,

        date,

        minutes:

            Number(minutes),

        completed:
            false

    });


    savePlanner(
        planner
    );


    return planner;

}


function completeStudyTask(id) {

    const planner =
        getPlanner();


    const item =
        planner.find(
            task =>
                task.id === id
        );


    if (item) {

        item.completed =
            true;

    }


    savePlanner(
        planner
    );


    return planner;

}


/* =====================================
   SMART RECOMMENDATIONS
===================================== */

function generateRecommendations() {

    const recommendations = [];


    /* Attendance */

    const attendanceSubjects = [

        {
            name: "Computer Networks",
            percentage: 73
        },

        {
            name: "Mathematics III",
            percentage: 69
        }

    ];


    attendanceSubjects.forEach(
        subject => {

            if (
                subject.percentage < 75
            ) {

                recommendations.push({

                    type:
                        "attendance",

                    icon:
                        "◉",

                    title:
                        `Improve ${subject.name}`,

                    message:
                        `Your attendance is ${subject.percentage}%. Focus on upcoming classes.`

                });

            }

        }
    );


    /* Assignments */

    const assignments =
        smartGet(
            "bitCampusAssignments",
            []
        );


    assignments
        .filter(
            item =>
                item.status !==
                "Completed"
        )
        .slice(0, 2)
        .forEach(
            item => {

                recommendations.push({

                    type:
                        "assignment",

                    icon:
                        "☷",

                    title:
                        item.title,

                    message:
                        `Due on ${item.dueDate}. Complete it before the deadline.`

                });

            }
        );


    /* Placement */

    recommendations.push({

        type:
            "placement",

        icon:
            "↗",

        title:
            "Keep building your placement profile",

        message:
            "Practice DSA and update your project portfolio."

    });


    return recommendations.slice(
        0,
        5
    );

}


/* =====================================
   NOTIFICATION COUNT
===================================== */

function getUnreadNotificationCount() {

    const notifications =
        smartGet(
            "bitCampusReadNotifications",
            []
        );


    const generated =
        smartGet(
            "bitCampusGeneratedNotifications",
            []
        );


    const baseCount = 2;

    const total =
        baseCount +
        generated.length;


    return Math.max(
        0,
        total - notifications.length
    );

}


/* =====================================
   INITIALIZE
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initGlobalSearch();

        markStudyToday();

    }
);