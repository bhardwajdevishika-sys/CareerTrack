import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import ProblemSheetRow from "../components/ProblemSheetRow";
import { PageLoader } from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import * as problemService from "../services/problemService";
import * as topicService from "../services/topicService";
import { getErrorMessage } from "../utils/getErrorMessage";

const blankTopic = {
  name: "",
  progress: "not-started",
  difficulty: "medium",
  notes: "",
  revisionDate: "",
};

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form, setForm] = useState(blankTopic);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const reduceMotion = useReducedMotion();

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicsResponse, problemsResponse] = await Promise.all([
        topicService.getTopics(),
        problemService.getProblems(),
      ]);
      setTopics(topicsResponse.topics);
      setProblems(problemsResponse.problems);
      setExpandedTopicId(
        (current) => current || topicsResponse.topics[0]?._id || null,
      );
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (topic = null) => {
    setEditingTopic(topic);
    setForm(
      topic
        ? { ...topic, revisionDate: topic.revisionDate?.slice(0, 10) || "" }
        : blankTopic,
    );
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Topic name is required");
      return;
    }

    setSaving(true);
    setFormError("");
    const payload = { ...form, name: form.name.trim() };
    if (!payload.revisionDate) delete payload.revisionDate;

    try {
      const response = editingTopic
        ? await topicService.updateTopic(editingTopic._id, payload)
        : await topicService.createTopic(payload);
      setModalOpen(false);
      setExpandedTopicId(response.topic._id);
      showToast(response.message);
      loadData();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (topic) => {
    if (
      !window.confirm(
        `Delete “${topic.name}”? Linked problems must be removed first.`,
      )
    )
      return;
    try {
      const response = await topicService.deleteTopic(topic._id);
      showToast(response.message);
      loadData();
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    }
  };

  const updateProblemOptimistically = async (problem, changes) => {
    const previousProblems = problems;
    const optimisticProblem = { ...problem, ...changes };
    setProblems((current) =>
      current.map((item) =>
        item._id === problem._id ? optimisticProblem : item,
      ),
    );

    try {
      const response = await problemService.updateProblem(problem._id, changes);
      setProblems((current) =>
        current.map((item) =>
          item._id === problem._id
            ? { ...item, ...response.problem, topic: item.topic }
            : item,
        ),
      );
    } catch (requestError) {
      setProblems(previousProblems);
      showToast(getErrorMessage(requestError), "error");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="DSA tracker"
        title="Practice sheet"
        description="Open a topic, work through its checklist, and make progress visible at a glance."
        action={<Button onClick={() => openModal()}>+ Add topic</Button>}
      />
      {error ? (
        <EmptyState
          title="Topics unavailable"
          description={error}
          actionLabel="Try again"
          onAction={loadData}
        />
      ) : topics.length === 0 ? (
        <EmptyState
          title="No topics yet"
          description="Add your first topic to begin building your practice sheet."
          actionLabel="Add topic"
          onAction={() => openModal()}
        />
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => {
            const topicProblems = problems.filter(
              (problem) => (problem.topic?._id || problem.topic) === topic._id,
            );
            const solvedCount = topicProblems.filter(
              (problem) => problem.status === "solved",
            ).length;
            const progress = topicProblems.length
              ? Math.round((solvedCount / topicProblems.length) * 100)
              : 0;
            const expanded = expandedTopicId === topic._id;

            return (
              <Card key={topic._id} className="overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTopicId(expanded ? null : topic._id)
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <motion.span
                      animate={{ rotate: expanded ? 90 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18 }}
                      className="text-slate-500"
                    >
                      ›
                    </motion.span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <p className="font-bold tracking-tight text-slate-900">
                          {topic.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {solvedCount}/{topicProblems.length} solved
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className="h-full rounded-full bg-violet-600"
                          initial={false}
                          animate={{ width: `${progress}%` }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.28,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal(topic)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Edit ${topic.name}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(topic)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${topic.name}`}
                  >
                    ⌫
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={
                        reduceMotion ? undefined : { height: 0, opacity: 0 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.22,
                        ease: "easeOut",
                      }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="px-2 py-2 sm:px-3">
                        {topicProblems.length ? (
                          topicProblems.map((problem) => (
                            <ProblemSheetRow
                              key={problem._id}
                              problem={problem}
                              onToggleSolved={(item) =>
                                updateProblemOptimistically(item, {
                                  status:
                                    item.status === "solved"
                                      ? "attempted"
                                      : "solved",
                                })
                              }
                              onToggleRevision={(item) =>
                                updateProblemOptimistically(item, {
                                  markedForRevision: !item.markedForRevision,
                                })
                              }
                            />
                          ))
                        ) : (
                          <div className="px-3 py-8 text-center">
                            <p className="text-sm text-slate-500">
                              No problems in this topic yet.
                            </p>
                            <Link
                              to="/problems"
                              className="mt-2 inline-block text-sm font-semibold text-violet-600"
                            >
                              Open the problems sheet →
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
      <Modal
        open={modalOpen}
        title={editingTopic ? "Edit topic" : "Add a topic"}
        onClose={() => !saving && setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            id="topic-name"
            label="Topic name"
            placeholder="e.g. Binary Search"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Progress
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                value={form.progress}
                onChange={(event) =>
                  setForm({ ...form, progress: event.target.value })
                }
              >
                <option value="not-started">Not started</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Difficulty
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                value={form.difficulty}
                onChange={(event) =>
                  setForm({ ...form, difficulty: event.target.value })
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          </div>
          <Input
            id="revision-date"
            label="Revision date"
            type="date"
            value={form.revisionDate}
            onChange={(event) =>
              setForm({ ...form, revisionDate: event.target.value })
            }
          />
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              rows="4"
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              placeholder="What should future you remember?"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </label>
          {formError && (
            <p className="text-sm font-medium text-rose-600">{formError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingTopic ? "Save changes" : "Create topic"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
