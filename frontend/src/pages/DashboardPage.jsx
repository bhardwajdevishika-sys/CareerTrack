import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import { PageLoader } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getDashboard } from "../services/dashboardService";
import { claimDailyReward } from "../services/gamificationService";
import { getErrorMessage } from "../utils/getErrorMessage";

const LEVEL_THRESHOLDS = [0,100,250,500,850,1300,1900,2700,3700,5000,6600,8500,11000,14000,18000,23000,29000,36000,45000,56000];

const getLevelInfo = (xp) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const cur = LEVEL_THRESHOLDS[level - 1] || 0;
  const next = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pct = level >= LEVEL_THRESHOLDS.length ? 100 : Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100));
  return { level, cur, next, pct, xpIntoLevel: xp - cur, xpNeeded: next - cur };
};

function StatCard({ label, value, icon, color, to, index }) {
  const reduceMotion = useReducedMotion();
  const inner = (
    <Card className="p-4 hover:border-violet-500/30 transition-colors cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${color}`}>{icon}</span>
      </div>
    </Card>
  );
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.22 }}
    >
      {to ? <Link to={to}>{inner}</Link> : inner}
    </motion.div>
  );
}

function XPBar({ xp }) {
  const { level, pct, xpIntoLevel, xpNeeded } = getLevelInfo(xp);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-slate-500">
        <span>Level {level}</span>
        <span>{xpIntoLevel} / {xpNeeded} XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ChallengeBar({ challenge }) {
  const pct = challenge.target > 0 ? Math.min(100, Math.round((challenge.current / challenge.target) * 100)) : 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-slate-700">{challenge.title}</span>
        {challenge.completed
          ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Done ✓</span>
          : <span className="text-xs text-slate-500">{challenge.current}/{challenge.target}</span>}
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400">+{challenge.xpReward} XP · +{challenge.coinReward} coins</p>
    </div>
  );
}

