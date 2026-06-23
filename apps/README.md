# Mastermind - Career Pathway Guidance System

A modern, full-stack web application designed to guide students through career pathways using skill mapping, AI-powered advising, and course recommendations.

## 📦 Project Structure

This is a **monorepo** with shared root configuration and separate frontend/backend applications:

```
mastermind-app/
├── package.json                    # Root workspace config
├── tsconfig.json                   # Shared TypeScript settings
├── .env.local                      # Shared secrets (Supabase, OpenAI keys)
├── supabase/migrations/            # Database schema
│
├── backend/                        # Node.js/Express server
│   ├── server.js                   # Entry point
│   ├── routes/                     # API endpoints (5 feature modules)
│   └── services/                   # Supabase & OpenAI integrations
│
└── frontend/                       # Next.js React app
    ├── public/                     # Static assets
    └── src/
        ├── app/                    # Pages & routing
        ├── components/             # Shared UI components
        ├── features/               # Feature-specific logic
        └── lib/services/           # API client services
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (for AI advising)

### Installation

1. **Install root dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd backend && npm install && cd ..
```

3. **Install frontend dependencies:**
```bash
cd frontend && npm install && cd ..
```

4. **Configure environment variables:**
```bash
cp .env.local.example .env.local
```

Add your credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Running Locally

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend Development:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## 👥 Team Assignments

Each teammate owns a complete feature from backend API to frontend UI:

| Teammate | Feature | Backend Route | Frontend Page | Database Focus |
|----------|---------|---------------|---------------|---|
| **1** | AI Chat & Advising | `/api/ai/chat` | [Integrated] | OpenAI integration |
| **2** | Career Categories | `/api/categories` | `/dashboard/categories` | Careers table |
| **3** | Skill Mapping | `/api/skills` | `/dashboard/skills` | Skills & matrix calculations |
| **4** | Course Suggestions | `/api/courses` | `/dashboard/courses` | Courses & recommendations |
| **5** | Career Comparison | `/api/compare` | `/dashboard/compare` | Comparison metrics |

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with Express
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI API
- **Authentication**: Supabase Auth

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS
- **State**: React hooks
- **Styling**: Global CSS + Tailwind utilities

### Shared
- **Language**: TypeScript (frontend), JavaScript (backend)
- **Database Migrations**: SQL files in `supabase/migrations/`
- **Env Config**: `.env.local` file

## 📝 Available Scripts

### Root
```bash
npm install              # Install dependencies for all workspaces
```

### Backend (`cd backend`)
```bash
npm run dev             # Start dev server with nodemon
npm start               # Start production server
```

### Frontend (`cd frontend`)
```bash
npm run dev             # Start Next.js dev server
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint
```

## 🗄 Database Schema

Tables created in `supabase/migrations/20260622_init_schema.sql`:
- **careers** - Career pathways and metadata
- **skills** - Technical and soft skills
- **courses** - Learning resources by skill
- **comparisons** - User career comparisons
- **user_profiles** - Student tracking and preferences

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3001
```

## 📚 API Documentation

All endpoints are organized by feature:

- **Categories**: GET/POST `/api/categories`, GET `/api/categories/:id`
- **Skills**: GET/POST `/api/skills`, POST `/api/skills/matrix`
- **Courses**: GET/POST `/api/courses`, GET `/api/courses/by-skill/:skillId`, POST `/api/courses/recommendations`
- **Compare**: GET/POST `/api/compare`, POST `/api/compare/metrics`
- **AI**: POST `/api/ai/chat`, POST `/api/ai/advise`

## 🤝 Contributing

1. Work within your assigned feature folder
2. Follow the folder structure conventions
3. Update types in `supabase/migrations/` if needed
4. Test your API endpoints before committing

## 📖 Documentation

- Backend route handlers: `backend/routes/*.js`
- Frontend services: `frontend/src/lib/services/*.ts`
- Database types: See migration SQL file

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Backend default: 3001
# Frontend default: 3000
# Change with PORT env variable
```

**Database connection issues:**
- Verify `.env.local` has correct Supabase keys
- Check Supabase project is active
- Run migrations: `npx supabase migration up`

## 📄 License

MIT
