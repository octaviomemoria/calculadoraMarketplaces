"use client";

import { useState } from "react";
import { Button } from "./Button";

export function CopySummaryButton({
  getText,
  textToCopy,
  label = "Copiar resumo para WhatsApp",
  className = "",
  variant = "secondary",
}: {
  getText?: () => string;
  textToCopy?: string;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const text = textToCopy !== undefined ? textToCopy : getText ? getText() : "";
      if (!text) return;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Não foi possível copiar automaticamente para a área de transferência.");
    }
  }

  return (
    <Button
      variant={copied ? "primary" : variant}
      onClick={handleCopy}
      className={`transition-all ${className}`}
      title="Copiar resumo formatado para colar no WhatsApp ou redes"
    >
      {copied ? "✓ Copiado com sucesso!" : `📋 ${label}`}
    </Button>
  );
}
