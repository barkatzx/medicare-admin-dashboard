interface LoadingProps {
  message?: string;
  variant?: "page" | "section";
}

export default function Loading({
  message = "Loading...",
  variant = "page",
}: LoadingProps) {
  if (variant === "section") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center md:min-h-[300px]"
      >
        <div className="relative mb-3 md:mb-5">
          {/* Desktop-only soft glow */}
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden animate-pulse rounded-full bg-emerald-400/20 blur-xl md:block"
          />
          <div className="relative h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent md:h-11 md:w-11 md:border-emerald-100 md:border-t-emerald-500" />
        </div>
        <p className="text-xs font-medium text-gray-500 md:text-sm md:tracking-wide md:text-gray-600">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-96 items-center justify-center"
    >
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-14 w-14 md:mb-6 md:h-16 md:w-16">
          {/* Desktop-only soft glow */}
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden animate-pulse rounded-full bg-emerald-400/20 blur-2xl md:block"
          />
          <div className="relative h-full w-full animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent md:border-4 md:border-emerald-100 md:border-t-emerald-500" />
        </div>
        <p className="text-sm font-medium text-gray-500 md:tracking-wide md:text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
}
