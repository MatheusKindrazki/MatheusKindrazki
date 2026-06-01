"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import SkillBadge from "@/components/ui/SkillBadge";
import BlackHole from "@/components/ui/BlackHole";
import Eyebrow from "@/components/ui/Eyebrow";
import MetaRow from "@/components/ui/MetaRow";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import { skillCategories } from "@/lib/content";
import { getColorValue, getColorWithAlpha } from "@/lib/colors";
import { stagger, fadeUp } from "@/lib/motion";

const BH_OFFSET_X = 200;
const GRAVITY_SELECTOR = "[data-gravity-item]";

// Flat list of standout skill tokens for the hero marquee.
const MARQUEE_TOKENS: string[] = skillCategories.flatMap((c) => c.skills);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resetGravityStyles(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(GRAVITY_SELECTOR).forEach((item) => {
    item.style.transform = "";
    item.style.filter = "";
    item.style.opacity = "";
    item.style.willChange = "";
  });
}

export default function SkillsPage() {
  const accent = getColorValue("blue");
  const shellStyle = {
    "--project-accent": accent,
  } as CSSProperties;

  return (
    <PageShell
      hudRole="online · thinking"
      stripText="◈ MK · capability stacks · idx.03"
      style={shellStyle}
      background={({ exploding, onExplodeComplete }) => (
        <SkillsBackground
          exploding={exploding}
          onExplodeComplete={onExplodeComplete}
        />
      )}
    >
      <SkillsContent />
    </PageShell>
  );
}

interface SkillsBackgroundProps {
  exploding: boolean;
  onExplodeComplete: () => void;
}

/**
 * The black hole is a full-viewport Pixi scene (registers via context, renders
 * null) — it has no navigation-tied dissolve like ParticlePhoto. So when the
 * shell's explode→navigate machine fires, we complete the transition straight
 * away so inter-page links still navigate. Keeps skills' signature visual while
 * sharing the one nav machine that PageShell owns.
 */
function SkillsBackground({ exploding, onExplodeComplete }: SkillsBackgroundProps) {
  useEffect(() => {
    if (exploding) onExplodeComplete();
  }, [exploding, onExplodeComplete]);

  return <BlackHole src="/images/kindra-skills.mp4" alt="Kindra DJ" offsetX={BH_OFFSET_X} />;
}

