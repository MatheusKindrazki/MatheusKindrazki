"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import PageNav from "@/components/ui/PageNav";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import ContentScrim from "@/components/layout/ContentScrim";
import { useJarvis } from "@/components/chat/JarvisProvider";
import { profile, site } from "@/lib/content";
import { stagger, fadeUp, fadeIn } from "@/lib/motion";
import styles from "./home.module.css";

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

// Reduced-motion variant — fade only, no Y translation, shorter duration.
const fadeUpReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

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
              imageSrc="/images/kindra-home.png"
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
      <HomeContent />
    </PageShell>
  );
}

function HomeContent() {
  const { onNavClick } = useShellNav();
  const { setOpen: setJarvisOpen } = useJarvis();
  const cofounderScramble = useScramble("Co-founder", 900, 350);
  const reduceMotion = useReducedMotion();
  const fadeUpVariant = reduceMotion ? fadeUpReduced : fadeUp;

  return (
    <>
      <ScrollStage>
        <Section measure="wide" align="left">
          <motion.main variants={stagger} initial="hidden" animate="show">
            {/* Greeting */}
            <motion.p variants={fadeUpVariant} className={styles.greeting}>
              <span className={styles.greetingRule} />
              <span>
                hey · i&apos;m{" "}
                <span className={styles.greetingName}>{profile.nickname}</span>
              </span>
            </motion.p>

            {/* Title — brutalist typographic composition */}
            <motion.h1 variants={fadeUpVariant} className={styles.title}>
              {/* Line 1 — Co-founder & Builder */}
              <span className={styles.titleLine}>
                <span className={styles.titleWord}>{cofounderScramble}</span>
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
            </motion.h1>

            {/* Headline */}
            <motion.p variants={fadeUpVariant} className={styles.headline}>
              {profile.headline}
            </motion.p>

            {/* Description */}
            <motion.p variants={fadeUpVariant} className={styles.description}>
              {profile.description}
            </motion.p>

            {/* Ask Jarvis — inline CTA */}
            <motion.p variants={fadeUpVariant} className={styles.jarvisRow}>
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
            </motion.p>

            {/* Keywords */}
            <motion.ul variants={fadeUpVariant} className={styles.keywords}>
              {keywords.map((kw) => (
                <li key={kw} className={styles.keyword}>
                  <span className={styles.keywordSlash}>/</span>
                  {kw}
                </li>
              ))}
            </motion.ul>

            {/* Nav */}
            <motion.div variants={fadeUpVariant} className={styles.navWrap}>
              <PageNav current="/" onClick={onNavClick} />
            </motion.div>
          </motion.main>
        </Section>
      </ScrollStage>

      {/* Footer */}
      <motion.footer
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className={styles.footer}
      >
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
            <div className={styles.lastUpdate}>
              last update &middot; {site.lastUpdated}
            </div>
          </div>
        </div>
      </motion.footer>
    </>
  );
}
