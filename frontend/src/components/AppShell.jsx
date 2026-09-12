import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import NotificationBell from "./NotificationBell";

const NAV_GROUPS = [
  {
    label: "Preparation",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "◫" },
      { to: "/problems", label: "DSA Tracker", icon: "⚡" },
      { to: "/sql", label: "SQL Tracker", icon: "🗄️" },
      { to: "/topics", label: "Topics", icon: "◌" },
      { to: "/roadmap", label: "Roadmap", icon: "▱" },
    ],
  },
  {
    label: "Productivity",
    items: [
      { to: "/tasks", label: "Daily Tasks", icon: "✅" },
      { to: "/goals", label: "Goals", icon: "🎯" },
      { to: "/study", label: "Study & Pomodoro", icon: "⏱️" },
      { to: "/notes", label: "Notes", icon: "📝" },
    ],
  },
  {
    label: "Gamification",
    items: [
      { to: "/gamification", label: "XP & Progress", icon: "⭐" },
      { to: "/leaderboard", label: "Leaderboard", icon: "🏆" },
      { to: "/games", label: "Games", icon: "🎮" },
    ],
  },
  {
    label: "Career",
    items: [
      { to: "/analytics", label: "Analytics", icon: "📊" },
      { to: "/ai", label: "AI Assistant", icon: "🤖" },
      { to: "/jobs", label: "Job Tracker", icon: "💼" },
      { to: "/interview", label: "Interview Prep", icon: "◎" },
      { to: "/resume", label: "Resume", icon: "↗" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: "◉" },
      { to: "/settings", label: "Settings", icon: "⚙" },
    ],
  },
];

function Navigation({ onNavigate }) {
  const { endSession, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await endSession();
    onNavigate?.();
    navigate("/login");
  };

  return (
    <nav className="flex h-full flex-col overflow-y-auto">
      <NavLink to="/dashboard" onClick={onNavigate} className="mb-6 flex items-center gap-3 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-lg font-black text-white shadow-lg shadow-violet-200">C</span>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-950">CareerTrack</span>
          <span className="block text-xs text-violet-600 font-semibold">AI Platform</span>
        </div>
      </NavLink>

      <div className="flex-1 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`
                  }>
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4 mt-4">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Notifications</span>
          <NotificationBell />
        </div>
        {user && (
          <div className="flex items-center gap-2.5 px-3 mb-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {user.name?.[0]?.toUpperCase() || "U"}
            </span>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-slate-700 truncate">{user.name}</p>
              <p className="text-slate-400">Lv.{user.level || 1} · {(user.xp || 0).toLocaleString()} XP</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
          <span className="w-5 text-center">↪</span> Logout
        </button>
      </div>
    </nav>
  );
}

export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <Navigation />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Open navigation">☰</button>
        <NavLink to="/dashboard" className="text-sm font-bold text-slate-900">
          CareerTrack <span className="text-violet-600">AI</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onMouseDown={() => setMenuOpen(false)}>
          <aside className="h-full w-72 overflow-y-auto bg-white p-4 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <Navigation onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
