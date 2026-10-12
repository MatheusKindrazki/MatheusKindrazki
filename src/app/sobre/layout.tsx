import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getRouteMeta } from "@/lib/routeIndex";

/**
 * Server layout whose only job is route-level metadata — the page itself is
 * a client component ("use client") and cannot export `metadata`. Title is
 * derived from the route registry label so casing/labels stay single-sourced;
 * the root template appends "· Matheus Kindrazki".
 */
const PATH = "/sobre";

export const metadata: Metadata = buildMetadata({
  path: PATH,
  title: getRouteMeta(PATH).label,
  accent: getRouteMeta(PATH).accent,
  description:
    "Engineering since 2017. CTO at Applause.team, co-founder at MokLabs, and AI Research Fellow at CEIA (UFG). Journey, working principles, and selected writing.",
});

export default function SobreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
