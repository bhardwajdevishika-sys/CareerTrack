# CareerTrack AI

> An AI-powered placement preparation and productivity platform for college students.

CareerTrack combines placement preparation, productivity tools, gamification, and AI career guidance into a single polished SaaS-grade platform.

---

## Features

### Preparation
- **DSA Tracker** — 150 pre-seeded problems across 10 topics with solve tracking, filters, and revision flags
- **SQL Tracker** — Dedicated SQL problem tracker across 11 topics
- **Topics** — Progress tracking per DSA topic
- **Roadmap** — Daily/weekly/monthly planning with task items
- **Interview Prep** — Save and practice interview questions
- **Resume** — Upload and version resume PDFs

### Productivity
- **Daily Tasks** — Create, prioritize, and complete tasks with XP rewards
- **Goals** — Set measurable goals with progress tracking
- **Study Tracker** — Log study sessions by category
- **Pomodoro Timer** — Focus timer that auto-logs sessions and awards XP
- **Notes** — Rich notes with categories, tags, and search

### Gamification
- **XP System** — Server-side XP awards for every meaningful activity
- **Levels** — 20-level progression based on XP (no fake inflation)
- **Coins** — Earned via rewards, spendable for streak freezes
- **Streaks** — Real streak tracking across all activities
- **Streak Freeze** — Protect your streak with coins (100 coins/freeze)
- **Daily Rewards** — Daily check-in with scaling consecutive bonuses
- **Challenges** — Daily and weekly auto-generated challenges
- **Achievements** — 20 auto-unlocking achievements across 7 categories
- **Leaderboard** — All-time, weekly, and monthly rankings

### Analytics & AI
- **Analytics** — Charts for XP, DSA progress, SQL progress, study time
- **Preparation Score** — Transparent weighted score (0–100)
- **AI Career Assistant** — Personalized advice using your actual activity data
- **Cognitive Games** — Memory, sequence, reaction, and aptitude games

### Career
- **Job Application Tracker** — Track applications from saved → selected
- **AI Career Assistant** — Role-specific guidance, weakness detection, daily plans

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 3, Framer Motion, Recharts |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Auth | JWT (7-day tokens), bcrypt |
| AI | OpenAI GPT-4o-mini (fallback: smart rule-based responses) |
| Deployment | Frontend: Vercel · Backend: Railway / Render |

---

## Architecture

```
frontend/src/
  pages/        ← One file per page/route
  components/   ← Reusable UI components
  services/     ← API layer (one file per resource)
  context/      ← AuthContext, ToastContext
  hooks/        ← useAuth, useToast

backend/src/
  models/       ← Mongoose models
  controllers/  ← Route handlers
  services/     ← Business logic (xp, streak, challenges, achievements, ai)
  routes/       ← Express routers
  middleware/   ← auth, validation, error handling
  utils/        ← Constants, token generation
```

---

## Gamification — XP Table

| Activity | XP |
|---|---|
| Easy DSA | +10 |
| Medium DSA | +20 |
| Hard DSA | +30 |
| Easy SQL | +10 |
| Medium SQL | +15 |
| Hard SQL | +25 |
| Task complete | +5 |
| Daily challenge | +25 |
| Weekly challenge | +50 |
| Study session | +1 per 10 min (max 30) |
| Goal complete | +50 |
| Daily check-in | +5 |
| Achievement unlock | varies |
| 7-day streak bonus | +20 |

XP is awarded **server-side only**. Frontend cannot modify XP.

---

## Preparation Score Formula

```
DSA (30%):         min(100, solved × 0.67) × 0.30
SQL (20%):         min(100, solved × 2)    × 0.20
Consistency (20%): (streak × 3 + task_rate × 30) × 0.20
Tasks/Goals (15%): (task_rate + goal_rate) × 50 × 0.15
Study (15%):       weekly_hours × 10 × 0.15
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...   # Optional — fallback responses work without it
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend
```bash
cd backend
npm install
# Set up .env file
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

### MongoDB Atlas — Important
Add your current IP to the Atlas IP Whitelist:
1. Go to Atlas → Network Access → Add IP Address
2. Add `0.0.0.0/0` for development (restrict in production)

---

## Seed Data

On first registration, each new user automatically gets:
- 10 DSA topics pre-created
- 150 DSA problems pre-seeded across those topics
- 20 achievements seeded at server startup

---

## Deployment

### Frontend (Vercel)
```bash
# Set environment variable:
VITE_API_URL=https://your-backend.railway.app/api
```

### Backend (Railway / Render)
Set all variables from the `.env` file in the platform dashboard.

---

## Troubleshooting

**MongoDB connection error**: Add your IP to Atlas whitelist.  
**Build warning about chunk size**: Expected for a full-featured SPA. Use code splitting if needed.  
**AI responses show "fallback"**: Set `OPENAI_API_KEY` in backend `.env`. Fallback responses still use real user data.  
**Streak not updating**: Activities must be server-confirmed (not just frontend). Check network requests.
