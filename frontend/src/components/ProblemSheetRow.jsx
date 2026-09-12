import { motion, useReducedMotion } from "framer-motion";
import Badge from "./Badge";
import DifficultyBadge from "./DifficultyBadge";

export default function ProblemSheetRow({
  problem,
  onToggleSolved,
  onToggleRevision,
  onEdit,
  onDelete,
  showTopic = false,
}) {
  const reduceMotion = useReducedMotion();
  const solved = problem.status === "solved";

  return (
    <motion.div
      layout
      className={`group flex min-w-0 items-center gap-3 border-b border-slate-100 px-3 py-3 transition hover:bg-slate-100/70 sm:gap-4 ${solved ? "opacity-70" : ""}`}
    >
      <input
        type="checkbox"
        checked={solved}
        onChange={() => onToggleSolved(problem)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 bg-white text-violet-600 accent-violet-500 focus:ring-2 focus:ring-violet-400"
        aria-label={`Mark ${problem.title} as ${solved ? "unsolved" : "solved"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p
            className={`truncate text-sm font-semibold ${solved ? "text-slate-500 line-through" : "text-slate-900"}`}
          >
            {problem.title}
          </p>
          <DifficultyBadge difficulty={problem.difficulty} />
          <Badge tone="slate">{problem.platform}</Badge>
          {showTopic && problem.topic?.name && (
            <span className="text-xs text-slate-500">{problem.topic.name}</span>
          )}
        </div>
        {problem.notes && (
          <p className="mt-1 truncate text-xs text-slate-500">
            {problem.notes}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <motion.button
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          onClick={() => onToggleRevision(problem)}
          aria-label={`${problem.markedForRevision ? "Remove" : "Add"} ${problem.title} ${problem.markedForRevision ? "from" : "to"} revision list`}
          aria-pressed={problem.markedForRevision}
          className={`rounded-lg p-2 text-sm transition ${problem.markedForRevision ? "bg-violet-50 text-violet-700" : "text-slate-400 hover:bg-slate-100 hover:text-violet-600"}`}
        >
          {problem.markedForRevision ? "★" : "☆"}
        </motion.button>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(problem)}
            className="hidden rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(problem)}
            className="hidden rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 sm:inline-flex"
          >
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}
