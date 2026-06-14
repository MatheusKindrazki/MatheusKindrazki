import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import JsonLd from "@/components/seo/JsonLd";
import { profile } from "@/lib/content";
import {
  SITE_URL,
  SITE_NAME,
  canonicalUrl,
  websiteSchema,
  personSchema,
} from "@/lib/seo";
import "./globals.css";

/* Display/heading voice — variable Fraunces with true italics. The full
   wght axis (100–900) makes every weight the site requests (300/400/700/800)
   a real cut, and opsz keeps large heroes sharp while small headings stay
   sturdy. SOFT/WONK ship so components can opt into the wonky display
   forms (e.g. the signature ampersand) via font-variation-settings. */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-heading",
  display: "swap",
});

/* Body voice — variable Instrument Sans (wght 400–700) with real italics.
   Chosen for quiet legibility at small sizes over personality. */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

/* Data/HUD voice — IBM Plex Mono. More legible than Space Mono at the
   10–13px telemetry sizes this site lives in, with true italics and
   inherently tabular (monospaced) numerals. */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-data",
  display: "swap",
});

/* Home default title — derived from the profile so it never drifts from the
   atlas. Per-route layouts override `title` with a bare label (e.g. "projects")
   and the template below appends the brand; the home `default` is the ONE title
   that must already carry the brand, so it is excluded from the template (Next
   never applies a template to `title.default`). */
const HOME_TITLE = `${SITE_NAME} — ${profile.title}`;
const HOME_DESCRIPTION = profile.description;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: profile.social.linkedin }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    profile.name,
    profile.nickname,
    profile.title,
    profile.company,
    "Lugui.ai",
    "MokLabs",
    "venture studio",
    "AI engineering",
    "RAG",
    "founder",
    "software architect",
    profile.location,
  ],
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    type: "website",
    url: canonicalUrl("/"),
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    creator: `@${profile.social.twitter.split("/").filter(Boolean).pop()}`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/* themeColor lives on `viewport`, not `metadata` (Next 15 split these). Matches
   the --bg token (#000000) so the browser chrome blends into the dark site. */
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* NOTE: the home-portrait preload lives in app/page.tsx, not here — the
     root layout wraps ALL routes, and preloading the 600KB home image on a
     direct visit to /projetos or /sobre competed with that page's own
     portrait for bandwidth. */
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        {/* Structured data (schema.org). Server-rendered into the SSR HTML so
            crawlers read it on first paint. Both nodes derive from the
            content.ts profile via @/lib/seo. */}
        <JsonLd schema={websiteSchema()} />
        <JsonLd schema={personSchema()} />
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
