"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import Mark from "@/components/ui/Mark";
import PageNav from "@/components/ui/PageNav";
import Eyebrow from "@/components/ui/Eyebrow";
import PageShell, { useShellNav } from "@/components/layout/PageShell";
import ScrollStage from "@/components/layout/ScrollStage";
import Section from "@/components/layout/Section";
import { projects, type Project, type ProjectStatus } from "@/lib/content";
import { getColorValue, getColorWithAlpha } from "@/lib/colors";
import { stagger, fadeUp, swapUp, enterAt } from "@/lib/motion";
import styles from "./projects.module.css";

const statusCopy: Record<ProjectStatus, string> = {
  current: "shipping",
  past: "deployed",
  side: "signal",
};

/**
 * Semantic atlas placement — the geometry encodes the data instead of the
 * array order:
 *
 *   radius = distance from "now"   status 'current' sits on the inner ring
 *            near the core, 'side' on a mid eccentric (slightly inclined)
 *            ring, 'past' on the outer ring decaying with years since the
 *            work ended.
 *   angle  = time                  each ring maps its start-year span across
 *            a fixed arc, so same-era projects cluster chronologically.
 *
 * Fully deterministic (data-driven only — no randomness). A min-separation
 * post-pass pushes same-year nodes apart, then compresses the chain back
 * into the arc so labels never collide regardless of project count.
 */

interface YearRange {
  start: number;
  end: number;
}

function parseYearRange(year: string): YearRange {
  const matches = year.match(/\d{4}/g);
  if (!matches || matches.length === 0) return { start: 0, end: 0 };
  return {
    start: parseInt(matches[0], 10),
    end: parseInt(matches[matches.length - 1], 10),
  };
}

/** Per-ring arc in degrees — 0° points right, sweeping clockwise on screen. */
const RING_ARCS: Record<ProjectStatus, { start: number; span: number }> = {
  current: { start: -90, span: 300 },
  // Widened from 120° → 210°: the side ring now carries 6 bodies (several from
  // the same 2026 cohort), so it needs a longer arc to keep labels apart.
  side: { start: -28, span: 210 },
  past: { start: 130, span: 175 },
};

/** Minimum angular gap between neighbors on the same ring (degrees). */
const MIN_ANGLE_SEPARATION = 56;

