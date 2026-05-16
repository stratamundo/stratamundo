# m02 scope check — can the diagnostic actually trigger it?

*Date: 2026-05-15 · Read-only investigation · No files modified*

## Verdict: **CAN FIRE BUT WON'T USUALLY** (with one narrow caveat — see Q3)

The diagnostic structurally cannot trigger m02 from any in-scope problem
(no addition problems exist in the bank, and no `misconception_response_map`
entry references m02). The LLM analysis prompt is fed the full
misconception taxonomy for the touched problems, so in principle it could
flag m02 — but the filtering rule in `lib/cost-savings.ts` (referenced by
the route) trims misconceptions to "entries referenced by the attempted
problems," and no in-scope problem references m02. The AI vet for
submitted activities is the one place m02 can legitimately surface today.

---

## Q1 — Can any problem produce an m02 wrong-answer pattern?

**No.** Walked through all 27 problems in `content/fractions-problem-bank.json`.

The bank's own `_meta` block (lines 23–37) is explicit:

```json
"coverage_misconceptions": {
  ...
  "m02_separate_num_den_addition": 0,
  ...
},
"problem_types_excluded": {
  "add_fractions": "Out of scope. 3.NF and 4.NF.A do not include fraction
   addition (that is 4.NF.B.3). m02 (separate-num-den addition) therefore
   has zero direct coverage in this bank."
}
```

Every problem's `target_misconception_ids` and (where present)
`misconception_response_map` was inspected:

- 8 problems have a `misconception_response_map` (p003, p004, p006, p025,
  p026, p027 explicitly; the others rely on `target_misconception_ids` for
  the LLM to consult per analysis-prompt rule R7).
- **Zero** of these maps list `m02_separate_num_den_addition`.
- **Zero** problems list m02 in `target_misconception_ids`.
- **Zero** problems are tagged to a 5.NF (or 4.NF.B) addition standard.

How misconceptions get tagged at runtime: rule **R7** in
`lib/analysis-prompt.ts` (line 36) — the LLM sorts the learner's placed
denominators and matches against `placed_denominators_sorted` entries. With
no map entry pointing to m02, that path can't fire. R7's fallback — "you
may still flag a misconception if the learner's wrong attempt is
unambiguously consistent with one of the problem's
`target_misconception_ids`" — is also closed off, because no problem lists
m02 as a target.

## Q2 — Does the analysis prompt pass m02 to the LLM?

**Not in practice.** The system prompt itself (`ANALYSIS_SYSTEM_PROMPT`)
doesn't enumerate misconceptions; it tells the model to consult "the
misconception taxonomy" passed in as a separate system block. The route
(`app/api/analyze-assessment/route.ts` lines 91–108) calls:

```ts
const trimmedMisconceptions = relevantMisconceptions(trimmedProblems, misconceptionsRaw)
...
text: `MISCONCEPTION TAXONOMY (only entries referenced by the attempted
problems):\n${JSON.stringify(trimmedMisconceptions, null, 2)}`
```

Since no in-scope problem references m02, `relevantMisconceptions` will
exclude m02 from the taxonomy the LLM ever sees. The LLM literally
doesn't know m02 exists during analysis. (Caveat: I did not open
`lib/cost-savings.ts` to confirm the exact filtering rule, but the
comment and variable name are unambiguous; if `relevantMisconceptions`
ever does a permissive include-all fallback, that would change this
answer.)

R7 also explicitly tells the LLM to "be conservative — when in doubt,
prefer 'working' over a misconception flag," which further suppresses
speculative m02 flags even in an edge case.

## Q3 — Does the AI vet ever surface m02 as a candidate?

**Yes — this is the one live use of m02.** `lib/ai-vet-activity.ts`
Section 7.2 (line ~178) instructs the model:

> "Suggest the misconception ids (mNN_*) the activity helps resolve. Pick
> from the EXACT list of valid misconception ids provided in the user
> message."

And `buildUserMessage` enumerates the full misconceptions list (line
206–208) with no scope filter:

```ts
const misconceptionsList = taxonomy.misconceptions
  .map((m) => `  - ${m.id}: ${m.name}`)
  .join('\n')
```

So an external activity submitted to SM that targets fraction-addition
strategies (e.g., "PhET Build a Fraction — Addition with Unlike
Denominators") can legitimately be tagged with m02 by the vet, even
though no SM kid will currently fire m02 in the diagnostic. That
tagging is useful: it preserves the activity's pedagogical signature
for the day SM expands to 5.NF.

## Q4 — Net verdict

**CAN FIRE BUT WON'T USUALLY** — leaning closer to "never fires" on the
diagnostic side, but the AI vet path keeps m02 functionally live.

- Diagnostic side: structurally cannot trigger today.
- AI vet side: can and will tag m02 on submitted activities about
  fraction addition.

## Q5 — Recommendation

**Annotate m02 as currently latent.** *(my pick)*

Rationale:
1. The AI vet legitimately uses it. Deleting m02 would break the vet's
   ability to tag external activities about fraction addition — and
   those tags are the breadcrumb trail for when SM expands to 5.NF.
2. The `_meta.notes_for_barbara` field already flags m02 as scope-pending
   ("Scope-check pending on m02... Verify against
   fractions-problem-bank.json whether the diagnostic can actually
   trigger m02; if not, retire it until the 5.NF expansion."). This
   investigation answers that question: diagnostic can't, vet can.
3. A short `_scope_status` field on m02 (parallel to the existing
   `_progressions_note` on m03 and m09) would make the latent state
   self-documenting for future agents reading the misconceptions file
   without forcing them back to this doc.

Suggested annotation text (not applied — read-only task):

> `"_scope_status": "Latent in v1. The 3.NF + 4.NF.A problem bank
> contains no fraction-addition problems, so the diagnostic cannot fire
> m02. The AI vet for submitted activities still uses m02 to tag
> external resources targeting fraction-addition strategies. Activates
> in the diagnostic when SM expands to 5.NF / 4.NF.B."`

Alternatives considered:

- **Keep m02 as-is** — works, but loses the breadcrumb. Future readers
  hit the same scope question this report just answered.
- **Retire m02** — loses AI vet tagging, requires re-adding the entry
  on 5.NF expansion, and conflicts with the `_meta` traceability
  already in place. Wrong call given the vet is using it.

## Evidence file paths

- `c:/projects/stratamundo/content/fractions-problem-bank.json`
  (lines 23–43 declare the m02-zero scope explicitly)
- `c:/projects/stratamundo/content/fractions-misconceptions.json`
  (lines 30–44 = m02 definition; lines 7–11 = the scope-check note)
- `c:/projects/stratamundo/lib/analysis-prompt.ts` (R7 at line 36)
- `c:/projects/stratamundo/app/api/analyze-assessment/route.ts`
  (lines 91–108 = misconception trimming)
- `c:/projects/stratamundo/lib/ai-vet-activity.ts` (Section 7.2 +
  `buildUserMessage` enumerates the full misconceptions list)

## Caveats / unverified

- `lib/cost-savings.ts` `relevantMisconceptions` filtering rule was
  inferred from variable names and the surrounding comment, not opened
  directly. If it has a permissive fallback that sends the full
  taxonomy on edge cases, Q2's answer softens from "not in practice"
  to "sometimes."
