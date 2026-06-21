import type { ThemeColor } from '@/lib/colors'

// ──────────────────────────────────────────────────────────────────────
// Honest-by-construction dates. Nothing below is hand-edited: the "last
// updated" stamp is injected at build time from the last git commit that
// touched THIS file (see next.config.ts), and the age is computed from a
// birthdate instead of a number that silently rots.
// ──────────────────────────────────────────────────────────────────────

/** Mirrors the fallback in next.config.ts — used only when git history is unavailable. */
const CONTENT_UPDATED_FALLBACK_ISO = '2026-04-17'

/** Date-only ISO stamp (YYYY-MM-DD) of the last content commit. */
const contentUpdatedIso = (
  process.env.NEXT_PUBLIC_CONTENT_UPDATED_AT ?? CONTENT_UPDATED_FALLBACK_ISO
).slice(0, 10)

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const

function formatMonthYear(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/**
 * Only the birth YEAR is load-bearing: the site published "29" in feb 2026,
 * which pins the year to 1996; the day is a placeholder the owner can correct.
 * Computing from a date means the number can never go stale again.
 */
export const BIRTHDATE = new Date('1996-07-01T00:00:00Z')

export function computeAge(birthdate: Date, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - birthdate.getUTCFullYear()
  const monthDelta = today.getUTCMonth() - birthdate.getUTCMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birthdate.getUTCDate())) {
    age -= 1
  }
  return age
}

export const profile = {
  name: 'Matheus Kindrazki',
  nickname: 'Kindra',
  age: computeAge(BIRTHDATE),
  title: 'Co-founder & Builder',
  company: 'MokLabs Venture Studio',
  secondaryRole: 'Founding team at Lugui.ai',
  fellowship: 'AI Research Fellow · CEIA (UFG)',
  email: 'matheus@kindrazki.dev',
  location: 'Curitiba, Brazil',
  bio: 'Hey — my name is Matheus, but you can call me Kindra =)',
  headline: 'Building ventures where bold ideas meet careful engineering.',
  description:
    'Co-founder at MokLabs Venture Studio, founding team at Lugui.ai (AI infrastructure for the real-estate market), and AI Research Fellow at CEIA (UFG). Nearly six years at Arco Educação — from platform architecture at scale to Principal Engineer of AI, shipping applied-AI systems used by millions of students. Now turning that experience into products of my own. Technology adventurer, pragmatic builder.',
  calLink: 'https://cal.com/matheuskindrazki',
  social: {
    github: 'https://github.com/MatheusKindrazki',
    linkedin: 'https://linkedin.com/in/matheuskindrazki',
    medium: 'https://matheuskindrazki.medium.com',
    instagram: 'https://instagram.com/matheuskindrazki',
    twitter: 'https://x.com/kindraScript',
  },
}

/**
 * Site-wide rot-prone strings, kept in ONE place so the date stamp in the home
 * footer and the /now page never disagree. Both date fields derive from the
 * build-time git stamp — never edit them by hand.
 */
export const site = {
  /** e.g. 'jun 2026' */
  lastUpdated: formatMonthYear(contentUpdatedIso),
  /** YYYY-MM-DD */
  lastUpdatedIso: contentUpdatedIso,
}

export type ProjectStatus = 'current' | 'past' | 'side'

/** Maturity chip shown on /now's Building column. */
export type NowStatus = 'building' | 'alpha' | 'beta' | 'in-progress' | 'in-production'

export interface Project {
  title: string
  description: string
  tags: string[]
  color: ThemeColor
  link?: string
  /** Atlas/ledger metadata — co-located so the constellation scales with the list. */
  year: string
  status: ProjectStatus
  signal: string
  role: string
  coordinate: string
  /** Short "what's on the desk" copy for /now. Falls back to `description`. */
  nowNote?: string
  /** /now maturity chip. Defaults to 'building'. */
  nowStatus?: NowStatus
}

