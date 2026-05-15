# Strata Mundo — Rebuild Spec

*Date: 2026-05-12 · Owner: Barbara · Status: v1 (draft, not yet implemented)*

> This spec replaces the v1 hackathon scope. Strata Mundo is being rebuilt from a fractions-only diagnostic into a thorough K-2 (plus the bridge to 3rd-grade multiplication) math mastery assessment. The Star Atlas Library is the home. The agent stack and the mechanics built for Math Games Builder (MGB) are the substrate. This file is the single source of truth for the rebuild.

---

## 1. The one-sentence pitch

**Strata Mundo is the K-2 math mastery assessment that tells a guide exactly what a learner understands, what they don't, and what to do about it — and it's a beautiful immersive library, not a test.**

## 2. Where Strata sits in the larger picture

Strata Mundo is one component of a larger universe centered on Math Games Builder (MGB). When the larger universe ships:

- A learner arrives at the app for the first time.
- They are routed into Strata Mundo (the Star Atlas Library) for a thorough math mastery assessment.
- The assessment produces a **mastery passport** — a JSON map of every K-2 standard with a state (`mastered`, `working`, `misconception`, `not_yet_probed`).
- The passport flows into MGB's galaxy. The galaxy lights up the moons that are mastered, dims the ones with misconceptions, and opens the ones that are next to work on.
- From that point on, MGB is the home. Strata is revisited only when the guide wants a focused re-probe on a specific standard.

**Hard constraints from this positioning:**
- Strata does NOT have a galaxy view. The galaxy is MGB's territory.
- Strata does NOT have a builder mode or a protégé loop. Older learners do not author probe content. The assessment must be pedagogically perfect; we cannot let learners mess with it.
- Strata is small in surface area but rigorous in pedagogy. It does one thing — assess — better than anything else on the market.

## 3. Scope

### In scope (v1)

- Thorough math mastery assessment for **all K-2 number-and-operations standards plus 3.OA.A.1** (the bridge to multiplication). 49 standards.
- The Star Atlas Library as the home and the diagnostic surface.
- A multi-mechanic probe engine. Each standard has at least one probe mechanic; some standards have two or three.
- The 4-stage Haiku → Sonnet runtime agent ladder running on every assessment to validate the mastery claims.
- A mastery passport export (JSON) ready for MGB to consume.
- A guide-facing report: the mastery map plus a lightweight resource menu per flagged standard.
- A practice layer: **MGB games come first as the fun incentive**, external resources (Khan, PhET, Math Learning Center, Montessori activities, etc.) are the heavy lifting.
- A community-contributed resource library with AI vetting and human approval.

### Out of scope (v1)

- Fractions assessment (the v1 hackathon scope; deprecated as a standalone product, will return only as part of a future K-5 expansion).
- Domains beyond number-and-operations (geometry, measurement, data — later versions).
- A galaxy view (lives in MGB).
- A protégé / build-the-probe loop (incompatible with assessment rigor).
- A long-running Plan Architect managed agent (the new Plan Architect is a single fast Sonnet call).
- Multiple-learner dashboards or class analytics (later).
- Offline / paper-and-pencil capture (later).
- SMS / email notifications beyond the existing welcome / resume emails.

## 4. The Star Atlas Library — the home

A walkable, immersive steampunk astronomer's reading room.

- Warm wood shelves around the room. Brass fittings. Soft lamp light. Aged-paper textures. Distant low cello chord ambient.
- A central illuminated **brass star atlas** on a heavy table in the middle of the room. The atlas is the navigation AND the overview. Each "constellation" on the atlas = one math cluster (K.CC, K.OA, K.NBT, 1.OA, etc.). Each "star" on the atlas = one standard (e.g., K.OA.A.1).
- Touch a constellation on the atlas and the corresponding shelf section in the room lights up. On the shelves are **probe cards** — the assessment items the learner attempts.
- As the learner masters a standard, the corresponding star on the atlas becomes a small gold dot. Locked stars are dim. In-progress stars pulse softly.
- The whole library is rendered with real assets per the global "use real assets, don't build visuals from code" rule. Procedural code only for state encoding (which star is gold, which probe card is currently active).
- The library inherits MGB's audio and R3F infrastructure (mute toggle bottom-right, ambient soundscape, perf-tier auto-detect).
- **Visual references:** The Room (iPad puzzle game) for tactile interaction; basement.studio for portal-zoom navigation; warm Hayao Miyazaki interiors for mood. NOT Apple-clean, NOT SaaS.

