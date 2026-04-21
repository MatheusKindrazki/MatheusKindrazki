"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import {
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiTwitter,
  FiArrowUpRight,
} from "react-icons/fi";
import Mark from "@/components/ui/Mark";
import AnimatedLink from "@/components/ui/AnimatedLink";
import PageChrome from "@/components/layout/PageChrome";
import { useJarvis } from "@/components/chat/JarvisProvider";
import { profile, navLinks } from "@/lib/content";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const socialLinks = [
  { href: profile.social.github, label: "GitHub", Icon: FiGithub },
  { href: profile.social.linkedin, label: "LinkedIn", Icon: FiLinkedin },
  { href: profile.social.instagram, label: "Instagram", Icon: FiInstagram },
  { href: profile.social.twitter, label: "X/Twitter", Icon: FiTwitter },
];

const keywords = ["ventures", "AI-products", "RAG", "platform", "builder", "DX"];

const navMeta: Record<string, string> = {
  "/projetos": "what i've built",
  "/skills": "what i do",
  "/sobre": "who i am",
  "/contato": "let's talk",
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1.4, delay: 0.7 } },
};

// Reduced-motion variants — fade only, no Y translation, shorter duration.
const fadeUpReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};
const slideUpReduced = fadeUpReduced;

const GLYPHS = "!<>-_\\/[]{}—=+*^?#░▒▓█";

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

