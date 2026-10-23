export type StatusBadgeTone =
  | "success"
  | "neutral"
  | "warning"
  | "danger"
  | "info";

type StatusBadgeProps = {
  label: string;
  tone: StatusBadgeTone;
  className?: string;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-600",
  neutral: "bg-gray-100 text-gray-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
  info: "bg-blue-50 text-blue-600",
};

export default function StatusBadge({
  label,
  tone,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      aria-label={label}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${toneClasses[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
