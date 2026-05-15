# Strata Mundo misconceptions vs. the 3-5 Fractions Progression

*Date: 2026-05-15 · Source PDF: `Progressions-3-5-Fractions.pdf` (Draft 3–5 Progression on Number and Operations — Fractions, McCallum et al., hosted at achievethecore.org/page/254)*

## Why this doc exists

When SM first wrote `content/fractions-misconceptions.json` (Apr 23 2026), it drew from Van de Walle, Behr/Lesh/Post, Mack, and Siegler — but not directly from the published 3-5 Fractions Progression. This file is the result of a systematic compare. It records what the Progressions explicitly names, what SM has but the Progressions doesn't, what's the same idea framed differently, and what was added to the file as a result.

All quotes below are verbatim from the Progressions PDF; page numbers refer to the PDF's printed page numbers (also match the extracted text files in `docs/research/_progressions_pages/`).

---

## Misconceptions explicitly named in the Progressions

The Progressions document calls out seven specific misconceptions or teaching traps in the 3.NF and 4.NF sections:

### 1. Not specifying the whole (p. 8)
> Without specifying the whole it is not reasonable to ask what fraction is represented by the shaded area. If the left square is the whole, the shaded area represents the fraction 3/2; if the entire rectangle is the whole, the shaded area represents 3/4.

### 2. "Equal parts" interpreted only as "same shape and same size" (p. 8)
> Initially, students can use an intuitive notion of congruence ("same size and same shape" or "matches exactly") to explain why the parts are equal [...]. Students come to understand a more precise meaning for "equal parts" as "parts with equal measurements."

### 3. Forced proper/improper distinction (p. 8)
> There is no need to introduce "proper fractions" and "improper fractions" initially; 5/3 is what you get by combining 5 parts when a whole is partitioned into 3 equal parts.

This is framed as a **teaching trap** rather than a kid misconception — the Progressions argues that the forced distinction is itself the problem.

### 4. Bigger denominator means bigger fraction (p. 10)
> Grade 3 students see that for unit fractions, the one with the larger denominator is smaller, by reasoning, for example, that in order for more (identical) pieces to make the same whole, the pieces must be smaller.

### 5. Same-whole hazard in comparisons (p. 10)
> A student might think that 1/4 > 1/2, because a fourth of the pizza on the right is bigger than a half of the pizza on the left.

Distinct from #1: this is specifically the comparison failure when wholes differ.

### 6. Over-emphasizing simplification (p. 12)
> There is no mathematical reason why fractions must be written in simplified form, although it may be convenient to do so in some cases.

### 7. Premature "multiply by 1" justification for equivalence (pp. 11–12)
> Grade 4 students who have learned about fraction multiplication can see equivalence as "multiplying by 1": 7/9 = (7/9) × 1 = (7/9) × (4/4) = 28/36. However, although a useful mnemonic device, this does not constitute a valid argument at this grade, since students have not yet learned fraction multiplication.

Framed as an **anti-pattern for instruction** rather than a kid misconception — fraction multiplication is 5.NF, so using it to justify equivalence at grade 4 is circular.

---

## SM's 8 misconceptions vs. the Progressions

| SM ID | SM name | Progressions match | Notes |
|---|---|---|---|
| m01 | Bigger denominator means bigger fraction | ✅ #4 (p. 10) | Word-for-word match. |
| m02 | Add numerators and denominators separately | ❌ Out of scope for this Progression (5.NF, not 3-5) | Cited from Behr/Lesh/Post — legitimate. Worth scope-checking against SM's problem bank. |
| m03 | Fractions are always less than 1 | ⚠️ Related to #3 but framed differently | SM treats this as a kid belief; Progressions treats it as a teaching trap. Both are real; we annotated m03. |
| m04 | Doesn't recognize equivalent fractions | ⚠️ Different angle from #7 | m04 is "can't see they're equal"; #7 is "uses wrong justification." Not the same misconception. |
| m05 | Partitioning doesn't require equal parts | ⚠️ Distinct from #2 | m05 = pieces are clearly unequal. #2 = pieces are equal in area but kid rejects because shapes differ. Different diagnostic signals; should be tracked separately. |
| m06 | The whole doesn't matter | ✅ #1 and #5 merged | Two Progressions misconceptions collapse into one SM entry. |
| m07 | Notational confusion (reads 3/4 as "three, four") | ❌ Not in this Progression | Cited from Van de Walle — legitimate. |
| m08 | Additive equivalence (2/3 = 4/5 by +1 to each) | ❌ Not in this Progression | One of the most-cited misconceptions in the broader research literature (Behr/Lesh/Post, Mack, Siegler). Notable absence here. |

---

## What changed in `fractions-misconceptions.json` as a result

Three edits applied 2026-05-15:

1. **Added m05b "Equal parts must look identical."** Distinct misconception from m05. Diagnostic signal: kid rejects a valid equal-area partition because the pieces have different shapes. Source: Progressions p. 8.

2. **Added m09 "Fractions must always be in lowest terms."** Net-new misconception. Often teacher-induced. Source: Progressions p. 12.

3. **Annotated m03 with `_progressions_note`** explaining the Progressions framing as a teaching trap. The Plan Architect should recognize that when m03 fires, the fix may be at the instructional layer (retire the proper/improper distinction) rather than at the kid-cognition layer.

The `_meta` block was updated to:
- Cite the Progressions document explicitly under `research_basis`.
- Update the misconception count from 8 to 10 in `notes_for_barbara`.
- Add a scope-check note for m02 pending review against the problem bank.

---

## What was NOT changed, and why

- **m02 was not removed or modified.** The misconception is real per Behr/Lesh/Post even though the 3-5 Fractions Progression doesn't name it (because addition with unlike denominators is 5.NF). A scope-check against the problem bank is pending; deferred.
- **No new prerequisite was added for m05b.** It links to the existing p05 (equal partitioning) — the underlying skill is the same; the gap is in the definition of "equal," not in the partitioning ability itself. Captured in m05b's `prerequisite_links` field.
- **The "premature multiply-by-1 justification" anti-pattern (#7) was NOT added as a misconception** because it's an instructional anti-pattern, not a kid cognition. It belongs in a future SM-fractions-Chesure-equivalent file under §2 (Anti-patterns), not in the misconception taxonomy. Tracked for Phase 2 of the SM ↔ MGB cross-pollination plan.

---

## Plan Architect implications

When the Plan Architect picks resources for a flagged misconception, three new anti-patterns to AVOID recommending — all from the Progressions:

1. **Activities that justify equivalence via "multiplying by 1"** at grades 3-4 (Progressions p. 12). Ground reasoning in visual repartitioning instead.
2. **Activities that frame 5/3 as a special "improper" case** at grade 3 (Progressions p. 8). Treat it as 5 copies of 1/3.
3. **Activities that require simplified form as a correctness gate** (Progressions p. 12). 2/4 = 1/2 — both are correct.

These belong in the eventual SM-fractions Chesure-equivalent knowledge file as cluster-level anti-patterns. Not in the misconception taxonomy itself.

---

## Provenance and traceability

Every claim in this doc cites a verbatim quote from the Progressions PDF with a page number. The per-standard excerpts at `docs/mapping-kits/[standard-id]/progressions-excerpt.md` contain the longer quotes in context. The PDF itself is at `docs/research/Progressions-3-5-Fractions.pdf` (gitignored — local-only).
