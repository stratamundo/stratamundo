import Link from 'next/link'
import { Gear, OrnamentalRule } from '../../../Ornament'
import HundredBoard from './HundredBoard'

export const metadata = {
  title: 'A probe — K.CC.A.1 — Strata Mundo',
  description:
    'A clickable demo of a single Strata Mundo probe: K.CC.A.1, count to 100. ' +
    'Tap numbers in order on a brass hundred-board; see what the engine reads.',
}

export default function ProbePage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      {/* HEADER */}
      <section className="relative border-b-2 border-brass-deep">
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-8">
          <Link
            href="/vision#atlas"
            className="inline-flex items-center gap-2 text-cream-faint hover:text-brass-glow transition-colors uppercase text-[10px] tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            ← Back to the atlas
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <Gear
              className="h-12 w-12 text-brass-glow animate-turn-slow drop-shadow-[0_0_8px_oklch(0.86_0.16_88/0.4)] hidden sm:block"
              teeth={12}
            />
            <div>
              <div
                className="text-brass uppercase tracking-[0.3em] text-[10px]"
                style={{ fontFamily: 'var(--font-cinzel)' }}
              >
                A Single Probe · Demonstration
              </div>
              <h1
                className="text-cream mt-1"
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  lineHeight: 1.1,
                }}
              >
                Count to 100 by ones and tens
              </h1>
              <div
                className="mt-2 text-cream-faint uppercase"
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: 10,
                  letterSpacing: '0.28em',
                }}
              >
                K.CC.A.1 · Hundred-board count-trail
              </div>
            </div>
          </div>

          <p
            className="mt-5 text-cream-soft max-w-3xl text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-eb)', fontStyle: 'italic' }}
          >
            This is what one probe in The Star Atlas Library will feel like. Tap a few
            numbers in order, then press <span className="text-brass-glow not-italic">Done</span>.
            The engine reads your trajectory &mdash; not just whether you got things right
            &mdash; and shows what it would write into the mastery passport.
          </p>
        </div>
      </section>

      {/* WORKSPACE */}
      <section className="relative bg-background border-b border-brass-deep/30">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <HundredBoard />
        </div>
      </section>

      {/* CONTEXT — what makes this different */}
      <section className="relative bg-background">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div
              className="text-brass uppercase tracking-[0.3em] text-[10px] mb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Why a Probe Is Not a Test
            </div>
            <h2
              className="text-cream"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              The trajectory tells the truth
            </h2>
            <div className="mt-5 flex justify-center text-brass-deep">
              <OrnamentalRule className="h-5 w-56" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Every tap is logged',
                body:
                  'Number, time-since-start, and whether it was the next expected number. Not the answer — the trajectory.',
              },
              {
                title: 'Self-correction is mastery',
                body:
                  'A learner who slips on 13, notices, and continues with 14 shows mastery — not a deduction. (Rule R3.)',
              },
              {
                title: 'Fast and right is fluency',
                body:
                  'Speed is never penalized. Only fast-and-wrong counts as a guessing signal. (Rule R6.)',
              },
            ].map((c, i) => (
              <article
                key={i}
                className="p-5 border border-brass-deep/60 bg-background/60"
              >
                <h3
                  className="text-brass-glow text-sm mb-2"
                  style={{
                    fontFamily: 'var(--font-cinzel)',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                  }}
                >
                  {c.title}
                </h3>
                <p
                  className="text-cream-soft text-sm leading-relaxed"
                  style={{ fontFamily: 'var(--font-eb)' }}
                >
                  {c.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/vision#atlas"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass transition-colors uppercase text-xs tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              ← Explore other constellations
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
