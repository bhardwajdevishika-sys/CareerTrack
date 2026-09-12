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
import * as noteService from "../services/noteService";
import { getErrorMessage } from "../utils/getErrorMessage";

const CATEGORIES = ["DSA","SQL","AI","Interview","Aptitude","Career","General"];
const blank = { title: "", content: "", category: "General", tags: "", pinned: false };

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      const r = await noteService.getNotes(params);
      setNotes(r.notes);
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterCat]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openModal = (note = null) => {
    setEditing(note);
    setForm(note ? { ...note, tags: note.tags?.join(", ") || "" } : { ...blank });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
      };
      const r = editing ? await noteService.updateNote(editing._id, payload) : await noteService.createNote(payload);
      setModalOpen(false);
      showToast(r.message);
      load();
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    try {
      await noteService.deleteNote(note._id);
      showToast("Note deleted");
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  const togglePin = async (note) => {
    try {
      await noteService.updateNote(note._id, { pinned: !note.pinned });
      load();
    } catch (e) { showToast(getErrorMessage(e), "error"); }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge Base"
        title="Notes"
        description="Capture ideas, insights, and study notes. Search and filter by category."
        action={<Button onClick={() => openModal()}>+ New Note</Button>}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 flex-1 min-w-48"
        />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${!filterCat ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilterCat(filterCat === c ? "" : c)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${filterCat === c ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState title="Error" description={error} actionLabel="Retry" onAction={load} />
      ) : notes.length === 0 ? (
        <EmptyState title="No notes found" description="Create your first note to start building your knowledge base." actionLabel="Create Note" onAction={() => openModal()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {notes.map((note) => (
              <AnimatedListItem key={note._id}>
                <Card className={`p-4 h-full flex flex-col ${note.pinned ? "border-violet-300" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.pinned && <span className="text-violet-500" title="Pinned">📌</span>}
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{note.category}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => togglePin(note)} title={note.pinned ? "Unpin" : "Pin"}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition text-xs">📌</button>
                      <button onClick={() => openModal(note)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition text-xs">✏️</button>
                      <button onClick={() => handleDelete(note)} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 transition text-xs">🗑️</button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{note.title}</h3>
                  {note.content && <p className="text-sm text-slate-500 line-clamp-3 flex-1">{note.content}</p>}
                  {note.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-600">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-400">{new Date(note.updatedAt).toLocaleDateString()}</p>
                </Card>
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? "Edit Note" : "New Note"} onClose={() => !saving && setModalOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input id="note-title" label="Title" placeholder="Note title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Content
            <textarea rows="6" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your note here..."
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </label>
          <Input id="note-tags" label="Tags (comma separated)" placeholder="e.g. arrays, two-pointer, revision" value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="rounded" />
            Pin this note
          </label>
          {formError && <p className="text-sm font-medium text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create note"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
