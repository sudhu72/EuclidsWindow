// The number theory behind the Cryptology Lab — kept free of any UI so each
// piece can be reasoned about (and tested) on its own.

export const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Relative letter frequencies of English text, in percent. */
export const ENGLISH_FREQ: Record<string, number> = {
  A: 8.167, B: 1.492, C: 2.782, D: 4.253, E: 12.702, F: 2.228, G: 2.015,
  H: 6.094, I: 6.966, J: 0.153, K: 0.772, L: 4.025, M: 2.406, N: 6.749,
  O: 7.507, P: 1.929, Q: 0.095, R: 5.987, S: 6.327, T: 9.056, U: 2.758,
  V: 0.978, W: 2.361, X: 0.150, Y: 1.974, Z: 0.074,
};

/** Shift letters by `shift`, preserving case and leaving other characters be. */
export function caesar(text: string, shift: number, encrypt: boolean): string {
  const k = encrypt ? ((shift % 26) + 26) % 26 : (26 - (((shift % 26) + 26) % 26)) % 26;
  return text
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + k) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + k) % 26) + 97);
      return ch;
    })
    .join("");
}

export function letterFrequencies(text: string): { freqs: Record<string, number>; total: number } {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const ch of text.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") {
      counts[ch] = (counts[ch] || 0) + 1;
      total++;
    }
  }
  const freqs: Record<string, number> = {};
  for (const ch of ALPHA) freqs[ch] = total > 0 ? ((counts[ch] || 0) / total) * 100 : 0;
  return { freqs, total };
}

export function chiSquared(
  observed: Record<string, number>,
  expected: Record<string, number>
): number {
  let chi2 = 0;
  for (const ch of ALPHA) {
    const e = expected[ch];
    if (e > 0) chi2 += ((observed[ch] - e) * (observed[ch] - e)) / e;
  }
  return chi2;
}

/** The shift whose decryption best matches English letter frequencies. */
export function bestCaesarShift(text: string): { shift: number; chi2: number } {
  const { freqs } = letterFrequencies(text);
  let shift = 0;
  let chi2 = Infinity;
  for (let k = 0; k < 26; k++) {
    const shifted: Record<string, number> = {};
    for (const ch of ALPHA) {
      const orig = String.fromCharCode(((ch.charCodeAt(0) - 65 - k + 26) % 26) + 65);
      shifted[orig] = freqs[ch];
    }
    const score = chiSquared(shifted, ENGLISH_FREQ);
    if (score < chi2) {
      chi2 = score;
      shift = k;
    }
  }
  return { shift, chi2 };
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Extended Euclid: returns [g, x, y] with a·x + b·y = g. */
export function extGcd(a: number, b: number): [number, number, number] {
  if (b === 0) return [a, 1, 0];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}

/** Multiplicative inverse of e mod m, or null when they are not coprime. */
export function modInverse(e: number, m: number): number | null {
  const [g, x] = extGcd(e, m);
  if (g !== 1) return null;
  return ((x % m) + m) % m;
}

/**
 * Modular exponentiation. Uses BigInt throughout — the intermediate products
 * of a square-and-multiply pass exceed Number.MAX_SAFE_INTEGER long before the
 * inputs do, so doing this in Number would silently return wrong values.
 */
export function modPow(base: number, exp: number, mod: number): number {
  if (mod <= 0) return 0;
  let result = 1n;
  let b = ((BigInt(base) % BigInt(mod)) + BigInt(mod)) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * b) % m;
    e /= 2n;
    b = (b * b) % m;
  }
  return Number(result);
}

export interface RsaKeys {
  p: number;
  q: number;
  n: number;
  phi: number;
  e: number;
  d: number;
  /** e·d mod φ(n), which must be 1 for the key pair to work. */
  check: number;
}

/** Build an RSA key pair from two primes, or explain why they will not do. */
export function rsaKeys(p: number, q: number): { keys?: RsaKeys; error?: string } {
  if (!isPrime(p)) return { error: `p = ${p} is not prime.` };
  if (!isPrime(q)) return { error: `q = ${q} is not prime.` };
  if (p === q) return { error: "p and q must be different primes." };

  const n = p * q;
  const phi = (p - 1) * (q - 1);

  let e = 65537;
  if (e >= phi || gcd(e, phi) !== 1) {
    e = 0;
    for (let cand = 3; cand < phi; cand += 2) {
      if (gcd(cand, phi) === 1) {
        e = cand;
        break;
      }
    }
    if (!e) return { error: `No usable public exponent for φ(n) = ${phi}. Try larger primes.` };
  }

  const d = modInverse(e, phi);
  if (d === null) return { error: `e = ${e} has no inverse mod φ(n) = ${phi}.` };

  // BigInt for the check: e·d overflows Number once the primes get large.
  const check = Number((BigInt(e) * BigInt(d)) % BigInt(phi));
  return { keys: { p, q, n, phi, e, d, check } };
}
