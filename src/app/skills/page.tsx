"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import SkillBadge from "@/components/ui/SkillBadge";
import BlackHole from "@/components/ui/BlackHole";
import PageChrome from "@/components/layout/PageChrome";
import { skillCategories } from "@/lib/content";
import { getColorValue, getColorWithAlpha } from "@/lib/colors";

const BH_OFFSET_X = 200;

// Flat list of standout skill tokens for the hero marquee.
const MARQUEE_TOKENS: string[] = skillCategories.flatMap((c) => c.skills);

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

export default function SkillsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [gravityActive, setGravityActive] = useState(false);
  const gravityIntensityRef = useRef(0); // 0→1 ramp-up after formation
  const reduceMotion = useReducedMotion();

  const handleFormationComplete = useCallback(() => {
    setGravityActive(true);
  }, []);

  // Gravitational distortion on scroll - only after black hole explodes.
  // Skipped entirely when the user prefers reduced motion: the 0.08s-linear
  // transform jitter on every section is exactly the kind of movement the
  // preference is meant to suppress.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !gravityActive || reduceMotion) return;

    let rafId: number;
    const startTime = performance.now();
    const RAMP_DURATION = 1500; // 1.5s to reach full gravity

    const update = () => {
      const now = performance.now();
      // Smoothly ramp up gravity intensity after activation
      gravityIntensityRef.current = Math.min(
        1,
        (now - startTime) / RAMP_DURATION,
      );
      const intensity = gravityIntensityRef.current;

      const vh = window.innerHeight;
      const scrollTop = scrollEl.scrollTop;

      sectionsRef.current.forEach((el, i) => {
        if (!el) return;

        // Section center Y in viewport coords
        const sectionTop = i * vh - scrollTop;
        const sectionCenterY = sectionTop + vh / 2;

        // Distance from black hole center
        const bhY = vh / 2;
        const dy = sectionCenterY - bhY;
        const distance = Math.abs(dy);
        const maxRange = vh * 1.3;

        if (distance > maxRange) {
          el.style.transform = "";
          return;
        }

        // Proximity: 0 (far) → 1 (at black hole center)
        const raw = 1 - distance / maxRange;
        const proximity = raw * raw * intensity; // Quadratic + intensity ramp

        // Direction: sections above BH get pulled down, below get pulled up
        const sign = dy > 0 ? -1 : 1;

        // Gravitational effects
        const pullX = proximity * 45;
        const pullY = sign * proximity * 25;
        const skewY = sign * proximity * 5;
        const skewX = proximity * 2;
        const rotateZ = sign * proximity * 1.5;
        const scaleX = 1 + proximity * 0.04;
        const scaleY = 1 - proximity * 0.02;

        el.style.transform = [
          `perspective(600px)`,
          `translate(${pullX}px, ${pullY}px)`,
          `skew(${skewX}deg, ${skewY}deg)`,
          `rotate(${rotateZ}deg)`,
          `scale(${scaleX}, ${scaleY})`,
        ].join(" ");
        el.style.transformOrigin = "left center";
        el.style.transition = "transform 0.08s linear";
      });

      // Keep running rAF during ramp-up even without scroll
      if (intensity < 1) {
        rafId = requestAnimationFrame(update);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    // Start ramp-up animation
    rafId = requestAnimationFrame(update);

    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [gravityActive, reduceMotion]);

  const setSectionRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      sectionsRef.current[index] = el;
    },
    [],
  );

  const totalSkills = skillCategories.reduce(
    (acc, cat) => acc + cat.skills.length,
    0,
  );

  // Total sections: 1 hero + 1 categories-grid + 1 fun-fact
  const totalSections = 3;

  return (
    <>
      {/* Black hole - full viewport, never clipped */}
      <BlackHole
        src="/images/kindra-skills.mp4"
        alt="Kindra DJ"
        offsetX={BH_OFFSET_X}
        onFormationComplete={handleFormationComplete}
      />

      <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[960px] overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Shared chrome — grain, wordmark, HUD, strip */}
        <PageChrome index="03" label="skills" hudRole="online · thinking" />

        {/* Scrollable snap container */}
        <div
          ref={scrollRef}
          className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory"
        >
          {/* Section 1 - Hero */}
          <section
            ref={setSectionRef(0)}
            className="min-h-full snap-start flex items-center"
          >
            <div className="w-[90%] max-w-[650px] mx-auto">
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                {/* Eyebrow */}
                <motion.p
                  variants={fadeUp}
                  className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                  <span>
                    <span className="text-[#555]">[</span>{" "}
                    <span className="text-[var(--color-kindra-meta-low)]">/ 03</span>{" "}
                    <span className="text-[#333]">—</span> what i do{" "}
                    <span className="text-[#555]">]</span>
                  </span>
                </motion.p>

                {/* Title */}
                <motion.h1
                  variants={fadeUp}
                  className="mb-4 font-bold text-white tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[48px] leading-[60px]">
                    <Mark color="blue">Skills</Mark>
                    <span className="italic text-[var(--color-kindra-meta-low)] text-[30px] font-normal">
                      — tools i reach for daily
                    </span>
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="max-w-[560px] text-[15px] leading-[24px] text-[#c8c8c8] font-light"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Technologies I use to ship coherent systems at scale — from
                  platform work to applied AI.
                </motion.p>

                <PageNav current="/skills" />

                {/* Continuous horizontal marquee of skill tokens */}
                <motion.div
                  variants={fadeUp}
                  className="mt-10 overflow-hidden opacity-70 select-none"
                  style={{
                    maskImage:
                      "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                  }}
                >
                  <div
                    className="flex w-max gap-6 animate-marquee whitespace-nowrap"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {[...MARQUEE_TOKENS, ...MARQUEE_TOKENS].map((t, i) => (
                      <span
                        key={`${t}-${i}`}
                        className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-kindra-meta-low)]"
                      >
                        <span className="text-[#333] mr-2">/</span>
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="mt-10 flex items-center gap-3 text-[9px] uppercase tracking-[0.35em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="inline-block h-px w-8 bg-[#333]" />
                  <span>scroll &middot; 5 capability stacks</span>
                  <span
                    aria-hidden
                    className="animate-bounce text-[12px] text-[#53a2be]"
                  >
                    ↓
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Section 2 - Categories grid */}
          <section
            ref={setSectionRef(1)}
            className="min-h-full snap-start flex items-center py-12"
          >
            <div className="w-[90%] max-w-[650px] mx-auto">
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 gap-x-8 gap-y-9 md:grid-cols-2"
              >
                {skillCategories.map((category) => {
                  const accent = getColorValue(category.color);
                  return (
                    <motion.div
                      key={category.title}
                      variants={fadeUp}
                      className="group/cat"
                    >
                      <h2
                        className="text-[11px] font-bold uppercase tracking-[0.22em]"
                        style={{
                          color: accent,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {category.title}
                      </h2>
                      <div
                        className="mt-2 mb-4 h-px w-full transition-opacity duration-700"
                        style={{
                          backgroundColor: getColorWithAlpha(
                            category.color,
                            0.25,
                          ),
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        {category.skills.map((skill) => (
                          <SkillBadge
                            key={skill}
                            name={skill}
                            color={category.color}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>

          {/* Section 3 - Fun fact as pull-quote */}
          <section
            ref={setSectionRef(totalSections - 1)}
            className="min-h-full snap-start flex items-center"
          >
            <div className="w-[90%] max-w-[650px] mx-auto">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={stagger}
              >
                <motion.p
                  variants={fadeUp}
                  className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                  <span>
                    <span className="text-[#555]">[</span> / fun fact{" "}
                    <span className="text-[#555]">]</span>
                  </span>
                </motion.p>

                <motion.blockquote
                  variants={fadeUp}
                  className="max-w-[600px] text-[28px] leading-[38px] italic text-white/90 font-normal"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  &ldquo;Off the clock, I&apos;m a{" "}
                  <Mark color="blue">musician</Mark> and{" "}
                  <Mark color="yellow">DJ</Mark>. Creativity doesn&apos;t stop
                  at the code.&rdquo;
                </motion.blockquote>

                <motion.p
                  variants={fadeUp}
                  className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="mr-2 text-[#444]">—</span> mixing tracks
                  between deploys
                </motion.p>

                {/* Footer meta row */}
                <motion.div
                  variants={fadeUp}
                  className="mt-12 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="h-px w-10 bg-[#222]" />
                  <span>
                    idx.03
                    <span className="mx-2 text-[#2a2a2a]">·</span>
                    {totalSkills} capabilities
                    <span className="mx-2 text-[#2a2a2a]">·</span>
                    still learning
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
