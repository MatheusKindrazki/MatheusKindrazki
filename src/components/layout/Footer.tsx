import { FaGithub, FaLinkedinIn, FaInstagram } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { profile } from '@/lib/content'

const socialIcons = [
  { href: profile.social.github, icon: FaGithub, label: 'GitHub' },
  { href: profile.social.linkedin, icon: FaLinkedinIn, label: 'LinkedIn' },
  { href: profile.social.instagram, icon: FaInstagram, label: 'Instagram' },
  { href: profile.social.twitter, icon: FaXTwitter, label: 'X/Twitter' },
]

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 px-6 py-4 md:px-12 md:py-6">
      <div className="max-w-[1000px] mx-auto flex items-center gap-5">
        {socialIcons.map(({ href, icon: Icon, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className="text-[#aaa] hover:text-white transition-colors duration-500 text-lg"
          >
            <Icon />
          </a>
        ))}
      </div>
    </footer>
  )
}
