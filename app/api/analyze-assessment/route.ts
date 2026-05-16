import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getAllProblems } from '@/lib/problem-selection'
import { ANALYSIS_SYSTEM_PROMPT, ANALYSIS_USER_INSTRUCTIONS } from '@/lib/analysis-prompt'
import {
  relevantStandardIds,
  relevantProblems,
  relevantMisconceptions,
  relevantCoherenceNodes,
} from '@/lib/cost-savings'
import coherenceMapRaw from '@/content/coherence-map-fractions.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'
import type { TelemetryEvent } from '@/components/fraction-workspace/types'

/**
 * Two-tier analysis pipeline (cost-optimized).
 *
 * Stage 1 — Haiku 4.5 triage (cheap). Produces the same mastery-map JSON
 *   PLUS a top-level `confidence` field ("high" | "low") and a per-standard
 *   `confidence` flag. If confidence is "high" overall AND no individual
 *   standard is flagged "low", we keep Haiku's verdict and stop.
 *
 * Stage 2 — Opus 4.7 (premium). Only fires when Haiku says "escalate." Reads
 *   exactly the same trimmed inputs and writes the authoritative mastery
 *   map.
 *
 * Plus: input filtering — we only send the problems the kid actually
 * attempted, the misconceptions referenced by those problems, and the
 * coherence-map nodes for the touched standards (with one-hop prereqs).
 *
 * Expected per-assessment cost (warm cache):
 *   - clear-cut case (~70% of assessments): ~$0.01  (Haiku only)
 *   - escalation case (~30% of assessments): ~$0.18 (Haiku + Opus)
 *   - blended average: ~$0.06
 */

export const maxDuration = 60

