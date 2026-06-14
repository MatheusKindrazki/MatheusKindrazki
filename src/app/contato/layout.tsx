import type { Metadata } from "next";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`.
 */
export const metadata: Metadata = {
  title: "contato — matheus kindrazki",
  description:
    "Direct line to Matheus Kindrazki — email, scheduling, and social channels. Based in Curitiba, Brazil.",
};

export default function ContatoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
