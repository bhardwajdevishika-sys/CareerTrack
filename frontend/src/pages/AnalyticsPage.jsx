import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { getAnalytics } from "../services/analyticsService";
import { getErrorMessage } from "../utils/getErrorMessage";

const COLORS = ["#7c5cff","#3b82f6","#22c55e","#f59e0b","#ef4444","#8b949e"];

const PREP_FORMULA = `Preparation Score formula (transparent):
• DSA (30%): min(100, solved × 0.67) × 0.30
• SQL (20%): min(100, solved × 2) × 0.20
• Consistency (20%): (streak × 3 + task_rate × 30) × 0.20
• Tasks/Goals (15%): (task_rate + goal_rate) × 50 × 0.15
• Study (15%): weekly_hours × 10 × 0.15`;

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then((r) => setAnalytics(r.analytics))
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  if (!analytics && !error) return <PageLoader />;
  if (error) return <EmptyState title="Analytics unavailable" description={error} />;

  const { prepScore, xp, level, currentStreak, longestStreak, dsa, sql, study, tasks, goals, xpHistory, levelInfo } = analytics;

  // Fill in missing days in XP chart
  const last30 = xpHistory?.monthly || [];
  const xpChartData = last30.map((d) => ({ date: d._id.slice(5), xp: d.xp }));

  const dsaByDiff = dsa.byDifficulty.map((d) => ({ name: d._id, value: d.count }));
  const sqlByTopic = sql.byTopic.map((d) => ({ name: d._id, value: d.count })).sort((a, b) => b.value - a.value).slice(0, 6);
  const studyByCategory = study.byCategory.map((d) => ({ name: d._id, value: d.total }));

  const scoreColor = prepScore >= 75 ? "text-emerald-500" : prepScore >= 50 ? "text-amber-500" : "text-rose-500";

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Your Progress"
        description="A data-driven view of your placement preparation."
      />

      {/* Prep Score */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Preparation Score</p>
              <p className={`text-5xl font-black ${scoreColor}`}>{prepScore}<span className="text-2xl text-slate-400">/100</span></p>
              <p className="text-xs text-slate-400 mt-2">{prepScore >= 75 ? "Placement ready 🚀" : prepScore >= 50 ? "Good progress ⚡" : "Keep pushing 💪"}</p>
            </div>
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#21262d" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={prepScore >= 75 ? "#22c55e" : prepScore >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3" strokeDasharray={`${prepScore} ${100 - prepScore}`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <details className="mt-3">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">How is this calculated?</summary>
            <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap">{PREP_FORMULA}</pre>
          </details>
        </Card>

        {[
          { label: "Level", value: level, sub: `${levelInfo.xpIntoLevel}/${levelInfo.xpNeeded} XP`, icon: "🏆" },
          { label: "Current Streak", value: `${currentStreak}d`, sub: `Best: ${longestStreak}d`, icon: "🔥" },
        ].map(({ label, value, sub, icon }) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{icon} {value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Progress Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "DSA Solved", value: dsa.solved, total: dsa.total, color: "#7c5cff" },
          { label: "SQL Solved", value: sql.solved, total: sql.total, color: "#3b82f6" },
          { label: "Tasks Done", value: tasks.completed, total: tasks.total, color: "#22c55e" },
          { label: "Goals Done", value: goals.completed, total: goals.total, color: "#f59e0b" },
        ].map(({ label, value, total, color }) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}<span className="text-sm text-slate-400">/{total}</span></p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${total > 0 ? Math.min(100, (value / total) * 100) : 0}%`, background: color }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{total > 0 ? Math.round((value / total) * 100) : 0}% completion rate</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        {/* XP History */}
        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-4">XP History (last 30 days)</h2>
          {xpChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={xpChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="xp" stroke="#7c5cff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No XP history yet" description="Earn XP to see your progress chart." />}
        </Card>

        {/* DSA by Difficulty */}
        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-4">DSA by Difficulty</h2>
          {dsaByDiff.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dsaByDiff} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8b949e" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {dsaByDiff.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === "easy" ? "#22c55e" : entry.name === "medium" ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No DSA data" description="Solve problems to see difficulty breakdown." />}
        </Card>

        {/* SQL by Topic */}
        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-4">SQL by Topic (top solved)</h2>
          {sqlByTopic.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sqlByTopic} layout="vertical" barSize={14}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#8b949e" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No SQL data" description="Solve SQL problems to see topic breakdown." />}
        </Card>

        {/* Study by Category */}
        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-4">Study Time by Category</h2>
          {studyByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={studyByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {studyByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}m`, "Minutes"]} contentStyle={{ background: "#161b22", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-slate-500 mt-2">
                This month: {Math.round(study.byCategory.reduce((sum, s) => sum + s.total, 0) / 60 * 10) / 10}h total
              </p>
            </>
          ) : <EmptyState title="No study sessions" description="Log study sessions to see the breakdown." />}
        </Card>
      </div>
    </div>
  );
}