function SkillsContent() {
  const { onNavClick } = useShellNav();
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const totalSkills = skillCategories.reduce(
    (acc, cat) => acc + cat.skills.length,
    0,
  );

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    if (reduceMotion) {
      resetGravityStyles(scrollEl);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const update = (now: number) => {
      const bhX = window.innerWidth / 2 + BH_OFFSET_X;
      const bhY = window.innerHeight / 2;
      const range = Math.min(980, Math.max(560, window.innerWidth * 0.72));
      const ramp = clamp01((now - startedAt) / 2600);

      scrollEl
        .querySelectorAll<HTMLElement>(GRAVITY_SELECTOR)
        .forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const itemX = rect.left + rect.width * 0.5;
          const itemY = rect.top + rect.height * 0.5;
          const dx = bhX - itemX;
          const dy = bhY - itemY;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const proximity = clamp01(1 - Math.max(0, distance - 90) / range);
          const strength = proximity * proximity * ramp;

          if (strength < 0.006) {
            item.style.transform = "";
            item.style.filter = "";
            item.style.opacity = "";
            return;
          }

          const nx = dx / distance;
          const ny = dy / distance;
          const tidal = Math.sin(now * 0.0012 + index * 1.7) * strength;
          const pullX = nx * (34 + strength * 56) * strength;
          const pullY = ny * (18 + strength * 38) * strength;
          const rotate = (ny * 2.8 + tidal * 1.6) * strength;
          const skewX = -nx * 5.5 * strength;
          const skewY = ny * 3.4 * strength;
          const scaleX = 1 + strength * 0.055;
          const scaleY = 1 - strength * 0.022;
          const blur = Math.max(0, strength - 0.62) * 0.7;

          item.style.willChange = "transform, filter, opacity";
          item.style.transformOrigin = `${nx > 0 ? "right" : "left"} center`;
          item.style.transform = [
            `translate3d(${pullX.toFixed(2)}px, ${pullY.toFixed(2)}px, 0)`,
            `rotate(${rotate.toFixed(3)}deg)`,
            `skew(${skewX.toFixed(3)}deg, ${skewY.toFixed(3)}deg)`,
            `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`,
          ].join(" ");
          item.style.filter = blur > 0 ? `blur(${blur.toFixed(3)}px)` : "";
          item.style.opacity = String(1 - strength * 0.08);
        });

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      resetGravityStyles(scrollEl);
    };
  }, [reduceMotion]);

  return (
    <ScrollStage ref={scrollRef}>
      {/* Section 1 — Hero */}
      <Section data-gravity-item>
        <motion.div variants={stagger} initial="hidden" animate="show">
          <Eyebrow index="03" label="what i do" />

          <motion.h1
            variants={fadeUp}
            className="mb-4 font-bold tracking-[-0.02em]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-kindra-text-white)",
            }}
          >
            <span
              className="flex flex-wrap items-baseline gap-x-5 gap-y-1"
              style={{ fontSize: "var(--text-h1)", lineHeight: 1.1 }}
            >
              <Mark color="blue">Skills</Mark>
              <span
                className="italic font-normal"
                style={{
                  color: "var(--color-kindra-meta-low)",
                  fontSize: "var(--text-h2)",
                }}
              >
                — tools i reach for daily
              </span>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="max-w-[560px] font-light"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
              lineHeight: "24px",
              color: "var(--color-kindra-meta-high)",
            }}
          >
            Technologies I use to ship coherent systems at scale — from platform
            work to applied AI.
          </motion.p>

          <PageNav current="/skills" onClick={onNavClick} />

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
                  className="tracking-[0.2em] uppercase"
                  style={{
                    fontSize: "var(--text-eyebrow)",
                    color: "var(--color-kindra-meta-low)",
                  }}
                >
                  <span
                    className="mr-2"
                    style={{ color: "var(--color-kindra-rule-strong)" }}
                  >
                    /
                  </span>
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
            className="mt-10 flex items-center gap-3 uppercase tracking-[0.35em]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "9px",
              color: "var(--color-kindra-meta-low)",
            }}
          >
            <span
              className="inline-block h-px w-8"
              style={{ background: "var(--color-kindra-rule)" }}
            />
            <span>scroll · {skillCategories.length} capability stacks</span>
            <span
              aria-hidden
              className="animate-bounce"
              style={{ fontSize: "12px", color: "var(--color-kindra-blue)" }}
            >
              ↓
            </span>
          </motion.div>
        </motion.div>
      </Section>

      {/* Section 2 — Categories grid */}
      <Section>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-x-8 gap-y-9 md:grid-cols-2"
        >
          {skillCategories.map((category) => {
            const categoryAccent = getColorValue(category.color);
            return (
              <div key={category.title} data-gravity-item>
                <motion.div variants={fadeUp} className="group/cat">
                  <h2
                    className="font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: categoryAccent,
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-eyebrow)",
                    }}
                  >
                    {category.title}
                  </h2>
                  <div
                    className="mt-2 mb-4 h-px w-full transition-opacity duration-700"
                    style={{
                      backgroundColor: getColorWithAlpha(category.color, 0.25),
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
              </div>
            );
          })}
        </motion.div>
      </Section>

      {/* Section 3 — Fun fact as pull-quote */}
      <Section data-gravity-item>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <Eyebrow label="fun fact" />

          <motion.blockquote
            variants={fadeUp}
            className="max-w-[600px] italic font-normal"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-h2)",
              lineHeight: 1.35,
              color: "color-mix(in srgb, var(--color-kindra-text-white) 90%, transparent)",
            }}
          >
            &ldquo;Off the clock, I&apos;m a <Mark color="blue">musician</Mark>{" "}
            and <Mark color="yellow">DJ</Mark>. Creativity doesn&apos;t stop at
            the code.&rdquo;
          </motion.blockquote>

          <motion.p
            variants={fadeUp}
            className="mt-6 uppercase tracking-[0.3em]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-eyebrow)",
              color: "var(--color-kindra-meta-low)",
            }}
          >
            <span
              className="mr-2"
              style={{ color: "var(--color-kindra-rule)" }}
            >
              —
            </span>{" "}
            mixing tracks between deploys
          </motion.p>

          {/* Footer meta row */}
          <motion.div variants={fadeUp} className="mt-12">
            <MetaRow
              items={["idx.03", `${totalSkills} capabilities`, "still learning"]}
            />
          </motion.div>
        </motion.div>
      </Section>
    </ScrollStage>
  );
}
