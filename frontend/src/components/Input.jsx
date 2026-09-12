import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, className = "", id, ...props },
  ref,
) {
  return (
    <label className="block" htmlFor={id}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${error ? "border-rose-400" : "border-slate-200"} ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
});

export default Input;
