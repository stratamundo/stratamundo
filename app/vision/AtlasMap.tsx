'use client'

/**
 * AtlasMap — interactive constellation map of K-2 + 3.OA.A.1 standards.
 *
 * Each cluster is a constellation with a labelled brass nameplate; each
 * leaf standard is a glowing star. Click a star → opens a brass detail
 * panel describing the standard, the planned probe mechanic, and the
 * "what we'll learn" frame.
 */

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import type { Constellation, Star } from '../../lib/k2-atlas'

/** Standards with a clickable probe demo (Phase C). */
const PROBE_DEMOS: Record<string, string> = {
  'K.CC.A.1': '/vision/probe/k-cc-a-1',
}

type Props = {
  constellations: Constellation[]
}

/* Pitch palette — terracotta accent on cream paper. */
const PITCH = {
  bg: '#FBF8F0',
  bgDeep: '#F5F1E8',
  ink: '#1A1A1A',
  inkSoft: '#3D3A35',
  inkFaint: '#8A8580',
  accent: '#A14A2F',
  rule: 'rgba(26, 26, 26, 0.10)',
}

/* Grade encoded by accent opacity — keeps the page chromatically calm. */
const GRADE_ALPHA: Record<string, number> = {
  K: 1.0,
  '1': 0.75,
  '2': 0.5,
  '3': 0.3,
}

function tintForGrade(grade: string): string {
  const a = GRADE_ALPHA[grade] ?? 0.6
  // hex #A14A2F at alpha
  return `rgba(161, 74, 47, ${a})`
}

