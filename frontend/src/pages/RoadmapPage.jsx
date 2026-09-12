import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AnimatedListItem from "../components/AnimatedListItem";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import * as roadmapService from "../services/roadmapService";
import { getErrorMessage } from "../utils/getErrorMessage";

const blankItem = () => ({ description: "", targetDate: "", completed: false });
const blankRoadmap = () => ({
  title: "",
  type: "weekly",
  items: [blankItem()],
});
const roadmapTypes = ["daily", "weekly", "monthly"];

const itemForForm = (item) => ({
  ...item,
  targetDate: item.targetDate?.slice(0, 10) || "",
});

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [form, setForm] = useState(blankRoadmap());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadRoadmaps = async () => {
    setLoading(true);
    try {
      const response = await roadmapService.getRoadmaps();
      setRoadmaps(response.roadmaps);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const openModal = (roadmap = null) => {
    setEditingRoadmap(roadmap);
    setForm(
      roadmap
        ? {
            title: roadmap.title,
            type: roadmap.type,
            items: roadmap.items.map(itemForForm),
          }
        : blankRoadmap(),
    );
    setFormError("");
    setModalOpen(true);
  };

  const updateItem = (index, changes) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !form.title.trim() ||
      form.items.some((item) => !item.description.trim())
    ) {
      setFormError("Add a roadmap title and a description for every task");
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      items: form.items.map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        description: item.description.trim(),
        ...(item.targetDate ? { targetDate: item.targetDate } : {}),
        completed: item.completed,
      })),
    };

    setSaving(true);
    setFormError("");
    try {
      const response = editingRoadmap
        ? await roadmapService.updateRoadmap(editingRoadmap._id, payload)
        : await roadmapService.createRoadmap(payload);
      setRoadmaps((current) =>
        editingRoadmap
          ? current.map((item) =>
              item._id === response.roadmap._id ? response.roadmap : item,
            )
          : [response.roadmap, ...current],
      );
      setModalOpen(false);
      showToast(response.message);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = async (roadmap, item) => {
    const previous = roadmaps;
    setRoadmaps((current) =>
      current.map((entry) =>
        entry._id === roadmap._id
          ? {
              ...entry,
              items: entry.items.map((entryItem) =>
                entryItem._id === item._id
                  ? { ...entryItem, completed: !entryItem.completed }
                  : entryItem,
              ),
            }
          : entry,
      ),
    );
    try {
      const response = await roadmapService.toggleRoadmapItem(
        roadmap._id,
        item._id,
      );
      setRoadmaps((current) =>
        current.map((entry) =>
          entry._id === roadmap._id ? response.roadmap : entry,
        ),
      );
    } catch (requestError) {
      setRoadmaps(previous);
      showToast(getErrorMessage(requestError), "error");
    }
  };

  const removeRoadmap = async (roadmap) => {
    if (!window.confirm(`Delete “${roadmap.title}”?`)) return;
    try {
      const response = await roadmapService.deleteRoadmap(roadmap._id);
      setRoadmaps((current) =>
        current.filter((item) => item._id !== roadmap._id),
      );
      showToast(response.message);
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Study planner"
        title="Roadmap"
        description="Turn your preparation plan into small, dated tasks you can finish with intent."
        action={<Button onClick={() => openModal()}>+ Add roadmap</Button>}
      />
      {error ? (
        <EmptyState
          title="Roadmaps unavailable"
          description={error}
          actionLabel="Try again"
          onAction={loadRoadmaps}
        />
      ) : roadmaps.length === 0 ? (
        <EmptyState
          title="No roadmap yet"
          description="Create a daily, weekly, or monthly plan to make your next steps visible."
          actionLabel="Create roadmap"
          onAction={() => openModal()}
        />
      ) : (
        <div className="space-y-8">
          {roadmapTypes.map((type) => {
            const group = roadmaps.filter((roadmap) => roadmap.type === type);
            if (!group.length) return null;
            return (
              <section key={type}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                    {type}
                  </h2>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {group.map((roadmap) => (
                      <AnimatedListItem key={roadmap._id}>
                        <Card className="overflow-hidden">
                          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold tracking-tight text-slate-900">
                                  {roadmap.title}
                                </h3>
                                <Badge tone="violet">
                                  {
                                    roadmap.items.filter(
                                      (item) => item.completed,
                                    ).length
                                  }
                                  /{roadmap.items.length}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {roadmap.type} plan
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openModal(roadmap)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                                aria-label={`Edit ${roadmap.title}`}
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRoadmap(roadmap)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                aria-label={`Delete ${roadmap.title}`}
                              >
                                ⌫
                              </button>
                            </div>
                          </div>
                          <div className="p-2">
                            {roadmap.items.map((item) => (
                              <button
                                type="button"
                                key={item._id}
                                onClick={() => toggleItem(roadmap, item)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                              >
                                <span
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs ${item.completed ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent"}`}
                                >
                                  ✓
                                </span>
                                <span
                                  className={`min-w-0 flex-1 text-sm font-medium ${item.completed ? "text-slate-500 line-through" : "text-slate-700"}`}
                                >
                                  {item.description}
                                </span>
                                {item.targetDate && (
                                  <time className="text-xs text-slate-500">
                                    {new Date(
                                      item.targetDate,
                                    ).toLocaleDateString()}
                                  </time>
                                )}
                              </button>
                            ))}
                          </div>
                        </Card>
                      </AnimatedListItem>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <Modal
        open={modalOpen}
        title={editingRoadmap ? "Edit roadmap" : "Create roadmap"}
        onClose={() => !saving && setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[1fr_.55fr]">
            <Input
              id="roadmap-title"
              label="Roadmap title"
              placeholder="e.g. This week’s DSA plan"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <label className="block text-sm font-medium text-slate-700">
              Plan type
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
              >
                {roadmapTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Tasks</p>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div
                  key={item._id || index}
                  className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_9rem_auto]"
                >
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
                    placeholder="Task description"
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, { description: event.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500"
                    type="date"
                    value={item.targetDate}
                    onChange={(event) =>
                      updateItem(index, { targetDate: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    disabled={form.items.length === 1}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        items: current.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                    className="rounded-lg px-2 text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  >
                    ⌫
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  items: [...current.items, blankItem()],
                }))
              }
            >
              + Add task
            </Button>
          </div>
          {formError && (
            <p className="text-sm font-medium text-rose-600">{formError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRoadmap ? "Save changes" : "Create roadmap"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
