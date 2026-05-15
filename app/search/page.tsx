import Image from 'next/image'
import Link from 'next/link'
import SearchInput from './SearchInput'
import { CornerFlourish, OrnamentalRule } from '@/app/Ornament'
import { createClient } from '@/lib/supabase/server'
import coherenceMapRaw from '@/content/coherence-map-fractions.json'
import resourcesRaw from '@/content/fractions-resources.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'

export const metadata = {
  title: 'Search · Strata Mundo',
  description: 'Search activities, math standards, and contributors across Strata Mundo.',
}

interface CoherenceNode {
  id: string
  name: string
  statement: string
  grade: number
  domain: string
}
const coherenceMap = coherenceMapRaw as unknown as { nodes: CoherenceNode[] }

interface CuratedResource {
  id: string
  title: string
  modality: string
  source_site?: string
  url?: string | null
  duration_minutes?: number
  notes?: string
  misconception_ids?: string[]
}

/** Trim a long usage note down to a single visible line on the card.
 *  Keeps full sentences when possible; falls back to a hard char cut. */
function clipNote(note: string | undefined | null, maxLen = 180): string | null {
  if (!note) return null
  const trimmed = note.trim()
  if (trimmed.length <= maxLen) return trimmed
  const firstSentence = trimmed.match(/^[^.!?]*[.!?]/)
  if (firstSentence && firstSentence[0].length <= maxLen + 40) {
    return firstSentence[0].trim()
  }
  return trimmed.slice(0, maxLen).trimEnd() + '…'
}
const curatedResources = resourcesRaw as unknown as { resources: CuratedResource[] }

interface Misconception {
  id: string
  name: string
}
const misconceptions = misconceptionsRaw as unknown as { misconceptions: Misconception[] }
const MISCONCEPTION_BY_ID = new Map(
  misconceptions.misconceptions.map((m) => [m.id, m] as const),
)
function misconceptionName(id: string): string {
  return MISCONCEPTION_BY_ID.get(id)?.name ?? id
}

interface CommunitySubmission {
  id: string
  title: string
  description: string
  modality: string
  url: string | null
  source_site: string | null
  duration_minutes: number | null
  standard_ids: string[]
  misconception_ids: string[] | null
  research_basis: string | null
  contributor_name: string
}

interface PageProps {
  searchParams: Promise<{ q?: string; m?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: rawQ, m: rawM } = await searchParams
  const q = (rawQ ?? '').trim()
  const lower = q.toLowerCase()
  // Selected misconception filter (single, toggleable). Validated against
  // the known misconception list so a stray URL param doesn't poison the page.
  const selectedMisconception =
    rawM && MISCONCEPTION_BY_ID.has(rawM) ? rawM : null

  const hasFilter = q.length > 0 || selectedMisconception !== null

