import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AnimatedListItem from "../components/AnimatedListItem";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import { PageLoader } from "../components/Spinner";
import { useToast } from "../hooks/useToast";
import * as resumeService from "../services/resumeService";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function ResumePage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const fileInput = useRef(null);
  const { showToast } = useToast();

  const loadResumes = async () => {
    setLoading(true);

    try {
      const response = await resumeService.getResumes();
      setResumes(response.resumes);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const upload = async (event) => {
    event.preventDefault();

    if (!file) {
      return showToast(
        "Choose a PDF resume before uploading",
        "error"
      );
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return showToast(
        "Only PDF resume files are allowed",
        "error"
      );
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("resume", file);

      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const response = await resumeService.uploadResume(formData);

      setResumes((current) => [
        response.resume,
        ...current
      ]);

      setFile(null);
      setNotes("");

      if (fileInput.current) {
        fileInput.current.value = "";
      }

      showToast(response.message);
    } catch (requestError) {
      showToast(
        getErrorMessage(requestError),
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const analyze = async (resume) => {
    setAnalyzingId(resume._id);
    setAnalysis(null);

    try {
      const response = await resumeService.analyzeResume(
        resume._id
      );

      setAnalysis(response.analysis);

      showToast("Resume analyzed successfully");
    } catch (requestError) {
      showToast(
        getErrorMessage(requestError),
        "error"
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const removeResume = async (resume) => {
    if (
      !window.confirm(
        `Delete version ${resume.version}?`
      )
    ) {
      return;
    }

    try {
      const response =
        await resumeService.deleteResume(
          resume._id
        );

      setResumes((current) =>
        current.filter(
          (item) => item._id !== resume._id
        )
      );

      if (analysis?.resumeId === resume._id) {
        setAnalysis(null);
      }

      showToast(response.message);
    } catch (requestError) {
      showToast(
        getErrorMessage(requestError),
        "error"
      );
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Career materials"
        title="Resume manager"
        description="Upload PDF versions, analyze your resume, and keep the right version ready to share."
      />

      <Card className="mb-6 p-5 sm:p-6">
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
          onSubmit={upload}
        >
          <Input
            ref={fileInput}
            id="resume-file"
            label="PDF resume"
            className="px-3 py-2 text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) =>
              setFile(
                event.target.files?.[0] || null
              )
            }
          />

          <Input
            id="resume-notes"
            label="Version notes (optional)"
            placeholder="e.g. Tailored for frontend roles"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
          />

          <Button
            type="submit"
            loading={uploading}
          >
            Upload new version
          </Button>
        </form>
      </Card>

      {error ? (
        <EmptyState
          title="Resumes unavailable"
          description={error}
          actionLabel="Try again"
          onAction={loadResumes}
        />
      ) : resumes.length === 0 ? (
        <EmptyState
          title="No resume versions yet"
          description="Upload a PDF to start a clean version history."
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Version history
            </div>

            <AnimatePresence initial={false}>
              {resumes.map((resume) => (
                <AnimatedListItem
                  key={resume._id}
                >
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:flex-row sm:items-center">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700">
                      v{resume.version}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {resume.fileName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Uploaded{" "}
                        {new Date(
                          resume.uploadedAt
                        ).toLocaleDateString()}
                        {resume.notes
                          ? ` · ${resume.notes}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          analyze(resume)
                        }
                        loading={
                          analyzingId ===
                          resume._id
                        }
                      >
                        Analyze
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() =>
                          resumeService.downloadResume(
                            resume._id,
                            resume.fileName
                          )
                        }
                      >
                        Download
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() =>
                          removeResume(resume)
                        }
                        className="text-rose-600 hover:text-rose-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatePresence>
          </Card>

          {analysis && (
            <Card className="mt-6 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold tracking-tight text-slate-900">
                    Resume Text Extracted
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {analysis.fileName} ·{" "}
                    {analysis.pages}{" "}
                    {analysis.pages === 1
                      ? "page"
                      : "pages"}
                  </p>
                </div>

                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Extraction successful
                </span>
              </div>

              <div className="mt-5 max-h-96 overflow-y-auto rounded-xl bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {analysis.text}
                </pre>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}