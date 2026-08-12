// Proportionally allocates `total` slots across weighted buckets,
// guaranteeing the sum always equals `total` exactly.
export function largestRemainderAllocate(
  weights: number[],
  total: number
): number[] {
  const raw = weights.map(w => w * total)
  const floored = raw.map(Math.floor)
  const remainders = raw.map((r, i) => r - floored[i])

  let allocated = floored.reduce((a, b) => a + b, 0)
  let remaining = total - allocated

  // Sort indices by largest remainder descending
  const order = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r)

  const result = [...floored]
  for (let k = 0; k < remaining; k++) {
    result[order[k].i] += 1
  }

  return result
}
