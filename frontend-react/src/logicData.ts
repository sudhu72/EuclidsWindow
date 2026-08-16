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
  },
  "argument": {
    "title": "Argument Builder — The Language of Rational Argument",
    "subtitle": "Take a real historical argument apart into its logical skeleton, or build your own — the same grammar that proves a theorem can hold up (or fall apart) in law, science, ethics, and policy.",
    "prereq": "**Math you’ll use:** *The syllogism, extended.* A rational argument is a syllogism's premises and conclusion, plus a place for evidence that's only probable rather than certain. Stephen Toulmin's 1958 model names the missing pieces: **Claim**, **Grounds**, **Warrant**, **Backing**, **Qualifier**, **Rebuttal**. This is the same machinery as the Syllogism game above, built out to handle real-world arguments that don't come with guaranteed premises.",
    "anecdote": "**Historical note:** Aristotle's *Prior Analytics* (~350 BCE) gave the world its first formal argument structure — the syllogism — and *Rhetoric* named the three appeals (logos, ethos, pathos) that still describe how arguments persuade. Two thousand years later, philosopher Stephen Toulmin argued in *The Uses of Argument* (1958) that real courtroom, scientific, and political arguments rarely fit the bare syllogism, because their evidence is only probable — his six-part model is the field's standard tool for laying one out ever since.\n\n**Social usage:** Legal briefs, grant proposals, scientific papers, and policy memos are all, structurally, Toulmin arguments — a claim, evidence, and (often left unstated, and often where the real disagreement hides) a warrant connecting the two.",
    "prompt": "Explain how to construct a rational argument using premises, validity, and the Toulmin model of claim, grounds, warrant, and rebuttal",
    "levels": {
      "kids": "Building an argument is like stacking blocks: your reasons are the blocks at the bottom, and your conclusion sits on top. If even one bottom block is wobbly — not really true — the whole tower can fall, even if everything above it was stacked perfectly! Pick an example below and see how each piece fits, or build your own.",
      "teen": "Most real arguments — about school rules, history, or science — aren't pure math syllogisms, because their evidence is only *probably* true, not certain. The Toulmin model adds the missing pieces: your **Claim** (what you're arguing), your **Grounds** (the evidence), your **Warrant** (WHY that evidence supports that claim — often the part nobody says out loud), and a **Rebuttal** (when your claim wouldn't hold). Load a real example and see which piece is actually doing the work.",
      "college": "The classical syllogism is deductively airtight but brittle — it has no vocabulary for defeasible, probable evidence, which is what most real arguments about policy, ethics, and open scientific questions actually run on. Toulmin's model generalizes it: **Warrant** plays the role of an (often implicit) major premise, **Backing** justifies the warrant itself if challenged, and **Rebuttal** is the one piece classical deductive logic has no room for at all, since a valid deductive argument can't be defeated by new information without denying a premise outright.",
      "adult": "This is the actual skeleton behind persuasive legal briefs, grant proposals, and policy memos, whether or not the author has heard of Toulmin. A memo that states a claim and cites evidence but never states the warrant — why that evidence is supposed to support that claim — asks a skeptical reader to take the connection on faith, which is exactly where careful readers push back. Load one of the historical examples below, or draft your own real argument and see it laid out the same way."
    }
  }
};

export interface ArgumentExample {
  domain: string;
  title: string;
  source: string;
  claim: string;
  grounds: string;
  warrant: string;
  backing: string;
  qualifier: string;
  rebuttal: string;
  logicalForm: string[];
  note: string;
  /**
   * Optional propositional-logic rendering: the argument's warrant/grounds/
   * claim reduced to single-letter variables, so its validity can be checked
   * mechanically with the same truthTable() engine the Truth Table Builder
   * game uses. Omitted for arguments that are inductive/statistical rather
   * than deductive — there's no tautology to check for those, on purpose.
   */
  symbolic?: {
    symbols: { symbol: string; meaning: string }[];
    /** Symbolic premise/conclusion lines, e.g. "J → D", "¬D", "∴ ¬J". */
    premises: string[];
    /** The whole argument as one implication, in the app's formula syntax (&&, ||, !, ->, <->). */
    formula: string;
    patternName: string;
    explain: string;
  };
}

