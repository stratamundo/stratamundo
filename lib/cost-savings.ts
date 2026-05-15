/**
 * Cost-savings helpers for the analyze + plan AI pipeline.
 *
 * Lever 2 (relevance filter): we used to send the full problem bank,
 * full misconception taxonomy, and full coherence map to every AI call.
 * Most of that is irrelevant for any given assessment — a kid who
 * attempted 9 problems against 4 standards doesn't need the AI to read
 * the other 53 problems and 5 unrelated misconceptions. This module
 * trims those payloads to the minimum needed.
 *
 * Lever 3 (skip plan): a mastery map with no red (misconception) and
 * no amber (working) standards needs no plan. This module exposes a
 * cheap predicate the plan route can call before any AI work.
 */

export type MasteryStandardEntry = {
  state: 'misconception' | 'working' | 'demonstrated' | 'not_assessed'
  flagged_misconception_ids?: string[]
  evidence_problem_ids?: string[]
  reasoning?: string
}

export type MasteryMap = {
  standards: Record<string, MasteryStandardEntry>
  overall_notes?: string
}

type Problem = {
  id: string
  ccss_standard_ids?: string[]
  target_misconception_ids?: string[]
  misconception_response_map?: Array<{ misconception_ids?: string[] }>
}

type StoredResponse = {
  problem_id: string
  telemetry?: unknown[]
}

type Misconception = { id: string; [k: string]: unknown }
type CoherenceNode = { id: string; [k: string]: unknown }

/**
 * Standards a kid actually touched in this assessment, derived from
 * the problems they attempted. Used to scope the AI's read.
 */
export function relevantStandardIds(
  responses: StoredResponse[],
  allProblems: Problem[],
): string[] {
  const attemptedProblemIds = new Set(responses.map((r) => r.problem_id))
  const ids = new Set<string>()
  for (const p of allProblems) {
    if (!attemptedProblemIds.has(p.id)) continue
    for (const sid of p.ccss_standard_ids ?? []) ids.add(sid)
  }
  return Array.from(ids)
}

/**
 * Trim the problem bank to just the problems the kid attempted.
 * The AI doesn't need to read 53 problems to judge a 9-problem session.
 */
export function relevantProblems(
  responses: StoredResponse[],
  allProblems: Problem[],
): Problem[] {
  const attempted = new Set(responses.map((r) => r.problem_id))
  return allProblems.filter((p) => attempted.has(p.id))
}

/**
 * Trim the misconception taxonomy to only entries referenced (directly
 * or via misconception_response_map) by the relevant problems.
 */
export function relevantMisconceptions(
  attemptedProblems: Problem[],
  allMisconceptions: { misconceptions: Misconception[] } | { items: Misconception[] } | unknown,
): Misconception[] {
  const referenced = new Set<string>()
  for (const p of attemptedProblems) {
    for (const id of p.target_misconception_ids ?? []) referenced.add(id)
    for (const entry of p.misconception_response_map ?? []) {
      for (const id of entry.misconception_ids ?? []) referenced.add(id)
    }
  }

  // Misconception JSON files vary in shape; tolerate both.
  const list: Misconception[] = (() => {
    if (Array.isArray(allMisconceptions)) return allMisconceptions as Misconception[]
    const obj = allMisconceptions as Record<string, unknown>
    if (Array.isArray(obj?.misconceptions)) return obj.misconceptions as Misconception[]
    if (Array.isArray(obj?.items)) return obj.items as Misconception[]
    return []
  })()

  return list.filter((m) => referenced.has(m.id))
}

/**
 * Trim the coherence map to nodes whose IDs are in the relevant set
 * OR are immediate prerequisites of those (so the AI can do
 * differential diagnosis between within-concept and prerequisite-gap).
 */
export function relevantCoherenceNodes(
  standardIds: string[],
  coherenceMap: { nodes: CoherenceNode[]; edges?: Array<{ from: string; to: string }> } | unknown,
): { nodes: CoherenceNode[]; edges: Array<{ from: string; to: string }> } {
  const cm = coherenceMap as {
    nodes?: CoherenceNode[]
    edges?: Array<{ from: string; to: string }>
  }
  const want = new Set(standardIds)

  // Add direct prerequisites from edges (edge.to in want → include edge.from too)
  for (const e of cm.edges ?? []) {
    if (want.has(e.to)) want.add(e.from)
  }

  return {
    nodes: (cm.nodes ?? []).filter((n) => want.has(n.id)),
    edges: (cm.edges ?? []).filter((e) => want.has(e.from) && want.has(e.to)),
  }
}

/* --------------------------------------------------------------------
   Lever 3 — skip plan when there's nothing to plan
   -------------------------------------------------------------------- */

/**
 * True iff the mastery map contains no `misconception` and no `working`
 * states. In that case, generating a plan is wasted spend — there is
 * literally nothing to remediate.
 */
export function noPlanNeeded(masteryMap: MasteryMap): boolean {
  const standards = masteryMap?.standards ?? {}
  for (const entry of Object.values(standards)) {
    if (entry.state === 'misconception' || entry.state === 'working') return false
  }
  return true
}

/**
 * A stub plan stored when we skip the AI call. Mirrors the same shape
 * the Plan Architect would produce so the report page can render it
 * without special-casing.
 */
export function emptyPlanContent(): unknown {
  return {
    current_section: '',
    section_roadmap: [],
    priority_gaps: [],
    overall_notes:
      'No misconceptions or partial-mastery standards in this assessment — no remediation plan needed at this time.',
    prerequisite_check_recommendations: [],
    skipped_reason: 'no_gaps',
  }
}
