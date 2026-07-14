"use client";

import { useEffect, useRef, useState } from "react";
import { formatDecimalInput, parseCurrencyInput } from "@/lib/format/currency";

export function CurrencyInput({
  value,
  onChange,
  id,
  placeholder = "0,00",
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(() => formatDecimalInput(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setText(formatDecimalInput(value));
    }
  }, [value]);

  return (
    <div className={`flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 focus-within:border-primary ${className}`}>
      <span className="text-sm text-text-muted">R$</span>
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
          const parsed = parseCurrencyInput(text);
          setText(formatDecimalInput(parsed));
          onChange(parsed);
        }}
        className="w-full min-w-0 bg-transparent text-sm text-text outline-none"
      />
    </div>
  );
}
