import type { Metadata } from "next";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`.
 */
export const metadata: Metadata = {
  title: "sobre — matheus kindrazki",
  description:
    "Engineering since 2017 — from platforms used by millions of students at Arco Educação to co-founding MokLabs Venture Studio. Formation, philosophy, and the timeline.",
};

export default function SobreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
