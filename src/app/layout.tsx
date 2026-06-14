import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://kindrazki.dev"),
  title: "Matheus Kindrazki — Co-founder & Builder",
  description:
    "Co-founder at MokLabs Venture Studio. Founding team at Lugui.ai. Technology adventurer building ventures at the edges of engineering and AI.",
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
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