## 5. The assessment

### Flow

1. Learner enters the library.
2. The atlas highlights the **starting star** — K.CC.A.1 (count to 100 by ones and tens, the bedrock standard).
3. The learner walks (clicks) to the corresponding shelf and picks up the probe card. The card animates open and the probe mechanic appears in the workspace.
4. The learner completes the probe (60-90 seconds). Telemetry captures every interaction.
5. The system records the result locally and the atlas updates the star's state.
6. The next probe queues up automatically along the prerequisite chain (K.CC.A.1 → K.CC.A.2 → K.CC.A.3 → K.CC.B.4 → ... → 3.OA.A.1).
7. **Stop rule:** The assessment ends when **two consecutive standards along the current branch are not mastered** (state = `working`, `misconception`, or no clean evidence). At that point we stop probing forward on that branch and either move to the next branch or end the session.
8. At the end, the learner sees the atlas with all probed stars colored, plus a short congratulatory animation. The guide sees the full report.

### Why "stop on two consecutive non-masteries"

Going further would just produce noise — once a learner can't reliably do K.OA.A.2, they almost certainly can't do K.OA.A.3, and continuing probes just frustrates a young child. Two-in-a-row is conservative enough to avoid stopping on a single bad day.

### Duration target

10-15 minutes total for a typical K-1 learner. Up to 20 minutes for a learner who masters far into the sequence. Each probe is 60-90 seconds; we expect 8-15 probes per session.

### Re-probe

Any single standard can be re-probed on its own from the report screen. A re-probe is 3-5 items targeting just that standard, ~5 minutes. The re-probe result merges back into the passport.

## 6. The probe engine — multi-mechanic

The fractions hackathon shipped one mechanic (drag-and-build). The K-2 rebuild needs several, because different standards expose different misconceptions.

### Probe mechanics in v1

Each mechanic is built as an instrumented React component that emits a typed telemetry stream. Most are **probe-mode adaptations** of existing MGB engines — strip theme, strip hints, strip retry-comfort, add rigorous telemetry capture.

| Mechanic | Probes which standards | Source |
|---|---|---|
| Hundred-board count-trail | K.CC.A.1, K.CC.A.2, 1.NBT.A.1 | Verified MGB engine |
| Number-frames counting-on | K.CC.A.2, K.CC.B.5, K.OA.A.5 | Verified MGB engine |
| Free-collect pre-stocked field | K.CC.A.2, K.CC.C.6, K.CC.C.7 | Verified MGB engine |
| Cardinality commit (touch & say) | K.CC.B.4 (a, b, c), K.CC.B.5 | New build (light) |
| Drag-to-bar build (from hackathon) | Some K.OA / K.NBT cases | Reuse from current Strata |
| Decompose-into-pairs | K.OA.A.3, 1.OA.B.3 | Adapt from MGB |
| Equal-sign relation | 1.OA.D.7 (specifically) | New build (light); hits the equal-sign-as-relation misconception |
| Place-value stack | K.NBT.A.1, 1.NBT.B.2, 2.NBT.A.1 | Adapt from MGB |
| Compare-by-position | 1.NBT.B.3, 2.NBT.A.4 | New build (light) |
| Open-number-line jump | 1.OA.C.6, 2.NBT.B.5, 2.NBT.B.6 | New build |
| Equal-groups arrangement | 3.OA.A.1 | Existing MGB direction |

**Total mechanics in v1: ~10.** Most are adapted; ~4 are new builds.

### Probe-mode rules (apply to every mechanic)

