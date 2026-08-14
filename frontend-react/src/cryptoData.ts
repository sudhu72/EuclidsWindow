// Cryptology Lab copy, extracted from the classic markup as Markdown so it
// renders through the app's existing Markdown component.

export type Level = "kids" | "teen" | "college" | "adult";
export const LEVELS: Level[] = ["kids", "teen", "college", "adult"];

export interface GameCopy {
  title: string;
  subtitle: string;
  prereq: string;
  prompt: string;
  levels: Record<string, string>;
}

export const COPY: Record<string, GameCopy> = {
  "caesar": {
    "title": "Caesar Cipher — Modular Arithmetic in Action",
    "subtitle": "Shift every letter in the alphabet by a fixed number. This is one of the oldest encryption methods, used by Julius Caesar himself.",
    "prereq": "**Math you’ll use:** *Modular arithmetic* — the math of clocks and remainders.\nEach letter is a number (A=0, B=1, …, Z=25). Encryption: E(x) = (x + k) mod 26. Decryption: D(x) = (x − k) mod 26.",
    "prompt": "Explain modular arithmetic and how it applies to Caesar ciphers and cryptography",
    "levels": {
      "kids": "Imagine the alphabet written around a merry-go-round. To lock a message, everyone rides forward the same number of seats — say 3. A becomes D, B becomes E, and so on. When you get to the end, you just wrap back around to the start, like a clock going past 12! To unlock it, your friend rides backward the same number of seats. The \"key\" is just how many seats you moved.",
      "teen": "Each letter gets a number: A=0, B=1, … Z=25. Shifting by k means every letter's number goes up by k, and if it goes past 25 you wrap around by subtracting 26 — that wraparound is exactly what **mod** (short for modulo) means. So encryption is E(x) = (x + k) mod 26. There are only 26 possible keys, which is why this cipher is easy to crack by just trying all of them.",
      "college": "The Caesar cipher is the shift cipher on the additive group ℤ/26ℤ: E_k(x) = x + k (mod 26), a bijection on the 26 residue classes for every k, with inverse D_k(x) = x − k (mod 26). It's a special case of the affine cipher E(x) = ax + b (mod 26) with a = 1. Because the keyspace has only 26 elements, it is trivially broken by exhaustive search — the security of any cipher is bounded by the size (and structure) of its keyspace, a principle that motivates every stronger scheme that follows.",
      "adult": "Caesar's cipher is a textbook example of *security through obscurity failing at scale*: it was adequate when messengers were the attack surface, but a keyspace of 26 is meaningless against automated search. Its modern descendants (ROT13, simple XOR obfuscation) are still used for casual non-adversarial encoding — hiding spoilers, not securing secrets. It's the standard first example in any crypto course precisely because its weakness (small keyspace, statistical letter patterns preserved) previews *why* RSA and AES need 128+ bits of keyspace and diffusion."
    }
  },
  "frequency": {
    "title": "Frequency Analysis — Statistics Breaks Codes",
    "subtitle": "Count letter frequencies in ciphertext and compare to known English patterns. This technique cracked substitution ciphers for centuries.",
    "prereq": "**Math you’ll use:** *Probability & Statistics* — letter frequency distributions, chi-squared testing, and pattern recognition.\nIn English, E appears ~12.7%, T ~9.1%, A ~8.2%. A substitution cipher preserves these frequencies.",
    "prompt": "Explain probability distributions, frequency analysis, and how statistics is used to break ciphers",
    "levels": {
      "kids": "In English, the letter E shows up ALL the time — way more than a letter like Q or Z. So if a secret message is just letters shuffled around (like a Caesar cipher), whichever symbol shows up the most is probably hiding an E! It's like knowing that in a bag of jellybeans, the reddest-looking pile is probably the cherry flavor because that's the flavor with the most jellybeans in every bag.",
      "teen": "Every language has letters that appear more often than others — in English, E, T, A, O, I are the top five. A substitution cipher swaps letters one-for-one, so it can't hide *how often* each symbol appears, only *which symbol* it is. Count the symbols in the ciphertext, sort by frequency, and match the most common ones to the most common English letters — that's frequency analysis, and it's how simple ciphers were broken for a thousand years before computers.",
      "college": "Frequency analysis exploits the fact that a monoalphabetic substitution is a permutation of the alphabet — it preserves the empirical distribution's *shape*, only relabeling it. The **chi-squared statistic** χ² = Σ (observedᵢ − expectedᵢ)² / expectedᵢ scores how well a candidate shift matches the known English letter distribution; the shift minimizing χ² is the maximum-likelihood key. The same idea generalizes to bigram/trigram frequencies to break more complex substitutions, and its inverse — the **index of coincidence** — helps recover the key length in polyalphabetic ciphers like Vigenère.",
      "adult": "This is the technique al-Kindi described in the 9th century (the first known codebreaking treatise) and it remained the state of the art until the 20th century — Bletchley Park's assault on Enigma still leaned on statistical structure, just at industrial scale with the Bombe. It's also why modern ciphers are built to *destroy* statistical structure deliberately: Shannon's 1949 notion of **diffusion** (spreading plaintext statistics across the ciphertext) is a direct response to frequency analysis, and it's the design principle that makes AES's output look statistically indistinguishable from random noise."
    }
  },
  "rsa": {
    "title": "RSA Playground — The Math of Public-Key Encryption",
    "subtitle": "Pick two prime numbers, compute the public and private keys, and watch RSA encrypt and decrypt a message — all with real number theory.",
    "prereq": "**Math you’ll use:** *Number Theory* — prime numbers, Euler’s totient function φ(n), modular exponentiation, and the Extended Euclidean Algorithm.\nRSA security relies on the difficulty of factoring large numbers: easy to multiply two primes, nearly impossible to reverse.",
    "prompt": "Explain prime numbers, Euler's totient function, and modular exponentiation as used in RSA encryption",
    "levels": {
      "kids": "Imagine a mailbox with a slot anyone can drop a letter into, but only YOU have the key to open it. That's a **public key** — you can hand out the slot's address to the whole world, because dropping a letter in doesn't need a key, only opening the box does. RSA is math that builds a slot like that: everyone can lock a secret message using your public number, but only you, with your secret number, can unlock it.",
      "teen": "RSA uses two different keys: a **public key** anyone can use to scramble a message, and a **private key** only you have to unscramble it. The trick is multiplication and factoring aren't equally hard: multiplying two big prime numbers together is fast, but taking that giant product and figuring out which two primes made it is incredibly slow — even for computers. RSA builds its lock out of that one-way difficulty.",
      "college": "RSA key generation picks primes p, q, sets n = pq and φ(n) = (p−1)(q−1), chooses e coprime to φ(n), and computes d ≡ e⁻¹ (mod φ(n)) via the Extended Euclidean Algorithm. Encryption is c = mᵉ mod n; decryption is m = c^d mod n. Correctness follows from **Euler's theorem**: since ed ≡ 1 (mod φ(n)), we have med ≡ m^(1+kφ(n)) ≡ m·(m^φ(n))^k ≡ m (mod n) whenever gcd(m, n) = 1. Security rests on the (conjectured, unproven) hardness of the **integer factorization problem** — no known classical polynomial-time algorithm factors n = pq for large p, q.",
      "adult": "RSA underlies the key exchange in TLS/HTTPS (though modern deployments increasingly prefer elliptic-curve Diffie-Hellman for speed and smaller keys), PGP/GPG email signing, and SSH host authentication. Real deployments use 2048- or 4096-bit primes, not the toy 2-3 digit primes here — small primes make n trivially factorable. The looming threat is **Shor's algorithm**: a sufficiently large fault-tolerant quantum computer factors n in polynomial time, which is why NIST has already standardized post-quantum replacements (e.g. ML-KEM/Kyber) for infrastructure that needs to stay secure decades out."
    }
  },
  "diffiehellman": {
    "title": "Diffie-Hellman Key Exchange — Sharing Secrets in Public",
    "subtitle": "Watch Alice and Bob agree on a secret key while Eve listens to every message. The math of discrete logarithms makes it possible.",
    "prereq": "**Math you’ll use:** *Group Theory & Discrete Logarithms* — modular exponentiation in cyclic groups.\nGiven g^a mod p, finding “a” is computationally infeasible for large p. This one-way property is the foundation.",
    "prompt": "Explain group theory, discrete logarithms, and how Diffie-Hellman key exchange works mathematically",
    "levels": {
      "kids": "Picture Alice and Bob each secretly mixing their own color of paint into a shared can of yellow paint, then swapping cans in public. Anyone watching sees only muddy mixed colors — they can't easily tell what was mixed in. But when Alice adds her secret color to Bob's can (and Bob adds his to Alice's), they both end up with the exact same final color, without ever having said their secret color out loud!",
      "teen": "Alice and Bob agree publicly on two numbers, g and p. Each picks a secret number (a for Alice, b for Bob) and sends g^a mod p (or g^b mod p) to the other — this is easy to compute but hard to reverse. When Alice raises Bob's number to her secret power, and Bob raises Alice's number to his secret power, they land on the *same* result: g^(ab) mod p — a shared secret neither of them ever transmitted directly.",
      "college": "Diffie-Hellman works in the cyclic group (ℤ/pℤ)* generated by g. Alice sends A = gᵃ mod p, Bob sends B = gᵇ mod p; both compute the shared secret Bᵃ ≡ gᵃᵇ ≡ Aᵇ (mod p) by commutativity of exponentiation. Security rests on the **discrete logarithm problem**: given g, p, and gᵃ mod p, recovering a is believed computationally infeasible for large p, though — unlike RSA's factoring assumption — no reduction between the two hardness assumptions is known to hold in general.",
      "adult": "This 1976 protocol (Diffie, Hellman, with unacknowledged prior work by Merkle, and by GCHQ's Williamson/Cocks/Ellis) solved the problem of establishing a shared secret over a channel an adversary can read — the founding idea of public-key cryptography. Plain Diffie-Hellman has no authentication, so it's vulnerable to a **man-in-the-middle**: Eve can run the protocol separately with Alice and Bob, relaying and decrypting everything, unless the exchange is signed. Modern TLS uses ephemeral elliptic-curve DH (ECDHE) for **forward secrecy** — a new key pair per session, so recording today's traffic doesn't let an attacker with tomorrow's cracked key decrypt it retroactively."
    }
  }
};

/** Ciphertexts to practise frequency analysis on. */
export const SAMPLE_TEXTS: Record<string, string> = {
  "caesar": "WKLV LV D VHFUHW PHVVDJH HQFUBSWHG ZLWK D FDHVDU FLSKHU WKH VKLIW LV WKUHH",
  "subst": "ZG OCMG ZGKGTOKXGF ZNKIG YZXERVGTY ZNKXG CXG YGBGXCR USHHTG GRGSGHZY NKFFGH CKXUYY ZNK IGYYCKIG"
};
