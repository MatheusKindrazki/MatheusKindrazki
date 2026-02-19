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
  title: "Matheus Kindrazki - Principal Engineer",
  description:
    "Principal Engineer focused on frontend architecture at scale, microfrontends, design systems, and AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
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
