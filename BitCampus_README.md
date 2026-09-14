# BitCampus

> **LEARN • TRACK • GROW • BELONG**

BitCampus is a frontend-first **Smart Student Portal / Student OS** designed to bring a student's academic, campus, career, and support activities into one place.

The project combines a **retro campus / old-computer aesthetic** with a modern dashboard experience and a lightweight, backend-free smart layer.

---

## Overview

BitCampus is a prototype student portal created to explore what a modern college portal could look and feel like when academic management, student services, career preparation, and intelligent recommendations are combined in one interface.

It brings together:

- Student Profile
- Academics
- Courses
- Attendance
- Assignments
- Timetable
- Results
- Fees
- Registration
- Library
- Notices & News
- Smart Notifications
- Placement & Internships
- Feedback
- Grievance
- Important Links
- Admit Card
- Documents
- Profile Settings
- BitAI
- Dashboard Intelligence

---

## Project Vision

### Problem

Traditional student portals often separate academic information, campus services, career opportunities, and student support into different sections or systems.

This can make it difficult for students to understand:

- What needs attention now
- What deadlines are approaching
- How their academic performance is progressing
- Which campus services are relevant
- How ready they are for placements

### Vision

BitCampus aims to create a **single student workspace** where a student can:

1. Understand their academic situation.
2. Track deadlines and responsibilities.
3. Manage campus activities.
4. Discover jobs and internships.
5. Access student support.
6. Get personalized recommendations.
7. Ask a built-in assistant for help.

The long-term vision is to evolve BitCampus from a simple college portal into a **Smart Student OS**.

---

## Core Features

### Dashboard

- Personalized welcome section
- Current date and time
- Attendance overview
- Assignment summary
- Exam countdown
- Fee summary
- Quick links
- Today's schedule
- Latest notices
- Course progress
- Smart recommendations
- BitAI Daily Campus Brief

### Student Profile

- Personal information
- Student identity
- Course and semester
- Contact information
- Emergency contact
- Address
- Profile completion
- Profile editing
- Documents
- Admit card
- Profile preferences

### Academics

- Current CGPA
- Semester information
- Credits
- Course progress
- Academic performance
- Performance summary
- Achievements

### Courses

- Course cards
- Course progress
- Credits
- Faculty information
- Course filtering
- Course detail modal
- Module status

### Attendance

- Overall attendance
- Subject-wise attendance
- Present/absent counts
- Attendance history
- Safe-zone indicator
- Attendance predictor

The prototype predictor is based on:

```text
(present + x) / (held + x) >= target
```

### Assignments

- Pending / in-progress / completed status
- Search and filters
- Add assignment
- Delete assignment
- Mark complete
- Overdue detection
- Persistent localStorage data

Storage key:

```text
bitCampusAssignments
```

### Timetable

- Daily schedule
- Weekly timetable
- Current class detection
- Next class
- Countdown
- Day filters
- Live-now indicator

### Results

- SGPA
- CGPA
- Percentage
- Credits
- Marksheet
- Grade points
- Performance visualization
- Strongest/weakest subject
- SGPA calculator

The prototype calculator uses:

```text
SGPA = Σ(Grade Point × Credit) / Σ Credits
```

### Fees

- Total fee
- Paid fee
- Pending fee
- Payment progress
- Next due date
- Fee breakdown
- Transaction history
- Receipt modal
- Demo Pay Now action

Real payment processing is not connected.

### Registration

Five-step workflow:

1. Personal
2. Course
3. Subjects
4. Documents
5. Review

Registration data is stored locally and can generate a prototype registration ID.

### Library

- Book search
- Category filter
- Availability
- Issue book
- Return book
- Issued books
- Due dates
- Fine estimation

### Notices & News

- Academic notices
- Examination notices
- Events
- Important alerts
- Search
- Category filter
- Read/unread tracking
- Notice detail modal

### Smart Notifications

Frontend rules can generate alerts for:

- Low attendance
- Upcoming assignments
- Overdue assignments
- Fee deadlines
- Exam reminders
- Library due dates
- Campus notices
- Placement activity

### Placement & Career

- Placement readiness
- Jobs
- Internships
- Company information
- Location
- Salary/stipend
- Required skills
- Eligibility
- Application tracking
- Placement preparation
- Resume readiness

Storage key:

```text
bitCampusApplications
```

### Student Support

#### Feedback

- Feedback type
- Rating
- Feedback message

#### Grievance

- Category
- Subject
- Description
- Generated ticket ID
- Status tracking

#### Important Links

Central access to important portal modules and resources.

### Admit Card

Prototype admit card includes:

- Student name
- Student ID
- Course
- Semester
- Exam center
- Instructions
- Print/save workflow

### Documents

Prototype document vault includes:

- Student ID
- Class 10 marksheet
- Class 12 marksheet
- Student photograph

Actual file upload is not connected to a backend.

---

## BitAI

**BitAI — BitCampus Assistant** is the project's frontend-only assistant.

It is designed to answer common portal questions such as:

```text
Hi
What is BitCampus?
About this page
Tell me about me
How is my attendance?
What assignments are pending?
What is my CGPA?
What is my pending fee?
Show my courses
What books have I issued?
How is my placement?
What is my timetable?
What notifications do I have?
Tell me about my profile
What is my registration status?
How can I submit feedback?
```

### BitAI data sources

BitAI can use:

- Current page context
- Student session
- Profile
- Assignments
- Library data
- Placement applications
- Registration
- Feedback
- Grievances

### Current architecture

```text
                 BitAI
                   |
        +----------+----------+
        |                     |
   Intent Engine         Portal Data
        |                     |
    JavaScript             localStorage
        |                     |
        +----------+----------+
                   |
                Response
```

This is a rule-based assistant in the current version, not a remote LLM.

---

## Dashboard BitAI

The dashboard also has a dedicated:

> **BitAI / Daily Campus Brief**

It summarizes the student's current situation and can highlight:

- Attendance risks
- Pending assignments
- Placement readiness
- Library state
- Current priorities
- Suggested daily tasks

Example:

```text
BITAI'S TOP PRIORITY

Focus on Mathematics III.
Your attendance is 69%, which is below
the 75% safe zone.
```

Example daily plan:

```text
1. Finish DBMS Assignment
2. Focus on Mathematics III
3. Practice DSA for 30 minutes
4. Check BitCampus notifications
```

---

## Smart Layer

### Global Search

The dashboard search can locate:

- Dashboard
- Profile
- Academics
- Courses
- Attendance
- Assignments
- Timetable
- Results
- Fees
- Registration
- Library
- Notices
- Notifications
- Placement
- Student Support

### Smart Recommendations

Recommendations can be generated from:

- Attendance
- Assignments
- Placement preparation
- Notifications

### Exam Countdown

A configured exam date is used to show a live countdown.

### Study Streak

A local study streak is persisted using localStorage.

### Smart Alerts

Dashboard can show the number of unread/important signals.

---

## UI/UX Design

BitCampus intentionally combines:

```text
45% Retro / Vintage
25% Old Computer / Browser UI
20% Modern Dashboard UX
10% Hand-drawn / Scrapbook
```

### Design language

- Parchment backgrounds
- Paper-like panels
- Strong dark borders
- Tape/stamp motifs
- Campus notice-board feeling
- Retro computer references
- Modern readable layouts

### Color palette

| Color | Hex |
|---|---|
| Parchment | `#F2E4C4` |
| Paper | `#FFF4D6` |
| Ink | `#28231F` |
| Brown | `#4B3625` |
| Dusty Pink | `#E7A7B7` |
| Mint | `#9FD6B5` |
| Lavender | `#B7A9D6` |
| Mustard | `#E2B84B` |
| Red | `#D76B61` |

---

## Project Structure

```text
bitcampus/
│
├── index.html
├── login.html
│
├── pages/
│   ├── dashboard.html
│   ├── profile.html
│   ├── academics.html
│   ├── courses.html
│   ├── attendance.html
│   ├── assignments.html
│   ├── timetable.html
│   ├── results.html
│   ├── fees.html
│   ├── registration.html
│   ├── library.html
│   ├── notices.html
│   ├── notifications.html
│   ├── placement.html
│   └── support.html
│
├── css/
│   ├── login.css
│   ├── dashboard.css
│   ├── pages.css
│   ├── bitai.css
│   └── dashboard-ai.css
│
├── js/
│   ├── auth.js
│   ├── dashboard.js
│   ├── smart.js
│   ├── bitai.js
│   └── dashboard-ai.js
│
├── assets/
│   ├── images/
│   └── icons/
│
├── .gitignore
└── README.md
```

> Some pages may still contain page-specific inline CSS/JavaScript while the project is being cleaned and integrated.

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Browser APIs

- DOM APIs
- localStorage
- sessionStorage
- Browser Print API

### Current architecture

```text
HTML
  +
CSS
  +
Vanilla JavaScript
  +
localStorage / sessionStorage
```

No backend is required for the current prototype.

---

## Authentication

The current login is a **temporary frontend-only authentication system**.

Demo credentials currently include:

```text
Email:
student@bitcampus.com

Password:
123456
```

and:

```text
Email:
rudraksh@bitcampus.com

Password:
bitcampus123
```

Session key:

```text
bitCampusSession
```

The implementation is for prototyping only and should not be treated as production authentication.

---

## Local Storage

Important prototype storage keys include:

```text
bitCampusSession
bitCampusProfile
bitCampusProfileSettings
bitCampusAssignments
bitCampusIssuedBooks
bitCampusApplications
bitCampusRegistration
bitCampusReadNotices
bitCampusReadNotifications
bitCampusGeneratedNotifications
bitCampusFeedback
bitCampusGrievances
bitCampusStudyStreak
bitCampusStudyPlanner
```

This lets the prototype preserve changes after refresh.

---

## Smart Feature Flow

### Attendance

```text
Attendance Data
      ↓
Threshold Check
      ↓
Below 75%?
      ↓
Smart Alert
      ↓
Recommendation
```

### Assignments