export const projects: Project[] = [
  {
    title: 'Jarvis — Personal AI Operating System',
    description:
      'My personal knowledge graph + AI agent. Connects memory, entities, tasks, and decisions across every project I touch. A living second brain built on MCP servers, vector search, and a growing taxonomy of what I know. It is private by design — my own assistant, not a public chatbot.',
    tags: ['MCP', 'RAG', 'Vector DB', 'Personal AI', 'Knowledge Graph', 'Claude'],
    color: 'yellow',
    year: '2024-2026',
    status: 'current',
    signal: 'memory',
    role: 'personal ai os',
    coordinate: 'rag/mcp',
    nowNote:
      'My personal knowledge graph + AI agent — a private second brain on MCP servers and vector search.',
    nowStatus: 'in-production',
  },
  {
    title: 'MokLabs Venture Studio',
    description:
      'Co-founded AI venture studio turning sharp ideas into shipped products. Shared platform engineering, design systems, and AI infrastructure power a portfolio of ventures — each new product reuses the scaffolding instead of rebuilding it.',
    tags: ['Venture Studio', 'Platform', 'Design Systems', 'AI Agents', 'Founder'],
    color: 'yellow',
    year: '2024-2026',
    status: 'current',
    signal: 'venture',
    role: 'co-founder',
    coordinate: 'studio/platform',
    nowNote:
      'Co-founding a studio that ships ambitious products with careful engineering.',
    nowStatus: 'building',
  },
  {
    title: 'Lugui.ai',
    description:
      'Founding team member building AI infrastructure for the real-estate market — "the intelligence of your agency, inside WhatsApp." Conversational agents and RAG pipelines that let realtors qualify leads, answer about listings, and close deals where their clients already are. Architecting the frontend, the agent/RAG stack, and the DX that lets a small team ship like a large one.',
    tags: ['AI', 'RAG', 'Conversational Agents', 'WhatsApp', 'Real Estate', 'Founding Team'],
    color: 'blue',
    year: '2025-2026',
    status: 'current',
    signal: 'ai-native',
    role: 'founding team',
    coordinate: 'proptech/agents',
    nowNote:
      'AI infrastructure for real-estate agencies, delivered inside WhatsApp — conversational agents + RAG. Building the frontend, the agent stack, and the DX that keeps a small team fast.',
    nowStatus: 'alpha',
  },
  {
    title: 'CEIA — AI Research Fellow',
    description:
      'AI Research Fellow at the Centro de Excelência em Inteligência Artificial (CEIA / UFG) — applied research at the frontier of LLMs and intelligent systems, bridging academic rigor and shipped products.',
    tags: ['Applied Research', 'LLMs', 'Intelligent Systems', 'CEIA', 'UFG'],
    color: 'green',
    year: '2026',
    status: 'current',
    signal: 'research',
    role: 'research fellow',
    coordinate: 'frontier/llm',
    nowNote:
      'Applied AI research at CEIA (UFG) — frontier LLM work bridging academic rigor and shipped products.',
    nowStatus: 'in-progress',
  },
  {
    title: 'Synk',
    description:
      'A real code editor for the iPad with on-device AI. Native SwiftUI + Runestone with TreeSitter syntax, cloud AI (Anthropic) plus an opt-in local model via MLC-LLM, and three modes: AI-assisted editing, a browser-based playground, and a remote workspace. The iPad becomes a first-class dev machine.',
    tags: ['SwiftUI', 'iOS', 'On-device AI', 'MLC-LLM', 'Runestone', 'Anthropic'],
    color: 'blue',
    year: '2026',
    status: 'current',
    signal: 'edge-ai',
    role: 'solo founder',
    coordinate: 'ipad/native',
    nowNote:
      'A real code editor for the iPad with on-device AI — native SwiftUI, cloud and local models.',
    nowStatus: 'in-progress',
  },
  {
    title: 'Argus',
    description:
      'Privacy-first, camera-agnostic security platform with AI vision. Connects to any ONVIF/RTSP camera or webcam and analyzes frames through Gemini/OpenRouter for motion and event detection — open-source and low-cost, with local SQLite persistence and an optional Tauri desktop build. No rip-and-replace.',
    tags: ['Next.js', 'React', 'AI Vision', 'ONVIF/RTSP', 'SQLite', 'Tauri'],
    color: 'green',
    year: '2026',
    status: 'current',
    signal: 'vision',
    role: 'architect',
    coordinate: 'moklabs/edge',
    nowNote:
      'Privacy-first AI vision for any ONVIF/RTSP camera — open-source, low-cost, no rip-and-replace.',
    nowStatus: 'in-progress',
  },
  {
    title: 'Kindraw',
    description:
      'A warm, playful workspace built on top of Excalidraw — authenticated boards, a folder tree, markdown docs with Mermaid, and real-time collaboration. Coral-forward identity (Fraunces + Bricolage Grotesque) on a Cloudflare-first stack: Workers, D1, R2, GitHub login.',
    tags: ['React', 'Excalidraw', 'Cloudflare Workers', 'D1', 'R2', 'Realtime'],
    color: 'red',
    year: '2026',
    status: 'current',
    signal: 'canvas',
    role: 'solo founder',
    coordinate: 'draw/docs',
    nowNote:
      'A warm, playful workspace on top of Excalidraw — boards, docs, and real-time collaboration.',
    nowStatus: 'in-progress',
  },
  {
    title: 'Remindr.AI',
    description:
      'Privacy-first desktop app for intelligent transcription, diarization, and daily memory. Built for people who think while they talk — local-first capture (Tauri + Rust + Whisper) with a cloud knowledge layer on pgvector.',
    tags: ['Tauri', 'Rust', 'Whisper', 'pgvector', 'AI'],
    color: 'yellow',
    link: 'https://remindr.ai',
    year: '2024-2026',
    status: 'side',
    signal: 'memory',
    role: 'desktop ai',
    coordinate: 'tauri/whisper',
  },
  {
    title: 'Lofiever',
    description:
      'A 24/7 lo-fi streaming app with an AI DJ that curates the playlist and talks back in chat. Next.js 15 + a custom Socket.IO server stream music continuously, with an Expo tvOS client for the living-room build — ambient focus, on tap.',
    tags: ['Next.js', 'Socket.IO', 'AI DJ', 'Audio Streaming', 'Expo tvOS'],
    color: 'red',
    year: '2025-2026',
    status: 'side',
    signal: 'ambient',
    role: 'creative build',
    coordinate: 'audio/focus',
  },
  {
    title: 'Arco Educação Platform',
    description:
      'Joined in 2020 and grew into Principal Engineer of AI over nearly six years. Architected the microfrontend ecosystem with Module Federation and led design-system integration and governance across product surfaces reaching millions of students — then pivoted the same rigor into applied AI.',
    tags: ['React', 'TypeScript', 'Module Federation', 'Micro Frontends', 'Design System'],
    color: 'green',
    year: '2020-2026',
    status: 'past',
    signal: 'scale',
    role: 'principal engineer · ai',
    coordinate: 'millions/students',
  },
  {
    title: 'Essay Correction with AI',
    description:
      'My last delivery at Arco as Principal Engineer of AI: the AI essay-correction platform for the ENEM exam. I led the core pipeline (ingestion, classification, analysis) and owned the computer-vision model that reads handwritten essays — OCR/HTR over a queued, real-time correction system feeding teachers.',
    tags: ['Computer Vision', 'OCR/HTR', 'LLM', 'Python', 'RAG', 'ENEM'],
    color: 'blue',
    year: '2024-2026',
    status: 'past',
    signal: 'vision',
    role: 'principal engineer · ai',
    coordinate: 'essay/vision',
  },
  {
    title: 'Café com Código',
    description:
      'Recurring engineering community ritual for knowledge sharing and technical culture building, originally seeded at Arco.',
    tags: ['Community', 'Tech Talks', 'Engineering Culture'],
    color: 'green',
    year: '2021',
    status: 'side',
    signal: 'culture',
    role: 'community ritual',
    coordinate: 'talks/teams',
  },
]

