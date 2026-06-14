"use client";

import { useState, useEffect } from "react";
import { preload } from "react-dom";
import Link from "next/link";
import dynamic from "next/dynamic";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import {
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiTwitter,
  FiArrowUpRight,
} from "react-icons/fi";
import PageNav from "@/components/ui/PageNav";
import JarvisTrigger from "@/components/chat/JarvisTrigger";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import ContentScrim from "@/components/layout/ContentScrim";
import { useJarvis } from "@/components/chat/JarvisProvider";
import { profile, site } from "@/lib/content";
import { enterAt } from "@/lib/motion";
import styles from "./home.module.css";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

/** The portrait the particle field decodes — preloaded by Home() below and
    narrated by the boot sequence. One URL, one fetch. */
const HOME_PORTRAIT_SRC = "/images/kindra-home.png";

const socialLinks = [
  { href: profile.social.github, label: "GitHub", Icon: FiGithub },
  { href: profile.social.linkedin, label: "LinkedIn", Icon: FiLinkedin },
  { href: profile.social.instagram, label: "Instagram", Icon: FiInstagram },
  { href: profile.social.twitter, label: "X/Twitter", Icon: FiTwitter },
];

const keywords = ["ventures", "AI-products", "RAG", "platform", "builder", "DX"];

// Telemetry glyph set — hex digits + signal punctuation, so the decode
// reads as signal acquisition rather than generic terminal noise.
const GLYPHS = "0123456789ABCDEF·−+°./";

function useScramble(text: string, duration = 900, startDelay = 400) {
  // Initialize with the plain text so SSR and client first render match.
  // Scrambling only kicks in on the client, inside useEffect.
  const [output, setOutput] = useState(text);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Respect prefers-reduced-motion: keep the final text, skip the scramble.
    if (reduceMotion) {
      setOutput(text);
      return;
    }

    let raf = 0;
    let startedAt: number | null = null;
    // Seed the scramble on mount (client-only) so SSR html stays stable.
    setOutput(
      text
        .split("")
        .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join(""),
    );
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (startedAt === null) startedAt = now;
        const t = Math.min(1, (now - startedAt) / duration);
        const reveal = t * text.length;
        const out = text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < reveal) return char;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("");
        setOutput(out);
        if (t < 1) raf = requestAnimationFrame(step);
        else setOutput(text);
      };
      raf = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, duration, startDelay, reduceMotion]);

  return output;
}

/** sessionStorage flag — the boot plays once per browsing session. */
const BOOT_FLAG = "kindra-boot-done";
/** Hard cap: the boot narrates the real asset wait, it never extends it. */
const BOOT_MAX_MS = 1600;
/** Fade-out duration — matches the CSS transition on `.boot`. */
const BOOT_FADE_MS = 360;

interface BootLine {
  id: string;
  text: string;
}

/**
 * Boot / acquisition sequence — a DOM-only overlay (zero Pixi dependency)
 * that narrates the one real wait the page has: the portrait decode the
 * particle field needs anyway. Driven by actual events (the image load —
 * same URL as the layer's fetch, so the browser coalesces the requests),
 * hard-capped at BOOT_MAX_MS, dismissible by any click/keypress, and
 * skipped entirely on return visits and under prefers-reduced-motion.
 * The hero behind it is SSR-visible the whole time; this never gates content.
 */
