import { motion, useReducedMotion } from "framer-motion";

const variants = {
  primary:
    "bg-violet-600 text-white shadow-sm hover:bg-violet-700 focus:ring-violet-200",
  secondary:
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 focus:ring-slate-200",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200",
  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200",
};

export default function Button({
  children,
  className = "",
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      whileHover={
        reduceMotion || variant !== "primary" ? undefined : { scale: 1.015 }
      }
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
}
