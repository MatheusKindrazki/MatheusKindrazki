import type { Metadata } from "next";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`.
 */
export const metadata: Metadata = {
  title: "skills — matheus kindrazki",
  description:
    "The operating stack — AI & RAG systems, platform engineering, frontend architecture, and the tools Matheus Kindrazki works with daily.",
};

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
