# Copilot Instructions — kindra-portfolio

Guidance for GitHub Copilot and other AI assistants working in this repo. For the full design brief, the canonical source is [`/.impeccable.md`](../.impeccable.md). This file mirrors the design section so Copilot picks it up automatically.

## Project

- **Name**: kindra-portfolio (v3)
- **Owner**: Matheus Kindrazki ("Kindra") — Co-founder at MokLabs Venture Studio, founding team at Lugui.ai
- **Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, three.js + @react-three/fiber, framer-motion

## Design Context

### Users

Primary audience is **international-first** (English by default, Portuguese as cultural tell):

1. **Founders & investors** evaluating Matheus as a co-founder / partner for ventures at MokLabs or Lugui.ai
2. **Engineering leaders at foreign companies** evaluating him for Principal / Staff / Founding-Engineer roles
3. **Engineers and technical peers** who land here through X, GitHub, or talks

Context of use: mostly **desktop, focused evaluation sessions**. Mobile is a secondary scan surface. Sessions are short — the interface has seconds, not minutes.

**Job to be done**: establish in the first 3 seconds that Matheus is a **distinctive, high-agency builder** worth opening a conversation with. The portfolio IS the pitch — proof-of-craft happens on the canvas, not in a paragraph.

**Primary CTAs (priority order)**: (1) Open Jarvis chat, (2) Email, (3) Social follow, (4) Read `/now`.

### Brand Personality

Three words: **confident · handcrafted · mechanism-minded**

- **Confident** — declarative statements, strong hierarchy, zero apologetic hedging
- **Handcrafted** — every detail is considered; nothing is a framework default
- **Mechanism-minded** — expose the machinery (index numbers, HUD chrome, status tickers, tabular numerals). "Mechanisms over magic"

Voice: direct, English-first, occasional Portuguese routes (`/sobre`, `/projetos`, `/contato`) as cultural signature.

### Aesthetic Direction

**Style**: Editorial brutalism with a galactic edge. Raw typographic structure meets dimensional depth. Dark void as canvas, accents as signals.

**Theme**: **Dark-only — by design**. Do not add a light-mode toggle.

**References (feel captured)**: rauno.me, linear.app, brittanychiang.com, pitch.com, vercel.com

**Anti-references (NEVER)**:
- Generic dev-portfolio boilerplate (icon grid of skills, gradient avatar, stacked feature cards)
- Corporate SaaS homepage (hero + 3 cards + testimonial carousel)
- AI slop: purple→blue gradients, glassmorphism everywhere, cyan-on-dark, neon glow decoration
- Flat Material/Bootstrap with a dark toggle
- Anything that could plausibly be a Figma Community template

**Signature elements — SACRED**:
- Particle photo canvas with explode-on-navigation (`ParticlePhoto`)
- Brutalist typographic compositions — rotated off-axis subtitles (`rotate(-2deg)`), ornamental italic serif ampersand in kindra-yellow, square geometric accent markers
- Scramble-in text reveals (`useScramble`)
- Slow grain drift overlay (~18s cycle)
- Shimmer-pass on key accent characters (`shimmer-yellow`)
- HUD chrome: `01` index numbers, uppercase tracked labels, status strip ticker (`◈ MK · ...`)
- Tabular numerals and monospaced precision touches
- Exponential easing `cubic-bezier(0.19, 1, 0.22, 1)` (`--ease-smooth`) — never bouncy, never elastic
- Custom cursor on pointer-capable devices (`CustomCursor`)
- Left-aligned, asymmetric compositions; deliberate grid breaks
- Jarvis chat ("don't believe me? — ask jarvis") as visible differentiator

**Color system (preserve)**:
- Void: `#000000` true black + `#1c2023` panels
- Text: body `#dddddd`, emphasis `#ffffff`, meta `#9a9a9a / #666 / #3f3f3f / #3a3a3a`
- Accents: `--color-kindra-yellow #e0a458` (primary), green `#419d78`, red `#d9594c`, blue `#53a2be`
- Per-route accent identity: `/projetos`=green, `/skills`=blue, `/sobre`=yellow, `/contato`=red

**Typography (preserve)**:
- Display: **Roboto Slab 700** (`--font-heading`)
- Body: **Montserrat 400 / 700** (`--font-body`)
- Fluid `clamp()` on display only, fixed `rem` for UI chrome
- Uppercase tracked micro-labels: 9–12px, letter-spacing 0.18–0.3em
- Italic serif reserved for ornamental accents

### Design Principles

1. **The interface IS the proof.** Every surface demonstrates craft; never let copy carry the message alone.
2. **Mechanisms on display.** Expose structure and process. The machinery is part of the aesthetic.
3. **Dark as canvas, accent as signal.** Color is rationed and directional, never decorative.
4. **Brutalist structure, exponential motion.** Raw skeleton and asymmetry, but motion is always smooth `ease-out`. Never bouncy. Never abrupt. Never linear.
5. **Reduce to essence, then one deliberate deviation.** Every composition has a clear skeleton plus one intentional break.

**Meta-rule**: reject any choice that would let a visitor think *"this could be any portfolio."* If it fits anywhere else, it does not belong here.

## Coding Conventions

- Tailwind-first styling; CSS variables in `globals.css` for tokens. Do not introduce a new styling library.
- Client Components (`"use client"`) only when needed (state, refs, framer-motion, DOM APIs). Keep canvas/particle code client-side and dynamically imported with `ssr: false`.
- All animations use the exponential `--ease-smooth` curve; avoid bounce/elastic.
- Respect `prefers-reduced-motion` — every animated class already has a reduced-motion variant in `globals.css`; extend that pattern.
- Content lives in `src/lib/content.ts`. Edit there, not in page files, when updating profile/projects/skills/timeline.
