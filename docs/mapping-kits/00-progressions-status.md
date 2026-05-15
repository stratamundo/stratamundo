# Fractions Progressions extraction status

**Source PDF:** `docs/research/Progressions-3-5-Fractions.pdf` (renamed from the original "Draft 3–5 Progression on Number and Operations—Fractions.pdf" for shell-friendliness; gitignored).

**Extraction script:** `scripts/extract_progressions.py` — uses `pypdf` to dump one text file per PDF page to `docs/research/_progressions_pages/page-NNN.txt` (gitignored).

**Total extracted pages:** 21. Page numbers in citations below refer to the extracted-text-file index, which matches PDF page numbers 1:1.

## Page-range index

| Standard | Page range (extracted text) | Section |
|---|---|---|
| 2.G.A.3 | 4, 8 | Cited as fractions prerequisite; main treatment in K–6 Geometry Progression |
| 3.G.A.2 | 3, 8 | Cited as bridge from partitioning to fraction notation; main treatment in K–6 Geometry Progression |
| 3.NF.A.1 | 4, 8 | Grade 3 — "The meaning of fractions and fraction notation" |
| 3.NF.A.2.a | 8–9 | Grade 3 — "The number line and number line diagrams" |
| 3.NF.A.2.b | 8–9 | Grade 3 — "The number line and number line diagrams" |
| 3.NF.A.3.a | 9–10 | Grade 3 — "Equivalent fractions" |
| 3.NF.A.3.b | 9–10 | Grade 3 — "Equivalent fractions" |
| 3.NF.A.3.c | 9–10 | Grade 3 — "Equivalent fractions" (whole numbers as fractions) |
| 3.NF.A.3.d | 10 | Grade 3 — "Comparing fractions" |
| 4.NF.A.1 | 11–12 | Grade 4 — "Equivalent fractions" |
| 4.NF.A.2 | 12 | Grade 4 — "Equivalent fractions" (comparison subsection) |

## Status counts

- **Succeeded (excerpts fully populated, verbatim quotes + extraction):** 9
  - 3.NF.A.1, 3.NF.A.2.a, 3.NF.A.2.b, 3.NF.A.3.a, 3.NF.A.3.b, 3.NF.A.3.c, 3.NF.A.3.d, 4.NF.A.1, 4.NF.A.2

- **Partial (prerequisite standard cited only briefly in this Progression; main treatment lives in the K–6 Geometry Progression):** 2
  - 2.G.A.3 — short excerpt with the verbatim 2.G.3 sidebar from pp. 4 and 8, plus the fraction-language framing on p. 4. Note recorded that main treatment is elsewhere.
  - 3.G.A.2 — short excerpt with the verbatim 3.G.2 sidebar from pp. 3 and 8, plus the "equal parts" discussion linking partitioning to unit fractions. Note recorded that main treatment is elsewhere.

- **Failed entirely:** 0

## Flags for manual lookup

None of the 11 standards failed. The two prerequisite Geometry standards (2.G.A.3, 3.G.A.2) are intentionally short — they are not treated as Number-and-Operations–Fractions standards in this Progression. Drafters working on those two standards should consult the **K–6 Geometry Progression** for the primary treatment, in addition to the brief excerpts captured here.

## Misconception notes

The Progression explicitly names the following developmental hurdles, captured per-standard in the excerpt files:

- Not specifying the whole (3.NF.A.1)
- "Equal parts" as same shape rather than same measure (3.NF.A.1, 3.G.A.2)
- "Bigger denominator means bigger fraction" — whole-number intuition transferred wrongly (3.NF.A.3.d)
- Same-whole hazard in comparisons (3.NF.A.3.d, 4.NF.A.2)
- Over-emphasis on simplification (4.NF.A.1)
- Premature "multiply by 1" justification for equivalence (4.NF.A.1, 4.NF.A.2)
- "Proper" vs "improper" fraction as a forced distinction (3.NF.A.1)

For standards where the Progression does not explicitly name misconceptions, the excerpt files defer to `fractions-misconceptions.json` (SM's project-internal misconception list).
