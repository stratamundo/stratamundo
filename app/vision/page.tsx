import Link from 'next/link'
import { getConstellations } from '../../lib/k2-atlas'
import AtlasMap from './AtlasMap'

export const metadata = {
  title: 'Stratamundo — A different way to learn math',
  description:
    'Stratamundo is a stack: math diagnosis using telemetry, a community library seeded with Khan and Montessori, and a tailored plan. Then older learners building for younger. Then reverse-engineered paths.',
}

/* Pitch palette — matches the Day-80 deck. Editorial, warm cream paper,
   Fraunces + Geist, single terracotta accent. */
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

export default function VisionPage() {
  const constellations = getConstellations()
  const totalStars = constellations.reduce((n, c) => n + c.stars.length, 0)

  return (
    <main
      className="flex flex-1 flex-col"
      style={{ background: C.bg, color: C.ink }}
    >

      {/* ==================================================================
          HERO — cover slide
      ================================================================== */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-8 md:px-14 pt-28 pb-24">
          <Eyebrow>Stratamundo · Worldwide Venture Fellowship</Eyebrow>

          <h1
            style={{
              ...SERIF,
              fontWeight: 300,
              fontSize: 'clamp(3.5rem, 9vw, 8rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: C.ink,
              fontVariationSettings: '"opsz" 96, "SOFT" 50',
            }}
            className="mt-6"
          >
            Stratamundo
          </h1>

          <p
            style={{
              ...SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(1.4rem, 2.4vw, 2.2rem)',
              lineHeight: 1.3,
              color: C.ink,
              letterSpacing: '-0.01em',
            }}
            className="mt-8 max-w-3xl"
          >
            A different way to learn math.
          </p>

          <ul
            style={{ ...SANS, color: C.inkSoft }}
            className="mt-10 space-y-2 text-sm md:text-base"
          >
            <li>Barbara Jauregui Wurst &middot; Acton Academy Falls Church</li>
            <li>Day 80 of 100</li>
          </ul>

          <div className="mt-14 flex flex-wrap gap-4">
            <PrimaryLink href="#stack">See the stack</PrimaryLink>
            <SecondaryLink href="#atlas">Try the diagnosis</SecondaryLink>
          </div>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          THE PROBLEM — statement slide
      ================================================================== */}
      <section>
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>The problem</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
            className="mt-4 max-w-[18ch]"
          >
            Most kids hate math by accident.
          </h2>

          <ul className="mt-12 max-w-[70ch]">
            {[
              'Not because math is hard.',
              'Because no one connects it to what they actually care about.',
              'School teaches math abstract, in isolation, decontextualized.',
              'The "why" shows up twenty years later, if at all.',
              'By then most kids have decided they are not math people.',
            ].map((line, i) => (
              <ListLine key={i}>{line}</ListLine>
            ))}
          </ul>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          THE BROTHER — transition narrative
      ================================================================== */}
      <section>
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>The story</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(2.6rem, 7vw, 6rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: C.ink,
            }}
            className="mt-4 max-w-[20ch]"
          >
            Imagine my brother at ten.
          </h2>

          <div
            style={{ ...SERIF, color: C.inkSoft }}
            className="mt-12 max-w-[60ch] space-y-6 text-lg md:text-xl leading-relaxed"
          >
            <p>
              He hated math. He spent twelve years deciding he was not a math
              person. He grew up to build supercars &mdash; the kind of work
              that is math, top to bottom.
            </p>
            <p>
              He still resents that nobody ever connected the two.
            </p>
            <p style={{ color: C.ink }}>
              Stratamundo is what would have caught him at ten.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          THE STACK — 4 stages
      ================================================================== */}
      <section id="stack">
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>The roadmap</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
            className="mt-4 max-w-[20ch]"
          >
            Stratamundo is a stack.
          </h2>

          <p
            style={{ ...SANS, color: C.inkFaint }}
            className="mt-6 max-w-[60ch] text-base md:text-lg leading-relaxed"
          >
            Each stage unlocks the next &mdash; not four scattered ideas.
          </p>

          <ol className="mt-14 space-y-0">
            <StackStage
              tag="Today"
              title="Diagnosis, library, plan."
              body="Math diagnosis using telemetry and a misconceptions map. A community library seeded with Khan and Montessori, grown by guides, teachers, and parents. A tailored plan that draws from the library, tagged by math standard."
              actionLabel="Try the diagnosis"
              actionHref="#atlas"
            />
            <StackStage
              tag="Next"
              title="Older learners build for younger."
              body="Older learners build math games for younger ones. They solidify their own understanding by teaching &mdash; the protégé effect, one of the most robust findings in educational psychology."
            />
            <StackStage
              tag="Then"
              title="Reverse-engineered paths."
              body="A kid says: I want to build a supercar. Stratamundo maps the math concepts as steps toward that goal. Math becomes the path, not the wall."
            />
            <StackStage
              tag="The vision"
              title="Every kid starts with their supercar."
              body="The whole product, end to end: every learner enters with what they actually care about, and math meets them there."
              isLast
            />
          </ol>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          THE ATLAS — interactive piece (Today, working)
      ================================================================== */}
      <section id="atlas">
        <div className="max-w-7xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>What is working today</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.4rem, 5.5vw, 5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
            className="mt-4 max-w-[22ch]"
          >
            A diagnosis that reads how a kid thinks &mdash; not just what they answer.
          </h2>

          <div
            style={{ ...SERIF, color: C.inkSoft, fontStyle: 'italic' }}
            className="mt-8 max-w-[60ch] text-lg md:text-xl leading-relaxed"
          >
            <p>
              Every standard from kindergarten through second grade, plus the
              bridge to multiplication. {totalStars} in all, mapped as stars in
              {' '}{constellations.length} constellations.
            </p>
            <p
              style={{ fontStyle: 'normal', color: C.ink }}
              className="mt-6 not-italic"
            >
              Tap any star to see how we will measure that piece of mathematics.
              Or{' '}
              <Link
                href="/vision/probe/k-cc-a-1"
                className="underline underline-offset-4"
                style={{ color: C.accent, textDecorationColor: C.accent }}
              >
                try a working probe
              </Link>{' '}
              for the brightest one.
            </p>
          </div>

          <div
            className="mt-14 p-2 md:p-4"
            style={{
              background: '#FBF8F0',
              border: `1px solid ${C.rule}`,
            }}
          >
            <AtlasMap constellations={constellations} />
          </div>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.2em]"
            style={{ ...SANS, color: C.inkFaint, letterSpacing: '0.22em' }}
          >
            <Legend color={C.accent} label="Kindergarten" alpha={1} />
            <Legend color={C.accent} label="Grade 1" alpha={0.75} />
            <Legend color={C.accent} label="Grade 2" alpha={0.5} />
            <Legend color={C.accent} label="Bridge to grade 3" alpha={0.3} />
          </div>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          WHY THIS IS HARD TO FOOL — engine
      ================================================================== */}
      <section>
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>The engine</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.4rem, 5.5vw, 5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
            className="mt-4 max-w-[18ch]"
          >
            Why this is hard to fool.
          </h2>

          <div className="mt-14 grid gap-12 md:grid-cols-2 max-w-5xl">
            <EngineBlock
              tag="Telemetry, not multiple choice"
              title="The trajectory tells the truth."
              body="Most diagnostics ask right or wrong. Stratamundo watches how the learner reasons. A child who tries one approach, resets, and tries another shows mastery. A child who clicks fast and right shows fluency &mdash; never penalized. A child who clicks fast and wrong shows guessing."
            />
            <EngineBlock
              tag="A four-stage AI ladder"
              title="Every mastery claim is checked."
              body="When the assessment finishes, four AI agents review the verdict. A Critic asks if the call is defensible from the data. A Shortcut Adversary tries to prove the learner faked it. Both run in fast and deep passes. If any disagrees, the verdict downgrades &mdash; never upgrades."
            />
            <EngineBlock
              tag="Built on research, not opinion"
              title="Every probe is a research artifact."
              body="Before any probe ships, three more agents review it. One checks that it actually tests the standard it claims to. One checks for English-Learner accessibility and stereotype-threat traps. One hunts for what our other agents missed."
            />
            <EngineBlock
              tag="Carries forward, never gates"
              title="A passport, not a permission slip."
              body="The result is a small living map of what the learner knows. It carries forward into everything else they do. It never locks anything. The guide always drives. The kid always plays."
            />
          </div>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          DAY 70 OF 100 — where I am
      ================================================================== */}
      <section>
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>Where I am</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
            className="mt-4 max-w-[18ch]"
          >
            Day 80 of 100.
          </h2>

          <ul className="mt-12 max-w-[70ch]">
            <ListLine>
              Working end-to-end today: <em style={SERIF}>community library</em> and{' '}
              <em style={SERIF}>AI plan generation</em>.
            </ListLine>
            <ListLine>
              Rough today: the assessment &mdash; <em style={SERIF}>being rebuilt with proper pedagogy</em>.
            </ListLine>
            <ListLine>One pilot school: Acton Academy Falls Church.</ListLine>
            <ListLine>
              Next 30 days: ground the mastery claim in research, ship a robust
              assessment, prototype the first applied-math path.
            </ListLine>
            <ListLine>
              Personal arc: came in as the hustler, leaving as a builder.
            </ListLine>
          </ul>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          THE ASK
      ================================================================== */}
      <section>
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-28">
          <Eyebrow>The ask</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}
            className="mt-4 max-w-[18ch]"
          >
            Pressure-test me.
          </h2>

          <ul className="mt-12 max-w-[70ch]">
            <ListLine>Real pitch in two weeks.</ListLine>
            <ListLine>What is strong, what is weak, where the story is muddy.</ListLine>
            <ListLine>Where the math claim is shaky.</ListLine>
          </ul>
        </div>
      </section>

      <Rule />

      {/* ==================================================================
          CLOSE
      ================================================================== */}
      <section>
        <div className="max-w-6xl mx-auto px-8 md:px-14 py-32">
          <Eyebrow>Close</Eyebrow>
          <AccentRule />
          <h2
            style={{
              ...SERIF,
              fontWeight: 400,
              fontSize: 'clamp(2.6rem, 6.5vw, 6rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: C.ink,
            }}
            className="mt-4 max-w-[16ch]"
          >
            No kid should hate math by accident.
          </h2>

          <div
            style={{ ...SERIF, color: C.inkSoft }}
            className="mt-12 max-w-[60ch] space-y-5 text-lg md:text-xl leading-relaxed"
          >
            <p>The kid in my brother grew up to build supercars.</p>
            <p>He still resents that he hated math for twelve years.</p>
            <p style={{ color: C.ink }}>Help me make sure no other kid does.</p>
          </div>

          <div className="mt-16 flex flex-wrap gap-4">
            <PrimaryLink href="/setup">See the live diagnostic</PrimaryLink>
            <SecondaryLink href="/methodology">How we measure mastery</SecondaryLink>
            <SecondaryLink href="/">Back to home</SecondaryLink>
          </div>
        </div>
      </section>
    </main>
  )
}

