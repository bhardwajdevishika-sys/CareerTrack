import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AnimatedListItem from "../components/AnimatedListItem";
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
import { getTopics } from "../services/topicService";
import { getErrorMessage } from "../utils/getErrorMessage";

const blankProblem = {
  title: "",
  topic: "",
  platform: "LeetCode",
  status: "not-started",
  difficulty: "easy",
  link: "",
  notes: "",
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({
    topic: "",
    status: "",
    platform: "",
    difficulty: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [form, setForm] = useState(blankProblem);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadTopics = async () => {
    const response = await getTopics();
    setTopics(response.topics);
  };

  const loadProblems = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value),
      );
      const response = await problemService.getProblems(activeFilters);
      setProblems(response.problems);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics().catch((requestError) =>
      setError(getErrorMessage(requestError)),
    );
  }, []);
  useEffect(() => {
    loadProblems();
  }, [filters.topic, filters.status, filters.platform, filters.difficulty]);

  const openModal = (problem = null) => {
    setEditingProblem(problem);
    setForm(
      problem
        ? {
            ...problem,
            topic: problem.topic?._id || problem.topic,
            link: problem.link || "",
            notes: problem.notes || "",
          }
        : { ...blankProblem, topic: topics[0]?._id || "" },
    );
    setFormError("");
    setModalOpen(true);
  };

  const updateProblemOptimistically = async (problem, changes) => {
    const previousProblems = problems;
    setProblems((current) =>
      current.map((item) =>
        item._id === problem._id ? { ...item, ...changes } : item,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.topic) {
      setFormError("A title and topic are required");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = { ...form, title: form.title.trim() };
    if (!payload.link) delete payload.link;
    if (!payload.notes) delete payload.notes;
    try {
      const response = editingProblem
        ? await problemService.updateProblem(editingProblem._id, payload)
        : await problemService.createProblem(payload);
      setModalOpen(false);
      showToast(response.message);
      loadProblems();
      loadTopics();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (problem) => {
    if (!window.confirm(`Delete “${problem.title}”?`)) return;
    const previousProblems = problems;
    setProblems((current) =>
      current.filter((item) => item._id !== problem._id),
    );
    try {
      const response = await problemService.deleteProblem(problem._id);
      showToast(response.message);
      loadTopics();
    } catch (requestError) {
      setProblems(previousProblems);
      showToast(getErrorMessage(requestError), "error");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        eyebrow="Practice log"
        title="Problem sheet"
        description="Check off solved problems, flag revision targets, and work through your list with intent."
        action={<Button onClick={() => openModal()}>+ Add problem</Button>}
      />
      <Card className="mb-5 overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Filter your sheet
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["topic", "All topics"],
            ["status", "All statuses"],
            ["platform", "All platforms"],
            ["difficulty", "All difficulties"],
          ].map(([key, label]) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(event) =>
                setFilters({ ...filters, [key]: event.target.value })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            >
              <option value="">{label}</option>
              {key === "topic" &&
                topics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name}
                  </option>
                ))}
              {key === "status" &&
                ["not-started", "attempted", "solved"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              {key === "platform" &&
                ["LeetCode", "GFG", "HackerRank", "Codeforces"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              {key === "difficulty" &&
                ["easy", "medium", "hard"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          ))}
        </div>
      </Card>
      {error ? (
        <EmptyState
          title="Problems unavailable"
          description={error}
          actionLabel="Try again"
          onAction={loadProblems}
        />
      ) : problems.length === 0 ? (
        <EmptyState
          title="No problems in this view"
          description="Add a problem or adjust your filters to keep working through your sheet."
          actionLabel="Add problem"
          onAction={() => openModal()}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[28px_minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-3 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 sm:grid">
            <span>✓</span>
            <span>Problem</span>
            <span>Revision</span>
          </div>
          <AnimatePresence initial={false}>
            {problems.map((problem) => (
              <AnimatedListItem key={problem._id}>
                <ProblemSheetRow
                  problem={problem}
                  showTopic
                  onToggleSolved={(item) =>
                    updateProblemOptimistically(item, {
                      status: item.status === "solved" ? "attempted" : "solved",
                    })
                  }
                  onToggleRevision={(item) =>
                    updateProblemOptimistically(item, {
                      markedForRevision: !item.markedForRevision,
                    })
                  }
                  onEdit={openModal}
                  onDelete={handleDelete}
                />
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </Card>
      )}
      <Modal
        open={modalOpen}
        title={editingProblem ? "Edit problem" : "Add a problem"}
        onClose={() => !saving && setModalOpen(false)}
      >
        {!topics.length ? (
          <EmptyState
            title="Create a topic first"
            description="Problems are always connected to one of your own topics."
          />
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="problem-title"
              label="Problem title"
              placeholder="e.g. Two Sum"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Topic
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  value={form.topic}
                  onChange={(event) =>
                    setForm({ ...form, topic: event.target.value })
                  }
                >
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Platform
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  value={form.platform}
                  onChange={(event) =>
                    setForm({ ...form, platform: event.target.value })
                  }
                >
                  {["LeetCode", "GFG", "HackerRank", "Codeforces"].map(
                    (value) => (
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  {["not-started", "attempted", "solved"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
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
                  {["easy", "medium", "hard"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Input
              id="problem-link"
              label="Problem link (optional)"
              type="url"
              placeholder="https://..."
              value={form.link}
              onChange={(event) =>
                setForm({ ...form, link: event.target.value })
              }
            />
            <label className="block text-sm font-medium text-slate-700">
              Notes
              <textarea
                rows="3"
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
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
                {editingProblem ? "Save changes" : "Create problem"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