export default function AtlasMap({ constellations }: Props) {
  const [selected, setSelected] = useState<{ star: Star; cluster: Constellation } | null>(null)

  // Lay out constellations in a 4-column grid.
  const cols = 4
  const cellW = 340
  const cellH = 340
  const pad = 32
  const totalRows = Math.ceil(constellations.length / cols)
  const width = cols * cellW + (cols + 1) * pad
  const height = totalRows * cellH + (totalRows + 1) * pad

  const placed = useMemo(() => {
    return constellations.map((c, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = pad + col * (cellW + pad) + cellW / 2
      const cy = pad + row * (cellH + pad) + cellH / 2
      return { c, cx, cy }
    })
  }, [constellations])

  // Close on escape
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          style={{ minWidth: 800, maxWidth: '100%' }}
          role="img"
          aria-label="Star atlas of K-2 math standards"
        >
          {/* Cream paper background, very subtle dot grid */}
          <rect width={width} height={height} fill={PITCH.bg} />

          {/* Faint dot pattern — paper texture, not stars */}
          {Array.from({ length: 90 }).map((_, i) => {
            const x = ((i * 73) % 1000) / 1000 * width
            const y = ((i * 137) % 1000) / 1000 * height
            const r = 0.6
            const o = ((i * 41) % 100) / 100 * 0.12 + 0.04
            return (
              <circle key={i} cx={x} cy={y} r={r}
                fill={PITCH.ink} opacity={o} />
            )
          })}

          {/* Each constellation */}
          {placed.map(({ c, cx, cy }) => {
            const r = 110 // constellation radius
            const tint = tintForGrade(c.grade)
            const stars = c.stars.map((s) => ({
              s,
              x: cx + Math.cos(s.angle) * (s.radius * r),
              y: cy + Math.sin(s.angle) * (s.radius * r),
            }))

            return (
              <g key={c.id}>
                {/* Faint orbit ring */}
                <circle cx={cx} cy={cy} r={r} fill="none"
                  stroke={PITCH.ink} strokeOpacity={0.08} strokeWidth={0.6}
                  strokeDasharray="2 4" />

                {/* Constellation lines — connect each star to the next */}
                {stars.map((p, i) => {
                  if (i === 0) return null
                  const prev = stars[i - 1]
                  return (
                    <line key={`l-${p.s.id}`}
                      x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                      stroke={tint} strokeWidth={0.6} opacity={0.5}
                    />
                  )
                })}

                {/* Stars — terracotta dots on cream */}
                {stars.map((p) => (
                  <g key={p.s.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected({ star: p.s, cluster: c })}
                  >
                    <circle cx={p.x} cy={p.y} r={9}
                      fill={tint} opacity={0.16} />
                    <circle cx={p.x} cy={p.y} r={3.2}
                      fill={tint} />
                    <circle cx={p.x} cy={p.y} r={14}
                      fill="transparent" />
                  </g>
                ))}

                {/* Editorial nameplate at the bottom of the cell */}
                <g>
                  <line
                    x1={cx - 70} y1={cy + r + 14}
                    x2={cx + 70} y2={cy + r + 14}
                    stroke={PITCH.accent} strokeWidth={1.5}
                  />
                  <text x={cx} y={cy + r + 30}
                    textAnchor="middle"
                    fill={PITCH.ink}
                    style={{
                      fontFamily: 'var(--font-fraunces), Georgia, serif',
                      fontSize: 13,
                      fontStyle: 'italic',
                      letterSpacing: '-0.01em',
                    }}>
                    {c.description.length > 32
                      ? c.description.slice(0, 30) + '…'
                      : c.description}
                  </text>
                  <text x={cx} y={cy + r + 46}
                    textAnchor="middle"
                    fill={PITCH.inkFaint}
                    style={{
                      fontFamily: 'var(--font-geist-sans), sans-serif',
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                    }}>
                    {c.id} · Grade {c.grade} · {c.stars.length} {c.stars.length === 1 ? 'star' : 'stars'}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail panel — editorial card on cream */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          style={{ background: 'rgba(26,26,26,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="relative max-w-xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: PITCH.bg,
              color: PITCH.ink,
              border: `1px solid ${PITCH.rule}`,
            }}
          >
            {/* terracotta top accent */}
            <div aria-hidden style={{ height: 3, background: PITCH.accent }} />

            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute top-4 right-4 text-2xl leading-none w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
              style={{ color: PITCH.inkFaint }}
            >
              ×
            </button>

            <div className="p-8 md:p-10">
              {/* Header */}
              <div style={{ borderBottom: `1px solid ${PITCH.rule}` }} className="pb-5">
                <div
                  style={{
                    fontFamily: 'var(--font-geist-sans), sans-serif',
                    letterSpacing: '0.22em',
                    fontSize: 11,
                    color: PITCH.inkFaint,
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  {selected.cluster.domain} · Grade {selected.star.grade}
                </div>
                <h2
                  className="mt-3"
                  style={{
                    fontFamily: 'var(--font-fraunces), Georgia, serif',
                    fontSize: 'clamp(1.6rem, 3vw, 2rem)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    color: PITCH.ink,
                  }}
                >
                  {selected.star.shortName}
                </h2>
                <div
                  className="mt-3"
                  style={{
                    fontFamily: 'var(--font-geist-sans), sans-serif',
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    color: PITCH.inkFaint,
                    textTransform: 'uppercase',
                  }}
                >
                  {selected.star.id}
                </div>
              </div>

              {/* Body */}
              <div
                className="mt-6 space-y-5"
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  color: PITCH.inkSoft,
                  fontSize: 14.5,
                  lineHeight: 1.6,
                }}
              >
                <Section label="The standard">
                  {selected.star.description}
                </Section>
                <Section label="How we will measure it">
                  A{' '}
                  <em
                    style={{
                      fontFamily: 'var(--font-fraunces), serif',
                      fontStyle: 'italic',
                      color: PITCH.ink,
                    }}
                  >
                    {selected.star.probeMechanic}
                  </em>{' '}
                  probe &mdash; a 60-to-90-second instrumented mechanic that captures
                  every placement, removal, and reset. Telemetry, not just the final
                  answer, tells us whether the learner truly understood, was
                  self-correcting, or was guessing.
                </Section>
                <Section label="What the result becomes">
                  A line in the learner&rsquo;s mastery passport. It carries forward into
                  every other Stratamundo stage and into the math games they play and,
                  later, build.
                </Section>
              </div>

              {PROBE_DEMOS[selected.star.id] && (
                <div className="mt-7">
                  <Link
                    href={PROBE_DEMOS[selected.star.id]}
                    className="inline-flex items-center px-5 py-3 hover:opacity-85 transition-opacity"
                    style={{
                      fontFamily: 'var(--font-geist-sans), sans-serif',
                      background: PITCH.accent,
                      color: PITCH.bg,
                      fontSize: 11,
                      letterSpacing: '0.2em',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                    }}
                  >
                    Try this probe →
                  </Link>
                </div>
              )}

              <div
                className="mt-7"
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontSize: 12,
                  color: PITCH.inkFaint,
                }}
              >
                {!PROBE_DEMOS[selected.star.id] && (
                  <>This star is part of the planned build.{' '}
                  <Link
                    href="/vision/probe/k-cc-a-1"
                    style={{ color: PITCH.accent, borderBottom: `1px solid ${PITCH.accent}` }}
                  >
                    Try the K.CC.A.1 probe demo →
                  </Link>
                  </>
                )}
                {PROBE_DEMOS[selected.star.id] && (
                  <>Press <kbd style={{
                    padding: '1px 6px',
                    border: `1px solid ${PITCH.rule}`,
                    fontSize: 11,
                  }}>Esc</kbd> or click outside to close.</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-geist-sans), sans-serif',
          color: PITCH.accent,
          letterSpacing: '0.22em',
          fontSize: 10,
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
        className="mb-1.5"
      >
        {label}
      </div>
      <p>{children}</p>
    </div>
  )
}