/* ====================================================================
   Reusable bits — kept inline so the page reads top-to-bottom.
   ==================================================================== */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...SANS,
        color: C.inkFaint,
        fontWeight: 500,
        letterSpacing: '0.22em',
        fontSize: 11,
        textTransform: 'uppercase',
      }}
      className="flex items-center gap-3"
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 18,
          height: 1,
          background: C.accent,
        }}
      />
      <span>{children}</span>
    </div>
  )
}

function AccentRule() {
  return (
    <div
      aria-hidden
      className="mt-10"
      style={{ width: 48, height: 2, background: C.accent }}
    />
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

function ListLine({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        ...SANS,
        color: C.inkSoft,
        borderTop: `1px solid ${C.rule}`,
        letterSpacing: '-0.005em',
        fontSize: 'clamp(0.95rem, 1.2vw, 1.15rem)',
        lineHeight: 1.6,
      }}
      className="py-4 last:border-b"
    >
      {children}
    </li>
  )
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http')
  const isHash = href.startsWith('#')
  const cls = 'inline-flex items-center px-6 py-3 transition-opacity hover:opacity-85'
  const style = {
    ...SANS,
    background: C.accent,
    color: C.bg,
    fontSize: 12,
    letterSpacing: '0.18em',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  }
  if (isHash || isExternal) {
    return <a href={href} className={cls} style={style}>{children}</a>
  }
  return <Link href={href} className={cls} style={style}>{children}</Link>
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isHash = href.startsWith('#')
  const cls = 'inline-flex items-center px-6 py-3 transition-colors'
  const style = {
    ...SANS,
    color: C.ink,
    border: `1px solid ${C.ink}`,
    fontSize: 12,
    letterSpacing: '0.18em',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  }
  if (isHash) return <a href={href} className={cls} style={style}>{children}</a>
  return <Link href={href} className={cls} style={style}>{children}</Link>
}

