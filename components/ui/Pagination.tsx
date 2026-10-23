import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  currentPage: number;
  loading?: boolean;
  recordLabel?: string;
  activeClassName?: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  pagination,
  currentPage,
  loading = false,
  recordLabel,
  activeClassName,
  onPageChange,
}: PaginationProps) {
  const totalPages = Number.isFinite(pagination.pages)
    ? Math.max(0, Math.floor(pagination.pages))
    : 0;
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  const safeCurrentPage = Number.isFinite(currentPage)
    ? Math.min(Math.max(1, currentPage), totalPages)
    : 1;
  const safePage = Number.isFinite(pagination.page)
    ? Math.min(Math.max(1, pagination.page), totalPages)
    : 1;
  const total = Number.isFinite(pagination.total)
    ? Math.max(0, pagination.total)
    : 0;
  const limit = Number.isFinite(pagination.limit)
    ? Math.max(1, pagination.limit)
    : 1;
  let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  const pageNumbers = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );

  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-3 py-3 sm:px-6 sm:py-4 md:bg-white">
      <p className="text-[11px] text-gray-500 sm:text-sm md:tabular-nums">
        {total === 0 ? 0 : (safePage - 1) * limit + 1}–
        {Math.min(safePage * limit, total)} of{" "}
        {total}
        {recordLabel ? ` ${recordLabel}` : ""}
      </p>
      <div className="flex max-w-full items-center gap-1 overflow-x-auto sm:gap-2 md:gap-1.5 md:overflow-visible">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1 || loading}
          aria-label="Previous page"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl md:h-9 md:w-9 md:rounded-xl md:border-gray-100 md:text-gray-600 md:transition-colors md:hover:bg-gray-50 md:hover:text-gray-900 md:disabled:hover:bg-white"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((pageNum) => (
          <button
            type="button"
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            aria-label={`Page ${pageNum}`}
            aria-current={safeCurrentPage === pageNum ? "page" : undefined}
            className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-medium transition-all sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm md:h-9 md:min-w-9 md:rounded-xl md:px-0 md:text-[13px] md:font-semibold md:transition-colors ${
              safeCurrentPage === pageNum
                ? activeClassName ||
                  "bg-black text-white border border-black md:border-black md:bg-black md:hover:bg-gray-700"
                : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-50 md:border-gray-100 md:text-gray-600 md:hover:border-gray-200 md:hover:bg-gray-50 md:hover:text-gray-900 md:disabled:hover:bg-white"
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(totalPages, safeCurrentPage + 1))
          }
          disabled={safeCurrentPage === totalPages || loading}
          aria-label="Next page"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl md:h-9 md:w-9 md:rounded-xl md:border-gray-100 md:text-gray-600 md:transition-colors md:hover:bg-gray-50 md:hover:text-gray-900 md:disabled:hover:bg-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
