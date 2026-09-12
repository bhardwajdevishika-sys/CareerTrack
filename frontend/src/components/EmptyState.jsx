import Button from "./Button";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-xl text-violet-700">
        ✦
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
