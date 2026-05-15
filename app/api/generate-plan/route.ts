import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  PLAN_ARCHITECT_SYSTEM_PROMPT,
} from '@/lib/plan-architect-prompt'
import {
  noPlanNeeded,
  emptyPlanContent,
  relevantMisconceptions,
  relevantCoherenceNodes,
  type MasteryMap,
} from '@/lib/cost-savings'
import { getAllProblems } from '@/lib/problem-selection'
import coherenceMapRaw from '@/content/coherence-map-fractions.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'
import resourcesRaw from '@/content/fractions-resources.json'

/**
 * Plan Architect — Sonnet 4.6 with prompt caching.
 *
 * Cost levers in this route:
 *   - Lever 3: skip the AI call entirely when the mastery map has no
 *     misconceptions or partial-mastery standards. Stores an empty-plan
 *     stub so the report page renders cleanly.
 *   - Lever 2: trim the misconception taxonomy and coherence map to
 *     only what's referenced by flagged standards.
 *   - Lever 4: max_tokens dropped from 16,000 → 6,000 (tighter prompts
 *     keep outputs short).
 *
 * Caching:
 *   - System prompt: ephemeral cache.
 *   - Resource library + trimmed taxonomy + trimmed coherence map: own
 *     cache breakpoint. (Resource library is invariant; taxonomy/coherence
 *     vary by which standards were flagged but cache keys are content-
 *     hashed so common shapes still hit warm.)
 */

export const maxDuration = 60

