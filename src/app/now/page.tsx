"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PageNav from "@/components/ui/PageNav";

import { motion, useScroll, useTransform } from "framer-motion";
import PageChrome from "@/components/layout/PageChrome";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

type Status = "building" | "alpha" | "in-progress" | "beta" | "in-production";

interface BuildingItem {
  name: string;
  description: string;
  status: Status;
}

interface ListItem {
  name: string;
  description: string;
}

// Single source of truth for the page's "last touched" marker.
const LAST_UPDATED_ISO = "2026-04-17";
const NEXT_REFRESH_LABEL = "may 2026";

const buildingItems: BuildingItem[] = [
  {
    name: "MokLabs Venture Studio",
    description:
      "Co-founding a studio that ships ambitious products with careful engineering.",
    status: "building",
  },
  {
    name: "Lugui.ai",
    description:
      "Part of the founding team; AI infrastructure for educational intelligence — tutoring systems that actually understand what a student just missed.",
    status: "alpha",
  },
  {
    name: "Remindr.AI",
    description:
      "Privacy-first desktop transcription + daily memory. Built for people who think while they talk.",
    status: "in-progress",
  },
];

const learningItems: ListItem[] = [
  {
    name: "LangGraph",
    description:
      "Orchestrating multi-agent workflows with real state machines, not vibes.",
  },
  {
    name: "Rust fundamentals",
    description:
      "Slow & steady; reading the book and building small CLIs on the side.",
  },
  {
    name: "Venture operations",
    description:
      "How small studios stay focused across multiple products without losing their soul.",
  },
];

const readingItems: ListItem[] = [
  {
    name: "The Hard Thing About Hard Things",
    description:
      "Ben Horowitz. Re-read for the 3rd time — it gets sharper every pass.",
  },
  {
    name: "High Output Management",
    description: "Andy Grove. Classic, still sharp, still the operating manual.",
  },
  {
    name: "Working Backwards",
    description:
      "Colin Bryar. Amazon's operating system — how PR/FAQ actually works in practice.",
  },
  {
    name: "The Mom Test",
    description:
      "Rob Fitzpatrick. Short, brutal, essential when you're talking to early users.",
  },
];

const thinkingAbout = [
  "How small teams ship with disproportionate impact.",
  "Where AI genuinely removes toil vs. where it just performs productivity.",
  "The difference between craftsmanship and craftsmanship-theater.",
  "Why most \u201Cplatforms\u201D are just products that refuse to admit it.",
];

const notDoing: { name: string; status: string }[] = [
  { name: "Consulting side gigs", status: "archived" },
  { name: "New social platforms", status: "archived" },
  { name: "Conference speaking", status: "paused q3" },
];

const statusTone: Record<Status, string> = {
  building: "var(--color-kindra-yellow)",
  alpha: "var(--color-kindra-blue)",
  beta: "var(--color-kindra-blue)",
  "in-progress": "var(--color-kindra-green)",
  "in-production": "var(--color-kindra-green)",
};

