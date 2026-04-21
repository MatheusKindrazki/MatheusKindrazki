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
  social: {
    github: 'https://github.com/MatheusKindrazki',
    linkedin: 'https://linkedin.com/in/matheuskindrazki',
    instagram: 'https://instagram.com/kindrazki',
    twitter: 'https://x.com/kindraScript',
  },
}

export const projects = [
  {
    title: 'Jarvis — Personal AI Operating System',
    description: 'My personal knowledge graph + AI agent. Connects memory, entities, tasks, and decisions across every project I touch. A living second brain built on MCP servers, vector search, and a growing taxonomy of what I know. This very page has a live Jarvis instance — ask it anything about me.',
    tags: ['MCP', 'RAG', 'Vector DB', 'Personal AI', 'Knowledge Graph', 'Claude'],
    color: 'yellow' as const,
  },
  {
    title: 'MokLabs Venture Studio',
    description: 'Co-founded venture studio focused on turning sharp ideas into shipped products. Platform engineering, design systems, and AI infrastructure at the core — building the scaffolding every new venture reuses.',
    tags: ['Venture Studio', 'Platform', 'Design Systems', 'Founder'],
    color: 'yellow' as const,
  },
  {
    title: 'Lugui.ai',
    description: 'Founding team member building an AI-native product from day zero. Architecting the frontend, RAG pipelines, and the developer experience that lets a small team ship like a large one.',
    tags: ['AI', 'RAG', 'Next.js', 'LangChain', 'Founding Team'],
    color: 'blue' as const,
  },
  {
    title: 'Arco Educação Platform',
    description: 'Architected the microfrontend ecosystem at Arco Educação with Module Federation, enabling independent squad velocity while maintaining system coherence. Led Iris Design System integration and governance across product surfaces reaching millions of students.',
    tags: ['React', 'TypeScript', 'Module Federation', 'Micro Frontends', 'Design System'],
    color: 'green' as const,
  },
  {
    title: 'AI Education Tools',
    description: 'RAG systems over 10k+ document bases, automated essay correction with OCR/HTR pipelines, and semantic search infrastructure for educational content.',
    tags: ['LangChain', 'RAG', 'OCR', 'Python', 'Vector DB'],
    color: 'blue' as const,
  },
  {
    title: 'Remindr.AI',
    description: 'Privacy-first desktop app for intelligent transcription, diarization, and daily memory. Built for people who think while they talk.',
    tags: ['Tauri', 'TypeScript', 'Whisper', 'AI'],
    color: 'yellow' as const,
    link: 'https://remindr.ai',
  },
  {
    title: 'Lofiever',
    description: 'Ambient productivity environment combining lo-fi aesthetics with focused work sessions.',
    tags: ['React', 'Audio API', 'Creative Coding'],
    color: 'red' as const,
  },
  {
    title: 'Café com Código',
    description: 'Recurring engineering community ritual for knowledge sharing and technical culture building, originally seeded at Arco.',
    tags: ['Community', 'Tech Talks', 'Engineering Culture'],
    color: 'green' as const,
  },
]

export const skillCategories = [
  {
    title: 'Frontend Architecture & Platform',
    color: 'blue' as const,
    skills: ['React', 'Next.js', 'TypeScript', 'Module Federation', 'Micro Frontends', 'Design Systems', 'Monorepo', 'Component Libraries', 'Build Optimization', 'Runtime Performance'],
  },
  {
    title: 'Developer Experience',
    color: 'green' as const,
    skills: ['CI/CD Pipelines', 'Tooling & Automation', 'RFC/ADR/DCP', 'WikiJS', 'Quality Gates', 'Standardization'],
  },
  {
    title: 'Applied AI & Data',
    color: 'yellow' as const,
    skills: ['LangChain', 'LangGraph', 'RAG Orchestration', 'Vector DBs', 'OCR/HTR', 'Langfuse', 'Semantic Search', 'Dataset Engineering'],
  },
  {
    title: 'Full-Stack Engineering',
    color: 'red' as const,
    skills: ['Node.js', 'Python', 'PHP', 'GraphQL', 'REST APIs', 'PostgreSQL', 'Angular'],
  },
  {
    title: 'Cloud & Infrastructure',
    color: 'blue' as const,
    skills: ['AWS', 'Azure', 'Docker', 'Coolify', 'Supabase', 'Edge Functions', 'n8n', 'Observability'],
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
