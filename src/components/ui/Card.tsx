import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-bg-elevated p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
