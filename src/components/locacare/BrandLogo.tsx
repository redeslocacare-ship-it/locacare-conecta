import React, { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import logo from "@/assets/locacare-logo-nova.png";
import { cn } from "@/lib/utils";

/**
 * Componente de marca (logo) — animação de destaque em camadas.
 *
 * 1. Aura: brilho mint/navy pulsando atrás da marca
 * 2. Entrada: revelação em "wipe" (clip-path) da esquerda para a direita
 * 3. Assinatura: traço gradiente que se desenha sob a logo após a revelação
 * 4. Contínuo: brilho duplo varrendo a marca a cada ciclo
 * 5. Hover: tilt 3D seguindo o ponteiro + zoom com mola
 *
 * Tudo respeita prefers-reduced-motion.
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
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 16 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 16 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduzir || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
    rotateX.set(((e.clientY - rect.top) / rect.height - 0.5) * -14);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const sizes: Record<string, string> = {
    sm: "h-8",
    default: "h-10 md:h-12",
    lg: "h-12 md:h-14",
    xl: "h-14 md:h-16",
    "2xl": "h-16 md:h-20",
  };

  const key = compact ? "sm" : size;

  return (
    <motion.div
      ref={ref}
      className={cn("group relative inline-flex flex-col items-start", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileHover={reduzir ? undefined : { scale: 1.05 }}
      style={reduzir ? undefined : { rotateX: springX, rotateY: springY, transformPerspective: 700 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      {/* Aura pulsante atrás da marca */}
      {!reduzir && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-full bg-mint/25 blur-2xl"
            animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.95, 1.06, 0.95] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -inset-y-5 rounded-full bg-primary/10 blur-3xl"
            animate={{ opacity: [0.2, 0.45, 0.2], scale: [1.05, 0.96, 1.05] }}
            transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
        </>
      )}

      {/* Marca com revelação em wipe + brilho contínuo */}
      <motion.div
        className="relative overflow-hidden"
        initial={reduzir ? false : { clipPath: "inset(0 100% 0 0)", opacity: 0 }}
        animate={reduzir ? undefined : { clipPath: "inset(0 0% 0 0)", opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 }}
      >
        <img
          src={logo}
          alt="LocaCare — Cuidando do seu pós-cirúrgico"
          className={cn("relative w-auto select-none", sizes[key])}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        {/* Máscara com a própria arte: o brilho só existe dentro do desenho da marca */}
        <span
          aria-hidden
          className="logo-shine"
          style={{
            WebkitMaskImage: `url(${logo})`,
            maskImage: `url(${logo})`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />
      </motion.div>

      {/* Traço-assinatura desenhando sob a logo */}
      <motion.span
        aria-hidden
        className="mt-1 h-[2.5px] w-full origin-left rounded-full bg-gradient-to-r from-mint via-primary to-gold"
        initial={reduzir ? false : { scaleX: 0, opacity: 0 }}
        animate={reduzir ? undefined : { scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1], delay: 0.85 }}
      />
    </motion.div>
  );
}
