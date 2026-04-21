import type { Metadata } from "next";
import { Roboto_Slab, Montserrat } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import "./globals.css";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-heading",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Matheus Kindrazki — Co-founder & Builder",
  description:
    "Co-founder at MokLabs Venture Studio. Founding team at Lugui.ai. Technology adventurer building ventures at the edges of engineering and AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${robotoSlab.variable} ${montserrat.variable}`}
    >
      <body>
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
