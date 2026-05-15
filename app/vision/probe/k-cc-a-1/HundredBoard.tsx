'use client'

/**
 * K.CC.A.1 hundred-board count-trail probe — interactive demo.
 *
 * The learner taps numbers in order from 1 to 100. Each tap is a
 * telemetry event. The probe ends when:
 *   - the learner taps "Done" (commit)
 *   - or they reach 100 (auto-commit)
 *
 * For the fellowship demo this is a clickthrough — telemetry is
 * captured client-side and a deterministic mock verdict is shown.
 * No network calls.
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gear, OrnamentalRule, CornerFlourish } from '../../../Ornament'

type TapEvent = { n: number; t: number; correct: boolean }

const TARGET = 100
const COMMIT_THRESHOLD = 8 // demo: after 8 taps the learner can finish early

export default function HundredBoard() {
  const router = useRouter()
  const [taps, setTaps] = useState<TapEvent[]>([])
  const [startedAt] = useState(() => Date.now())
  const [resultOpen, setResultOpen] = useState(false)

  const currentNext = taps.filter((e) => e.correct).length + 1 // next expected number
  const last = taps[taps.length - 1]

  // grid of 1..100, brass cells
  const cells = useMemo(() => Array.from({ length: TARGET }, (_, i) => i + 1), [])

  function onTap(n: number) {
    if (resultOpen) return
    setTaps((prev) => [
      ...prev,
      { n, t: Date.now() - startedAt, correct: n === currentNext },
    ])
  }

  // auto-finish if they reach 100 correctly
  useEffect(() => {
    const correctCount = taps.filter((e) => e.correct).length
    if (correctCount >= TARGET) setResultOpen(true)
  }, [taps])

  const correctCount = taps.filter((e) => e.correct).length
  const wrongCount = taps.length - correctCount
  const tappedSet = new Set(taps.filter((e) => e.correct).map((e) => e.n))

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------
          Status strip — what the learner sees up top
      ---------------------------------------------------------------- */}
      <div className="border border-brass-deep/60 bg-background/60 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div
              className="text-brass uppercase tracking-[0.25em] text-[10px]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              The Task
            </div>
            <div
              className="text-cream mt-1"
              style={{ fontFamily: 'var(--font-eb)', fontSize: 17 }}
            >
              Tap each number in order from{' '}
              <span className="text-brass-glow">1</span> to{' '}
              <span className="text-brass-glow">100</span>.
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Stat label="Tap next" value={String(currentNext > TARGET ? TARGET : currentNext)} />
            <Stat label="Counted" value={`${correctCount} / ${TARGET}`} />
            <Stat label="Slips" value={String(wrongCount)} muted />
          </div>
        </div>

        {last && (
          <div
            className={`mt-3 text-xs ${last.correct ? 'text-brass-glow' : 'text-copper'}`}
            style={{ fontFamily: 'var(--font-eb)', fontStyle: 'italic' }}
          >
            {last.correct
              ? `Good — you tapped ${last.n}.`
              : `Hmm — that was ${last.n}. The next number is ${currentNext}.`}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------
          The board
      ---------------------------------------------------------------- */}
      <div
        className="border-2 border-brass-deep/60 bg-background p-4"
        style={{
          boxShadow:
            'inset 0 0 60px oklch(0 0 0 / 0.5), 0 6px 24px oklch(0 0 0 / 0.4)',
        }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        >
          {cells.map((n) => {
            const tapped = tappedSet.has(n)
            const isNext = n === currentNext && !resultOpen
            return (
              <button
                key={n}
                onClick={() => onTap(n)}
                disabled={resultOpen}
                className={[
                  'aspect-square flex items-center justify-center select-none transition-all',
                  'border',
                  tapped
                    ? 'border-brass-glow text-background bg-brass-glow'
                    : isNext
                    ? 'border-brass text-brass-glow bg-brass/10 animate-pulse'
                    : 'border-brass-deep/50 text-cream-soft hover:text-brass-glow hover:border-brass',
                ].join(' ')}
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  fontWeight: tapped || isNext ? 700 : 500,
                  boxShadow: tapped
                    ? '0 0 10px oklch(0.86 0.16 88 / 0.6)'
                    : 'none',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Action row
      ---------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="text-cream-faint text-xs italic"
          style={{ fontFamily: 'var(--font-eb)' }}
        >
          {correctCount < COMMIT_THRESHOLD
            ? `Tap at least ${COMMIT_THRESHOLD} numbers in order to finish, or reach 100.`
            : 'You can finish anytime — the AI will read what you have done so far.'}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setTaps([])}
            disabled={resultOpen || taps.length === 0}
            className="px-4 py-2 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass disabled:opacity-30 disabled:hover:text-cream-soft disabled:hover:border-brass-deep transition-colors uppercase text-[11px] tracking-[0.18em]"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Start over
          </button>
          <button
            onClick={() => setResultOpen(true)}
            disabled={correctCount < COMMIT_THRESHOLD}
            className="px-5 py-2 border-2 border-brass bg-brass text-brass-fg hover:bg-brass-glow hover:border-brass-glow disabled:opacity-30 disabled:hover:bg-brass disabled:hover:border-brass transition-colors uppercase text-[11px] tracking-[0.2em] font-bold"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Done — show me the results
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Results dialog — the agent-ladder verdict
      ---------------------------------------------------------------- */}
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

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`text-[10px] uppercase tracking-[0.22em] ${muted ? 'text-cream-faint' : 'text-brass'}`}
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        {label}
      </div>
      <div
        className={muted ? 'text-cream-soft' : 'text-brass-glow'}
        style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 700 }}
      >
        {value}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------
   Results dialog
   -------------------------------------------------------------------- */

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

  // Deterministic verdict from the trajectory — mirrors the R1-R10 rules.
  const verdict = computeVerdict(taps)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl my-8 border-2 border-brass-deep bg-background shadow-2xl"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, oklch(0.18 0.020 55) 0%, oklch(0.13 0.014 50) 70%)',
        }}
      >
        {/* corner rivets */}
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
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-cream-faint hover:text-brass-glow text-2xl leading-none w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>

        <div className="p-6 md:p-10">
          {/* Header — verdict */}
          <div className="text-center pb-5 border-b border-brass-deep/40">
            <div
              className="text-brass uppercase tracking-[0.3em] text-[10px] mb-2"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Mastery Passport · Entry Drafted
            </div>
            <div className="flex justify-center mb-3">
              <Gear className="h-12 w-12 text-brass-glow animate-turn-slow drop-shadow-[0_0_10px_oklch(0.86_0.16_88/0.6)]" teeth={12} />
            </div>
            <h2
              className="text-brass-glow"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              {verdict.headline}
            </h2>
            <div
              className="mt-2 text-cream-faint uppercase"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 10,
                letterSpacing: '0.28em',
              }}
            >
              K.CC.A.1 · Count to 100 by ones and tens
            </div>
            <div className="mt-4 flex justify-center text-brass-deep">
              <OrnamentalRule className="h-5 w-56" />
            </div>
          </div>

          {/* Reasoning — plain language */}
          <div className="mt-6">
            <div
              className="text-brass uppercase tracking-[0.25em] text-[10px] mb-2"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              How we read what you did
            </div>
            <p
              className="text-cream-soft leading-relaxed"
              style={{ fontFamily: 'var(--font-eb)', fontSize: 15 }}
            >
              {verdict.reasoning} You tapped{' '}
              <span className="text-brass-glow">{taps.length} times</span> &mdash;{' '}
              <span className="text-brass-glow">{correct} in order</span>
              {wrong > 0 && (
                <>, with <span className="text-copper">{wrong} slips</span></>
              )}
              .
            </p>
          </div>

          {/* The agent ladder */}
          <div className="mt-8">
            <div
              className="text-brass uppercase tracking-[0.25em] text-[10px] mb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Four AI agents reviewed this verdict
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {verdict.ladder.map((stage, i) => (
                <LadderRow key={i} {...stage} />
              ))}
            </div>
          </div>

          {/* Carry-forward CTA */}
          <div className="mt-8 p-4 border border-brass-deep/60 bg-brass/5 text-center">
            <div
              className="text-brass uppercase tracking-[0.25em] text-[10px] mb-2"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              What happens next
            </div>
            <p
              className="text-cream-soft text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-eb)' }}
            >
              This entry is added to the learner&rsquo;s mastery passport. When they enter
              Math Games Builder next, the matching moon in the galaxy already knows them
              &mdash; lit up if mastered, dim if there&rsquo;s work to do.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-5 py-2 border-2 border-brass bg-brass text-brass-fg hover:bg-brass-glow hover:border-brass-glow transition-colors uppercase text-[11px] tracking-[0.2em] font-bold"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Back to the atlas
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass transition-colors uppercase text-[11px] tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Try again
            </button>
            <Link
              href="/setup"
              className="px-5 py-2 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass transition-colors uppercase text-[11px] tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
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
}: {
  stage: string
  agent: string
  pass: boolean
  note: string
}) {
  return (
    <div className="relative p-3 border border-brass-deep/60 bg-background/60">
      <CornerFlourish corner="tl" className="absolute -top-1 -left-1 h-4 w-4 text-brass-deep" />
      <CornerFlourish corner="br" className="absolute -bottom-1 -right-1 h-4 w-4 text-brass-deep" />
      <div className="flex items-center justify-between">
        <div
          className="text-brass uppercase tracking-[0.22em] text-[9px]"
          style={{ fontFamily: 'var(--font-cinzel)' }}
        >
          {stage}
        </div>
        <div
          className={`text-[10px] uppercase tracking-[0.22em] ${pass ? 'text-brass-glow' : 'text-copper'}`}
          style={{ fontFamily: 'var(--font-cinzel)' }}
        >
          {pass ? 'Confirmed' : 'Flagged'}
        </div>
      </div>
      <div
        className="mt-1 text-cream"
        style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, letterSpacing: '0.04em' }}
      >
        {agent}
      </div>
      <div
        className="mt-1 text-cream-soft text-xs leading-relaxed"
        style={{ fontFamily: 'var(--font-eb)' }}
      >
        {note}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------
   Verdict computation — mirrors the R1-R10 rules in plain words.
   This is the demo's intelligence: it reads the trajectory, not just
   the outcome, and explains itself.
   -------------------------------------------------------------------- */

