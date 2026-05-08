import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  PLAN_ARCHITECT_SYSTEM_PROMPT,
} from '@/lib/plan-architect-prompt'
import coherenceMapRaw from '@/content/coherence-map-fractions.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'
import resourcesRaw from '@/content/fractions-resources.json'

/**
 * Plan Architect — single Messages API call to Sonnet 4.6 with adaptive
 * thinking and prompt caching. Replaces the previous Managed Agents
 * implementation, which paid for sandbox compute the Plan Architect did
 * not use (no code execution, no file edits, no web tools).
 *
 * Caching strategy:
 *   - System prompt has cache_control on its last block. The system prompt
 *     is identical across every plan generation.
 *   - The user message starts with a large invariant TAXONOMY block
 *     (resource library, misconception taxonomy, coherence map) carrying
 *     its own cache_control breakpoint. This block also never changes.
 *   - The volatile per-learner data (mastery map, prior plans) lives at
 *     the end of the user message, after the last cache_control. It is
 *     the only portion that pays full input price each call.
 *
 * On a warm cache, ~10K of the ~13K input tokens are served from cache at
 * 0.1× price, and only the per-learner mastery map + prior plans pay full
 * input price. Marginal cost per plan drops to ~$0.04 (Sonnet 4.6).
 */

// Sonnet 4.6 plan generation typically completes in 15–40 seconds.
// Vercel Hobby caps server functions at 60s; Pro at 300s.
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

  const { data: priorPlans } = await supabase
    .from('plans')
    .select('id, assessment_id, generated_at, plan_content')
    .eq('learner_id', assessment.learner_id)
    .order('generated_at', { ascending: false })
    .limit(3)

  const client = new Anthropic({ apiKey })

  // The invariant block — taxonomy data the model needs but that does not
  // change between plan generations. Cache aggressively.
  const taxonomyBlock = `# Reference data (invariant across all plan generations)

## Resource library
${JSON.stringify(resourcesRaw, null, 2)}

## Misconception taxonomy
${JSON.stringify(misconceptionsRaw, null, 2)}

## Coherence map subgraph
${JSON.stringify(coherenceMapRaw, null, 2)}`

  // The volatile block — per-learner data. Different on every call.
  const learnerBlock = `# Per-learner data

## Mastery map (just produced for this learner)
${JSON.stringify(assessment.mastery_map, null, 2)}

## Prior plans for this learner
${JSON.stringify((priorPlans as PriorPlanRow[] | null) ?? [], null, 2)}

Return the plan as JSON matching the schema in your system instructions. No markdown fences, no commentary.`

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
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
              text: taxonomyBlock,
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

  // Extract the first text block. The model is instructed to return ONLY
  // JSON; thinking blocks (when adaptive thinking activates) precede the
  // text block but are filtered out here.
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
