export const profile = {
  name: 'Matheus Kindrazki',
  nickname: 'Kindra',
  age: 29,
  title: 'Principal Engineer',
  company: 'Arco Educacao',
  email: 'matheus@kindrazki.dev',
  location: 'Curitiba, PR',
  bio: 'Ahh, meu nome e Matheus, mas pode me chamar de Kindra =)',
  headline: 'Construo plataformas que escalam para milhoes de alunos.',
  description:
    '5 anos arquitetando micro frontends, design systems e developer experience na maior empresa de educacao do Brasil. Agora expandindo para AI aplicada, RAG e produtos proprios.',
  social: {
    github: 'https://github.com/MatheusKindrazki',
    linkedin: 'https://linkedin.com/in/matheuskindrazki',
    instagram: 'https://instagram.com/kindrazki',
    twitter: 'https://x.com/kindraScript',
  },
}

export const projects = [
  {
    title: 'Arco Educacao Platform',
    description: 'Microfrontend ecosystem with Module Federation, enabling independent squad velocity while maintaining system coherence. Iris Design System integration and governance across product surfaces.',
    tags: ['React', 'TypeScript', 'Module Federation', 'Micro Frontends', 'Design System'],
    color: 'green' as const,
  },
  {
    title: 'AI Education Tools',
    description: 'RAG systems over 10k+ document bases, automated essay correction with OCR/HTR pipelines, semantic search infrastructure for educational content.',
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
    title: 'Cafe com Codigo',
    description: 'Recurring engineering community ritual for knowledge sharing and technical culture building at Arco.',
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
  { year: '2017', title: 'Inicio com PHP Back-end', description: 'Primeiros passos como desenvolvedor back-end.' },
  { year: '2018', title: 'Transicao para Front-end', description: 'Descobri a paixao por interfaces e experiencia do usuario.' },
  { year: '2020', title: 'Arco Educacao', description: 'Entrei como desenvolvedor frontend na maior empresa de educacao do Brasil.' },
  { year: '2022', title: 'Tech Lead', description: 'Lideranca tecnica de times, arquitetura de micro frontends.' },
  { year: '2024', title: 'Principal Engineer', description: 'Arquitetura em escala, governanca, DX e iniciativas de AI.' },
  { year: '2025', title: 'AI & Beyond', description: 'Expandindo para AI aplicada, RAG orchestration e produtos proprios.' },
]

export const navLinks = [
  { href: '/projetos', label: 'Projetos', color: 'green' as const },
  { href: '/skills', label: 'Skills', color: 'blue' as const },
  { href: '/sobre', label: 'Sobre', color: 'yellow' as const },
  { href: '/contato', label: 'Contato', color: 'red' as const },
]