export const skillCategories = [
  {
    title: 'Frontend Architecture & Platform',
    color: 'blue' as const,
    skills: ['React', 'Next.js', 'TypeScript', 'Module Federation', 'Micro Frontends', 'Design Systems', 'Monorepo', 'Component Libraries', 'Build Optimization', 'Runtime Performance'],
  },
  {
    title: 'Applied AI & Agents',
    color: 'yellow' as const,
    skills: ['LangChain', 'LangGraph', 'RAG Orchestration', 'MCP Servers', 'Vector DBs', 'On-device AI', 'OCR/HTR', 'Langfuse', 'Semantic Search', 'Dataset Engineering'],
  },
  {
    title: 'Developer Experience',
    color: 'green' as const,
    skills: ['CI/CD Pipelines', 'Tooling & Automation', 'RFC/ADR/DCP', 'WikiJS', 'Quality Gates', 'Standardization'],
  },
  {
    title: 'Full-Stack & Native',
    color: 'red' as const,
    skills: ['Node.js', 'Python', 'PHP', 'Rust', 'SwiftUI', 'Tauri', 'GraphQL', 'REST APIs', 'PostgreSQL'],
  },
  {
    title: 'Cloud & Infrastructure',
    color: 'blue' as const,
    skills: ['AWS', 'Azure', 'Cloudflare', 'Docker', 'Coolify', 'Supabase', 'Edge Functions', 'n8n', 'Observability'],
  },
]

