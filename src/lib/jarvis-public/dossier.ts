/**
 * PUBLIC DOSSIER — the only knowledge the public edition of Jarvis has.
 *
 * Safety comes from construction, not from filtering: the model behind the
 * site chat receives this text and nothing else. It has no tools, no memory
 * and no network path to the private Jarvis backend, so it cannot leak what
 * it was never given.
 *
 * The dossier is DERIVED from the same data the pages render
 * (src/lib/content.ts), so it cannot drift from the site and cannot contain
 * anything the site does not already publish. This repository is public:
 * whatever lands in this text is public the moment it is pushed.
 *
 * Keep this module free of runtime imports — it is unit-tested in isolation
 * and must stay a pure function of its input.
 */

export interface DossierProject {
  id: string
  title: string
  description: string
  tags: string[]
  year: string
  status: 'current' | 'past' | 'side'
  role: string
  link?: string
  nowNote?: string
  nowStatus?: string
  caseNote?: {
    problem: string
    approach: string
    evidence: string
    references?: { label: string; url: string }[]
  }
}

export interface InterviewNote {
  question: string
  answer: string
}

export interface DossierContent {
  profile: {
    name: string
    nickname: string
    title: string
    location: string
    headline: string
    description: string
    email: string
    calLink: string
    social: Record<string, string>
  }
  roleSignals: { role: string; organization: string; note: string }[]
  projects: DossierProject[]
  skillCategories: { title: string; focus: string; skills: string[] }[]
  philosophy: { title: string; description: string }[]
  timeline: { year: string; title: string; description: string }[]
  writing: { title: string; blurb: string; year: string; topic: string; link: string }[]
  nowLearning: { name: string; description: string }[]
  nowReading: { name: string; description: string }[]
  nowThinking: string[]
  nowNotDoing: { name: string; status: string }[]
  site: { lastUpdated: string }
  /** Answers Matheus wrote or approved himself. Empty until he adds them. */
  interviewNotes: InterviewNote[]
}

export const SITE_URL = 'https://matheuskindrazki.dev'

const STATUS_LABEL: Record<DossierProject['status'], string> = {
  current: 'current work',
  past: 'past work',
  side: 'side project',
}

function section(title: string, lines: string[]): string {
  return [`## ${title}`, ...lines].join('\n')
}

function projectBlock(project: DossierProject): string {
  const lines = [
    `### ${project.title}`,
    `- Kind: ${STATUS_LABEL[project.status]} · Years: ${project.year} · Role: ${project.role}`,
    `- What it is: ${project.description}`,
    `- Tags: ${project.tags.join(', ')}`,
  ]
  // Mirrors what the Now page shows for current work: the short note and the
  // stage chip (which defaults to "building" there). The stage is his own
  // note, never a deployment check.
  if (project.status === 'current') {
    if (project.nowNote) lines.push(`- Now page note: ${project.nowNote}`)
    lines.push(
      `- Stage on the Now page: ${project.nowStatus ?? 'building'} (his own note, not a deployment check)`,
    )
  }
  if (project.link) lines.push(`- Public link: ${project.link}`)
  lines.push(`- Page on this site: ${SITE_URL}/projetos/?project=${project.id}`)
  if (project.caseNote) {
    lines.push(`- Case note, problem: ${project.caseNote.problem}`)
    lines.push(`- Case note, approach: ${project.caseNote.approach}`)
    lines.push(`- Case note, what is public evidence: ${project.caseNote.evidence}`)
    for (const reference of project.caseNote.references ?? []) {
      lines.push(`- Reference: ${reference.label} — ${reference.url}`)
    }
  }
  return lines.join('\n')
}

/**
 * Renders the dossier as plain text. Deterministic for a given input (no
 * clock, no randomness), which also keeps the prompt cache prefix stable.
 */
export function buildDossier(content: DossierContent): string {
  const { profile } = content
  const current = content.projects.filter((project) => project.status === 'current')
  const others = content.projects.filter((project) => project.status !== 'current')

  const sections: string[] = [
    section('Who Matheus is', [
      `- Name: ${profile.name}. Goes by "${profile.nickname}".`,
      `- Current title: ${profile.title}.`,
      `- Based in: ${profile.location} (city level only).`,
      `- In his words: ${profile.headline}`,
      `- Summary: ${profile.description}`,
    ]),

    section(
      'Current roles',
      content.roleSignals.map((signal) => `- ${signal.role}, ${signal.organization}: ${signal.note}`),
    ),

    section('Career timeline', [
      ...content.timeline.map((item) => `- ${item.year} — ${item.title}: ${item.description}`),
      '- This timeline lists work experience only. Where he studied, his degrees and his grades are not published here.',
    ]),

    section('How he works: stated principles', [
      ...content.philosophy.map((item) => `- ${item.title}: ${item.description}`),
    ]),

    section('What he is thinking about lately', [
      ...content.nowThinking.map((line) => `- ${line}`),
    ]),

    section('What he is learning', [
      ...content.nowLearning.map((item) => `- ${item.name}: ${item.description}`),
    ]),

    section('What he is reading', [
      ...content.nowReading.map((item) => `- ${item.name}: ${item.description}`),
    ]),

    section('What he is deliberately not doing', [
      ...content.nowNotDoing.map((item) => `- ${item.name} (${item.status})`),
    ]),

    section('Skills, grouped by what they are for', [
      ...content.skillCategories.map(
        (category) => `- ${category.title} — ${category.focus} Tools and topics: ${category.skills.join(', ')}.`,
      ),
      '- These lists describe areas of practice. They are not proficiency scores.',
    ]),

    section('Current work', current.map(projectBlock)),

    section('Past work and side projects', others.map(projectBlock)),

    section('Published writing', [
      ...content.writing.map(
        (piece) => `- "${piece.title}" (${piece.year}, ${piece.topic}): ${piece.blurb} Link: ${piece.link}`,
      ),
      '- The articles are written in Portuguese. Only the titles, topics and one-line summaries above are known here; the full text is at the links.',
    ]),
  ]

  if (content.interviewNotes.length > 0) {
    sections.push(
      section(
        'Interview notes — answers Matheus approved, in the first person (in Portuguese)',
        content.interviewNotes.map((note) => `- Q: ${note.question}\n  A: ${note.answer}`),
      ),
    )
  }

  sections.push(
    section('How to reach him', [
      `- Contact page: ${SITE_URL}/contato/`,
      `- Email: ${profile.email}`,
      `- Book a call: ${profile.calLink}`,
      ...Object.entries(profile.social).map(([network, url]) => `- ${network}: ${url}`),
    ]),

    section('About this site', [
      `- Pages: home (${SITE_URL}/), projects (${SITE_URL}/projetos/), skills (${SITE_URL}/skills/), about (${SITE_URL}/sobre/), now (${SITE_URL}/now/), contact (${SITE_URL}/contato/).`,
      `- The site content was last updated in ${content.site.lastUpdated}. Project stages on the Now page are his notes, not live deployment checks.`,
    ]),
  )

  return sections.join('\n\n')
}

/** Email addresses the dossier legitimately contains — used to screen model output. */
export function dossierEmails(content: DossierContent): string[] {
  return [content.profile.email.toLowerCase()]
}
