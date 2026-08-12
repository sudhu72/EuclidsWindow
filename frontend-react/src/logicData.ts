// Formal Logic Lab content: the authored prose (four learner levels per game,
// plus the historical notes) and the puzzle sets, ported from the classic
// frontend/logiclab.js and index.html. Prose is Markdown so it renders through
// the app's existing Markdown component rather than as injected HTML.

export type Level = "kids" | "teen" | "college" | "adult";
export const LEVELS: Level[] = ["kids", "teen", "college", "adult"];

export interface GameCopy {
  title: string;
  subtitle: string;
  /** The "Math you'll use" brief shown above the game. */
  prereq: string;
  /** Historical note and everyday usage. */
  anecdote: string;
  /** Question sent to the tutor by "Explore in Learn". */
  prompt: string;
  levels: Record<string, string>;
}

export interface Syllogism {
  name: string;
  p1: string;
  p2: string;
  conc: string;
  valid: boolean;
  example: string;
  explain: string;
}

export interface KnavePuzzle {
  scenario: string;
  people: string[];
  options: string[];
  answer: Record<string, string>;
  hint: string;
  explain: string;
}

export const COPY: Record<string, GameCopy> = {
  "truthtable": {
    "title": "Truth Table Builder — See Logic in Black and White",
    "subtitle": "Type any propositional formula and instantly see every possible combination of truth values. The foundation of all mathematical proof.",
    "prereq": "**Math you’ll use:** *Propositional Logic* — AND (∧), OR (∨), NOT (¬), IMPLIES (→), IFF (↔).\nGeorge Boole (1854) showed that all of human reasoning could be reduced to algebra on 0s and 1s — an idea that, a century later, became the foundation of every computer chip.",
    "anecdote": "**Historical note:** In 1847, George Boole published *The Mathematical Analysis of Logic*, arguing that logic was a branch of mathematics, not philosophy. Augustus De Morgan independently developed similar ideas. A century later, Claude Shannon’s 1937 master’s thesis showed that Boolean algebra could design electrical circuits — arguably the most important master’s thesis ever written. Today, every CPU in the world runs on billions of Boolean operations per second.\n\n**Social usage:** Lawyers use propositional logic daily: “If the contract is signed AND the payment is received, THEN the deal is binding.” Debate teams, doctors diagnosing patients, and even everyday arguments (“If it’s raining, I’ll take an umbrella”) are all informal propositional logic.",
    "prompt": "Explain propositional logic, truth tables, and how Boolean algebra connects to computer science",
    "levels": {
      "kids": "Think of AND like both hands clapping — you need *both* to make a sound. OR is like two doors — you can go through either one. NOT is like a light switch — it flips on to off and off to on. A truth table just lists every possible combination and tells you the answer for each one!",
      "teen": "A **proposition** is a statement that is either true (1) or false (0). Connectives combine them: P ∧ Q is true only when both are true; P ∨ Q when at least one is; ¬P flips the value; P → Q is false only when P is true and Q is false; P ↔ Q when both match. A truth table lists all 2^n combinations for n variables, making it a complete decision procedure for propositional logic.",
      "college": "Propositional logic is **decidable**: truth tables give an O(2^n) decision procedure. A formula is a **tautology** if true in every row, **satisfiable** if true in at least one, **contradictory** if true in none. Two formulas are **logically equivalent** iff they share identical truth tables. Key equivalences: De Morgan’s laws (¬(P ∧ Q) ≡ ¬P ∨ ¬Q), material conditional (P → Q ≡ ¬P ∨ Q), contrapositive ((P → Q) ≡ (¬Q → ¬P)). The satisfiability problem (SAT) is NP-complete — the first problem shown to be so (Cook–Levin theorem, 1971).",
      "adult": "Propositional logic is the fragment of first-order logic without quantifiers. Its completeness (every tautology is provable) was shown by Post (1921). SAT solvers using DPLL and CDCL algorithms now routinely handle millions of variables and power formal verification of hardware/software (Intel uses SAT to verify chip designs). Resolution refutation is the basis of Prolog. The compactness theorem for propositional logic has deep consequences: a set of formulas is satisfiable iff every finite subset is."
    }
  },
  "syllogism": {
    "title": "Syllogism Validator — Aristotle’s Engine of Reason",
    "subtitle": "Test classic logical arguments: are the conclusions truly forced by the premises? Aristotle invented this 2,400 years ago, and it still works.",
    "prereq": "**Math you’ll use:** *Categorical Logic* — “All”, “Some”, “No”, and “Some…not” statements about categories.\nAristotle’s *Prior Analytics* (~350 BCE) was the first formal system in history — 2,000 years before Boolean algebra.",
    "anecdote": "**Historical note:** Aristotle’s syllogistic was the dominant logic system for over two millennia. Medieval scholars (Ockham, Aquinas) used it to structure theological arguments. The names “Barbara”, “Celarent”, “Darii” are medieval mnemonics where vowels encode the proposition types (A=All, E=No, I=Some, O=Some…not).\n\n**Social usage:** Courtroom arguments, political rhetoric, and advertising all exploit (and sometimes abuse) syllogistic reasoning. The fallacy of “affirming the consequent” (“Successful people work hard; I work hard; therefore I am successful”) is rampant in self-help culture. Recognizing these patterns is a civic superpower.",
    "prompt": "Explain Aristotelian syllogisms, the four categorical propositions, and valid syllogistic forms",
    "levels": {
      "kids": "A syllogism is like a chain of facts: “All dogs are animals. Rex is a dog. So Rex is an animal.” If the two facts at the top are true, the bottom one *must* be true — that’s what makes it **valid**. But watch out: “All cats are animals. Rex is an animal. So Rex is a cat” — that’s a trick! The conclusion doesn’t follow.",
      "teen": "A **categorical syllogism** has two premises and a conclusion, each of the form: All S are P (A), No S are P (E), Some S are P (I), or Some S are not P (O). The **middle term** appears in both premises but not the conclusion, linking the other terms. Aristotle identified 256 possible forms, of which only 24 are valid. Validity depends on the *form* alone, not the content — you can check it mechanically.",
      "college": "Syllogistic logic is a fragment of monadic first-order logic. Venn diagrams provide a decision procedure: shade regions for universal premises, place marks for existential ones, then check if the conclusion’s diagram is forced. The 24 valid moods (15 unconditionally + 9 with existential import) were completely classified by the medieval logicians. Modern predicate logic (Frege, 1879) superseded syllogistic by adding relations, functions, and quantifier nesting.",
      "adult": "Aristotle’s *Prior Analytics* is arguably the first axiomatic system: he derives all valid forms from a small set of “perfect” syllogisms using conversion, reduction, and *ecthesis*. Leibniz dreamed of a *calculus ratiocinator* that would mechanize all reasoning; Boole, Frege, and G&ouml;del eventually fulfilled parts of that vision. G&ouml;del’s completeness theorem (1929) shows first-order logic is the natural boundary: every logically valid sentence is provable. His incompleteness theorems (1931) then showed that any sufficiently powerful formal system (e.g., Peano arithmetic) contains true but unprovable statements."
    }
  },
  "knights": {
    "title": "Knights & Knaves — Puzzles of Truth and Deception",
    "subtitle": "On a mysterious island, **Knights** always tell the truth and **Knaves** always lie. Given their statements, can you figure out who is who?",
    "prereq": "**Math you’ll use:** *Propositional Logic & Proof by Contradiction* — assume something, derive consequences, check for contradictions.\nThese puzzles were popularized by Raymond Smullyan in *What Is the Name of This Book?* (1978) and connect directly to G&ouml;del’s self-reference techniques.",
    "anecdote": "**Historical note:** Raymond Smullyan, a mathematician, magician, and Taoist philosopher, created hundreds of these puzzles. They are isomorphic to propositional satisfiability problems. The “fork in the road” puzzle has a brilliant one-question solution that exploits nested truth/lie evaluation — it appeared in the 1986 film *Labyrinth*.\n\n**Social usage:** Job interviewers at Google and other tech companies used Knights & Knaves-style puzzles to test logical reasoning. Diplomatic negotiations sometimes resemble these puzzles: parties may be truthful or deceptive, and you must reason about their incentives. The underlying skill — reasoning about what someone *would say* given their nature — is the heart of game theory.",
    "prompt": "Explain Knights and Knaves logic puzzles, proof by contradiction, and how self-reference connects to Gödel's theorems",
    "levels": {
      "kids": "Imagine an island where some people ALWAYS tell the truth (Knights) and others ALWAYS lie (Knaves). If a Knight says “I am a Knight,” that’s true. But if a Knave says “I am a Knight,” that’s a lie — because Knaves lie about everything! So *both* types would say “I am a Knight.” The trick is to find questions where Knights and Knaves give *different* answers.",
      "teen": "To solve these, assign variables: let K_A = “A is a Knight” (true/false). If A says statement S, then K_A ↔ S must be true (Knights say true things, Knaves say false things). This gives you Boolean equations to solve. **Proof by contradiction**: assume A is a Knight; if that leads to a contradiction, A must be a Knave (and vice versa). Systematic case analysis solves every puzzle.",
      "college": "Knights & Knaves puzzles are satisfiability problems in disguise. Each statement by person A asserting S generates the constraint K_A ↔ S. The puzzle is satisfiable iff there exists a consistent truth assignment. The “fork” puzzle’s solution uses a **double negation** trick: asking “If I asked you whether the left road leads to freedom, would you say yes?” forces both Knights and Knaves to point to the correct road. This is related to the “oracle” concept in computability theory.",
      "adult": "Smullyan used Knights & Knaves as pedagogical tools for G&ouml;del’s incompleteness theorems. In *Forever Undecided* (1987), he constructs an island where a reasoner cannot determine their own type — a direct analogue of G&ouml;del sentences. The connection to the Liar Paradox (“This sentence is false”) is precise: a Knave saying “I am a Knave” creates a paradox in classical logic. Paraconsistent logics and Kripke’s fixed-point theory of truth address such self-referential puzzles formally."
    }
  },
  "gates": {
    "title": "Logic Gate Circuit — Build a Digital Brain",
    "subtitle": "Wire AND, OR, and NOT gates to produce the target output. This is exactly how computers think — every calculation is logic gates all the way down.",
    "prereq": "**Math you’ll use:** *Boolean Algebra & Circuit Design* — the bridge between abstract logic and physical hardware.\nClaude Shannon’s 1937 thesis showed that any Boolean function can be built with switches — launching the digital age.",
    "anecdote": "**Historical note:** Shannon’s thesis supervisor, Vannevar Bush, had built an analog computer (the Differential Analyzer). Shannon realized that Boole’s 70-year-old algebra was the perfect language for designing the *digital* successor. In WWII, Tommy Flowers built Colossus — the first programmable digital computer — using 1,500 vacuum tubes as logic gates to break Nazi codes. Today a single Apple M4 chip has ~28 billion transistors, each acting as a tiny logic gate.\n\n**Social usage:** Logic gates are behind every Google search, every bank transaction, every text message. When you set a spreadsheet formula like =AND(A1>5, B1<10), you are building a logic gate. Understanding gates demystifies “how computers work” from magic to math.",
    "prompt": "Explain Boolean algebra, logic gates AND OR NOT XOR, and how Claude Shannon connected them to circuit design",
    "levels": {
      "kids": "Logic gates are tiny switches inside a computer. An AND gate only turns on when *both* inputs are on. An OR gate turns on when *either* input is on. A NOT gate flips on to off and off to on. By combining millions of these simple switches, computers can add numbers, show videos, and play games!",
      "teen": "Every Boolean function f(x_1, …, x_n) can be expressed using just AND, OR, NOT (or even just NAND alone!). **XOR** (exclusive or): true when inputs differ. A **half adder** adds two bits: Sum = A XOR B, Carry = A AND B. Chain these into **full adders** and you get integer addition — which is all a CPU’s ALU fundamentally does.",
      "college": "Boolean algebra forms a **complemented distributive lattice**. Shannon’s expansion theorem: f = x&middot;f_x=1 + x&prime;&middot;f_x=0 (the basis of BDD construction). **Functional completeness**: {NAND} and {NOR} are each universal — any Boolean function can be built from one gate type alone. The **Quine–McCluskey algorithm** finds minimal sum-of-products forms. Circuit complexity theory asks: what is the minimum number of gates needed for a given function?",
      "adult": "Circuit complexity is a central topic in theoretical CS. P/poly captures non-uniform polynomial-size circuits; if NP &notin; P/poly, then P ≠ NP. The **natural proofs barrier** (Razborov–Rudich, 1997) shows that standard techniques cannot prove super-polynomial circuit lower bounds for NP functions if one-way functions exist. In practice, synthesis tools (ABC, Yosys) use AIG (And-Inverter Graph) representations and SAT-based optimization to design circuits with billions of gates."
    }
  }
};