export default function Home() {
  const router = useRouter();
  const { setOpen: setJarvisOpen } = useJarvis();
  const [exploding, setExploding] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const cofounderScramble = useScramble("Co-founder", 900, 350);
  const reduceMotion = useReducedMotion();
  const fadeUpVariant = reduceMotion ? fadeUpReduced : fadeUp;
  const slideUpVariant = reduceMotion ? slideUpReduced : slideUp;

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
    <>
      {/* Particle canvas — full viewport */}
      <div
        className={`fixed inset-0 pointer-events-none ${exploding ? "z-50" : "z-[1]"}`}
      >
        <ParticlePhoto
          imageSrc="/images/kindra-home.png"
          animate
          explode={exploding}
          onExplodeComplete={handleExplodeComplete}
        />
      </div>

      {/* Left-side vignette — darkens the text column so the photo reads as an accent on the right */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 85%)",
        }}
      />

      <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[960px] overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Shared chrome — grain, wordmark, HUD, strip */}
        <PageChrome
          index="01"
          label="co-founder & builder"
          showBack={false}
          stripText="◈ MK · co-founder / builder · 2017 — now"
        />

        {/* Main content */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="w-[90%] max-w-[1000px] mx-auto">
            <motion.main variants={stagger} initial="hidden" animate="show">
              {/* Greeting */}
              <motion.p
                variants={fadeUpVariant}
                className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  hey · i&apos;m{" "}
                  <span className="text-white font-bold">
                    {profile.nickname}
                  </span>
                </span>
              </motion.p>

              {/* Title — brutalist typographic composition */}
              <motion.h1
                variants={fadeUpVariant}
                className="relative mb-8 -ml-[1vw] font-bold text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {/* Line 1 — Co-founder & Builder */}
                <span
                  className="block leading-[0.95] tracking-[-0.03em] sm:whitespace-nowrap"
                  style={{ fontSize: "clamp(2.5rem, 6.2vw, 5.5rem)" }}
                >
                  <span
                    className="inline-block align-baseline"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {cofounderScramble}
                  </span>
                  {/* The ornamental ampersand */}
                  <span
                    aria-hidden
                    className="shimmer-yellow relative inline-block align-baseline italic font-bold"
                    style={{
                      color: "#e0a458",
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.3em",
                      transform: "rotate(-5deg) translateY(0.08em)",
                      marginLeft: "0.08em",
                      marginRight: "0.04em",
                      lineHeight: 1,
                    }}
                  >
                    &amp;
                  </span>
                  <span className="inline-block align-baseline text-white">
                    Builder
                  </span>
                </span>

                {/* Line 2 — cantilevered, off-axis subtitle */}
                <span
                  className="subtitle-offaxis relative mt-3 block origin-left italic font-normal text-[#888]"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(1.1rem, 2.1vw, 1.85rem)",
                    lineHeight: 1.15,
                  }}
                >
                  <span className="not-italic text-[#555] mr-2">&mdash;</span>
                  {/* Square marker */}
                  <span
                    aria-hidden
                    className="not-italic inline-block align-middle mr-3"
                    style={{
                      width: "0.55em",
                      height: "0.55em",
                      backgroundColor: "#e0a458",
                      transform: "translateY(-0.05em)",
                    }}
                  />
                  <span className="italic">at</span>{" "}
                  <span className="not-italic text-[#aaa]">
                    {profile.company}
                  </span>
                </span>
              </motion.h1>

              {/* Headline */}
              <motion.p
                variants={fadeUpVariant}
                className="mb-5 max-w-[560px] text-[19px] leading-[30px] text-[var(--color-kindra-meta-high)] font-light"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {profile.headline}
              </motion.p>

              {/* Description */}
              <motion.p
                variants={fadeUpVariant}
                className="mb-5 max-w-[520px] text-[13px] leading-[22px] text-[var(--color-kindra-meta-mid)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {profile.description}
              </motion.p>

              {/* Ask Jarvis — inline CTA */}
              <motion.p
                variants={fadeUpVariant}
                className="mb-7"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <button
                  type="button"
                  data-cursor="link"
                  onClick={() => setJarvisOpen(true)}
                  className="group/jarvis inline-flex items-center gap-2 py-2 -my-2 text-[12px] uppercase tracking-[0.18em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 hover:text-[#e0a458]"
                >
                  <span>don&apos;t believe me?</span>
                  <span className="relative inline-flex items-center gap-1">
                    <span className="relative">
                      &mdash; ask jarvis
                      <span
                        aria-hidden
                        className="absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-[#e0a458] transition-transform duration-500 group-hover/jarvis:scale-x-100"
                      />
                    </span>
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-500 group-hover/jarvis:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </span>
                </button>
              </motion.p>

              {/* Keywords */}
              <motion.ul
                variants={fadeUpVariant}
                className="mb-10 flex max-w-[600px] flex-wrap gap-x-5 gap-y-2"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {keywords.map((kw) => (
                  <li
                    key={kw}
                    className="cursor-default text-[10px] tracking-[0.18em] uppercase text-[var(--color-kindra-meta-low)] transition-colors duration-500 hover:text-[#e0a458]"
                  >
                    <span className="mr-1 text-[#333]">/</span>
                    {kw}
                  </li>
                ))}
              </motion.ul>

              {/* Nav */}
              <motion.nav
                variants={fadeUpVariant}
                className="flex flex-wrap gap-x-8 gap-y-5 pl-8 md:gap-x-14 md:pl-10"
              >
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    variants={slideUpVariant}
                    className="group/nav relative"
                  >
                    <span
                      className="absolute -left-8 top-[5px] text-[10px] tracking-[0.2em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 group-hover/nav:text-white md:-left-10"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      0{i + 1}
                    </span>
                    <AnimatedLink
                      href={link.href}
                      color={link.color}
                      onClick={handleNavClick(link.href)}
                    >
                      {link.label}
                    </AnimatedLink>
                    <span
                      className="mt-1 block text-[9.5px] uppercase tracking-[0.2em] text-[var(--color-kindra-meta-low)] opacity-0 -translate-y-1 transition-all duration-500 group-hover/nav:opacity-100 group-hover/nav:translate-y-0"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      ↳ {navMeta[link.href]}
                    </span>
                  </motion.div>
                ))}
              </motion.nav>
            </motion.main>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          variants={fadeIn}
          initial="hidden"
          animate="show"
          className="absolute bottom-[42px] left-0 right-0 z-10 px-6"
        >
          {/* Desktop: 3-lane grid. Mobile: stacked vertical. */}
          <div className="flex flex-col items-center gap-3 md:grid md:grid-cols-3 md:items-center md:gap-4">
            {/* Left lane — social icons */}
            <div className="flex items-center justify-center gap-7 md:justify-start">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  data-cursor="link"
                  className="group/ico relative inline-flex items-center gap-1.5 p-2 -m-2 text-[10.5px] uppercase tracking-[0.2em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 hover:text-white"
                >
                  <Icon className="text-[13px] transition-transform duration-500 group-hover/ico:-translate-y-[1px]" />
                  <span className="hidden sm:inline">{label}</span>
                  <FiArrowUpRight className="text-[10px] -translate-x-1 opacity-0 transition-all duration-500 group-hover/ico:translate-x-0 group-hover/ico:opacity-100" />
                </a>
              ))}
            </div>

            {/* Center lane — reserved (signature removed per request) */}
            <div className="hidden md:block" aria-hidden />

            {/* Right lane — /now link + meta */}
            <div className="flex flex-col items-center md:items-end">
              <Link
                href="/now"
                data-cursor="link"
                onClick={handleNavClick("/now")}
                className="group/now inline-flex items-center gap-1 py-2 -my-2 text-[10px] uppercase tracking-[0.3em] text-white transition-colors duration-500"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span aria-hidden>&rarr;</span>
                <span className="relative">
                  currently / now
                  <span
                    aria-hidden
                    className="absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-[#e0a458] transition-transform duration-500 group-hover/now:scale-x-100"
                  />
                </span>
              </Link>
              <div
                className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                last update &middot; apr 2026
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
