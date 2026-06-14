"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import Eyebrow from "@/components/ui/Eyebrow";
import MetaRow from "@/components/ui/MetaRow";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import ContentScrim from "@/components/layout/ContentScrim";
import { timeline, philosophy } from "@/lib/content";
import { getColorValue } from "@/lib/colors";
import { stagger, fadeUp, enterAt } from "@/lib/motion";
import styles from "./sobre.module.css";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

export default function SobrePage() {
  return (
    <PageShell
      hudRole="online · reflecting"
      stripText="◈ MK · about · idx.04"
      background={({ exploding, onExplodeComplete }) => (
        <>
          <div
            className={`${styles.photoStage} ${exploding ? styles.photoStageExploding : ""}`}
          >
            <ParticlePhoto
              imageSrc="/images/kindra-projetos.png"
              maxWidth={760}
              xOffset={330}
              particleSize={1.45}
              edgeFade={0.22}
              animate
              explode={exploding}
              onExplodeComplete={onExplodeComplete}
            />
          </div>
          {/* Photo sits right-of-center; darken the left so the left-anchored
              text column stays legible over it. */}
          <ContentScrim side="left" intensity="strong" />
        </>
      )}
    >
      <SobreContent />
    </PageShell>
  );
}

function SobreContent() {
  const { onNavClick } = useShellNav();
  const yellow = getColorValue("yellow");

  return (
    <ScrollStage>
      {/* Section 1 — Hero. Enters via the CSS `.enter-rise` idiom
          (globals.css), not framer `initial="hidden"` — the SSR HTML must
          paint the h1 before the pixi-heavy bundle hydrates (deep-link LCP). */}
      <Section align="left">
        <div>
          <div className="enter-rise" style={enterAt(0)}>
            <Eyebrow index="04" label="who i am" accent={yellow} />
          </div>

          <h1
            className="enter-rise mt-5 mb-5 font-bold tracking-[-0.02em] text-[var(--color-kindra-text-white)]"
            style={{ ...enterAt(1), fontFamily: "var(--font-heading)" }}
          >
            <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[length:var(--text-h1)] leading-[1.1]">
              <span>
                About <Mark color="yellow">me</Mark>
              </span>
              <span className="italic font-normal text-[length:var(--text-h2)] text-[var(--color-kindra-meta-mid)]">
                — co-founder &amp; builder
              </span>
            </span>
          </h1>

          <p
            className="enter-rise max-w-[540px] font-normal text-[length:var(--text-body)] leading-[1.7] text-[var(--color-kindra-meta-high)]"
            style={{ ...enterAt(2), fontFamily: "var(--font-body)" }}
          >
            Co-founder at <Mark color="yellow">MokLabs Venture Studio</Mark>{" "}
            and founding team at Lugui.ai. 8 years architecting platforms at
            Arco Educação — shipping infrastructure that reached millions of
            students. Now turning that experience into ventures of my own.
          </p>

          <PageNav current="/sobre" onClick={onNavClick} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className={styles.scrollHint}
          >
            <span className={styles.scrollHintRule} />
            <span>scroll &middot; journey &middot; philosophy &middot; formation</span>
            <span aria-hidden className={`animate-bounce ${styles.scrollHintArrow}`}>
              ↓
            </span>
          </motion.div>
        </div>
      </Section>

      {/* Section 2 — Journey timeline */}
      <Section align="left">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow label="journey" accent={yellow} />
          </motion.div>

          <motion.h2 variants={fadeUp} className={`mt-4 ${styles.sectionTitle}`}>
            From code to{" "}
            <span className={styles.sectionTitleNote}>co-founder</span>
          </motion.h2>

          <div className={styles.timeline}>
            <span aria-hidden className={styles.timelineTrack} />

            {timeline.map((item) => (
              <motion.div
                key={item.year + item.title}
                variants={fadeUp}
                className={styles.timelineItem}
              >
                <span aria-hidden className={styles.timelineDot} />
                <span className={styles.timelineYear}>{item.year}</span>
                <h3 className={styles.timelineRole}>{item.title}</h3>
                <p className={styles.timelineDesc}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Section 3 — Philosophy */}
      <Section align="left">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow label="philosophy" accent={yellow} />
          </motion.div>

          <motion.h2 variants={fadeUp} className={`mt-4 ${styles.sectionTitle}`}>
            Engineering{" "}
            <span className={styles.sectionTitleNote}>principles</span>
          </motion.h2>

          <motion.div className={styles.philosophyGrid} variants={stagger}>
            {philosophy.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className={styles.philosophyCard}
              >
                <span className={styles.philosophyIndex}>
                  → {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.philosophyTitle}>{item.title}</h3>
                <p className={styles.philosophyDesc}>{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* Section 4 — Formation / closing */}
      <Section align="left">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow label="formation" accent={yellow} />
          </motion.div>

          <motion.p variants={fadeUp} className={`mt-5 ${styles.formationLead}`}>
            <span className={styles.formationLeadStrong}>
              Software Engineering
            </span>{" "}
            — specialized in <Mark color="yellow">Cloud Computing</Mark> (AWS,
            Azure) &amp; DevOps.
          </motion.p>

          <motion.p variants={fadeUp} className={styles.formationBody}>
            Analytical, visual, systems-oriented thinker. I value clarity,
            structure, and operational precision.
          </motion.p>

          <motion.div variants={fadeUp}>
            <MetaRow
              className="mt-10"
              items={["idx.04", "curitiba — BRT", "always curious"]}
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <PageNav current="/sobre" onClick={onNavClick} />
          </motion.div>
        </motion.div>
      </Section>
    </ScrollStage>
  );
}
