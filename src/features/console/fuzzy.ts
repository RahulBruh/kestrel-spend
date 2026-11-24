/**
 * Subsequence fuzzy match with bonuses for word starts and consecutive runs,
 * the same family of scoring used by editor command palettes. Greedy matching
 * alone latches onto the first occurrence ("t" in "Set"), so every start
 * position of the first character is tried and the best alignment wins.
 * Returns null when the query is not a subsequence of the text.
 */
export function fuzzyScore(query: string, text: string): { score: number; hits: number[] } | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { hits: [], score: 0 };
  const t = text.toLowerCase();
  let best: { score: number; hits: number[] } | null = null;
  for (let start = t.indexOf(q[0]); start !== -1; start = t.indexOf(q[0], start + 1)) {
    const result = greedyFrom(q, t, start);
    if (result && (!best || result.score > best.score)) best = result;
  }
  return best;
}

function isWordStart(t: string, i: number): boolean {
  return i === 0 || /[\s:/,-]/.test(t[i - 1]);
}

function greedyFrom(q: string, t: string, start: number): { score: number; hits: number[] } | null {
  const hits = [start];
  let score = 1 + (isWordStart(t, start) ? 8 : 0) - start * 0.05;
  let prev = start;
  for (let k = 1; k < q.length; k++) {
    const ch = q[k];
    // Prefer staying consecutive, then a later word start, then any occurrence.
    let found = t[prev + 1] === ch ? prev + 1 : -1;
    if (found === -1) {
      for (let i = prev + 1; i < t.length; i++) {
        if (t[i] === ch && isWordStart(t, i)) {
          found = i;
          break;
        }
      }
    }
    if (found === -1) found = t.indexOf(ch, prev + 1);
    if (found === -1) return null;
    score += 1;
    if (found === prev + 1) score += 5;
    else if (isWordStart(t, found)) score += 6;
    else score -= Math.min(4, found - prev - 1) * 0.3;
    hits.push(found);
    prev = found;
  }
  return { hits, score: score - t.length * 0.01 };
}
