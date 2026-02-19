"use client";

import dynamic from "next/dynamic";
import BackArrow from "@/components/ui/BackArrow";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import AnimatedLink from "@/components/ui/AnimatedLink";
import ContactForm from "@/components/ui/ContactForm";
import { profile } from "@/lib/content";
import { FaGithub, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { getColorValue } from "@/lib/colors";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const socialLinks = [
  { href: profile.social.github, icon: FaGithub, label: "GitHub" },
  { href: profile.social.linkedin, icon: FaLinkedinIn, label: "LinkedIn" },
  { href: profile.social.instagram, icon: FaInstagram, label: "Instagram" },
  { href: profile.social.twitter, icon: FaXTwitter, label: "X/Twitter" },
];

export default function ContatoPage() {
  return (
    <div className="margin-auto relative w-full max-w-[1280px] h-screen min-h-[500px] max-h-[800px] overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Particle background */}
      <div className="absolute inset-0 z-[1]">
        <ParticlePhoto imageSrc="/images/kindra-photo.png" />
      </div>

      {/* Back nav - absolute, always visible */}
      <div className="absolute top-[49px] z-20 w-full">
        <div className="w-[90%] max-w-[650px] mx-auto">
          <BackArrow />
        </div>
      </div>

      {/* Single full-screen section */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-[90%] max-w-[650px] mx-auto">
          <h1
            className="text-[48px] leading-[63px] font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <Mark color="red">Contato</Mark>
          </h1>

          <p className="text-[#aaa] text-sm mb-12 max-w-[600px]">
            Quer conversar sobre arquitetura, AI ou projetos? Me manda uma
            mensagem.
          </p>
            <PageNav current="/contato" />

          <div className="flex flex-col gap-16">
            {/* Form */}
            <div className="bg-[#111]/90 backdrop-blur-md border border-[#222] rounded-lg p-6">
              <ContactForm />
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap gap-8">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#666] mb-2">
                  Email
                </h3>
                <AnimatedLink
                  href={`mailto:${profile.email}`}
                  color="red"
                  external
                >
                  {profile.email}
                </AnimatedLink>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#666] mb-2">
                  Localizacao
                </h3>
                <p className="text-[#aaa] text-sm">{profile.location}</p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-[#666] mb-4">
                  Redes
                </h3>
                <div className="flex gap-4">
                  {socialLinks.map(({ href, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="text-[#aaa] hover:text-white transition-colors duration-500 text-xl"
                      style={
                        {
                          "--hover-color": getColorValue("red"),
                        } as React.CSSProperties
                      }
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
