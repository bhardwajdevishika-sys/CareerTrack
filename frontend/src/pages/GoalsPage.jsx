import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AnimatedListItem from "../components/AnimatedListItem";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import * as goalService from "../services/goalService";
import { getErrorMessage } from "../utils/getErrorMessage";

const CATEGORIES = ["DSA","SQL","Development","Interview","Aptitude","Job Applications","Study","Other"];
const PRIORITIES = ["low","medium","high"];
const STATUSES = ["active","completed","paused"];

const blank = { title: "", description: "", category: "DSA", priority: "medium", deadline: "", targetValue: 1, currentValue: 0, status: "active" };

const priorityColor = { low: "text-slate-500 bg-slate-100", medium: "text-amber-600 bg-amber-50", high: "text-rose-600 bg-rose-50" };
const statusColor = { active: "text-violet-600 bg-violet-50", completed: "text-emerald-600 bg-emerald-50", paused: "text-slate-500 bg-slate-100" };

function GoalCard({ goal, onEdit, onDelete, onUpdateProgress }) {
  const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-sm">{goal.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[goal.priority]}`}>{goal.priority}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[goal.status]}`}>{goal.status}</span>
          </div>
          {goal.description && <p className="text-xs text-slate-500 mb-2">{goal.description}</p>}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <span className="rounded bg-slate-100 px-1.5 py-0.5">{goal.category}</span>
            {goal.deadline && <span>Due {new Date(goal.deadline).toLocaleDateString()}</span>}
          </div>
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{goal.currentValue} / {goal.targetValue}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {goal.status === "active" && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => onUpdateProgress(goal, -1)} disabled={goal.currentValue <= 0}
                className="rounded-lg px-3 py-1 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">−</button>
              <button onClick={() => onUpdateProgress(goal, 1)} disabled={pct >= 100}
                className="rounded-lg px-3 py-1 text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition">+1</button>
              {pct >= 100 && goal.status !== "completed" && (
                <button onClick={() => onUpdateProgress(goal, 0, "completed")}
                  className="rounded-lg px-3 py-1 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition">Mark Complete ✓</button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onEdit(goal)} className="rounded-lg p-1.5 text-xs text-slate-400 hover:bg-slate-100 transition">✏️</button>
          <button onClick={() => onDelete(goal)} className="rounded-lg p-1.5 text-xs text-rose-400 hover:bg-rose-50 transition">🗑️</button>
        </div>
      </div>
    </Card>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await goalService.getGoals(filterStatus ? { status: filterStatus } : {});
      setGoals(r.goals);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openModal = (goal = null) => {
    setEditing(goal);
    setForm(goal ? {
      ...goal,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : ""
    } : { ...blank });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim() };
      if (!payload.deadline) delete payload.deadline;
      const r = editing
        ? await goalService.updateGoal(editing._id, payload)
        : await goalService.createGoal(payload);
      setModalOpen(false);
      showToast(r.message);
      load();
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const handleUpdateProgress = async (goal, delta, forceStatus = null) => {
    try {
      const newValue = forceStatus ? goal.currentValue : Math.max(0, goal.currentValue + delta);
      const payload = { currentValue: newValue };
      if (forceStatus) payload.status = forceStatus;
      const r = await goalService.updateGoal(goal._id, payload);
      if (r.gamification?.xpResult?.xpAdded > 0) showToast(`⭐ +${r.gamification.xpResult.xpAdded} XP for completing goal!`);
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const handleDelete = async (goal) => {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;
    try {
      await goalService.deleteGoal(goal._id);
      showToast("Goal deleted");
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const stats = { active: goals.filter((g) => g.status === "active").length, completed: goals.filter((g) => g.status === "completed").length };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Goal Tracking"
        title="Goals"
        description="Set measurable goals and track progress. Completing goals awards XP."
        action={<Button onClick={() => openModal()}>+ New Goal</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: stats.active, color: "text-violet-600" },
          { label: "Completed", value: stats.completed, color: "text-emerald-600" },
          { label: "Total", value: goals.length, color: "text-slate-900" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex gap-2">
        {["", "active", "completed", "paused"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${filterStatus === s ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState title="Error loading goals" description={error} actionLabel="Retry" onAction={load} />
      ) : goals.length === 0 ? (
        <EmptyState title="No goals yet" description="Create your first goal to start tracking progress." actionLabel="Create Goal" onAction={() => openModal()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {goals.map((goal) => (
              <AnimatedListItem key={goal._id}>
                <GoalCard goal={goal} onEdit={openModal} onDelete={handleDelete} onUpdateProgress={handleUpdateProgress} />
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Goal" : "New Goal"} onClose={() => !saving && setModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input id="goal-title" label="Goal title" placeholder="e.g. Solve 100 DSA problems" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">
            Description (optional)
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["category", "Category", CATEGORIES], ["priority", "Priority", PRIORITIES], ["status", "Status", STATUSES]].map(([key, label, opts]) => (
              <label key={key} className="block text-sm font-medium text-slate-700">
                {label}
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
            <Input id="goal-target" label="Target value" type="number" min="1" value={form.targetValue}
              onChange={(e) => setForm({ ...form, targetValue: parseInt(e.target.value) || 1 })} />
          </div>
          <Input id="goal-deadline" label="Deadline (optional)" type="date" value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          {formError && <p className="text-sm font-medium text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create goal"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
