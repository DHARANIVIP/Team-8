<div align="center">

# 🧠 𝘔𝘢𝘴𝘵𝘦𝘳𝘮𝘪𝘯𝘥

### *Your All-in-One AI-Powered Career Guidance & Learning Pathway System*

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

<br/>

> **Mastermind** is a production-grade, full-stack web platform that unifies **resume parsing**, **AI-guided onboarding**, **side-by-side career suitability comparisons**, **skill gap tracking**, **interactive curriculum timelines**, and **academic course suggestions** — all in one beautiful, responsive interface.

</div>

---

## 📅 Table of Contents

- [Overview](#-overview)
- [System Architecture](#️-system-architecture)
- [Project Structure](#-project-structure)
- [Application Flow](#-application-flow)
- [Authentication Flow](#-authentication-flow)
- [Dashboard Overview](#-dashboard-overview)
- [Module 1 — Onboarding & Resume Parser](#-module-1--onboarding--resume-parser)
- [Module 2 — Career Analysis & AI Advisor](#-module-2--career-analysis--ai-advisor)
- [Module 3 — Career Comparison](#-module-3--career-comparison)
- [Module 4 — Skills Timeline Tracker](#-module-4--skills-timeline-tracker)
- [Module 5 — Course Suggestions](#-module-5--course-suggestions)
- [Module 6 — Interactive Learning Roadmaps](#-module-6--interactive-learning-roadmaps)
- [Database Architecture](#️-database-architecture)
- [API Reference](#-api-reference)
- [Component Architecture](#-component-architecture)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Tech Stack](#️-tech-stack)

---

## 📰 Overview

**Mastermind** guides students through career pathway exploration, identifying skill gaps, suggesting standard online courses, and tracking learning progress interactively.

| Module | Description |
|--------|-------------|
| **Auth System** | Dual database auth using MongoDB Atlas for user registration and JWT session checks |
| **Onboarding & Resume Parser** | PDF parsing of student resumes using Gemini to extract skills and compile onboarding preferences |
| **AI Career Advisor** | Personalized recommended careers matching user skill sets, including dynamic deep-dives |
| **Career Comparison** | Quantitative side-by-side career comparison cards calculating match percentages and overall suitability |
| **Skills Timeline Tracker** | Sequence timeline maps rendering topics and subtopics with checkbox progress tracking |
| **Course Suggestions** | Targeted course catalogs mapped directly to identified missing skills |
| **Interactive Roadmaps** | Professional developer pathway roadmaps synced from roadmap.sh or generated on-the-fly |

---

## 📐 System Architecture

```mermaid
graph TD
    subgraph CLIENT["Client Layer - Next.js 16 (Turbopack Client)"]
        UI[User Dashboard Hub]
        OnbForm[Onboarding & Resume Upload]
        CompPage[Side-by-Side Comparer UI]
        SkillsPage[Interactive Skills Timeline UI]
        Fetch[API Client Services]
    end

    subgraph API["Backend API Server — Express.js (Port 3001)"]
        Server[Express Server]
        AuthRouter[Auth Router /api/auth]
        OnbRouter[Onboarding Router /api/onboarding]
        CareerRouter[Career Router /api/career]
        SkillsRouter[Skills Router /api/skills]
        RoadmapRouter[Roadmap Router /api/roadmaps]
        
        subgraph Services["Core Integration Services"]
            KeyMgr[Gemini Key Manager - Key Rotation & Cooldown]
            OnetGemini[Industry Competency AI Mapper]
            RoadmapSync[Roadmap.sh Sync & Gemini Fallback]
            HFService[HuggingFace Llama-3-8B Fallback]
        end
    end

    subgraph Storage["Database Layer — Hybrid Storage"]
        MongoDB[(MongoDB Atlas\nUser Auth & Credentials)]
        subgraph SupabaseSchema["Supabase PostgreSQL Database"]
            UP[user_profiles]
            Car[careers]
            Sk[skills]
            Co[courses]
            CR[career_recommendations]
            SR[skill_recommendations]
            RC[recommended_courses]
            Comp[comparisons]
            ResAna[resume_analysis]
        end
    end

    UI --> Fetch
    OnbForm --> Fetch
    CompPage --> Fetch
    SkillsPage --> Fetch

    Fetch -->|"/api/auth/*"| AuthRouter
    Fetch -->|"/api/onboarding/*"| OnbRouter
    Fetch -->|"/api/career/*"| CareerRouter
    Fetch -->|"/api/skills/*"| SkillsRouter
    Fetch -->|"/api/roadmaps/*"| RoadmapRouter

    AuthRouter --> MongoDB
    OnbRouter --> SupabaseSchema
    CareerRouter --> SupabaseSchema
    SkillsRouter --> SupabaseSchema
    RoadmapRouter --> SupabaseSchema

    OnbRouter --> KeyMgr
    CareerRouter --> KeyMgr
    CareerRouter --> HFService
    SkillsRouter --> RoadmapSync
    RoadmapRouter --> RoadmapSync
    RoadmapSync --> KeyMgr
```

---

## 📦 Project Structure

```
Team8/
│
├── package.json                       # Root workspaces configuration
├── README.md                           # Developer documentation (this file)
│
└── apps/
    ├── backend/                        # Node.js + Express API Server
    │   ├── server.js                   # Application bootstrap
    │   ├── database.sql                # Relational PostgreSQL setup
    │   ├── database_update.sql         # Database schema alterations
    │   ├── config/
    │   │   └── db.js                   # MongoDB client connection setup
    │   ├── middleware/
    │   │   └── auth.js                 # Authentication & JWT verification
    │   ├── models/
    │   │   └── User.js                 # MongoDB Mongoose model for User
    │   ├── routes/
    │   │   ├── auth.js                 # Auth controller
    │   │   ├── onboarding.js           # Multi-step resume parse & profile submission
    │   │   ├── career.js               # Career recommendations & comparer
    │   │   ├── skills.js               # Skills path advisor & matrix tracker
    │   │   └── roadmaps.js             # Learn path node endpoints
    │   └── services/
    │       ├── supabaseService.js      # Relational PostgreSQL queries and mappings
    │       ├── geminiKeyManager.js     # Robust API key rotation & cooldown manager
    │       ├── geminiCareerService.js  # AI career guidance prompt handlers
    │       ├── onetGeminiService.js    # Standard industry skill maps broker
    │       └── roadmapSyncService.js   # roadmap.sh & Gemini roadmap broker
    │
    └── frontend/                       # Next.js 16 Client Frontend
        ├── next.config.ts              # API proxy and image domains config
        └── src/
            └── app/
                ├── page.tsx            # Portal entry landing page
                ├── onboarding/         # Onboarding page with drag-and-drop resume PDF upload
                └── dashboard/          # Nested dashboard pages
                    ├── categories/     # Career Categories cards
                    ├── compare/        # Side-by-side career comparison cards
                    ├── skills/         # Interactive roadmap timelines
                    ├── courses/        # Course Suggestions directory
                    └── profile/        # Preferences & experience editor
```

---

## 🌊 Application Flow

```mermaid
flowchart TD
    START(["User visits app"]) --> ROOT["Root Page"]
    ROOT --> AUTH_CHECK{"Auth State?"}

    AUTH_CHECK -->|"Not logged in"| LOGIN["Login Page"]
    AUTH_CHECK -->|"Logged in"| ONBOARD_CHECK{"Onboarding Completed?"}

    LOGIN --> CREDS["Enter Email and Password"]
    CREDS --> API_LOGIN["POST /api/auth/login"]
    API_LOGIN --> MONGO_CHECK["Find user in MongoDB\nbcrypt.compare password"]
    MONGO_CHECK -->|"Valid"| SESSION["Create JWT Session Token\nSet Client Headers"]
    MONGO_CHECK -->|"Invalid"| LOGIN_ERR["Show Error Toast"]
    SESSION --> ONBOARD_CHECK

    ONBOARD_CHECK -->|"No"| ONBOARD_PAGE["Onboarding Form & Resume Parser"]
    ONBOARD_CHECK -->|"Yes"| DASH["Dashboard Home"]

    ONBOARD_PAGE --> SUBMIT_API["POST /api/onboarding/submit"]
    SUBMIT_API --> DASH

    DASH --> NAV{"User Navigates To"}
    NAV -->|"Categories"| MOD1["AI Career Portal"]
    NAV -->|"Compare"| MOD2["Career Comparer"]
    NAV -->|"Skills"| MOD3["Skills timeline"]
    NAV -->|"Courses"| MOD4["Course Suggestions"]
    NAV -->|"Profile"| MOD5["Preferences Editor"]
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Next.js Client
    participant API as Express API
    participant MONGO as MongoDB Atlas
    participant SB as Supabase DB

    Note over U,SB: REGISTRATION
    U->>C: Fill signup email + password
    C->>API: POST /api/auth/signup
    API->>MONGO: Create User doc, bcrypt hash password
    API-->>C: Return Success
    C->>C: Redirect to login

    Note over U,SB: LOGIN & JWT CREATION
    U->>C: Enter credentials
    C->>API: POST /api/auth/login
    API->>MONGO: Find user by email
    API->>API: bcrypt.compare password
    API->>SB: Fetch profiles by user_id
    API-->>C: Return JWT Token containing user_id
    C->>C: Store session and navigate

    Note over U,SB: AUTHENTICATED REQUESTS
    U->>C: Access Dashboard page
    C->>API: GET /api/onboarding/status (Authorization: Bearer token)
    API->>API: middleware/auth verifies JWT
    API-->>C: Return status code 200 (Authorized)
```

---

## 📊 Dashboard Overview

The dashboard loads all essential statistics and recommendation arrays in parallel to optimize rendering speeds:

```mermaid
flowchart LR
    MOUNT(["Dashboard Mounts"]) --> PA["Promise.all"]

    PA --> P1["GET /api/onboarding/status\nverify profile setup"]
    PA --> P2["GET /api/career/recommended\nmatched categories"]
    PA --> P3["GET /api/skills/recommendation\nskills CTA & matrix"]
    PA --> P4["GET /api/career/compare/results\ncomparison log list"]

    P1 & P2 & P3 & P4 --> STATE["Update UI State"]

    STATE --> UI1["KPI Stats\nMatch Readiness - Tracked Skills - Saved Comparisons"]
    STATE --> UI2["Call to Action\nRecommended Skill Priority Focus Banner"]
    STATE --> UI3["Quick Links\nExplore Paths - Compare Careers - Track Progress"]
    STATE --> UI4["Dashboard Panels\nRecommended Careers cards - Previous comparisons log"]
```

---

## 📦 Module 1 — Onboarding & Resume Parser

**Route:** `/onboarding`

```mermaid
flowchart TD
    PARSE_START(["Student uploads PDF Resume"]) --> PDF_TEXT["Extract Text from PDF Document"]
    PDF_TEXT --> PREFS["Collect form fields\nTarget Career - Education - Experience"]
    PREFS --> API["POST /api/onboarding/submit"]

    subgraph PROMPT["Gemini Structuring Prompt"]
        SYS["System prompt detailing JSON formats"]
        DATA["Raw resume text + Collected profile preferences"]
    end

    API --> PROMPT
    PROMPT --> GEMINI["Google Gemini 2.5 Flash\nKey Rotation Manager"]

    GEMINI --> RESPONSE

    subgraph RESPONSE["Structured Parsing Response"]
        SKILLS["skills: string array"]
        CERTS["certifications: string array"]
        EDU["education: string"]
        EXP["experience: string"]
        RECS["careerScores: key-value matches"]
    end

    RESPONSE --> UPSERT["Supabase write transactions"]

    subgraph DB_WRITES["Supabase Schemas Update"]
        UP["user_profiles: save target career & preferences"]
        US["user_skills: populate manual skills list"]
        CR["career_recommendations: save matches"]
        RA["resume_analysis: cache extracted metadata"]
    end

    UPSERT --> DB_WRITES
    DB_WRITES --> REDIRECT["Navigate to /dashboard"]
```

---

## 💼 Module 2 — Career Analysis & AI Advisor

**Routes:** `/dashboard/categories` | `/dashboard/categories/:id`

```mermaid
flowchart TD
    LOAD_CAT(["User visits categories page"]) --> API_REC["GET /api/career/recommended"]
    API_REC --> MATCH_DB["Read career_recommendations table"]
    MATCH_DB --> ENRICH["Join with careers catalog"]
    ENRICH --> CARDS["Render Career Option Cards\nMatch percentage - salary - demand"]

    CARDS --> CLICK_DETAIL["Click Deep-Dive Details"]
    CLICK_DETAIL --> API_DETAIL["GET /api/career/:id"]

    subgraph LLM_CHOICES["AI Query Pipeline"]
        GEMINI["Gemini Career Timeline Prompt\nDetailed tasks - recommended steps"]
        HF["HuggingFace Fallback\nLlama-3-8B-Instruct api key\nUsed on rate limit"]
    end

    API_DETAIL --> LLM_CHOICES
    LLM_CHOICES --> RENDER_MD["Display Personalized Advice Markdown\nRoles - Timeline - Market Outlook"]
```

---

## ⚖️ Module 3 — Career Comparison

**Route:** `/dashboard/compare`

```mermaid
flowchart TD
    SELECT(["Select 2 or 3 Recommended Careers"]) --> API["POST /api/career/compare"]

    subgraph FORMULA["Suitability Scoring Formula"]
        S_MATCH["Skills Match Score 40%\nRatio of user skills to career requirements"]
        E_MATCH["Experience Match Score 20%\nUser years experience vs job demand"]
        I_MATCH["Interest Match Score 15%\nInterest overlap in description text"]
        SAL_MATCH["Salary Score 15%\nMin-Max salary range normalization"]
        GRO_MATCH["Growth Score 10%\nNational rate percentage scale"]
    end

    API --> FORMULA
    FORMULA --> TOTAL["Calculate Total Suitability Percentage"]

    TOTAL --> BATCH_COURSES["Batch query suggested courses\nSingle SQL query for missing skills"]
    BATCH_COURSES --> ASYNC_HISTORY["Async background write to comparisons log"]

    subgraph UI_CARDS["Comparison Detail Cards"]
        SCORE["Suitability Score gauge"]
        OVERLAP["Acquired vs missing skills overlap"]
        RODMAP["Estimated duration roadmap summary"]
        CO_SUGG["Top course suggest cards per skill"]
    end

    ASYNC_HISTORY --> UI_CARDS
    UI_CARDS --> AI_SUMMARY["POST /api/ai/chat\nGemini comparison synthesis summary"]
```

---

## 📊 Module 4 — Skills Timeline Tracker

**Route:** `/dashboard/skills`

```mermaid
flowchart TD
    LOAD_SKILLS(["Load Skills Dashboard"]) --> API["GET /api/skills/recommendation"]
    API --> FETCH_GAPS["Compute User skills vs Target Career Gaps"]

    FETCH_GAPS --> CTA["Highlight Next Priority focus Skill Banner"]
    FETCH_GAPS --> TIMELINE["Render Interactive learning Timeline Nodes"]
    FETCH_GAPS --> MATRIX["Group User Skills in Categorized Matrix Grid"]

    TIMELINE --> CHECKBOX["Toggle Milestone Checkbox"]
    CHECKBOX --> TOGGLE_API["POST /api/skills/toggle"]
    TOGGLE_API --> DB_WRITE["Upsert or Delete user_skills row"]
    DB_WRITE --> REALTIME_RECALC["Re-calculate readiness score on page"]
```

---

## 🎓 Module 5 — Course Suggestions

**Route:** `/dashboard/courses`

```mermaid
flowchart LR
    GAPS(["Identify Missing Skills"]) --> API["GET /api/courses/by-skill/:skillId"]
    API --> JOIN["Filter global courses catalog on skill_id"]
    JOIN --> SUGGESTIONS["Display course recommendation cards"]

    subgraph DETAILS["Suggested Course Details"]
        T["Title"]
        P["Provider (Coursera, Udemy, edX)"]
        D["Difficulty Level"]
        URL["Link to external platform"]
    end

    SUGGESTIONS --> DETAILS
```

---

## 🗺️ Module 6 — Interactive Learning Roadmaps

**Route:** `/dashboard/roadmaps`

```mermaid
flowchart TD
    REQ(["Request Career Roadmap"]) --> CHECK_CACHE{"Standard Roadmap cached?"}

    CHECK_CACHE -->|"Yes"| DB["Fetch roadmap milestones from Supabase"]
    CHECK_CACHE -->|"No"| GEMINI["Prompt Gemini to generate structured roadmap JSON"]

    GEMINI --> SAVE_DB["Cache roadmap in database for instant reuse"]
    DB & SAVE_DB --> UI["Display timeline tree milestones"]

    UI --> PROGRESS["Link milestones to user skill checkboxes"]
```

---

## 🗄 Database Architecture

### Supabase PostgreSQL Relational Schema

```mermaid
erDiagram
    user_profiles {
        uuid id PK
        uuid user_id UK
        string full_name
        string education_background
        string major_stream
        string[] current_skills
        string[] interests
        string target_career
        string years_experience
        boolean onboarding_completed
        text resume_raw_text
    }

    careers {
        uuid id PK
        string name UK
        text description
        string icon
        string salary_range
        int average_salary
        string growth_rate
        string demand_level
        text top_companies
    }

    skills {
        uuid id PK
        uuid career_id FK
        string name
        string category
        text description
        string difficulty_level
    }

    courses {
        uuid id PK
        uuid skill_id FK
        string title
        string provider
        text url
        string difficulty
        string price
    }

    career_recommendations {
        uuid id PK
        uuid student_id FK
        uuid career_id FK
        int match_percentage
        text reason
    }

    skill_recommendations {
        uuid id PK
        uuid student_id FK
        uuid career_id FK
        uuid skill_id FK
        string recommended_level
        text reason
        int priority_order
        string status
    }

    recommended_courses {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid skill_id FK
        text reason
        string skill_gap
        string status
    }

    comparisons {
        uuid id PK
        uuid user_id FK
        uuid career_id_1 FK
        uuid career_id_2 FK
    }

    user_profiles ||--o{ user_skills : "acquires"
    user_profiles ||--o{ career_recommendations : "receives"
    user_profiles ||--o{ skill_recommendations : "advises"
    user_profiles ||--o{ recommended_courses : "recommends"
    user_profiles ||--o{ comparisons : "performs"
    careers ||--o{ skills : "requires"
    careers ||--o{ career_recommendations : "matches"
    careers ||--o{ skill_recommendations : "includes"
    skills ||--o{ courses : "teaches"
    skills ||--o{ skill_recommendations : "recommends"
    courses ||--o{ recommended_courses : "teaches"
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/auth/signup` | Register a new user | `{ email, password }` |
| `POST` | `/api/auth/login` | Log in & receive session token | `{ email, password }` |
| `POST` | `/api/auth/forgot-password` | Generate reset token & email | `{ email }` |
| `POST` | `/api/auth/reset-password` | Update password with token | `{ token, newPassword }` |

### Onboarding & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/onboarding/submit` | Upload resume PDF & onboarding preference form |
| `GET` | `/api/onboarding/status` | Retrieve user onboarding completion status |
| `GET` | `/api/onboarding/recommendations` | Get career recommendations for dashboard |

### Careers & Comparer

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/career/recommended` | List recommended careers with match percentages |
| `GET` | `/api/career/:id` | Get details for single career pathway |
| `GET` | `/api/career/:id/skills` | List required skills for career |
| `POST` | `/api/career/compare` | Evaluate suitability scores between careers |
| `GET` | `/api/career/compare/results` | Fetch comparison history log |

### Skills & Timeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/skills/recommendation` | Fetch skills CTA focus, timeline nodes, & skills matrix |
| `POST` | `/api/skills/toggle` | Add/delete skill node from profile |
| `GET` | `/api/roadmaps` | Fetch developer roadmaps catalog |
| `GET` | `/api/roadmaps/personal/:careerId` | Generate personal milestone pathway roadmap |

---

## 🎨 Component Architecture

```mermaid
flowchart TD
    ROOT["RootLayout - layout.tsx\nGoogle Fonts: Inter + Nunito"]

    ROOT --> AUTH_PROV["AuthProvider\nprovides session check logic"]
    ROOT --> NAVIGATION["Dashboard Layout Navigation\nSidebar panel + Header info"]
    ROOT --> TOASTER["Global Toast Notification wrapper"]

    AUTH_PROV --> PAGES["Dashboard Subpages"]

    PAGES --> UI_PRIMS["UI Primitives - components/ui\nButton - Card - Checkbox - Progress - Accordion"]
    PAGES --> DYNAMIC_WIDGETS["Interactive Dashboard Panels\nSuitability score dials - Roadmap milestone trees - Skills matrix grids"]
```

---

## ⚙️ Environment Variables

Create `.env` inside `apps/backend/`:

```env
# ── MongoDB ────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname

# ── Supabase ───────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ── Google Gemini AI ─────────────────────────────────────────────────
GEMINI_API_KEY=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...

# ── JWT Session ──────────────────────────────────────────────────────
JWT_SECRET=your_secret_key_minimum_32_chars

# ── Server ───────────────────────────────────────────────────────────
PORT=3001
```

Create `.env.local` inside `apps/frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18.x or higher |
| npm | 9.x or higher |
| PostgreSQL / Supabase | Active instance |
| MongoDB Atlas | Free cluster |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/DHARANIVIP/Team-8.git
cd Team-8

# 2. Install dependencies
npm install

# 3. Paste schemas into Supabase
# Paste the queries from database.sql & database_update.sql in the Supabase SQL Editor

# 4. Start the backend developer server
cd apps/backend
npm run dev

# 5. Start the frontend developer server
cd ../frontend
npm run dev
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.x | Monorepo client framework |
| **React** | 19.x | UI library |
| **TypeScript** | 5.x | Static typing |
| **TailwindCSS** | 3.x | Styling |
| **Framer Motion** | 11.x | Animations |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.x | REST API server |
| **MongoDB Atlas** | — | User authentication database |
| **Supabase PostgreSQL**| — | Relational applications database |
| **Mongoose** | 8.x | MongoDB object schema modeling |
| **jsonwebtoken** | 9.x | JWT token encoding/decoding |

---

<div align="center">

---

**Built by [Team 8](https://github.com/DHARANIVIP/Team-8)**

*Mastermind — Career Guidance Platform*

</div>