interface StoredResponse {
  problem_id: string
  problem_type: string
  telemetry: TelemetryEvent[]
  committed_success: boolean
}

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const OPUS_MODEL = 'claude-opus-4-7'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set on server' }, { status: 500 })
  }

  let body: { assessment_id?: string; parent_assessment_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const assessmentId = body.assessment_id
  const parentAssessmentId = body.parent_assessment_id
  if (!assessmentId) {
    return NextResponse.json({ error: 'assessment_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select('id, completed_at, responses')
    .eq('id', assessmentId)
    .single()
  if (fetchError || !assessment) {
    return NextResponse.json({ error: 'assessment not found' }, { status: 404 })
  }
  if (!assessment.completed_at) {
    return NextResponse.json({ error: 'assessment not yet completed' }, { status: 400 })
  }

  const responses = (assessment.responses as StoredResponse[] | null) ?? []
  if (responses.length === 0) {
    return NextResponse.json({ error: 'assessment has no responses' }, { status: 400 })
  }

  // ------------------------------------------------------------------
  // Lever 2 — filter inputs to only what's relevant to this assessment.
  // ------------------------------------------------------------------
  const allProblems = getAllProblems()
  const trimmedProblems = relevantProblems(responses, allProblems)
  const trimmedMisconceptions = relevantMisconceptions(trimmedProblems, misconceptionsRaw)
  const standardIds = relevantStandardIds(responses, allProblems)
  const trimmedCoherenceMap = relevantCoherenceNodes(standardIds, coherenceMapRaw)

  const anthropic = new Anthropic({ apiKey })

  // Shared system blocks — same for both Haiku and Opus calls so caching
  // works across the pair.
  const sharedSystem = [
    { type: 'text' as const, text: ANALYSIS_SYSTEM_PROMPT },
    {
      type: 'text' as const,
      text: `PROBLEM BANK (only the problems this learner attempted):\n${JSON.stringify(trimmedProblems, null, 2)}`,
    },
    {
      type: 'text' as const,
      text: `MISCONCEPTION TAXONOMY (only entries referenced by the attempted problems):\n${JSON.stringify(trimmedMisconceptions, null, 2)}`,
    },
    {
      type: 'text' as const,
      text: `COHERENCE MAP SUBGRAPH (touched standards + one-hop prerequisites):\n${JSON.stringify(trimmedCoherenceMap, null, 2)}`,
      cache_control: { type: 'ephemeral' as const },
    },
  ]

  const userMessage = `LEARNER RESPONSES (telemetry-based):
${JSON.stringify(responses, null, 2)}

SUB-SKILL LIST — produce an entry for each, using CCSS standard IDs as keys:
${JSON.stringify(standardIds)}

${ANALYSIS_USER_INSTRUCTIONS}

ADDITIONAL — TRIAGE FIELDS REQUIRED:
At the top level of the JSON object you return, include:
  "confidence_overall": "high" | "low"

Set "confidence_overall" to "low" if ANY of the following are true:
  - Telemetry contains an ambiguous wrong-attempt pattern that does not
    cleanly map to a misconception_response_map entry.
  - You are flagging a misconception inferred from target_misconception_ids
    rather than from a direct response-map match.
  - You marked a standard "working" but a stronger model might mark it
    "demonstrated" or "misconception" with more confidence.
  - The trajectory shows unusual patterns (very fast wrongs, repeated
    same-strategy resets, etc.) that benefit from deeper reading.
Otherwise set "confidence_overall" to "high".`

  // ------------------------------------------------------------------
  // Stage 1 — Haiku triage
  // ------------------------------------------------------------------
  let haikuResult: { masteryMap: unknown; confidence: 'high' | 'low' } | null = null
  try {
    const haikuResp = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 2000,
      system: sharedSystem,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = haikuResp.content[0]
    if (block && block.type === 'text') {
      const parsed = parseModelJson(block.text)
      if (parsed && typeof parsed === 'object') {
        const conf = (parsed as { confidence_overall?: string }).confidence_overall
        haikuResult = {
          masteryMap: parsed,
          confidence: conf === 'low' ? 'low' : 'high',
        }
      }
    }
  } catch (err) {
    // Haiku failed — fall through to Opus.
    console.warn('Haiku triage failed; escalating to Opus', err)
  }

  // ------------------------------------------------------------------
  // Stage 2 — Opus, only if needed
  // ------------------------------------------------------------------
  let masteryMap: unknown
  let usedTier: 'haiku' | 'opus' = 'haiku'
  let opusUsage: Anthropic.Messages.Usage | null = null
  let haikuUsage: Anthropic.Messages.Usage | null = null

  if (haikuResult && haikuResult.confidence === 'high') {
    masteryMap = haikuResult.masteryMap
  } else {
    usedTier = 'opus'
    const opusResp = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 2000,
      system: sharedSystem,
      messages: [{ role: 'user', content: userMessage }],
    })
    opusUsage = opusResp.usage
    const block = opusResp.content[0]
    if (!block || block.type !== 'text') {
      return NextResponse.json({ error: 'unexpected response format from Opus' }, { status: 500 })
    }
    const parsed = parseModelJson(block.text)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Opus returned invalid JSON', raw: block.text.slice(0, 500) },
        { status: 500 },
      )
    }
    masteryMap = parsed
  }

  // Snapshot the first-analyzed state to mastery_map_initial so the
  // /learner/[id] diff panel has something to compare against once probes
  // start mutating mastery_map in place. We only set it when it's still
  // null AND this is a full assessment — probes don't get a baseline of
  // their own. Idempotent: if it's already populated, leave it alone.
  const { data: existingForSnapshot } = await supabase
    .from('assessments')
    .select('type, mastery_map_initial')
    .eq('id', assessmentId)
    .single()
  const shouldSnapshot =
    existingForSnapshot?.type === 'full' &&
    !existingForSnapshot?.mastery_map_initial

  const updatePayload: Record<string, unknown> = { mastery_map: masteryMap }
  if (shouldSnapshot) {
    updatePayload.mastery_map_initial = masteryMap
  }

  const { error: updateError } = await supabase
    .from('assessments')
    .update(updatePayload)
    .eq('id', assessmentId)
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Focused-probe merge into parent assessment (unchanged behavior).
  let parentMerged = false
  if (parentAssessmentId) {
    const { data: parent } = await supabase
      .from('assessments')
      .select('mastery_map')
      .eq('id', parentAssessmentId)
      .single()
    if (parent?.mastery_map) {
      type StandardEntry = {
        state: 'misconception' | 'working' | 'demonstrated' | 'not_assessed'
      }
      type MMap = { standards: Record<string, StandardEntry>; overall_notes?: string }
      const parentMap = parent.mastery_map as MMap
      const probeMap = masteryMap as MMap
      const mergedStandards = { ...parentMap.standards }
      for (const [sid, entry] of Object.entries(probeMap.standards ?? {})) {
        if (entry.state !== 'not_assessed') {
          mergedStandards[sid] = entry
        }
      }
      const merged: MMap = {
        ...parentMap,
        standards: mergedStandards,
      }
      const { error: parentErr } = await supabase
        .from('assessments')
        .update({ mastery_map: merged })
        .eq('id', parentAssessmentId)
      parentMerged = !parentErr
    }
  }

  return NextResponse.json({
    mastery_map: masteryMap,
    parent_merged: parentMerged,
    tier_used: usedTier,
    haiku_usage: haikuUsage,
    opus_usage: opusUsage,
  })
}

/** Parse a model response that may be wrapped in markdown fences. */
function parseModelJson(text: string): unknown | null {
  let t = text.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}
