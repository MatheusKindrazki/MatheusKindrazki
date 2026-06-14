import { profile } from "@/lib/content";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderOgCard,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${profile.name} — ${profile.title}`;

/** Default site share card — name-forward, yellow (home) accent. */
export default function Image() {
  return renderOgCard({
    accent: "yellow",
    index: "01",
    alt,
  });
}
