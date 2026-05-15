import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  vetActivitySubmission,
  verdictToStatus,
  type ActivitySubmissionInput,
} from '@/lib/ai-vet-activity'
import { sendSubmissionEmails } from '@/lib/email-submission'
import coherenceMapRaw from '@/content/coherence-map-fractions.json'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'

// AI vet typically runs 5–15 sec on Opus 4.7. Bump Vercel timeout.
export const maxDuration = 60

const coherenceMap = coherenceMapRaw as unknown as {
  nodes: { id: string; statement: string }[]
}
const VALID_STANDARD_IDS = new Set(coherenceMap.nodes.map((n) => n.id))
const STANDARDS_FOR_VET = coherenceMap.nodes.map((n) => ({
  id: n.id,
  statement: n.statement,
}))
const misconceptions = misconceptionsRaw as unknown as {
  misconceptions: { id: string; name: string }[]
}
const MISCONCEPTIONS_FOR_VET = misconceptions.misconceptions.map((m) => ({
  id: m.id,
  name: m.name,
}))
const VALID_MISCONCEPTION_IDS = new Set(misconceptions.misconceptions.map((m) => m.id))
const VALID_MODALITIES = new Set([
  'video',
  'manipulative',
  'game_or_interactive',
  'worksheet',
  'other',
])

interface SubmitBody {
  title?: unknown
  description?: unknown
  modality?: unknown
  url?: unknown
  source_site?: unknown
  duration_minutes?: unknown
  rationale?: unknown
  research_basis?: unknown
  standard_ids?: unknown
  contributor_name?: unknown
  contributor_email?: unknown
}

function validate(body: SubmitBody): { ok: true; data: ActivitySubmissionInput } | { ok: false; error: string } {
  if (typeof body.title !== 'string' || body.title.trim().length < 3) {
    return { ok: false, error: 'Title must be at least 3 characters.' }
  }
  if (typeof body.description !== 'string' || body.description.trim().length < 20) {
    return { ok: false, error: 'Description must be at least 20 characters.' }
  }
  if (typeof body.modality !== 'string' || !VALID_MODALITIES.has(body.modality)) {
    return { ok: false, error: 'Invalid modality.' }
  }
  // Standard ids are now optional — the AI vet infers them from the
  // description. If the contributor (or a future deep-link entry point)
  // does pass any, validate them.
  const inputStandardIds: string[] = Array.isArray(body.standard_ids)
    ? (body.standard_ids as unknown[]).filter((s): s is string => typeof s === 'string')
    : []
  for (const sid of inputStandardIds) {
    if (!VALID_STANDARD_IDS.has(sid)) {
      return { ok: false, error: `Unknown standard id: ${sid}` }
    }
  }
  if (typeof body.contributor_name !== 'string' || body.contributor_name.trim().length < 2) {
    return { ok: false, error: 'Contributor name is required.' }
  }
  if (
    typeof body.contributor_email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contributor_email)
  ) {
    return { ok: false, error: 'A valid contributor email is required.' }
  }

  const url =
    typeof body.url === 'string' && body.url.trim().length > 0 ? body.url.trim() : null
  const sourceSite =
    typeof body.source_site === 'string' && body.source_site.trim().length > 0
      ? body.source_site.trim()
      : null
  const duration =
    typeof body.duration_minutes === 'number' && Number.isFinite(body.duration_minutes)
      ? Math.round(body.duration_minutes)
      : null
  const rationale =
    typeof body.rationale === 'string' && body.rationale.trim().length > 0
      ? body.rationale.trim()
      : null
  const researchBasis =
    typeof body.research_basis === 'string' && body.research_basis.trim().length > 0
      ? body.research_basis.trim().slice(0, 280)
      : null

  return {
    ok: true,
    data: {
      title: body.title.trim(),
      description: body.description.trim(),
      modality: body.modality as ActivitySubmissionInput['modality'],
      url,
      source_site: sourceSite,
      duration_minutes: duration,
      rationale,
      research_basis: researchBasis,
      standard_ids: inputStandardIds,
      contributor_name: body.contributor_name.trim(),
      contributor_email: body.contributor_email.trim().toLowerCase(),
    },
  }
}

export async function POST(req: NextRequest) {
  let body: SubmitBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validated = validate(body)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const submission = validated.data

  const supabase = await createClient()

  // 1. Insert with pending_ai_vet status (so we have a row even if vet fails)
  const { data: inserted, error: insertErr } = await supabase
    .from('activity_submissions')
    .insert({
      title: submission.title,
      description: submission.description,
      modality: submission.modality,
      url: submission.url,
      source_site: submission.source_site,
      duration_minutes: submission.duration_minutes,
      rationale: submission.rationale,
      research_basis: submission.research_basis ?? null,
      standard_ids: submission.standard_ids,
      contributor_name: submission.contributor_name,
      contributor_email: submission.contributor_email,
      status: 'pending_ai_vet',
    })
    .select('id')
    .single()
  if (insertErr || !inserted) {
    return NextResponse.json(
      {
        error:
          'Could not save your submission. The activity_submissions table may not exist yet — please ask the site admin to run the migration.',
        debug: insertErr?.message,
      },
      { status: 500 },
    )
  }
  const submissionId = inserted.id as string

  // 2. Run the AI vet (Opus 4.7). Soft failure: on error, leave status
  //    as pending_ai_vet so the human reviewer can still see the row.
  const apiKey = process.env.ANTHROPIC_API_KEY
  let vetResult: Awaited<ReturnType<typeof vetActivitySubmission>> | null = null
  let vetError: string | null = null
  if (!apiKey) {
    vetError = 'ANTHROPIC_API_KEY not set on server; AI vet skipped.'
  } else {
    try {
      vetResult = await vetActivitySubmission(submission, apiKey, {
        standards: STANDARDS_FOR_VET,
        misconceptions: MISCONCEPTIONS_FOR_VET,
      })
    } catch (err) {
      vetError = err instanceof Error ? err.message : 'AI vet failed'
    }
  }

  // 3. Update DB with vet outcome (best-effort). When the contributor
  //    didn't supply standard_ids (the form no longer asks), backfill
  //    from the AI's suggested ids so the row has the tags it needs to
  //    be useful in the Plan Architect.
  if (vetResult) {
    const finalStandardIds =
      submission.standard_ids.length > 0
        ? submission.standard_ids
        : (vetResult.suggested_standard_ids ?? []).filter((id) =>
            VALID_STANDARD_IDS.has(id),
          )

    const finalMisconceptionIds = (vetResult.suggested_misconception_ids ?? [])
      .filter((id) => VALID_MISCONCEPTION_IDS.has(id))

    await supabase
      .from('activity_submissions')
      .update({
        status: verdictToStatus(vetResult.verdict),
        ai_vet_verdict: vetResult.verdict,
        ai_vet_reasoning: vetResult.reasoning,
        ai_vet_flags: vetResult.flags,
        ai_vet_at: new Date().toISOString(),
        standard_ids: finalStandardIds,
        misconception_ids: finalMisconceptionIds,
      })
      .eq('id', submissionId)

    // Reflect the inferred standards in the submission object so emails
    // and the response payload show them.
    submission.standard_ids = finalStandardIds
  }

  // 4. Email the admin + the contributor (best-effort, non-blocking
  //    failures don't break the submission).
  const emailResult = vetResult
    ? await sendSubmissionEmails({ submissionId, submission, vet: vetResult })
    : { skipped: true }

  return NextResponse.json({
    submission_id: submissionId,
    vet: vetResult,
    vet_error: vetError,
    email: emailResult,
  })
}