  // Fetch approved community submissions (these are the only public ones).
  let community: CommunitySubmission[] = []
  if (hasFilter) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('activity_submissions')
      .select(
        'id, title, description, modality, url, source_site, duration_minutes, standard_ids, misconception_ids, research_basis, contributor_name',
      )
      .eq('status', 'human_approved')
      .limit(200)
    if (Array.isArray(data)) {
      community = data as CommunitySubmission[]
    }
  }

  // Text matches the user typed
  function matchesText(haystacks: (string | null | undefined)[]): boolean {
    if (q.length === 0) return true
    return haystacks.some((h) => (h ?? '').toLowerCase().includes(lower))
  }
  function matchesMisconception(ids: string[] | null | undefined): boolean {
    if (!selectedMisconception) return true
    return Array.isArray(ids) && ids.includes(selectedMisconception)
  }

  // Filter standards (text only; standards aren't tagged to misconceptions
  // directly, so the misconception chip narrows ACTIVITIES, not standards).
  const standards =
    q.length > 0
      ? coherenceMap.nodes.filter((s) =>
          matchesText([s.id, s.name, s.statement, s.domain]),
        )
      : []

  // Filter curated activities (text AND misconception)
  const curated = hasFilter
    ? curatedResources.resources.filter(
        (r) =>
          matchesText([r.title, r.modality, r.source_site, r.notes]) &&
          matchesMisconception(r.misconception_ids),
      )
    : []

  // Filter community submissions (text AND misconception)
  const communityMatches = hasFilter
    ? community.filter(
        (c) =>
          matchesText([
            c.title,
            c.description,
            c.modality,
            c.source_site,
            ...(c.standard_ids ?? []),
          ]) && matchesMisconception(c.misconception_ids),
      )
    : []

  // Contributors — distinct names from approved submissions whose name matches.
  const contributorMap = new Map<string, number>()
  if (q.length > 0) {
    for (const c of community) {
      if (c.contributor_name.toLowerCase().includes(lower)) {
        contributorMap.set(c.contributor_name, (contributorMap.get(c.contributor_name) ?? 0) + 1)
      }
    }
  }
  const contributors = [...contributorMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const totalResults =
    standards.length + curated.length + communityMatches.length + contributors.length

  // Build chip counts: for each misconception, how many activities (curated +
  // approved community, scoped to the current text query) target it. Hide
  // chips with zero hits so the row stays tight.
  const curatedForChips = q.length > 0
    ? curatedResources.resources.filter((r) =>
        matchesText([r.title, r.modality, r.source_site, r.notes]),
      )
    : curatedResources.resources
  const communityForChips = q.length > 0
    ? community.filter((c) =>
        matchesText([
          c.title,
          c.description,
          c.modality,
          c.source_site,
          ...(c.standard_ids ?? []),
        ]),
      )
    : community

  const chipCounts = new Map<string, number>()
  for (const r of curatedForChips) {
    for (const mid of r.misconception_ids ?? []) {
      chipCounts.set(mid, (chipCounts.get(mid) ?? 0) + 1)
    }
  }
  for (const c of communityForChips) {
    for (const mid of c.misconception_ids ?? []) {
      chipCounts.set(mid, (chipCounts.get(mid) ?? 0) + 1)
    }
  }
  const chips = misconceptions.misconceptions
    .map((m) => ({ id: m.id, name: m.name, count: chipCounts.get(m.id) ?? 0 }))
    .filter((c) => c.count > 0)

  function chipHref(misconceptionId: string | null): string {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (misconceptionId) params.set('m', misconceptionId)
    const qs = params.toString()
    return qs ? `/search?${qs}` : '/search'
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: 'oklch(0.88 0.025 70)' }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Image
          src="/images/cloudscape-denis.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          style={{ filter: 'sepia(0.4) brightness(1.05) contrast(1.05)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.88 0.025 70 / 0.25) 0%, oklch(0.86 0.028 68 / 0.40) 100%)',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
        <header className="flex flex-col gap-3 items-center text-center">
          <p
            className="text-sm tracking-[0.4em] uppercase text-brass-deep"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            ◇ Search the library ◇
          </p>
          <h1
            className="text-3xl sm:text-4xl tracking-tight text-ink"
            style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
          >
            Find activities, progressions, standards, and contributors
          </h1>
          <OrnamentalRule className="h-5 text-brass-deep mt-1" width={300} />
        </header>

        <section className="relative rounded-sm border-2 border-brass-deep/60 bg-[oklch(0.98_0.012_78)] p-6 shadow-[0_0_25px_oklch(0.74_0.14_80/0.18)]">
          <CornerFlourish corner="tl" className="absolute top-2 left-2 h-5 w-5 text-brass-deep" />
          <CornerFlourish corner="tr" className="absolute top-2 right-2 h-5 w-5 text-brass-deep" />
          <CornerFlourish corner="bl" className="absolute bottom-2 left-2 h-5 w-5 text-brass-deep" />
          <CornerFlourish corner="br" className="absolute bottom-2 right-2 h-5 w-5 text-brass-deep" />
          <SearchInput initialQuery={q} />
        </section>

        {chips.length > 0 && (
          <section className="flex flex-col gap-2">
            <p
              className="text-sm tracking-[0.25em] uppercase text-brass-deep"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              ◇ Filter by misconception ◇
            </p>
            <p
              className="text-xs text-ink-faint italic -mt-1"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              Each chip narrows results to activities that target that specific misconception. Click again to clear.
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => {
                const active = selectedMisconception === c.id
                const href = chipHref(active ? null : c.id)
                return (
                  <Link
                    key={c.id}
                    href={href}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs tracking-[0.12em] uppercase transition-colors ${
                      active
                        ? 'border-brass-deep bg-brass/25 text-ink'
                        : 'border-brass-deep/40 bg-paper text-ink-soft hover:border-brass-deep hover:text-ink'
                    }`}
                    style={{ fontFamily: 'var(--font-cinzel)' }}
                  >
                    {c.name}
                    <span className="text-ink-faint normal-case tracking-normal">
                      ({c.count})
                    </span>
                  </Link>
                )
              })}
              {selectedMisconception && (
                <Link
                  href={chipHref(null)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-copper/60 px-2.5 py-1 text-xs tracking-[0.12em] uppercase text-copper hover:bg-copper/10"
                  style={{ fontFamily: 'var(--font-cinzel)' }}
                >
                  × clear filter
                </Link>
              )}
            </div>
          </section>
        )}

        {!hasFilter ? (
          <section
            className="rounded-sm border border-brass-deep/40 bg-paper-deep/40 px-5 py-4 text-sm text-ink-soft"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            <p
              className="text-sm tracking-[0.25em] uppercase text-brass-deep mb-2"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              What you can search
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Math standards or progressions by CCSS-M code (e.g., <span style={{ fontFamily: 'var(--font-special-elite)' }}>3.NF.A.1</span>) or by name (e.g., <em>unit fractions</em>, <em>fractions progression</em>).</li>
              <li>Activities by title, source site, or modality (e.g., <em>video</em>, <em>hands-on</em>).</li>
              <li>Community contributors by name.</li>
            </ul>
          </section>
        ) : totalResults === 0 ? (
          <section
            className="rounded-sm border border-brass-deep/40 bg-[oklch(0.98_0.012_78)] px-5 py-4 text-sm text-ink-soft italic"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            No matches{q ? <> for <strong className="text-ink not-italic">&ldquo;{q}&rdquo;</strong></> : null}
            {selectedMisconception ? <> targeting <strong className="text-ink not-italic">{misconceptionName(selectedMisconception)}</strong></> : null}
            . Try a different term, a CCSS-M code (like <span style={{ fontFamily: 'var(--font-special-elite)' }}>3.NF.A.1</span>), or clear the misconception filter.
          </section>
        ) : (
          <>
            <p
              className="text-xs text-ink-faint italic"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {totalResults} {totalResults === 1 ? 'match' : 'matches'}
              {q ? <> for &ldquo;{q}&rdquo;</> : null}
              {selectedMisconception ? <> targeting <em className="not-italic text-ink-soft">{misconceptionName(selectedMisconception)}</em></> : null}
              .
            </p>

            {standards.length > 0 && (
              <ResultsSection title={`Progressions, standards & concepts (${standards.length})`}>
                <ul className="flex flex-col gap-2">
                  {standards.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-sm border border-brass-deep/30 bg-[oklch(0.98_0.012_78)] px-4 py-3"
                    >
                      <Link
                        href={`/contribute?standard=${encodeURIComponent(s.id)}`}
                        className="block group"
                      >
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className="text-xs text-brass-deep"
                            style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.1em' }}
                          >
                            {s.id}
                          </span>
                          <span
                            className="text-base text-ink group-hover:text-brass-deep transition-colors"
                            style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
                          >
                            {s.name}
                          </span>
                          <span
                            className="text-xs text-ink-faint italic ml-auto"
                            style={{ fontFamily: 'var(--font-fraunces)' }}
                          >
                            Grade {s.grade} · {s.domain}
                          </span>
                        </div>
                        <p
                          className="mt-1 text-sm text-ink-soft leading-snug"
                          style={{ fontFamily: 'var(--font-fraunces)' }}
                        >
                          {s.statement}
                        </p>
                        <p
                          className="mt-1.5 text-sm tracking-[0.18em] uppercase text-copper group-hover:text-brass-deep"
                          style={{ fontFamily: 'var(--font-cinzel)' }}
                        >
                          + Suggest an activity for this standard →
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ResultsSection>
            )}

            {(curated.length > 0 || communityMatches.length > 0) && (
              <ResultsSection
                title={`Activities (${curated.length + communityMatches.length})`}
              >
                <ul className="flex flex-col gap-2">
                  {curated.map((r) => (
                    <li
                      key={`curated-${r.id}`}
                      className="rounded-sm border border-brass-deep/30 bg-[oklch(0.98_0.012_78)] px-4 py-3"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className="text-sm tracking-[0.18em] uppercase text-brass-deep"
                          style={{ fontFamily: 'var(--font-cinzel)' }}
                        >
                          Activity · {r.modality} · curated
                        </span>
                      </div>
                      <p
                        className="text-base text-ink"
                        style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
                      >
                        {r.title}
                      </p>
                      <p
                        className="text-xs text-ink-faint italic"
                        style={{ fontFamily: 'var(--font-fraunces)' }}
                      >
                        {[r.source_site, r.duration_minutes ? `~${r.duration_minutes} min` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {clipNote(r.notes) && (
                        <div className="mt-1.5">
                          <span
                            className="text-[10px] tracking-[0.18em] uppercase text-brass-deep mr-1.5"
                            style={{ fontFamily: 'var(--font-cinzel)' }}
                          >
                            How a guide uses this:
                          </span>
                          <span
                            className="text-sm text-ink-soft"
                            style={{ fontFamily: 'var(--font-fraunces)' }}
                          >
                            {clipNote(r.notes)}
                          </span>
                        </div>
                      )}
                      {isLiveUrl(r.url) && (
                        <a
                          href={r.url!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-copper hover:text-brass-deep underline underline-offset-2"
                          style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.08em' }}
                        >
                          Open →
                        </a>
                      )}
                      <MisconceptionTags
                        ids={r.misconception_ids ?? []}
                        selected={selectedMisconception}
                        chipHref={chipHref}
                      />
                    </li>
                  ))}
                  {communityMatches.map((c) => (
                    <li
                      key={`community-${c.id}`}
                      className="rounded-sm border border-brass-deep/30 bg-[oklch(0.98_0.012_78)] px-4 py-3"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className="text-sm tracking-[0.18em] uppercase text-brass-deep"
                          style={{ fontFamily: 'var(--font-cinzel)' }}
                        >
                          Activity · {c.modality} · community
                        </span>
                        <span
                          className="text-xs text-ink-faint italic ml-auto"
                          style={{ fontFamily: 'var(--font-fraunces)' }}
                        >
                          contributed by {c.contributor_name}
                        </span>
                      </div>
                      <p
                        className="text-base text-ink"
                        style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
                      >
                        {c.title}
                      </p>
                      <div className="mt-1.5">
                        <span
                          className="text-[10px] tracking-[0.18em] uppercase text-brass-deep mr-1.5"
                          style={{ fontFamily: 'var(--font-cinzel)' }}
                        >
                          How a guide uses this:
                        </span>
                        <span
                          className="text-sm text-ink-soft"
                          style={{ fontFamily: 'var(--font-fraunces)' }}
                        >
                          {clipNote(c.description, 240) ?? c.description}
                        </span>
                      </div>
                      <p
                        className="mt-1 text-xs text-ink-faint italic"
                        style={{ fontFamily: 'var(--font-fraunces)' }}
                      >
                        Standards: {c.standard_ids.join(', ')}
                        {c.duration_minutes ? ` · ~${c.duration_minutes} min` : ''}
                      </p>
                      {c.research_basis && (
                        <p
                          className="mt-1 text-xs text-ink-soft"
                          style={{ fontFamily: 'var(--font-fraunces)' }}
                        >
                          <span
                            className="text-[10px] tracking-[0.18em] uppercase text-brass-deep mr-1.5"
                            style={{ fontFamily: 'var(--font-cinzel)' }}
                          >
                            Research basis:
                          </span>
                          <em className="not-italic">{c.research_basis}</em>
                        </p>
                      )}
                      {isLiveUrl(c.url) && (
                        <a
                          href={c.url!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-copper hover:text-brass-deep underline underline-offset-2"
                          style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.08em' }}
                        >
                          Open →
                        </a>
                      )}
                      <MisconceptionTags
                        ids={c.misconception_ids ?? []}
                        selected={selectedMisconception}
                        chipHref={chipHref}
                      />
                    </li>
                  ))}
                </ul>
              </ResultsSection>
            )}

            {contributors.length > 0 && (
              <ResultsSection title={`Contributors (${contributors.length})`}>
                <ul className="flex flex-col gap-2">
                  {contributors.map((c) => (
                    <li
                      key={c.name}
                      className="rounded-sm border border-brass-deep/30 bg-[oklch(0.98_0.012_78)] px-4 py-3 flex items-baseline justify-between gap-3"
                    >
                      <span
                        className="text-base text-ink"
                        style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="text-xs text-ink-faint italic"
                        style={{ fontFamily: 'var(--font-fraunces)' }}
                      >
                        {c.count} approved {c.count === 1 ? 'contribution' : 'contributions'}
                      </span>
                    </li>
                  ))}
                </ul>
              </ResultsSection>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function isLiveUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /^https?:\/\//i.test(url.trim())
}

function MisconceptionTags({
  ids,
  selected,
  chipHref,
}: {
  ids: string[]
  selected: string | null
  chipHref: (id: string | null) => string
}) {
  if (!ids || ids.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const active = selected === id
        return (
          <Link
            key={id}
            href={chipHref(active ? null : id)}
            className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] tracking-[0.12em] uppercase ${
              active
                ? 'border-brass-deep bg-brass/25 text-ink'
                : 'border-brass-deep/30 bg-paper text-ink-soft hover:border-brass-deep hover:text-ink'
            }`}
            style={{ fontFamily: 'var(--font-cinzel)' }}
            title={`Targets: ${misconceptionName(id)}`}
          >
            {misconceptionName(id)}
          </Link>
        )
      })}
    </div>
  )
}

function ResultsSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2
        className="text-sm tracking-[0.25em] uppercase text-brass-deep"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        ◇ {title} ◇
      </h2>
      {children}
    </section>
  )
}
