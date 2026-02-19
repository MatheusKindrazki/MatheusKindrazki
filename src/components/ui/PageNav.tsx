"use client";

import { motion } from "framer-motion";
import AnimatedLink from "@/components/ui/AnimatedLink";
import { navLinks } from "@/lib/content";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
  },
};

interface PageNavProps {
  /** Current page href to exclude from nav (e.g. "/projetos") */
  current: string;
  onClick?: (href: string) => (e: React.MouseEvent) => void;
}

export default function PageNav({ current, onClick }: PageNavProps) {
  const links = navLinks.filter((l) => l.href !== current);

  return (
    <motion.div
      className="flex flex-wrap gap-6 mt-8"
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {links.map((link) => (
        <motion.div key={link.href} variants={slideUp}>
          <AnimatedLink
            href={link.href}
            color={link.color}
            onClick={onClick?.(link.href)}
          >
            {link.label}
          </AnimatedLink>
        </motion.div>
      ))}
    </motion.div>
  );
}
