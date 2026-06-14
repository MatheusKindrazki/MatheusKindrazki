"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import Eyebrow from "@/components/ui/Eyebrow";
import MetaRow from "@/components/ui/MetaRow";
import ContactForm from "@/components/ui/ContactForm";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import ContentScrim from "@/components/layout/ContentScrim";
import { profile } from "@/lib/content";
import { FaGithub, FaLinkedinIn, FaInstagram, FaMedium } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiCopy, FiCheck, FiCalendar, FiArrowUpRight } from "react-icons/fi";
import { getColorValue } from "@/lib/colors";
import { stagger, fadeUp, enterAt } from "@/lib/motion";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

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
    href: profile.social.medium,
    icon: FaMedium,
    label: "Medium",
    fragment: "@matheuskindrazki",
  },
  {
    href: profile.social.instagram,
    icon: FaInstagram,
    label: "Instagram",
    fragment: "@matheuskindrazki",
  },
  {
    href: profile.social.twitter,
    icon: FaXTwitter,
    label: "X/Twitter",
    fragment: "@kindraScript",
  },
];

export default function ContatoPage() {
  return (
    <PageShell
      hudRole="online · listening"
      background={({ exploding, onExplodeComplete }) => (
        <>
          {/* Particle photo — promotes to the explode layer while dissolving */}
          <div
            className="absolute inset-0"
            style={{ zIndex: exploding ? "var(--z-explode)" : "var(--z-backdrop)" }}
          >
            <ParticlePhoto
              imageSrc="/images/kindra-contato.png"
              maxWidth={460}
              xOffset={360}
              particleSize={1.4}
              edgeFade={0.16}
              animate
              explode={exploding}
              onExplodeComplete={onExplodeComplete}
            />
          </div>

          {/* Shared reading scrim — darkens the left text column so the photo reads as an accent on the right */}
          <ContentScrim side="left" intensity="strong" />
        </>
      )}
    >
      <ContatoContent />
    </PageShell>
  );
}

