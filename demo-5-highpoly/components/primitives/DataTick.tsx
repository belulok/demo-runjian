import { cn } from "@/lib/utils";

type DataTickProps = {
  value: string | number;
  unit?: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  tone?: "default" | "good" | "warn" | "bad" | "muted";
  align?: "left" | "right" | "center";
  className?: string;
};

/**
 * Share Tech Mono numeric — used for every quantity in the UI.
 */
export function DataTick({
  value,
  unit,
  label,
  size = "sm",
  tone = "default",
  align = "right",
  className,
}: DataTickProps) {
  const sizeClass =
    size === "xs"
      ? "text-[10px]"
      : size === "sm"
        ? "text-xs"
        : size === "md"
          ? "text-sm"
          : size === "lg"
            ? "text-lg"
            : "text-2xl";

  const toneClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : tone === "bad"
          ? "text-red-400"
          : tone === "muted"
            ? "text-text-muted"
            : "text-text-primary";

  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className={cn("flex flex-col leading-tight", alignClass, className)}>
      {label && (
        <span className="text-[9px] font-condensed font-semibold uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>
      )}
      <span className={cn("font-mono", sizeClass, toneClass)}>
        {value}
        {unit && <span className="text-text-muted ml-1">{unit}</span>}
      </span>
    </div>
  );
}
