/**
 * Mastery Voyage — single page that absorbs the old report.
 *
 * Layout (top to bottom):
 *   1. StrataCloudscape (the 5 progressions, with sandbags hanging from
 *      the balloon — one sandbag per detected misconception, dropped when
 *      that misconception is resolved).
 *   2. "Standards in the Current Progression" — collapsible, each standard
 *      its own collapsible. Per Barbara: misconception/working show
 *      audit + verify-mastery. Mastered shows audit only. Not yet probed
 *      sits at the end with no audit.
 *   3. "Priorities for this learner" pill strip — one pill per detected
 *      misconception (the same labels as the sandbags).
 *   4. Flat numbered activity list — every activity from the plan, no
 *      duplicates. Each card carries the standards + misconceptions it
 *      helps. Order = the AI's recommended sequence.
 *
 * If the plan hasn't generated yet, the activity strip + verify-mastery
 * blocks show a "AI is building your plan…" placeholder.
 */
import Link from 'next/link'
import StrataCloudscape from '@/components/StrataCloudscape'
import ActivityTile from './ActivityTile'
import FocusedProbeButton from './FocusedProbeButton'
import AnalyzeButton from './AnalyzeButton'
import ModalityFilter from './ModalityFilter'
import type { PlanContent } from './PlanDisplay'
import {
  standardName,
  standardIsPrerequisite,
} from '@/lib/standard-labels'
import resourcesRaw from '@/content/fractions-resources.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'
import problemBankRaw from '@/content/fractions-problem-bank.json'
import coherenceMapRaw from '@/content/coherence-map-fractions.json'

type StandardState = 'misconception' | 'working' | 'demonstrated' | 'not_assessed'

interface StandardReport {
  state: StandardState
  evidence_problem_ids: string[]
  flagged_misconception_ids: string[]
  reasoning: string
}
interface MasteryMap {
  standards: Record<string, StandardReport>
  overall_notes?: string
}

export interface ResourceRow {
  id: string
  title: string
  modality: string
  source_site?: string
  url?: string | null
  duration_minutes?: number
  /** Marker for community-contributed entries (id prefix \`c_\`). Lets the
   *  UI badge them differently from curated rows when we want to. */
  source?: 'community'
  contributor_name?: string
}
const curatedResources = resourcesRaw as unknown as { resources: ResourceRow[] }

interface Misconception {
  id: string
  name: string
}
const misconceptions = misconceptionsRaw as unknown as {
  misconceptions: Misconception[]
}
function misconceptionName(id: string): string {
  return (
    misconceptions.misconceptions.find((m) => m.id === id)?.name ?? id
  )
}

interface BankProblem {
  id: string
  problem_type: string
  goal: unknown
  real_world_context?: { framing_text?: string }
}
const problemBank = problemBankRaw as unknown as { problems: BankProblem[] }
function problemById(id: string): BankProblem | undefined {
  return problemBank.problems.find((p) => p.id === id)
}
function describeProblem(p: BankProblem): string {
  const framing = p.real_world_context?.framing_text
  if (framing) return framing.length > 80 ? framing.slice(0, 77) + '…' : framing
  const goal = p.goal as
    | { numerator?: number; denominator?: number; then_shade?: { numerator: number; denominator: number } }
    | undefined
  if (goal?.numerator !== undefined && goal?.denominator !== undefined) {
    return `${p.problem_type.replace(/_/g, ' ')} ${goal.numerator}/${goal.denominator}`
  }
  if (goal?.then_shade) {
    return `${p.problem_type.replace(/_/g, ' ')} → ${goal.then_shade.numerator}/${goal.then_shade.denominator}`
  }
  return p.problem_type.replace(/_/g, ' ')
}

interface CoherenceNode {
  id: string
  layer?: number
}
const coherenceMap = coherenceMapRaw as unknown as { nodes: CoherenceNode[] }
function layerOf(id: string): number {
  return coherenceMap.nodes.find((n) => n.id === id)?.layer ?? 99
}