function computeAtlasPlacements(list: Project[]): { x: number; y: number }[] {
  const placements: { x: number; y: number }[] = new Array(list.length);
  // "Now" is anchored to the data, not the wall clock.
  const epochNow = Math.max(...list.map((p) => parseYearRange(p.year).end));

  (Object.keys(RING_ARCS) as ProjectStatus[]).forEach((status) => {
    const members = list
      .map((project, index) => ({ index, year: parseYearRange(project.year) }))
      .filter(({ index }) => list[index].status === status)
      .sort((a, b) => a.year.start - b.year.start || a.index - b.index);
    if (members.length === 0) return;

    const arc = RING_ARCS[status];
    const minYear = members[0].year.start;
    const maxYear = members[members.length - 1].year.start;
    const yearSpan = Math.max(1, maxYear - minYear);

    // Angle from year: map each start year across the ring's arc.
    const angles = members.map(
      ({ year }) => arc.start + ((year.start - minYear) / yearSpan) * arc.span,
    );

    // Same-year cohorts land on the same angle — push collisions forward…
    const minSep = Math.min(
      MIN_ANGLE_SEPARATION,
      arc.span / Math.max(1, members.length - 1),
    );
    for (let i = 1; i < angles.length; i++) {
      angles[i] = Math.max(angles[i], angles[i - 1] + minSep);
    }
    // …then compress proportionally so the chain still fits the arc.
    const overflow = angles[angles.length - 1] - (arc.start + arc.span);
    if (overflow > 0) {
      const scale = arc.span / (arc.span + overflow);
      for (let i = 0; i < angles.length; i++) {
        angles[i] = arc.start + (angles[i] - arc.start) * scale;
      }
    }

    let yearRun = 0;
    members.forEach((member, i) => {
      // Alternate shells within a same-year cohort so labels breathe.
      yearRun =
        i > 0 && members[i - 1].year.start === member.year.start
          ? yearRun + 1
          : 0;
      const theta = (angles[i] * Math.PI) / 180;
      let x: number;
      let y: number;

      if (status === "current") {
        // Inner ring: the longer a venture has been live, the deeper it
        // has spiralled toward the core. Same-year bodies alternate shells
        // more aggressively (±5) so a 2024 pair like Jarvis/MokLabs doesn't
        // sit on one radius with colliding labels.
        const radius = Math.min(
          30,
          22 + (member.year.start - minYear) * 2 + (yearRun % 2) * 5,
        );
        x = 50 + radius * Math.cos(theta);
        y = 50 + radius * Math.sin(theta);
      } else if (status === "side") {
        // Mid ring: eccentric, slightly inclined ellipse — side signals
        // ride a tilted orbit instead of a perfect circle. Same-year bodies
        // alternate between two shells (like the inner ring) so the 2026
        // cohort never stacks on one radius.
        const inclination = (-8 * Math.PI) / 180;
        const shell = (yearRun % 2) * 6;
        const px = (39 + shell) * Math.cos(theta);
        const py = (34 + shell) * Math.sin(theta);
        x = 50 + px * Math.cos(inclination) - py * Math.sin(inclination);
        y = 50 + px * Math.sin(inclination) + py * Math.cos(inclination);
      } else {
        // Outer ring: deployed work decays outward with years since it ended.
        const radius = Math.min(50, 46 + (epochNow - member.year.end));
        x = 50 + radius * Math.cos(theta);
        y = 50 + radius * Math.sin(theta);
      }

      placements[member.index] = {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      };
    });
  });

  return placements;
}

// Note: the old connecting polyline was retired on purpose. Redrawn in
// chronological order it zigzagged across the core and fought the ring
// semantics — the orbits themselves are the worldline now.
const nodePlacements = computeAtlasPlacements(projects);

function shortTitle(title: string): string {
  return title
    .replace(" — Personal AI Operating System", "")
    .replace(" — AI Research Fellow", "")
    .replace(" Platform", "")
    .replace(" Venture Studio", "")
    // 15 chars wraps badly in the atlas node ("SCREENSHO/TOX") and crowds
    // its neighbor — show the short mark on the node; the dossier keeps the
    // full name.
    .replace("ScreenshotDetox", "Detox");
}

function truncateDescription(description: string): string {
  if (description.length <= 170) return description;
  return `${description.slice(0, 167).trim()}...`;
}

export default function ProjetosPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeProject = projects[activeIndex];
  const activeAccent = getColorValue(activeProject.color);

  const shellStyle = {
    "--project-accent": activeAccent,
  } as CSSProperties;

  return (
    <PageShell
      hudRole="online · shipping"
      stripText="◈ MK · project atlas · idx.02"
      className={styles.projectShell}
      style={shellStyle}
      persistentBackground
      background={() => <div aria-hidden className={styles.backdrop} />}
    >
      <ProjetosContent
        activeIndex={activeIndex}
        activeProject={activeProject}
        onSelect={setActiveIndex}
      />
    </PageShell>
  );
}

interface ProjetosContentProps {
  activeIndex: number;
  activeProject: Project;
  onSelect: (index: number) => void;
}

