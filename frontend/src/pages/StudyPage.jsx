import { useCallback, useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import * as studyService from "../services/studyService";
import { getErrorMessage } from "../utils/getErrorMessage";

const CATEGORIES = ["DSA","SQL","Development","Aptitude","Interview","Other"];
const CAT_COLORS = ["#7c5cff","#3b82f6","#22c55e","#f59e0b","#ef4444","#8b949e"];

// ── Pomodoro Timer ─────────────────────────────────────────────────────────────
function PomodoroTimer({ onSessionComplete }) {
  const [mode, setMode] = useState("focus"); // focus | break
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [category, setCategory] = useState("DSA");
  const intervalRef = useRef(null);

  const totalSeconds = mode === "focus" ? focusMins * 60 : breakMins * 60;
  const pct = ((totalSeconds - seconds) / totalSeconds) * 100;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(mode === "focus" ? focusMins * 60 : breakMins * 60);
  }, [mode, focusMins, breakMins]);

  useEffect(() => { reset(); }, [focusMins, breakMins, mode]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (mode === "focus") {
            onSessionComplete(category, focusMins);
            setMode("break");
          } else {
            setMode("focus");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode, category, focusMins]);

  const circumference = 2 * Math.PI * 54;

  return (
    <Card className="p-6">
      <h2 className="font-bold text-slate-900 mb-4 text-center">🍅 Pomodoro Timer</h2>

      {/* Settings */}
      <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          Focus
          <input type="number" min="1" max="90" value={focusMins} disabled={running}
            onChange={(e) => setFocusMins(parseInt(e.target.value) || 25)}
            className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm outline-none focus:border-violet-500" />
          min
        </label>
        <label className="flex items-center gap-2 text-slate-600">
          Break
          <input type="number" min="1" max="30" value={breakMins} disabled={running}
            onChange={(e) => setBreakMins(parseInt(e.target.value) || 5)}
            className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm outline-none focus:border-violet-500" />
          min
        </label>
        <label className="flex items-center gap-2 text-slate-600">
          Category
          <select value={category} disabled={running} onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-violet-500">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {/* Circle Timer */}
      <div className="relative mx-auto mb-6" style={{ width: 144, height: 144 }}>
        <svg width="144" height="144" className="rotate-[-90deg]">
          <circle cx="72" cy="72" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
          <circle cx="72" cy="72" r="54" fill="none" stroke={mode === "focus" ? "#7c5cff" : "#22c55e"} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
          <span className={`text-xs font-semibold mt-1 ${mode === "focus" ? "text-violet-500" : "text-emerald-500"}`}>
            {mode === "focus" ? "FOCUS" : "BREAK"}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)}>
          {running ? "⏸ Pause" : "▶ Start"}
        </Button>
        <Button variant="secondary" onClick={reset}>↺ Reset</Button>
        <Button variant="ghost" onClick={() => { setMode((m) => m === "focus" ? "break" : "focus"); reset(); }}>
          Skip
        </Button>
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudyPage() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({ category: "DSA", durationMinutes: 60, notes: "" });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [sessRes, statsRes] = await Promise.all([studyService.getSessions({ limit: 20 }), studyService.getStudyStats()]);
      setSessions(sessRes.sessions);
      setStats(statsRes.stats);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const logSession = async (category, durationMinutes, notes = "", source = "manual") => {
    try {
      const r = await studyService.createSession({ category, durationMinutes, notes, source });
      if (r.gamification?.xpResult?.xpAdded > 0) showToast(`⭐ +${r.gamification.xpResult.xpAdded} XP for studying!`);
      else showToast(`Study session logged: ${durationMinutes} min`);
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const handlePomodoroComplete = (category, minutes) => {
    showToast(`🍅 Focus session complete! Logging ${minutes} min of ${category}`);
    logSession(category, minutes, "Pomodoro session", "pomodoro");
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await logSession(logForm.category, parseInt(logForm.durationMinutes), logForm.notes, "manual");
      setLogModalOpen(false);
      setLogForm({ category: "DSA", durationMinutes: 60, notes: "" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await studyService.deleteSession(id);
      showToast("Session deleted");
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const pieData = stats?.byCategory?.map((s) => ({ name: s._id, value: s.total })) || [];

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Study Tracker"
        title="Study & Pomodoro"
        description="Track study sessions and use the Pomodoro timer to stay focused."
        action={<Button onClick={() => setLogModalOpen(true)}>+ Log Session</Button>}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Today", value: `${stats?.dailyMinutes || 0}m`, color: "text-violet-600" },
          { label: "This Week", value: `${Math.round((stats?.weeklyMinutes || 0) / 60 * 10) / 10}h`, color: "text-emerald-600" },
          { label: "This Month", value: `${Math.round((stats?.monthlyMinutes || 0) / 60 * 10) / 10}h`, color: "text-slate-900" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <PomodoroTimer onSessionComplete={handlePomodoroComplete} />

        {/* Category Breakdown */}
        <Card className="p-5">
          <h2 className="font-bold text-slate-900 mb-4">Study Breakdown</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} min`, "Duration"]} contentStyle={{ background: "#161b22", border: "1px solid rgba(240,246,252,0.1)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    {d.name}: {d.value}m
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="No study data yet" description="Log your first session to see the breakdown." />
          )}
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <div className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">Recent Sessions</div>
        {error ? (
          <EmptyState title="Error" description={error} actionLabel="Retry" onAction={load} />
        ) : sessions.length === 0 ? (
          <EmptyState title="No sessions yet" description="Start the Pomodoro or log a manual session." />
        ) : (
          sessions.map((s) => (
            <div key={s._id} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600 text-sm">📚</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{s.category}</p>
                  <p className="text-xs text-slate-400">{new Date(s.date).toLocaleDateString()} · {s.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">{s.durationMinutes} min</span>
                <button onClick={() => handleDelete(s._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition text-xs">🗑️</button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal open={logModalOpen} title="Log Study Session" onClose={() => !saving && setLogModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleManualLog}>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select value={logForm.category} onChange={(e) => setLogForm({ ...logForm, category: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Duration (minutes)
            <input type="number" min="1" max="720" value={logForm.durationMinutes}
              onChange={(e) => setLogForm({ ...logForm, durationMinutes: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Notes (optional)
            <textarea rows="2" value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setLogModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Log Session</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
