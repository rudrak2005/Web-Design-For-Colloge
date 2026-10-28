/* =========================================================
   BITAI — BITCAMPUS FRONTEND AI ASSISTANT
   Backend-free / Rule-based / localStorage powered
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE = {
        profile: "bitCampusProfile",
        session: "bitCampusSession",
        assignments: "bitCampusAssignments",
        library: "bitCampusIssuedBooks",
        applications: "bitCampusApplications",
        registration: "bitCampusRegistration",
        grievances: "bitCampusGrievances",
        feedback: "bitCampusFeedback"
    };


    /* =====================================================
       SAFE STORAGE
    ===================================================== */

    function getJSON(key, fallback = null) {

        try {

            const value =
                localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            return JSON.parse(value);

        } catch {

            return fallback;

        }

    }


    /* =====================================================
       STUDENT
    ===================================================== */

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

            email:
                profile?.email ||
                session?.email ||
                "student@bitcampus.com",

            course:
                session?.course ||
                "B.Tech CSE",

            semester:
                session?.semester ||
                "Semester 3"

        };

    }


    /* =====================================================
       CURRENT PAGE
    ===================================================== */

    function getCurrentPage() {

        const path =
            window.location.pathname
                .toLowerCase();

        const page =
            path
                .split("/")
                .pop()
                .replace(".html", "");

        return page || "dashboard";

    }


    /* =====================================================
       PAGE INFORMATION
    ===================================================== */

    const PAGE_INFO = {

        dashboard: {
            title: "Dashboard",
            description:
                "Your main BitCampus student dashboard.",
            actions: [
                "What should I do today?",
                "Show my student details",
                "Show smart suggestions"
            ]
        },

        profile: {
            title: "Student Profile",
            description:
                "Your personal information, documents, admit card and settings.",
            actions: [
                "Tell me about my profile",
                "What is my profile completion?",
                "What can I do on this page?"
            ]
        },

        academics: {
            title: "Academics",
            description:
                "Academic performance, semester information and course progress.",
            actions: [
                "How is my academic performance?",
                "Tell me about my CGPA",
                "What can I do on this page?"
            ]
        },

        courses: {
            title: "Courses",
            description:
                "Your current courses and subject modules.",
            actions: [
                "Show my courses",
                "What can I do here?",
                "Which course should I focus on?"
            ]
        },

        attendance: {
            title: "Attendance",
            description:
                "Attendance percentage and smart attendance predictor.",
            actions: [
                "How is my attendance?",
                "Which subjects need attention?",
                "What can I do on this page?"
            ]
        },

        assignments: {
            title: "Assignments",
            description:
                "Assignment tracking, deadlines and completion status.",
            actions: [
                "What assignments are pending?",
                "What is due soon?",
                "What can I do here?"
            ]
        },

        timetable: {
            title: "Timetable",
            description:
                "Your weekly class schedule.",
            actions: [
                "What is my timetable?",
                "What is my next class?",
                "What can I do here?"
            ]
        },

        results: {
            title: "Results",
            description:
                "Marks, SGPA, CGPA and academic performance.",
            actions: [
                "Tell me about my results",
                "What is my CGPA?",
                "What can I do here?"
            ]
        },

        fees: {
            title: "Fees",
            description:
                "Fee status, payments and pending amount.",
            actions: [
                "What is my pending fee?",
                "When is my next fee due?",
                "What can I do here?"
            ]
        },

        registration: {
            title: "Registration",
            description:
                "Semester registration and academic registration details.",
            actions: [
                "What is my registration status?",
                "What can I do here?",
                "Tell me about my registration"
            ]
        },

        library: {
            title: "Library",
            description:
                "Books, borrowing, issued books and returns.",
            actions: [
                "What books have I issued?",
                "What can I do in the library?",
                "Do I have any library alerts?"
            ]
        },

        notices: {
            title: "Notices & News",
            description:
                "Campus announcements, events and important notices.",
            actions: [
                "What is this page?",
                "Tell me about campus notices",
                "What should I check here?"
            ]
        },

        notifications: {
            title: "Notifications",
            description:
                "Smart alerts generated from your campus activity.",
            actions: [
                "What notifications do I have?",
                "What needs my attention?",
                "What can I do here?"
            ]
        },

        placement: {
            title: "Placement & Career",
            description:
                "Jobs, internships, applications and placement preparation.",
            actions: [
                "How is my placement readiness?",
                "Show my applications",
                "What should I prepare?"
            ]
        },

        support: {
            title: "Student Support",
            description:
                "Feedback, grievances and important campus resources.",
            actions: [
                "How can I submit feedback?",
                "How can I raise a grievance?",
                "What can I do here?"
            ]
        }

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(text) {

        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatDate(dateValue) {

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       DATA READERS
    ===================================================== */

    function getAssignments() {

        return getJSON(
            STORAGE.assignments,
            []
        ) || [];

    }


    function getIssuedBooks() {

        return getJSON(
            STORAGE.library,
            []
        ) || [];

    }


    function getApplications() {

        return getJSON(
            STORAGE.applications,
            []
        ) || [];

    }


    function getRegistration() {

        return getJSON(
            STORAGE.registration,
            null
        );

    }


    function getGrievances() {

        return getJSON(
            STORAGE.grievances,
            []
        ) || [];

    }


    function getFeedback() {

        return getJSON(
            STORAGE.feedback,
            []
        ) || [];

    }


    /* =====================================================
       INTENT DETECTION
    ===================================================== */

    function normalize(text) {

        return text
            .toLowerCase()
            .trim()
            .replace(/[?!.,]/g, " ");

    }


    function contains(text, words) {

        return words.some(
            word =>
                text.includes(word)
        );

    }


    /* =====================================================
       ABOUT BITCAMPUS
    ===================================================== */

    function answerAboutBitCampus() {

        return `
            <strong>🏫 BitCampus</strong><br><br>

            BitCampus is a smart student portal designed
            to bring your campus activities into one place.

            <br><br>

            <span class="bitai-muted">
            Academics • Attendance • Assignments • Timetable
            • Results • Fees • Library • Notices • Placement
            • Student Support
            </span>
        `;

    }


    /* =====================================================
       ABOUT STUDENT
    ===================================================== */

    function answerAboutStudent() {

        const student =
            getStudent();

        const profile =
            getJSON(
                STORAGE.profile,
                {}
            );

        return `
            <strong>👤 Student Snapshot</strong><br><br>

            <b>Name:</b>
            ${escapeHTML(student.name)}<br>

            <b>Course:</b>
            ${escapeHTML(student.course)}<br>

            <b>Semester:</b>
            ${escapeHTML(student.semester)}<br>

            <b>Email:</b>
            ${escapeHTML(student.email)}<br>

            ${
                profile?.phone
                    ? `<b>Phone:</b> ${escapeHTML(profile.phone)}<br>`
                    : ""
            }

            <br>

            <span class="bitai-muted">
            Ask me "how is my attendance?" or
            "show my assignments" to know more.
            </span>
        `;

    }


    /* =====================================================
       PAGE CONTEXT
    ===================================================== */

    function answerCurrentPage() {

        const page =
            getCurrentPage();

        const info =
            PAGE_INFO[page] ||
            PAGE_INFO.dashboard;

        return `
            <strong>📍 ${info.title}</strong><br><br>

            ${info.description}

            <br><br>

            <span class="bitai-muted">
            You can ask me questions about this page,
            your student data, or BitCampus.
            </span>
        `;

    }


    /* =====================================================
       ATTENDANCE
    ===================================================== */

    function answerAttendance() {

        const subjects = [

            {
                name: "Data Structures & Algorithms",
                percentage: 84
            },

            {
                name: "DBMS",
                percentage: 78
            },

            {
                name: "Operating Systems",
                percentage: 91
            },

            {
                name: "Computer Networks",
                percentage: 73
            },

            {
                name: "Mathematics III",
                percentage: 69
            }

        ];

        const average =
            Math.round(
                subjects.reduce(
                    (sum, item) =>
                        sum + item.percentage,
                    0
                ) / subjects.length
            );

        const problemSubjects =
            subjects.filter(
                item =>
                    item.percentage < 75
            );

        return `
            <strong>📊 Attendance Summary</strong><br><br>

            <b>Overall:</b> ${average}%<br><br>

            ${
                problemSubjects.length
                    ? `
                        <b>Needs attention:</b><br>
                        ${problemSubjects
                            .map(
                                item =>
                                    `⚠ ${item.name}: ${item.percentage}%`
                            )
                            .join("<br>")}
                      `
                    : `
                        ✅ All subjects are currently
                        above the safe threshold.
                      `
            }

            <br><br>

            <span class="bitai-muted">
            Keep attending upcoming classes, especially
            subjects below 75%.
            </span>
        `;

    }


    /* =====================================================
       ASSIGNMENTS
    ===================================================== */

    function answerAssignments() {

        const assignments =
            getAssignments();

        const pending =
            assignments.filter(
                item =>
                    item.status !== "Completed"
            );

        const overdue =
            pending.filter(
                item => {

                    const due =
                        new Date(
                            item.dueDate
                        );

                    return due < new Date();

                }
            );

        const upcoming =
            pending
                .filter(
                    item =>
                        !overdue.includes(item)
                )
                .slice(0, 5);

        let html =
            `<strong>📝 Assignment Desk</strong><br><br>`;

        html +=
            `<b>Total:</b> ${assignments.length}<br>`;

        html +=
            `<b>Pending:</b> ${pending.length}<br>`;

        html +=
            `<b>Overdue:</b> ${overdue.length}<br><br>`;


        if (upcoming.length) {

            html +=
                `<b>Upcoming:</b><br>`;

            html +=
                upcoming
                    .map(
                        item =>
                            `• ${escapeHTML(item.title)}
                             — ${formatDate(item.dueDate)}`
                    )
                    .join("<br>");

        } else {

            html +=
                `✅ No upcoming pending assignments found.`;

        }

        return html;

    }


    /* =====================================================
       RESULTS
    ===================================================== */

    function answerResults() {

        return `
            <strong>🏆 Academic Results</strong><br><br>

            <b>Current SGPA:</b> 8.20<br>

            <b>CGPA:</b> 8.34<br>

            <b>Percentage:</b> 79.23%<br>

            <b>Credits:</b> 42<br><br>

            <span class="bitai-muted">
            Your prototype dashboard currently shows
            DBMS as one of your strongest subjects.
            </span>
        `;

    }


    /* =====================================================
       FEES
    ===================================================== */

    function answerFees() {

        return `
            <strong>💰 Fee Status</strong><br><br>

            <b>Total Fee:</b> ₹80,000<br>

            <b>Paid:</b> ₹43,600<br>

            <b>Pending:</b> ₹36,400<br>

            <b>Next Due:</b> 30 Sep 2026<br>

            <b>Next Payment:</b> ₹20,000<br><br>

            <span class="bitai-muted">
            Payment gateway is not connected yet;
            this is currently a frontend prototype.
            </span>
        `;

    }


    /* =====================================================
       COURSES
    ===================================================== */

    function answerCourses() {

        const courses = [

            "Data Structures & Algorithms",

            "DBMS",

            "Operating Systems",

            "Computer Networks",

            "Mathematics III",

            "Web Development"

        ];

        return `
            <strong>📚 Your Courses</strong><br><br>

            ${courses
                .map(
                    (course, index) =>
                        `${index + 1}. ${course}`
                )
                .join("<br>")}
        `;

    }


    /* =====================================================
       LIBRARY
    ===================================================== */

    function answerLibrary() {

        const books =
            getIssuedBooks();

        if (!books.length) {

            return `
                <strong>📚 Library</strong><br><br>

                You currently have
                <b>0 issued books</b>.

                <br><br>

                You can search available books,
                issue a book and return borrowed books.
            `;

        }

        return `
            <strong>📚 Issued Books</strong><br><br>

            ${
                books
                    .map(
                        book =>
                            `• ${escapeHTML(book.title)}
                             <br>&nbsp;&nbsp;Due:
                             ${formatDate(book.dueDate)}`
                    )
                    .join("<br>")
            }
        `;

    }


    /* =====================================================
       PLACEMENT
    ===================================================== */

    function answerPlacement() {

        const applications =
            getApplications();

        return `
            <strong>💼 Placement Snapshot</strong><br><br>

            <b>Placement Readiness:</b> 72%<br>

            <b>Applications:</b>
            ${applications.length}<br>

            <b>DSA:</b> 72%<br>

            <b>Aptitude:</b> 61%<br>

            <b>CS Core:</b> 76%<br>

            <b>Interview:</b> 58%<br><br>

            <span class="bitai-muted">
            Recommendation: keep improving DSA and
            interview preparation.
            </span>
        `;

    }


    /* =====================================================
       TIMETABLE
    ===================================================== */

    function answerTimetable() {

        return `
            <strong>🗓️ Timetable</strong><br><br>

            The BitCampus timetable contains your weekly
            classes from Monday to Saturday.

            <br><br>

            Example Monday:

            <br>09:00 — DBMS
            <br>10:00 — Mathematics III
            <br>11:00 — DBMS Lab
            <br>14:00 — Computer Networks
            <br>16:00 — Web Development

            <br><br>

            <span class="bitai-muted">
            Open Timetable for the live schedule.
            </span>
        `;

    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    function answerNotifications() {

        const assignments =
            getAssignments();

        const alerts = [];

        if (
            assignments.some(
                item =>
                    item.status !== "Completed"
            )
        ) {

            alerts.push(
                "📝 You have pending assignments."
            );

        }

        alerts.push(
            "⚠ Mathematics III attendance is below 75%."
        );

        alerts.push(
            "⚠ Computer Networks attendance is below 75%."
        );

        alerts.push(
            "💼 Keep improving your placement preparation."
        );

        return `
            <strong>🔔 Smart Alerts</strong><br><br>

            ${alerts.join("<br><br>")}
        `;

    }


    /* =====================================================
       PROFILE
    ===================================================== */

    function answerProfile() {

        const student =
            getStudent();

        const profile =
            getJSON(
                STORAGE.profile,
                {}
            );

        let completion = 40;

        if (profile.phone) {
            completion += 20;
        }

        if (profile.emergency) {
            completion += 20;
        }

        if (profile.address) {
            completion += 20;
        }

        return `
            <strong>👤 Profile</strong><br><br>

            <b>Name:</b>
            ${escapeHTML(student.name)}<br>

            <b>Course:</b>
            ${escapeHTML(student.course)}<br>

            <b>Semester:</b>
            ${escapeHTML(student.semester)}<br>

            <b>Completion:</b>
            ${completion}%<br><br>

            ${
                completion < 100
                    ? `⚠ Add your missing contact
                       information to complete your profile.`
                    : `✅ Your profile is complete.`
            }
        `;

    }


    /* =====================================================
       REGISTRATION
    ===================================================== */

    function answerRegistration() {

        const registration =
            getRegistration();

        if (!registration) {

            return `
                <strong>📋 Registration</strong><br><br>

                Your registration form has not been
                submitted in this prototype yet.
            `;

        }

        return `
            <strong>📋 Registration</strong><br><br>

            <b>Status:</b>
            ${escapeHTML(
                registration.status ||
                "Submitted"
            )}<br>

            ${
                registration.registrationId
                    ? `
                        <b>ID:</b>
                        ${escapeHTML(
                            registration.registrationId
                        )}
                      `
                    : ""
            }
        `;

    }


    /* =====================================================
       SUPPORT
    ===================================================== */

    function answerSupport() {

        const grievances =
            getGrievances();

        const feedback =
            getFeedback();

        return `
            <strong>🛟 Student Support</strong><br><br>

            <b>Feedback Submitted:</b>
            ${feedback.length}<br>

            <b>Grievances:</b>
            ${grievances.length}<br><br>

            You can submit feedback, raise a grievance,
            track your tickets and open important campus
            resources.
        `;

    }


    /* =====================================================
       SMART TODAY
    ===================================================== */

    function answerToday() {

        const assignments =
            getAssignments();

        const pending =
            assignments.filter(
                item =>
                    item.status !== "Completed"
            ).length;

        return `
            <strong>🤖 Your BitAI Daily Brief</strong><br><br>

            👋 Hello ${escapeHTML(
                getStudent().name
            )}!

            <br><br>

            <b>Today's focus:</b>

            <br>1. Check assignments
            <br>2. Improve low attendance subjects
            <br>3. Practice DSA
            <br>4. Check campus notifications

            <br><br>

            <b>Pending assignments:</b>
            ${pending}

            <br><br>

            <span class="bitai-muted">
            Small progress every day adds up.
            </span>
        `;

    }


    /* =====================================================
       MAIN RESPONSE ENGINE
    ===================================================== */

    function getResponse(input) {

        const text =
            normalize(input);


        if (!text) {

            return `
                👋 I'm BitAI.

                Ask me something about BitCampus
                or your student dashboard.
            `;

        }


        /* Greeting */

        if (
            contains(
                text,
                [
                    "hi",
                    "hello",
                    "hey",
                    "hii",
                    "namaste",
                    "good morning",
                    "good evening"
                ]
            )
        ) {

            return `
                <strong>👋 Hey ${escapeHTML(
                    getStudent().name
                )}!</strong><br><br>

                Welcome back to <b>BitCampus</b>.

                <br><br>

                I'm <b>BitAI</b>, your campus assistant.

                <br><br>

                Try asking:

                <br>• "About this page"
                <br>• "Tell me about me"
                <br>• "How is my attendance?"
                <br>• "What assignments are pending?"
                <br>• "How is my placement?"
            `;

        }


        /* Thanks */

        if (
            contains(
                text,
                [
                    "thank",
                    "thanks"
                ]
            )
        ) {

            return `
                😊 You're welcome!

                <br><br>

                I'm here whenever you need help
                navigating BitCampus.
            `;

        }


        /* About BitCampus */

        if (
            contains(
                text,
                [
                    "what is bitcampus",
                    "about bitcampus",
                    "what is this website",
                    "what is this portal",
                    "about this portal"
                ]
            )
        ) {

            return answerAboutBitCampus();

        }


        /* About current page */

        if (
            contains(
                text,
                [
                    "about this page",
                    "what is this page",
                    "what can i do here",
                    "what can i do on this page",
                    "explain this page"
                ]
            )
        ) {

            return answerCurrentPage();

        }


        /* About student */

        if (
            contains(
                text,
                [
                    "about me",
                    "tell me about me",
                    "my details",
                    "my information",
                    "who am i"
                ]
            )
        ) {

            return answerAboutStudent();

        }


        /* Today */

        if (
            contains(
                text,
                [
                    "what should i do today",
                    "today",
                    "daily plan",
                    "what should i study"
                ]
            )
        ) {

            return answerToday();

        }


        /* Attendance */

        if (
            contains(
                text,
                [
                    "attendance",
                    "present",
                    "absent",
                    "attendance percentage"
                ]
            )
        ) {

            return answerAttendance();

        }


        /* Assignment */

        if (
            contains(
                text,
                [
                    "assignment",
                    "assignments",
                    "homework",
                    "deadline"
                ]
            )
        ) {

            return answerAssignments();

        }


        /* Results */

        if (
            contains(
                text,
                [
                    "result",
                    "results",
                    "cgpa",
                    "sgpa",
                    "marks",
                    "percentage"
                ]
            )
        ) {

            return answerResults();

        }


        /* Fees */

        if (
            contains(
                text,
                [
                    "fee",
                    "fees",
                    "payment",
                    "pending fee"
                ]
            )
        ) {

            return answerFees();

        }


        /* Courses */

        if (
            contains(
                text,
                [
                    "course",
                    "courses",
                    "subject",
                    "subjects"
                ]
            )
        ) {

            return answerCourses();

        }


        /* Library */

        if (
            contains(
                text,
                [
                    "library",
                    "book",
                    "books",
                    "issued book"
                ]
            )
        ) {

            return answerLibrary();

        }


        /* Placement */

        if (
            contains(
                text,
                [
                    "placement",
                    "job",
                    "jobs",
                    "internship",
                    "career",
                    "resume"
                ]
            )
        ) {

            return answerPlacement();

        }


        /* Timetable */

        if (
            contains(
                text,
                [
                    "timetable",
                    "schedule",
                    "class",
                    "classes",
                    "next class"
                ]
            )
        ) {

            return answerTimetable();

        }


        /* Notifications */

        if (
            contains(
                text,
                [
                    "notification",
                    "notifications",
                    "alert",
                    "alerts"
                ]
            )
        ) {

            return answerNotifications();

        }


        /* Profile */

        if (
            contains(
                text,
                [
                    "profile",
                    "phone",
                    "address",
                    "emergency contact"
                ]
            )
        ) {

            return answerProfile();

        }


        /* Registration */

        if (
            contains(
                text,
                [
                    "registration",
                    "register",
                    "semester registration"
                ]
            )
        ) {

            return answerRegistration();

        }


        /* Support */

        if (
            contains(
                text,
                [
                    "feedback",
                    "grievance",
                    "complaint",
                    "support",
                    "help desk"
                ]
            )
        ) {

            return answerSupport();

        }


        /* Fallback */

        return `
            🤔 I'm still learning.

            <br><br>

            Try asking me:

            <br>• About BitCampus
            <br>• About this page
            <br>• About me
            <br>• My attendance
            <br>• My assignments
            <br>• My results
            <br>• My fees
            <br>• My library books
            <br>• My placement
            <br>• What should I do today?

            <br><br>

            <span class="bitai-muted">
            This version works without a backend.
            </span>
        `;

    }


    /* =====================================================
       UI
    ===================================================== */

    function createAssistant() {

        if (
            document.getElementById(
                "bitAIWidget"
            )
        ) {
            return;
        }


        const root =
            document.createElement("div");

        root.id =
            "bitAIWidget";


        root.innerHTML = `

            <button
                id="bitAIFloatingButton"
                class="bitai-floating-button"
                aria-label="Open BitAI"
            >
                🤖
            </button>


            <section
                id="bitAIWindow"
                class="bitai-window"
                aria-hidden="true"
            >

                <header class="bitai-header">

                    <div>

                        <div class="bitai-brand">
                            🤖 BITAI
                        </div>

                        <div class="bitai-status">
                            CAMPUS INTELLIGENCE CORE • ONLINE
                        </div>

                    </div>

                    <button
                        id="bitAIClose"
                        class="bitai-close"
                    >
                        ×
                    </button>

                </header>


                <div
                    id="bitAIQuickActions"
                    class="bitai-quick-actions"
                ></div>


                <div
                    id="bitAIConversation"
                    class="bitai-conversation"
                ></div>


                <form
                    id="bitAIForm"
                    class="bitai-input-area"
                >

                    <input
                        id="bitAIInput"
                        type="text"
                        autocomplete="off"
                        placeholder="Ask BitAI..."
                    >

                    <button
                        type="submit"
                    >
                        →
                    </button>

                </form>

            </section>

        `;


        document.body.appendChild(
            root
        );


        initAssistant();

    }


    /* =====================================================
       MESSAGES
    ===================================================== */

    function addMessage(
        content,
        type = "ai"
    ) {

        const conversation =
            document.getElementById(
                "bitAIConversation"
            );

        if (!conversation) {
            return;
        }


        const message =
            document.createElement(
                "div"
            );

        message.className =
            `bitai-message ${type}`;


        message.innerHTML = `
            <div class="bitai-message-label">
                ${
                    type === "user"
                        ? "YOU"
                        : "BITAI"
                }
            </div>

            <div class="bitai-message-content">
                ${content}
            </div>
        `;


        conversation.appendChild(
            message
        );


        conversation.scrollTop =
            conversation.scrollHeight;

    }


    /* =====================================================
       TYPING
    ===================================================== */

    function showTyping() {

        const conversation =
            document.getElementById(
                "bitAIConversation"
            );

        if (!conversation) {
            return;
        }


        const typing =
            document.createElement(
                "div"
            );

        typing.id =
            "bitAITyping";

        typing.className =
            "bitai-message ai";


        typing.innerHTML = `
            <div class="bitai-message-label">
                BITAI
            </div>

            <div class="bitai-typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;


        conversation.appendChild(
            typing
        );


        conversation.scrollTop =
            conversation.scrollHeight;

    }


    function hideTyping() {

        const typing =
            document.getElementById(
                "bitAITyping"
            );

        if (typing) {
            typing.remove();
        }

    }


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    function renderQuickActions() {

        const container =
            document.getElementById(
                "bitAIQuickActions"
            );

        if (!container) {
            return;
        }


        const page =
            getCurrentPage();

        const info =
            PAGE_INFO[page] ||
            PAGE_INFO.dashboard;


        const actions = [
            "About this page",
            "Tell me about me",
            "How is my attendance?",
            ...info.actions
        ];


        const unique =
            [...new Set(actions)]
                .slice(0, 5);


        container.innerHTML =
            unique
                .map(
                    action =>
                        `
                        <button
                            type="button"
                            class="bitai-chip"
                            data-bitai-action="${escapeHTML(
                                action
                            )}"
                        >
                            ${escapeHTML(action)}
                        </button>
                        `
                )
                .join("");


        container
            .querySelectorAll(
                "[data-bitai-action]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            sendMessage(
                                button.dataset
                                    .bitaiAction
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    function sendMessage(text) {

        const input =
            document.getElementById(
                "bitAIInput"
            );

        if (input) {
            input.value = "";
        }


        addMessage(
            escapeHTML(text),
            "user"
        );


        showTyping();


        setTimeout(
            () => {

                hideTyping();

                addMessage(
                    getResponse(text),
                    "ai"
                );

            },
            450
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function initAssistant() {

        const openButton =
            document.getElementById(
                "bitAIFloatingButton"
            );

        const closeButton =
            document.getElementById(
                "bitAIClose"
            );

        const windowElement =
            document.getElementById(
                "bitAIWindow"
            );

        const form =
            document.getElementById(
                "bitAIForm"
            );


        openButton.addEventListener(
            "click",
            () => {

                windowElement.classList.add(
                    "show"
                );

                windowElement.setAttribute(
                    "aria-hidden",
                    "false"
                );

                const input =
                    document.getElementById(
                        "bitAIInput"
                    );

                setTimeout(
                    () => input?.focus(),
                    100
                );

            }
        );


        closeButton.addEventListener(
            "click",
            () => {

                windowElement.classList.remove(
                    "show"
                );

                windowElement.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );


        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const input =
                    document.getElementById(
                        "bitAIInput"
                    );


                const value =
                    input.value.trim();


                if (!value) {
                    return;
                }


                sendMessage(
                    value
                );

            }
        );


        renderQuickActions();


        addMessage(
            `
                <strong>
                    👋 Hey ${escapeHTML(
                        getStudent().name
                    )}!
                </strong>

                <br><br>

                I'm <b>BitAI</b>, your
                BitCampus assistant.

                <br><br>

                Ask me about this page,
                your student information,
                attendance, assignments,
                results, placement or anything
                available in the portal.
            `,
            "ai"
        );

    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            createAssistant
        );

    } else {

        createAssistant();

    }


    /* =====================================================
       EXPOSE FOR TESTING
    ===================================================== */

    window.BitAI = {

        ask:
            getResponse,

        student:
            getStudent,

        currentPage:
            getCurrentPage

    };

})();