import { cn } from "@/lib/utils";
import { STATE_COLORS } from "@/lib/theme/colors";

type StateBadgeProps = {
  state: keyof typeof STATE_COLORS;
  size?: "xs" | "sm";
  className?: string;
};

export function StateBadge({ state, size = "sm", className }: StateBadgeProps) {
  const info = STATE_COLORS[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em]",
        size === "xs" ? "text-[9px]" : "text-[10px]",
        className,
      )}
      style={{ color: info.hex }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: info.hex,
          boxShadow: `0 0 6px ${info.hex}`,
        }}
      />
      {info.label}
    </span>
  );
}