1. **No hints, no retries-with-comfort, no celebrations between rounds.** Probes are not games. Telemetry must reflect the learner's first authentic attempt.
2. **No running totals, no auto-counted piles, no system-does-the-math.** The learner does the math (carries over from MGB belief #1).
3. **Strict telemetry shape.** Every interaction emits a typed event with a millisecond timestamp. Mechanics must conform to a shared `TelemetryEvent` union type so the analysis prompt can read all probes uniformly.
4. **One mechanic per standard at a time.** If multiple probes are scheduled for a standard, they are scheduled across separate sessions, not stacked in one session.

## 7. Telemetry-as-truth — the R1-R10 rules

The hackathon analysis prompt's R1-R10 rules are domain-agnostic — they're about reading **trajectories**, not about fractions. They carry over to K-2 unchanged. They are also Strata's structural answer to the Synthesis Tutor failure mode (where a fast or careless learner gets misread as not knowing).

Verbatim from `lib/analysis-prompt.ts`, with annotation for K-2 carryover:

- **R1. Process over outcome.** Don't infer mastery from `committed_success` alone.
- **R2. First-commit-success with deliberate pacing = strong "demonstrated".**
- **R3. Strategy-switching on reset = comparably strong evidence of reasoning.** A learner who resets and tries a different approach is self-correcting. Mark as demonstrated.
- **R4. Same-strategy resets = guessing/fiddling.** Even with eventual success.
- **R5. Multiple commit attempts re-using the same composition = working, not demonstrated.**
- **R6. Rapid-fire AND wrong = guessing.** Speed alone is NEVER a guessing signal. **This is the rule that protects against the Synthesis Tutor failure mode.** Fast-and-correct = fluency, not bad faith. Wrong-and-fast = guessing only when paired.
- **R7. Specific wrong-commit content maps to specific misconceptions.** Per the K-2 misconception taxonomy (built fresh — see §8).
- **R8. No commit attempt = `not_assessed` for that probe.**
- **R9. Evidence in data; reasoning in plain language.** No internal IDs in narrative. No bracketed arrays. Guide-readable English.
- **R10. Variety requirement for "demonstrated".** A standard is demonstrated only if the learner succeeded across at least 2 probes for it (where probes exist), with at least one showing clear reasoning.

## 8. The agent stack — runtime and design-time

Strata uses the same agent toolkit as MGB, in two distinct postures.

### Runtime (every assessment)

When a learner finishes the assessment, the analysis prompt produces a draft mastery passport. Before that passport is shown to the guide, the **4-stage Haiku → Sonnet ladder** validates it. (Cost ~$0.05-$0.20 per assessment, identical to MGB's per-game cost envelope.)

| Stage | Agent | Job | Model | Approx cost |
|---|---|---|---|---|
| 1 | Haiku Critic (cheap filter) | Is each mastery claim defensible from the cited telemetry? | Haiku | $0.001 |
| 2 | Sonnet Critic (deep) | Same question, deeper reading. Catch subtle over-claims. | Sonnet | $0.025 |
| 3 | Haiku Shortcut Adversary (obvious) | Could a learner have been marked `mastered` without doing the math? | Haiku | $0.005 |
| 4 | Sonnet Shortcut Adversary (creative) | Same question, harder shortcuts. | Sonnet | $0.075 |

If any stage flags a problem, the passport entry for that standard is downgraded with a note in the report explaining why. The guide always sees the agent reasoning.

### Design-time (every probe and every misconception, once before they ship)

Three agents act as one-shot guards on the **content** before it goes live. None of these run per-assessment; they run when we add a new probe or a new misconception entry.

- **Mr. Chesure on every probe:** Does this probe actually test the standard it claims to test? Could a learner demonstrate mastery of a *different* concept and look mastered on this one?
- **Mr. Chesure on every misconception definition:** Is this a real, named, research-backed misconception? Or are we inventing pedagogy?
- **Equity Reviewer on every probe:** Does the scenario, language, or visual exclude an English Learner or trip a stereotype-threat trap?
- **Equity Reviewer on every external resource entry:** Known cultural / accessibility problems?
- **External Reviewer on the whole misconception taxonomy, once:** What's missing that the broader research considers load-bearing?

Output of each design-time review goes into `docs/design-review/<probe-or-misconception-id>.md`. We read these before approving the probe.

## 9. The mastery passport

```json
{
  "passport_id": "uuid",
  "learner_id": "uuid",
  "created_at": "2026-...",
  "schema_version": 1,
  "standards": {
    "K.CC.A.1": {
      "state": "mastered" | "working" | "misconception" | "not_yet_probed",
      "flagged_misconception_ids": ["m01", "m04"],
      "evidence_probe_ids": ["probe-K.CC.A.1-001", "probe-K.CC.A.1-002"],
      "reasoning": "Counted to 100 on the first try with steady pacing, ...",
      "agent_ladder_verdict": "confirmed" | "downgraded" | "flagged",
      "agent_notes": "..."
    },
    "K.CC.A.2": { ... },
    ...
  },
  "stop_branch_reason": "two consecutive non-masteries at K.OA.A.3 and K.OA.A.4"
}
```

The passport is exported as JSON and is the contract surface between Strata and MGB. MGB reads the passport and maps each `mastered` standard to a moon state in the galaxy.

## 10. The practice layer — games first as the incentive

When a standard is flagged (`misconception` or `working`), the report shows two things to the learner and the guide:

**For the learner: the game door comes first.**

- If a verified MGB game exists for the standard, it appears prominently as a "play this!" card. The learner can play it freely (no gating).
- If no verified MGB game exists yet, the slot shows a **"Builders are working on this!"** placeholder linking to the MGB galaxy moon for that standard. Doubles as a tease for when MGB launches and the kid starts building.
- The intuition: if the learner can win the game, that's a real signal of learning. If they can't win the game, that's intrinsic motivation to do the guide-prescribed work. **Difficulty in the game IS the incentive to study.**

**For the guide: the heavy-lifting menu.**

- A list of 5-8 external resources tagged to the flagged standard and misconception, organized by modality (video / interactive / manipulative / worksheet / live activity).
- The guide picks what to assign at home this week. Strata does not gate access; the guide drives.

**No locking, no gates.** Per the carryover principle: respect learner agency. The kid can play the MGB game first or last — the guide can require either order or neither.

## 11. The resource library — Khan starter set + community + AI vet + human approval

### Starter set (curated by Barbara)

A seed library of ~40-60 trusted resources covering the major K-2 misconceptions and standards. Pulled primarily from:

- Khan Academy (videos and exercises)
- PhET Interactive Simulations
- Math Learning Center (number rack, number frames, geoboard apps)
- Montessori material activity descriptions (golden beads, bead bars, stamp game)
- Open Up Resources / Illustrative Mathematics K-5

Each entry is tagged with: `ccss_standard_ids[]`, `misconception_ids[]`, `modality`, `grade_band`, `cra_stage` (concrete / representational / abstract), `url`, `accessibility_notes`.

### Community contributions

Guides and parents can submit a resource. Submission flow:

1. Guide fills a short form: title, URL, description, suggested standard(s) and misconception(s), modality.
2. **AI vetting agent** reviews using the existing pattern in `lib/ai-vet-activity.ts` (already drafted). Returns `ai_passed` / `ai_borderline` / `ai_rejected` with rationale.
3. **Equity Reviewer** runs as a second pass. Flags soft warnings.
4. **Human approval (Barbara, for v1)** sees the AI verdict + Equity warnings + raw submission. Approves, edits, or rejects.
5. Approved resources enter the library and are surfaced in matching reports.

### What this preserves

- Strata never has to *generate* practice content. We curate and surface.
- Khan / PhET / MLC do the heavy lifting they already do well.
- The community wedge (guides contributing) eventually outpaces what Barbara can curate alone, but only after AI vetting + human approval keep quality high.

## 12. What carries over from the math-pedagogy-toolkit

Verified, present in repo today, ready to reuse:

- **Mr. Chesure knowledge files** for K.CC, K.OA, K.NBT, 1.OA, 1.NBT, 2.OA, 2.NBT (the entire K-2 number-and-operations strand).
- **Mapping kits** for all 49 K-2 standards + 3.OA.A.1 (`docs/mapping-kits/` in MGB) — verbatim CC text + candidate engines per standard. Caveat: 44 of 49 still need real Progressions excerpts; placeholder banners present.
- **The 466-standard prerequisite graph** at `src/data/standards.json` in MGB. Strata reads from this to drive the probe sequence.
- **Two cross-cutting research files** in `agents/shared-knowledge/`: counting-principles-cardinality and equal-sign-as-relation. These seed two of the largest K-2 misconception clusters.
- **The 4-stage Haiku → Sonnet agent ladder prompts** (`src/lib/agent-prompts/` in MGB). Adapt the framing from games to assessment claims.
- **Mr. Chesure, Equity Reviewer, External Reviewer agent definitions.**
- **R1-R10 trajectory rules** in `lib/analysis-prompt.ts` — domain-agnostic.
- **Some verified MGB engines** ready to adapt to probe-mode: hundred-board count-trail, number-frames, free-collect pre-stocked field, K.OA.A.1 game, K.OA.A.3 game.
- **R3F + Howler + audio + perf-tier infrastructure** from MGB's worktree (the foundation work) — the Library inherits this.
- **The light Plan Architect pattern** (already moved off Managed Agents in commit `7647282` — single Sonnet call with Messages API + caching).

## 13. What needs to be built fresh

- **The Star Atlas Library 3D scene.** Real assets: lantern HDRIs, brass-textured atlas, wood-shelf models, paper-card geometry. ~1-2 weeks of asset gathering + integration.
- **The K-2 misconception taxonomy.** ~20-30 misconceptions. The two seed files cover ~6; the rest is research work using the External Reviewer as backstop. Format mirrors `content/fractions-misconceptions.json`.
- **The K-2 probe bank.** ~80-120 probe items tagged to standards and misconceptions. Drafted, reviewed by Mr. Chesure + Equity Reviewer at design time before any ships.
- **The ~10 probe mechanics** (most adapted from MGB engines, ~4 net-new). Each in its own React component with strict telemetry shape.
- **The probe scheduler** that walks the prerequisite graph, applies the stop rule, and queues the next probe.
- **The mastery passport export** + a stub MGB importer (so we can validate the contract before MGB consumes it for real).
- **The seed external resource library** (~40-60 entries).
- **The community contribution form + AI vet + human approval pipeline.** Mostly already drafted in `lib/ai-vet-activity.ts`; needs the Equity Reviewer pass added and the approval UI built.
- **A new in-app `/assess` route** that hosts the Library + probes (replacing the current `/assess/[id]` fractions flow).
- **A new in-app `/report/[id]` route** rebuilt for the K-2 passport + games-first-then-resources layout.

## 14. Migration from current Strata

The current deployed `stratamundo.org` is the fractions hackathon build. The rebuild is significant — the assessment domain changes from fractions to K-2, the home changes from a tree to a library, the practice model adds MGB games. **Rebuild approach: build alongside on a feature branch, ship behind a flag, cut over once verified.**

- Keep the existing fractions flow alive at `/legacy/assess` for the duration of the rebuild.
- Build the new K-2 flow at `/assess` (new) on a `k2-rebuild` branch.
- Run both in production behind a per-learner feature flag for a transition window.
- Cut over to new as default once the K-2 passport reliably round-trips through MGB's importer (even a stub MGB importer is enough for cutover).
- Drop `/legacy/assess` after one month of new-flow stability.

## 15. Open questions still to lock

1. **Probe mechanic ownership.** Do probe mechanics live in this repo (`stratamundo`) or are they imported from a shared `math-pedagogy-toolkit/probes/` package? Cleaner long-term: shared package. Faster short-term: in-repo.
2. **Visual references for the Library.** Three directions to pick from: (a) The Room iPad puzzle game tactility; (b) basement.studio portal-zoom navigation; (c) lived-in Hayao Miyazaki library mood. Need to load the visual-quality skill and propose with reference images before locking.
3. **Auth model.** Stays Supabase email/password + anonymous? Or simpler for v1 (single-learner demo mode)?
4. **MGB consumption of the passport.** Stub importer in MGB now, or wait until MGB's galaxy redesign lands and write the real one then?
5. **First standard to probe.** K.CC.A.1 (count to 100) is the bedrock, but a 5-year-old hitting 100 in their first probe might be intimidating. Consider opening with K.CC.B.4a (cardinality / 1-to-1 correspondence) as a gentler entry. Pedagogy call.
6. **Probe duration cap per session.** 15 minutes total feels right for K-1; some 7-year-olds could go 25+. Hard cap or soft pause prompt at 15?

---

*This is the v1 spec. After Barbara approves, the next step is `writing-plans` to produce a sequenced implementation plan, then `executing-plans` + `subagent-driven-development` for the build. Pause for human review at the first viewable Library moment (`/dev/library/atlas`).*