const DIFF_COLORS = { easy: "#56d364", medium: "#e3b341", hard: "#ff7b72" };

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [claimingReward, setClaimingReward] = useState(false);

  const load = () =>
    getDashboard()
      .then((r) => setDashboard(r.dashboard))
      .catch((e) => setError(getErrorMessage(e)));

  useEffect(() => { load(); }, []);

  const handleClaimReward = async () => {
    setClaimingReward(true);
    try {
      const r = await claimDailyReward();
      showToast(`🎁 Claimed! +${r.reward.xpReward} XP, +${r.reward.coinReward} coins`);
      load();
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setClaimingReward(false);
    }
  };

  if (!dashboard && !error) return <PageLoader />;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const weeklyData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en", { weekday: "short" });
      const found = dashboard?.weeklyActivity?.find((a) => a._id === key);
      days.push({ label, count: found?.count || 0, key });
    }
    return days;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-500">CareerTrack</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {now.toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {dashboard?.dailyRewardAvailable && (
          <motion.button
            onClick={handleClaimReward}
            disabled={claimingReward}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-amber-600 disabled:opacity-60 transition"
            whileTap={{ scale: 0.97 }}
          >
            🎁 Claim Daily Reward
          </motion.button>
        )}
      </div>

      {error ? <EmptyState title="Dashboard unavailable" description={error} actionLabel="Retry" onAction={load} /> : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Streak" value={`${dashboard.currentStreak}d 🔥`} icon="" color="bg-orange-50 text-orange-500" index={0} />
            <StatCard label="XP" value={dashboard.xp?.toLocaleString()} icon="⭐" color="bg-violet-50 text-violet-600" to="/analytics" index={1} />
            <StatCard label="Level" value={dashboard.level} icon="🏆" color="bg-amber-50 text-amber-600" to="/analytics" index={2} />
            <StatCard label="DSA Solved" value={dashboard.dsaSolvedTotal} icon="⚡" color="bg-emerald-50 text-emerald-600" to="/problems" index={3} />
            <StatCard label="SQL Solved" value={dashboard.sqlSolvedTotal} icon="🗄️" color="bg-blue-50 text-blue-600" to="/sql" index={4} />
            <StatCard label="Study Today" value={`${dashboard.studyMinutesToday}m`} icon="📚" color="bg-rose-50 text-rose-500" to="/study" index={5} />
          </div>

          {/* XP Progress */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900">Level Progress</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-amber-500">🪙 {dashboard.coins} coins</span>
                <span className="font-semibold text-orange-500">🔥 {dashboard.currentStreak} day streak</span>
                {dashboard.streakFreezes > 0 && (
                  <span className="font-semibold text-blue-500">🛡️ {dashboard.streakFreezes} freezes</span>
                )}
              </div>
            </div>
            <XPBar xp={dashboard.xp || 0} />
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Today's Progress */}
            <Card className="p-5">
              <h2 className="font-bold text-slate-900 mb-4">Today's Progress</h2>
              <div className="space-y-3">
                {[
                  { label: "DSA Problems", done: dashboard.todaysGoal.solved, target: dashboard.todaysGoal.target, color: "bg-violet-500" },
                  { label: "SQL Problems", done: dashboard.todaysGoal.sqlSolved, target: 2, color: "bg-blue-500" },
                  { label: "Tasks", done: dashboard.todaysGoal.tasksCompleted, target: 5, color: "bg-emerald-500" },
                  { label: "Study (min)", done: dashboard.studyMinutesToday, target: 60, color: "bg-amber-500" },
                ].map(({ label, done, target, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                      <span>{label}</span>
                      <span>{done}/{target}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, (done / target) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Activity Chart */}
            <Card className="p-5">
              <h2 className="font-bold text-slate-900 mb-4">Weekly Activity</h2>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weeklyData} barSize={20}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8b949e" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#161b22", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [v, "problems"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry) => (
                      <Cell key={entry.key} fill={entry.count > 0 ? "#7c5cff" : "#21262d"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Challenges */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Challenges</h2>
                <Link to="/gamification" className="text-xs font-semibold text-violet-500 hover:underline">View all</Link>
              </div>
              {dashboard.challenges?.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.challenges.slice(0, 3).map((c) => (
                    <ChallengeBar key={c._id} challenge={c} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No active challenges</p>
              )}
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Active Goals */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Active Goals</h2>
                <Link to="/goals" className="text-xs font-semibold text-violet-500 hover:underline">Manage</Link>
              </div>
              {dashboard.activeGoals?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.activeGoals.map((g) => {
                    const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
                    return (
                      <div key={g._id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-semibold text-slate-700">{g.title}</span>
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        {g.deadline && (
                          <p className="mt-0.5 text-xs text-slate-400">Due {new Date(g.deadline).toLocaleDateString()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No active goals" description="Set goals to track your progress." actionLabel="Add goal" onAction={() => window.location.href = "/goals"} />
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Recent Solves</h2>
                <Link to="/problems" className="text-xs font-semibold text-violet-500 hover:underline">All problems</Link>
              </div>
              {dashboard.recentActivity?.length > 0 ? (
                <div className="space-y-1">
                  {dashboard.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 text-sm">✓</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{a.title}</p>
                        <p className="text-xs text-slate-400">{a.topic}{a.difficulty ? ` · ${a.difficulty}` : ""}</p>
                      </div>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        a.difficulty === "easy" ? "text-emerald-600 bg-emerald-50"
                        : a.difficulty === "medium" ? "text-amber-600 bg-amber-50"
                        : "text-rose-600 bg-rose-50"
                      }`}>{a.difficulty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-slate-500">Solve your first problem to see activity here.</p>
              )}
            </Card>
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { to: "/sql", icon: "🗄️", label: "SQL Tracker", desc: "Practice SQL queries" },
              { to: "/tasks", icon: "✅", label: "Daily Tasks", desc: "Manage your tasks" },
              { to: "/study", icon: "⏱️", label: "Study + Pomodoro", desc: "Track study time" },
              { to: "/ai", icon: "🤖", label: "AI Assistant", desc: "Get personalized advice" },
            ].map(({ to, icon, label, desc }) => (
              <Link key={to} to={to}>
                <Card className="p-4 hover:border-violet-500/30 transition-colors cursor-pointer h-full">
                  <span className="text-2xl">{icon}</span>
                  <p className="mt-2 font-bold text-sm text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
