import Link from 'next/link'
import HundredBoard from './HundredBoard'

export const metadata = {
  title: 'A probe — Count to 100 — Stratamundo',
  description:
    'A clickable demo of one Stratamundo probe: tap numbers 1 to 100 in order. ' +
    'See what the engine reads from your trajectory.',
}

const C = {
  bg: '#F5F1E8',
  ink: '#1A1A1A',
  inkSoft: '#3D3A35',
  inkFaint: '#8A8580',
  accent: '#A14A2F',
  rule: 'rgba(26, 26, 26, 0.10)',
}
const SERIF = { fontFamily: 'var(--font-fraunces), Georgia, serif' }
const SANS = { fontFamily: 'var(--font-geist-sans), -apple-system, sans-serif' }

export default function ProbePage() {
  return (
    <main
      className="flex flex-1 flex-col"
      style={{ background: C.bg, color: C.ink }}
    >
      {/* HEADER */}
      <section>
        <div className="max-w-5xl mx-auto px-8 md:px-14 pt-14 pb-12">
          <Link
            href="/vision#atlas"
            className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{
              ...SANS,
              color: C.inkFaint,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            ← Back to the atlas
          </Link>

          <div className="mt-8">
            <div
              style={{
                ...SANS,
                color: C.inkFaint,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
              className="flex items-center gap-3"
            >
              <span aria-hidden style={{ display: 'inline-block', width: 18, height: 1, background: C.accent }} />
              <span>One probe · Demonstration</span>
            </div>

            <h1
              className="mt-5 max-w-[16ch]"
              style={{
                ...SERIF,
                fontWeight: 400,
                fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.025em',
                color: C.ink,
              }}
            >
              Count to 100 by ones and tens.
            </h1>

            <div
              className="mt-4"
              style={{
                ...SANS,
                color: C.inkFaint,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              K.CC.A.1 · Hundred-board count-trail
            </div>
          </div>

          <p
            style={{
              ...SERIF,
              color: C.inkSoft,
              fontStyle: 'italic',
              fontSize: 'clamp(1.1rem, 1.6vw, 1.35rem)',
              lineHeight: 1.55,
            }}
            className="mt-10 max-w-[60ch]"
          >
            This is what one probe will feel like. Tap a few numbers in order, then press{' '}
            <span style={{ color: C.accent, fontStyle: 'normal' }}>Done</span>. The engine
            reads your trajectory &mdash; not just whether you got things right &mdash; and
            shows what it would write into the mastery passport.
          </p>
        </div>
      </section>

      <Rule />

      {/* WORKSPACE */}
      <section>
        <div className="max-w-4xl mx-auto px-8 md:px-14 py-14">
          <HundredBoard />
        </div>
      </section>

      <Rule />

      {/* CONTEXT — three principles */}
      <section>
        <div className="max-w-5xl mx-auto px-8 md:px-14 py-24">
          <div
            style={{
              ...SANS,
              color: C.inkFaint,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
            className="flex items-center gap-3"
          >
            <span aria-hidden style={{ display: 'inline-block', width: 18, height: 1, background: C.accent }} />
            <span>Why a probe is not a test</span>
          </div>

          <h2
            className="mt-5 max-w-[20ch]"
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
          >
            The trajectory tells the truth.
          </h2>

          <div className="mt-14 grid gap-12 md:grid-cols-3">
            {[
              {
                title: 'Every tap is logged.',
                body:
                  'Number, time-since-start, and whether it was the next expected number. Not the answer — the trajectory.',
              },
              {
                title: 'Self-correction is mastery.',
                body:
                  'A learner who slips on 13, notices, and continues with 14 shows mastery. Not a deduction.',
              },
              {
                title: 'Fast and right is fluency.',
                body:
                  'Speed is never penalized. Only fast-and-wrong counts as a guessing signal.',
              },
            ].map((c, i) => (
              <article key={i}>
                <h3
                  style={{
                    ...SERIF,
                    fontWeight: 400,
                    fontSize: 'clamp(1.2rem, 1.8vw, 1.5rem)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    color: C.ink,
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    ...SANS,
                    color: C.inkSoft,
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                  className="mt-3"
                >
                  {c.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-16">
            <Link
              href="/vision#atlas"
              className="inline-flex items-center px-6 py-3 transition-colors"
              style={{
                ...SANS,
                color: C.ink,
                border: `1px solid ${C.ink}`,
                fontSize: 12,
                letterSpacing: '0.18em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              ← Explore other constellations
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function Rule() {
  return (
    <div
      aria-hidden
      style={{ height: 1, background: C.rule }}
      className="mx-8 md:mx-14"
    />
  )
}
