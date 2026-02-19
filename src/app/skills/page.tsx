"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import BackArrow from "@/components/ui/BackArrow";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import SkillBadge from "@/components/ui/SkillBadge";
import BlackHole from "@/components/ui/BlackHole";
import { skillCategories } from "@/lib/content";
import { getColorValue } from "@/lib/colors";

const BH_OFFSET_X = 200;

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

export default function SkillsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [gravityActive, setGravityActive] = useState(false);
  const gravityIntensityRef = useRef(0); // 0→1 ramp-up after formation

  const handleFormationComplete = useCallback(() => {
    setGravityActive(true);
  }, []);

  // Gravitational distortion on scroll - only after black hole explodes
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !gravityActive) return;

    let rafId: number;
    const startTime = performance.now();
    const RAMP_DURATION = 1500; // 1.5s to reach full gravity

    const update = () => {
      const now = performance.now();
      // Smoothly ramp up gravity intensity after activation
      gravityIntensityRef.current = Math.min(
        1,
        (now - startTime) / RAMP_DURATION,
      );
      const intensity = gravityIntensityRef.current;

      const vh = window.innerHeight;
      const scrollTop = scrollEl.scrollTop;

      sectionsRef.current.forEach((el, i) => {
        if (!el) return;

        // Section center Y in viewport coords
        const sectionTop = i * vh - scrollTop;
        const sectionCenterY = sectionTop + vh / 2;

        // Distance from black hole center
        const bhY = vh / 2;
        const dy = sectionCenterY - bhY;
        const distance = Math.abs(dy);
        const maxRange = vh * 1.3;

        if (distance > maxRange) {
          el.style.transform = "";
          return;
        }

        // Proximity: 0 (far) → 1 (at black hole center)
        const raw = 1 - distance / maxRange;
        const proximity = raw * raw * intensity; // Quadratic + intensity ramp

        // Direction: sections above BH get pulled down, below get pulled up
        const sign = dy > 0 ? -1 : 1;

        // Gravitational effects
        const pullX = proximity * 45;
        const pullY = sign * proximity * 25;
        const skewY = sign * proximity * 5;
        const skewX = proximity * 2;
        const rotateZ = sign * proximity * 1.5;
        const scaleX = 1 + proximity * 0.04;
        const scaleY = 1 - proximity * 0.02;

        el.style.transform = [
          `perspective(600px)`,
          `translate(${pullX}px, ${pullY}px)`,
          `skew(${skewX}deg, ${skewY}deg)`,
          `rotate(${rotateZ}deg)`,
          `scale(${scaleX}, ${scaleY})`,
        ].join(" ");
        el.style.transformOrigin = "left center";
        el.style.transition = "transform 0.08s linear";
      });

      // Keep running rAF during ramp-up even without scroll
      if (intensity < 1) {
        rafId = requestAnimationFrame(update);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    // Start ramp-up animation
    rafId = requestAnimationFrame(update);

    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [gravityActive]);

  const setSectionRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      sectionsRef.current[index] = el;
    },
    [],
  );

  // Total sections: 1 hero + N categories + 1 curiosidade
  const totalSections = 1 + skillCategories.length + 1;

  return (
    <>
      {/* Black hole - full viewport, never clipped */}
      <BlackHole
        src="/images/kindra-skills.mp4"
        alt="Kindra DJ"
        offsetX={BH_OFFSET_X}
        onFormationComplete={handleFormationComplete}
      />

    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[800px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Back nav - absolute, always visible */}
      <div className="absolute top-[49px] z-20 w-full">
        <div className="w-[90%] max-w-[650px] mx-auto">
          <BackArrow />
        </div>
      </div>

      {/* Scrollable snap container */}
      <div
        ref={scrollRef}
        className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory"
      >
        {/* Section 1 - Hero */}
        <section
          ref={setSectionRef(0)}
          className="min-h-full snap-start flex items-center"
        >
          <div className="w-[90%] max-w-[650px] mx-auto">
            <h1
              className="text-[48px] leading-[63px] font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Skills & <Mark color="blue">Tecnologias</Mark>
            </h1>

            <p className="text-[#aaa] text-sm max-w-[600px]">
              Ferramentas e tecnologias que uso para construir sistemas
              coerentes em escala.
            </p>
            <PageNav current="/skills" />
          </div>
        </section>

        {/* Each skill category as its own snap section */}
        {skillCategories.map((category, i) => (
          <section
            key={i}
            ref={setSectionRef(i + 1)}
            className="min-h-full snap-start flex items-center"
          >
            <div className="w-[90%] max-w-[650px] mx-auto">
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="bg-[#111]/90 backdrop-blur-md border border-[#222] rounded-lg p-6"
              >
                <motion.h2
                  variants={fadeUp}
                  className="text-lg font-bold mb-4"
                  style={{
                    color: getColorValue(category.color),
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {category.title}
                </motion.h2>
                <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                  {category.skills.map((skill) => (
                    <SkillBadge
                      key={skill}
                      name={skill}
                      color={category.color}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>
        ))}

        {/* Curiosidade - DJ */}
        <section
          ref={setSectionRef(totalSections - 1)}
          className="min-h-full snap-start flex items-center"
        >
          <div className="w-[90%] max-w-[650px] mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="bg-[#111]/90 backdrop-blur-md border border-[#222] rounded-lg p-6"
            >
              <motion.p
                variants={fadeUp}
                className="text-xs uppercase tracking-widest text-[#666] mb-3"
              >
                Curiosidade
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-lg font-bold text-white mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Nas horas vagas, sou <Mark color="blue">musico</Mark> e{" "}
                <Mark color="yellow">DJ</Mark>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-[#aaa] text-sm leading-relaxed"
              >
                Quando nao estou debugando produção ou desenhando arquiteturas,
                provavelmente estou mixando tracks ou produzindo beats. A
                criatividade nao para no codigo.
              </motion.p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