export const philosophy = [
  { title: 'Coherence over cleverness', description: 'Systems should be predictable, not impressive.' },
  { title: 'Governance as enabler', description: 'Lightweight structures (RFCs, ADRs) that prevent chaos without bureaucracy.' },
  { title: 'DX as leverage', description: 'Remove friction and teams move faster with higher quality.' },
  { title: 'AI as engineering', description: 'Observability, evaluation, datasets, and metrics; not magic.' },
  { title: 'Documentation as source of truth', description: 'Canonical, versioned, discoverable.' },
  { title: 'Pragmatic depth', description: 'Deep enough to be correct, simple enough to be maintainable.' },
]

export const timeline = [
  { year: '2017', title: 'First lines shipped', description: 'Mobile and web internships (UFPR, Corpo de Bombeiros PR) then agency work — PHP, WordPress, Node.js, React Native for real clients.' },
  { year: '2019', title: 'Engineering Manager', description: 'Led a small team at Mentores Digital: custom client platforms, APIs (Express/Adonis), React & React Native apps, ERP integrations.' },
  { year: '2020', title: 'Joined Arco Educação', description: 'Came in as a Software Engineer at one of Brazil’s largest edtechs — frontend platform work across pedagogical products.' },
  { year: '2021', title: 'Staff Engineer', description: 'Stepped up to Staff: microfrontend architecture with Module Federation, design-system governance, and DX across squads.' },
  { year: '2025', title: 'Principal Engineer of AI', description: 'Consolidated as Principal Engineer of AI at Arco. Last delivery: the AI essay-correction platform for ENEM — led the core pipeline and owned the computer-vision model reading handwritten essays, serving millions of students.' },
  { year: '2026', title: 'Founder & Research Fellow', description: 'Left Arco after nearly six years. Co-founded MokLabs, joined the founding team at Lugui.ai (AI infrastructure for real-estate agencies, inside WhatsApp), and became an AI Research Fellow at CEIA (UFG).' },
]

/**
 * Selected technical writing (Medium: matheuskindrazki.medium.com). Curated —
 * the strongest pieces on LLM engineering and architecture, not the full feed.
 */
