const SIZES = { xs: "h-3 w-3 border", sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

export function Spinner({ className = "", size = "md" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 ${SIZES[size] || SIZES.md} ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
