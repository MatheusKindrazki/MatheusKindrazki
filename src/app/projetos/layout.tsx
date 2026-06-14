import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getRouteMeta } from "@/lib/routeIndex";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`. Title is
 * derived from the route registry label so casing/labels stay single-sourced;
 * the root template appends "· Matheus Kindrazki".
 */
const PATH = "/projetos";

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: getRouteMeta(PATH).label,
  accent: getRouteMeta(PATH).accent,
  description:
    "A live atlas of current ventures and past systems — AI products, platforms, and developer tools Matheus Kindrazki has been building since 2017.",
});

export default function ProjetosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
