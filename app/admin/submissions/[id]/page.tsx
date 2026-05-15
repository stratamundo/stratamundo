import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewActions from './ReviewActions'
import { standardName } from '@/lib/standard-labels'
import misconceptionsRaw from '@/content/fractions-misconceptions.json'

const misconceptions = misconceptionsRaw as unknown as {
  misconceptions: { id: string; name: string }[]
}
function misconceptionName(id: string): string {
  return misconceptions.misconceptions.find((m) => m.id === id)?.name ?? id
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ key?: string }>
}

export default async function AdminSubmissionPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { key } = await searchParams

  const adminSecret = process.env.ADMIN_REVIEW_SECRET
  if (!adminSecret) {
    return (
      <main className="bg-paper min-h-screen p-10">
        <div className="max-w-xl mx-auto rounded-sm border-2 border-red-700 bg-paper-deep p-6 text-ink">
          <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Admin secret not configured
          </h1>
          <p className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Set <code>ADMIN_REVIEW_SECRET</code> in the environment so admin links can be authenticated.
          </p>
        </div>
      </main>
    )
  }
  if (key !== adminSecret) {
    return (
      <main className="bg-paper min-h-screen p-10">
        <div className="max-w-xl mx-auto rounded-sm border-2 border-red-700 bg-paper-deep p-6 text-ink">
          <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Not authorized
          </h1>
          <p className="text-sm text-ink-soft" style={{ fontFamily: 'var(--font-fraunces)' }}>
            This admin review page requires a valid <code>?key=...</code> query parameter. Use the link from the notification email.
          </p>
        </div>
      </main>
    )
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('activity_submissions')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !row) notFound()

  const verdictColor =
    row.ai_vet_verdict === 'pass'
      ? 'border-emerald-700 bg-emerald-50'
      : row.ai_vet_verdict === 'borderline'
        ? 'border-brass-deep bg-brass/15'
        : row.ai_vet_verdict === 'reject'
          ? 'border-red-700 bg-red-50'
          : 'border-stone-300 bg-paper'

  return (
    <main className="bg-paper min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p
            className="text-sm tracking-[0.3em] uppercase text-ink-faint"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Admin · activity submission review
          </p>
          <h1
            className="text-2xl text-ink"
            style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
          >
            {row.title}
          </h1>
          <p
            className="text-xs text-ink-faint"
            style={{ fontFamily: 'var(--font-special-elite)' }}
          >
            ID {row.id} · submitted {new Date(row.created_at).toLocaleString()}
          </p>
        </header>

        <div className={`rounded-sm border-2 ${verdictColor} p-5 flex flex-col gap-2`}>
          <div
            className="text-sm tracking-[0.25em] uppercase text-brass-deep"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            AI vet verdict · {row.ai_vet_verdict ? row.ai_vet_verdict.toUpperCase() : '(no AI vet ran)'}
          </div>
          {row.ai_vet_reasoning && (
            <p className="text-sm text-ink-soft italic" style={{ fontFamily: 'var(--font-fraunces)' }}>
              {row.ai_vet_reasoning}
            </p>
          )}
          {row.ai_vet_flags && row.ai_vet_flags.length > 0 && (
            <p className="text-xs text-ink-faint" style={{ fontFamily: 'var(--font-special-elite)' }}>
              Flags: {(row.ai_vet_flags as string[]).join(', ')}
            </p>
          )}
        </div>

        <section className="rounded-sm border-2 border-brass-deep/40 bg-[oklch(0.98_0.012_78)] p-5 flex flex-col gap-3">
          <Field label="Description" body={row.description} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Modality" body={row.modality} />
            <Field
              label="Duration"
              body={row.duration_minutes ? `${row.duration_minutes} min` : '—'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="URL" body={row.url ?? '—'} link={row.url ?? undefined} />
            <Field label="Source" body={row.source_site ?? '—'} />
          </div>
          {row.rationale && <Field label="Why it works" body={row.rationale} />}
          {row.research_basis && (
            <Field label="Research basis (contributor-supplied)" body={row.research_basis} />
          )}
          <Field
            label="Standards"
            body={(row.standard_ids as string[])
              .map((sid) => `${standardName(sid)} (${sid})`)
              .join(' · ')}
          />
          <Field
            label="Misconceptions (AI-suggested)"
            body={
              Array.isArray(row.misconception_ids) && row.misconception_ids.length > 0
                ? (row.misconception_ids as string[])
                    .map((mid) => `${misconceptionName(mid)} (${mid})`)
                    .join(' · ')
                : '— (AI did not map this activity to any tracked misconception)'
            }
          />
          <Field
            label="Contributor"
            body={`${row.contributor_name} <${row.contributor_email}>`}
          />
        </section>

        <ReviewActions
          submissionId={id}
          adminKey={key}
          currentStatus={row.status}
          existingNotes={row.human_review_notes ?? ''}
        />
      </div>
    </main>
  )
}

function Field({ label, body, link }: { label: string; body: string; link?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-sm tracking-[0.2em] uppercase text-brass-deep"
        style={{ fontFamily: 'var(--font-cinzel)' }}
      >
        {label}
      </span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-copper hover:text-brass-deep underline underline-offset-2 break-all"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          {body}
        </a>
      ) : (
        <p
          className="text-sm text-ink"
          style={{ fontFamily: 'var(--font-fraunces)', whiteSpace: 'pre-wrap' }}
        >
          {body}
        </p>
      )}
    </div>
  )
}
