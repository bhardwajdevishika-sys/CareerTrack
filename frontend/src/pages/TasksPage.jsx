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
import * as taskService from "../services/taskService";
import { getErrorMessage } from "../utils/getErrorMessage";

const CATEGORIES = ["DSA","SQL","Aptitude","Development","Interview","Communication","Job Applications","Other"];
const PRIORITIES = ["low","medium","high"];

const blank = { title: "", description: "", category: "DSA", priority: "medium", dueDate: "" };

const priorityColor = { low: "text-slate-400 bg-slate-100", medium: "text-amber-600 bg-amber-50", high: "text-rose-600 bg-rose-50" };
const priorityIcon = { low: "↓", medium: "→", high: "↑" };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all"); // all | pending | completed
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === "pending" ? { completed: false } : filter === "completed" ? { completed: true } : {};
      const r = await taskService.getTasks(params);
      setTasks(r.tasks);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const openModal = (task = null) => {
    setEditing(task);
    setForm(task ? { ...task, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "" } : { ...blank });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim() };
      if (!payload.dueDate) delete payload.dueDate;
      const r = editing ? await taskService.updateTask(editing._id, payload) : await taskService.createTask(payload);
      setModalOpen(false);
      showToast(r.message);
      load();
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const toggleComplete = async (task) => {
    const prev = tasks;
    setTasks((cur) => cur.map((t) => t._id === task._id ? { ...t, completed: !t.completed } : t));
    try {
      const r = await taskService.updateTask(task._id, { completed: !task.completed });
      if (r.gamification?.xpResult?.xpAdded > 0) showToast(`⭐ +${r.gamification.xpResult.xpAdded} XP!`);
    } catch (e) { setTasks(prev); showToast(getErrorMessage(e), "error"); }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((cur) => cur.filter((t) => t._id !== task._id));
    try { await taskService.deleteTask(task._id); showToast("Task deleted"); }
    catch (e) { showToast(getErrorMessage(e), "error"); load(); }
  };

  const pending = tasks.filter((t) => !t.completed).length;
  const done = tasks.filter((t) => t.completed).length;
  const today = new Date().toISOString().slice(0, 10);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Daily Tasks"
        title="Tasks"
        description="Stay on top of your daily prep. Each completed task awards XP."
        action={<Button onClick={() => openModal()}>+ Add Task</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending, color: "text-amber-600" },
          { label: "Completed", value: done, color: "text-emerald-600" },
          { label: "Total", value: tasks.length, color: "text-slate-900" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex gap-2">
        {[["all","All"], ["pending","Pending"], ["completed","Completed"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${filter === v ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {l}
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState title="Error loading tasks" description={error} actionLabel="Retry" onAction={load} />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks found" description="Add tasks to track your daily preparation activities." actionLabel="Add Task" onAction={() => openModal()} />
      ) : (
        <Card className="overflow-hidden">
          <AnimatePresence initial={false}>
            {tasks.map((task) => {
              const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate).toISOString().slice(0, 10) < today;
              return (
                <AnimatedListItem key={task._id}>
                  <div className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 hover:bg-slate-50 transition ${task.completed ? "opacity-60" : ""}`}>
                    <button onClick={() => toggleComplete(task)}
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 text-xs font-bold transition ${task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-violet-400"}`}>
                      {task.completed ? "✓" : ""}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>{task.title}</p>
                      {task.description && <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{task.category}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[task.priority]}`}>
                          {priorityIcon[task.priority]} {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`text-xs ${isOverdue ? "text-rose-500 font-semibold" : "text-slate-400"}`}>
                            {isOverdue ? "⚠️ Overdue: " : "Due: "}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openModal(task)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xs">✏️</button>
                      <button onClick={() => handleDelete(task)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition text-xs">🗑️</button>
                    </div>
                  </div>
                </AnimatedListItem>
              );
            })}
          </AnimatePresence>
        </Card>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Task" : "New Task"} onClose={() => !saving && setModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input id="task-title" label="Task title" placeholder="e.g. Solve 2 array problems" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">
            Description (optional)
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["category", "Category", CATEGORIES], ["priority", "Priority", PRIORITIES]].map(([key, label, opts]) => (
              <label key={key} className="block text-sm font-medium text-slate-700">
                {label}
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
          <Input id="task-due" label="Due date (optional)" type="date" value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          {formError && <p className="text-sm font-medium text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create task"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
