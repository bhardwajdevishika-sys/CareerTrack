import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/Spinner'
import { useAuth } from './hooks/useAuth'

// Existing pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/DashboardPage'
import ProblemsPage from './pages/ProblemsPage'
import TopicsPage from './pages/TopicsPage'
import RoadmapPage from './pages/RoadmapPage'
import InterviewPage from './pages/InterviewPage'
import ResumePage from './pages/ResumePage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

// New CareerTrack pages
import SQLPage from './pages/SQLPage'
import GoalsPage from './pages/GoalsPage'
import TasksPage from './pages/TasksPage'
import StudyPage from './pages/StudyPage'
import GamificationPage from './pages/GamificationPage'
import LeaderboardPage from './pages/LeaderboardPage'
import GamesPage from './pages/GamesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AIPage from './pages/AIPage'
import JobsPage from './pages/JobsPage'
import NotesPage from './pages/NotesPage'

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function PrivatePage({ children }) {
  return <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
}

function AnimatedRoutes() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={transition}
      >
        <Routes location={location}>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

          {/* Existing protected pages */}
          <Route path="/dashboard" element={<PrivatePage><DashboardPage /></PrivatePage>} />
          <Route path="/problems" element={<PrivatePage><ProblemsPage /></PrivatePage>} />
          <Route path="/topics" element={<PrivatePage><TopicsPage /></PrivatePage>} />
          <Route path="/roadmap" element={<PrivatePage><RoadmapPage /></PrivatePage>} />
          <Route path="/interview" element={<PrivatePage><InterviewPage /></PrivatePage>} />
          <Route path="/resume" element={<PrivatePage><ResumePage /></PrivatePage>} />
          <Route path="/profile" element={<PrivatePage><ProfilePage /></PrivatePage>} />
          <Route path="/settings" element={<PrivatePage><SettingsPage /></PrivatePage>} />

          {/* New CareerTrack pages */}
          <Route path="/sql" element={<PrivatePage><SQLPage /></PrivatePage>} />
          <Route path="/goals" element={<PrivatePage><GoalsPage /></PrivatePage>} />
          <Route path="/tasks" element={<PrivatePage><TasksPage /></PrivatePage>} />
          <Route path="/study" element={<PrivatePage><StudyPage /></PrivatePage>} />
          <Route path="/gamification" element={<PrivatePage><GamificationPage /></PrivatePage>} />
          <Route path="/leaderboard" element={<PrivatePage><LeaderboardPage /></PrivatePage>} />
          <Route path="/games" element={<PrivatePage><GamesPage /></PrivatePage>} />
          <Route path="/analytics" element={<PrivatePage><AnalyticsPage /></PrivatePage>} />
          <Route path="/ai" element={<PrivatePage><AIPage /></PrivatePage>} />
          <Route path="/jobs" element={<PrivatePage><JobsPage /></PrivatePage>} />
          <Route path="/notes" element={<PrivatePage><NotesPage /></PrivatePage>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
