"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import BackArrow from "@/components/ui/BackArrow";
import Mark from "@/components/ui/Mark";
import ProjectCard from "@/components/ui/ProjectCard";
import PageNav from "@/components/ui/PageNav";
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
      <div className={`fixed inset-0 pointer-events-none ${exploding ? "z-50" : "z-[1]"}`}>
        <ParticlePhoto
          imageSrc="/images/kindra-projetos.png"
          animate
          explode={exploding}
          onExplodeComplete={handleExplodeComplete}
        />
      </div>

    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[800px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Back nav - absolute, always visible */}
      <div className="absolute top-[49px] z-20 w-full">
        <div className="w-[90%] max-w-[650px] mx-auto">
          <BackArrow onClick={handleBackClick} />
        </div>
      </div>

      {/* Scrollable snap container */}
      <div className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory">
        {/* Section 1 - Hero */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto">
            <h1
              className="text-[48px] leading-[63px] font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Mark color="green">Projetos</Mark>
            </h1>

            <p className="text-[#aaa] text-sm max-w-[480px]">
              Trabalho enquanto os outros tomam banho. Literalmente.
            </p>
            <p className="text-[#666] text-xs mt-2">
              Plataformas educacionais, ferramentas de AI e produtos que fazem
              diferenca.
            </p>
            <PageNav current="/projetos" onClick={handleNavClick} />
          </div>
        </section>

        {/* Section 2 - Project cards */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-12">
            <motion.div
              className="grid grid-cols-1 gap-6"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {projects.map((project, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-[#111]/90 backdrop-blur-md rounded-lg border border-[#222] p-5"
                >
                  <ProjectCard {...project} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
