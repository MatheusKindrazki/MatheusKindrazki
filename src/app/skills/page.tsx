"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
import ContentScrim from "@/components/layout/ContentScrim";
import { skillCategories } from "@/lib/content";
import { getColorValue, getColorWithAlpha } from "@/lib/colors";
import { stagger, fadeUp, enterAt } from "@/lib/motion";
import styles from "./skills.module.css";

const BH_OFFSET_X = 200;
const GRAVITY_SELECTOR = "[data-gravity-item]";

/**
 * The "fun facts" — each one swaps the black-hole video as you scroll to it,
 * so the clip behind the quote matches what's being said. The DJ clip is the
 * default (shown on the hero + categories before any fact is reached).
 * `import("react").ReactNode` quotes use <Mark> for the accent words.
 */
const DEFAULT_VIDEO = "/images/kindra-skills-loop.mp4";

interface FunFact {
  id: string;
  eyebrow: string;
  video: string;
  videoAlt: string;
  signoff: string;
  quote: React.ReactNode;
}

const FUN_FACTS: FunFact[] = [
  {
    id: "dj",
    eyebrow: "fun fact",
    video: DEFAULT_VIDEO,
    videoAlt: "Kindra DJ",
    signoff: "mixing tracks between deploys",
    quote: (
      <>
        &ldquo;Off the clock, I&apos;m a <Mark color="blue">musician</Mark> and{" "}
        <Mark color="yellow">DJ</Mark>. Creativity doesn&apos;t stop at the
        code.&rdquo;
      </>
    ),
  },
  {
    id: "piano",
    eyebrow: "fun fact",
    video: "/images/kindra-piano.mp4",
    videoAlt: "Kindra playing piano",
    signoff: "favorite instrument, hands down",
    quote: (
      <>
        &ldquo;The <Mark color="blue">piano</Mark> is my favorite instrument —
        and, modesty aside, I <Mark color="yellow">play it well</Mark>.&rdquo;
      </>
    ),
  },
  {
    id: "borracha",
    eyebrow: "fun fact",
    video: "/images/kindra-borracha.mp4",
    videoAlt: "Kindra making rubber",
    signoff: "hands-on, far from a screen",
    quote: (
      <>
        &ldquo;Turns out I also know how to{" "}
        <Mark color="green">make rubber</Mark> — some skills don&apos;t fit in a
        repo.&rdquo;
      </>
    ),
  },
];

/**
 * The gravity rAF assumes a tall, wide desktop viewport: it warps every
 * `data-gravity-item` toward the black-hole center at innerWidth/2 + offset,
 * innerHeight/2. On the released mobile-flow shell (<=820px) and on short
 * landscape viewports (the 1024×768 P0, where the black-hole center lands
 * right on the reading column) that pull shoves the categories off-screen /
 * out of reach. Disable the warp there so the text simply stacks and scrolls.
 * Desktop (>=1280px, tall) keeps the signature pull untouched.
 */
const SHORT_VIEWPORT_QUERY = "(max-width: 820px), (max-height: 760px)";

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
  // The black-hole video is driven by which fun-fact section is in view.
  // Lifted here so the background render-prop and the content can share it.
  const [activeVideo, setActiveVideo] = useState(DEFAULT_VIDEO);

  return (
    <PageShell
      hudRole="online · thinking"
      stripText="◈ MK · capability stacks · idx.03"
      style={shellStyle}
      persistentBackground
      background={() => <SkillsBackground videoSrc={activeVideo} />}
    >
      <SkillsContent onActiveVideoChange={setActiveVideo} />
    </PageShell>
  );
}

/**
 * The black hole is a full-viewport Pixi scene (registers via context, renders
 * null) — it persists across navigation and has no navigation-tied dissolve
 * like ParticlePhoto. `persistentBackground` on the shell above tells the nav
 * machine so: it runs the fade-band slew (veil + push at mid-flight) itself
 * instead of waiting for an explode that never visually happens. Completing
 * the explode synchronously here (the old approach) made every navigation
 * leaving /skills an unmasked hard cut under a still-playing band.
 */
function SkillsBackground({ videoSrc }: { videoSrc: string }) {
  // `videoSrc` is driven by the active fun-fact section (scroll). Changing it
  // re-runs BlackHoleLayer.prepareMedia, swapping the clip inside the hole.
  // The DJ clip is a boomerang (forward+reverse pre-concat) so it loops with
  // no hard cut; the piano/rubber clips just loop natively.
  return (
    <>
      <BlackHole src={videoSrc} alt="Kindra" offsetX={BH_OFFSET_X} />
      {/* Black hole sits right-of-center; darken the left so the left-anchored
          text column stays legible over it. */}
      <ContentScrim side="left" intensity="strong" />
      {/* Narrow-only: under the released shell the column re-centers over the
          black hole — this route-local scrim recedes the bright video so the
          stacked category chips stay readable (no-op >=821px). */}
      <div aria-hidden className={styles.legibility} />
    </>
  );
}