interface Props {
  masteryMap: MasteryMap | null
  plan: PlanContent | null
  planId: string | null
  assessmentId: string | null
  learnerId: string
  /** Approved community submissions (id-prefix \`c_\`). Merged into the
   *  resource lookup so the plan agent's community picks render correctly. */
  communityResources?: ResourceRow[]
}

export default function MasteryVoyage({
  masteryMap,
  plan,
  planId,
  assessmentId,
  learnerId,
  communityResources = [],
}: Props) {
  // Build the unified resource lookup: curated + approved community.
  const resourceById = (id: string): ResourceRow | undefined => {
    return (
      curatedResources.resources.find((r) => r.id === id) ??
      communityResources.find((r) => r.id === id)
    )
  }
  // Sandbags hanging from the balloon = unique misconceptions detected.
  // For now, all sandbags hang. Once a focused-probe re-assessment clears a
  // misconception, that sandbag can render as "dropped".
  const sandbagLabels = uniqueMisconceptionNames(masteryMap)

  // Build a flat, deduplicated list of activities from the plan.
  const flatActivities = plan ? flattenPlan(plan) : []

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <StrataCloudscape masteryMap={masteryMap} showBalloon={true} />

      {!masteryMap && assessmentId && (
        <section className="rounded-sm border-2 border-brass-deep/30 bg-paper p-5 flex flex-col gap-3">
          <h2
            className="text-sm tracking-[0.25em] uppercase text-brass-deep"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Step I — Analyze the responses
          </h2>
          <p
            className="text-sm text-ink-soft"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Run analysis to produce the mastery map.
          </p>
          <AnalyzeButton assessmentId={assessmentId} />
        </section>
      )}

      {masteryMap && (
        <StandardsTable masteryMap={masteryMap} />
      )}

      {masteryMap && plan && <ModalityFilter />}

      {masteryMap && (
        <ActivitiesSection
          plan={plan}
          planId={planId}
          flatActivities={flatActivities}
          resourceById={resourceById}
        />
      )}

      {masteryMap && (
        <VerifyMasterySection
          masteryMap={masteryMap}
          plan={plan}
          assessmentId={assessmentId}
          learnerId={learnerId}
        />
      )}
    </div>
  )
}

/* ─────────────────────────  Standards table (simple)  ───────────────────────── */

