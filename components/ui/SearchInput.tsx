import { Loader2, Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  containerClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  clearable?: boolean;
  loading?: boolean;
};

export default function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  containerClassName = "relative w-full",
  inputClassName = "w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500",
  iconClassName = "text-gray-400",
  clearable = true,
  loading = false,
}: SearchInputProps) {
  return (
    <div className={containerClassName}>
      {loading ? (
        <Loader2
          aria-hidden="true"
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin ${iconClassName}`}
          size={15}
        />
      ) : (
        <Search
          aria-hidden="true"
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${iconClassName}`}
          size={15}
        />
      )}
      <input
        type="text"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
      {clearable && value && (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