function BootSequence() {
  const [lines, setLines] = useState<BootLine[]>([]);
  const [phase, setPhase] = useState<"idle" | "active" | "fading">("idle");

  useEffect(() => {
    // Instant-skip paths: reduced motion, and any repeat visit this session.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
      if (storage.getItem(BOOT_FLAG)) return;
    } catch {
      // Storage blocked (private mode) — treat as a return visit, skip.
      return;
    }

    let finished = false;
    let portraitSeen = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms));
    const push = (id: string, text: string) => {
      if (finished) return;
      setLines((prev) =>
        prev.some((l) => l.id === id) ? prev : [...prev, { id, text }],
      );
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        storage?.setItem(BOOT_FLAG, "1");
      } catch {
        /* non-fatal — worst case the boot replays next load */
      }
      setPhase("fading");
      at(BOOT_FADE_MS, () => setPhase("idle"));
    };

    setPhase("active");
    push("init", "init k-2542 · curitiba -25.42° -49.27°");
    at(180, () => push("sensor", "sensor array online"));

    // Real event: completion of the portrait fetch the particle layer (and
    // the layout preload) already started. Same URL — zero extra bytes.
    const onPortrait = () => {
      if (portraitSeen || finished) return;
      portraitSeen = true;
      // A cache hit can outrun the 180ms timer above — keep the narrative
      // order regardless (push dedupes by id, so this is a no-op otherwise).
      push("sensor", "sensor array online");
      push("field", "particle field decoded");
      at(240, () => push("target", "target acquired"));
      at(560, finish);
    };
    const img = new Image();
    img.onload = onPortrait;
    img.onerror = onPortrait; // a 404 must never hold the boot hostage
    img.src = HOME_PORTRAIT_SRC;
    if (img.complete) onPortrait();

    // Hard cap + manual dismissal.
    at(BOOT_MAX_MS, finish);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);

    return () => {
      for (const t of timers) window.clearTimeout(t);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      className={`${styles.boot} ${phase === "fading" ? styles.bootFading : ""}`}
    >
      {lines.map((line, i) => (
        <div key={line.id} className={styles.bootLine}>
          <span className={styles.bootIndex}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{line.text}</span>
          {i === lines.length - 1 && <span className={styles.bootCursor} />}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  /* Start fetching the home portrait from the initial HTML — the particle
     field is the page's whole visual and otherwise only begins loading after
     the pixi bundle hydrates. Emitted (during SSR too) as
     <link rel="preload" as="image">. Scoped HERE, not in the root layout:
     the layout wraps all six routes, and preloading 600KB of home portrait
     on a direct /projetos or /sobre visit starved that page's own image. */
  preload(HOME_PORTRAIT_SRC, { as: "image" });

  return (
    <PageShell
      hudRole="online · building"
      stripText="◈ MK · co-founder / builder · 2017 — now"
      background={({ exploding, onExplodeComplete }) => (
        <>
          <div
            className={`${styles.photoStage} ${exploding ? styles.photoStageExploding : ""}`}
          >
            <ParticlePhoto
              imageSrc={HOME_PORTRAIT_SRC}
              animate
              explode={exploding}
              onExplodeComplete={onExplodeComplete}
            />
          </div>
          {/* Black-hole-free home: ParticlePhoto portrait sits right-of-center;
              darken the left so the left-anchored text column stays legible. */}
          <ContentScrim side="left" intensity="strong" />
        </>
      )}
    >
      <BootSequence />
      <HomeContent />
    </PageShell>
  );
}

function HomeContent() {
  const { onNavClick } = useShellNav();
  const { setOpen: setJarvisOpen } = useJarvis();
  const cofounderScramble = useScramble("Co-founder", 900, 350);

  return (
    <>
      <ScrollStage>
        <Section measure="wide" align="left">
          <main>
            {/* Greeting */}
            <p
              className={`${styles.greeting} enter-rise`}
              style={enterAt(0)}
            >
              <span className={styles.greetingRule} />
              <span>
                hey · i&apos;m{" "}
                <span className={styles.greetingName}>{profile.nickname}</span>
              </span>
            </p>

            {/* Title — brutalist typographic composition. The real text lives
                in aria-label; the scrambling span is decorative for AT. */}
            <h1
              className={`${styles.title} enter-rise`}
              style={enterAt(1)}
              aria-label={`Co-founder & Builder — at ${profile.company}`}
            >
              {/* Line 1 — Co-founder & Builder */}
              <span className={styles.titleLine}>
                <span aria-hidden className={styles.titleWord}>
                  {cofounderScramble}
                </span>
                {/* The ornamental ampersand */}
                <span aria-hidden className={`shimmer-yellow ${styles.ampersand}`}>
                  &amp;
                </span>
                <span className={styles.titleWordWhite}>Builder</span>
              </span>

              {/* Line 2 — cantilevered, off-axis subtitle */}
              <span className={`subtitle-offaxis ${styles.subtitle}`}>
                <span className={styles.subtitleDash}>&mdash;</span>
                {/* Square marker */}
                <span aria-hidden className={styles.subtitleMarker} />
                <span className={styles.subtitleAt}>at</span>{" "}
                <span className={styles.subtitleCompany}>{profile.company}</span>
              </span>
            </h1>

            {/* Headline */}
            <p
              className={`${styles.headline} enter-rise`}
              style={enterAt(2)}
            >
              {profile.headline}
            </p>

            {/* Description */}
            <p
              className={`${styles.description} enter-rise`}
              style={enterAt(3)}
            >
              {profile.description}
            </p>

            {/* Ask Jarvis — inline CTA */}
            <p
              className={`${styles.jarvisRow} enter-rise`}
              style={enterAt(4)}
            >
              <button
                type="button"
                data-cursor="link"
                onClick={() => setJarvisOpen(true)}
                className={styles.jarvisButton}
              >
                <span>don&apos;t believe me?</span>
                <span className={styles.jarvisLink}>
                  <span className={styles.jarvisUnderlineWrap}>
                    &mdash; ask jarvis
                    <span aria-hidden className={styles.jarvisUnderline} />
                  </span>
                  <span aria-hidden className={styles.jarvisArrow}>
                    &rarr;
                  </span>
                </span>
              </button>
            </p>

            {/* Keywords */}
            <ul
              className={`${styles.keywords} enter-rise`}
              style={enterAt(5)}
            >
              {keywords.map((kw) => (
                <li key={kw} className={styles.keyword}>
                  <span className={styles.keywordSlash}>/</span>
                  {kw}
                </li>
              ))}
            </ul>

            {/* Nav */}
            <div
              className={`${styles.navWrap} enter-rise`}
              style={enterAt(6)}
            >
              <PageNav current="/" onClick={onNavClick} />
            </div>
          </main>
        </Section>
      </ScrollStage>

      {/* Footer */}
      <footer className={`${styles.footer} ${styles.footerEnter}`}>
        <div className={styles.footerGrid}>
          {/* Left lane — social icons */}
          <div className={styles.socials}>
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                data-cursor="link"
                className={styles.social}
              >
                <Icon className={styles.socialIcon} />
                <span className={styles.socialLabel}>{label}</span>
                <FiArrowUpRight className={styles.socialArrow} />
              </a>
            ))}
          </div>

          {/* Right lane — /now link + meta */}
          <div className={styles.nowLane}>
            <Link
              href="/now"
              data-cursor="link"
              onClick={onNavClick("/now")}
              className={styles.nowLink}
            >
              <span aria-hidden>&rarr;</span>
              <span className={styles.nowUnderlineWrap}>
                currently / now
                <span aria-hidden className={styles.nowUnderline} />
              </span>
            </Link>
            {/* Stamp + jarvis status share one row (gap, never overlap) —
                the global floating badge yields on "/" in favor of this. */}
            <div className={styles.metaLine}>
              <div className={styles.lastUpdate}>
                last update &middot; {site.lastUpdated}
              </div>
              <JarvisTrigger variant="inline" className={styles.jarvisStatus} />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
