"use client";

import { useRef } from "react";

import { motion, useScroll, useTransform } from "framer-motion";
import PageNav from "@/components/ui/PageNav";
import Eyebrow from "@/components/ui/Eyebrow";
import MetaRow from "@/components/ui/MetaRow";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import {
  nowBuilding,
  nowLearning,
  nowNotDoing,
  nowReading,
  nowThinking,
  site,
  type NowStatus,
} from "@/lib/content";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { useMobileFlow } from "@/hooks/useMobileFlow";

// Presentation only — all /now data lives in src/lib/content.ts, where the
// Building column is derived from `projects` (status === 'current') so the
// two pages can never disagree.
const statusTone: Record<NowStatus, string> = {
  building: "var(--color-kindra-yellow)",
  alpha: "var(--color-kindra-blue)",
  beta: "var(--color-kindra-blue)",
  "in-progress": "var(--color-kindra-green)",
  "in-production": "var(--color-kindra-green)",
};

const statusOrder: NowStatus[] = [
  "building",
  "alpha",
  "beta",
  "in-progress",
  "in-production",
];

// ──────────────────────────────────────────────────────────────────────
// Instrument cluster — the dashboard signature of /now. Preserved.
// Counters derive from the real nowBuilding array (itself derived from
// `projects`); the "days ago" stamp reads site.lastUpdatedIso, which is
// injected at build time from the last git commit touching content.ts.
// ──────────────────────────────────────────────────────────────────────
function InstrumentCluster() {
  const reduceMotion = usePrefersReducedMotion();

  const statusCounts = statusOrder
    .map((status) => ({
      status,
      count: nowBuilding.filter((i) => i.status === status).length,
    }))
    .filter(({ count }) => count > 0);

  const lastUpdated = new Date(site.lastUpdatedIso + "T00:00:00Z");
  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const paddedDays = String(diffDays).padStart(2, "0");

  return (
    <aside
      role="status"
      aria-label="Current activity summary"
      className="mt-4 font-data tabular-nums"
    >
      <div className="flex flex-col gap-3 text-data uppercase tracking-[0.1em] text-[var(--color-kindra-meta-low)] md:flex-row md:items-baseline md:justify-between md:gap-8">
        <span className="inline-flex items-baseline gap-3">
          <span
            aria-hidden="true"
            className="inline-block translate-y-[1px] text-[var(--color-kindra-meta-mid)]"
            style={
              reduceMotion
                ? { opacity: 1 }
                : {
                    animation:
                      "now-pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }
            }
          >
            ◆
          </span>
          <span>
            {statusCounts.map(({ status, count }, i) => (
              <span key={status}>
                {i > 0 && (
                  <span className="mx-2 text-[var(--color-kindra-rule)]">·</span>
                )}
                <span className="text-[var(--color-kindra-meta-mid)]">
                  {count}
                </span>{" "}
                {status}
              </span>
            ))}
          </span>
        </span>

        <span className="inline-flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span>
            <span className="text-[var(--color-kindra-rule-strong)]">//</span>{" "}
            updated{" "}
            <span className="text-[var(--color-kindra-meta-mid)]">
              {paddedDays}
            </span>{" "}
            days ago
          </span>
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-6 h-px w-full bg-[var(--color-kindra-rule)]"
      />

      <style jsx>{`
        @keyframes now-pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          span[aria-hidden="true"] {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Footer live-dot — slow blink green diamond. Preserved.
// ──────────────────────────────────────────────────────────────────────
function FooterLiveDot() {
  const reduceMotion = usePrefersReducedMotion();
  return (
    <>
      <span
        aria-hidden="true"
        className="mr-2 inline-block align-baseline text-[var(--color-kindra-green)]"
        style={
          reduceMotion
            ? { opacity: 1 }
            : {
                animation:
                  "now-blink 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }
        }
      >
        ◆
      </span>
      <style jsx>{`
        @keyframes now-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.35;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          span[aria-hidden="true"] {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Column — a single department in the Spread. Header with index + name
// in accent color, italic subtitle, hairline rule, then item list.
// ──────────────────────────────────────────────────────────────────────
interface ColumnProps {
  index: string;
  title: string;
  italic: string;
  color: string; // CSS var expression
  children: React.ReactNode;
}

function Column({ index, title, italic, color, children }: ColumnProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2 font-data text-data tabular-nums tracking-[0.1em] uppercase text-[var(--color-kindra-meta-low)]">
        <span>/ {index}</span>
      </div>
      <h2
        className="mt-2 font-bold tracking-[-0.02em] leading-[1.02]"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
          color,
        }}
      >
        {title}
      </h2>
      <div
        className="mt-1 text-[12px] italic text-[var(--color-kindra-meta-mid)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {italic}
      </div>
      <div
        aria-hidden="true"
        className="mt-4 h-px w-full bg-[var(--color-kindra-rule)]"
      />
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

export default function NowPage() {
  return (
    <PageShell hudRole="online · living" stripText={`◈ MK · currently · ${site.lastUpdated}`}>
      <NowContent />
    </PageShell>
  );
}

function NowContent() {
  const reduceMotion = usePrefersReducedMotion();
  const isMobileFlow = useMobileFlow();
  const { onNavClick } = useShellNav();

  // ONE parallax instance, wired to the ScrollStage scroll container (the
  // shell traps scroll inside a fixed-height box, so window.scrollY never
  // moves — useScroll must target the actual scroll element).
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const parallaxY = useTransform(scrollY, [0, 500], [0, -60]);

  // Below the 820px shell release the shell becomes height:auto and .scroll
  // turns overflow:visible — the page scrolls on the window, NOT on scrollRef.
  // The container-bound useScroll then never advances, but the y transform
  // still offsets the hero, lifting "Currently" above the page (top:-1030px,
  // unreachable). Disable parallax on mobile-flow (and reduced motion) so the
  // hero is a plain in-flow first block that scrolls naturally.
  const parallaxEnabled = !reduceMotion && !isMobileFlow;

  return (
    <ScrollStage ref={scrollRef}>
      {/* ─────────────────────────────────────────────────────────
          Section 1 — MASSIVE HERO
         ───────────────────────────────────────────────────────── */}
      <Section bare>
        <div
          className="mx-auto w-[90%]"
          style={{ maxWidth: "var(--measure-ledger)" }}
        >
          <motion.div
            style={parallaxEnabled ? { y: parallaxY } : undefined}
            className="will-change-transform w-full"
          >
            <Eyebrow
              index="06"
              label="a living page"
              accent="var(--color-kindra-green)"
            />

            {/* Massive ornamental title — display type scale */}
            <h1
              className="mt-8 font-bold text-[var(--color-kindra-text-white)]"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-display)",
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
              }}
            >
              Currently
            </h1>

            {/* & thinking ahead */}
            <p
              className="mt-4 italic text-[var(--color-kindra-meta-mid)] tracking-[-0.01em]"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
                lineHeight: 1.1,
              }}
            >
              <span
                aria-hidden="true"
                className="not-italic inline-block align-baseline shimmer-neutral"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                  fontSize: "1.3em",
                  transform: "rotate(-5deg) translateY(0.08em)",
                  marginRight: "0.12em",
                  lineHeight: 1,
                  color: "var(--color-kindra-meta-mid)",
                }}
              >
                &amp;
              </span>
              thinking ahead
            </p>

            {/* Lede */}
            <p
              className="mt-8 max-w-[640px] text-[var(--color-kindra-text)] font-normal"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-deck)",
                lineHeight: 1.55,
              }}
            >
              A snapshot of what&apos;s on my desk, in my head, and on my
              calendar. This page is short on purpose — the timestamp below
              comes straight from the last content commit, not a promise.
            </p>

            {/* Instrument cluster */}
            <InstrumentCluster />
          </motion.div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────
          Section 2 — THE SPREAD (4-column magazine grid)
         ───────────────────────────────────────────────────────── */}
      <Section bare>
        <div
          className="mx-auto w-[90%]"
          style={{ maxWidth: "var(--measure-ledger)" }}
        >
          {/* Breakpoints aligned to the 820px shell release: 1 col below 820
              (mobile flow reads as a single column), 2 cols once the shell is
              a fixed-height viewport again, 4 cols at xl (desktop unchanged). */}
          <div className="grid items-start grid-cols-1 gap-12 min-[820px]:grid-cols-2 xl:grid-cols-4 xl:gap-10">
            {/* Column 1 — BUILDING (yellow) */}
            <Column
              index="01"
              title="Building"
              italic="— on my desk"
              color="var(--color-kindra-yellow)"
            >
              {nowBuilding.map((item) => (
                <div key={item.name}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span
                      aria-hidden="true"
                      className="inline-block translate-y-[-1px] text-[12px] leading-none"
                      style={{ color: statusTone[item.status] }}
                    >
                      ◆
                    </span>
                    <h3
                      className="text-[17px] font-bold text-[var(--color-kindra-text-white)] tracking-[-0.01em] leading-[1.25]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {item.name}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 pl-[18px] text-[13px] text-[var(--color-kindra-meta-mid)]"
                    style={{
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </Column>

            {/* Column 2 — LEARNING (blue) */}
            <Column
              index="02"
              title="Learning"
              italic="— slow & deliberate"
              color="var(--color-kindra-blue)"
            >
              {nowLearning.map((item) => (
                <div key={item.name}>
                  <h3
                    className="text-[17px] font-bold text-[var(--color-kindra-text-white)] tracking-[-0.01em] leading-[1.25]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="mt-1.5 text-[13px] text-[var(--color-kindra-meta-mid)]"
                    style={{
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </Column>

            {/* Column 3 — READING (green) */}
            <Column
              index="03"
              title="Reading"
              italic="— on the nightstand"
              color="var(--color-kindra-green)"
            >
              {nowReading.map((item) => (
                <div key={item.name}>
                  <h3
                    className="text-[16px] font-bold italic text-[var(--color-kindra-text-white)] tracking-[-0.01em] leading-[1.3]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="mt-1.5 text-[13px] text-[var(--color-kindra-meta-mid)]"
                    style={{
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </Column>

            {/* Column 4 — THINKING ABOUT (red) */}
            <Column
              index="04"
              title="Thinking about"
              italic="— unresolved"
              color="var(--color-kindra-red)"
            >
              {nowThinking.map((line) => (
                <p
                  key={line}
                  className="italic text-[var(--color-kindra-meta-high)] tracking-[-0.01em]"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(1.0625rem, 1.35vw, 1.1875rem)",
                    lineHeight: 1.3,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="not-italic inline-block mr-2 align-baseline"
                    style={{
                      color: "var(--color-kindra-red)",
                      fontSize: "1.2em",
                      transform: "rotate(-5deg) translateY(0.05em)",
                      lineHeight: 1,
                    }}
                  >
                    &rsaquo;
                  </span>
                  {line}
                </p>
              ))}
            </Column>
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────────
          Section 3 — FEATURED QUOTE (the thesis)
         ───────────────────────────────────────────────────────── */}
      <Section measure="wide" innerClassName="flex flex-col justify-center">
        {/* Hairline above */}
        <div
          aria-hidden="true"
          className="mb-3 h-px w-16 bg-[var(--color-kindra-rule-strong)]"
        />
        {/* Label with signature square marker */}
        <p className="mb-6 flex items-center gap-2 font-data text-data tabular-nums tracking-[0.1em] uppercase text-[var(--color-kindra-meta-low)]">
          <span
            aria-hidden="true"
            className="inline-block"
            style={{
              width: "0.5em",
              height: "0.5em",
              backgroundColor: "var(--color-kindra-yellow)",
            }}
          />
          <span>/ thesis</span>
        </p>
        {/* The line */}
        <p
          className="text-balance font-bold text-[var(--color-kindra-text-white)]"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 4.5vw, 3.75rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Mechanisms over magic. Coherence over cleverness.
        </p>
      </Section>

      {/* ─────────────────────────────────────────────────────────
          Section 4 & 5 — NOT DOING & FOOTER
         ───────────────────────────────────────────────────────── */}
      <Section bare>
        <div className="mx-auto flex w-[90%] flex-col" style={{ maxWidth: "var(--measure-ledger)" }}>
          {/* Spacer to push Not Doing to the center */}
          <div className="flex flex-col items-center justify-center text-center">
            <p className="mb-10 flex items-center gap-2 font-data text-data tabular-nums tracking-[0.1em] uppercase text-[var(--color-kindra-red)]">
              <span
                aria-hidden="true"
                className="inline-block"
                style={{
                  width: "0.5em",
                  height: "0.5em",
                  backgroundColor: "currentColor",
                }}
              />
              <span>/ not doing</span>
            </p>

            <div className="flex flex-col gap-6">
              {nowNotDoing.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                  <span
                    className="line-through decoration-[var(--color-kindra-red)] decoration-2 text-[18px] md:text-[22px] font-medium text-[var(--color-kindra-meta-low)]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.name}
                  </span>
                  <span className="font-data text-data tabular-nums uppercase tracking-[0.1em] text-[var(--color-kindra-meta-low)]">
                    <span className="text-[var(--color-kindra-rule-strong)]">//</span>{" "}
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <footer className="mt-16 w-full">
            <MetaRow
              items={[
                <>
                  <FooterLiveDot />
                  idx.06
                </>,
                "living document",
                <>last update · {site.lastUpdated}</>,
                <>
                  /now inspired by{" "}
                  <a
                    href="https://nownownow.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[var(--color-kindra-rule)] underline-offset-2 transition-colors duration-500 hover:text-[var(--color-kindra-text-white)] hover:decoration-[var(--color-kindra-yellow)]"
                  >
                    nownownow.com
                  </a>
                </>,
              ]}
            />

            <PageNav current="/now" onClick={onNavClick} />
          </footer>
        </div>
      </Section>
    </ScrollStage>
  );
}