function StackStage({
  tag,
  title,
  body,
  actionLabel,
  actionHref,
  isLast,
}: {
  tag: string
  title: string
  body: string
  actionLabel?: string
  actionHref?: string
  isLast?: boolean
}) {
  return (
    <li
      style={{
        borderTop: `1px solid ${C.rule}`,
        borderBottom: isLast ? `1px solid ${C.rule}` : 'none',
      }}
      className="py-10 grid gap-6 md:grid-cols-[180px_1fr]"
    >
      <div>
        <div
          style={{
            ...SANS,
            color: C.accent,
            fontWeight: 500,
            letterSpacing: '0.22em',
            fontSize: 11,
            textTransform: 'uppercase',
          }}
        >
          {tag}
        </div>
      </div>
      <div>
        <h3
          style={{
            ...SERIF,
            fontWeight: 400,
            fontSize: 'clamp(1.5rem, 2.4vw, 2rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: C.ink,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            ...SANS,
            color: C.inkSoft,
            fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
            lineHeight: 1.6,
          }}
          className="mt-4 max-w-[60ch]"
        >
          {body}
        </p>
        {actionHref && actionLabel && (
          <div className="mt-5">
            <a
              href={actionHref}
              style={{
                ...SANS,
                color: C.accent,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 500,
                borderBottom: `1px solid ${C.accent}`,
                paddingBottom: 2,
              }}
              className="inline-block hover:opacity-75 transition-opacity"
            >
              {actionLabel} →
            </a>
          </div>
        )}
      </div>
    </li>
  )
}

function EngineBlock({
  tag,
  title,
  body,
}: {
  tag: string
  title: string
  body: string
}) {
  return (
    <article>
      <div
        style={{
          ...SANS,
          color: C.accent,
          fontWeight: 500,
          letterSpacing: '0.22em',
          fontSize: 11,
          textTransform: 'uppercase',
        }}
      >
        {tag}
      </div>
      <h3
        style={{
          ...SERIF,
          fontWeight: 400,
          fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: C.ink,
        }}
        className="mt-3"
      >
        {title}
      </h3>
      <p
        style={{
          ...SANS,
          color: C.inkSoft,
          fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
          lineHeight: 1.6,
        }}
        className="mt-4"
      >
        {body}
      </p>
    </article>
  )
}

function Legend({ color, label, alpha = 1 }: { color: string; label: string; alpha?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color, opacity: alpha }}
      />
      {label}
    </span>
  )
}
