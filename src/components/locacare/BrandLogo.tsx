import React from "react";
import logo from "@/assets/locacare-logo.png";
import { cn } from "@/lib/utils";

/**
 * Componente de marca (logo).
 *
 * - Usa a logomarca oficial enviada.
 * - Mantém alt descritivo (acessibilidade).
 * - Prop size="xl" para destacar no header.
 */
export function BrandLogo({
  className,
  compact = false,
  size = "default",
}: {
  className?: string;
  compact?: boolean;
  size?: "default" | "xl";
}) {
  const sizeClasses = size === "xl" ? "h-16 md:h-20" : compact ? "h-9" : "h-12 md:h-14";
  const paddingClasses = size === "xl" ? "p-3" : compact ? "p-1.5" : "p-2";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/*
        Logo enviada é branca: garantimos legibilidade com uma "placa"
        usando tokens semânticos (bg-primary).
      */}
      <div className={cn("rounded-2xl bg-primary shadow-soft", paddingClasses)}>
        <img
          src={logo}
          alt="LocaCare — Cuidando do seu pós cirúrgico"
          className={cn("w-auto", sizeClasses)}
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}
