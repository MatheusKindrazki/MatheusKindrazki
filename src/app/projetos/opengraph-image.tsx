import { getRouteMeta } from "@/lib/routeIndex";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

const PATH = "/projetos";
const meta = getRouteMeta(PATH);
const description =
  "A live atlas of current ventures and past systems — AI products, platforms, and developer tools.";

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
