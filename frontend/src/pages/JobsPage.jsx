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
import * as jobService from "../services/jobService";
import { getErrorMessage } from "../utils/getErrorMessage";

const STATUSES = ["saved", "applied", "assessment", "interview", "selected", "rejected"];
const statusColor = {
  saved: "text-slate-500 bg-slate-100",
  applied: "text-blue-600 bg-blue-50",
  assessment: "text-amber-600 bg-amber-50",
  interview: "text-violet-600 bg-violet-50",
  selected: "text-emerald-600 bg-emerald-50",
  rejected: "text-rose-600 bg-rose-50",
};
const blank = { company: "", role: "", applicationDate: new Date().toISOString().slice(0, 10), status: "saved", jobLink: "", notes: "", interviewStage: "", salary: "", location: "" };

export default function JobsPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState([]);
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
      const r = await jobService.getApplications(filterStatus ? { status: filterStatus } : {});
      setApplications(r.applications);
      setStats(r.stats || []);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openModal = (app = null) => {
    setEditing(app);
    setForm(app ? { ...app, applicationDate: new Date(app.applicationDate).toISOString().slice(0, 10) } : { ...blank });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) { setFormError("Company and role are required"); return; }
    setSaving(true);
    try {
      const r = editing ? await jobService.updateApplication(editing._id, form) : await jobService.createApplication(form);
      setModalOpen(false);
      showToast(r.message);
      load();
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete application to ${app.company}?`)) return;
    try {
      await jobService.deleteApplication(app._id);
      showToast("Application deleted");
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const statsMap = {};
  stats.forEach((s) => { statsMap[s._id] = s.count; });

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Career"
        title="Job Applications"
        description="Track your applications from saved to selected. Stay on top of your job hunt."
        action={<Button onClick={() => openModal()}>+ Add Application</Button>}
      />

      {/* Pipeline Stats */}
      <div className="mb-5 overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${filterStatus === s ? "border-violet-500 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-violet-400"}`}>
              {s} {statsMap[s] ? `(${statsMap[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState title="Error" description={error} actionLabel="Retry" onAction={load} />
      ) : applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Start tracking your job applications." actionLabel="Add Application" onAction={() => openModal()} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {applications.map((app) => (
              <AnimatedListItem key={app._id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{app.company}</p>
                      <p className="text-sm text-slate-500">{app.role}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor[app.status]}`}>{app.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
                    {app.location && <span>📍 {app.location}</span>}
                    {app.salary && <span>💰 {app.salary}</span>}
                    <span>📅 {new Date(app.applicationDate).toLocaleDateString()}</span>
                  </div>
                  {app.interviewStage && (
                    <p className="text-xs text-violet-500 mb-2">🎯 Stage: {app.interviewStage}</p>
                  )}
                  {app.notes && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{app.notes}</p>}
                  <div className="flex gap-2">
                    {app.jobLink && (
                      <a href={app.jobLink} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition">🔗 View</a>
                    )}
                    <button onClick={() => openModal(app)} className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Edit</button>
                    <button onClick={() => handleDelete(app)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-50 transition">Delete</button>
                  </div>
                </Card>
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Application" : "New Application"} onClose={() => !saving && setModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="app-company" label="Company" placeholder="e.g. Google" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input id="app-role" label="Role" placeholder="e.g. SDE Intern" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="app-location" label="Location (optional)" placeholder="e.g. Bangalore" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input id="app-salary" label="Package (optional)" placeholder="e.g. 12 LPA" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <Input id="app-date" label="Application Date" type="date" value={form.applicationDate} onChange={(e) => setForm({ ...form, applicationDate: e.target.value })} />
          </div>
          <Input id="app-stage" label="Interview Stage (optional)" placeholder="e.g. Round 2" value={form.interviewStage} onChange={(e) => setForm({ ...form, interviewStage: e.target.value })} />
          <Input id="app-link" label="Job Link (optional)" type="url" placeholder="https://..." value={form.jobLink} onChange={(e) => setForm({ ...form, jobLink: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          {formError && <p className="text-sm font-medium text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Add application"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
