import { getRouteMeta } from "@/lib/routeIndex";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

const PATH = "/sobre";
const meta = getRouteMeta(PATH);
const description =
  "Engineering since 2017 — from platforms used by millions of students to co-founding a venture studio.";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${meta.label} — Matheus Kindrazki`;

export default function Image() {
  return renderOgCard({
    label: meta.label,
    description,
    accent: meta.accent,
    index: meta.index,
    alt,
  });
}