export const SYLLOGISMS: Syllogism[] = [
  {
    "name": "Barbara (AAA-1)",
    "p1": "All M are P",
    "p2": "All S are M",
    "conc": "All S are P",
    "valid": true,
    "example": "All mammals are animals. All dogs are mammals. ∴ All dogs are animals.",
    "explain": "Barbara is the most fundamental valid syllogism. The middle term (M) links S to P through two universal affirmatives."
  },
  {
    "name": "Celarent (EAE-1)",
    "p1": "No M are P",
    "p2": "All S are M",
    "conc": "No S are P",
    "valid": true,
    "example": "No reptiles are mammals. All snakes are reptiles. ∴ No snakes are mammals.",
    "explain": "Celarent: the universal negative premise eliminates overlap, and the universal affirmative forces S into the non-P region."
  },
  {
    "name": "Affirming the Consequent",
    "p1": "If P then Q",
    "p2": "Q is true",
    "conc": "Therefore P is true",
    "valid": false,
    "example": "If it rains, the ground is wet. The ground is wet. ∴ It rained. (But a sprinkler could cause wet ground!)",
    "explain": "This is a classic FALLACY. P → Q and Q does not entail P. The ground could be wet for many reasons besides rain."
  },
  {
    "name": "Denying the Antecedent",
    "p1": "If P then Q",
    "p2": "P is false",
    "conc": "Therefore Q is false",
    "valid": false,
    "example": "If you study, you'll pass. You didn't study. ∴ You won't pass. (But you might pass anyway!)",
    "explain": "Another classic FALLACY. P → Q and ¬P does not entail ¬Q. There could be other ways to achieve Q."
  },
  {
    "name": "Darii (AII-1)",
    "p1": "All M are P",
    "p2": "Some S are M",
    "conc": "Some S are P",
    "valid": true,
    "example": "All poets are creative. Some students are poets. ∴ Some students are creative.",
    "explain": "Darii: the universal premise guarantees all M are P; the particular premise places some S among M; so those S must be P."
  },
  {
    "name": "Socrates (applied)",
    "p1": "All men are mortal",
    "p2": "Socrates is a man",
    "conc": "Socrates is mortal",
    "valid": true,
    "example": "All men are mortal. Socrates is a man. ∴ Socrates is mortal. (The most famous syllogism in history!)",
    "explain": "This is Barbara applied to a specific individual. Aristotle used this very example in his lectures at the Lyceum ~335 BCE."
  }
];

