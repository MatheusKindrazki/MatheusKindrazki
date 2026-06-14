import { getRouteMeta } from "@/lib/routeIndex";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

const PATH = "/now";
const meta = getRouteMeta(PATH);
const description =
  "What Matheus Kindrazki is building, learning, reading — and deliberately not doing — right now.";

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