export const writing = [
  {
    title: 'Contexto Demais Apodrece: o Ponto Ótimo da Janela nos LLMs',
    blurb: 'Context engineering — calibrating the ideal window to cut noise and hallucination.',
    year: '2025',
    topic: 'LLM Engineering',
    link: 'https://matheuskindrazki.medium.com/contexto-demais-apodrece-o-ponto-otimo-da-janela-nos-llms-ec78b78ea4c2',
  },
  {
    title: 'Criatividade é um Bug: Como a Matemática (e não o Prompt) vai salvar seu SaaS',
    blurb: 'Trading the uncertainty of language for the guarantees of automata to scale AI products.',
    year: '2025',
    topic: 'Applied AI',
    link: 'https://matheuskindrazki.medium.com/criatividade-%C3%A9-um-bug-como-a-matem%C3%A1tica-e-n%C3%A3o-o-prompt-vai-salvar-seu-saas-bbcacc33ff17',
  },
  {
    title: 'Ainda Não Chegamos Lá: O Hype da IA vs. a Realidade Atual',
    blurb: 'Why AI still fails at complex problems, what the benchmarks really show, and how to adopt strategically.',
    year: '2025',
    topic: 'AI Strategy',
    link: 'https://matheuskindrazki.medium.com/ia-hype-vs-realidade-benchmarks-racioc%C3%ADnio-e-ado%C3%A7%C3%A3o-madura-842e6cc4daf8',
  },
  {
    title: 'Como gerenciar rotas compartilhadas em aplicações Microfrontends',
    blurb: 'Essential strategies for a consistent, integrated UX across federated microfrontends.',
    year: '2023',
    topic: 'Architecture',
    link: 'https://blog.arcotech.io/como-gerenciar-rotas-compartilhadas-em-aplica%C3%A7%C3%B5es-microfrontends-1355aeb62a88',
  },
]

export const navLinks = [
  { href: '/projetos', label: 'Projects', color: 'green' as const },
  { href: '/skills', label: 'Skills', color: 'blue' as const },
  { href: '/sobre', label: 'About', color: 'yellow' as const },
  { href: '/contato', label: 'Contact', color: 'red' as const },
]

// ──────────────────────────────────────────────────────────────────────
// /now data. The Building column is DERIVED from `projects` so it cannot
// drift from the atlas: every project marked status 'current' shows up,
// using its `nowNote` (or canonical description) and `nowStatus`.
// ──────────────────────────────────────────────────────────────────────

export interface NowItem {
  name: string
  description: string
}

export interface NowBuildingItem extends NowItem {
  status: NowStatus
}

export const nowBuilding: NowBuildingItem[] = projects
  .filter((project) => project.status === 'current')
  .map((project) => ({
    // 'Jarvis — Personal AI Operating System' → 'Jarvis'
    name: project.title.split(' — ')[0],
    description: project.nowNote ?? project.description,
    status: project.nowStatus ?? 'building',
  }))

export const nowLearning: NowItem[] = [
  {
    name: 'LangGraph',
    description: 'Orchestrating multi-agent workflows with real state machines, not vibes.',
  },
  {
    name: 'Rust fundamentals',
    description: 'Slow & steady; reading the book and building small CLIs on the side.',
  },
  {
    name: 'Venture operations',
    description: 'How small studios stay focused across multiple products without losing their soul.',
  },
]

export const nowReading: NowItem[] = [
  {
    name: 'The Hard Thing About Hard Things',
    description: 'Ben Horowitz. Re-read for the 3rd time — it gets sharper every pass.',
  },
  {
    name: 'High Output Management',
    description: 'Andy Grove. Classic, still sharp, still the operating manual.',
  },
  {
    name: 'Working Backwards',
    description: "Colin Bryar. Amazon's operating system — how PR/FAQ actually works in practice.",
  },
  {
    name: 'The Mom Test',
    description: "Rob Fitzpatrick. Short, brutal, essential when you're talking to early users.",
  },
]

export const nowThinking: string[] = [
  'How small teams ship with disproportionate impact.',
  'Where AI genuinely removes toil vs. where it just performs productivity.',
  'The difference between craftsmanship and craftsmanship-theater.',
  'Why most “platforms” are just products that refuse to admit it.',
]

export const nowNotDoing: { name: string; status: string }[] = [
  { name: 'Consulting side gigs', status: 'archived' },
  { name: 'New social platforms', status: 'archived' },
  { name: 'Conference speaking', status: 'paused since q3 2025' },
]
