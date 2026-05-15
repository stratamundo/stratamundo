import Link from 'next/link'
import Image from 'next/image'
import { Gear, OrnamentalRule, CornerFlourish } from '../Ornament'
import { getConstellations } from '../../lib/k2-atlas'
import AtlasMap from './AtlasMap'

export const metadata = {
  title: 'The Star Atlas Library — Strata Mundo',
  description:
    'A K-2 math mastery assessment, reimagined as an immersive steampunk library. ' +
    'Every standard is a star. Every probe is grounded in research. Every result becomes a passport into Math Games Builder.',
}

export default function VisionPage() {
  const constellations = getConstellations()
  const totalStars = constellations.reduce((n, c) => n + c.stars.length, 0)

  return (
    <main className="flex flex-1 flex-col bg-background">

      {/* ==================================================================
          HERO — full-bleed cloudscape, brass orrery, hero wordmark
      ================================================================== */}
      <section className="relative overflow-hidden border-b-2 border-brass-deep">
        <div className="absolute inset-0 vignette">
          <Image
            src="/images/cloudscape-denis.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center top, oklch(0.18 0.020 55 / 0.4) 0%, oklch(0.13 0.014 50 / 0.85) 70%), linear-gradient(180deg, oklch(0.13 0.014 50 / 0.4) 0%, oklch(0.13 0.014 50 / 0.95) 100%)',
            }}
          />
        </div>

        {/* Decorative gears */}
        <div className="absolute top-16 right-16 hidden md:block text-brass-deep animate-turn-slow-reverse pointer-events-none">
          <Gear className="h-32 w-32 opacity-60" teeth={12} />
        </div>
        <div className="absolute top-32 right-44 hidden md:block text-copper animate-turn-slow pointer-events-none">
          <Gear className="h-20 w-20 opacity-70" teeth={10} />
        </div>
        <div className="absolute bottom-16 left-16 hidden md:block text-brass-deep animate-turn-slow pointer-events-none">
          <Gear className="h-28 w-28 opacity-50" teeth={14} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          <div
            className="text-brass tracking-[0.35em] uppercase text-xs mb-6"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            A New Vision · Coming to Strata Mundo
          </div>

          <h1
            className="text-cream"
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontWeight: 700,
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              letterSpacing: '0.06em',
              textShadow:
                '0 0 24px oklch(0.74 0.14 80 / 0.35), 0 4px 18px oklch(0 0 0 / 0.6)',
            }}
          >
            The Star Atlas
            <br />
            Library
          </h1>

          <div className="my-8 flex justify-center text-brass-deep">
            <OrnamentalRule className="h-6 w-72" />
          </div>

          <p
            className="text-cream-soft max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-eb)',
              fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
              fontStyle: 'italic',
              lineHeight: 1.55,
            }}
          >
            A thorough K-2 math mastery assessment, reimagined as an immersive
            steampunk library. Every standard is a star. Every probe reads the
            learner&rsquo;s reasoning, not just their answer. Every result becomes
            a passport into the larger math universe.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <a
              href="#atlas"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brass bg-brass/10 text-brass-glow hover:bg-brass/20 hover:border-brass-glow transition-colors uppercase text-xs tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              <Gear className="h-4 w-4" teeth={10} />
              Explore the atlas
            </a>
            <a
              href="#flow"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass transition-colors uppercase text-xs tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              See the journey
            </a>
          </div>

          {/* tiny stats line */}
          <div
            className="mt-16 text-cream-faint text-xs uppercase tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            {totalStars} standards · {constellations.length} constellations · K through grade 2 + the bridge to multiplication
          </div>
        </div>
      </section>

      {/* ==================================================================
          THE PROMISE
      ================================================================== */}
      <section className="relative bg-background border-b border-brass-deep/30">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div
            className="text-brass uppercase tracking-[0.3em] text-xs mb-4"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            The Promise
          </div>
          <p
            className="text-cream"
            style={{
              fontFamily: 'var(--font-eb)',
              fontSize: 'clamp(1.25rem, 2.5vw, 1.8rem)',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            Tell a homeschool guide or microschool teacher exactly{' '}
            <span className="text-brass-glow not-italic">what their learner understands</span>,{' '}
            <span className="text-brass-glow not-italic">what they don&rsquo;t</span>, and{' '}
            <span className="text-brass-glow not-italic">what to do about it</span> &mdash;
            in fifteen minutes, without a test that feels like a test.
          </p>
        </div>
      </section>

      {/* ==================================================================
          THE FLOW — five steps
      ================================================================== */}
      <section id="flow" className="relative bg-background border-b border-brass-deep/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div
              className="text-brass uppercase tracking-[0.3em] text-xs mb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              The Voyage
            </div>
            <h2
              className="text-cream"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              Five steps from arrival to passport
            </h2>
            <div className="mt-6 flex justify-center text-brass-deep">
              <OrnamentalRule className="h-5 w-64" />
            </div>
          </div>

          <ol className="grid gap-6 md:grid-cols-5">
            {[
              {
                roman: 'I',
                title: 'Enter the library',
                body: 'A warm steampunk reading room. A brass star atlas on the central table. The learner is greeted, not graded.',
              },
              {
                roman: 'II',
                title: 'Pick a probe card',
                body: 'The atlas highlights the next standard. The learner walks to the matching shelf and lifts a brass-trimmed card.',
              },
              {
                roman: 'III',
                title: 'Reason inside a probe',
                body: 'A 60-to-90-second instrumented mechanic. Telemetry watches every placement, every reset — the trajectory, not just the answer.',
              },
              {
                roman: 'IV',
                title: 'The atlas updates',
                body: 'The probed star turns gold. The voyage continues along the prerequisite chain. The session ends naturally when mastery thins out.',
              },
              {
                roman: 'V',
                title: 'Carry the passport',
                body: 'A mastery passport drops into the learner’s pocket. When they enter Math Games Builder next, the galaxy already knows them.',
              },
            ].map((step, i) => (
              <li key={i} className="relative">
                <article className="relative h-full p-5 border border-brass-deep/60 bg-background/60 backdrop-blur-sm">
                  <CornerFlourish corner="tl" className="absolute -top-1 -left-1 h-5 w-5 text-brass" />
                  <CornerFlourish corner="tr" className="absolute -top-1 -right-1 h-5 w-5 text-brass" />
                  <CornerFlourish corner="bl" className="absolute -bottom-1 -left-1 h-5 w-5 text-brass" />
                  <CornerFlourish corner="br" className="absolute -bottom-1 -right-1 h-5 w-5 text-brass" />

                  <div
                    className="text-brass-glow text-3xl mb-3"
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {step.roman}
                  </div>
                  <h3
                    className="text-cream mb-2 text-base"
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-cream-soft text-sm leading-relaxed"
                    style={{ fontFamily: 'var(--font-eb)' }}
                  >
                    {step.body}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ==================================================================
          THE ATLAS — interactive constellation map
      ================================================================== */}
      <section id="atlas" className="relative bg-background border-b border-brass-deep/30">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <div
              className="text-brass uppercase tracking-[0.3em] text-xs mb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              The Atlas
            </div>
            <h2
              className="text-cream"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              {totalStars} stars · {constellations.length} constellations
            </h2>
            <p
              className="mt-4 text-cream-soft max-w-2xl mx-auto text-sm"
              style={{ fontFamily: 'var(--font-eb)', fontStyle: 'italic' }}
            >
              Every Common Core standard from kindergarten through second grade,
              plus the bridge into third-grade multiplication.{' '}
              <span className="text-brass-glow not-italic">
                Tap any star
              </span>{' '}
              to see how we will measure that piece of mathematics.
            </p>
          </div>

          <div className="border-2 border-brass-deep/60 bg-background p-3 md:p-6"
            style={{
              boxShadow:
                'inset 0 0 80px oklch(0 0 0 / 0.6), 0 8px 30px oklch(0 0 0 / 0.4)',
            }}
          >
            <AtlasMap constellations={constellations} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-cream-faint text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-cinzel)' }}>
            <Legend color="oklch(0.86 0.16 88)" label="Kindergarten" />
            <Legend color="oklch(0.74 0.14 80)" label="Grade 1" />
            <Legend color="oklch(0.62 0.16 42)" label="Grade 2" />
            <Legend color="oklch(0.55 0.12 70)" label="Bridge to grade 3" />
          </div>
        </div>
      </section>

      {/* ==================================================================
          THE ENGINE — agent stack in plain words
      ================================================================== */}
      <section className="relative bg-background border-b border-brass-deep/30">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div
              className="text-brass uppercase tracking-[0.3em] text-xs mb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              The Engine
            </div>
            <h2
              className="text-cream"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              Why this is hard to fool
            </h2>
            <div className="mt-6 flex justify-center text-brass-deep">
              <OrnamentalRule className="h-5 w-64" />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <EngineCard
              eyebrow="Telemetry, not multiple choice"
              title="The trajectory tells the truth"
              body="Most diagnostics ask 'right or wrong.' We watch how the learner reasons. A child who tries one approach, resets, and tries another shows mastery. A child who clicks fast and wrong shows guessing. A child who clicks fast and right shows fluency — never penalized."
            />
            <EngineCard
              eyebrow="A four-stage AI ladder"
              title="Every mastery claim is checked"
              body="When the assessment finishes, four AI agents review the verdict in sequence: a Critic asks if the call is defensible from the data; a Shortcut Adversary tries to prove the learner faked it. Both run in fast and deep passes. If anyone disagrees, the verdict downgrades — never upgrades."
            />
            <EngineCard
              eyebrow="Built on research, not opinion"
              title="Every probe is a research artifact"
              body="Before any probe ships, three more agents review it: Mr. Chesure checks that it actually tests the standard it claims to. The Equity Reviewer checks for English-Learner accessibility and stereotype-threat traps. The External Reviewer hunts for what our other agents missed."
            />
            <EngineCard
              eyebrow="Carries forward, never gates"
              title="A passport, not a permission slip"
              body="The result is a JSON passport — a small living map of what the learner knows. It flows into Math Games Builder, lights up the moons they've mastered, opens what's next. It never locks anything. The guide always drives. The kid always plays."
            />
          </div>
        </div>
      </section>

      {/* ==================================================================
          AFTER THE PASSPORT — practice
      ================================================================== */}
      <section className="relative bg-background border-b border-brass-deep/30">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <div
              className="text-brass uppercase tracking-[0.3em] text-xs mb-3"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              After the Atlas
            </div>
            <h2
              className="text-cream"
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              The fun door comes first
            </h2>
            <p
              className="mt-4 text-cream-soft max-w-2xl mx-auto text-sm"
              style={{ fontFamily: 'var(--font-eb)', fontStyle: 'italic' }}
            >
              When a standard is flagged, the learner sees a game first — built by older
              learners in Math Games Builder. If they can win it, that&rsquo;s real evidence
              of learning. If they can&rsquo;t, the difficulty becomes the motivation to try
              the curated practice that the guide picks from a vetted library.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <PracticeCard
              tier="I"
              tag="The fun door"
              title="A Math Games Builder game"
              body="A peer-built game targeting that standard. No gating — play it whenever. Winning is real evidence. Losing is real motivation."
            />
            <PracticeCard
              tier="II"
              tag="The curated library"
              title="Khan, PhET, MLC, Montessori"
              body="A vetted menu of trusted resources tagged by misconception and modality. The guide picks. Concrete, then representational, then abstract."
            />
            <PracticeCard
              tier="III"
              tag="Community contributions"
              title="Activities from other guides"
              body="Other guides submit what worked for them. AI vets, Equity Reviewer screens, a human approves. The library grows with the network."
            />
          </div>
        </div>
      </section>

      {/* ==================================================================
          CTA — link to existing experience
      ================================================================== */}
      <section className="relative bg-background">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="flex justify-center text-brass-deep mb-6">
            <Gear className="h-16 w-16 animate-turn-slow" teeth={12} />
          </div>
          <h2
            className="text-cream mb-4"
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            See what we have today
          </h2>
          <p
            className="text-cream-soft max-w-2xl mx-auto mb-10 text-base"
            style={{ fontFamily: 'var(--font-eb)', fontStyle: 'italic' }}
          >
            The current Strata Mundo is a working diagnostic for grade 3-4 fractions
            &mdash; the proof of concept that the trajectory-as-truth idea works.
            The K-2 atlas above is what comes next.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brass bg-brass text-brass-fg hover:bg-brass-glow hover:border-brass-glow transition-colors uppercase text-xs tracking-[0.2em] font-bold"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Try the fractions diagnostic
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass transition-colors uppercase text-xs tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              How we measure mastery
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brass-deep text-cream-soft hover:text-brass-glow hover:border-brass transition-colors uppercase text-xs tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  )
}

function EngineCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <article className="relative p-6 border border-brass-deep/60 bg-background/60">
      <CornerFlourish corner="tl" className="absolute -top-1 -left-1 h-5 w-5 text-brass" />
      <CornerFlourish corner="tr" className="absolute -top-1 -right-1 h-5 w-5 text-brass" />
      <CornerFlourish corner="bl" className="absolute -bottom-1 -left-1 h-5 w-5 text-brass" />
      <CornerFlourish corner="br" className="absolute -bottom-1 -right-1 h-5 w-5 text-brass" />
      <div
        className="text-brass uppercase tracking-[0.25em] text-xs mb-2"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        {eyebrow}
      </div>
      <h3
        className="text-brass-glow mb-3"
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '1.15rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </h3>
      <p
        className="text-cream-soft text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-eb)' }}
      >
        {body}
      </p>
    </article>
  )
}

function PracticeCard({
  tier,
  tag,
  title,
  body,
}: {
  tier: string
  tag: string
  title: string
  body: string
}) {
  return (
    <article className="relative p-6 border border-brass-deep/60 bg-background/40 text-center">
      <div
        className="text-brass-glow text-2xl mb-2"
        style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 700 }}
      >
        {tier}
      </div>
      <div
        className="text-brass uppercase tracking-[0.22em] text-[10px] mb-2"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        {tag}
      </div>
      <h3
        className="text-cream mb-3 text-base"
        style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 600, letterSpacing: '0.08em' }}
      >
        {title}
      </h3>
      <p
        className="text-cream-soft text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-eb)' }}
      >
        {body}
      </p>
    </article>
  )
}
