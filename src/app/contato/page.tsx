"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import ContactForm from "@/components/ui/ContactForm";
import PageChrome from "@/components/layout/PageChrome";
import { profile } from "@/lib/content";
import { FaGithub, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiCopy, FiCheck, FiCalendar, FiArrowUpRight } from "react-icons/fi";
import { getColorValue } from "@/lib/colors";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

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

const socialLinks = [
  {
    href: profile.social.github,
    icon: FaGithub,
    label: "GitHub",
    fragment: "/MatheusKindrazki",
  },
  {
    href: profile.social.linkedin,
    icon: FaLinkedinIn,
    label: "LinkedIn",
    fragment: "/in/matheuskindrazki",
  },
  {
    href: profile.social.instagram,
    icon: FaInstagram,
    label: "Instagram",
    fragment: "@kindrazki",
  },
  {
    href: profile.social.twitter,
    icon: FaXTwitter,
    label: "X/Twitter",
    fragment: "@kindraScript",
  },
];

export default function ContatoPage() {
  const red = getColorValue("red");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [exploding, setExploding] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop — clipboard might not be available
    }
  }, []);

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

  return (
    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[960px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Particle background */}
      <div className={`absolute inset-0 ${exploding ? "z-50" : "z-[1]"}`}>
        <ParticlePhoto
          imageSrc="/images/kindra-photo.png"
          animate
          explode={exploding}
          onExplodeComplete={handleExplodeComplete}
        />
      </div>

      {/* Left-side vignette — darkens the text column so the photo reads as an accent on the right */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 85%)",
        }}
      />

      {/* Shared chrome — grain, wordmark, HUD, strip */}
      <PageChrome
        index="05"
        label="contact"
        hudRole="online · listening"
        onBackClick={handleBackClick}
      />

      {/* Scrollable snap container */}
      <div className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory">
        {/* Section 1 - Hero + email CTA + socials */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-10">
            <motion.div variants={stagger} initial="hidden" animate="show">
              {/* Eyebrow */}
              <motion.p
                variants={fadeUp}
                className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[#555]">[</span>{" "}
                  <span className="text-[var(--color-kindra-meta-low)]">/ 05</span>{" "}
                  <span className="text-[#333]">—</span> let&apos;s talk{" "}
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
                  <Mark color="red">Contact</Mark>
                  <span className="italic text-[var(--color-kindra-meta-low)] text-[28px] font-normal">
                    — coffee, ventures, ideas
                  </span>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mb-10 max-w-[520px] text-[15px] leading-[24px] text-[#c8c8c8] font-light"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Want to talk about architecture, AI, or new ventures? Drop me a
                line.
              </motion.p>

              {/* Primary email CTA */}
              <motion.div variants={fadeUp} className="mb-10">
                <p
                  className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="mr-1 text-[#333]">/</span> primary
                </p>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  data-cursor="link"
                  title="Click to copy"
                  className="group/email inline-flex items-center gap-3 text-left cursor-pointer"
                >
                  <a
                    href={`mailto:${profile.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[34px] leading-[44px] font-bold text-white transition-colors duration-700 group-hover/email:text-white"
                    style={{
                      fontFamily: "var(--font-heading)",
                      transitionTimingFunction:
                        "cubic-bezier(0.19, 1, 0.22, 1)",
                    }}
                  >
                    {profile.email}
                  </a>
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#333] text-[#888] opacity-0 transition-all duration-500 group-hover/email:opacity-100 group-hover/email:border-[#666] group-hover/email:text-white"
                    title={copied ? "Copied" : "Copy email"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.2 }}
                          style={{ color: getColorValue("green") }}
                        >
                          <FiCheck size={13} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiCopy size={12} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
                <AnimatePresence>
                  {copied && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 text-[10px] uppercase tracking-[0.3em]"
                      style={{
                        color: getColorValue("green"),
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      copied to clipboard
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Calendar CTA */}
              <motion.div variants={fadeUp} className="mb-10">
                <p
                  className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="mr-1 text-[#333]">/</span> or schedule
                </p>
                <a
                  href="https://cal.com/matheuskindrazki"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="group/cal inline-flex items-center gap-3 text-[15px] tracking-[0.05em] text-[#c8c8c8] transition-colors duration-700 hover:text-white"
                  style={{
                    fontFamily: "var(--font-body)",
                    transitionTimingFunction:
                      "cubic-bezier(0.19, 1, 0.22, 1)",
                  }}
                >
                  <FiCalendar
                    className="text-[17px] text-[#888] transition-colors duration-700 group-hover/cal:text-[#d9594c]"
                  />
                  <span className="relative">
                    book a 30min chat
                    <span
                      aria-hidden
                      className="absolute left-0 -bottom-0.5 h-[1.5px] w-full origin-left scale-x-0 transition-transform duration-700 group-hover/cal:scale-x-100"
                      style={{
                        backgroundColor: red,
                        transitionTimingFunction:
                          "cubic-bezier(0.19, 1, 0.22, 1)",
                      }}
                    />
                  </span>
                  <FiArrowUpRight
                    className="text-[13px] -translate-x-1 opacity-0 transition-all duration-700 group-hover/cal:translate-x-0 group-hover/cal:opacity-100"
                    style={{ color: red }}
                  />
                </a>
              </motion.div>

              {/* Social rails */}
              <motion.div variants={fadeUp} className="mb-2">
                <p
                  className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="mr-1 text-[#333]">/</span> social
                </p>
                <ul className="flex flex-col">
                  {socialLinks.map(({ href, icon: Icon, label, fragment }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/row relative flex items-center gap-4 border-b border-[#1a1a1a] py-3 pl-4 transition-colors duration-700"
                        style={{
                          transitionTimingFunction:
                            "cubic-bezier(0.19, 1, 0.22, 1)",
                        }}
                      >
                        {/* Left accent bar */}
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 block h-[0%] w-[2px] -translate-y-1/2 transition-all duration-700 group-hover/row:h-[70%]"
                          style={{
                            backgroundColor: red,
                            transitionTimingFunction:
                              "cubic-bezier(0.19, 1, 0.22, 1)",
                          }}
                        />
                        <Icon
                          className="text-[15px] text-[#888] transition-colors duration-700 group-hover/row:text-white"
                        />
                        <span
                          className="w-[80px] text-[11px] uppercase tracking-[0.25em] text-[#888] transition-colors duration-700 group-hover/row:text-white"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {label}
                        </span>
                        <span
                          className="flex-1 text-[11px] tracking-[0.15em] text-[var(--color-kindra-meta-low)] transition-colors duration-700 group-hover/row:text-[#aaa]"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {fragment}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <PageNav current="/contato" onClick={handleNavClick} />
            </motion.div>
          </div>
        </section>

        {/* Section 2 - Form */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-12">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                <span>
                  <span className="text-[#555]">[</span> / or drop a message{" "}
                  <span className="text-[#555]">]</span>
                </span>
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="mb-8 text-[30px] leading-[40px] font-bold text-white tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Write to{" "}
                <span className="italic text-[#8a8a8a] font-normal">me</span>
              </motion.h2>

              <motion.div variants={fadeUp}>
                <ContactForm />
              </motion.div>

              {/* Footer meta row */}
              <motion.div
                variants={fadeUp}
                className="mt-14 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <span className="h-px w-10 bg-[#222]" />
                <span>
                  based in curitiba
                  <span className="mx-2 text-[#2a2a2a]">·</span>
                  BRT
                  <span className="mx-2 text-[#2a2a2a]">·</span>
                  usually reply within 24h
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
