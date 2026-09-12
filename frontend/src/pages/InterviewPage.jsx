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
import * as interviewService from "../services/interviewService";
import { getErrorMessage } from "../utils/getErrorMessage";

const categories = ["technical", "HR", "behavioral"];
const blankInterview = {
  question: "",
  category: "technical",
  company: "",
  notes: "",
  practiced: false,
  confidence: null,
};

export default function InterviewPage() {
  const [interviews, setInterviews] = useState([]);
  const [filters, setFilters] = useState({ category: "", company: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [form, setForm] = useState(blankInterview);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value),
      );
      const response = await interviewService.getInterviews(activeFilters);
      setInterviews(response.interviews);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [filters.category, filters.company]);

  const openModal = (interview = null) => {
    setEditingInterview(interview);
    setForm(
      interview
        ? { ...interview, confidence: interview.confidence ?? null }
        : blankInterview,
    );
    setFormError("");
    setModalOpen(true);
  };

  const saveInterview = async (event) => {
    event.preventDefault();
    if (!form.question.trim())
      return setFormError("An interview question is required");
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        question: form.question.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
        confidence:
          form.confidence === "" ? null : Number(form.confidence) || null,
      };
      const response = editingInterview
        ? await interviewService.updateInterview(editingInterview._id, payload)
        : await interviewService.createInterview(payload);
      setInterviews((current) =>
        editingInterview
          ? current.map((item) =>
              item._id === response.interview._id ? response.interview : item,
            )
          : [response.interview, ...current],
      );
      setModalOpen(false);
      showToast(response.message);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const togglePracticed = async (interview) => {
    const previous = interviews;
    setInterviews((current) =>
      current.map((item) =>
        item._id === interview._id
          ? { ...item, practiced: !item.practiced }
          : item,
      ),
    );
    try {
      const response = await interviewService.updateInterview(interview._id, {
        practiced: !interview.practiced,
      });
      setInterviews((current) =>
        current.map((item) =>
          item._id === interview._id ? response.interview : item,
        ),
      );
    } catch (requestError) {
      setInterviews(previous);
      showToast(getErrorMessage(requestError), "error");
    }
  };

  const removeInterview = async (interview) => {
    if (!window.confirm("Delete this interview question?")) return;
    try {
      const response = await interviewService.deleteInterview(interview._id);
      setInterviews((current) =>
        current.filter((item) => item._id !== interview._id),
      );
      showToast(response.message);
    } catch (requestError) {
      showToast(getErrorMessage(requestError), "error");
    }
  };

  if (loading) return <PageLoader />;
  const companies = [
    ...new Set(
      interviews.map((interview) => interview.company).filter(Boolean),
    ),
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Interview prep"
        title="Question bank"
        description="Practice the stories, concepts, and technical explanations you want ready on interview day."
        action={<Button onClick={() => openModal()}>+ Add question</Button>}
      />
      <Card className="mb-5 overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Filter questions
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          <select
            value={filters.category}
            onChange={(event) =>
              setFilters({ ...filters, category: event.target.value })
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filters.company}
            onChange={(event) =>
              setFilters({ ...filters, company: event.target.value })
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          >
            <option value="">All companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </Card>
      {error ? (
        <EmptyState
          title="Interview questions unavailable"
          description={error}
          actionLabel="Try again"
          onAction={loadInterviews}
        />
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No questions in this view"
          description="Add your first prompt or adjust the active filters."
          actionLabel="Add question"
          onAction={() => openModal()}
        />
      ) : (
        <div className="space-y-7">
          {categories.map((category) => {
            const group = interviews.filter(
              (interview) => interview.category === category,
            );
            if (!group.length) return null;
            return (
              <section key={category}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                    {category}
                  </h2>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {group.map((interview) => (
                      <AnimatedListItem key={interview._id}>
                        <Card className="p-4 sm:p-5">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => togglePracticed(interview)}
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs ${interview.practiced ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent"}`}
                              aria-label="Toggle practiced"
                            >
                              ✓
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p
                                    className={`font-semibold leading-6 ${interview.practiced ? "text-slate-500 line-through" : "text-slate-900"}`}
                                  >
                                    {interview.question}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {interview.company && (
                                      <Badge tone="slate">
                                        {interview.company}
                                      </Badge>
                                    )}
                                    {interview.confidence && (
                                      <Badge
                                        tone={
                                          interview.confidence >= 4
                                            ? "green"
                                            : interview.confidence >= 3
                                              ? "amber"
                                              : "red"
                                        }
                                      >
                                        Confidence {interview.confidence}/5
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openModal(interview)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeInterview(interview)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    ⌫
                                  </button>
                                </div>
                              </div>
                              {interview.notes && (
                                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-500">
                                  {interview.notes}
                                </p>
                              )}
                            </div>
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
        title={
          editingInterview
            ? "Edit interview question"
            : "Add interview question"
        }
        onClose={() => !saving && setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={saveInterview}>
          <Input
            id="interview-question"
            label="Question"
            placeholder="e.g. Explain a project trade-off"
            value={form.question}
            onChange={(event) =>
              setForm({ ...form, question: event.target.value })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Category
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <Input
              id="interview-company"
              label="Company (optional)"
              placeholder="e.g. Acme"
              value={form.company}
              onChange={(event) =>
                setForm({ ...form, company: event.target.value })
              }
            />
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Confidence (optional)
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              value={form.confidence ?? ""}
              onChange={(event) =>
                setForm({ ...form, confidence: event.target.value })
              }
            >
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}/5
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              rows="4"
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
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
              {editingInterview ? "Save changes" : "Create question"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
