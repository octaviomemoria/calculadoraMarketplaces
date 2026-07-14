"use client";

import { useEffect, useRef, useState } from "react";
import { formatPercentInput, parsePercentInput } from "@/lib/format/currency";

export function PercentInput({
  value,
  onChange,
  id,
  placeholder = "0,00",
  className = "",
}: {
  /** decimal, ex 0.12 = 12% */
  value: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(() => formatPercentInput(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setText(formatPercentInput(value));
    }
  }, [value]);

  return (
    <div className={`flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 focus-within:border-primary ${className}`}>
      <input
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          focused.current = false;
          const parsed = parsePercentInput(text);
          setText(formatPercentInput(parsed));
          onChange(parsed);
        }}
        className="w-full min-w-0 bg-transparent text-sm text-text outline-none"
      />
      <span className="text-sm text-text-muted">%</span>
    </div>
  );
}