type Verdict = {
  state: 'demonstrated' | 'working' | 'misconception'
  headline: string
  reasoning: string
  ladder: { stage: string; agent: string; pass: boolean; note: string }[]
}

function computeVerdict(taps: TapEvent[]): Verdict {
  const correct = taps.filter((t) => t.correct).length
  const wrong = taps.length - correct
  const lastT = taps.length > 0 ? taps[taps.length - 1].t : 0
  const reachedTen = correct >= 10
  const reached100 = correct >= TARGET
  // detect the classic teen→twenty stumble (counted past 12 in order)
  const passedTeens = correct >= 20

  if (reached100 && wrong <= 2) {
    return {
      state: 'demonstrated',
      headline: 'Demonstrated mastery',
      reasoning:
        'You counted all the way to 100 in order with steady pacing — exactly the kind of trajectory that shows real understanding of the count sequence (rules R2 and R10).',
      ladder: [
        { stage: 'Stage 1 · Haiku', agent: 'The Critic (cheap filter)', pass: true,
          note: 'Telemetry shows a single clean run, no resets, all numbers in order.' },
        { stage: 'Stage 2 · Sonnet', agent: 'The Critic (deep)', pass: true,
          note: 'No false-success patterns; the trajectory matches authentic counting.' },
        { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary (obvious)', pass: true,
          note: 'No skip-clicking, no UI exploit detected.' },
        { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary (creative)', pass: true,
          note: 'No memorized-sequence pattern; pacing is human, not robotic.' },
      ],
    }
  }

  if (passedTeens && wrong >= 1 && wrong <= 4) {
    return {
      state: 'working',
      headline: 'Working on it',
      reasoning:
        'You moved through most of the count sequence with a few small slips. That is normal at this stage — it suggests partial mastery, not a misconception (rule R5).',
      ladder: [
        { stage: 'Stage 1 · Haiku', agent: 'The Critic (cheap filter)', pass: true,
          note: 'Several slips visible; partial-mastery pattern, not random.' },
        { stage: 'Stage 2 · Sonnet', agent: 'The Critic (deep)', pass: true,
          note: 'Slips clustered around tens-transitions — typical for emerging counters.' },
        { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary (obvious)', pass: true,
          note: 'No exploit pattern; slips look authentic.' },
        { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary (creative)', pass: true,
          note: 'No memorization shortcut; pacing varies naturally.' },
      ],
    }
  }

  if (wrong >= 3 && correct < 20) {
    return {
      state: 'misconception',
      headline: 'A specific misconception is showing',
      reasoning:
        'You counted some numbers in order then started skipping or going out of sequence. The pattern matches a known misconception around the count sequence — the guide should re-teach this with a number line and concrete objects (rule R7).',
      ladder: [
        { stage: 'Stage 1 · Haiku', agent: 'The Critic (cheap filter)', pass: true,
          note: 'Wrong-tap pattern matches an entry in the K.CC.A.1 misconception map.' },
        { stage: 'Stage 2 · Sonnet', agent: 'The Critic (deep)', pass: true,
          note: 'High wrong-rate after a short correct prefix — fits the count-sequence-instability misconception.' },
        { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary (obvious)', pass: true,
          note: 'Not random clicking — the early prefix shows real intent.' },
        { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary (creative)', pass: true,
          note: 'No exploit; the verdict is the misconception, not bad faith.' },
      ],
    }
  }

  // Default — short or ambiguous
  return {
    state: 'working',
    headline: 'A starting picture',
    reasoning: reachedTen
      ? 'You showed the start of the count sequence cleanly. A longer probe would tell us more — for the demo, the engine reads what you gave it (rule R1: process over outcome).'
      : 'A short trajectory — the engine logs every tap, with timing, and would normally probe further. For the demo, this is enough to show how the read-out works.',
    ladder: [
      { stage: 'Stage 1 · Haiku', agent: 'The Critic (cheap filter)', pass: true,
        note: 'Trajectory is short but coherent.' },
      { stage: 'Stage 2 · Sonnet', agent: 'The Critic (deep)', pass: true,
        note: 'Not enough variety yet to up- or down-grade the verdict (rule R10).' },
      { stage: 'Stage 3 · Haiku', agent: 'Shortcut Adversary (obvious)', pass: true,
        note: 'Nothing exploit-like in the taps.' },
      { stage: 'Stage 4 · Sonnet', agent: 'Shortcut Adversary (creative)', pass: true,
        note: 'No memorization or pacing artefact.' },
    ],
  }
}
