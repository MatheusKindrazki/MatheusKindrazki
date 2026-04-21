"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Identity from "@/components/ui/Identity";
import { useLiveTime } from "@/hooks/useLiveTime";

interface PageChromeProps {
  /** Zero-padded index, e.g. "01", "02" — shown in wordmark and default strip. */
  index: string;
  /** Page label, e.g. "co-founder & builder", "projects". */
  label: string;
  /** Optional override for the vertical right-edge strip. */
  stripText?: string;
  /** Optional override for the HUD role line (default: "online · building"). */
  hudRole?: string;
  /** Show the tiny "← back" link under the wordmark label. Default: true. */
  showBack?: boolean;
  /** Custom click handler for the back link (e.g. to trigger particle explode). */
  onBackClick?: (e: React.MouseEvent) => void;
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1.4, delay: 0.7 } },
};

export default function PageChrome({
  index,
  label,
  stripText,
  hudRole = "online · building",
  showBack = true,
  onBackClick,
}: PageChromeProps) {
  const time = useLiveTime();
  const strip = stripText ?? `◈ MK · ${label} · idx.${index}`;

  return (
    <>
      {/* Grain overlay — fixed, full-viewport (identical across pages) */}
      <div
        aria-hidden
        className="animate-grain fixed inset-0 pointer-events-none z-[2] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
        }}
      />

      {/* Top-left — Identity dots + wordmark (absolute to parent 1280px container) */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="absolute top-[49px] left-6 z-30 flex items-center gap-4"
      >
        <Identity status="rest" />
        <div
          className="hidden sm:flex flex-col text-[10px] tracking-[0.22em] uppercase text-[var(--color-kindra-meta-low)] leading-[1.5]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <span>Matheus · Kindrazki</span>
          <span className="text-[var(--color-kindra-meta-low)]">
            {label} · idx.{index}
          </span>
          {showBack && (
            <Link
              href="/"
              onClick={onBackClick}
              className="mt-1 inline-flex w-fit items-center gap-1 text-[var(--color-kindra-meta-low)] transition-colors duration-500 hover:text-white"
            >
              <span aria-hidden>&larr;</span>
              <span>back</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Top-right — live HUD */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="absolute top-[49px] right-6 z-30 hidden sm:block text-right"
      >
        <div
          className="text-[10px] tracking-[0.25em] uppercase text-[var(--color-kindra-meta-low)] leading-[1.7]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="flex items-center justify-end gap-2">
            <span className="relative inline-flex h-[6px] w-[6px]">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#419d78] opacity-70" />
              <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#419d78]" />
            </span>
            <span className="text-[#888]">{hudRole}</span>
          </div>
          <div
            className="mt-2 text-[12px] tracking-[0.2em] text-white/80"
            style={{
              fontFamily: "var(--font-body)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {time}
          </div>
          <div className="mt-0.5">Curitiba · BRT · -25.42° -49.27°</div>
          <div className="text-[var(--color-kindra-meta-low)]">portfolio · v3.0 · 2026</div>
        </div>
      </motion.div>

      {/* Right-edge vertical brand strip */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="absolute right-5 top-1/2 z-30 hidden text-[9px] uppercase tracking-[0.4em] text-[var(--color-kindra-meta-low)] md:block pointer-events-none"
        style={{
          fontFamily: "var(--font-body)",
          writingMode: "vertical-rl",
          transform: "translateY(-50%) rotate(180deg)",
        }}
      >
        {strip}
      </motion.div>
    </>
  );
}