function SkillsContent({
  onActiveVideoChange,
}: {
  onActiveVideoChange: (src: string) => void;
}) {
  const { onNavClick } = useShellNav();
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // True when the released shell or a short landscape viewport is active —
  // the gravity warp is disabled there so categories stack and scroll
  // normally. SSR-safe (false on first paint, matching the desktop default).
  const [warpDisabled, setWarpDisabled] = useState(false);
  const totalSkills = skillCategories.reduce(
    (acc, cat) => acc + cat.skills.length,
    0,
  );

  useEffect(() => {
    const mql = window.matchMedia(SHORT_VIEWPORT_QUERY);
    const update = () => setWarpDisabled(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    if (reduceMotion || warpDisabled) {
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
          // Damp the warp so text stays readable: the gravitational pull is a
          // signature touch, not a legibility tax. 0.62 keeps the motion felt
          // without smearing the pull-quote into the black hole.
          const strength = proximity * proximity * ramp * 0.62;

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
          // Only the closest items blur, and gently — never enough to make the
          // reading text fuzzy.
          const blur = Math.max(0, strength - 0.5) * 0.45;

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
  }, [reduceMotion, warpDisabled]);

  return (
    <ScrollStage ref={scrollRef}>
      {/* Section 1 — Hero. Enters via the CSS `.enter-rise` idiom
          (globals.css), not framer `initial="hidden"` — the SSR HTML must
          paint the h1 before the pixi-heavy bundle hydrates (deep-link LCP). */}
      <Section data-gravity-item align="left" className={styles.section}>
        <div>
          <div className="enter-rise" style={enterAt(0)}>
            <Eyebrow index="03" label="what i do" />
          </div>

          <h1
            className="enter-rise mb-4 font-bold tracking-[-0.02em]"
            style={{
              ...enterAt(1),
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
          </h1>

          <p
            className="enter-rise max-w-[560px] font-normal"
            style={{
              ...enterAt(2),
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
              lineHeight: "24px",
              color: "var(--color-kindra-meta-high)",
            }}
          >
            Technologies I use to ship coherent systems at scale — from platform
            work to applied AI.
          </p>

          <PageNav current="/skills" onClick={onNavClick} />

          {/* Continuous horizontal marquee of skill tokens */}
          <div
            className="enter-rise mt-10 overflow-hidden opacity-70 select-none"
            style={{
              ...enterAt(3),
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
          </div>

          <motion.div
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
        </div>
      </Section>

      {/* Section 2 — Categories grid. One column always: the right column used
          to land on top of the right-side black hole / DJ video and become
          illegible. Stacked vertically and clamped narrower than the standard
          measure so even the widest chip row stays clear of the video circle
          (centered at innerWidth/2 + BH_OFFSET_X, ~160px radius) across
          1280–1920px. */}
      <Section
        align="left"
        measure="narrow"
        innerClassName="!max-w-[520px]"
        className={styles.section}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-y-9"
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

      {/* Sections 3–5 — fun facts as pull-quotes, each swapping the black-hole
          video as it scrolls into view (DJ → piano → rubber). The last one
          carries the footer meta row. */}
      {FUN_FACTS.map((fact, i) => (
        <FunFactSection
          key={fact.id}
          fact={fact}
          onActive={onActiveVideoChange}
          metaRow={
            i === FUN_FACTS.length - 1 ? (
              <MetaRow
                items={[
                  "idx.03",
                  `${totalSkills} capabilities`,
                  "still learning",
                ]}
              />
            ) : null
          }
        />
      ))}
    </ScrollStage>
  );
}

/**
 * One fun-fact section. An IntersectionObserver tells the page which video to
 * show in the black hole while this section owns the viewport, so the clip
 * matches the quote. Falls back gracefully (no observer support → no swap).
 */
function FunFactSection({
  fact,
  onActive,
  metaRow,
}: {
  fact: FunFact;
  onActive: (src: string) => void;
  metaRow: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // The rootMargin collapses the root to a thin band across the
          // vertical middle of the viewport, so this fires whenever the
          // section crosses the screen's center — regardless of how tall the
          // section is. (The old `ratio >= 0.5` was unreachable: sections are
          // ~900px but a -25%/-25% root is only ~450px, so the ratio capped
          // at ~0.47 and the swap never triggered.)
          if (entry.isIntersecting) {
            onActive(fact.video);
          }
        }
      },
      { threshold: 0, rootMargin: "-45% 0px -45% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fact.video, onActive]);

  return (
    <Section ref={ref} data-gravity-item align="left" className={styles.section}>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={stagger}
      >
        <Eyebrow label={fact.eyebrow} />

        <motion.blockquote
          variants={fadeUp}
          className="max-w-[600px] italic font-normal"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-h2)",
            lineHeight: 1.35,
            color:
              "color-mix(in srgb, var(--color-kindra-text-white) 90%, transparent)",
          }}
        >
          {fact.quote}
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
          <span className="mr-2" style={{ color: "var(--color-kindra-rule)" }}>
            —
          </span>{" "}
          {fact.signoff}
        </motion.p>

        {metaRow && (
          <motion.div variants={fadeUp} className="mt-12">
            {metaRow}
          </motion.div>
        )}
      </motion.div>
    </Section>
  );
}