```text
Assignment Data
      ↓
Due Date Check
      ↓
Upcoming / Overdue
      ↓
Notification
      ↓
Dashboard Recommendation
```

### Library

```text
Issued Book
      ↓
Due Date
      ↓
Due Soon / Overdue
      ↓
Smart Notification
```

### Placement

```text
Preparation Scores
        +
Applications
        ↓
Placement Readiness
        ↓
Career Recommendation
```

---

## Demo Data

The prototype contains sample data for:

- Student profile
- Courses
- Attendance
- Results
- Fees
- Timetable
- Assignments
- Library
- Notices
- Placement
- Student support

This is demonstration data, not real university records.

---

## Getting Started

### Clone

```bash
git clone https://github.com/rudrak2005/Web-Design-For-Colloge.git
```

### Enter project

```bash
cd Web-Design-For-Colloge
```

### Run

Recommended development setup:

- VS Code
- Live Server extension

Open:

```text
index.html
```

Recommended flow:

```text
index.html
    ↓
login.html
    ↓
pages/dashboard.html
```

---

## Git Workflow

```bash
git status
git add .
git commit -m "feat: update BitCampus"
git push origin main
```

If the remote contains commits that do not exist locally:

```bash
git pull origin main --allow-unrelated-histories
```

Resolve conflicts if necessary, then:

```bash
git add .
git commit -m "merge remote changes"
git push origin main
```

---

## Deployment

BitCampus is currently a static frontend project and can be deployed using static hosting such as:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

Before deployment:

- Verify all relative paths
- Test every internal link
- Test login/logout
- Check localStorage behavior
- Check responsive views
- Check browser console
- Remove unused development files
- Add favicon and final metadata

---

## Current Limitations

BitCampus is currently a **frontend prototype**.

Not connected to a real backend:

- Real authentication
- University database
- Payment gateway
- Email notifications
- Push notifications
- Real document storage
- Real library database
- University APIs
- Placement APIs
- Real LLM inference

BitAI currently uses frontend rules and local portal data.

---

## Security Notes

Do not commit:

```text
.env
.env.*
API keys
Database passwords
JWT secrets
Private access tokens
Production credentials
```

Frontend demo credentials should never be reused for production.

A production version should use secure server-side authentication and authorization.

---

## Roadmap

### Phase 1 — Frontend Portal

- [x] Dashboard
- [x] Student Profile
- [x] Academics
- [x] Courses
- [x] Attendance
- [x] Assignments
- [x] Timetable
- [x] Results
- [x] Fees
- [x] Registration
- [x] Library
- [x] Notices
- [x] Notifications
- [x] Placement
- [x] Feedback
- [x] Grievance
- [x] Important Links
- [x] Admit Card
- [x] Documents
- [x] Profile Settings

### Phase 2 — Smart Student OS

- [x] BitAI prototype
- [x] Dashboard BitAI
- [x] Global Search
- [x] Smart Notifications
- [x] Smart Recommendations
- [x] Exam Countdown
- [x] Study Streak

Planned:

- [ ] AI Study Planner
- [ ] Student Risk Engine
- [ ] Academic Health Score
- [ ] Smart Exam Center
- [ ] Career Match Engine
- [ ] Focus Mode / Pomodoro
- [ ] XP / Gamification
- [ ] Digital Student Twin
- [ ] Command-based navigation

### Phase 3 — Backend

Potential future architecture:

```text
Frontend
   ↓
Node.js / Express or FastAPI
   ↓
Database
   ↓
Authentication
   ↓
Notification Services
```

Possible backend features:

- Secure authentication
- Role-based access
- Student database
- Faculty database
- Course database
- Attendance API
- Assignment API
- Fee API
- Library API
- Notification service
- Admin dashboard

### Phase 4 — Real AI

Future BitAI can connect to:

- Local LLM
- Ollama
- Hosted LLM APIs
- RAG / campus knowledge base
- Student-specific context

Possible architecture:

```text
                 BitAI
                   |
           AI Orchestration
                   |
        +----------+----------+
        |                     |
   Student Data         Campus Knowledge
        |                     |
     Database              RAG / KB
        |                     |
        +----------+----------+
                   |
                  LLM
```

---

## Project Status

**Status:** Frontend Smart Student Portal Prototype

Current focus:

- Final UI integration
- BitAI improvements
- Dashboard intelligence
- Responsive design
- CSS/layout cleanup
- Testing
- Deployment readiness

---

## Author

**Rudraksh Kumar**

GitHub:

https://github.com/rudrak2005

Project Repository:

https://github.com/rudrak2005/Web-Design-For-Colloge

---

## Final Vision

BitCampus is intended to become more than a college portal.

```text
              BITCAMPUS
           SMART STUDENT OS
                    |
       +------------+------------+
       |            |            |
   Academics      Campus       Career
       |            |            |
 Attendance       Notices     Placement
 Courses          Library     Internships
 Results          Fees        Applications
 Assignments      Registration Preparation
       |            |            |
       +------------+------------+
                    |
                  BitAI
                    |
       Understand • Recommend
        Navigate • Assist
                    |
              Student Growth
```

> **BitCampus — Learn. Track. Grow. Belong.**
