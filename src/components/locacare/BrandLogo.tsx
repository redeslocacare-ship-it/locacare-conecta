import React from "react";
import logo from "@/assets/locacare-logo.png";
import { cn } from "@/lib/utils";

/**
 * Componente de marca (logo).
 *
 * - Usa a logomarca oficial enviada.
 * - Mantém alt descritivo (acessibilidade).
 */
export function BrandLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/*
        Logo enviada é branca: garantimos legibilidade com uma “placa”
        usando tokens semânticos (bg-primary).
      */}
      <div className={cn("rounded-2xl bg-primary p-2 shadow-soft", compact ? "p-1.5" : "p-2")}>
        <img
          src={logo}
          alt="LocaCare — Cuidando do seu pós cirúrgico"
          className={cn("w-auto", compact ? "h-9" : "h-12 md:h-14")}
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}