export const KNAVE_PUZZLES: KnavePuzzle[] = [
  {
    "scenario": "You meet **A** and **B** on the island.\n\nA says: *\"We are both Knaves.\"*",
    "people": [
      "A",
      "B"
    ],
    "options": [
      "Knight",
      "Knave"
    ],
    "answer": {
      "A": "Knave",
      "B": "Knight"
    },
    "hint": "If A were a Knight, would it be true that both are Knaves? That would be a contradiction!",
    "explain": "If A is a Knight, then 'both are Knaves' is true — but A can't be both Knight and Knave. Contradiction! So A is a Knave. Since A lied, it's false that both are Knaves, so B must be a Knight."
  },
  {
    "scenario": "You meet **A** and **B**.\n\nA says: *\"I am a Knave or B is a Knight.\"*",
    "people": [
      "A",
      "B"
    ],
    "options": [
      "Knight",
      "Knave"
    ],
    "answer": {
      "A": "Knight",
      "B": "Knight"
    },
    "hint": "Consider: can a Knight say 'I am a Knave'? Can that disjunction be false if A is a Knight?",
    "explain": "If A is a Knave, then 'I am a Knave or B is a Knight' is false. For a disjunction to be false, BOTH parts must be false. So 'I am a Knave' is false (making A a Knight) — contradiction! So A must be a Knight, making the statement true. Since 'I am a Knave' is false for a Knight, 'B is a Knight' must be true."
  },
  {
    "scenario": "You meet **A**, **B**, and **C**.\n\nA says: *\"All three of us are Knaves.\"*\n\nB says: *\"Exactly one of us is a Knight.\"*",
    "people": [
      "A",
      "B",
      "C"
    ],
    "options": [
      "Knight",
      "Knave"
    ],
    "answer": {
      "A": "Knave",
      "B": "Knight",
      "C": "Knave"
    },
    "hint": "A claims all three are Knaves. Can a Knight make that claim?",
    "explain": "A can't be a Knight (would mean all are Knaves — contradiction). So A is a Knave, and the statement 'all Knaves' is false. B says 'exactly one Knight.' If B is a Knight, then B is that one Knight, making A and C Knaves. Check: A(Knave) lies ✓, B(Knight) tells truth ✓. This is consistent. If B were a Knave, 'exactly one Knight' is false, but we need at least one non-Knave... testing shows B=Knight, C=Knave is the only consistent solution."
  },
  {
    "scenario": "You reach a fork in the road. One path leads to **freedom**, the other to **doom**. A single islander stands at the fork — you don't know if they're a Knight or Knave.\n\nYou may ask **one yes/no question**. What do you ask to find the safe path?\n\nSelect the correct strategy:",
    "people": [
      "Strategy"
    ],
    "options": [
      "Ask: 'Is the left path safe?'",
      "Ask: 'Are you a Knight?'",
      "Ask: 'If I asked you whether the left path leads to freedom, would you say yes?'",
      "Ask: 'Does the right path lead to doom?'"
    ],
    "answer": {
      "Strategy": "Ask: 'If I asked you whether the left path leads to freedom, would you say yes?'"
    },
    "hint": "The key is a NESTED question that makes both Knights and Knaves give the same answer. Think about what happens when a liar lies about what they would say...",
    "explain": "The double-question trick: 'If I asked you whether left is safe, would you say yes?' A Knight would truthfully report their truthful answer. A Knave would LIE about their LIE — the double negation cancels out! Both types effectively answer truthfully about the path. If they say 'yes', go left; 'no', go right."
  },
  {
    "scenario": "You meet **A** on the island.\n\nA says: *\"I am a Knave.\"*\n\nWhat is A?",
    "people": [
      "A"
    ],
    "options": [
      "Knight",
      "Knave",
      "Paradox — impossible!"
    ],
    "answer": {
      "A": "Paradox — impossible!"
    },
    "hint": "If A is a Knight, the statement is true, so A is a Knave... If A is a Knave, the statement is false, so A is NOT a Knave (= Knight)...",
    "explain": "This is a PARADOX — the Liar Paradox in disguise! If A is a Knight, then 'I am a Knave' is true, making A a Knave — contradiction. If A is a Knave, then 'I am a Knave' is false, making A NOT a Knave (= Knight) — contradiction. No consistent assignment exists. Smullyan used this to introduce Gödel's self-reference technique."
  }
];

