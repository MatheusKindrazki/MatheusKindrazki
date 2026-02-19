"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Mark from "@/components/ui/Mark";
import AnimatedLink from "@/components/ui/AnimatedLink";
import Identity from "@/components/ui/Identity";
import { profile, navLinks } from "@/lib/content";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const socialLinks = [
  { href: profile.social.github, label: "GitHub" },
  { href: profile.social.linkedin, label: "LinkedIn" },
  { href: profile.social.instagram, label: "Instagram" },
  { href: profile.social.twitter, label: "X/Twitter" },
];

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
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
  hidden: { opacity: 0, y: 70, rotate: 5 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
  },
};

export default function Home() {
  const router = useRouter();
  const [exploding, setExploding] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

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
      {/* Particle canvas - ALWAYS full viewport, never clipped by container */}
      <div className={`fixed inset-0 pointer-events-none ${exploding ? "z-50" : "z-[1]"}`}>
        <ParticlePhoto
          imageSrc="/images/kindra-home.png"
          animate
          explode={exploding}
          onExplodeComplete={handleExplodeComplete}
        />
      </div>

    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[800px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Identity - centered horizontally in viewport (like legacy) */}
      <div className="absolute top-[49px] left-6 -translate-x-1/2 z-10">
        <Identity status="rest" />
      </div>

      {/* Main content - centered container, vertically centered */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-[90%] max-w-[1000px] mx-auto">
          <motion.main variants={stagger} initial="hidden" animate="show">
            {/* Greeting */}
            <motion.p
              variants={fadeUp}
              className="mb-5 text-sm tracking-widest uppercase text-[#888]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Ola, eu sou o{" "}
              <span className="text-white font-bold">{profile.nickname}</span>
            </motion.p>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              className="mb-8 text-[48px] leading-[58px] font-bold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Mark color="yellow">Principal Engineer</Mark>
              <br />
              <span className="text-[#999]">na {profile.company}</span>
            </motion.h1>

            {/* Headline */}
            <motion.p
              variants={fadeUp}
              className="mb-6 text-[18px] leading-[28px] text-[#bbb] max-w-[520px]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {profile.headline}
            </motion.p>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="mb-10 text-sm leading-[22px] text-[#666] max-w-[480px]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {profile.description}
            </motion.p>

            {/* Nav links */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-9">
              {navLinks.map((link) => (
                <motion.div key={link.href} variants={slideUp}>
                  <AnimatedLink
                    href={link.href}
                    color={link.color}
                    onClick={handleNavClick(link.href)}
                  >
                    {link.label}
                  </AnimatedLink>
                </motion.div>
              ))}
            </motion.div>
          </motion.main>
        </div>
      </div>

      {/* Footer - centered horizontally in viewport (like legacy) */}
      <footer className="absolute bottom-[49px] left-0 right-0 z-10">
        <div className="flex items-center justify-center gap-5">
          {socialLinks.map(({ href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className="text-[11px] text-[#aaa] hover:text-white transition-colors duration-500"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
    </>
  );
}