interface PriorPlanRow {
  id: string
  assessment_id: string
  generated_at: string | null
  plan_content: unknown
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set on server' },
      { status: 500 },
    )
  }

  let body: { assessment_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const assessmentId = body.assessment_id
  if (!assessmentId) {
    return NextResponse.json({ error: 'assessment_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select('id, learner_id, mastery_map')
    .eq('id', assessmentId)
    .single()
  if (fetchError || !assessment) {
    return NextResponse.json({ error: 'assessment not found' }, { status: 404 })
  }
  if (!assessment.mastery_map) {
    return NextResponse.json(
      { error: 'assessment has not been analyzed yet; run analysis first' },
      { status: 400 },
    )
  }

  // ------------------------------------------------------------------
  // Lever 3 — skip the AI entirely when nothing needs a plan.
  // ------------------------------------------------------------------
  const masteryMap = assessment.mastery_map as MasteryMap
  if (noPlanNeeded(masteryMap)) {
    // Save a stub plan so the report page can read it without special-casing.
    await supabase
      .from('plans')
      .update({ status: 'superseded' })
      .eq('learner_id', assessment.learner_id)
      .eq('status', 'active')

    const { data: stubPlan, error: stubErr } = await supabase
      .from('plans')
      .insert({
        learner_id: assessment.learner_id,
        assessment_id: assessment.id,
        plan_content: emptyPlanContent(),
        status: 'active',
      })
      .select('id, generated_at')
      .single()
    if (stubErr) {
      return NextResponse.json({ error: stubErr.message }, { status: 500 })
    }

    return NextResponse.json({
      plan_id: stubPlan.id,
      generated_at: stubPlan.generated_at,
      plan_content: emptyPlanContent(),
      skipped: true,
      reason: 'no_gaps_in_mastery_map',
    })
  }

  // ------------------------------------------------------------------
  // Community-library merge — fetch human-approved submissions and
  // normalize them into the curated-resource shape so the Plan Architect
  // can pick from them alongside the curated library. Only include items
  // that carry at least one misconception tag, since untagged ones have
  // no signal for misconception-driven selection.
  // ------------------------------------------------------------------
  const { data: communityApproved } = await supabase
    .from('activity_submissions')
    .select(
      'id, title, description, modality, url, source_site, duration_minutes, standard_ids, misconception_ids, research_basis, contributor_name',
    )
    .eq('status', 'human_approved')
    .limit(200)

  interface CommunityRow {
    id: string
    title: string
    description: string
    modality: string
    url: string | null
    source_site: string | null
    duration_minutes: number | null
    standard_ids: string[] | null
    misconception_ids: string[] | null
    research_basis: string | null
    contributor_name: string
  }
  const communityResources = ((communityApproved as CommunityRow[] | null) ?? [])
    .filter((c) => Array.isArray(c.misconception_ids) && c.misconception_ids.length > 0)
    .map((c) => ({
      // Prefix the id so it can't collide with curated `r##` ids.
      id: `c_${c.id.slice(0, 8)}`,
      source: 'community' as const,
      title: c.title,
      modality: c.modality,
      source_site: c.source_site ?? c.contributor_name,
      url: c.url,
      duration_minutes: c.duration_minutes,
      grade_band: '3-4',
      misconception_ids: c.misconception_ids ?? [],
      standard_ids: c.standard_ids ?? [],
      notes: c.description,
      research_basis: c.research_basis,
      contributor_name: c.contributor_name,
    }))

  // ------------------------------------------------------------------
  // Lever 2 — trim taxonomy / coherence to flagged standards only.
  // ------------------------------------------------------------------
  const flaggedStandardIds = Object.entries(masteryMap.standards ?? {})
    .filter(([, v]) => v.state === 'misconception' || v.state === 'working')
    .map(([k]) => k)

  // Use the problems associated with flagged standards to scope misconceptions.
  // (We don't have per-assessment responses here, so we infer relevant
  // problems from the standard list.)
  const allProblems = getAllProblems()
  const relevantProblems = allProblems.filter((p) =>
    p.ccss_standard_ids.some((sid) => flaggedStandardIds.includes(sid)),
  )
  const trimmedMisconceptions = relevantMisconceptions(relevantProblems, misconceptionsRaw)
  const trimmedCoherence = relevantCoherenceNodes(flaggedStandardIds, coherenceMapRaw)

  const { data: priorPlans } = await supabase
    .from('plans')
    .select('id, assessment_id, generated_at, plan_content')
    .eq('learner_id', assessment.learner_id)
    .order('generated_at', { ascending: false })
    .limit(3)

  const client = new Anthropic({ apiKey })

  // Truly invariant block — curated resource library only. Kept in its own
  // cache prefix so it stays warm even when the community list changes.
  const curatedReferenceBlock = `# Reference data (curated, invariant)

## Resource library — curated
The curated library is the canonical set of activities Barbara hand-picked.
Each entry has a stable id (e.g. \`r02\`) you reference in your output.

${JSON.stringify(resourcesRaw, null, 2)}`

  // Variable block — community-approved activities + trimmed taxonomy +
  // trimmed coherence. The community list changes as Barbara approves
  // submissions, so this block invalidates separately from the curated
  // prefix. The taxonomy/coherence vary by which standards were flagged.
  const dynamicReferenceBlock = `# Reference data (varies per call)

## Resource library — community-approved (treat equally with curated)
These activities were proposed by guides/teachers/parents, AI-vetted, and
human-approved. Their ids start with \`c_\`. The misconception_ids on each
entry are AI-suggested at submission time. They carry a \`source: "community"\`
field for provenance, and may include a \`contributor_name\` and
\`research_basis\`. Treat them on equal footing with curated activities
when selecting for a priority gap; pick on misconception match and
modality balance, not on source.

${JSON.stringify(communityResources, null, 2)}

## Misconception taxonomy (only entries referenced by flagged standards)
${JSON.stringify(trimmedMisconceptions, null, 2)}

## Coherence map subgraph (flagged standards + one-hop prerequisites)
${JSON.stringify(trimmedCoherence, null, 2)}`

  const learnerBlock = `# Per-learner data

## Mastery map
${JSON.stringify(masteryMap, null, 2)}

## Prior plans for this learner
${JSON.stringify((priorPlans as PriorPlanRow[] | null) ?? [], null, 2)}

Return the plan as JSON matching the schema in your system instructions. No markdown fences, no commentary.`

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: [
        {
          type: 'text',
          text: PLAN_ARCHITECT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: curatedReferenceBlock,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: dynamicReferenceBlock,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: learnerBlock,
            },
          ],
        },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Plan generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json(
      { error: 'Plan Architect returned no text content' },
      { status: 500 },
    )
  }

  let planText = textBlock.text.trim()
  if (planText.startsWith('```')) {
    planText = planText
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
  }

  let planContent: unknown
  try {
    planContent = JSON.parse(planText)
  } catch {
    return NextResponse.json(
      {
        error: 'Plan Architect returned invalid JSON',
        raw: textBlock.text.slice(0, 1000),
      },
      { status: 500 },
    )
  }

  await supabase
    .from('plans')
    .update({ status: 'superseded' })
    .eq('learner_id', assessment.learner_id)
    .eq('status', 'active')

  const { data: savedPlan, error: insertError } = await supabase
    .from('plans')
    .insert({
      learner_id: assessment.learner_id,
      assessment_id: assessment.id,
      plan_content: planContent,
      status: 'active',
    })
    .select('id, generated_at')
    .single()
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    plan_id: savedPlan.id,
    generated_at: savedPlan.generated_at,
    plan_content: planContent,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
    },
  })
}
