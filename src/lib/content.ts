import type { ThemeColor } from '@/lib/colors'

export const profile = {
  name: 'Matheus Kindrazki',
  nickname: 'Kindra',
  age: 29,
  title: 'Co-founder & Builder',
  company: 'MokLabs Venture Studio',
  secondaryRole: 'Founding team at Lugui.ai',
  email: 'matheus@kindrazki.dev',
  location: 'Curitiba, Brazil',
  bio: 'Hey — my name is Matheus, but you can call me Kindra =)',
  headline: 'Building ventures where bold ideas meet careful engineering.',
  description:
    'Co-founder at MokLabs Venture Studio and part of the founding team at Lugui.ai. 8+ years architecting platforms used by millions of students — now turning that experience into products of my own. Technology adventurer, pragmatic builder.',
  calLink: 'https://cal.com/matheuskindrazki',
  social: {
    github: 'https://github.com/MatheusKindrazki',
    linkedin: 'https://linkedin.com/in/matheuskindrazki',
    instagram: 'https://instagram.com/kindrazki',
    twitter: 'https://x.com/kindraScript',
  },
}

/**
 * Site-wide rot-prone strings, kept in ONE place so the version/date stamp in
 * the chrome, the home footer, and the /now page never disagree.
 */
export const site = {
  version: 'v3.0',
  year: '2026',
  lastUpdated: 'apr 2026',
  lastUpdatedIso: '2026-04-17',
  nextRefresh: 'may 2026',
}

export type ProjectStatus = 'current' | 'past' | 'side'

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
}

export const projects: Project[] = [
  {
    title: 'Jarvis — Personal AI Operating System',
    description:
      'My personal knowledge graph + AI agent. Connects memory, entities, tasks, and decisions across every project I touch. A living second brain built on MCP servers, vector search, and a growing taxonomy of what I know. This very page has a live Jarvis instance — ask it anything about me.',
    tags: ['MCP', 'RAG', 'Vector DB', 'Personal AI', 'Knowledge Graph', 'Claude'],
    color: 'yellow',
    year: '2024-2026',
    status: 'current',
    signal: 'memory',
    role: 'personal ai os',
    coordinate: 'rag/mcp',
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
  },
  {
    title: 'Lugui.ai',
    description:
      'Founding team member building an AI-native product from day zero. Architecting the frontend, RAG pipelines, and the developer experience that lets a small team ship like a large one.',
    tags: ['AI', 'RAG', 'Next.js', 'LangChain', 'Founding Team'],
    color: 'blue',
    year: '2025-2026',
    status: 'current',
    signal: 'ai-native',
    role: 'founding team',
    coordinate: 'product/rag',
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
      'Architected the microfrontend ecosystem at Arco Educação with Module Federation, enabling independent squad velocity while maintaining system coherence. Led design-system integration and governance across product surfaces reaching millions of students.',
    tags: ['React', 'TypeScript', 'Module Federation', 'Micro Frontends', 'Design System'],
    color: 'green',
    year: '2020-2024',
    status: 'past',
    signal: 'scale',
    role: 'principal engineer',
    coordinate: 'millions/students',
  },
  {
    title: 'AI Education Tools',
    description:
      'RAG systems over 10k+ document bases, automated essay correction with OCR/HTR pipelines, and semantic search infrastructure for educational content.',
    tags: ['LangChain', 'RAG', 'OCR', 'Python', 'Vector DB'],
    color: 'blue',
    year: '2023-2024',
    status: 'past',
    signal: 'retrieval',
    role: 'architecture',
    coordinate: '10k+ docs',
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
  { year: '2017', title: 'Started as a Backend Developer', description: 'First steps as a backend developer with PHP.' },
  { year: '2018', title: 'Transitioned to Frontend', description: 'Discovered a passion for interfaces and user experience.' },
  { year: '2020', title: 'Joined Arco Educação', description: 'Came in as a frontend engineer at the largest education company in Brazil.' },
  { year: '2022', title: 'Tech Lead', description: 'Technical leadership of teams, microfrontend architecture.' },
  { year: '2024', title: 'Principal Engineer', description: 'Architecture at scale, governance, DX, and AI initiatives.' },
  { year: '2025', title: 'Founder Era', description: 'Co-founded MokLabs Venture Studio. Joined the founding team at Lugui.ai. Adventuring at the edges of technology.' },
]

export const navLinks = [
  { href: '/projetos', label: 'Projects', color: 'green' as const },
  { href: '/skills', label: 'Skills', color: 'blue' as const },
  { href: '/sobre', label: 'About', color: 'yellow' as const },
  { href: '/contato', label: 'Contact', color: 'red' as const },
]
