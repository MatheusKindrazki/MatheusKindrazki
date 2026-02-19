"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface BackArrowProps {
  onClick?: (e: React.MouseEvent) => void
}

export default function BackArrow({ onClick }: BackArrowProps) {
  return (
    <Link href="/" onClick={onClick} className="inline-flex items-center gap-2 group" title="Voltar">
      <motion.span
        className="text-[#666] group-hover:text-white transition-colors duration-500 text-2xl"
        animate={{ x: [0, -6, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        &larr;
      </motion.span>
      <span className="text-sm text-[#666] group-hover:text-white transition-colors duration-500">
        Kindra
      </span>
    </Link>
  );
}