export const ARGUMENT_EXAMPLES: ArgumentExample[] = [
  {
    domain: "Mathematics",
    title: "A Pure Syllogism (for contrast)",
    source: "Aristotle, applied to Euclid",
    claim: "This triangle's angles sum to 180°.",
    grounds: "It is a Euclidean-plane triangle.",
    warrant: "Every Euclidean-plane triangle's angles sum to 180° (proved from the parallel postulate).",
    backing: "The proof itself — Euclid, Elements I.32.",
    qualifier: "Certainly — no exceptions, given the axioms.",
    rebuttal: "None, within Euclidean geometry. (On a sphere's surface, the warrant itself changes — angles sum to more than 180°.)",
    logicalForm: [
      "P1: Every Euclidean-plane triangle has angles summing to 180°.",
      "P2: This is a Euclidean-plane triangle.",
      "∴ This triangle's angles sum to 180°.",
    ],
    note: "The reference case: grounds, warrant, and conclusion are all certain, so the Qualifier and Rebuttal are trivial. Every argument below is what happens once that certainty is gone.",
    symbolic: {
      symbols: [
        { symbol: "T", meaning: "this is a Euclidean-plane triangle" },
        { symbol: "A", meaning: "its angles sum to 180°" },
      ],
      premises: ["T → A   (warrant)", "T   (grounds)", "∴ A   (claim)"],
      formula: "((T -> A) && T) -> A",
      patternName: "Modus Ponens",
      explain: "The oldest valid form there is: affirm the antecedent of a true conditional, and the consequent is forced. Check the table below — it's true in every single row, no matter what T and A actually mean. That's what \"valid\" means: the FORM guarantees the conclusion, independent of content.",
    },
  },
  {
    domain: "Ethics / Philosophy",
    title: "Beccaria's Case Against the Death Penalty (utilitarian)",
    source: "Cesare Beccaria, On Crimes and Punishments, 1764",
    claim: "The death penalty is not justified.",
    grounds: "Life imprisonment deters crime more reliably than execution, because deterrence depends on the certainty of punishment, not its severity.",
    warrant: "The sole legitimate purpose of punishment is preventing future crime, not exacting revenge.",
    backing: "Observed patterns of certain, moderate punishment outperforming rare, severe punishment.",
    qualifier: "Beccaria argues this as a matter of principle, not probability.",
    rebuttal: "Fails if punishment has a legitimate purpose besides deterrence (see Kant, next example) — then the warrant itself is being denied, not the grounds.",
    logicalForm: [
      "P1: Punishment is justified only insofar as it prevents future crime.",
      "P2: Life imprisonment prevents future crime more reliably than execution.",
      "∴ Execution is not justified.",
    ],
    note: "Valid in form. Its soundness rests entirely on P1 (a contested ethical premise — see Kant) and P2 (a contested empirical claim — deterrence research remains genuinely unsettled).",
    symbolic: {
      symbols: [
        { symbol: "J", meaning: "execution is justified as punishment" },
        { symbol: "D", meaning: "execution deters crime more reliably than life imprisonment" },
      ],
      premises: ["J → D   (warrant: if justified, it must be the better deterrent)", "¬D   (grounds: it is NOT the better deterrent)", "∴ ¬J   (claim: execution is not justified)"],
      formula: "((J -> D) && !D) -> !J",
      patternName: "Modus Tollens",
      explain: "Deny the consequent of a true conditional, and you're forced to deny the antecedent too. This is a different valid pattern from Modus Ponens above — it's how Beccaria's argument actually moves: not from a cause to its effect, but from the ABSENCE of an expected effect back to the absence of its supposed justification. The table below confirms it's a tautology, too.",
    },
  },
  {
    domain: "Ethics / Philosophy",
    title: "Kant's Case For Retribution (deontological)",
    source: "Immanuel Kant, The Metaphysics of Morals, 1797",
    claim: "Justice requires the death penalty for murder.",
    grounds: "For the crime of murder, no lesser punishment is proportionate.",
    warrant: "Punishment must be proportionate to the crime — that is what makes it just, independent of whether it deters anyone.",
    backing: "The principle of proportionate retribution (ius talionis).",
    qualifier: "Kant argues this as a categorical requirement, not a probabilistic one.",
    rebuttal: "Fails only if proportionate retribution is not, in fact, the correct ground of just punishment — a values question Beccaria's argument doesn't even address, since it starts from a different warrant entirely.",
    logicalForm: [
      "P1: Just punishment must be proportionate to the crime, regardless of consequences.",
      "P2: For murder, only death is proportionate.",
      "∴ Justice requires the death penalty for murder.",
    ],
    note: "Also valid in form. Notice it and Beccaria's argument don't actually contradict each other logically — they answer different questions (what produces good outcomes vs. what is deserved), which is why this debate rarely resolves by evidence alone. See the Case Study topics in Learn for the fuller picture, including the empirical and sociological layers.",
    symbolic: {
      symbols: [
        { symbol: "M", meaning: "the crime is murder" },
        { symbol: "D", meaning: "death is the proportionate, just punishment" },
      ],
      premises: ["M → D   (warrant: for murder, death is what proportionality requires)", "M   (grounds: this crime is murder)", "∴ D   (claim: death is the just punishment here)"],
      formula: "((M -> D) && M) -> D",
      patternName: "Modus Ponens",
      explain: "Same valid pattern as the pure-math example above, wearing different clothes — and that's the point. Kant's and Beccaria's arguments are both perfectly valid; the truth tables below can't tell you which one is right, because validity only checks the FORM. Whether M→D or J→D is actually true is a question about ethics, not logic — see 'the language of mathematics' can formalize an argument without settling it.",
    },
  },
  {
    domain: "Science",
    title: "Semmelweis and the Hidden Cause of Childbed Fever",
    source: "Ignaz Semmelweis, 1847",
    claim: "Doctors' unwashed hands, carrying \"cadaverous particles\" from autopsies, are causing maternal deaths.",
    grounds: "The doctor-staffed ward (autopsy contact) had a ~10% death rate; the midwife-staffed ward (no autopsy contact) had ~4%, on similar patients. A colleague died of matching symptoms after a cadaver-scalpel cut.",
    warrant: "A large, otherwise-unexplained mortality gap between two comparable wards points to the one major factor that differs between them.",
    backing: "The leading rival theory (\"bad air\"/miasma) couldn't explain a difference between two wards sharing the same hospital air.",
    qualifier: "Probable, pending a direct test.",
    rebuttal: "Mandatory handwashing with chlorinated lime, tested directly, dropped the doctors' ward to the midwives' death rate almost immediately — the rebuttal condition was checked, not just assumed away.",
    logicalForm: [
      "P1: An intervention that removes the one major differing factor should close the mortality gap, if that factor is the cause.",
      "P2: Mandatory handwashing (removing hand-borne \"cadaverous particles\") closed the gap.",
      "∴ Hand-borne particles were a cause of the deaths.",
    ],
    note: "Strictly, this is NOT deductively valid — see the symbolic form below. It's abductive: inference to the best explanation, the normal and legitimate mode of scientific reasoning, not a flaw. What made it convincing wasn't logical necessity but ruling out the leading rival explanation (miasma) and then testing the remaining hypothesis directly. Later confirmed by germ theory, decades after the fact — and rejected by most contemporaries anyway: a reminder that a good argument and a persuasive one aren't automatically the same thing.",
    symbolic: {
      symbols: [
        { symbol: "F", meaning: "hand-borne particles from autopsies are the cause" },
        { symbol: "R", meaning: "handwashing closes the mortality gap" },
      ],
      premises: ["F → R   (warrant: if F is the cause, removing it should close the gap)", "R   (grounds: the gap DID close)", "∴ F   (claim: F was the cause)"],
      formula: "((F -> R) && R) -> F",
      patternName: "Affirming the Consequent — a fallacy, if treated as deductive",
      explain: "Run this one through the table below and it is NOT always true — try F=false, R=true. That's the same invalid pattern the Syllogism game calls out (\"the ground could be wet for many reasons besides rain\"). Semmelweis's real argument survives this anyway, because it isn't trying to be deductive: it's the best surviving explanation after ruling out the alternative (miasma), then confirmed by a direct test. Most of real science reasons this way — which is exactly why it needs the ruling-out step this pattern skips.",
    },
  },
  {
    domain: "Sociology / Public Health",
    title: "Nightingale's Rose Diagram",
    source: "Florence Nightingale, 1858",
    claim: "Unsanitary conditions, not battle wounds, are the leading cause of death among British soldiers.",
    grounds: "Army mortality statistics from the Crimean War, broken down by cause of death and month.",
    warrant: "A cause responsible for most recorded deaths is the leading cause of death.",
    backing: "Nightingale's own statistical training (she studied under mathematician James Joseph Sylvester).",
    qualifier: "Demonstrated, not merely argued — she treated the data as already conclusive.",
    rebuttal: "None seriously raised — the obstacle wasn't the argument's soundness but getting Parliament to actually engage with it, which is why she invented the polar area diagram: the same evidence, made impossible to ignore visually.",
    logicalForm: [
      "P1: Recorded cause-of-death data show disease deaths far outnumbering battle-wound deaths.",
      "P2: This pattern holds consistently across the war's duration.",
      "∴ Unsanitary conditions were the leading killer, not combat.",
    ],
    note: "A case where the logic was never really the obstacle — the argument's *presentation* was. The polar area diagram (an early pie-chart relative) is itself part of the argument: it's what finally moved Parliament to fund sanitary reform. No symbolic form below, on purpose: this is a statistical generalization from a large, representative sample, not a deductive argument — its strength comes from the size and representativeness of the data, and there's no tautology to check. That's not a weakness; it's the actual dividing line between inductive and deductive reasoning (see 'From Aristotle to Boole' in Learn).",
  },
  {
    domain: "History / Political Theory",
    title: "Madison's Federalist No. 10 — Disjunctive Syllogism",
    source: "James Madison, Federalist No. 10, 1787",
    claim: "The proper cure for the mischiefs of faction is to control their effects, not remove their causes.",
    grounds: "Removing the causes of faction is impracticable: it would mean destroying liberty itself (unacceptable) or giving every citizen identical opinions and interests (impossible).",
    warrant: "There are exactly two possible cures for the mischiefs of faction — removing their causes, or controlling their effects — and removing the causes is impracticable.",
    backing: "Madison states the disjunction almost verbatim: \"There are two methods of curing the mischiefs of faction: the one, by removing its causes; the other, by controlling its effects.\"",
    qualifier: "Presented as a logically exhaustive choice between exactly two methods, not a matter of degree.",
    rebuttal: "Fails only if there's a third cure Madison didn't consider, or if removing the causes turns out to be practicable after all.",
    logicalForm: [
      "P1: There are exactly two possible cures for the mischiefs of faction — removing their causes, or controlling their effects.",
      "P2: Removing the causes is impracticable.",
      "∴ We must control the effects instead.",
    ],
    note: "Valid — and a genuinely different pattern from anything above. Madison uses this disjunctive syllogism to set up the rest of Federalist No. 10's real argument (a large, diverse republic controls factional effects better than a small one), which is formalized in full in the 'Constructing a Rational Argument' topic in Learn.",
    symbolic: {
      symbols: [
        { symbol: "C", meaning: "we cure factions by removing their causes" },
        { symbol: "E", meaning: "we cure factions by controlling their effects" },
      ],
      premises: ["C ∨ E   (warrant: these are the only two possible cures)", "¬C   (grounds: removing the causes is impracticable)", "∴ E   (claim: we must control the effects)"],
      formula: "((C || E) && !C) -> E",
      patternName: "Disjunctive Syllogism",
      explain: "Rule out one option from an exhaustive either/or, and the other is forced — a third valid pattern, distinct from Modus Ponens and Modus Tollens above. Check the table: true in every row, so this is a tautology regardless of what C and E actually stand for. The real, arguable question is whether the warrant's \"exactly two\" is really exhaustive — Madison has to convince you there's no third cure, not just that the logic from two-to-one works.",
    },
  },
  {
    domain: "Philosophy",
    title: "Pascal's Wager — Reasoning Under Uncertainty",
    source: "Blaise Pascal, Pensées, published 1670",
    claim: "It is rational to live as if God exists (to \"wager for God\").",
    grounds: "If God exists and you wager for God, the gain is infinite. If God doesn't exist and you wager for God, the loss is merely finite (some earthly pleasures forgone). The reverse choice risks an infinite loss for at best a finite gain.",
    warrant: "When one option offers a possible infinite gain at bounded risk, and the alternative offers at best a bounded gain at possible infinite risk, rationality favors the first — regardless of how likely each outcome actually is.",
    backing: "An early, explicit use of expected-value reasoning — contemporaneous with Pascal's correspondence with Fermat founding probability theory itself.",
    qualifier: "Pascal presents this as compelling under genuine uncertainty about God's existence — it is not offered as proof that God exists.",
    rebuttal: "The classic \"many gods\" objection: if several incompatible gods might exist, the wager doesn't tell you which one to wager for, so the clean two-option payoff matrix Pascal assumes may not hold.",
    logicalForm: [
      "P1: Wagering for God has a possible infinite payoff and a bounded worst case.",
      "P2: Wagering against God has a bounded best case and a possible infinite worst case.",
      "∴ Wagering for God is the rational choice, regardless of the actual odds.",
    ],
    note: "No symbolic tautology below, for a different reason than Nightingale's. This isn't a deductive argument (like the syllogisms above) or an inductive one (like Nightingale's) — it's a decision-theoretic argument, comparing payoffs under uncertainty rather than deriving a true conclusion from true premises. \"Valid\" doesn't even apply to a dominance argument the way it applies to Modus Ponens; what actually matters is whether the payoff structure Pascal describes is accurate, which is exactly where the \"many gods\" rebuttal attacks it. Three examples in this Lab, three different reasons a real argument might have no truth table to check.",
  },
  {
    domain: "Education Policy",
    title: "\"Banning Phones Raised Test Scores\" — a Fallacy in the Wild",
    source: "A widely repeated argument in school-policy debates",
    claim: "Banning phones in class causes higher test scores.",
    grounds: "Several schools banned phones, and test scores rose afterward.",
    warrant: "If banning phones caused the rise, scores rising after the ban is exactly what we'd expect to see — and that's what was observed.",
    backing: "News coverage citing the same before/after comparison across several schools.",
    qualifier: "Usually presented as settled fact, without qualification.",
    rebuttal: "Collapses immediately if anything else changed at the same time — a new curriculum, smaller classes, a different cohort of students — that could equally explain the rise. In the reporting this argument is usually drawn from, that possibility is rarely even checked.",
    logicalForm: [
      "P1: If banning phones causes higher scores, scores should rise after the ban.",
      "P2: Scores rose after the ban.",
      "∴ Banning phones caused the rise.",
    ],
    note: "This is post hoc ergo propter hoc from the 'Constructing a Rational Argument' topic in Learn, worked out in full — and worth comparing directly against Semmelweis above. Same invalid skeleton, same \"not a tautology\" result below. The only real difference between the two: Semmelweis went on to rule out the leading rival explanation and test his conclusion directly; this argument, as usually repeated, does neither. The logic gap is identical — what differs is how honestly each one owns it.",
    symbolic: {
      symbols: [
        { symbol: "B", meaning: "banning phones is the cause of the score rise" },
        { symbol: "S", meaning: "test scores rose after the ban" },
      ],
      premises: ["B → S   (warrant: if B caused it, we'd see S)", "S   (grounds: S did happen)", "∴ B   (claim: B caused it)"],
      formula: "((B -> S) && S) -> B",
      patternName: "Affirming the Consequent — the same invalid skeleton as Semmelweis, used badly",
      explain: "Try B=false, S=true in the table below — not a tautology, exactly like Semmelweis's argument. The logic is equally invalid in both cases; the difference is entirely in what happened next. That's the actual lesson: spotting an invalid deductive skeleton doesn't tell you an argument is worthless, and spotting a valid one doesn't tell you it's good either. It tells you where to look next — at the premises, and at what alternatives were actually ruled out.",
    },
  },
];

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
