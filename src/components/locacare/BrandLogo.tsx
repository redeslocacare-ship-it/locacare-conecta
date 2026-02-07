import React from "react";
import logo from "@/assets/locacare-logo.png";
import { cn } from "@/lib/utils";

/**
 * Componente de marca (logo).
 *
 * - Usa a logomarca oficial enviada.
 * - Mantém alt descritivo (acessibilidade).
 */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="LocaCare — Cuidando do seu pós cirúrgico"
        className={cn(
          "h-10 w-auto",
          compact ? "h-9" : "h-10",
        )}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