export interface GatePuzzle {
  name: string;
  vars: string[];
  /** The output the learner's formula has to reproduce, per assignment. */
  target: (...bits: number[]) => number;
  /** Markdown; the classic version was HTML. */
  desc: string;
  hint: string;
  placeholder: string;
}

export const GATE_PUZZLES: GatePuzzle[] = [
  {
    name: "XOR from AND, OR, NOT",
    vars: ["A", "B"],
    target: (a, b) => a ^ b,
    desc:
      "Build **XOR** (exclusive or): output is 1 when the inputs differ, 0 when they match.\n\n" +
      "Target: A⊕B. Use only `&&`, `||`, `!`.",
    hint: "XOR = (A || B) && !(A && B) — or equivalently (A && !B) || (!A && B).",
    placeholder: "(A && !B) || (!A && B)",
  },
  {
    name: "NAND is universal",
    vars: ["A", "B"],
    target: (a, b) => (a && b ? 0 : 1),
    desc:
      "Build **NAND**: output is 0 only when BOTH inputs are 1.\n\n" +
      "NAND is 'universal' — you can build ANY logic function using only NAND gates.",
    hint: "NAND = NOT(A AND B) = !(A && B).",
    placeholder: "!(A && B)",
  },
  {
    name: "Majority vote (2 of 3)",
    vars: ["A", "B", "C"],
    target: (a, b, c) => (a + b + c >= 2 ? 1 : 0),
    desc:
      "Build a **majority vote**: output is 1 when at least 2 of the 3 inputs are 1.\n\n" +
      "This is how fault-tolerant systems work in aerospace (triple modular redundancy).",
    hint: "Majority = (A && B) || (A && C) || (B && C).",
    placeholder: "(A && B) || (A && C) || (B && C)",
  },
  {
    name: "Half adder — Sum bit",
    vars: ["A", "B"],
    target: (a, b) => a ^ b,
    desc:
      "Build the **Sum** output of a half adder. A half adder adds two 1-bit numbers: " +
      "Sum = A⊕B (the XOR), Carry = A∧B.\n\nFocus on the Sum bit here.",
    hint: "Sum is XOR: (A && !B) || (!A && B).",
    placeholder: "(A && !B) || (!A && B)",
  },
  {
    name: "Multiplexer (selector)",
    vars: ["A", "B", "S"],
    target: (a, b, s) => (s ? b : a),
    desc:
      "Build a **2-to-1 multiplexer**: when S=0 output A; when S=1 output B.\n\n" +
      "Multiplexers are the routers inside every CPU, selecting which data flows where.",
    hint: "MUX = (!S && A) || (S && B).",
    placeholder: "(!S && A) || (S && B)",
  },
];
