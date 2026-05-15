'use client'

import { useState } from 'react'
import { standardName } from '@/lib/standard-labels'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'

const misconceptions = misconceptionsRaw as unknown as {
  misconceptions: { id: string; name: string }[]
}
function misconceptionName(id: string): string {
  return misconceptions.misconceptions.find((m) => m.id === id)?.name ?? id
}

const MODALITIES: { value: string; label: string; hint: string }[] = [
  { value: 'video', label: 'Video', hint: 'A video the learner watches.' },
  { value: 'manipulative', label: 'Hands-on / manipulative', hint: 'A physical material the learner touches and arranges.' },
  { value: 'game_or_interactive', label: 'Game or interactive', hint: 'A digital simulation, game, or interactive applet.' },
  { value: 'worksheet', label: 'Worksheet', hint: 'A printable or PDF practice set.' },
  { value: 'other', label: 'Other', hint: 'Something that doesn’t fit the categories above.' },
]

interface Props {
  /** When provided, locks the standard picker to that standard.
   *  Used by the "Suggest activity for this standard" entry point on the report. */
  initialStandardId?: string
}

export default function ContributeForm({ initialStandardId }: Props) {
  // The form collapses what was "description + rationale" into a single
  // "Why does this work?" field. It's stored as `description` in state and
  // in the database (rationale stays null). Per Barbara, 2026-04-26.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [modality, setModality] = useState('manipulative')
  const [url, setUrl] = useState('')
  const [sourceSite, setSourceSite] = useState('')
  const [duration, setDuration] = useState('')
  const [researchBasis, setResearchBasis] = useState('')
  // Standards are no longer collected from the contributor — the AI vet
  // infers them from the description. We retain the standard_ids array
  // (initialized empty, or pre-populated when the contributor came in via
  // a "+ Suggest activity for this standard" deep link) so the API can
  // pass the contributor's hint along to the vet.
  const [standardIds, setStandardIds] = useState<string[]>(
    initialStandardId ? [initialStandardId] : [],
  )
  // setStandardIds is currently only used by the reset handler; the
  // standards picker UI is gone. Keep the setter to silence unused
  // warnings via the reset path.
  void setStandardIds
  const [contributorName, setContributorName] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<null | {
    verdict: 'pass' | 'borderline' | 'reject' | null
    reasoning: string | null
    flags: string[]
    submission_id: string
    suggested_standard_ids: string[]
    suggested_misconception_ids: string[]
  }>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    setAttemptedSubmit(true)
    // If validation says we're missing fields, surface the warning panel
    // and stop here — don't hit the API.
    if (missingValidationKeys().length > 0) return
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    // Normalize the URL: if the contributor typed "abc.com" without a scheme,
    // prepend https:// so the input passes <input type="url"> validation and
    // saves as a working link. Empty stays empty (URL is optional).
    let normalizedUrl: string | null = url.trim() || null
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl.replace(/^\/+/, '')
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        modality,
        url: normalizedUrl,
        source_site: sourceSite.trim() || null,
        duration_minutes: duration ? Number(duration) : null,
        research_basis: researchBasis.trim() || null,
        standard_ids: standardIds,
        contributor_name: contributorName.trim(),
        contributor_email: contributorEmail.trim(),
      }

      const res = await fetch('/api/submit-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as {
        error?: string
        debug?: string
        submission_id?: string
        vet?: {
          verdict: 'pass' | 'borderline' | 'reject'
          reasoning: string
          flags: string[]
          suggested_standard_ids?: string[]
          suggested_misconception_ids?: string[]
        } | null
        vet_error?: string | null
      }

      if (!res.ok) {
        setError(data.error ?? `Submission failed (${res.status})`)
        setIsSubmitting(false)
        return
      }

      setResult({
        verdict: data.vet?.verdict ?? null,
        reasoning: data.vet?.reasoning ?? data.vet_error ?? null,
        flags: data.vet?.flags ?? [],
        submission_id: data.submission_id ?? '',
        suggested_standard_ids: data.vet?.suggested_standard_ids ?? [],
        suggested_misconception_ids: data.vet?.suggested_misconception_ids ?? [],
      })
      setIsSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <ResultPanel
        result={result}
        onReset={() => {
          setResult(null)
          setTitle('')
          setDescription('')
          setUrl('')
          setSourceSite('')
          setDuration('')
          setResearchBasis('')
          setStandardIds(initialStandardId ? [initialStandardId] : [])
        }}
        onBackToEdit={() => {
          // Keep all fields populated so the contributor can revise.
          setResult(null)
        }}
      />
    )
  }

  function missingValidationKeys(): string[] {
    const m: string[] = []
    if (title.trim().length < 3) m.push('Activity title (at least 3 characters)')
    if (description.trim().length < 20) {
      m.push(
        `"What does the learner do" needs at least 20 characters (you have ${description.trim().length})`,
      )
    }
    if (contributorName.trim().length < 2) m.push('Your name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail.trim())) {
      m.push('A valid email')
    }
    return m
  }
  const missing = missingValidationKeys()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. Activity title */}
      <FormField label="Activity title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Build-a-fraction interactive — PhET"
          className={inputCls}
          style={{ fontFamily: 'var(--font-fraunces)' }}
          required
          minLength={3}
        />
      </FormField>

      {/* 2. What does the learner do — primary descriptive field.
              The standards picker is gone: AI infers standards and
              misconceptions from the description during vetting.
              Per Barbara, 2026-04-28. */}
      <FormField
        label="What does the learner do, and what concepts does it teach?"
        required
        hint="Describe the action and the concept together. The AI will tag the CCSS standards and misconceptions for you. (At least 20 characters.)"
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The learner drags fraction pieces of different sizes onto a target bar to discover equivalence — they see 1/2 = 2/4 = 4/8 by physical size-matching."
          rows={4}
          className={`${inputCls} resize-y min-h-[88px]`}
          style={{ fontFamily: 'var(--font-fraunces)' }}
          required
          minLength={20}
        />
      </FormField>

      {/* 4. Modality (now with "Other") */}
      <FormField label="Modality" required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODALITIES.map((m) => (
            <label
              key={m.value}
              className={`relative cursor-pointer rounded-sm border-2 px-3 py-2.5 transition-colors ${
                modality === m.value
                  ? 'border-brass-deep bg-brass/20 shadow-[0_0_8px_oklch(0.74_0.14_80/0.25)]'
                  : 'border-brass-deep/30 bg-paper hover:border-brass-deep/60'
              }`}
            >
              <input
                type="radio"
                name="modality"
                value={m.value}
                checked={modality === m.value}
                onChange={(e) => setModality(e.target.value)}
                className="sr-only"
              />
              <div
                className="text-sm text-ink"
                style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.08em', fontWeight: 700 }}
              >
                {m.label}
              </div>
              <div
                className="text-xs text-ink-soft italic mt-0.5"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                {m.hint}
              </div>
            </label>
          ))}
        </div>
      </FormField>

      {/* 5. Link 6. Source 7. Minutes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Link" hint="Optional. URL to the activity if it lives online. You can type abc.com — we'll add https:// for you.">
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="abc.com or https://abc.com"
            className={inputCls}
            style={{ fontFamily: 'var(--font-fraunces)' }}
          />
        </FormField>
        <FormField label="Source / vendor" hint="Optional. e.g., Khan Academy, PhET, Lakeshore, Didax.">
          <input
            type="text"
            value={sourceSite}
            onChange={(e) => setSourceSite(e.target.value)}
            placeholder="e.g., phet.colorado.edu or Lakeshore"
            className={inputCls}
            style={{ fontFamily: 'var(--font-fraunces)' }}
          />
        </FormField>
      </div>

      <FormField label="Duration (minutes)" hint="Optional. About how long does this activity take?">
        <input
          type="number"
          min={1}
          max={120}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className={`${inputCls} max-w-[10rem]`}
          style={{ fontFamily: 'var(--font-fraunces)' }}
        />
      </FormField>

      <FormField
        label="Research basis"
        hint="Optional. The study, practice guide, or evidence base behind this activity. e.g. 'IES What Works Clearinghouse — Developing Effective Fractions Instruction K–8, Recommendation 2.' Helps build credibility for the library."
      >
        <textarea
          value={researchBasis}
          onChange={(e) => setResearchBasis(e.target.value.slice(0, 280))}
          placeholder="(optional) e.g. Cramer et al. 2017, Teaching Children Mathematics — third-grade number-line instruction."
          rows={2}
          className={`${inputCls} resize-y min-h-[56px]`}
          style={{ fontFamily: 'var(--font-fraunces)' }}
          maxLength={280}
        />
      </FormField>

      {/* 8. Your details */}
      <div className="border-t-2 border-brass-deep/30 pt-5 flex flex-col gap-4">
        <p
          className="text-base tracking-[0.2em] uppercase text-brass-deep font-bold"
          style={{ fontFamily: 'var(--font-cinzel)' }}
        >
          ◇ Your details ◇
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Your name" required>
            <input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="First and last name"
              className={inputCls}
              style={{ fontFamily: 'var(--font-fraunces)' }}
              required
              minLength={2}
            />
          </FormField>
          <FormField label="Your email" required hint="So we can confirm receipt and follow up if we have questions.">
            <input
              type="email"
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
              style={{ fontFamily: 'var(--font-fraunces)' }}
              required
            />
          </FormField>
        </div>
      </div>

      {error && (
        <div
          className="rounded-sm border-2 border-red-700/50 bg-paper-deep px-4 py-3 text-sm text-red-700"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-sm bg-brass-deep px-7 text-xs font-bold uppercase text-cream hover:bg-brass disabled:opacity-50 transition-colors border border-brass shadow-[0_0_15px_oklch(0.74_0.14_80/0.4)]"
            style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.18em' }}
          >
            {isSubmitting ? 'Vetting… ~10 sec' : 'Submit for vetting ◇'}
          </button>
          <p
            className="text-xs text-ink-faint italic"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Reviewed by Claude Opus 4.7 first, then by a human.
          </p>
        </div>
        {missing.length > 0 && !isSubmitting && attemptedSubmit && (
          <div
            className="rounded-sm border-2 border-red-700/60 bg-red-50 px-4 py-3 text-sm text-red-800"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            <div
              className="text-sm tracking-[0.2em] uppercase text-red-800 mb-1 font-bold"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Before you can submit
            </div>
            <ul className="list-disc ml-5 space-y-0.5">
              {missing.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  )
}

const inputCls =
  'w-full h-10 rounded-sm border-2 border-brass-deep/60 bg-paper text-ink px-3 text-sm focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40 placeholder:text-ink-faint'

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-sm tracking-[0.18em] uppercase text-brass-deep font-bold"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        {label}
        {required && <span className="text-red-700 ml-1" aria-hidden>*</span>}
      </span>
      {children}
      {hint && (
        <span
          className="text-xs text-ink-faint italic"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          {hint}
        </span>
      )}
    </label>
  )
}

/**
 * Splits the AI reasoning into bullets. The vet prompt now instructs the
 * model to return short bullet lines (one fact per line). If a single
 * paragraph slips through, we split on sentence boundaries as a fallback.
 */
function reasoningBullets(reasoning: string): string[] {
  const trimmed = reasoning.trim()
  if (!trimmed) return []
  // If the model returned bulleted lines (with `-`, `*`, or `•`), split on those.
  const bulletPattern = /(?:^|\n)\s*[-*•]\s+/
  if (bulletPattern.test(trimmed)) {
    return trimmed
      .split(bulletPattern)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }
  // Newline-separated lines.
  const newlineLines = trimmed.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 0)
  if (newlineLines.length > 1) return newlineLines
  // Fallback: split on sentence boundaries.
  return trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function ResultPanel({
  result,
  onReset,
  onBackToEdit,
}: {
  result: {
    verdict: 'pass' | 'borderline' | 'reject' | null
    reasoning: string | null
    flags: string[]
    submission_id: string
    suggested_standard_ids: string[]
    suggested_misconception_ids: string[]
  }
  onReset: () => void
  onBackToEdit: () => void
}) {
  const verdict = result.verdict
  // All verdicts get the same warm thank-you opener.
  const headline = 'Thank you for contributing a learning activity to our community.'
  const next =
    verdict === 'pass'
      ? 'Your submission passed automated review. You’ll receive an email when a human reviewer approves it (and it goes live on the platform), or if there’s a reason it can’t be accepted.'
      : verdict === 'borderline'
        ? 'Our automated reviewer flagged a few things for closer human review. You’ll receive an email when a human reviewer reaches a decision.'
        : verdict === 'reject'
          ? 'Our automated reviewer didn’t accept this submission. The specific issues are listed below — please revise and resubmit. (No human reviewer is queued for AI-rejected submissions; the AI’s rationale is the full feedback.)'
          : 'A human reviewer will take it from here. You’ll receive an email with the outcome.'

  const verdictLabel =
    verdict === 'pass'
      ? 'AI vet · PASS'
      : verdict === 'borderline'
        ? 'AI vet · BORDERLINE'
        : verdict === 'reject'
          ? 'AI vet · REJECT'
          : 'Submission received'

  const verdictColor =
    verdict === 'pass'
      ? 'border-emerald-700 bg-emerald-50'
      : verdict === 'borderline'
        ? 'border-brass-deep bg-brass/15'
        : verdict === 'reject'
          ? 'border-red-700 bg-red-50'
          : 'border-brass-deep/50 bg-paper-deep/30'

  const bullets = result.reasoning ? reasoningBullets(result.reasoning) : []

  return (
    <div className={`relative rounded-sm border-2 ${verdictColor} p-6 flex flex-col gap-3 shadow-[0_0_20px_oklch(0.74_0.14_80/0.18)]`}>
      <span
        className="text-sm tracking-[0.25em] uppercase text-brass-deep"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        {verdictLabel}
      </span>
      <h2
        className="text-2xl text-ink"
        style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
      >
        {headline}
      </h2>
      <p className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-fraunces)' }}>
        {next}
      </p>

      {(result.suggested_standard_ids.length > 0 || result.suggested_misconception_ids.length > 0) && (
        <div className="rounded-sm bg-paper px-4 py-3 border border-brass-deep/30 flex flex-col gap-2">
          <div
            className="text-sm tracking-[0.2em] uppercase text-brass-deep"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            AI tagged your activity with
          </div>
          {result.suggested_standard_ids.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.suggested_standard_ids.map((sid) => (
                <span
                  key={`s-${sid}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brass-deep/40 bg-paper-deep/30 px-2.5 py-0.5 text-xs text-ink"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  <span style={{ fontFamily: 'var(--font-special-elite)' }}>{sid}</span>
                  <span className="text-ink-soft">{standardName(sid)}</span>
                </span>
              ))}
            </div>
          )}
          {result.suggested_misconception_ids.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.suggested_misconception_ids.map((mid) => (
                <span
                  key={`m-${mid}`}
                  className="inline-flex items-center gap-1 rounded-full border border-red-600/40 bg-red-50/80 px-2.5 py-0.5 text-xs text-red-800"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  ◆ {misconceptionName(mid)}
                </span>
              ))}
            </div>
          )}
          <p
            className="text-xs text-ink-faint italic mt-1"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            If anything looks off, note it in your reply when the human-review email arrives.
          </p>
        </div>
      )}

      {bullets.length > 0 && (
        <div className="rounded-sm bg-paper px-4 py-3 border border-brass-deep/30">
          <div
            className="text-sm tracking-[0.2em] uppercase text-brass-deep mb-1.5"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            AI reviewer notes
          </div>
          <ul
            className="list-disc ml-5 space-y-1 text-sm text-ink-soft italic"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
          {result.flags.length > 0 && (
            <div className="mt-2 text-xs text-ink-faint" style={{ fontFamily: 'var(--font-special-elite)' }}>
              Flags: {result.flags.join(', ')}{' '}
              <span className="italic">
                — see <a className="underline text-copper hover:text-brass-deep" href="/methodology#vetting">criteria documentation</a>.
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-ink-faint italic" style={{ fontFamily: 'var(--font-fraunces)' }}>
        Submission ID: <span style={{ fontFamily: 'var(--font-special-elite)' }}>{result.submission_id}</span>
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {verdict === 'reject' && (
          <button
            type="button"
            onClick={onBackToEdit}
            className="inline-flex h-9 items-center justify-center rounded-sm bg-brass-deep px-4 text-xs font-bold uppercase text-cream hover:bg-brass transition-colors border border-brass shadow-[0_0_12px_oklch(0.74_0.14_80/0.4)]"
            style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.18em' }}
          >
            Edit and resubmit ◇
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center justify-center rounded-sm border-2 border-brass-deep px-4 text-xs font-bold uppercase text-ink hover:bg-brass-deep/10 transition-colors"
          style={{ fontFamily: 'var(--font-cinzel)', letterSpacing: '0.18em' }}
        >
          {verdict === 'reject' ? 'Start over' : 'Submit another'}
        </button>
      </div>
    </div>
  )
}
