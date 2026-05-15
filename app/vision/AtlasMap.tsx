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
import type { Constellation, Star } from '../../lib/k2-atlas'

type Props = {
  constellations: Constellation[]
}

const GRADE_TINT: Record<string, string> = {
  K: 'oklch(0.86 0.16 88)',  // brass-glow — softest
  '1': 'oklch(0.74 0.14 80)',  // brass
  '2': 'oklch(0.62 0.16 42)',  // copper
  '3': 'oklch(0.55 0.12 70)',  // brass-deep
}

export default function AtlasMap({ constellations }: Props) {
  const [selected, setSelected] = useState<{ star: Star; cluster: Constellation } | null>(null)

  // Lay out constellations in a 4-column grid.
  const cols = 4
  const cellW = 320
  const cellH = 320
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
          {/* Background — deep mahogany with subtle nebula */}
          <defs>
            <radialGradient id="nebula" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="oklch(0.18 0.022 55)" />
              <stop offset="100%" stopColor="oklch(0.10 0.012 50)" />
            </radialGradient>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.95 0.10 88 / 1)" />
              <stop offset="40%" stopColor="oklch(0.80 0.14 80 / 0.65)" />
              <stop offset="100%" stopColor="oklch(0.74 0.14 80 / 0)" />
            </radialGradient>
            <filter id="brassFilter">
              <feGaussianBlur stdDeviation="0.4" />
            </filter>
          </defs>

          <rect width={width} height={height} fill="url(#nebula)" />

          {/* Faint star field background — deterministic dot pattern */}
          {Array.from({ length: 180 }).map((_, i) => {
            const x = ((i * 73) % 1000) / 1000 * width
            const y = ((i * 137) % 1000) / 1000 * height
            const r = ((i * 19) % 10) / 10 * 0.7 + 0.3
            const o = ((i * 41) % 100) / 100 * 0.4 + 0.05
            return (
              <circle key={i} cx={x} cy={y} r={r}
                fill="oklch(0.92 0.020 75)" opacity={o} />
            )
          })}

          {/* Each constellation */}
          {placed.map(({ c, cx, cy }) => {
            const r = 110 // constellation radius
            const tint = GRADE_TINT[c.grade] ?? GRADE_TINT['1']
            const stars = c.stars.map((s) => ({
              s,
              x: cx + Math.cos(s.angle) * (s.radius * r),
              y: cy + Math.sin(s.angle) * (s.radius * r),
            }))

            return (
              <g key={c.id}>
                {/* Soft halo behind the constellation */}
                <circle cx={cx} cy={cy} r={r + 10} fill={tint} opacity={0.04} />
                <circle cx={cx} cy={cy} r={r} fill="none"
                  stroke="oklch(0.55 0.12 70 / 0.18)" strokeWidth={0.6}
                  strokeDasharray="2 4" />

                {/* Constellation lines — connect each star to the next */}
                {stars.map((p, i) => {
                  if (i === 0) return null
                  const prev = stars[i - 1]
                  return (
                    <line key={`l-${p.s.id}`}
                      x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                      stroke={tint} strokeWidth={0.5} opacity={0.32}
                    />
                  )
                })}

                {/* Stars */}
                {stars.map((p) => (
                  <g key={p.s.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected({ star: p.s, cluster: c })}
                  >
                    <circle cx={p.x} cy={p.y} r={11}
                      fill="url(#starGlow)" opacity={0.7} />
                    <circle cx={p.x} cy={p.y} r={2.6}
                      fill="oklch(0.95 0.10 88)" />
                    <circle cx={p.x} cy={p.y} r={14}
                      fill="transparent" />
                  </g>
                ))}

                {/* Brass nameplate at the bottom of the cell */}
                <g>
                  <rect
                    x={cx - 90} y={cy + r + 4} width={180} height={36} rx={2}
                    fill="oklch(0.18 0.020 55)"
                    stroke="oklch(0.55 0.12 70 / 0.7)" strokeWidth={0.8}
                  />
                  {/* Brass rivets */}
                  {[-82, 82].map((dx) => (
                    <circle key={dx}
                      cx={cx + dx} cy={cy + r + 22} r={1.4}
                      fill="oklch(0.74 0.14 80)" />
                  ))}
                  <text x={cx} y={cy + r + 18}
                    textAnchor="middle"
                    fill="oklch(0.86 0.16 88)"
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                    }}>
                    {c.id}
                  </text>
                  <text x={cx} y={cy + r + 32}
                    textAnchor="middle"
                    fill="oklch(0.78 0.022 70)"
                    style={{
                      fontFamily: 'var(--font-eb)',
                      fontSize: 9,
                      fontStyle: 'italic',
                    }}>
                    Grade {c.grade} · {c.stars.length} {c.stars.length === 1 ? 'star' : 'stars'}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-lg w-full border-2 border-brass-deep bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 0%, oklch(0.18 0.020 55) 0%, oklch(0.13 0.014 50) 70%)',
            }}
          >
            {/* Brass corner rivets */}
            {[
              { t: 6, l: 6 }, { t: 6, r: 6 },
              { b: 6, l: 6 }, { b: 6, r: 6 },
            ].map((p, i) => (
              <div key={i}
                className="absolute h-2 w-2 rounded-full bg-brass"
                style={{
                  top: p.t, left: p.l, right: p.r, bottom: p.b,
                  boxShadow: '0 0 6px oklch(0.86 0.16 88 / 0.4)',
                }}
              />
            ))}

            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute top-3 right-3 text-cream-faint hover:text-brass-glow text-xl leading-none w-7 h-7 flex items-center justify-center"
            >
              ×
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="text-center pb-4 border-b border-brass-deep/40">
                <div
                  style={{
                    fontFamily: 'var(--font-cinzel)',
                    letterSpacing: '0.22em',
                    fontSize: 11,
                    color: 'oklch(0.62 0.018 65)',
                    textTransform: 'uppercase',
                  }}
                >
                  {selected.cluster.domain} · Grade {selected.star.grade}
                </div>
                <div
                  className="mt-2 text-brass-glow"
                  style={{
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: 22,
                    letterSpacing: '0.18em',
                    fontWeight: 700,
                  }}
                >
                  {selected.star.id}
                </div>
                <div
                  className="mt-1 text-cream"
                  style={{ fontFamily: 'var(--font-eb)', fontSize: 16, fontStyle: 'italic' }}
                >
                  {selected.star.shortName}
                </div>
              </div>

              {/* Body */}
              <div className="mt-5 space-y-4 text-cream-soft text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-eb)' }}>
                <div>
                  <div className="text-brass uppercase tracking-widest text-xs mb-1"
                    style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.2em' }}>
                    The standard
                  </div>
                  <p>{selected.star.description}</p>
                </div>

                <div>
                  <div className="text-brass uppercase tracking-widest text-xs mb-1"
                    style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.2em' }}>
                    How we will measure it
                  </div>
                  <p>
                    A <span className="text-brass-glow">{selected.star.probeMechanic}</span>{' '}
                    probe — a 60-to-90-second instrumented mechanic that captures every placement,
                    removal, and reset. Telemetry — not just the final answer — tells us whether
                    the learner truly understood, was self-correcting, or was guessing.
                  </p>
                </div>

                <div>
                  <div className="text-brass uppercase tracking-widest text-xs mb-1"
                    style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.2em' }}>
                    What the result becomes
                  </div>
                  <p>
                    A star on the learner&rsquo;s mastery passport. When they enter Math Games
                    Builder, this passport lights up the matching moon in the galaxy — what they
                    have mastered, what they are working on, where to go next.
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center text-cream-faint text-xs italic"
                style={{ fontFamily: 'var(--font-eb)' }}>
                Press <kbd className="px-1 border border-brass-deep/50 rounded">Esc</kbd> or click outside to close
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