function ProjetosContent({
  activeIndex,
  activeProject,
  onSelect,
}: ProjetosContentProps) {
  const { onNavClick } = useShellNav();
  const activeAccent = getColorValue(activeProject.color);

  return (
    <ScrollStage>
        <Section bare>
          {/* Hero enters via the CSS `.enter-rise` idiom (globals.css), not
              framer `initial="hidden"` — the SSR HTML must paint the h1
              before the pixi-heavy bundle hydrates (deep-link LCP). */}
          <div className={styles.heroGrid}>
            <div className={`${styles.copyColumn} enter-rise`} style={enterAt(0)}>
              <Eyebrow index="02" label="project atlas" accent={activeAccent} />

              <h1 className={styles.title}>
                <span className={styles.titleLine}>
                  <Mark color="green">Projects</Mark>
                  <span className={styles.titleNote}>proof of work</span>
                </span>
              </h1>

              <p className={styles.deck}>
                Ventures, AI systems, education platforms, and small sharp
                tools arranged as a living build map.
              </p>

              <div className={styles.navWrap}>
                <PageNav current="/projetos" onClick={onNavClick} />
              </div>

              <ProjectDossier project={activeProject} index={activeIndex} />

              <div className={styles.mobileRail} aria-label="Project selector">
                {projects.map((project, index) => (
                  <ProjectRailButton
                    key={project.title}
                    title={shortTitle(project.title)}
                    color={project.color}
                    index={index}
                    isActive={index === activeIndex}
                    signal={project.signal}
                    onSelect={() => onSelect(index)}
                  />
                ))}
              </div>
            </div>

            <div className={`${styles.atlas} enter-rise`} style={enterAt(1)}>
              <div aria-hidden className={`${styles.orbit} ${styles.orbitOuter}`} />
              <div aria-hidden className={`${styles.orbit} ${styles.orbitMiddle}`} />
              <div aria-hidden className={`${styles.orbit} ${styles.orbitInner}`} />

              <div className={styles.atlasCore} aria-hidden="true">
                <span>selected</span>
                <strong>{String(activeIndex + 1).padStart(2, "0")}</strong>
                <small>{activeProject.signal}</small>
              </div>

              <span aria-hidden="true" className={styles.atlasLegend}>
                órbitas = distância do agora
              </span>

              {projects.map((project, index) => (
                <ProjectNode
                  key={project.title}
                  title={shortTitle(project.title)}
                  color={project.color}
                  index={index}
                  isActive={index === activeIndex}
                  signal={project.signal}
                  status={project.status}
                  position={nodePlacements[index]}
                  onSelect={() => onSelect(index)}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section bare>
          <div className={styles.ledgerInner}>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp} className={styles.ledgerHeader}>
                <Eyebrow label="build ledger" accent={activeAccent} />
                <h2 className={styles.ledgerTitle}>
                  Not a gallery. A map of systems that shipped.
                </h2>
              </motion.div>

              <div className={styles.ledgerList}>
                {projects.map((project, index) => (
                  <ProjectLedgerRow
                    key={project.title}
                    project={project}
                    index={index}
                    isActive={index === activeIndex}
                    onSelect={() => onSelect(index)}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </Section>
    </ScrollStage>
  );
}

interface ProjectDossierProps {
  project: Project;
  index: number;
}

function ProjectDossier({ project, index }: ProjectDossierProps) {
  const { title, description, tags, color, link, year, role, status, signal, coordinate } =
    project;
  const accent = getColorValue(color);
  const tagStyle = (alpha: number) =>
    ({
      "--tag-color": accent,
      "--tag-bg": getColorWithAlpha(color, alpha),
      "--tag-border": getColorWithAlpha(color, 0.28),
    }) as CSSProperties;

  const ephemeris: [label: string, value: string][] = [
    ["epoch", year],
    ["status", statusCopy[status]],
    ["signal", signal],
    ["coord", coordinate],
    ["role", role],
  ];

  return (
    <div className={styles.dossier}>
      <div className={styles.dossierMeta}>
        <span style={{ color: accent }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span>ephemeris</span>
      </div>

      <motion.div
        key={title}
        initial={swapUp.initial}
        animate={swapUp.animate}
        transition={swapUp.transition}
      >
        <h2 className={styles.dossierTitle}>{title}</h2>

        <dl className={styles.ephemeris}>
          {ephemeris.map(([label, value]) => (
            <div key={label} className={styles.ephemerisItem}>
              <dt>{label}</dt>
              <dd className={label === "status" ? styles.ephemerisStatus : undefined}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className={styles.dossierDescription}>{description}</p>

        <div className={styles.tags}>
          {tags.slice(0, 6).map((tag) => (
            <span key={tag} className={styles.tag} style={tagStyle(0.1)}>
              {tag}
            </span>
          ))}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.projectLink}
            style={{ color: accent }}
          >
            <span>open project</span>
            <FiArrowUpRight />
          </a>
        )}
      </motion.div>
    </div>
  );
}

interface ProjectRailButtonProps {
  title: string;
  color: Project["color"];
  index: number;
  isActive: boolean;
  signal: string;
  onSelect: () => void;
}

function ProjectRailButton({
  title,
  color,
  index,
  isActive,
  signal,
  onSelect,
}: ProjectRailButtonProps) {
  const accent = getColorValue(color);
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
      className={styles.railButton}
      style={
        {
          "--node-accent": accent,
          "--node-bg": getColorWithAlpha(color, isActive ? 0.2 : 0.08),
        } as CSSProperties
      }
    >
      <span>{String(index + 1).padStart(2, "0")}</span>
      <strong>{title}</strong>
      <small>{signal}</small>
    </button>
  );
}

interface ProjectNodeProps {
  title: string;
  color: Project["color"];
  index: number;
  isActive: boolean;
  signal: string;
  status: ProjectStatus;
  position: { x: number; y: number };
  onSelect: () => void;
}

const nodeStatusClass: Record<ProjectStatus, string> = {
  current: styles.nodeCurrent,
  side: styles.nodeSide,
  past: styles.nodePast,
};

function ProjectNode({
  title,
  color,
  index,
  isActive,
  signal,
  status,
  position,
  onSelect,
}: ProjectNodeProps) {
  const accent = getColorValue(color);
  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={title}
      onClick={onSelect}
      onMouseEnter={onSelect}
      className={`${styles.node} ${nodeStatusClass[status]}`}
      style={
        {
          "--node-x": `${position.x}%`,
          "--node-y": `${position.y}%`,
          "--node-accent": accent,
          "--node-bg": getColorWithAlpha(color, isActive ? 0.22 : 0.08),
          "--node-border": getColorWithAlpha(color, isActive ? 0.8 : 0.34),
        } as CSSProperties
      }
    >
      <span className={styles.nodeIndex}>
        {String(index + 1).padStart(2, "0")}
      </span>
      {/* Default state: index + short signal only, so 15 nodes stay clean and
          can spread out. The full name reveals on hover/focus (desktop) and
          while selected (the tap state, so touch users still get it). It is
          absolutely positioned so revealing it never reflows neighbors. */}
      <span className={styles.nodeName} aria-hidden="true">
        {title}
      </span>
      <span className={styles.nodeMeta}>/ {signal}</span>
    </button>
  );
}

interface ProjectLedgerRowProps {
  project: Project;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}

function ProjectLedgerRow({
  project,
  index,
  isActive,
  onSelect,
}: ProjectLedgerRowProps) {
  const { title, description, tags, color, year, status } = project;
  const accent = getColorValue(color);
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      aria-pressed={isActive}
      onClick={onSelect}
      className={styles.ledgerRow}
    >
      <div className={styles.ledgerIndex} style={{ color: accent }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className={styles.ledgerMeta}>
        <div>{year}</div>
        <div style={{ color: getColorWithAlpha(color, 0.82) }}>
          / {statusCopy[status]}
        </div>
      </div>
      <div className={styles.ledgerCopy}>
        <h3>{title}</h3>
        <p>{truncateDescription(description)}</p>
      </div>
      <div className={styles.ledgerTags}>
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className={styles.tag}
            style={
              {
                "--tag-color": accent,
                "--tag-bg": getColorWithAlpha(color, 0.08),
                "--tag-border": getColorWithAlpha(color, 0.24),
              } as CSSProperties
            }
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.button>
  );
}
