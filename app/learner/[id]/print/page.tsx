import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PlanContent } from '../PlanDisplay'
import resourcesRaw from '@/content/fractions-resources.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'
import { standardName } from '@/lib/standard-labels'
import PrintButton from './PrintButton'

interface ResourceRow {
  id: string
  title: string
  modality: string
  source_site?: string
  url?: string | null
  duration_minutes?: number
  source?: 'community'
  contributor_name?: string
}
const curated = resourcesRaw as unknown as { resources: ResourceRow[] }

interface Misconception {
  id: string
  name: string
}
const misconceptions = misconceptionsRaw as unknown as {
  misconceptions: Misconception[]
}
function misconceptionName(id: string): string {
  return misconceptions.misconceptions.find((m) => m.id === id)?.name ?? id
}

interface CommunityRow {
  id: string
  title: string
  modality: string
  url: string | null
  source_site: string | null
  duration_minutes: number | null
  contributor_name: string
}

interface StandardReport {
  state: 'misconception' | 'working' | 'demonstrated' | 'not_assessed'
  flagged_misconception_ids: string[]
  reasoning: string
}
interface MasteryMap {
  standards: Record<string, StandardReport>
  overall_notes?: string
}

interface PrintPageProps {
  params: Promise<{ id: string }>
}

export default async function LearnerPrintPage(props: PrintPageProps) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: learner, error: learnerErr } = await supabase
    .from('learners')
    .select('id, name, age, grade_level')
    .eq('id', id)
    .single()
  if (learnerErr || !learner) notFound()

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, completed_at, mastery_map')
    .eq('learner_id', id)
    .eq('type', 'full')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
  const latest = assessments?.[0]
  const masteryMap = (latest?.mastery_map as MasteryMap | null) ?? null

  let plan: PlanContent | null = null
  if (latest) {
    const { data: planRow } = await supabase
      .from('plans')
      .select('plan_content')
      .eq('assessment_id', latest.id)
      .eq('status', 'active')
      .maybeSingle()
    if (planRow) plan = planRow.plan_content as PlanContent
  }

  const { data: communityRows } = await supabase
    .from('activity_submissions')
    .select('id, title, modality, url, source_site, duration_minutes, contributor_name')
    .eq('status', 'human_approved')
    .limit(200)
  const community = ((communityRows as CommunityRow[] | null) ?? []).map((c) => ({
    id: `c_${c.id.slice(0, 8)}`,
    title: c.title,
    modality: c.modality,
    source_site: c.source_site ?? c.contributor_name,
    url: c.url,
    duration_minutes: c.duration_minutes ?? undefined,
    source: 'community' as const,
    contributor_name: c.contributor_name,
  }))

  function resourceById(rid: string): ResourceRow | undefined {
    return (
      curated.resources.find((r) => r.id === rid) ??
      community.find((r) => r.id === rid)
    )
  }

  const completedDate = latest?.completed_at
    ? new Date(latest.completed_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
  const generatedToday = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const priorityGaps = plan?.priority_gaps ?? []

  return (
    <main className="bg-white text-black print:bg-white">
      <PrintButton />
      <article className="max-w-[7.5in] mx-auto px-8 py-10 print:py-0 print:px-0">
        <header className="border-b-2 border-black pb-4 mb-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-600">
            Strata Mundo · Mastery Plan
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {learner.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            Grade {learner.grade_level ?? '—'}
            {learner.age ? `, age ${learner.age}` : ''}
            {completedDate ? ` · Assessed ${completedDate}` : ''}
          </p>
        </header>

        {!masteryMap && (
          <p className="italic text-neutral-700">
            No completed assessment yet. Run a full assessment first.
          </p>
        )}

        {masteryMap && (
          <>
            <SummarySection masteryMap={masteryMap} />

            {priorityGaps.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm tracking-[0.25em] uppercase border-b border-black pb-1 mb-3">
                  Priority gaps to work on this week
                </h2>
                <ul className="flex flex-col gap-5">
                  {priorityGaps.map((gap) => (
                    <PriorityGapBlock
                      key={gap.standard_id}
                      gap={gap}
                      resourceById={resourceById}
                    />
                  ))}
                </ul>
              </section>
            )}

            {plan?.overall_notes && (
              <section className="mt-6">
                <h2 className="text-sm tracking-[0.25em] uppercase border-b border-black pb-1 mb-2">
                  Overall notes for the guide
                </h2>
                <p className="text-sm leading-relaxed">{plan.overall_notes}</p>
              </section>
            )}

            {plan?.prerequisite_check_recommendations &&
              plan.prerequisite_check_recommendations.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-sm tracking-[0.25em] uppercase border-b border-black pb-1 mb-2">
                    Probe these next time
                  </h2>
                  <p className="text-xs text-neutral-700 italic mb-2">
                    These standards weren&apos;t covered well this round and may
                    explain the gaps above.
                  </p>
                  <ul className="list-disc ml-6 text-sm">
                    {plan.prerequisite_check_recommendations.map((sid) => (
                      <li key={sid}>
                        <span className="font-mono text-xs">{sid}</span>{' '}
                        — {standardName(sid)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
          </>
        )}

        <footer className="mt-10 pt-4 border-t border-neutral-400 text-[11px] text-neutral-600">
          Generated by Strata Mundo on {generatedToday}. The live, interactive
          version of this report (with re-probe controls and progress history)
          is at this learner&apos;s page on stratamundo.com.
        </footer>
      </article>
    </main>
  )
}

function SummarySection({ masteryMap }: { masteryMap: MasteryMap }) {
  const counts = {
    misconception: 0,
    working: 0,
    demonstrated: 0,
    not_assessed: 0,
  }
  const byState: Record<string, [string, StandardReport][]> = {
    misconception: [],
    working: [],
    demonstrated: [],
    not_assessed: [],
  }
  for (const [sid, v] of Object.entries(masteryMap.standards ?? {})) {
    counts[v.state]++
    byState[v.state].push([sid, v])
  }
  const total =
    counts.misconception + counts.working + counts.demonstrated + counts.not_assessed

  return (
    <section className="mt-2">
      <h2 className="text-sm tracking-[0.25em] uppercase border-b border-black pb-1 mb-3">
        Mastery snapshot
      </h2>
      <div className="grid grid-cols-4 gap-3 text-center mb-4">
        <Stat label="Mastered" count={counts.demonstrated} total={total} />
        <Stat label="Building" count={counts.working} total={total} />
        <Stat label="Misconception" count={counts.misconception} total={total} />
        <Stat label="Not yet probed" count={counts.not_assessed} total={total} />
      </div>

      {(['misconception', 'working', 'demonstrated'] as const).map((state) => {
        const items = byState[state]
        if (items.length === 0) return null
        return (
          <div key={state} className="mb-3">
            <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-700 mb-1">
              {stateBlockLabel(state)}
            </p>
            <ul className="text-sm leading-snug">
              {items.map(([sid, v]) => (
                <li key={sid} className="flex gap-2">
                  <span className="font-mono text-xs text-neutral-700 w-20 shrink-0">
                    {sid}
                  </span>
                  <span>{standardName(sid)}</span>
                  {v.flagged_misconception_ids.length > 0 && (
                    <span className="text-neutral-700 italic">
                      — {v.flagged_misconception_ids.map((m) => misconceptionName(m)).join('; ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

function Stat({
  label,
  count,
  total,
}: {
  label: string
  count: number
  total: number
}) {
  return (
    <div className="border border-neutral-400 px-2 py-2">
      <div className="text-2xl font-semibold leading-none">{count}</div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-neutral-700 mt-1">
        {label}
      </div>
      <div className="text-[10px] text-neutral-500">of {total}</div>
    </div>
  )
}

function PriorityGapBlock({
  gap,
  resourceById,
}: {
  gap: NonNullable<PlanContent['priority_gaps']>[number]
  resourceById: (id: string) => ResourceRow | undefined
}) {
  const flaggedNames = gap.flagged_misconception_ids.map((m) => misconceptionName(m))
  return (
    <li className="break-inside-avoid">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-mono text-xs text-neutral-700">
          {gap.standard_id}
        </span>
        <span className="text-base font-semibold">
          {standardName(gap.standard_id)}
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-700 ml-auto">
          {gap.current_state === 'misconception'
            ? 'Misconception'
            : gap.current_state === 'working'
              ? 'Building the skill'
              : gap.current_state}
        </span>
      </div>
      {flaggedNames.length > 0 && (
        <p className="text-xs text-neutral-700 italic mt-0.5">
          {flaggedNames.join('; ')}
        </p>
      )}
      {gap.rationale_for_this_gap && (
        <p className="text-sm mt-1.5">{gap.rationale_for_this_gap}</p>
      )}
      {gap.diagnosis === 'prerequisite-gap' &&
        gap.prerequisite_flags.length > 0 && (
          <p className="text-xs italic mt-1 text-neutral-700">
            Likely prerequisite gap — work on{' '}
            {gap.prerequisite_flags.join(', ')} first.
          </p>
        )}

      <ol className="mt-2 ml-5 list-decimal text-sm flex flex-col gap-2">
        {gap.activities.map((act) => {
          const r = resourceById(act.resource_id)
          if (!r) return null
          return (
            <li key={act.resource_id} className="leading-snug">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold">{r.title}</span>
                <span className="text-[10px] tracking-[0.18em] uppercase text-neutral-600">
                  {r.modality.replace(/_/g, ' ')}
                </span>
                {r.duration_minutes && (
                  <span className="text-[11px] text-neutral-600">
                    ~{r.duration_minutes} min
                  </span>
                )}
                {r.source === 'community' && (
                  <span className="text-[10px] tracking-[0.18em] uppercase text-neutral-600">
                    community
                  </span>
                )}
              </div>
              <p className="text-[13px] text-neutral-800">{act.rationale}</p>
              {(r.url || r.source_site) && (
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  {r.source_site}
                  {r.url ? ` — ${r.url}` : ''}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </li>
  )
}

function stateBlockLabel(state: string): string {
  switch (state) {
    case 'misconception':
      return 'Misconception detected'
    case 'working':
      return 'Building the skill'
    case 'demonstrated':
      return 'Mastered'
    default:
      return state
  }
}
