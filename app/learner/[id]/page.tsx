import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MasteryVoyage from './MasteryVoyage'
import type { PlanContent } from './PlanDisplay'
import { OrnamentalRule } from '@/app/Ornament'

interface StandardReport {
  state: 'misconception' | 'working' | 'demonstrated' | 'not_assessed'
  evidence_problem_ids: string[]
  flagged_misconception_ids: string[]
  reasoning: string
}
interface MasteryMap {
  standards: Record<string, StandardReport>
  overall_notes?: string
}

export default async function LearnerDashboardPage(
  props: PageProps<'/learner/[id]'>
) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: learner, error: learnerErr } = await supabase
    .from('learners')
    .select('id, name, age, grade_level')
    .eq('id', id)
    .single()
  if (learnerErr || !learner) notFound()

  // Pull the latest GENERAL assessment, not the latest of any type.
  // Focused-probe assessments merge their results back into their parent
  // (the parent's mastery_map is updated server-side at probe-analyze
  // time), but the probe row itself only knows about the one standard it
  // probed. Showing the probe row directly would shrink the standards
  // table to one row. The parent already has the up-to-date picture.
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, completed_at, mastery_map, type')
    .eq('learner_id', id)
    .eq('type', 'full')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)

  const latest = assessments?.[0]
  const masteryMap = (latest?.mastery_map as MasteryMap | null) ?? null

  let planContent: PlanContent | null = null
  let planId: string | null = null
  if (latest && masteryMap) {
    const { data: planRow } = await supabase
      .from('plans')
      .select('id, plan_content')
      .eq('assessment_id', latest.id)
      .eq('status', 'active')
      .maybeSingle()
    if (planRow) {
      planContent = planRow.plan_content as PlanContent
      planId = planRow.id as string
    }
  }

  // Community resources — the Plan Architect can pick approved community
  // submissions alongside curated. Fetch them and pass down so the report
  // can resolve `c_*` ids when rendering activity tiles.
  interface CommunityRow {
    id: string
    title: string
    modality: string
    url: string | null
    source_site: string | null
    duration_minutes: number | null
    contributor_name: string
  }
  const { data: communityRows } = await supabase
    .from('activity_submissions')
    .select('id, title, modality, url, source_site, duration_minutes, contributor_name')
    .eq('status', 'human_approved')
    .limit(200)
  const communityResources = ((communityRows as CommunityRow[] | null) ?? []).map(
    (c) => ({
      id: `c_${c.id.slice(0, 8)}`,
      title: c.title,
      modality: c.modality,
      source_site: c.source_site ?? c.contributor_name,
      url: c.url,
      duration_minutes: c.duration_minutes ?? undefined,
      source: 'community' as const,
      contributor_name: c.contributor_name,
    }),
  )

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
        <header className="flex flex-col gap-2 items-center text-center">
          <p
            className="text-sm tracking-[0.4em] uppercase text-brass"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            Mastery voyage of
          </p>
          <h1
            className="text-3xl sm:text-4xl tracking-tight text-cream"
            style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 600 }}
          >
            {learner.name}
          </h1>
          {latest?.completed_at && (
            <p
              className="text-xs text-cream-faint italic mt-1"
              style={{ fontFamily: 'var(--font-special-elite)' }}
            >
              Snapshot from{' '}
              {new Date(latest.completed_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
          {!latest && (
            <p className="text-sm text-cream-soft">
              No completed assessments yet — every stratum awaits the first probe.
            </p>
          )}
          <OrnamentalRule className="h-4 text-brass-deep mt-3" width={240} />
        </header>

        <MasteryVoyage
          masteryMap={masteryMap}
          plan={planContent}
          planId={planId}
          assessmentId={latest?.id ?? null}
          learnerId={learner.id}
          communityResources={communityResources}
        />

        <footer
          className="text-xs text-cream-faint italic text-center"
          style={{ fontFamily: 'var(--font-special-elite)' }}
        >
          Cloudscape: Simon Alexandre-Clément Denis, 1786 (Getty Museum, public domain). Balloon: Versailles ascent, 1783 (Library of Congress, public domain). Progressions sourced from Bill McCallum, hosted at mathematicalmusings.org.
        </footer>
      </div>
    </main>
  )
}
