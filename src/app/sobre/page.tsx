"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import PageChrome from "@/components/layout/PageChrome";
import { timeline, philosophy } from "@/lib/content";
import { getColorValue, getColorWithAlpha } from "@/lib/colors";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
  },
};

export default function SobrePage() {
  const yellow = getColorValue("yellow");
  const router = useRouter();
  const [exploding, setExploding] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const handleBackClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (exploding) return;
      pendingNavRef.current = "/";
      setExploding(true);
    },
    [exploding],
  );

  const handleNavClick = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (exploding) return;
      pendingNavRef.current = href;
      setExploding(true);
    },
    [exploding],
  );

  const handleExplodeComplete = useCallback(() => {
    if (pendingNavRef.current) {
      router.push(pendingNavRef.current);
    }
  }, [router]);

  return (
    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[960px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Particle background */}
      <div
        className={`absolute inset-0 ${exploding ? "z-50" : "z-[1]"}`}
      >
        <ParticlePhoto
          imageSrc="/images/kindra-photo.png"
          animate
          explode={exploding}
          onExplodeComplete={handleExplodeComplete}
        />
      </div>

      {/* Left-side vignette — darkens the text column so the photo reads as an accent on the right */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 85%)",
        }}
      />

      {/* Shared chrome — grain, wordmark, HUD, strip */}
      <PageChrome
        index="04"
        label="about"
        hudRole="online · reflecting"
        onBackClick={handleBackClick}
      />

      {/* Scrollable snap container */}
      <div className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory">
        {/* Section 1 - Hero */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto">
            <motion.div variants={stagger} initial="hidden" animate="show">
              {/* Eyebrow */}
              <motion.p
                variants={fadeUp}
                className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[#555]">[</span>{" "}
                  <span className="text-[var(--color-kindra-meta-low)]">/ 04</span>{" "}
                  <span className="text-[#333]">—</span> who i am{" "}
                  <span className="text-[#555]">]</span>
                </span>
              </motion.p>

              {/* Title */}
              <motion.h1
                variants={fadeUp}
                className="mb-5 font-bold text-white tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[48px] leading-[60px]">
                  <span>
                    About <Mark color="yellow">me</Mark>
                  </span>
                  <span className="italic text-[var(--color-kindra-meta-low)] text-[28px] font-normal">
                    — co-founder &amp; builder
                  </span>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="max-w-[540px] text-[15px] leading-[26px] text-[#c8c8c8] font-light"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Co-founder at <Mark color="yellow">MokLabs Venture Studio</Mark>{" "}
                and founding team at Lugui.ai. 8 years architecting platforms at
                Arco Educação — shipping infrastructure that reached millions of
                students. Now turning that experience into ventures of my own.
              </motion.p>

              <PageNav current="/sobre" onClick={handleNavClick} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="mt-12 flex items-center gap-3 text-[9px] uppercase tracking-[0.35em] text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="inline-block h-px w-8 bg-[#333]" />
                <span>scroll &middot; journey &middot; philosophy &middot; formation</span>
                <span
                  aria-hidden
                  className="animate-bounce text-[12px] text-[#e0a458]"
                >
                  ↓
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 2 - Timeline */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-16">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.p
                variants={fadeUp}
                className="mb-4 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[#555]">[</span> / journey{" "}
                  <span className="text-[#555]">]</span>
                </span>
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="mb-8 text-[32px] leading-[42px] font-bold text-white tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                From code to{" "}
                <span className="italic text-[#8a8a8a] font-normal">
                  co-founder
                </span>
              </motion.h2>

              <div className="relative pl-8">
                {/* Track with fade top & bottom */}
                <div
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-px"
                  style={{
                    background: `linear-gradient(to bottom, transparent 0%, ${getColorWithAlpha(
                      "yellow",
                      0.35,
                    )} 12%, #333 30%, #333 70%, ${getColorWithAlpha(
                      "yellow",
                      0.35,
                    )} 88%, transparent 100%)`,
                  }}
                />

                {timeline.map((item) => (
                  <motion.div
                    key={item.year + item.title}
                    variants={fadeUp}
                    className="relative mb-8 last:mb-0"
                  >
                    {/* Dot marker */}
                    <span
                      aria-hidden
                      className="absolute -left-[35px] top-[10px] block h-[9px] w-[9px] rounded-full ring-2"
                      style={{
                        backgroundColor: yellow,
                        boxShadow: `0 0 0 3px #000`,
                      }}
                    />
                    <span
                      className="block text-[22px] font-bold"
                      style={{
                        color: yellow,
                        fontFamily: "var(--font-heading)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.year}
                    </span>
                    <h3
                      className="mt-1 text-white font-bold text-[15px]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[#888] text-[13px] leading-[20px]">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3 - Philosophy */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-16">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.p
                variants={fadeUp}
                className="mb-4 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[#555]">[</span> / philosophy{" "}
                  <span className="text-[#555]">]</span>
                </span>
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="mb-8 text-[32px] leading-[42px] font-bold text-white tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Engineering{" "}
                <span className="italic text-[#8a8a8a] font-normal">
                  principles
                </span>
              </motion.h2>

              <motion.div
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
                variants={stagger}
              >
                {philosophy.map((item, i) => (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="group/phi rounded-lg border border-[#222] bg-[#0c0c0c]/70 p-5 backdrop-blur-md transition-all duration-700"
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.19, 1, 0.22, 1)",
                    }}
                    whileHover={{
                      y: -2,
                      borderColor: getColorWithAlpha("yellow", 0.3),
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-kindra-meta-low)]"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        → {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3
                      className="mb-1.5 font-bold text-[14px]"
                      style={{
                        color: yellow,
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[#888] text-[13px] leading-[20px]">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 4 - Education / Formation */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.p
                variants={fadeUp}
                className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[#555]">[</span> / formation{" "}
                  <span className="text-[#555]">]</span>
                </span>
              </motion.p>

              <motion.p
                variants={fadeUp}
                className="max-w-[560px] text-[17px] leading-[28px] text-white/90 font-light"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span className="text-white font-bold">
                  Software Engineering
                </span>{" "}
                — specialized in{" "}
                <Mark color="yellow">Cloud Computing</Mark> (AWS, Azure) &amp;
                DevOps.
              </motion.p>

              <motion.p
                variants={fadeUp}
                className="mt-3 max-w-[520px] text-[13px] leading-[22px] text-[var(--color-kindra-meta-mid)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Analytical, visual, systems-oriented thinker. I value clarity,
                structure, and operational precision.
              </motion.p>

              {/* Footer meta row */}
              <motion.div
                variants={fadeUp}
                className="mt-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[#222]" />
                <span>
                  idx.04
                  <span className="mx-2 text-[#2a2a2a]">·</span>
                  curitiba — BRT
                  <span className="mx-2 text-[#2a2a2a]">·</span>
                  always curious
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
