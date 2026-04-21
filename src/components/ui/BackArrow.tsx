"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

interface BackArrowProps {
  onClick?: (e: React.MouseEvent) => void
}

export default function BackArrow({ onClick }: BackArrowProps) {
  const reduceMotion = useReducedMotion();
  return (
    <Link href="/" onClick={onClick} className="inline-flex items-center gap-2 group" title="Back">
      <motion.span
        className="text-[#666] group-hover:text-white transition-colors duration-500 text-2xl"
        // Skip the infinite nudge when the user prefers reduced motion.
        animate={reduceMotion ? { x: 0 } : { x: [0, -6, 0] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        &larr;
      </motion.span>
      <span className="text-sm text-[var(--color-kindra-meta-low)] group-hover:text-white transition-colors duration-500">
        Kindra
      </span>
    </Link>
  );
}
