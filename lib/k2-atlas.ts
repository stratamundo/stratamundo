/**
 * K-2 + bridge atlas — data layer for the /vision page.
 *
 * Reads the snapshot of K-2 standards (extracted from MGB's
 * src/data/standards.json) and groups them into constellations for the
 * interactive Star Atlas Library visualization.
 *
 * A "constellation" = one CCSS cluster (e.g. K.CC.A "Know number names
 * and the count sequence"). A "star" = one leaf standard inside it
 * (e.g. K.CC.A.1, K.CC.A.2, K.CC.A.3).
 */

import standardsData from '../content/k2-standards.json'

export type StandardNode = {
  id: string
  description: string
  domain: string
  domainCode: string
  cluster: string
  grade: string
  classification: string
  isHub: boolean
}

export type Star = {
  id: string
  description: string
  shortName: string
  grade: string
  /** deterministic angle 0..2π for layout inside the constellation */
  angle: number
  /** deterministic radius factor 0.55..1.0 from constellation center */
  radius: number
  probeMechanic: string
}

export type Constellation = {
  id: string                // e.g. "K.CC.A"
  description: string       // cluster description from CCSS
  domain: string            // e.g. "Counting & Cardinality"
  grade: string
  stars: Star[]
}

const PROBE_MECHANIC: Record<string, string> = {
  // Counting & Cardinality
  'K.CC.A': 'Hundred-board count-trail',
  'K.CC.B': 'Cardinality touch-and-say',
  'K.CC.C': 'Free-collect compare',
  // Operations & Algebraic Thinking
  'K.OA.A': 'Number-frames decompose',
  '1.OA.A': 'Open number-line jump',
  '1.OA.B': 'Decompose-into-pairs',
  '1.OA.C': 'Counting-on workspace',
  '1.OA.D': 'Equal-sign relation',
  '2.OA.A': 'Word-problem build',
  '2.OA.B': 'Within-100 jump',
  '2.OA.C': 'Even/odd pair-up',
  '3.OA.A': 'Equal-groups arrangement',
  // Number & Operations in Base Ten
  'K.NBT.A': 'Place-value stack',
  '1.NBT.A': 'Hundred-board count-trail',
  '1.NBT.B': 'Place-value stack',
  '1.NBT.C': 'Open number-line jump',
  '2.NBT.A': 'Place-value stack',
  '2.NBT.B': 'Open number-line jump',
}

const SHORT_NAMES: Record<string, string> = {
  'K.CC.A.1': 'Count to 100',
  'K.CC.A.2': 'Count from any number',
  'K.CC.A.3': 'Write 0–20',
  'K.CC.B.4': 'Counting = cardinality',
  'K.CC.B.4a': '1-to-1 correspondence',
  'K.CC.B.4b': 'Cardinality on stop',
  'K.CC.B.4c': 'Each next = +1',
  'K.CC.B.5': 'Count up to 20',
  'K.CC.C.6': 'Compare groups',
  'K.CC.C.7': 'Compare numerals',
  'K.OA.A.1': 'Add & subtract within 10',
  'K.OA.A.2': 'Word problems within 10',
  'K.OA.A.3': 'Decompose ≤10',
  'K.OA.A.4': 'Make 10 from any',
  'K.OA.A.5': 'Fluently add/sub within 5',
  'K.NBT.A.1': 'Compose tens',
  '1.OA.A.1': 'Add/sub word problems',
  '1.OA.A.2': 'Three-addend problems',
  '1.OA.B.3': 'Properties of operations',
  '1.OA.B.4': 'Subtraction as unknown',
  '1.OA.C.5': 'Count to add/subtract',
  '1.OA.C.6': 'Strategies within 20',
  '1.OA.D.7': 'Equal sign meaning',
  '1.OA.D.8': 'Find unknown',
  '1.NBT.A.1': 'Count to 120',
  '1.NBT.B.2': 'Tens & ones',
  '1.NBT.B.2a': '10 = ten ones',
  '1.NBT.B.2b': 'Teens = 10 + ones',
  '1.NBT.B.2c': 'Decades = tens',
  '1.NBT.B.3': 'Compare two-digit',
  '1.NBT.C.4': 'Add within 100',
  '1.NBT.C.5': '+10 / −10 mentally',
  '1.NBT.C.6': 'Subtract decades',
  '2.OA.A.1': 'Word problems within 100',
  '2.OA.B.2': 'Fluent add/sub within 20',
  '2.OA.C.3': 'Even / odd',
  '2.OA.C.4': 'Equal-groups foundations',
  '2.NBT.A.1': 'Hundreds, tens, ones',
  '2.NBT.A.1a': '100 = ten tens',
  '2.NBT.A.1b': 'Hundreds named',
  '2.NBT.A.2': 'Skip-count by 5/10/100',
  '2.NBT.A.3': 'Read & write to 1000',
  '2.NBT.A.4': 'Compare three-digit',
  '2.NBT.B.5': 'Fluently add/sub within 100',
  '2.NBT.B.6': 'Add up to four 2-digit',
  '2.NBT.B.7': 'Add/sub within 1000',
  '2.NBT.B.8': '+10 / +100 mentally',
  '2.NBT.B.9': 'Explain why strategies work',
  '3.OA.A.1': 'Multiplication = equal groups',
}

/** small deterministic hash → 0..1, used for layout */
function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10_000) / 10_000
}

function isLeaf(node: StandardNode): boolean {
  // A leaf has at least 4 segments (e.g. K.CC.A.1, K.CC.B.4a)
  return node.id.split('.').length >= 4
}

function clusterOf(node: StandardNode): string {
  // The cluster is the first 3 segments (K.CC.A, 1.OA.D, etc.)
  const parts = node.id.split('.')
  return `${parts[0]}.${parts[1]}.${parts[2]}`
}

export function getConstellations(): Constellation[] {
  const all = (standardsData.nodes as StandardNode[])
  const clusters = new Map<string, Constellation>()

  // Initialize cluster headers from non-leaf nodes
  for (const n of all) {
    if (!isLeaf(n)) {
      // a cluster header has exactly 3 segments (K.CC.A)
      const parts = n.id.split('.')
      if (parts.length === 3) {
        clusters.set(n.id, {
          id: n.id,
          description: n.description,
          domain: n.domain,
          grade: n.grade,
          stars: [],
        })
      }
    }
  }

  // Assign leaves to clusters
  for (const n of all) {
    if (!isLeaf(n)) continue
    const cid = clusterOf(n)
    const c = clusters.get(cid)
    if (!c) continue
    const a = hash01(n.id) * Math.PI * 2
    const r = 0.55 + hash01(n.id + '_r') * 0.45
    c.stars.push({
      id: n.id,
      description: n.description,
      shortName: SHORT_NAMES[n.id] ?? n.id,
      grade: n.grade,
      angle: a,
      radius: r,
      probeMechanic: PROBE_MECHANIC[cid] ?? 'TBD',
    })
  }

  // Order: K then 1 then 2 then 3, then by cluster letter
  const order = (g: string) => ({ K: 0, '1': 1, '2': 2, '3': 3 } as Record<string, number>)[g] ?? 9
  return Array.from(clusters.values())
    .filter(c => c.stars.length > 0)
    .sort((a, b) => order(a.grade) - order(b.grade) || a.id.localeCompare(b.id))
}
