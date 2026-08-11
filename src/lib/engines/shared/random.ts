// Cryptographically secure random
// Deno and Node both support crypto.getRandomValues natively

export function secureRandom(): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] / (0xFFFFFFFF + 1)
}
