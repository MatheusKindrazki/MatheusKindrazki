"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Mark from "@/components/ui/Mark";
import ProjectCard from "@/components/ui/ProjectCard";
import PageNav from "@/components/ui/PageNav";
import PageChrome from "@/components/layout/PageChrome";
import { projects } from "@/lib/content";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
  },
};

// Derive a status per project. Keep it here so content.ts stays untouched.
function resolveStatus(title: string): "current" | "past" | "side" {
  if (title === "MokLabs Venture Studio") return "current";
  if (title === "Lugui.ai") return "current";
  if (title.startsWith("Arco")) return "past";
  return "side";
}

export default function ProjetosPage() {
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

  const handleExplodeComplete = useCallback(() => {
    if (pendingNavRef.current) {
      router.push(pendingNavRef.current);
    }
  }, [router]);

  const handleNavClick = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (exploding) return;
      pendingNavRef.current = href;
      setExploding(true);
    },
    [exploding],
  );

  return (
    <>
      {/* Particle canvas - full viewport, never clipped */}
      <div
        className={`fixed inset-0 pointer-events-none ${exploding ? "z-50" : "z-[1]"}`}
      >
        <ParticlePhoto
          imageSrc="/images/kindra-projetos.png"
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
          index="02"
          label="projects"
          hudRole="online · shipping"
          onBackClick={handleBackClick}
        />

        {/* Scrollable snap container */}
        <div className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory">
          {/* Section 1 - Hero */}
          <section className="min-h-full snap-start flex items-center">
            <div className="w-[90%] max-w-[650px] mx-auto">
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                {/* Eyebrow */}
                <motion.p
                  variants={fadeUp}
                  className="mb-5 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="h-px w-10 bg-[var(--color-kindra-rule)]" />
                  <span>
                    <span className="text-[#555]">[</span>{" "}
                    <span className="text-[var(--color-kindra-meta-low)]">/ 02</span>{" "}
                    <span className="text-[#333]">—</span> selected work{" "}
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
                    <Mark color="green">Projects</Mark>
                    <span className="italic text-[var(--color-kindra-meta-low)] text-[30px] font-normal">
                      — ventures, tools &amp; builds
                    </span>
                  </span>
                </motion.h1>

                {/* Subcopy */}
                <motion.p
                  variants={fadeUp}
                  className="mb-2 max-w-[480px] text-[15px] leading-[24px] text-[#c8c8c8] font-light"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  I work while everyone else is still in the shower. Literally.
                </motion.p>
                <motion.p
                  variants={fadeUp}
                  className="max-w-[480px] text-xs leading-[20px] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Ventures, AI tools, and platforms that actually make a
                  difference.
                </motion.p>

                {/* Meta divider */}
                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="h-px flex-1 max-w-[60px] bg-[#222]" />
                  <span>
                    {String(projects.length).padStart(2, "0")} projects
                    <span className="mx-2 text-[#2a2a2a]">·</span>
                    curitiba
                    <span className="mx-2 text-[#2a2a2a]">·</span>
                    2017 — now
                  </span>
                  <span className="h-px flex-1 bg-[#222]" />
                </motion.div>

                <PageNav current="/projetos" onClick={handleNavClick} />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="mt-12 flex items-center gap-3 text-[9px] uppercase tracking-[0.35em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="inline-block h-px w-8 bg-[#333]" />
                  <span>scroll · {projects.length} selected works</span>
                  <span
                    aria-hidden
                    className="animate-bounce text-[12px] text-[#419d78]"
                  >
                    ↓
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Section 2 - Project cards */}
          <section className="min-h-full snap-start flex items-center">
            <div className="w-[90%] max-w-[650px] mx-auto py-12">
              <motion.div
                className="grid grid-cols-1 gap-5"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                {projects.map((project, i) => (
                  <motion.div key={project.title} variants={fadeUp}>
                    <ProjectCard
                      {...project}
                      index={String(i + 1).padStart(2, "0")}
                      status={resolveStatus(project.title)}
                    />
                  </motion.div>
                ))}

                {/* Footer meta row */}
                <motion.div
                  variants={fadeUp}
                  className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="h-px w-10 bg-[#222]" />
                  <span>
                    idx.02
                    <span className="mx-2 text-[#2a2a2a]">·</span>
                    {String(projects.length).padStart(2, "0")} entries
                    <span className="mx-2 text-[#2a2a2a]">·</span>
                    more in motion
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
