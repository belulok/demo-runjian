import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type OrnateTitleProps = {
  children: ReactNode;
  accentColor?: string;
  size?: "xs" | "sm" | "md";
  notch?: boolean;
  align?: "left" | "center";
  className?: string;
};

/**
 * Cinzel display title with optional gilded notch flourish (the WoW touch).
 */
export function OrnateTitle({
  children,
  accentColor,
  size = "sm",
  notch = false,
  align = "left",
  className,
}: OrnateTitleProps) {
  const sizeClass =
    size === "xs"
      ? "text-[10px] tracking-[0.32em]"
      : size === "sm"
        ? "text-[11px] tracking-[0.3em]"
        : "text-[14px] tracking-[0.24em]";

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 font-display font-semibold uppercase",
        sizeClass,
        align === "center" && "justify-center",
        notch && "notch-gold",
        className,
      )}
      style={{ color: accentColor ?? "var(--color-text-primary)" }}
    >
      {accentColor && (
        <span
          className="inline-block h-1 w-1 rotate-45"
          style={{
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
        />
      )}
      <span>{children}</span>
    </div>
  );
}