// ──────────────────────────────────────────────────────────────────────
// Instrument cluster — the dashboard signature of /now. Preserved.
// ──────────────────────────────────────────────────────────────────────
function InstrumentCluster() {
  const reduceMotion = usePrefersReducedMotion();

  const buildingCount = buildingItems.filter((i) => i.status === "building").length;
  const alphaCount = buildingItems.filter((i) => i.status === "alpha").length;
  const inProgressCount = buildingItems.filter((i) => i.status === "in-progress").length;

  const lastUpdated = new Date(LAST_UPDATED_ISO + "T00:00:00Z");
  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const paddedDays = String(diffDays).padStart(2, "0");

  return (
    <aside
      role="status"
      aria-label="Current activity summary"
      className="mt-4"
      style={{
        fontFamily: "var(--font-body)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] md:flex-row md:items-baseline md:justify-between md:gap-8">
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
            <span className="text-[var(--color-kindra-meta-mid)]">
              {buildingCount}
            </span>{" "}
            building
            <span className="mx-2 text-[var(--color-kindra-rule)]">·</span>
            <span className="text-[var(--color-kindra-meta-mid)]">
              {alphaCount}
            </span>{" "}
            alpha
            <span className="mx-2 text-[var(--color-kindra-rule)]">·</span>
            <span className="text-[var(--color-kindra-meta-mid)]">
              {inProgressCount}
            </span>{" "}
            in-progress
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
          <span>
            <span className="text-[var(--color-kindra-rule-strong)]">//</span>{" "}
            next refresh ~{" "}
            <span className="text-[var(--color-kindra-meta-mid)]">
              {NEXT_REFRESH_LABEL}
            </span>
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
// in Mark color, italic subtitle, hairline rule, then item list.
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
      <div
        className="flex items-baseline gap-2 text-[10px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
        style={{
          fontFamily: "var(--font-body)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
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
  const reduceMotion = usePrefersReducedMotion();
  const router = useRouter();

  const handleBackClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      router.push("/");
    },
    [router],
  );

  const handleNavClick = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(href);
    },
    [router],
  );

  // ONE parallax instance at page level — native window scroll.
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -60]);

  return (
    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[960px] overflow-hidden cursor-grab active:cursor-grabbing">
      <PageChrome
        index="00"
        label="now"
        hudRole="online · living"
        stripText="◈ MK · currently · april 2026"
        showBack={true}
        onBackClick={handleBackClick}
      />

      <div className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory cursor-auto active:cursor-auto">
        <div className="mx-auto w-[90%] max-w-[1120px] pb-32">
          {/* ─────────────────────────────────────────────────────────
              Section 1 — MASSIVE HERO
             ───────────────────────────────────────────────────────── */}
          <section className="relative min-h-[100vh] flex items-center snap-start pt-16">
            <motion.div
              style={reduceMotion ? undefined : { y: parallaxY }}
              className="will-change-transform w-full"
            >
              {/* Eyebrow */}
              <p
                className="mb-8 flex flex-wrap items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[var(--color-kindra-rule-strong)]">[</span>{" "}
                  <span className="text-[var(--color-kindra-meta-low)]">/ 00</span>{" "}
                  <span className="text-[var(--color-kindra-rule)]">&mdash;</span>{" "}
                  a living page{" "}
                  <span className="text-[var(--color-kindra-rule-strong)]">]</span>
                </span>
                <span className="text-[var(--color-kindra-rule)]">&middot;</span>
                <span className="text-[var(--color-kindra-meta-low)]">
                  updated april 2026
                </span>
              </p>

              {/* Massive title */}
              <h1
                className="font-bold text-white"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(5rem, 13vw, 11rem)",
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
                className="mt-8 max-w-[640px] text-[#c8c8c8] font-light"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.55,
                }}
              >
                A snapshot of what&apos;s on my desk, in my head, and on my
                calendar. This page is short on purpose. Updated every few
                weeks.
              </p>

              {/* Instrument cluster */}
              <InstrumentCluster />
            </motion.div>
          </section>

          {/* ─────────────────────────────────────────────────────────
              Section 2 — THE SPREAD (4-column magazine grid)
             ───────────────────────────────────────────────────────── */}
          <section className="relative min-h-[100vh] flex flex-col justify-center snap-start py-20">
            <div className="grid items-start grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 xl:gap-10">
            {/* Column 1 — BUILDING (yellow) */}
            <Column
              index="01"
              title="Building"
              italic="— on my desk"
              color="var(--color-kindra-yellow)"
            >
              {buildingItems.map((item) => (
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
                      className="text-[17px] font-bold text-white tracking-[-0.01em] leading-[1.25]"
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
              {learningItems.map((item) => (
                <div key={item.name}>
                  <h3
                    className="text-[17px] font-bold text-white tracking-[-0.01em] leading-[1.25]"
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
              {readingItems.map((item) => (
                <div key={item.name}>
                  <h3
                    className="text-[16px] font-bold italic text-white tracking-[-0.01em] leading-[1.3]"
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
              {thinkingAbout.map((line) => (
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
          </section>

          {/* ─────────────────────────────────────────────────────────
              Section 3 — FEATURED QUOTE (the thesis)
             ───────────────────────────────────────────────────────── */}
          <section className="mx-auto max-w-[900px] min-h-[100vh] flex flex-col justify-center snap-start py-20">
            {/* Hairline above */}
            <div
              aria-hidden="true"
              className="mb-3 h-px w-16 bg-[var(--color-kindra-rule-strong)]"
            />
            {/* Label with signature square marker */}
            <p
              className="mb-6 flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
              style={{
                fontFamily: "var(--font-body)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
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
              className="text-balance font-bold text-white"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2rem, 4.5vw, 3.75rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Mechanisms over magic. Coherence over cleverness.
            </p>
          </section>

          {/* ─────────────────────────────────────────────────────────
              Section 4 & 5 — NOT DOING & FOOTER
             ───────────────────────────────────────────────────────── */}
          <section className="relative min-h-[100vh] flex flex-col snap-start pb-12 pt-20">
            {/* Flex-grow spacer to push Not Doing to the center */}
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <p
                className="mb-10 flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[var(--color-kindra-red)]"
                style={{
                  fontFamily: "var(--font-body)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
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
                {notDoing.map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                  >
                    <span
                      className="line-through decoration-[var(--color-kindra-red)] decoration-2 text-[18px] md:text-[22px] font-medium text-[#888]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span className="text-[var(--color-kindra-rule-strong)]">//</span>{" "}
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <footer className="border-t border-[var(--color-kindra-rule)] pt-8 mt-16 w-full">
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                style={{
                  fontFamily: "var(--font-body)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <FooterLiveDot />
                idx.00
                <span className="mx-2 text-[var(--color-kindra-rule)]">&middot;</span>
                living document
                <span className="mx-2 text-[var(--color-kindra-rule)]">&middot;</span>
                last update &middot; apr 2026
                <span className="mx-2 text-[var(--color-kindra-rule)]">&middot;</span>
                /now inspired by{" "}
                <a
                  href="https://nownownow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[var(--color-kindra-rule)] underline-offset-2 transition-colors duration-500 hover:text-white hover:decoration-[var(--color-kindra-yellow)]"
                >
                  nownownow.com
                </a>
              </p>
              
              <PageNav current="/now" onClick={handleNavClick} />
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
