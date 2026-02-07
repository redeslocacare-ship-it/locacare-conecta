import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Divisor de seção (diagonal) com motion.
 *
 * - Usa currentColor para herdar tokens semânticos via classes Tailwind (text-*)
 * - Respeita prefers-reduced-motion
 */
export function SectionDivider({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className={cn("relative -mt-px", className)}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn("block h-10 w-full sm:h-12 md:h-16", flip && "rotate-180")}
        fill="currentColor"
      >
        {/* Diagonal suave */}
        <path d="M0,96L1440,16L1440,120L0,120Z" />
      </svg>
    </motion.div>
  );
}
