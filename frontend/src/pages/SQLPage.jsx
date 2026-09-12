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
import * as sqlService from "../services/sqlService";
import { getErrorMessage } from "../utils/getErrorMessage";

const SQL_TOPICS = ["SELECT","WHERE","GROUP BY","HAVING","JOIN","Subqueries","CTE","Window Functions","CASE","Aggregation","Date Functions"];
const PLATFORMS = ["LeetCode","HackerRank","SQLZoo","Mode Analytics","Other"];
const DIFFICULTIES = ["easy","medium","hard"];
const STATUSES = ["not-started","attempted","solved"];

const blank = { title: "", topic: "SELECT", platform: "LeetCode", difficulty: "easy", status: "not-started", link: "", notes: "" };

const diffColor = { easy: "text-emerald-600 bg-emerald-50", medium: "text-amber-600 bg-amber-50", hard: "text-rose-600 bg-rose-50" };
const statusColor = { "not-started": "text-slate-400 bg-slate-100", attempted: "text-blue-600 bg-blue-50", solved: "text-emerald-600 bg-emerald-50" };

export default function SQLPage() {
  const [problems, setProblems] = useState([]);
  const [filters, setFilters] = useState({ topic: "", status: "", difficulty: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const r = await sqlService.getSQLProblems(active);
      setProblems(r.problems);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters.topic, filters.status, filters.difficulty]);

  const openModal = (problem = null) => {
    setEditing(problem);
    setForm(problem ? { ...problem, link: problem.link || "", notes: problem.notes || "" } : { ...blank });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim() };
      if (!payload.link) delete payload.link;
      if (!payload.notes) delete payload.notes;
      const r = editing
        ? await sqlService.updateSQLProblem(editing._id, payload)
        : await sqlService.createSQLProblem(payload);
      setModalOpen(false);
      showToast(r.message);
      if (r.gamification?.xpResult?.xpAdded > 0) {
        showToast(`⭐ +${r.gamification.xpResult.xpAdded} XP earned!`);
      }
      load();
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (problem) => {
    const next = problem.status === "solved" ? "attempted" : "solved";
    const prev = problems;
    setProblems((cur) => cur.map((p) => p._id === problem._id ? { ...p, status: next } : p));
    try {
      const r = await sqlService.updateSQLProblem(problem._id, { status: next });
      if (r.gamification?.xpResult?.xpAdded > 0) showToast(`⭐ +${r.gamification.xpResult.xpAdded} XP!`);
    } catch (e) {
      setProblems(prev);
      showToast(getErrorMessage(e), "error");
    }
  };

  const handleDelete = async (problem) => {
    if (!window.confirm(`Delete "${problem.title}"?`)) return;
    setProblems((cur) => cur.filter((p) => p._id !== problem._id));
    try {
      await sqlService.deleteSQLProblem(problem._id);
      showToast("Deleted");
    } catch (e) { showToast(getErrorMessage(e), "error"); load(); }
  };

  const stats = {
    total: problems.length,
    solved: problems.filter((p) => p.status === "solved").length,
    attempted: problems.filter((p) => p.status === "attempted").length,
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="SQL Practice"
        title="SQL Tracker"
        description="Track SQL problems across topics. Solving awards XP and updates your streak."
        action={<Button onClick={() => openModal()}>+ Add Problem</Button>}
      />

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Solved", value: stats.solved, color: "text-emerald-600" },
          { label: "Attempted", value: stats.attempted, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">Filters</div>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {[["topic", "All topics", SQL_TOPICS], ["status", "All statuses", STATUSES], ["difficulty", "All difficulties", DIFFICULTIES]].map(([key, label, opts]) => (
            <select key={key} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
              <option value="">{label}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </Card>

      {error ? (
        <EmptyState title="Error loading problems" description={error} actionLabel="Retry" onAction={load} />
      ) : problems.length === 0 ? (
        <EmptyState title="No SQL problems found" description="Add your first SQL problem to start tracking." actionLabel="Add Problem" onAction={() => openModal()} />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 sm:grid">
            <span>Problem</span><span>Topic</span><span>Difficulty</span><span>Status</span><span>Actions</span>
          </div>
          <AnimatePresence initial={false}>
            {problems.map((problem) => (
              <AnimatedListItem key={problem._id}>
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleStatus(problem)} className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 text-xs font-bold transition ${
                        problem.status === "solved" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-violet-400"
                      }`}>
                        {problem.status === "solved" ? "✓" : ""}
                      </button>
                      <p className={`text-sm font-semibold ${problem.status === "solved" ? "line-through text-slate-400" : "text-slate-700"}`}>
                        {problem.link ? <a href={problem.link} target="_blank" rel="noreferrer" className="hover:text-violet-500 transition">{problem.title}</a> : problem.title}
                      </p>
                    </div>
                    {problem.notes && <p className="mt-1 text-xs text-slate-400 pl-7 truncate">{problem.notes}</p>}
                  </div>
                  <span className="hidden text-xs text-slate-500 sm:block">{problem.topic}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${diffColor[problem.difficulty]}`}>{problem.difficulty}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[problem.status]}`}>{problem.status}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(problem)} className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">Edit</button>
                    <button onClick={() => handleDelete(problem)} className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition">Del</button>
                  </div>
                </div>
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </Card>
      )}

      <Modal open={modalOpen} title={editing ? "Edit SQL Problem" : "Add SQL Problem"} onClose={() => !saving && setModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input id="sql-title" label="Problem title" placeholder="e.g. Find duplicate emails" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["topic", "Topic", SQL_TOPICS],
              ["platform", "Platform", PLATFORMS],
              ["difficulty", "Difficulty", DIFFICULTIES],
              ["status", "Status", STATUSES],
            ].map(([key, label, opts]) => (
              <label key={key} className="block text-sm font-medium text-slate-700">
                {label}
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
          <Input id="sql-link" label="Problem link (optional)" type="url" placeholder="https://..." value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          {formError && <p className="text-sm font-medium text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Add problem"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
