const fs = require('fs');

const path = 'src/app/now/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add new imports
if (!content.includes('import dynamic from "next/dynamic"')) {
  content = content.replace('import Link from "next/link";', 
`import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PageNav from "@/components/ui/PageNav";
`);
}

if (!content.includes('ParticlePhoto')) {
  content = content.replace('const buildingItems',
`const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const buildingItems`);
}

// Replace the component function entirely
const componentRegex = /export default function NowPage\(\) \{[\s\S]*$/;

const newComponent = `export default function NowPage() {
  const reduceMotion = usePrefersReducedMotion();
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

  // ONE parallax instance at page level — native window scroll.
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -60]);

  return (
    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[960px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Particle background */}
      <div
        className={\`absolute inset-0 \${exploding ? "z-50" : "z-[1]"}\`}
      >
        <ParticlePhoto
          imageSrc="/images/kindra-home.png"
          animate
          explode={exploding}
          onExplodeComplete={handleExplodeComplete}
        />
      </div>

      {/* Left-side vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 85%)",
        }}
      />

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
          <section
            className="mt-20 grid items-start grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 xl:gap-10 snap-start pt-16"
          >
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
          </section>

          {/* ─────────────────────────────────────────────────────────
              Section 3 — FEATURED QUOTE (the thesis)
             ───────────────────────────────────────────────────────── */}
          <section className="mx-auto mt-24 max-w-[900px] snap-start pt-16">
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
              Section 4 — NOT DOING (footer strip, tight)
             ───────────────────────────────────────────────────────── */}
          <section
            className="mt-24 snap-start pt-16"
            style={{ opacity: 0.6, filter: "grayscale(0.3)" }}
          >
            <div
              className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[12px] text-[var(--color-kindra-meta-low)]"
              style={{
                fontFamily: "var(--font-body)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]">
                — 05 · NOT DOING —
              </span>
              {notDoing.map((item, i) => (
                <span
                  key={item.name}
                  className="inline-flex items-baseline gap-2"
                >
                  <span className="line-through decoration-[var(--color-kindra-rule)] decoration-[1.5px] text-[13px] text-[#888]">
                    {item.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]">
                    <span className="text-[var(--color-kindra-rule-strong)]">//</span>{" "}
                    {item.status}
                  </span>
                  {i < notDoing.length - 1 && (
                    <span className="ml-2 text-[var(--color-kindra-rule)]">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────
              Section 5 — SIGN-OFF FOOTER
             ───────────────────────────────────────────────────────── */}
          <div className="mt-24 snap-start pt-16">
            <footer className="border-t border-[var(--color-kindra-rule)] pt-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}
`;

content = content.replace(componentRegex, newComponent);
fs.writeFileSync(path, content);
