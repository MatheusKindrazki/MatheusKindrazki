import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getRouteMeta } from "@/lib/routeIndex";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`. Title is
 * derived from the route registry label so casing/labels stay single-sourced;
 * the root template appends "· Matheus Kindrazki".
 */
const PATH = "/skills";

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: getRouteMeta(PATH).label,
  accent: getRouteMeta(PATH).accent,
  description:
    "The operating stack — AI & RAG systems, platform engineering, frontend architecture, and the tools Matheus Kindrazki works with daily.",
});

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
