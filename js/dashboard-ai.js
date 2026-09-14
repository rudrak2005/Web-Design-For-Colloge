/* =====================================================
   BITAI — DASHBOARD DAILY BRIEF
===================================================== */

(() => {

    "use strict";


    /* =================================================
       STORAGE
    ================================================= */

    const STORAGE = {

        session:
            "bitCampusSession",

        profile:
            "bitCampusProfile",

        assignments:
            "bitCampusAssignments",

        applications:
            "bitCampusApplications",

        library:
            "bitCampusIssuedBooks",

        registration:
            "bitCampusRegistration"

    };


    /* =================================================
       SAFE JSON
    ================================================= */

    function getJSON(
        key,
        fallback = null
    ) {

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


    /* =================================================
       STUDENT
    ================================================= */

    function getStudent() {

        const profile =
            getJSON(
                STORAGE.profile,
                {}
            );

        const session =
            getJSON(
                STORAGE.session,
                {}
            );

        return {

            name:
                profile?.name ||
                session?.name ||
                "Student",

            course:
                session?.course ||
                "B.Tech CSE"

        };

    }


    /* =================================================
       ATTENDANCE
    ================================================= */

    function getAttendanceData() {

        return [

            {
                subject:
                    "Data Structures & Algorithms",
                percentage: 84
            },

            {
                subject: "DBMS",
                percentage: 78
            },

            {
                subject: "Operating Systems",
                percentage: 91
            },

            {
                subject: "Computer Networks",
                percentage: 73
            },

            {
                subject: "Mathematics III",
                percentage: 69
            }

        ];

    }


    /* =================================================
       ASSIGNMENTS
    ================================================= */

    function getAssignmentData() {

        return getJSON(
            STORAGE.assignments,
            []
        ) || [];

    }


    /* =================================================
       APPLICATIONS
    ================================================= */

    function getApplicationData() {

        return getJSON(
            STORAGE.applications,
            []
        ) || [];

    }


    /* =================================================
       LIBRARY
    ================================================= */

    function getLibraryData() {

        return getJSON(
            STORAGE.library,
            []
        ) || [];

    }


    /* =================================================
       INSIGHTS
    ================================================= */

    function generateInsights() {

        const insights = [];


        /* Attendance */

        const attendance =
            getAttendanceData();

        const lowAttendance =
            attendance
                .filter(
                    item =>
                        item.percentage < 75
                )
                .sort(
                    (a, b) =>
                        a.percentage -
                        b.percentage
                );


        if (lowAttendance.length) {

            const subject =
                lowAttendance[0];

            insights.push({

                icon: "⚠",

                type: "warning",

                title:
                    "Attendance Alert",

                text:
                    `${subject.subject} is at ${subject.percentage}%.`

            });

        } else {

            insights.push({

                icon: "✓",

                type: "good",

                title:
                    "Attendance Healthy",

                text:
                    "Your subjects are currently above the safe threshold."

            });

        }


        /* Assignments */

        const assignments =
            getAssignmentData();

        const pending =
            assignments.filter(
                item =>
                    item.status !== "Completed"
            );

        const overdue =
            pending.filter(
                item =>
                    new Date(
                        item.dueDate
                    ) < new Date()
            );


        if (overdue.length) {

            insights.push({

                icon: "🚨",

                type: "warning",

                title:
                    "Overdue Assignment",

                text:
                    `${overdue.length} assignment${
                        overdue.length > 1
                            ? "s are"
                            : " is"
                    } overdue.`

            });

        } else {

            insights.push({

                icon: "📝",

                type: "info",

                title:
                    "Assignment Desk",

                text:
                    `${pending.length} pending assignment${
                        pending.length === 1
                            ? ""
                            : "s"
                    }.`

            });

        }


        /* Placement */

        const applications =
            getApplicationData();


        insights.push({

            icon: "💼",

            type: "good",

            title:
                "Placement Readiness",

            text:
                `72% readiness • ${applications.length} application${
                    applications.length === 1
                        ? ""
                        : "s"
                } tracked.`

        });


        /* Library */

        const books =
            getLibraryData();


        if (books.length) {

            insights.push({

                icon: "📚",

                type: "info",

                title:
                    "Library",

                text:
                    `${books.length} book${
                        books.length === 1
                            ? ""
                            : "s"
                    } currently issued.`

            });

        } else {

            insights.push({

                icon: "📚",

                type: "good",

                title:
                    "Library Clear",

                text:
                    "You have no currently issued books."

            });

        }


        return insights.slice(
            0,
            4
        );

    }


    /* =================================================
       TOP PRIORITY
    ================================================= */

    function getTopPriority() {

        const attendance =
            getAttendanceData()
                .filter(
                    item =>
                        item.percentage < 75
                )
                .sort(
                    (a, b) =>
                        a.percentage -
                        b.percentage
                );


        if (attendance.length) {

            return `
                Focus on <b>${attendance[0].subject}</b>.
                Your attendance is
                <b>${attendance[0].percentage}%</b>,
                which is below the 75% safe zone.
            `;

        }


        const assignments =
            getAssignmentData()
                .filter(
                    item =>
                        item.status !==
                        "Completed"
                )
                .sort(
                    (a, b) =>
                        new Date(a.dueDate) -
                        new Date(b.dueDate)
                );


        if (assignments.length) {

            return `
                Complete
                <b>${assignments[0].title}</b>
                before its deadline.
            `;

        }


        return `
            Your dashboard looks healthy.
            Keep your academic and placement
            momentum going.
        `;

    }


    /* =================================================
       DAILY PLAN
    ================================================= */

    function generateDailyPlan() {

        const attendance =
            getAttendanceData()
                .filter(
                    item =>
                        item.percentage < 75
                )
                .sort(
                    (a, b) =>
                        a.percentage -
                        b.percentage
                );


        const assignments =
            getAssignmentData()
                .filter(
                    item =>
                        item.status !==
                        "Completed"
                )
                .sort(
                    (a, b) =>
                        new Date(a.dueDate) -
                        new Date(b.dueDate)
                );


        const plan = [];


        if (assignments.length) {

            plan.push(
                `Finish ${assignments[0].title}`
            );

        } else {

            plan.push(
                "Review today's coursework"
            );

        }


        if (attendance.length) {

            plan.push(
                `Focus on ${attendance[0].subject}`
            );

        } else {

            plan.push(
                "Attend all scheduled classes"
            );

        }


        plan.push(
            "Practice DSA for 30 minutes"
        );

        plan.push(
            "Check BitCampus notifications"
        );


        return plan;

    }


    /* =================================================
       RENDER
    ================================================= */

    function renderBrief() {

        const student =
            getStudent();


        const nameElement =
            document.getElementById(
                "bitAIDashboardName"
            );


        if (nameElement) {

            nameElement.textContent =
                student.name;

        }


        /* Insights */

        const insightContainer =
            document.getElementById(
                "bitAIInsightGrid"
            );


        if (insightContainer) {

            insightContainer.innerHTML =
                generateInsights()
                    .map(
                        item => `

                            <article
                                class="
                                    bitai-insight
                                    ${item.type}
                                "
                            >

                                <div
                                    class="
                                        bitai-insight-icon
                                    "
                                >
                                    ${item.icon}
                                </div>

                                <div
                                    class="
                                        bitai-insight-title
                                    "
                                >
                                    ${item.title}
                                </div>

                                <div
                                    class="
                                        bitai-insight-text
                                    "
                                >
                                    ${item.text}
                                </div>

                            </article>

                        `
                    )
                    .join("");

        }


        /* Priority */

        const priority =
            document.getElementById(
                "bitAIPriority"
            );


        if (priority) {

            priority.innerHTML =
                getTopPriority();

        }


        /* Plan */

        const planContainer =
            document.getElementById(
                "bitAIPlan"
            );


        if (planContainer) {

            planContainer.innerHTML =
                generateDailyPlan()
                    .map(
                        (task, index) => `

                            <div
                                class="
                                    bitai-plan-item
                                "
                            >

                                <div
                                    class="
                                        bitai-plan-number
                                    "
                                >
                                    STEP ${index + 1}
                                </div>

                                <div
                                    class="
                                        bitai-plan-task
                                    "
                                >
                                    ${task}
                                </div>

                            </div>

                        `
                    )
                    .join("");

        }

    }


    /* =================================================
       BUTTONS
    ================================================= */

    function initButtons() {

        const refreshButton =
            document.getElementById(
                "bitAIRefresh"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                renderBrief
            );

        }


        const openChatButton =
            document.getElementById(
                "bitAIOpenChat"
            );


        if (openChatButton) {

            openChatButton.addEventListener(
                "click",
                () => {

                    const floatingButton =
                        document.getElementById(
                            "bitAIFloatingButton"
                        );

                    if (floatingButton) {

                        floatingButton.click();

                    }

                }
            );

        }

    }


    /* =================================================
       START
    ================================================= */

    function init() {

        renderBrief();

        initButtons();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();