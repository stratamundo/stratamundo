# Strata Mundo

*Your math mastery voyage.*

A diagnostic, a plan, and a probe loop — together, the voyage through math mastery. v1 covers grade 3–4 fractions; designed to extend to all of K-8 math (and beyond) without changing the engine. Built solo in 4 days for the Cerebral Valley **Built with Opus 4.7** hackathon.

🌐 **Live:** [stratamundo.com](https://stratamundo.com)

---

## The three questions Strata Mundo answers

Every guide and parent serious about mastery wants three things answered:

1. **Where is the learner in their math journey, really?** Not what they perform under pressure — what they understand.
2. **What should they work on next, exactly?** Not a percentage that needs to rise — concrete activities for a specific gap.
3. **What different effective tools are out there to truly master that skill?** Not the same boxed practice repeated — varied, real-world, hands-on options across modalities.

Existing math tools answer none of these well. Khan's course challenge probes a year with 30 questions and grades right/wrong. IXL grades a kid on speed. Beast Academy engages but doesn't diagnose. Most tools treat a wrong answer as a number to lower, not as evidence of a specific misconception to address.

## What this does

A learner takes a ~10 minute drag-and-build fractions assessment. The system records every interaction as **process telemetry** (placements, removals, commits, resets, timing) and uses Claude Opus 4.7 to read the *trajectory* — not just the final answer — and produce a **categorical mastery map** keyed by CCSS standard. Each standard gets one of four states:

| State | Display | Meaning |
|---|---|---|
| `misconception` | **Needs attention** (red) | A specific named misconception detected with evidence |
| `working` | **Working on** (amber) | Building the skill — partial understanding |
| `demonstrated` | **Mastered** (green) | Reliably understood with clear reasoning across multiple problems |
| `not_assessed` | **Not yet probed** (gray) | This standard wasn't touched in the assessment yet |

A Managed Agent — the **Plan Architect** — then writes a tailored, guide-facing plan: 2–3 concrete activities per priority gap, sequenced concrete-to-representational-to-abstract, with rationale. When the guide thinks a misconception has resolved, a **focused probe** (4–6 problems, ~10 min) verifies it and merges the result back into the original mastery map.

A learner-facing **mastery voyage** at `/learner/[id]` visualizes progress as a vertical scene of cloud strata. Each stratum is one IM Section. The airship floats at the section the learner is currently working on. Pennants on each stratum mark individual standards, colored by state, with brass dots above for completed activities. Mastered strata shimmer in brass-gold; later strata sit faint and high in the sky.

## How the diagnosis is grounded

Two design moves we haven't seen elsewhere in math ed-tech:

1. **Named misconception detection with traceable evidence.** Wrong-answer patterns (e.g., placing four 1/8 pieces when asked for 1/4) are explicitly mapped to misconceptions from the literature (e.g., *m07 — notational confusion*). The mastery map lists which problems fired which misconception.
2. **Strategy-switching on reset is treated as positive mastery evidence.** A learner who tries 1/4 pieces, gaps, resets, and tries 1/8 pieces successfully is marked as *demonstrated* on equivalence reasoning — comparable strength of evidence to first-try success. Most tools penalize resets; this one rewards self-correction. (Basis: Rittle-Johnson 2017 on iterative conceptual↔procedural; Siegler's overlapping-waves theory.)

## Non-negotiable principles

1. **No learner-facing chatbot.** Structured interactions only.
2. **Mastery over performance.** Categorical states, never percentages.
3. **Respect learner agency.** No gated progression. The guide declares mastery; the system shows evidence.
4. **Intrinsic motivation.** The assessment feels purposeful, not test-like.
5. **Protect against gaming.** Drag-and-build mechanic with material feedback (gaps, overhangs); no multiple choice.

## Demo flow (3 minutes)

1. **Set up a learner** at `/setup` (Katie, age 9, grade 4).
2. **Assessment:** ~9 build_fraction problems where the learner drags unit pieces (1/2, 1/3, 1/4, 1/6, 1/8) onto a target bar to build the requested fraction. Some problems require generating an equivalent (e.g., "Build 1/4 — you don't have a 1/4 piece"). Telemetry captures every interaction.
3. **Analysis runs (~15 sec)**, producing the mastery map with 4-state categorization, evidence problem IDs per standard, and named misconception flags where applicable.
4. **Plan Architect (~1–3 min)** generates the section roadmap (the 7 IM Sections of fractions sequenced by prerequisite, with one marked "Now" via smart-skip), plus 2–3 concrete activities per flagged standard, each with a rationale.
5. **Mastery tree dashboard** at `/learner/[id]` shows progress as an illustrated tree: leaves by state, flowers for completed activities, fruits for mastered sections.
6. **Focused probe** for any flagged standard re-tests just that one in ~10 min and merges the result back.

## How it uses Opus 4.7

**Two LLM calls per assessment.**

**1. Analysis (single Opus 4.7 call, ~15 sec).** Reads telemetry events for each problem against the misconception taxonomy + problem bank's `misconception_response_map` (explicit wrong-pattern → misconception assignments) + the CCSS Coherence Map subgraph. Produces the mastery map. Telemetry-based analysis means correctness alone doesn't trigger "mastered" — first-try success with deliberate pacing AND multiple-problem evidence are required (rule R10).

**2. Plan Architect (Managed Agent, claude-opus-4-7, ~1–3 min).** Long-horizon multi-step:
- Differential diagnosis (within-concept misconception vs. prerequisite gap)
- Smart-skip the earliest IM section containing a flagged standard
- Resource selection across modalities (video / manipulative / worksheet / game)
- Concrete-to-Representational-to-Abstract sequencing
- Rationale writing for each gap and each activity
- Avoids re-prescribing resources that prior plans already tried unsuccessfully

The Managed Agent pattern fits because plan generation is long, stateful (sees prior plans), and benefits from self-evaluation.

## Curriculum source

The roadmap structure ("sections") and their ordering are taken **verbatim from the Illustrative Mathematics K-5 curriculum**, Grade 3 Unit 5 ("Fractions as Numbers") and Grade 4 Unit 2 ("Fraction Equivalence and Comparison"). IM is licensed CC BY 4.0; the section names appear unchanged in our UI. We do not invent groupings.

CCSS standard structure and prerequisites come from the Achievethecore Coherence Map and the Common Core *Progressions for the CCSS in Mathematics — Fractions, 3–5* document (McCallum et al.).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4
- **Database / auth:** Supabase (Postgres + anonymous auth)
- **Hosting:** Vercel (auto-deploy from `main`)
- **Model:** Anthropic Claude Opus 4.7 (`claude-opus-4-7`)
- **Long-running agent:** Anthropic Managed Agents

## Honest scope (v1)

**What this does:**
- Probes 11 CCSS standards across 3rd-4th grade fractions (subset of the full strand)
- Drag-and-build mechanic for `build_fraction` problem type
- Telemetry-based trajectory analysis
- Plan generation grounded in IM curriculum sections
- Per-learner mastery tree

**What this doesn't yet do (v1.5 / v2):**
- Other 4th-grade math domains (operations & algebra, place value, measurement, geometry — shown in the UI as "Coming in v1.5")
- Number-line, comparison, partitioning problem mechanics (the bank has problems; UI renders only build_fraction in v1)
- Fraction operations (4.NF.B addition/subtraction)
- Multi-curriculum resource picker
- Community-contributed real-world activities with AI vetting
- Teacher dashboards for multiple learners

## How to run locally

```bash
git clone https://github.com/barbarajauregui-dadababa/stratamundo.git
cd stratamundo
npm install
cp .env.local.example .env.local  # fill in Supabase + Anthropic keys
npm run dev
```

Environment variables required:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
ANTHROPIC_API_KEY=sk-ant-...
PLAN_ARCHITECT_AGENT_ID=agent_...        # produced by setup script below
PLAN_ARCHITECT_ENVIRONMENT_ID=env_...    # produced by setup script below
```

Run once to provision the Plan Architect agent + environment:

```bash
npx tsx scripts/setup-plan-architect.ts
```

Database schema: run the SQL in `../ideas and vision/supabase-schema-draft.sql` in the Supabase SQL editor.

## Project structure

```
app/                Next.js App Router pages
  setup/            Create a learner + start an assessment
  assess/[id]/      Take an assessment (drag-and-build mechanic)
  report/[id]/      View mastery map + plan for one assessment
  learner/[id]/     Mastery tree dashboard (the visual)
  api/
    analyze-assessment/   Opus 4.7 call for the mastery map
    generate-plan/        Plan Architect Managed Agent session

components/         React components (FractionWorkspaceV2, etc.)
content/            Static domain JSONs (misconceptions, problem bank, coherence map, resources)
lib/                Supabase clients, problem selection, fraction math, prompts
scripts/            One-time setup scripts
```

## License

MIT for the code in this repository. See `LICENSE`.

**Third-party content credits:**
- **Illustrative Mathematics K-5 Curriculum** (Bill McCallum et al.): the 7 fractions sections and their order are used verbatim. CC BY 4.0. https://im.kendallhunt.com/k5/
- **PhET Interactive Simulations** (University of Colorado Boulder): mechanic-design inspiration; resource library links to PhET as a practice partner. CC BY 4.0. https://phet.colorado.edu/en/licensing
- **Common Core State Standards for Mathematics** and the **Coherence Map** (Achievethecore.org): standards taxonomy and prerequisite structure.

## Acknowledgments

- Bill McCallum and the IM team for the K-5 curriculum that grounds our roadmap
- Anthropic for Claude Opus 4.7 and Managed Agents
- Cerebral Valley for hosting the hackathon

---

*Built by Barbara Jauregui (with Claude Code assistance), April 22–26, 2026.*


