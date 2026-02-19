"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import BackArrow from "@/components/ui/BackArrow";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import { profile, timeline, philosophy } from "@/lib/content";
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

export default function SobrePage() {
  return (
    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[800px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Particle background */}
      <div className="absolute inset-0 z-[1]">
        <ParticlePhoto imageSrc="/images/kindra-photo.png" />
      </div>

      {/* Back nav - absolute, always visible */}
      <div className="absolute top-[49px] z-20 w-full">
        <div className="w-[90%] max-w-[650px] mx-auto">
          <BackArrow />
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
              Sobre <Mark color="yellow">mim</Mark>
            </h1>

            <p className="text-[#aaa] text-sm max-w-[600px]">
              Principal Engineer focado em{" "}
              <Mark color="blue">frontend architecture at scale</Mark>,
              microfrontends, design systems e developer experience. Trabalho na
              Arco Educacao ha 5 anos construindo infraestrutura educacional que
              impacta milhoes de estudantes pelo Brasil.
            </p>
            <PageNav current="/sobre" />
          </div>
        </section>

        {/* Section 2 - Timeline */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-16">
            <h2
              className="text-2xl font-bold text-white mb-8"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Trajetoria
            </h2>

            <motion.div
              className="relative pl-8 border-l border-[#333]"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="mb-8 last:mb-0"
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: getColorValue("yellow") }}
                  >
                    {item.year}
                  </span>
                  <h3 className="text-white font-bold mt-1">{item.title}</h3>
                  <p className="text-[#888] text-sm mt-1">{item.description}</p>
                  <div
                    className="absolute left-[-5px] w-[10px] h-[10px] rounded-full bg-[#e0a458]"
                    style={{ marginTop: "-40px" }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section 3 - Philosophy */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto py-16">
            <h2
              className="text-2xl font-bold text-white mb-8"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Filosofia de Engenharia
            </h2>

            <motion.div
              className="grid grid-cols-1 gap-6"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {philosophy.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="border border-[#222] rounded-lg p-6 hover:border-[#e0a458]/30 transition-colors duration-500 bg-[#111]/90 backdrop-blur-md"
                >
                  <h3
                    className="text-white font-bold mb-2"
                    style={{ color: getColorValue("yellow") }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[#888] text-sm">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section 4 - Formacao */}
        <section className="min-h-full snap-start flex items-center">
          <div className="w-[90%] max-w-[650px] mx-auto">
            <h2
              className="text-2xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Formacao
            </h2>
            <p className="text-[#aaa] text-sm mb-2">
              <strong className="text-white">Engenharia de Software</strong> —
              Especializacao em Cloud Computing (AWS, Azure) e DevOps.
            </p>
            <p className="text-[#888] text-sm">
              Neurodivergente (TEA Nivel 1). Pensamento analitico, visual e
              orientado a sistemas. Valorizo clareza, estrutura e precisao
              operacional.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
