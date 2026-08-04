import React from "react";
import logo from "@/assets/locacare-logo-nova.jpg";
import { cn } from "@/lib/utils";

/**
 * Componente de marca (logo).
 *
 * - Nova identidade: wordmark navy + ícone esmeralda sobre fundo branco.
 * - mix-blend-multiply "apaga" o fundo branco do JPEG sobre qualquer base clara,
 *   deixando a marca limpa e em evidência, sem chip/moldura.
 */
export function BrandLogo({
  className,
  compact = false,
  size = "default",
}: {
  className?: string;
  compact?: boolean;
  size?: "sm" | "default" | "lg" | "xl" | "2xl";
}) {
  const sizes: Record<string, string> = {
    sm: "h-8",
    default: "h-10 md:h-12",
    lg: "h-12 md:h-14",
    xl: "h-14 md:h-16",
    "2xl": "h-16 md:h-20",
  };

  const key = compact ? "sm" : size;

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logo}
        alt="LocaCare — Cuidando do seu pós-cirúrgico"
        className={cn("w-auto select-none mix-blend-multiply", sizes[key])}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
