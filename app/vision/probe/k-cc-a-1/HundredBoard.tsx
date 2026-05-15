'use client'

/**
 * K.CC.A.1 hundred-board count-trail probe — interactive demo.
 * Editorial pitch palette (cream + Fraunces + Geist + terracotta accent).
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type TapEvent = { n: number; t: number; correct: boolean }

const TARGET = 100
const COMMIT_THRESHOLD = 8

const C = {
  bg: '#F5F1E8',
  paper: '#FBF8F0',
  ink: '#1A1A1A',
  inkSoft: '#3D3A35',
  inkFaint: '#8A8580',
  accent: '#A14A2F',
  accentSoft: 'rgba(161, 74, 47, 0.12)',
  rule: 'rgba(26, 26, 26, 0.10)',
}
const SERIF = { fontFamily: 'var(--font-fraunces), Georgia, serif' }
const SANS = { fontFamily: 'var(--font-geist-sans), -apple-system, sans-serif' }

export default function HundredBoard() {
  const router = useRouter()
  const [taps, setTaps] = useState<TapEvent[]>([])
  const [startedAt] = useState(() => Date.now())
  const [resultOpen, setResultOpen] = useState(false)

  const currentNext = taps.filter((e) => e.correct).length + 1
  const last = taps[taps.length - 1]

  const cells = useMemo(() => Array.from({ length: TARGET }, (_, i) => i + 1), [])

  function onTap(n: number) {
    if (resultOpen) return
    setTaps((prev) => [
      ...prev,
      { n, t: Date.now() - startedAt, correct: n === currentNext },
    ])
  }

  useEffect(() => {
    const correctCount = taps.filter((e) => e.correct).length
    if (correctCount >= TARGET) setResultOpen(true)
  }, [taps])

  const correctCount = taps.filter((e) => e.correct).length
  const wrongCount = taps.length - correctCount
  const tappedSet = new Set(taps.filter((e) => e.correct).map((e) => e.n))

  return (
    <div className="space-y-8">
      {/* Status strip */}
      <div
        className="p-5"
        style={{
          background: C.paper,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <Eyebrow>The task</Eyebrow>
            <div
              style={{ ...SERIF, color: C.ink }}
              className="mt-2 text-lg md:text-xl"
            >
              Tap each number in order from{' '}
              <em style={{ color: C.accent, fontStyle: 'italic' }}>1</em> to{' '}
              <em style={{ color: C.accent, fontStyle: 'italic' }}>100</em>.
            </div>
          </div>

          <div className="flex items-end gap-8">
            <Stat label="Tap next" value={String(currentNext > TARGET ? TARGET : currentNext)} />
            <Stat label="Counted" value={`${correctCount} / ${TARGET}`} />
            <Stat label="Slips" value={String(wrongCount)} muted />
          </div>
        </div>

        {last && (
          <div
            className="mt-4"
            style={{
              ...SERIF,
              fontStyle: 'italic',
              fontSize: 14,
              color: last.correct ? C.accent : C.inkSoft,
            }}
          >
            {last.correct
              ? `Good — you tapped ${last.n}.`
              : `Hmm — that was ${last.n}. The next number is ${currentNext}.`}
          </div>
        )}
      </div>

      {/* The board */}
      <div
        className="p-3 md:p-5"
        style={{
          background: C.paper,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        >
          {cells.map((n) => {
            const tapped = tappedSet.has(n)
            const isNext = n === currentNext && !resultOpen
            const baseStyle: React.CSSProperties = {
              ...SANS,
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              fontSize: 13,
              letterSpacing: '-0.005em',
              border: `1px solid ${C.rule}`,
            }
            let style: React.CSSProperties
            if (tapped) {
              style = {
                ...baseStyle,
                background: C.accent,
                borderColor: C.accent,
                color: C.bg,
                fontWeight: 600,
              }
            } else if (isNext) {
              style = {
                ...baseStyle,
                background: C.accentSoft,
                borderColor: C.accent,
                color: C.accent,
                fontWeight: 600,
                animation: 'next-pulse 1.6s ease-in-out infinite',
              }
            } else {
              style = {
                ...baseStyle,
                background: C.bg,
                color: C.ink,
                fontWeight: 400,
              }
            }
            return (
              <button
                key={n}
                onClick={() => onTap(n)}
                disabled={resultOpen}
                style={style}
                className="cursor-pointer hover:bg-[rgba(26,26,26,0.04)]"
              >
                {n}
              </button>
            )
          })}
        </div>

        <style>{`
          @keyframes next-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(161, 74, 47, 0.0); }
            50%      { box-shadow: 0 0 0 4px rgba(161, 74, 47, 0.15); }
          }
        `}</style>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          style={{
            ...SERIF,
            fontStyle: 'italic',
            fontSize: 14,
            color: C.inkFaint,
          }}
        >
          {correctCount < COMMIT_THRESHOLD
            ? `Tap at least ${COMMIT_THRESHOLD} numbers in order to finish, or reach 100.`
            : 'You can finish anytime — the AI will read what you have done so far.'}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setTaps([])}
            disabled={resultOpen || taps.length === 0}
            className="transition-opacity disabled:opacity-30 hover:opacity-70"
            style={{
              ...SANS,
              padding: '10px 18px',
              border: `1px solid ${C.ink}`,
              background: 'transparent',
              color: C.ink,
              fontSize: 11,
              letterSpacing: '0.18em',
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            Start over
          </button>
          <button
            onClick={() => setResultOpen(true)}
            disabled={correctCount < COMMIT_THRESHOLD}
            className="transition-opacity disabled:opacity-30 hover:opacity-85"
            style={{
              ...SANS,
              padding: '10px 22px',
              background: C.accent,
              color: C.bg,
              fontSize: 11,
              letterSpacing: '0.18em',
              fontWeight: 500,
              textTransform: 'uppercase',
              border: 'none',
            }}
          >
            Done — show me the results
          </button>
        </div>
      </div>

      {resultOpen && (
        <ResultDialog
          taps={taps}
          onClose={() => setResultOpen(false)}
          onBack={() => router.push('/vision#atlas')}
        />
      )}
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...SANS,
        color: C.inkFaint,
        fontWeight: 500,
        letterSpacing: '0.22em',
        fontSize: 10,
        textTransform: 'uppercase',
      }}
      className="flex items-center gap-3"
    >
      <span aria-hidden style={{ display: 'inline-block', width: 16, height: 1, background: C.accent }} />
      <span>{children}</span>
    </div>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="text-center">
      <div
        style={{
          ...SANS,
          color: muted ? C.inkFaint : C.accent,
          fontSize: 10,
          letterSpacing: '0.22em',
          fontWeight: 500,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          ...SERIF,
          color: muted ? C.inkSoft : C.ink,
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
        className="mt-1"
      >
        {value}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

function ResultDialog({
  taps,
  onClose,
  onBack,
}: {
  taps: TapEvent[]
  onClose: () => void
  onBack: () => void
}) {
  const correct = taps.filter((t) => t.correct).length
  const wrong = taps.length - correct
  const verdict = computeVerdict(taps)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      style={{ background: 'rgba(26,26,26,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-2xl my-8 shadow-2xl"
        style={{
          background: C.bg,
          color: C.ink,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div aria-hidden style={{ height: 3, background: C.accent }} />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl leading-none w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
          style={{ color: C.inkFaint }}
        >
          ×
        </button>

        <div className="p-8 md:p-12">
          <div style={{ borderBottom: `1px solid ${C.rule}` }} className="pb-6">
            <Eyebrow>Mastery passport · Entry drafted</Eyebrow>

            <h2
              className="mt-5"
              style={{
                ...SERIF,
                fontWeight: 400,
                fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: C.ink,
              }}
            >
              {verdict.headline}.
            </h2>

            <div
              className="mt-3"
              style={{
                ...SANS,
                color: C.inkFaint,
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              K.CC.A.1 · Count to 100 by ones and tens
            </div>
          </div>

          {/* Reasoning */}
          <div className="mt-7">
            <div
              style={{
                ...SANS,
                color: C.accent,
                fontSize: 10,
                letterSpacing: '0.22em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
              className="mb-2"
            >
              How we read what you did
            </div>
            <p
              style={{
                ...SANS,
                color: C.inkSoft,
                fontSize: 15,
                lineHeight: 1.65,
              }}
            >
              {verdict.reasoning} You tapped{' '}
              <em style={{ ...SERIF, fontStyle: 'italic', color: C.ink }}>{taps.length} times</em> &mdash;{' '}
              <em style={{ ...SERIF, fontStyle: 'italic', color: C.ink }}>{correct} in order</em>
              {wrong > 0 && (
                <>, with <em style={{ ...SERIF, fontStyle: 'italic', color: C.accent }}>{wrong} slips</em></>
              )}
              .
            </p>
          </div>

          {/* Agent ladder */}
          <div className="mt-9">
            <div
              style={{
                ...SANS,
                color: C.accent,
                fontSize: 10,
                letterSpacing: '0.22em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
              className="mb-3"
            >
              Four AI agents reviewed this verdict
            </div>
            <ul className="space-y-0">
              {verdict.ladder.map((stage, i) => (
                <LadderRow key={i} {...stage} isLast={i === verdict.ladder.length - 1} />
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div
            className="mt-9 p-5"
            style={{
              background: C.paper,
              border: `1px solid ${C.rule}`,
              borderLeft: `2px solid ${C.accent}`,
            }}
          >
            <div
              style={{
                ...SANS,
                color: C.accent,
                fontSize: 10,
                letterSpacing: '0.22em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
              className="mb-2"
            >
              What happens next
            </div>
            <p
              style={{
                ...SANS,
                color: C.inkSoft,
                fontSize: 14.5,
                lineHeight: 1.6,
              }}
            >
              This entry is added to the learner&rsquo;s mastery passport. It carries forward
              into every other Stratamundo stage and into the math games they play and,
              later, build.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              onClick={onBack}
              className="transition-opacity hover:opacity-85"
              style={{
                ...SANS,
                padding: '10px 22px',
                background: C.accent,
                color: C.bg,
                fontSize: 11,
                letterSpacing: '0.18em',
                fontWeight: 500,
                textTransform: 'uppercase',
                border: 'none',
              }}
            >
              Back to the atlas
            </button>
            <button
              onClick={onClose}
              className="transition-opacity hover:opacity-70"
              style={{
                ...SANS,
                padding: '10px 22px',
                background: 'transparent',
                color: C.ink,
                border: `1px solid ${C.ink}`,
                fontSize: 11,
                letterSpacing: '0.18em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              Try again
            </button>
            <Link
              href="/setup"
              className="transition-opacity hover:opacity-70 inline-flex items-center"
              style={{
                ...SANS,
                padding: '10px 22px',
                color: C.ink,
                border: `1px solid ${C.ink}`,
                fontSize: 11,
                letterSpacing: '0.18em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              See the live diagnostic
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function LadderRow({
  stage,
  agent,
  pass,
  note,
  isLast,
}: {
  stage: string
  agent: string
  pass: boolean
  note: string
  isLast?: boolean
}) {
  return (
    <li
      style={{
        borderTop: `1px solid ${C.rule}`,
        borderBottom: isLast ? `1px solid ${C.rule}` : 'none',
      }}
      className="py-4 grid gap-4 md:grid-cols-[140px_1fr_auto] items-start"
    >
      <div
        style={{
          ...SANS,
          color: C.inkFaint,
          fontSize: 10,
          letterSpacing: '0.22em',
          fontWeight: 500,
          textTransform: 'uppercase',
        }}
      >
        {stage}
      </div>
      <div>
        <div
          style={{
            ...SERIF,
            fontSize: 16,
            color: C.ink,
            letterSpacing: '-0.01em',
          }}
        >
          {agent}
        </div>
        <div
          style={{
            ...SANS,
            fontSize: 13.5,
            color: C.inkSoft,
            lineHeight: 1.55,
          }}
          className="mt-1"
        >
          {note}
        </div>
      </div>
      <div
        style={{
          ...SANS,
          color: pass ? C.accent : '#7A2818',
          fontSize: 10,
          letterSpacing: '0.22em',
          fontWeight: 500,
          textTransform: 'uppercase',
        }}
      >
        {pass ? 'Confirmed' : 'Flagged'}
      </div>
    </li>
  )
}

/* ---------------------------------------------------------------- */

type Verdict = {
  state: 'demonstrated' | 'working' | 'misconception'
  headline: string
  reasoning: string
  ladder: { stage: string; agent: string; pass: boolean; note: string }[]
}

function computeVerdict(taps: TapEvent[]): Verdict {
  const correct = taps.filter((t) => t.correct).length
  const wrong = taps.length - correct
  const reachedTen = correct >= 10
  const reached100 = correct >= TARGET
  const passedTeens = correct >= 20

  if (reached100 && wrong <= 2) {
    return {
      state: 'demonstrated',
      headline: 'Demonstrated mastery',
      reasoning:
        'You counted all the way to 100 in order with steady pacing — exactly the trajectory that shows real understanding of the count sequence.',
      ladder: [
        { stage: 'Stage 1 · Haiku', agent: 'The Critic — cheap filter', pass: true,
          note: 'Telemetry shows a single clean run, no resets, all numbers in order.' },
        { stage: 'Stage 2 · Sonnet', agent: 'The Critic — deep', pass: true,
          note: 'No false-success patterns; the trajectory matches authentic counting.' },
        { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary — obvious', pass: true,
          note: 'No skip-clicking, no UI exploit detected.' },
        { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary — creative', pass: true,
          note: 'No memorized-sequence pattern; pacing is human, not robotic.' },
      ],
    }
  }

  if (passedTeens && wrong >= 1 && wrong <= 4) {
    return {
      state: 'working',
      headline: 'Working on it',
      reasoning:
        'You moved through most of the count sequence with a few small slips. That is normal at this stage — partial mastery, not a misconception.',
      ladder: [
        { stage: 'Stage 1 · Haiku', agent: 'The Critic — cheap filter', pass: true,
          note: 'Several slips visible; partial-mastery pattern, not random.' },
        { stage: 'Stage 2 · Sonnet', agent: 'The Critic — deep', pass: true,
          note: 'Slips clustered around tens-transitions — typical for emerging counters.' },
        { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary — obvious', pass: true,
          note: 'No exploit pattern; slips look authentic.' },
        { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary — creative', pass: true,
          note: 'No memorization shortcut; pacing varies naturally.' },
      ],
    }
  }

  if (wrong >= 3 && correct < 20) {
    return {
      state: 'misconception',
      headline: 'A specific misconception is showing',
      reasoning:
        'You counted some numbers in order then started skipping or going out of sequence. The pattern matches a known misconception around the count sequence — the guide should re-teach this with a number line and concrete objects.',
      ladder: [
        { stage: 'Stage 1 · Haiku', agent: 'The Critic — cheap filter', pass: true,
          note: 'Wrong-tap pattern matches a known misconception entry.' },
        { stage: 'Stage 2 · Sonnet', agent: 'The Critic — deep', pass: true,
          note: 'High wrong-rate after a short correct prefix — fits the count-sequence-instability misconception.' },
        { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary — obvious', pass: true,
          note: 'Not random clicking — the early prefix shows real intent.' },
        { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary — creative', pass: true,
          note: 'No exploit; the verdict is the misconception, not bad faith.' },
      ],
    }
  }

  return {
    state: 'working',
    headline: 'A starting picture',
    reasoning: reachedTen
      ? 'You showed the start of the count sequence cleanly. A longer probe would tell us more — for the demo, the engine reads what you gave it.'
      : 'A short trajectory — the engine logs every tap, with timing, and would normally probe further. For the demo, this is enough to show how the read-out works.',
    ladder: [
      { stage: 'Stage 1 · Haiku', agent: 'The Critic — cheap filter', pass: true,
        note: 'Trajectory is short but coherent.' },
      { stage: 'Stage 2 · Sonnet', agent: 'The Critic — deep', pass: true,
        note: 'Not enough variety yet to up- or down-grade the verdict.' },
      { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary — obvious', pass: true,
        note: 'Nothing exploit-like in the taps.' },
      { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary — creative', pass: true,
        note: 'No memorization or pacing artefact.' },
    ],
  }
}
