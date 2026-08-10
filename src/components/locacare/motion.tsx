import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Primitivos de motion (inspirados em ReactBits/Animbits).
 *
 * - Reveal: entrada com fade + rise + desfoque suave ao entrar na viewport
 * - Stagger/StaggerItem: cascata de filhos
 * - Todos respeitam prefers-reduced-motion
 */

const EASE_LUXE = [0.22, 0.61, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduzir = useReducedMotion();

  if (reduzir) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE_LUXE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_LUXE },
  },
};

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduzir = useReducedMotion();

  if (reduzir) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduzir = useReducedMotion();

  if (reduzir) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/** Palavra/frase com brilho dourado varrendo (shiny text). */
export function ShinyText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-shimmer", className)}>{children}</span>;
}

/**
 * Cartão com tilt 3D que segue o ponteiro (estilo ReactBits).
 * Desativado com prefers-reduced-motion e em telas de toque (sem hover).
 */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 18 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduzir || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 8);
    rotateX.set(py * -8);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={reduzir ? undefined : { rotateX: springX, rotateY: springY, transformPerspective: 1100 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax vertical baseado no progresso do próprio elemento na viewport.
 * `amount` em pixels: positivo desce, negativo sobe conforme o scroll avança.
 */
export function ParallaxY({
  children,
  amount = -40,
  className,
}: {
  children: React.ReactNode;
  amount?: number;
  className?: string;
}) {
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);

  if (reduzir) return <div className={className}>{children}</div>;

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/** Barra fina de progresso de leitura no topo da página. */
export function ScrollProgress() {
  const reduzir = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1]);

  if (reduzir) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-mint via-primary to-gold"
      style={{ scaleX, opacity }}
    />
  );
}

/**
 * Faixa marquee infinita (itens de confiança).
 * Duplica o conteúdo para o loop ser contínuo; pausa no hover.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const reduzir = useReducedMotion();
  const lista = [...items, ...items];

  return (
    <div className={cn("overflow-hidden border-y bg-secondary/50", className)}>
      <div
        className={cn(
          "flex w-max items-center gap-10 whitespace-nowrap py-3.5 [&:hover]:[animation-play-state:paused]",
          reduzir ? "" : "animate-marquee",
        )}
      >
        {lista.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium tracking-wide text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
