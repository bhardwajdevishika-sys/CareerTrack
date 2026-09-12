const tones = {
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function Badge({ children, tone = "slate" }) {
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}