function StandardsTable({ masteryMap }: { masteryMap: MasteryMap }) {
  const sorted = sortStandards(masteryMap.standards)

  return (
    <details
      open
      className="rounded-sm border-2 border-brass-deep/40 bg-paper p-5"
    >
      <summary
        className="cursor-pointer list-none flex items-center justify-between text-sm tracking-[0.25em] uppercase text-brass-deep"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        Standards in the Current Progression
        <span className="text-ink-faint">▼</span>
      </summary>
      <ul className="mt-4 flex flex-col gap-2">
        {sorted.map(({ id, state }) => (
          <li
            key={id}
            className="flex items-baseline gap-3 text-sm border-b border-stone-300/50 last:border-0 pb-2 last:pb-0"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full shrink-0 mt-1.5 ${stateDot(state)}`}
              aria-hidden
            />
            <span className="text-ink flex-1">
              {standardName(id)}{' '}
              <span
                className="text-xs text-ink-faint"
                style={{ fontFamily: 'var(--font-special-elite)' }}
              >
                ({id}
                {standardIsPrerequisite(id) ? ' · prerequisite' : ''})
              </span>
            </span>
            <span
              className={`text-xs tracking-[0.15em] uppercase font-bold ${stateLabelColor(state)}`}
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              {stateLabel(state)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

/* ─────────────────────────  Verify mastery section  ───────────────────────── */

function VerifyMasterySection({
  masteryMap,
  plan,
  assessmentId,
  learnerId,
}: {
  masteryMap: MasteryMap
  plan: PlanContent | null
  assessmentId: string | null
  learnerId: string
}) {
  const targets = Object.entries(masteryMap.standards)
    .filter(([, r]) => r.state === 'misconception' || r.state === 'working')
    .map(([sid]) => sid)
    .sort((a, b) => layerOf(a) - layerOf(b))

  if (targets.length === 0) return null

  return (
    <details className="rounded-sm border-2 border-brass-deep/40 bg-paper p-5">
      <summary
        className="cursor-pointer list-none flex items-center justify-between text-sm tracking-[0.25em] uppercase text-brass-deep"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        Verify mastery
        <span className="text-ink-faint">▼</span>
      </summary>
      <p
        className="mt-3 text-sm text-ink-soft italic leading-relaxed"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        Once the activities above are complete, run a focused probe — a short
        re-test of one standard, ~10 minutes — to confirm the gap has resolved.
      </p>
      {!plan || !assessmentId ? (
        <div className="mt-3">
          <AiWorkingTag />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {targets.map((sid) => (
            <li
              key={sid}
              className="flex flex-wrap items-baseline gap-3 border-b border-stone-300/50 last:border-0 pb-3 last:pb-0"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              <span className="text-ink flex-1 min-w-[12rem]">
                {standardName(sid)}{' '}
                <span
                  className="text-xs text-ink-faint"
                  style={{ fontFamily: 'var(--font-special-elite)' }}
                >
                  ({sid}
                  {standardIsPrerequisite(sid) ? ' · prerequisite' : ''})
                </span>
              </span>
              <FocusedProbeButton
                learnerId={learnerId}
                standardId={sid}
                standardName={standardName(sid)}
                parentAssessmentId={assessmentId}
              />
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}

/* ─────────────────────────  Activities section  ───────────────────────── */

interface FlatActivity {
  resource_id: string
  order: number
  rationale: string
  standard_ids: string[]
  misconception_ids: string[]
}

function ActivitiesSection({
  plan,
  planId,
  flatActivities,
  resourceById,
}: {
  plan: PlanContent | null
  planId: string | null
  flatActivities: FlatActivity[]
  resourceById: (id: string) => ResourceRow | undefined
}) {
  return (
    <section className="rounded-sm border-2 border-brass-deep/40 bg-paper p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2
          className="text-sm tracking-[0.25em] uppercase text-brass-deep"
          style={{ fontFamily: 'var(--font-cinzel)' }}
        >
          Plan of activities
        </h2>
      </div>

      {/* Activities list */}
      {!plan || !planId ? (
        <AiWorkingTag fullBlock />
      ) : flatActivities.length === 0 ? (
        <p
          className="text-sm text-ink-soft italic"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          No activities in the current plan.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {flatActivities.map((act, idx) => {
            const r = resourceById(act.resource_id)
            const completed = plan._completed_activities ?? []
            const done = completed.find((c) => c.resource_id === act.resource_id)
            return (
              <ActivityTile
                key={act.resource_id}
                planId={planId}
                order={idx + 1}
                resourceId={act.resource_id}
                rationale={act.rationale}
                resource={r}
                completedAt={done?.done_at ?? null}
                allCompleted={completed}
                misconceptionTags={act.misconception_ids.map((m) =>
                  misconceptionName(m),
                )}
                standardTags={act.standard_ids}
              />
            )
          })}
          <div className="pt-3 mt-1 border-t border-dashed border-brass-deep/40 flex items-center justify-center">
            <Link
              href="/contribute"
              className="inline-flex items-center gap-2 rounded-sm border-2 border-brass-deep px-4 py-2 text-xs font-bold uppercase text-ink hover:bg-brass/15 transition-colors"
              style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.18em' }}
            >
              + Suggest an activity
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────────  Helpers  ───────────────────────── */

function AiWorkingTag({ fullBlock = false }: { fullBlock?: boolean }) {
  const cls = fullBlock
    ? 'rounded-sm border-2 border-dashed border-brass-deep/50 bg-[oklch(0.95_0.02_78)] px-4 py-6 text-center'
    : 'rounded-sm border border-dashed border-brass-deep/40 bg-paper px-3 py-2'
  return (
    <div className={cls}>
      <p
        className="text-sm text-brass-deep tracking-[0.18em] uppercase font-bold animate-pulse"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        ✦ AI is building your plan…
      </p>
      <p
        className="mt-1 text-xs text-ink-soft italic"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        Activities, sequencing, and verify-mastery probes will appear here when ready.
      </p>
    </div>
  )
}

function uniqueMisconceptionNames(map: MasteryMap | null): string[] {
  if (!map) return []
  const ids = new Set<string>()
  for (const r of Object.values(map.standards)) {
    for (const m of r.flagged_misconception_ids) ids.add(m)
  }
  return [...ids].map((id) => misconceptionName(id))
}

function flattenPlan(plan: PlanContent): FlatActivity[] {
  // Build activity → set-of-standards and activity → set-of-misconceptions
  const byResource = new Map<string, FlatActivity>()

  for (const gap of plan.priority_gaps) {
    for (const act of gap.activities) {
      const existing = byResource.get(act.resource_id)
      if (existing) {
        if (!existing.standard_ids.includes(gap.standard_id)) {
          existing.standard_ids.push(gap.standard_id)
        }
        for (const m of gap.flagged_misconception_ids) {
          if (!existing.misconception_ids.includes(m)) {
            existing.misconception_ids.push(m)
          }
        }
        existing.order = Math.min(existing.order, act.order)
      } else {
        byResource.set(act.resource_id, {
          resource_id: act.resource_id,
          order: act.order,
          rationale: [
            gap.rationale_for_this_gap?.trim(),
            act.rationale?.trim(),
          ]
            .filter(Boolean)
            .join(' '),
          standard_ids: [gap.standard_id],
          misconception_ids: [...gap.flagged_misconception_ids],
        })
      }
    }
  }

  return [...byResource.values()].sort((a, b) => a.order - b.order)
}

function sortStandards(
  standards: Record<string, { state: StandardState }>,
): { id: string; state: StandardState }[] {
  // Misconception → working → mastered → not_assessed (last per Barbara).
  const order: Record<StandardState, number> = {
    misconception: 0,
    working: 1,
    demonstrated: 2,
    not_assessed: 3,
  }
  return Object.entries(standards)
    .map(([id, v]) => ({ id, state: v.state }))
    .sort(
      (a, b) =>
        order[a.state] - order[b.state] ||
        layerOf(a.id) - layerOf(b.id) ||
        a.id.localeCompare(b.id),
    )
}

function stateLabel(state: StandardState): string {
  switch (state) {
    case 'misconception':
      return 'Misconception detected'
    case 'working':
      return 'Building the skill'
    case 'demonstrated':
      return 'Mastered'
    case 'not_assessed':
      return 'Not yet probed'
  }
}

function stateDot(state: StandardState): string {
  switch (state) {
    case 'misconception':
      return 'bg-red-600'
    case 'working':
      return 'bg-amber-600'
    case 'demonstrated':
      return 'bg-emerald-600'
    case 'not_assessed':
      return 'bg-stone-400'
  }
}

function stateLabelColor(state: StandardState): string {
  switch (state) {
    case 'misconception':
      return 'text-red-700'
    case 'working':
      return 'text-amber-800'
    case 'demonstrated':
      return 'text-emerald-700'
    case 'not_assessed':
      return 'text-stone-500'
  }
}

/* Reused mini bulleted-sentences renderer (from report). */
function BulletedSentences({ text }: { text: string }) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const dashSplit = /(?:^|\n)\s*[-*•]\s+/
  if (dashSplit.test(trimmed)) {
    const items = trimmed
      .split(dashSplit)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (items.length > 0) {
      return (
        <ul className="list-disc ml-5 space-y-1 leading-relaxed">
          {items.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )
    }
  }
  const newlineLines = trimmed
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (newlineLines.length > 1) {
    return (
      <ul className="list-disc ml-5 space-y-1 leading-relaxed">
        {newlineLines.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    )
  }
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (sentences.length <= 1) {
    return <p className="leading-relaxed">{trimmed}</p>
  }
  return (
    <ul className="list-disc ml-5 space-y-1 leading-relaxed">
      {sentences.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  )
}
