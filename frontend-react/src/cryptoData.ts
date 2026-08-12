// Cryptology Lab copy, extracted from the classic markup as Markdown so it
// renders through the app's existing Markdown component.

export interface GameCopy {
  title: string;
  subtitle: string;
  prereq: string;
  prompt: string;
}

export const COPY: Record<string, GameCopy> = {
  "caesar": {
    "title": "Caesar Cipher — Modular Arithmetic in Action",
    "subtitle": "Shift every letter in the alphabet by a fixed number. This is one of the oldest encryption methods, used by Julius Caesar himself.",
    "prereq": "**Math you’ll use:** *Modular arithmetic* — the math of clocks and remainders.\nEach letter is a number (A=0, B=1, …, Z=25). Encryption: E(x) = (x + k) mod 26. Decryption: D(x) = (x − k) mod 26.",
    "prompt": "Explain modular arithmetic and how it applies to Caesar ciphers and cryptography"
  },
  "frequency": {
    "title": "Frequency Analysis — Statistics Breaks Codes",
    "subtitle": "Count letter frequencies in ciphertext and compare to known English patterns. This technique cracked substitution ciphers for centuries.",
    "prereq": "**Math you’ll use:** *Probability & Statistics* — letter frequency distributions, chi-squared testing, and pattern recognition.\nIn English, E appears ~12.7%, T ~9.1%, A ~8.2%. A substitution cipher preserves these frequencies.",
    "prompt": "Explain probability distributions, frequency analysis, and how statistics is used to break ciphers"
  },
  "rsa": {
    "title": "RSA Playground — The Math of Public-Key Encryption",
    "subtitle": "Pick two prime numbers, compute the public and private keys, and watch RSA encrypt and decrypt a message — all with real number theory.",
    "prereq": "**Math you’ll use:** *Number Theory* — prime numbers, Euler’s totient function φ(n), modular exponentiation, and the Extended Euclidean Algorithm.\nRSA security relies on the difficulty of factoring large numbers: easy to multiply two primes, nearly impossible to reverse.",
    "prompt": "Explain prime numbers, Euler's totient function, and modular exponentiation as used in RSA encryption"
  },
  "diffiehellman": {
    "title": "Diffie-Hellman Key Exchange — Sharing Secrets in Public",
    "subtitle": "Watch Alice and Bob agree on a secret key while Eve listens to every message. The math of discrete logarithms makes it possible.",
    "prereq": "**Math you’ll use:** *Group Theory & Discrete Logarithms* — modular exponentiation in cyclic groups.\nGiven g^a mod p, finding “a” is computationally infeasible for large p. This one-way property is the foundation.",
    "prompt": "Explain group theory, discrete logarithms, and how Diffie-Hellman key exchange works mathematically"
  }
};

/** Ciphertexts to practise frequency analysis on. */
export const SAMPLE_TEXTS: Record<string, string> = {
  "caesar": "WKLV LV D VHFUHW PHVVDJH HQFUBSWHG ZLWK D FDHVDU FLSKHU WKH VKLIW LV WKUHH",
  "subst": "ZG OCMG ZGKGTOKXGF ZNKIG YZXERVGTY ZNKXG CXG YGBGXCR USHHTG GRGSGHZY NKFFGH CKXUYY ZNK IGYYCKIG"
};
