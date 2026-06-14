import type { Metadata } from "next";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`.
 */
export const metadata: Metadata = {
  title: "now — matheus kindrazki",
  description:
    "What Matheus Kindrazki is building, learning, reading — and deliberately not doing — right now. Derived from live project data.",
};

export default function NowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
