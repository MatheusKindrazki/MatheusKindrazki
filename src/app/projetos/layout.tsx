import type { Metadata } from "next";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`.
 */
export const metadata: Metadata = {
  title: "projetos — matheus kindrazki",
  description:
    "A live atlas of current ventures and past systems — AI products, platforms, and developer tools Matheus Kindrazki has been building since 2017.",
};

export default function ProjetosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
