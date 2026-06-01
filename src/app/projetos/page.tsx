"use client";

import { useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
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
import { stagger, fadeUp, swapUp } from "@/lib/motion";
import styles from "./projects.module.css";

const ParticlePhoto = dynamic(
  () => import("@/components/canvas/ParticlePhoto"),
  { ssr: false },
);

const statusCopy: Record<ProjectStatus, string> = {
  current: "shipping",
  past: "deployed",
  side: "signal",
};

/**
 * Distribute N nodes evenly around the orbital atlas using polar coordinates
 * on 2-3 concentric rings, converted to viewBox %. Deterministic (index-based
 * angles only — no randomness) so the constellation scales to any project
 * count without nodes overlapping. The PATH_POINTS polyline is derived from
 * the same generated positions.
 */
function generateNodePositions(
  count: number,
): { x: number; y: number }[] {
  if (count <= 0) return [];

  // Spread across 2 rings up to 8 nodes, 3 rings beyond that.
  const ringCount = count > 8 ? 3 : 2;
  const radii = ringCount === 3 ? [22, 35, 47] : [26, 45];

  // Balance how many nodes land on each ring (outer rings hold more).
  const ringWeights = ringCount === 3 ? [2, 3, 4] : [2, 3];
  const weightTotal = ringWeights.reduce((a, b) => a + b, 0);

  const ringCapacities = ringWeights.map((w) =>
    Math.max(1, Math.round((w / weightTotal) * count)),
  );
  // Reconcile rounding so capacities sum to exactly `count`.
  let assigned = ringCapacities.reduce((a, b) => a + b, 0);
  let r = ringCount - 1;
  while (assigned > count && r >= 0) {
    if (ringCapacities[r] > 1) {
      ringCapacities[r] -= 1;
      assigned -= 1;
    } else {
      r -= 1;
    }
  }
  r = ringCount - 1;
  while (assigned < count) {
    ringCapacities[r] += 1;
    assigned += 1;
    r = r > 0 ? r - 1 : ringCount - 1;
  }

  const positions: { x: number; y: number }[] = [];
  let placed = 0;
  for (let ring = 0; ring < ringCount && placed < count; ring++) {
    const onRing = Math.min(ringCapacities[ring], count - placed);
    const radius = radii[ring];
    // Stagger each ring's starting angle so adjacent rings don't align.
    const offset = (ring * Math.PI) / ringCount;
    for (let i = 0; i < onRing; i++) {
      const angle = offset + (i / onRing) * Math.PI * 2;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      positions.push({
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      });
      placed++;
    }
  }
  return positions;
}

function shortTitle(title: string): string {
  return title
    .replace(" — Personal AI Operating System", "")
    .replace(" Platform", "")
    .replace(" Venture Studio", "");
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
      background={({ exploding, onExplodeComplete }) => (
        <>
          <div
            className={`${styles.photoStage} ${exploding ? styles.photoStageExploding : ""}`}
          >
            <ParticlePhoto
              imageSrc="/images/kindra-projetos.png"
              maxWidth={760}
              xOffset={330}
              particleSize={1.45}
              edgeFade={0.22}
              animate
              explode={exploding}
              onExplodeComplete={onExplodeComplete}
            />
          </div>
          <div aria-hidden className={styles.backdrop} />
        </>
      )}
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

  const nodePositions = useMemo(
    () => generateNodePositions(projects.length),
    [],
  );
  const pathPoints = useMemo(
    () => nodePositions.map(({ x, y }) => `${x},${y}`).join(" "),
    [nodePositions],
  );

  return (
    <ScrollStage>
        <Section bare>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className={styles.heroGrid}
          >
            <motion.div variants={fadeUp} className={styles.copyColumn}>
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
            </motion.div>

            <motion.div variants={fadeUp} className={styles.atlas}>
              <div aria-hidden className={`${styles.orbit} ${styles.orbitOuter}`} />
              <div aria-hidden className={`${styles.orbit} ${styles.orbitMiddle}`} />
              <div aria-hidden className={`${styles.orbit} ${styles.orbitInner}`} />

              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className={styles.pathMap}
              >
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke="color-mix(in srgb, var(--project-accent) 20%, transparent)"
                  strokeWidth="0.42"
                  strokeDasharray="2 2.6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className={styles.atlasCore} aria-hidden="true">
                <span>selected</span>
                <strong>{String(activeIndex + 1).padStart(2, "0")}</strong>
                <small>{activeProject.signal}</small>
              </div>

              {projects.map((project, index) => (
                <ProjectNode
                  key={project.title}
                  title={shortTitle(project.title)}
                  color={project.color}
                  index={index}
                  isActive={index === activeIndex}
                  signal={project.signal}
                  status={project.status}
                  position={nodePositions[index]}
                  onSelect={() => onSelect(index)}
                />
              ))}
            </motion.div>
          </motion.div>
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
  const { title, description, tags, color, link, year, role } = project;
  const accent = getColorValue(color);
  const tagStyle = (alpha: number) =>
    ({
      "--tag-color": accent,
      "--tag-bg": getColorWithAlpha(color, alpha),
      "--tag-border": getColorWithAlpha(color, 0.28),
    }) as CSSProperties;

  return (
    <div className={styles.dossier}>
      <div className={styles.dossierMeta}>
        <span style={{ color: accent }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span>{year}</span>
        <span>/</span>
        <span>{role}</span>
      </div>

      <motion.div
        key={title}
        initial={swapUp.initial}
        animate={swapUp.animate}
        transition={swapUp.transition}
      >
        <h2 className={styles.dossierTitle}>{title}</h2>
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
      onClick={onSelect}
      onMouseEnter={onSelect}
      className={styles.node}
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
      <span className={styles.nodeLabel}>{title}</span>
      <span className={styles.nodeMeta}>
        / {signal} · {status}
      </span>
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