function ContatoContent() {
  const { onNavClick } = useShellNav();
  const red = getColorValue("red");
  const green = getColorValue("green");
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop — clipboard might not be available
    }
  }, []);

  return (
    <ScrollStage>
      {/* Section 1 - Hero + email CTA + socials. Enters via the CSS
          `.enter-rise` idiom (globals.css), not framer `initial="hidden"` —
          the SSR HTML must paint the h1 before the pixi-heavy bundle
          hydrates (deep-link LCP). */}
      <Section align="left" innerClassName="py-10">
        <div>
          <div className="enter-rise" style={enterAt(0)}>
            <Eyebrow index="05" label="let's talk" />
          </div>

          <h1
            className="enter-rise mb-4 mt-5 font-bold text-[var(--color-kindra-text-white)] tracking-[-0.02em]"
            style={{ ...enterAt(1), fontFamily: "var(--font-heading)" }}
          >
            <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[length:var(--text-h1)] leading-[1.05]">
              <Mark color="red">Contact</Mark>
              <span className="italic text-[var(--color-kindra-meta-low)] text-[length:var(--text-h2)] font-normal">
                — coffee, ventures, ideas
              </span>
            </span>
          </h1>

          <p
            className="enter-rise mb-10 max-w-[var(--measure-narrow)] text-[length:var(--text-body)] leading-[24px] text-[var(--color-kindra-meta-high)] font-normal"
            style={{ ...enterAt(2), fontFamily: "var(--font-body)" }}
          >
            Want to talk about architecture, AI, or new ventures? Drop me a
            line.
          </p>

          {/* Primary email CTA */}
          <div className="enter-rise mb-10" style={enterAt(3)}>
            <p className="mb-2 font-data text-data tabular-nums uppercase tracking-[0.1em] text-[var(--color-kindra-meta-low)]">
              <span className="mr-1 text-[var(--color-kindra-rule)]">/</span>{" "}
              primary
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
                className="text-[length:var(--text-h2)] leading-[1.3] font-bold text-[var(--color-kindra-cream)] transition-colors duration-700 group-hover/email:text-[var(--color-kindra-text-white)]"
                style={{
                  fontFamily: "var(--font-heading)",
                  transitionTimingFunction: "var(--ease-smooth)",
                }}
              >
                {profile.email}
              </a>
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-kindra-rule)] text-[var(--color-kindra-meta-mid)] opacity-0 transition-all duration-500 group-hover/email:opacity-100 group-hover/email:border-[var(--color-kindra-rule-strong)] group-hover/email:text-[var(--color-kindra-text-white)]"
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
                      style={{ color: green }}
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
                  className="mt-2 font-data text-data uppercase tracking-[0.1em]"
                  style={{ color: green }}
                >
                  copied to clipboard
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Calendar CTA */}
          <div className="enter-rise mb-10" style={enterAt(4)}>
            <p className="mb-2 font-data text-data tabular-nums uppercase tracking-[0.1em] text-[var(--color-kindra-meta-low)]">
              <span className="mr-1 text-[var(--color-kindra-rule)]">/</span> or
              schedule
            </p>
            <a
              href={profile.calLink}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="group/cal inline-flex items-center gap-3 text-[length:var(--text-body)] tracking-[0.05em] text-[var(--color-kindra-meta-high)] transition-colors duration-700 hover:text-[var(--color-kindra-text-white)]"
              style={{
                fontFamily: "var(--font-body)",
                transitionTimingFunction: "var(--ease-smooth)",
              }}
            >
              <FiCalendar className="text-[17px] text-[var(--color-kindra-meta-mid)] transition-colors duration-700 group-hover/cal:text-[var(--color-kindra-red)]" />
              <span className="relative">
                book a 30min chat
                <span
                  aria-hidden
                  className="absolute left-0 -bottom-0.5 h-[1.5px] w-full origin-left scale-x-0 transition-transform duration-700 group-hover/cal:scale-x-100"
                  style={{
                    backgroundColor: red,
                    transitionTimingFunction: "var(--ease-smooth)",
                  }}
                />
              </span>
              <FiArrowUpRight
                className="text-[13px] -translate-x-1 opacity-0 transition-all duration-700 group-hover/cal:translate-x-0 group-hover/cal:opacity-100"
                style={{ color: red }}
              />
            </a>
          </div>

          {/* Social rails */}
          <div className="enter-rise mb-2" style={enterAt(5)}>
            <p className="mb-3 font-data text-data tabular-nums uppercase tracking-[0.1em] text-[var(--color-kindra-meta-low)]">
              <span className="mr-1 text-[var(--color-kindra-rule)]">/</span>{" "}
              social
            </p>
            <ul className="flex flex-col">
              {socialLinks.map(({ href, icon: Icon, label, fragment }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/row relative flex items-center gap-4 border-b border-[var(--color-kindra-rule)] py-3 pl-4 transition-colors duration-700"
                    style={{
                      transitionTimingFunction: "var(--ease-smooth)",
                    }}
                  >
                    {/* Left accent bar */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 block h-[0%] w-[2px] -translate-y-1/2 transition-all duration-700 group-hover/row:h-[70%]"
                      style={{
                        backgroundColor: red,
                        transitionTimingFunction: "var(--ease-smooth)",
                      }}
                    />
                    <Icon className="text-[15px] text-[var(--color-kindra-meta-mid)] transition-colors duration-700 group-hover/row:text-[var(--color-kindra-text-white)]" />
                    <span className="w-[80px] font-data text-data uppercase tracking-[0.1em] text-[var(--color-kindra-meta-mid)] transition-colors duration-700 group-hover/row:text-[var(--color-kindra-text-white)]">
                      {label}
                    </span>
                    <span className="flex-1 font-data text-data tracking-[0.05em] text-[var(--color-kindra-meta-low)] transition-colors duration-700 group-hover/row:text-[var(--color-kindra-meta-high)]">
                      {fragment}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <PageNav current="/contato" onClick={onNavClick} />
        </div>
      </Section>

      {/* Section 2 - Form */}
      <Section align="left" innerClassName="py-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow label="or drop a message" />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="mb-8 mt-5 text-[length:var(--text-h2)] leading-[1.1] font-bold text-[var(--color-kindra-text-white)] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Write to{" "}
            <span className="italic text-[var(--color-kindra-meta-mid)] font-normal">
              me
            </span>
          </motion.h2>

          <motion.div variants={fadeUp}>
            <ContactForm />
          </motion.div>

          {/* Footer meta row */}
          <motion.div variants={fadeUp} className="mt-14">
            <MetaRow
              items={["based in curitiba", "BRT", "usually reply within 24h"]}
            />
          </motion.div>
        </motion.div>
      </Section>
    </ScrollStage>
  );
}
