/* =============================================================================
   Mathematical Symbols Explorer
   History, overlapping meanings, and topic connections for 80+ symbols.
   ============================================================================= */
(function () {
  "use strict";

  const SYMBOLS = [
    // ── Arithmetic ──
    {
      glyph: "+", name: "Plus", cat: "arithmetic", latex: "+",
      history: "The + sign first appeared in print in Johannes Widmann's <em>Mercantile Arithmetic</em> (1489, Leipzig). Before that, Latin scribes wrote \"et\" (and); the + may be a contraction of the \"t\" in \"et\". Robert Recorde popularized it in English in <em>The Whetstone of Witte</em> (1557).",
      meanings: [
        { field: "Arithmetic", desc: "Addition of numbers: 3 + 5 = 8" },
        { field: "Set Theory", desc: "Disjoint union of sets: A + B" },
        { field: "Linear Algebra", desc: "Direct sum of subspaces: V = U + W" },
        { field: "Logic", desc: "Sometimes used for logical OR in circuit notation" },
        { field: "String/Concatenation", desc: "In programming and combinatorics, concatenation of sequences" },
      ],
      topics: ["Arithmetic", "Algebra", "Linear Algebra", "Set Theory"],
      overlap: "In modular arithmetic, + means addition mod n. In tropical mathematics, + means max. Context determines meaning.",
    },
    {
      glyph: "−", name: "Minus", cat: "arithmetic", latex: "-",
      history: "Also from Widmann (1489). Some historians believe the – sign derived from a tilde (~) used by merchants to mark tare weight on crates. It took over a century for + and – to become standard across Europe.",
      meanings: [
        { field: "Arithmetic", desc: "Subtraction: 8 − 3 = 5" },
        { field: "Set Theory", desc: "Set difference: A − B = A \\ B" },
        { field: "Negative numbers", desc: "Unary negation: −5" },
        { field: "Charge", desc: "In physics, negative charge" },
      ],
      topics: ["Arithmetic", "Set Theory", "Number Theory"],
      overlap: "The minus sign (−) is typographically distinct from the hyphen (-) and en-dash (–), though they are often confused.",
    },
    {
      glyph: "×", name: "Multiplication", cat: "arithmetic", latex: "\\times",
      history: "William Oughtred introduced × in <em>Clavis Mathematicae</em> (1631). Leibniz objected because it looked too much like the letter x, and preferred the dot (·) instead. Both notations survived.",
      meanings: [
        { field: "Arithmetic", desc: "Multiplication: 3 × 4 = 12" },
        { field: "Set Theory", desc: "Cartesian product: A × B" },
        { field: "Vector Calculus", desc: "Cross product: <strong>a</strong> × <strong>b</strong>" },
        { field: "Dimensions", desc: "Size notation: 3 × 5 matrix, 1920 × 1080 pixels" },
      ],
      topics: ["Arithmetic", "Linear Algebra", "Set Theory", "Vector Calculus"],
      overlap: "In physics, × is the cross product (a vector). In set theory, × is the Cartesian product. In arithmetic, it's scalar multiplication. Three completely different operations sharing one symbol.",
    },
    {
      glyph: "÷", name: "Division (Obelus)", cat: "arithmetic", latex: "\\div",
      history: "Johann Rahn introduced ÷ in <em>Teutsche Algebra</em> (1659). The symbol was originally an obelus (÷) used in ancient manuscripts to mark questionable passages. In many countries (Scandinavia, parts of Europe), ÷ is rarely used; the fraction bar or / is preferred. ISO 80000-2 recommends against ÷.",
      meanings: [
        { field: "Arithmetic", desc: "Division: 12 ÷ 4 = 3" },
        { field: "Scandinavian usage", desc: "Subtraction (historically in some Nordic countries!)" },
      ],
      topics: ["Arithmetic"],
      overlap: "This symbol is mostly Anglo-American. Mathematicians almost universally prefer the fraction bar (a/b or \\frac{a}{b}). In some Nordic countries, ÷ historically meant subtraction — a classic cross-cultural trap.",
    },
    {
      glyph: "=", name: "Equals", cat: "arithmetic", latex: "=",
      history: "Robert Recorde invented the = sign in <em>The Whetstone of Witte</em> (1557), writing: \"I will set as I do often in work use, a pair of parallels, or Gemowe [twin] lines of one length, thus: ====, because no two things can be more equal.\" Before this, mathematicians wrote \"is equal to\" in words.",
      meanings: [
        { field: "Arithmetic", desc: "Equality of values: 2 + 3 = 5" },
        { field: "Algebra", desc: "Equation to be solved: x² = 4" },
        { field: "Definition", desc: "Sometimes used for definitions (though := or ≡ is clearer)" },
        { field: "Programming", desc: "Assignment (single =) vs. equality test (==) — a major source of bugs" },
      ],
      topics: ["Arithmetic", "Algebra", "Logic", "Programming"],
      overlap: "One of the most overloaded symbols in existence. In math, = is symmetric and transitive. In programming, = is assignment (not symmetric). This distinction has caused billions of dollars in software bugs.",
    },
    {
      glyph: "≈", name: "Approximately Equal", cat: "relations", latex: "\\approx",
      history: "Alfred Greenhill introduced ≈ in 1892. Before this, ~ (tilde) was used for approximation (and still is in some contexts). The double-squiggle distinguishes it from the single tilde, which has other meanings.",
      meanings: [
        { field: "Numerical Analysis", desc: "Approximate equality: π ≈ 3.14159" },
        { field: "Asymptotic Analysis", desc: "Sometimes used loosely for asymptotic equivalence" },
      ],
      topics: ["Numerical Analysis", "Applied Mathematics"],
    },

    // ── Greek Letters ──
    {
      glyph: "π", name: "Pi", cat: "greek", latex: "\\pi",
      history: "William Jones first used π for the circle ratio in 1706, and Euler popularized it from 1736 onward. The choice of π comes from the Greek word <em>perimetros</em> (periphery/circumference). The value 3.14159... was computed to various precision by Archimedes, Zu Chongzhi, and Madhava of Sangamagrama centuries before it got its symbol.",
      meanings: [
        { field: "Geometry", desc: "Ratio of circumference to diameter: C = πd ≈ 3.14159..." },
        { field: "Number Theory", desc: "The prime-counting function: π(x) = number of primes ≤ x" },
        { field: "Algebra", desc: "Projection maps in category theory, homotopy groups π_n" },
        { field: "Statistics", desc: "Sometimes a probability distribution parameter" },
      ],
      topics: ["Geometry", "Number Theory", "Analysis", "Topology"],
      overlap: "π as 3.14159... and π(x) as the prime-counting function are completely unrelated uses of the same letter. In topology, π₁(X) is the fundamental group. Context is everything.",
    },
    {
      glyph: "Σ", name: "Sigma (uppercase)", cat: "greek", latex: "\\Sigma",
      history: "Euler introduced Σ for summation in the 1750s. The capital sigma was a natural choice: S for Sum, written in its Greek form. This convention is now universal.",
      meanings: [
        { field: "Analysis", desc: "Summation: Σᵢ₌₁ⁿ aᵢ = a₁ + a₂ + ⋯ + aₙ" },
        { field: "Linear Algebra", desc: "Covariance matrix in statistics" },
        { field: "Formal Languages", desc: "An alphabet (set of symbols) in automata theory" },
      ],
      topics: ["Analysis", "Statistics", "Computer Science", "Algebra"],
      overlap: "Σ for summation and Σ for covariance matrix are unrelated. In automata theory, Σ is an alphabet. The lowercase σ has yet more meanings (see below).",
    },
    {
      glyph: "σ", name: "Sigma (lowercase)", cat: "greek", latex: "\\sigma",
      history: "The lowercase sigma has been adopted across many fields. In statistics, Karl Pearson introduced σ for standard deviation around 1894.",
      meanings: [
        { field: "Statistics", desc: "Standard deviation: σ, or variance: σ²" },
        { field: "Number Theory", desc: "Divisor function: σ(n) = sum of divisors of n" },
        { field: "Group Theory", desc: "A permutation: σ ∈ Sₙ" },
        { field: "Mechanics", desc: "Stress tensor in engineering" },
        { field: "Topology", desc: "A simplex in simplicial complexes" },
      ],
      topics: ["Statistics", "Number Theory", "Algebra", "Physics", "Topology"],
      overlap: "Perhaps the most overloaded lowercase Greek letter. Standard deviation, divisor sum, permutation, stress, and simplex all use σ.",
    },
    {
      glyph: "ε", name: "Epsilon", cat: "greek", latex: "\\varepsilon",
      history: "Epsilon became the canonical symbol for \"arbitrarily small positive quantity\" through Cauchy and Weierstrass's rigorous analysis in the 19th century. The ε-δ definition of limits is the bedrock of real analysis.",
      meanings: [
        { field: "Analysis", desc: "Arbitrarily small quantity in ε-δ proofs: for all ε > 0..." },
        { field: "Computer Science", desc: "Empty string in formal languages: ε" },
        { field: "Physics", desc: "Permittivity of free space: ε₀" },
        { field: "Tensor Calculus", desc: "Levi-Civita symbol: εᵢⱼₖ" },
      ],
      topics: ["Analysis", "Computer Science", "Physics"],
    },
    {
      glyph: "δ", name: "Delta (lowercase)", cat: "greek", latex: "\\delta",
      history: "Cauchy and Weierstrass paired δ with ε in the rigorous definition of limits (1820s–1860s). Dirac introduced the delta function δ(x) in the 1930s for quantum mechanics, though mathematicians initially considered it illegitimate (it was later formalized via distribution theory by Laurent Schwartz, 1945).",
      meanings: [
        { field: "Analysis", desc: "Small change / tolerance in ε-δ proofs" },
        { field: "Kronecker delta", desc: "δᵢⱼ = 1 if i=j, 0 otherwise" },
        { field: "Dirac delta", desc: "δ(x): generalized function satisfying ∫δ(x)dx = 1" },
        { field: "Finite differences", desc: "Small increment: δx" },
      ],
      topics: ["Analysis", "Linear Algebra", "Quantum Mechanics", "Numerical Methods"],
      overlap: "The Kronecker delta δᵢⱼ is a perfectly ordinary function; the Dirac delta δ(x) is not a function at all (it's a distribution). Same symbol, fundamentally different mathematical objects.",
    },
    {
      glyph: "Δ", name: "Delta (uppercase)", cat: "greek", latex: "\\Delta",
      history: "Uppercase delta has been used for \"change\" or \"difference\" since at least the 18th century. The triangle shape naturally suggests change or difference.",
      meanings: [
        { field: "Calculus", desc: "Finite change: Δx = x₂ − x₁" },
        { field: "Algebra", desc: "Discriminant of a quadratic: Δ = b² − 4ac" },
        { field: "PDE", desc: "Laplacian operator: Δf = ∇²f" },
        { field: "Geometry", desc: "A triangle: △ABC" },
      ],
      topics: ["Calculus", "Algebra", "Differential Equations", "Geometry"],
    },
    {
      glyph: "α", name: "Alpha", cat: "greek", latex: "\\alpha",
      history: "As the first Greek letter, α is the go-to for the \"first\" variable, angle, or constant. Its use in mathematics spans millennia, from Diophantus to modern type theory.",
      meanings: [
        { field: "Geometry", desc: "An angle (along with β, γ)" },
        { field: "Statistics", desc: "Significance level (Type I error rate): α = 0.05" },
        { field: "Physics", desc: "Fine-structure constant: α ≈ 1/137" },
        { field: "Algebra", desc: "A root of a polynomial or a generic element" },
      ],
      topics: ["Geometry", "Statistics", "Physics", "Algebra"],
    },
    {
      glyph: "β", name: "Beta", cat: "greek", latex: "\\beta",
      history: "The second Greek letter, traditionally paired with α. The word \"alphabet\" itself comes from alpha + beta.",
      meanings: [
        { field: "Geometry", desc: "Second angle in a triangle" },
        { field: "Statistics", desc: "Type II error probability; regression coefficients" },
        { field: "Physics", desc: "Beta decay; v/c ratio in relativity" },
        { field: "Special Functions", desc: "Beta function: B(x,y) = ∫₀¹ tˣ⁻¹(1−t)ʸ⁻¹dt" },
      ],
      topics: ["Statistics", "Physics", "Analysis"],
    },
    {
      glyph: "γ", name: "Gamma (lowercase)", cat: "greek", latex: "\\gamma",
      history: "Euler introduced the Euler-Mascheroni constant γ ≈ 0.5772 in 1735. The Lorentz factor in special relativity also uses γ.",
      meanings: [
        { field: "Analysis", desc: "Euler-Mascheroni constant: γ ≈ 0.5772" },
        { field: "Relativity", desc: "Lorentz factor: γ = 1/√(1 − v²/c²)" },
        { field: "Geometry", desc: "Third angle in a triangle" },
        { field: "Curves", desc: "A parametric curve: γ(t)" },
      ],
      topics: ["Analysis", "Physics", "Geometry"],
    },
    {
      glyph: "λ", name: "Lambda", cat: "greek", latex: "\\lambda",
      history: "Church chose λ for his lambda calculus (1930s) somewhat arbitrarily — he needed a notation for function abstraction. In linear algebra, eigenvalues have been denoted λ since at least the early 20th century.",
      meanings: [
        { field: "Linear Algebra", desc: "Eigenvalue: Av = λv" },
        { field: "Computer Science", desc: "Lambda calculus, anonymous functions: λx.x+1" },
        { field: "Physics", desc: "Wavelength of light or other waves" },
        { field: "Probability", desc: "Rate parameter of Poisson/exponential distribution" },
      ],
      topics: ["Linear Algebra", "Computer Science", "Physics", "Probability"],
      overlap: "λ as eigenvalue, λ as wavelength, and λ as rate parameter are three unrelated uses in three different fields, all extremely common.",
    },
    {
      glyph: "θ", name: "Theta", cat: "greek", latex: "\\theta",
      history: "Theta has been the standard variable for angles since at least the 18th century. The big-Θ notation in computer science was introduced by Knuth (1976).",
      meanings: [
        { field: "Geometry/Trig", desc: "An angle: sin θ, cos θ" },
        { field: "Statistics", desc: "Parameter to be estimated: θ̂ (theta-hat)" },
        { field: "CS", desc: "Big-Theta: tight asymptotic bound Θ(n log n)" },
      ],
      topics: ["Trigonometry", "Statistics", "Computer Science"],
    },
    {
      glyph: "φ/ϕ", name: "Phi", cat: "greek", latex: "\\phi / \\varphi",
      history: "Mark Barr suggested φ for the golden ratio around 1909, from the first letter of Phidias, the Greek sculptor who allegedly used it in the Parthenon. Euler used φ for Euler's totient function.",
      meanings: [
        { field: "Number Theory", desc: "Euler's totient: φ(n) = count of integers ≤ n coprime to n" },
        { field: "Golden Ratio", desc: "φ = (1 + √5)/2 ≈ 1.618 (sometimes τ instead)" },
        { field: "Electromagnetism", desc: "Magnetic flux; electric potential" },
        { field: "Geometry", desc: "Azimuthal angle in spherical coordinates" },
      ],
      topics: ["Number Theory", "Geometry", "Physics", "Art & Architecture"],
      overlap: "φ(n) for Euler's totient and φ for the golden ratio are completely different. Some authors use τ for the golden ratio to avoid this clash.",
    },
    {
      glyph: "ω", name: "Omega (lowercase)", cat: "greek", latex: "\\omega",
      history: "As the last letter of the Greek alphabet, omega represents finality and completeness. Cantor chose ω for the first infinite ordinal (1883).",
      meanings: [
        { field: "Set Theory", desc: "First infinite ordinal: ω = {0, 1, 2, ...}" },
        { field: "Physics", desc: "Angular frequency: ω = 2πf" },
        { field: "Algebra", desc: "Primitive root of unity: ωⁿ = 1" },
        { field: "Differential Forms", desc: "A differential form: ω = f dx + g dy" },
      ],
      topics: ["Set Theory", "Physics", "Algebra", "Differential Geometry"],
    },
    {
      glyph: "μ", name: "Mu", cat: "greek", latex: "\\mu",
      history: "Mu is used across many sciences. In statistics, μ for the population mean became standard in the early 20th century.",
      meanings: [
        { field: "Statistics", desc: "Population mean: μ" },
        { field: "Physics", desc: "Coefficient of friction; magnetic permeability μ₀" },
        { field: "Measure Theory", desc: "A measure: μ(A) gives the \"size\" of set A" },
        { field: "SI Prefix", desc: "Micro-: μ = 10⁻⁶ (micrometer, microsecond)" },
      ],
      topics: ["Statistics", "Physics", "Measure Theory"],
    },
    {
      glyph: "τ", name: "Tau", cat: "greek", latex: "\\tau",
      history: "Some mathematicians (notably Michael Hartl, 2010) advocate τ = 2π ≈ 6.283 as more natural than π, since most formulas involve 2π. In physics, τ is the standard symbol for proper time and torque.",
      meanings: [
        { field: "Tau movement", desc: "τ = 2π ≈ 6.2832 (the \"true circle constant\")" },
        { field: "Physics", desc: "Torque; proper time in relativity; mean lifetime" },
        { field: "Number Theory", desc: "Ramanujan tau function: τ(n)" },
        { field: "Topology", desc: "A topology on a set" },
      ],
      topics: ["Geometry", "Physics", "Number Theory"],
    },

    // ── Set Theory ──
    {
      glyph: "∈", name: "Element of", cat: "sets", latex: "\\in",
      history: "Giuseppe Peano introduced ∈ in 1889, deriving it from the first letter of the Greek word ἐστί (esti, \"is\"). This tiny symbol encodes the most fundamental relationship in set theory: membership.",
      meanings: [
        { field: "Set Theory", desc: "Membership: x ∈ A means x is an element of A" },
        { field: "Logic", desc: "\"belongs to\" in predicate logic" },
      ],
      topics: ["Set Theory", "Logic", "Foundations"],
    },
    {
      glyph: "∅", name: "Empty Set", cat: "sets", latex: "\\emptyset",
      history: "André Weil (of the Bourbaki group) introduced ∅ in 1939, inspired by the Norwegian/Danish letter Ø. Some use {} instead. The empty set is the foundation of the set-theoretic construction of all numbers.",
      meanings: [
        { field: "Set Theory", desc: "The set with no elements: |∅| = 0" },
        { field: "Topology", desc: "∅ is always an open set (and a closed set)" },
      ],
      topics: ["Set Theory", "Topology", "Foundations"],
    },
    {
      glyph: "∪", name: "Union", cat: "sets", latex: "\\cup",
      history: "Peano introduced ∪ and ∩ in the 1880s–1890s. The \"cup\" shape of ∪ is a mnemonic: it \"collects\" elements from both sets, like a cup holding items.",
      meanings: [
        { field: "Set Theory", desc: "Union: A ∪ B = elements in A or B (or both)" },
        { field: "Measure Theory", desc: "σ-algebras are closed under countable unions" },
      ],
      topics: ["Set Theory", "Measure Theory", "Probability"],
    },
    {
      glyph: "∩", name: "Intersection", cat: "sets", latex: "\\cap",
      history: "The \"cap\" shape (∩) represents the overlap between two sets. Together with ∪, these form the basic algebra of sets.",
      meanings: [
        { field: "Set Theory", desc: "Intersection: A ∩ B = elements in both A and B" },
        { field: "Topology", desc: "Topologies are closed under finite intersections" },
      ],
      topics: ["Set Theory", "Topology", "Probability"],
    },
    {
      glyph: "⊂", name: "Subset", cat: "sets", latex: "\\subset",
      history: "Ernst Schröder introduced ⊂ for subset in 1890. There is ongoing confusion: some authors use ⊂ for proper subset (A ⊊ B), others use it for ⊆ (allowing equality). Modern best practice uses ⊆ and ⊊ to be unambiguous.",
      meanings: [
        { field: "Set Theory", desc: "Subset: A ⊂ B (every element of A is in B)" },
        { field: "Ambiguity!", desc: "Some authors: ⊂ means proper subset; others: ⊂ means ⊆" },
      ],
      topics: ["Set Theory", "Logic", "Topology"],
      overlap: "This is one of the most notorious ambiguities in mathematics. Always check whether an author's ⊂ means proper or improper subset.",
    },
    {
      glyph: "ℝ", name: "Real Numbers", cat: "sets", latex: "\\mathbb{R}",
      history: "The blackboard bold ℝ originated from the practice of writing a double-struck R on chalkboards to distinguish the set from a variable. It became standard in typography with Bourbaki in the mid-20th century.",
      meanings: [
        { field: "Analysis", desc: "The set of real numbers: ℝ = (−∞, ∞)" },
        { field: "Linear Algebra", desc: "ℝⁿ = n-dimensional real coordinate space" },
      ],
      topics: ["Analysis", "Algebra", "Geometry"],
    },
    {
      glyph: "ℕ ℤ ℚ ℂ", name: "Number Sets", cat: "sets", latex: "\\mathbb{N,Z,Q,C}",
      history: "ℕ (natural) from \"natural\"; ℤ from German <em>Zahlen</em> (numbers); ℚ from Italian <em>quoziente</em> (quotient); ℂ from \"complex.\" This notation was standardized by Bourbaki. Whether 0 ∈ ℕ remains a matter of convention (ISO says yes, many authors say no).",
      meanings: [
        { field: "ℕ", desc: "Natural numbers: {0,1,2,...} or {1,2,3,...} depending on convention" },
        { field: "ℤ", desc: "Integers: {...,−2,−1,0,1,2,...}" },
        { field: "ℚ", desc: "Rational numbers: p/q where p,q ∈ ℤ, q ≠ 0" },
        { field: "ℂ", desc: "Complex numbers: a + bi where i² = −1" },
      ],
      topics: ["Number Theory", "Algebra", "Analysis"],
      overlap: "Whether 0 ∈ ℕ is one of mathematics' oldest flame wars. French tradition (Bourbaki): yes. Many anglophone texts: no. Always check the author's convention.",
    },

    // ── Logic ──
    {
      glyph: "∧", name: "Logical AND", cat: "logic", latex: "\\land",
      history: "The wedge ∧ for conjunction was introduced by Heyting (1930) and adopted by Bourbaki. It mirrors the ∩ of set theory (A ∩ B relates to P ∧ Q via characteristic functions).",
      meanings: [
        { field: "Logic", desc: "Conjunction: P ∧ Q is true iff both are true" },
        { field: "Lattice Theory", desc: "Meet (greatest lower bound): a ∧ b" },
        { field: "Exterior Algebra", desc: "Wedge product: v ∧ w (a bivector)" },
      ],
      topics: ["Logic", "Algebra", "Differential Geometry"],
      overlap: "∧ in logic (AND) and ∧ in exterior algebra (wedge product) are entirely different operations. The caret ^ in programming is usually XOR, not AND!",
    },
    {
      glyph: "∨", name: "Logical OR", cat: "logic", latex: "\\lor",
      history: "The vee ∨ for disjunction was also standardized by Heyting and Bourbaki, mirroring ∪ for set union. The Latin word \"vel\" (or) may have influenced the choice of V-shape.",
      meanings: [
        { field: "Logic", desc: "Disjunction: P ∨ Q is true iff at least one is true" },
        { field: "Lattice Theory", desc: "Join (least upper bound): a ∨ b" },
      ],
      topics: ["Logic", "Algebra", "Order Theory"],
    },
    {
      glyph: "¬", name: "Negation", cat: "logic", latex: "\\neg",
      history: "The ¬ symbol was introduced by Heyting (1930). Other notations for negation include ~ (tilde), ! (in programming), and an overbar (P̄).",
      meanings: [
        { field: "Logic", desc: "Negation: ¬P is true iff P is false" },
      ],
      topics: ["Logic", "Boolean Algebra"],
    },
    {
      glyph: "→", name: "Implies / Arrow", cat: "logic", latex: "\\to / \\rightarrow",
      history: "The arrow for implication was used by Hilbert (1918) and became standard through Bourbaki. The single arrow → is one of the most overloaded symbols in mathematics.",
      meanings: [
        { field: "Logic", desc: "Material conditional: P → Q (if P then Q)" },
        { field: "Functions", desc: "Function mapping: f: A → B" },
        { field: "Limits", desc: "\"Approaches\": x → ∞" },
        { field: "Category Theory", desc: "Morphism between objects" },
        { field: "Chemistry", desc: "Reaction direction" },
      ],
      topics: ["Logic", "Analysis", "Algebra", "Category Theory"],
      overlap: "→ for implication, → for function mapping, and → for limits are three distinct uses that appear on the same page in many textbooks.",
    },
    {
      glyph: "∀", name: "For All", cat: "logic", latex: "\\forall",
      history: "Gerhard Gentzen introduced ∀ in 1935, inverting the letter A (for \"All\"). Together with ∃, these quantifiers transformed mathematical logic and became the language of rigorous mathematics.",
      meanings: [
        { field: "Logic", desc: "Universal quantifier: ∀x P(x) means \"for every x, P(x) holds\"" },
      ],
      topics: ["Logic", "Foundations", "Analysis"],
    },
    {
      glyph: "∃", name: "There Exists", cat: "logic", latex: "\\exists",
      history: "Charles Sanders Peirce first used a similar notation (1885), but the modern ∃ was standardized by Gentzen (1935), mirroring a reversed E (for \"Exists\").",
      meanings: [
        { field: "Logic", desc: "Existential quantifier: ∃x P(x) means \"there exists an x such that P(x)\"" },
        { field: "Variation", desc: "∃! means \"there exists exactly one\" (uniqueness)" },
      ],
      topics: ["Logic", "Foundations", "Analysis"],
    },
    {
      glyph: "⊢", name: "Turnstile", cat: "logic", latex: "\\vdash",
      history: "Frege introduced a precursor in his <em>Begriffsschrift</em> (1879). The modern ⊢ separating hypotheses from conclusions became standard in proof theory through Gentzen's sequent calculus (1935).",
      meanings: [
        { field: "Proof Theory", desc: "Provability: Γ ⊢ φ means φ is provable from Γ" },
        { field: "Type Theory", desc: "Typing judgment: Γ ⊢ e : τ" },
      ],
      topics: ["Logic", "Proof Theory", "Computer Science"],
    },
    {
      glyph: "⊨", name: "Double Turnstile", cat: "logic", latex: "\\models",
      history: "The semantic counterpart of ⊢. While ⊢ is syntactic (provable), ⊨ is semantic (true in all models). Gödel's completeness theorem (1929) shows these coincide for first-order logic.",
      meanings: [
        { field: "Model Theory", desc: "Semantic entailment: Γ ⊨ φ means φ is true in every model of Γ" },
        { field: "Satisfaction", desc: "M ⊨ φ means model M satisfies formula φ" },
      ],
      topics: ["Logic", "Model Theory"],
    },

    // ── Calculus ──
    {
      glyph: "∫", name: "Integral", cat: "calculus", latex: "\\int",
      history: "Leibniz introduced ∫ on October 29, 1675, as an elongated S for \"summa\" (sum). He chose the long s (ſ) specifically. Newton used a different notation (dots and bars), but Leibniz's ∫ won out universally — one of history's most successful notation choices.",
      meanings: [
        { field: "Calculus", desc: "Definite integral: ∫ₐᵇ f(x)dx = area under curve" },
        { field: "Measure Theory", desc: "Lebesgue integral: ∫ f dμ" },
        { field: "Contour Integration", desc: "∮ f(z)dz (closed contour in complex analysis)" },
        { field: "Path Integrals", desc: "Feynman path integral in quantum mechanics" },
      ],
      topics: ["Calculus", "Analysis", "Physics", "Measure Theory"],
      overlap: "Riemann integral, Lebesgue integral, Stieltjes integral, path integral, surface integral — all use ∫ but are defined quite differently.",
    },
    {
      glyph: "∂", name: "Partial Derivative", cat: "calculus", latex: "\\partial",
      history: "Legendre introduced the curly-d ∂ in 1786 for partial derivatives, but Jacobi popularized it from 1841. It distinguishes partial derivatives (∂f/∂x) from total derivatives (df/dx) — a critical distinction when functions depend on multiple variables.",
      meanings: [
        { field: "Calculus", desc: "Partial derivative: ∂f/∂x" },
        { field: "Topology", desc: "Boundary operator: ∂D = boundary of domain D" },
        { field: "Homological Algebra", desc: "Boundary map in chain complexes" },
      ],
      topics: ["Calculus", "Topology", "Algebraic Topology"],
      overlap: "∂ for partial derivative and ∂ for boundary are related by the generalized Stokes' theorem: ∫_D dω = ∫_{∂D} ω. This deep connection unifies calculus and topology.",
    },
    {
      glyph: "∇", name: "Nabla / Del", cat: "calculus", latex: "\\nabla",
      history: "Peter Guthrie Tait and William Rowan Hamilton introduced ∇ in the 1830s–1850s. The name \"nabla\" comes from a Greek harp of similar shape. Hamilton called it \"the vector operator.\" It encodes gradient, divergence, and curl in one symbol.",
      meanings: [
        { field: "Vector Calculus", desc: "Gradient: ∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z)" },
        { field: "Vector Calculus", desc: "Divergence: ∇·F; Curl: ∇×F" },
        { field: "PDE", desc: "Laplacian: ∇² = ∂²/∂x² + ∂²/∂y² + ..." },
        { field: "Connections", desc: "Covariant derivative in differential geometry: ∇_X Y" },
      ],
      topics: ["Vector Calculus", "PDE", "Differential Geometry", "Physics"],
    },
    {
      glyph: "d/dx", name: "Derivative", cat: "calculus", latex: "\\frac{d}{dx}",
      history: "Leibniz introduced dy/dx in 1675, treating dy and dx as infinitesimals. Newton used ẏ (dot notation). Lagrange used f′(x) (prime notation). All three survive: Leibniz in calculus, Newton in physics, Lagrange everywhere. The debate over which is \"best\" has lasted 350 years.",
      meanings: [
        { field: "Calculus (Leibniz)", desc: "dy/dx — suggests a ratio of infinitesimals" },
        { field: "Calculus (Lagrange)", desc: "f′(x) — compact, emphasizes the function" },
        { field: "Calculus (Newton)", desc: "ẏ — used in physics for time derivatives" },
        { field: "Euler", desc: "Df — operator notation, common in analysis" },
      ],
      topics: ["Calculus", "Analysis", "Physics"],
      overlap: "Four different notations for the same concept. Each has advantages: Leibniz's is best for chain rule (dy/dx = dy/du · du/dx), Newton's for time derivatives (ẍ for acceleration), Lagrange's for brevity.",
    },
    {
      glyph: "lim", name: "Limit", cat: "calculus", latex: "\\lim",
      history: "The formal concept of limit was developed by Cauchy (1821) and rigorously defined by Weierstrass with the ε-δ formulation. \"lim\" as notation became standard through Weierstrass's lectures. Before this, Newton spoke of \"ultimate ratios\" and Leibniz of infinitesimals.",
      meanings: [
        { field: "Analysis", desc: "lim_{x→a} f(x) = L, the value f approaches as x approaches a" },
        { field: "Category Theory", desc: "Limit of a diagram (projective limit)" },
      ],
      topics: ["Analysis", "Calculus", "Category Theory"],
    },
    {
      glyph: "∞", name: "Infinity", cat: "calculus", latex: "\\infty",
      history: "John Wallis introduced ∞ in <em>De Sectionibus Conicis</em> (1655). The origin is debated: possibly from the Roman numeral for 1000 (CIƆ), or a variant of the last Greek letter ω, or simply an evocative curve with no endpoint. Cantor later showed there are different <em>sizes</em> of infinity.",
      meanings: [
        { field: "Calculus", desc: "Unbounded growth: lim_{x→∞}, ∫₁^∞" },
        { field: "Set Theory", desc: "Infinite cardinalities: ℵ₀ (countable), 2^ℵ₀ (continuum)" },
        { field: "Projective Geometry", desc: "Point at infinity" },
        { field: "Topology", desc: "One-point compactification: ℝ ∪ {∞}" },
      ],
      topics: ["Analysis", "Set Theory", "Topology", "Geometry"],
      overlap: "∞ in calculus is a shorthand, not a number. In set theory, infinite cardinals are precise objects. In projective geometry, the \"point at infinity\" is a real point on the projective line.",
    },

    // ── Algebra ──
    {
      glyph: "√", name: "Radical / Square Root", cat: "algebra", latex: "\\sqrt{}",
      history: "Christoph Rudolff introduced √ in <em>Coss</em> (1525). It may derive from a stylized lowercase r (for \"radix\", Latin for root). The vinculum (horizontal bar) was added later by Descartes. Before this, scribes wrote \"R\" or \"Rx\" for root.",
      meanings: [
        { field: "Arithmetic", desc: "Square root: √9 = 3" },
        { field: "Algebra", desc: "n-th root: ∛, ∜, or ⁿ√x" },
        { field: "Radical Theory", desc: "Radical of an ideal in ring theory" },
      ],
      topics: ["Algebra", "Arithmetic", "Number Theory"],
    },
    {
      glyph: "∑", name: "Summation", cat: "algebra", latex: "\\sum",
      history: "Euler standardized ∑ for summation. See also Σ (uppercase sigma). The distinction: Σ is the Greek letter; ∑ is the mathematical operator (typographically larger with limits).",
      meanings: [
        { field: "Analysis", desc: "Sum: ∑ᵢ₌₁ⁿ aᵢ" },
        { field: "Einstein Convention", desc: "In tensor notation, repeated indices imply summation (no ∑ written)" },
      ],
      topics: ["Analysis", "Linear Algebra", "Physics"],
    },
    {
      glyph: "∏", name: "Product", cat: "algebra", latex: "\\prod",
      history: "The capital pi (Π) for products mirrors Σ for sums. The convention was established in the 18th–19th century.",
      meanings: [
        { field: "Algebra", desc: "Product: ∏ᵢ₌₁ⁿ aᵢ = a₁·a₂·⋯·aₙ" },
        { field: "Category Theory", desc: "Categorical product (generalizes Cartesian product)" },
        { field: "Topology", desc: "Product topology on ∏ Xᵢ" },
      ],
      topics: ["Algebra", "Category Theory", "Topology"],
    },
    {
      glyph: "!", name: "Factorial / Not", cat: "algebra", latex: "n!",
      history: "Christian Kramp introduced n! for factorial in 1808, choosing ! for its visual punch. Before this, \"1·2·3·...·n\" was written out. In programming, ! became logical NOT (C, 1972).",
      meanings: [
        { field: "Combinatorics", desc: "Factorial: 5! = 120" },
        { field: "Logic", desc: "Uniqueness quantifier: ∃!x means exactly one x" },
        { field: "Programming", desc: "Logical NOT: !true = false" },
        { field: "Topology", desc: "Shriek map (lower shriek f_!, upper shriek f^!)" },
      ],
      topics: ["Combinatorics", "Logic", "Programming", "Algebraic Geometry"],
      overlap: "In mathematics, ! means factorial. In programming, ! means NOT. In logic, ∃! means unique existence. In algebraic geometry, shriek maps use !. Four unrelated meanings.",
    },
    {
      glyph: "⊗", name: "Tensor Product", cat: "algebra", latex: "\\otimes",
      history: "The circled times ⊗ became standard for tensor products in the mid-20th century through the influence of Bourbaki and Grothendieck. It visually suggests a \"multiplication inside a circle\" — a product in a new, more abstract sense.",
      meanings: [
        { field: "Linear Algebra", desc: "Tensor product: V ⊗ W" },
        { field: "Quantum Computing", desc: "Tensor product of quantum states: |ψ⟩ ⊗ |φ⟩" },
        { field: "Logic", desc: "Multiplicative conjunction in linear logic" },
      ],
      topics: ["Algebra", "Quantum Mechanics", "Computer Science"],
    },
    {
      glyph: "⊕", name: "Direct Sum / XOR", cat: "algebra", latex: "\\oplus",
      history: "The circled plus ⊕ is used for direct sums in algebra and for XOR in logic and cryptography. The visual of \"addition inside a circle\" suggests a new kind of addition.",
      meanings: [
        { field: "Linear Algebra", desc: "Direct sum: V ⊕ W (V and W intersect trivially)" },
        { field: "Logic", desc: "Exclusive OR (XOR): 1 ⊕ 1 = 0" },
        { field: "Ring Theory", desc: "Addition in a ring presented as direct sum" },
      ],
      topics: ["Algebra", "Logic", "Cryptography"],
    },

    // ── Relations ──
    {
      glyph: "≡", name: "Identically Equal / Congruent", cat: "relations", latex: "\\equiv",
      history: "Gauss introduced ≡ for modular congruence in <em>Disquisitiones Arithmeticae</em> (1801): a ≡ b (mod n). It's also used for identities and definitions.",
      meanings: [
        { field: "Number Theory", desc: "Congruence: 17 ≡ 2 (mod 5)" },
        { field: "Logic", desc: "Logical equivalence: P ≡ Q (same truth table)" },
        { field: "Analysis", desc: "Identically equal: f(x) ≡ 0 (zero for ALL x, not just some)" },
        { field: "Definitions", desc: "Sometimes used for definitions: f(x) ≡ x² + 1" },
      ],
      topics: ["Number Theory", "Logic", "Analysis"],
      overlap: "≡ for modular arithmetic, ≡ for logical equivalence, and ≡ for identity are three common meanings. In programming, === is strict equality.",
    },
    {
      glyph: "∝", name: "Proportional to", cat: "relations", latex: "\\propto",
      history: "The ∝ symbol was introduced by William Emerson in 1768. It's a stylized variant of the Greek letter alpha (α), chosen because it was the first letter of the word \"analogia\" (proportion).",
      meanings: [
        { field: "Physics", desc: "Proportionality: F ∝ ma, y ∝ 1/x" },
        { field: "Statistics", desc: "In Bayesian inference: posterior ∝ likelihood × prior" },
      ],
      topics: ["Physics", "Statistics"],
    },
    {
      glyph: "≤ ≥", name: "Less/Greater or Equal", cat: "relations", latex: "\\leq, \\geq",
      history: "Pierre Bouguer introduced ≤ and ≥ in 1734. Before this, Thomas Harriot had introduced < and > in 1631 (published posthumously). The added line beneath < and > neatly encodes \"or equal to.\"",
      meanings: [
        { field: "Order Theory", desc: "Partial and total order: a ≤ b" },
        { field: "Analysis", desc: "Inequalities in proofs" },
        { field: "Optimization", desc: "Constraints: f(x) ≤ c" },
      ],
      topics: ["Algebra", "Analysis", "Optimization"],
    },
    {
      glyph: "≪ ≫", name: "Much Less/Greater Than", cat: "relations", latex: "\\ll, \\gg",
      history: "These are common in physics and asymptotic analysis to indicate that one quantity dominates another (without specifying exactly how much). There is no universally agreed-upon formal definition.",
      meanings: [
        { field: "Physics", desc: "Dominant scaling: m ≪ M means m is negligible compared to M" },
        { field: "Number Theory", desc: "Vinogradov notation: f ≪ g means f = O(g)" },
      ],
      topics: ["Physics", "Analysis", "Number Theory"],
    },
    {
      glyph: "~", name: "Tilde", cat: "relations", latex: "\\sim",
      history: "The tilde ~ has an extraordinary range of meanings. In mathematics, it was used for \"approximately\" before ≈ existed. Statisticians use it for \"distributed as.\" Topologists use it for equivalence relations.",
      meanings: [
        { field: "Approximation", desc: "Approximately equal: π ~ 3.14" },
        { field: "Asymptotic", desc: "Asymptotic equivalence: f ~ g means f/g → 1" },
        { field: "Statistics", desc: "\"Distributed as\": X ~ N(0,1)" },
        { field: "Equivalence", desc: "Equivalence relation: a ~ b" },
        { field: "Complement", desc: "Set complement in some notations: ~A or Ã" },
      ],
      topics: ["Analysis", "Statistics", "Topology", "Logic"],
      overlap: "Possibly the most overloaded symbol in mathematics. Approximation, asymptotic equivalence, probability distribution, equivalence relation, and complement — all with ~.",
    },
    {
      glyph: "|", name: "Vertical Bar", cat: "relations", latex: "|",
      history: "The vertical bar has accumulated many meanings over centuries. It's used for absolute value, divisibility, conditional probability, and set-builder notation — often in the same course.",
      meanings: [
        { field: "Analysis", desc: "Absolute value: |x|; norm: ||v||" },
        { field: "Number Theory", desc: "Divisibility: a | b means a divides b" },
        { field: "Probability", desc: "Conditional: P(A|B) = probability of A given B" },
        { field: "Set Theory", desc: "Set-builder: {x | x > 0} (alternatively : )" },
        { field: "Cardinality", desc: "|S| = number of elements in S" },
      ],
      topics: ["Analysis", "Number Theory", "Probability", "Set Theory"],
      overlap: "The vertical bar | may be the most context-dependent symbol in all of mathematics. In |x|, it's absolute value. In a|b, it's divisibility. In P(A|B), it's conditioning. Students beware!",
    },

    // ── Geometry ──
    {
      glyph: "∠", name: "Angle", cat: "geometry", latex: "\\angle",
      history: "The angle symbol ∠ has been used since at least the 18th century. Its shape mimics the vertex and two rays of an angle. Euclid described angles without a special symbol, using words and diagrams.",
      meanings: [
        { field: "Geometry", desc: "An angle: ∠ABC" },
        { field: "Complex Analysis", desc: "Argument of a complex number: arg(z) = ∠z" },
      ],
      topics: ["Geometry", "Trigonometry", "Complex Analysis"],
    },
    {
      glyph: "∥", name: "Parallel", cat: "geometry", latex: "\\parallel",
      history: "The parallel sign ∥ was introduced in the 17th century, naturally representing two lines that never meet. Euclid's fifth postulate (the Parallel Postulate) was the most debated axiom in history, eventually leading to the discovery of non-Euclidean geometries.",
      meanings: [
        { field: "Geometry", desc: "Parallel lines: ℓ₁ ∥ ℓ₂" },
        { field: "Linear Algebra", desc: "Parallel vectors; norm in some notations" },
        { field: "Computing", desc: "Parallel execution (||) in programming" },
      ],
      topics: ["Geometry", "Linear Algebra"],
    },
    {
      glyph: "⊥", name: "Perpendicular / Bottom", cat: "geometry", latex: "\\perp",
      history: "The ⊥ symbol dates to the 17th century for perpendicularity. In logic, it was later adopted to mean \"false\" or \"contradiction\" (bottom element of a lattice).",
      meanings: [
        { field: "Geometry", desc: "Perpendicular: ℓ₁ ⊥ ℓ₂" },
        { field: "Logic", desc: "Falsum / bottom: ⊥ (always false)" },
        { field: "Linear Algebra", desc: "Orthogonal complement: V⊥" },
        { field: "Type Theory", desc: "Empty type (no values)" },
      ],
      topics: ["Geometry", "Logic", "Linear Algebra"],
      overlap: "In geometry, ⊥ means perpendicular. In logic, ⊥ means false/contradiction. In linear algebra, V⊥ is the orthogonal complement. Three related but distinct ideas.",
    },
    {
      glyph: "≅", name: "Isomorphic / Congruent", cat: "geometry", latex: "\\cong",
      history: "Used for geometric congruence (same shape and size) and algebraic isomorphism (structure-preserving bijection). The symbol combines = and ~ to suggest \"equal in structure.\"",
      meanings: [
        { field: "Geometry", desc: "Congruent: △ABC ≅ △DEF (same shape and size)" },
        { field: "Algebra", desc: "Isomorphic: G ≅ H (groups with identical structure)" },
      ],
      topics: ["Geometry", "Algebra", "Topology"],
    },
    {
      glyph: "∼", name: "Similar", cat: "geometry", latex: "\\sim",
      history: "For geometric similarity (same shape, possibly different size), ~ has been used since at least the 18th century. Note the overlapping usage with the tilde for equivalence relations and approximation.",
      meanings: [
        { field: "Geometry", desc: "Similar: △ABC ~ △DEF (same shape, possibly different size)" },
        { field: "See also", desc: "All other meanings of ~ (tilde) above" },
      ],
      topics: ["Geometry", "Analysis"],
    },

    // ── More ──
    {
      glyph: "ℵ", name: "Aleph", cat: "sets", latex: "\\aleph",
      history: "Georg Cantor introduced ℵ (the first Hebrew letter) for infinite cardinal numbers in 1893. ℵ₀ (aleph-null) is the cardinality of the natural numbers — the smallest infinity. Whether ℵ₁ = 2^ℵ₀ (the Continuum Hypothesis) was shown to be independent of standard set theory by Gödel (1940) and Cohen (1963).",
      meanings: [
        { field: "Set Theory", desc: "Infinite cardinals: ℵ₀ (countable), ℵ₁, ℵ₂, ..." },
      ],
      topics: ["Set Theory", "Foundations", "Logic"],
    },
    {
      glyph: "⟨ ⟩", name: "Angle Brackets / Bra-ket", cat: "algebra", latex: "\\langle \\rangle",
      history: "Dirac introduced bra-ket notation ⟨φ|ψ⟩ for quantum mechanics in 1939. The same brackets are used for inner products in linear algebra, generated groups in algebra, and expected values in statistics.",
      meanings: [
        { field: "Quantum Mechanics", desc: "Bra-ket: ⟨φ|ψ⟩ = inner product of states" },
        { field: "Linear Algebra", desc: "Inner product: ⟨u, v⟩" },
        { field: "Group Theory", desc: "Generated group: ⟨a, b⟩ = group generated by a and b" },
        { field: "Statistics", desc: "Expected value: ⟨X⟩ = E[X]" },
      ],
      topics: ["Quantum Mechanics", "Linear Algebra", "Algebra", "Statistics"],
      overlap: "⟨ ⟩ for inner products, generated groups, and expected values — three different uses of the same brackets, all common in a physics or math course.",
    },
    {
      glyph: ":=", name: "Defined As", cat: "relations", latex: ":= \\text{ or } \\triangleq",
      history: "The := notation for definitions comes from programming (Pascal, 1970s) and was adopted by mathematicians to disambiguate definitions from equations. Some use ≜ or ≡ instead.",
      meanings: [
        { field: "Definitions", desc: "f(x) := x² + 1 means \"f(x) is defined to be x² + 1\"" },
        { field: "Programming", desc: "Assignment operator in Pascal, Go, and others" },
      ],
      topics: ["Foundations", "Programming"],
    },
    {
      glyph: "∘", name: "Composition", cat: "algebra", latex: "\\circ",
      history: "The small circle ∘ for function composition has been standard since the early 20th century: (f ∘ g)(x) = f(g(x)). It's also used for the degree symbol and the Hadamard product.",
      meanings: [
        { field: "Functions", desc: "Composition: (f ∘ g)(x) = f(g(x))" },
        { field: "Category Theory", desc: "Morphism composition: g ∘ f" },
        { field: "Matrices", desc: "Hadamard (elementwise) product in some notations" },
      ],
      topics: ["Analysis", "Algebra", "Category Theory"],
    },
    {
      glyph: "e", name: "Euler's Number", cat: "calculus", latex: "e",
      history: "Euler first used e in a 1728 letter, and published it in <em>Mechanica</em> (1736). It's unknown whether he chose e for \"exponential\" or for his own name — he never explained. The constant e ≈ 2.71828 is the base of the natural logarithm and appears throughout mathematics, from compound interest to the normal distribution.",
      meanings: [
        { field: "Analysis", desc: "Euler's number: e ≈ 2.71828, defined as lim_{n→∞} (1+1/n)ⁿ" },
        { field: "Identity element", desc: "In group theory, e often denotes the identity element" },
        { field: "Physics", desc: "Elementary charge: e ≈ 1.602 × 10⁻¹⁹ C" },
      ],
      topics: ["Analysis", "Algebra", "Physics", "Probability"],
    },
    {
      glyph: "i", name: "Imaginary Unit", cat: "algebra", latex: "i",
      history: "Euler introduced i = √(−1) in 1777. Gauss championed its use and helped complex numbers gain acceptance. Engineers use j instead (since i means current in electrical engineering). The quaternions extend this: i² = j² = k² = ijk = −1.",
      meanings: [
        { field: "Complex Numbers", desc: "i = √(−1), so i² = −1" },
        { field: "Indexing", desc: "A common index variable: aᵢ" },
        { field: "Engineering", desc: "j = √(−1) in electrical engineering (i = current)" },
      ],
      topics: ["Algebra", "Complex Analysis", "Physics"],
      overlap: "i for the imaginary unit and i as an index variable coexist in every complex analysis textbook. Electrical engineers use j to avoid clash with current i.",
    },
  ];

  // ── DOM refs ──
  const searchInput = document.getElementById("sym-search");
  const catBtns = document.querySelectorAll(".sym-cat-btn");
  const grid = document.getElementById("sym-grid");
  const detail = document.getElementById("sym-detail");

  let activeCat = "all";
  let activeIdx = -1;

  function renderGrid(filter) {
    const q = (filter || "").toLowerCase();
    grid.innerHTML = "";
    detail.classList.add("hidden");
    activeIdx = -1;

    SYMBOLS.forEach((s, idx) => {
      const catMatch = activeCat === "all" || s.cat === activeCat;
      const textMatch = !q ||
        s.glyph.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.cat.toLowerCase().includes(q) ||
        (s.topics || []).some((t) => t.toLowerCase().includes(q)) ||
        (s.meanings || []).some((m) => m.field.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)) ||
        (s.history || "").toLowerCase().includes(q);
      if (!catMatch || !textMatch) return;

      const card = document.createElement("div");
      card.className = "sym-card";
      card.dataset.idx = idx;
      card.innerHTML = `<span class="sym-glyph">${s.glyph}</span><span class="sym-name">${s.name}</span>`;
      card.addEventListener("click", () => showDetail(idx));
      grid.appendChild(card);
    });

    if (!grid.children.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#78716c;padding:20px;">No symbols match your search.</div>';
    }
  }

  function showDetail(idx) {
    const s = SYMBOLS[idx];
    activeIdx = idx;

    grid.querySelectorAll(".sym-card").forEach((c) =>
      c.classList.toggle("active", parseInt(c.dataset.idx) === idx)
    );

    let html = `<div class="sym-detail-glyph">${s.glyph}</div>`;
    html += `<h4>${s.name}</h4>`;
    if (s.latex) html += `<div style="font-size:12px;color:#78716c;font-family:monospace;margin-bottom:6px;">LaTeX: <code>${s.latex}</code></div>`;

    // History
    if (s.history) {
      html += `<div class="sym-section"><h5>History</h5><div class="sym-history-box">${s.history}</div></div>`;
    }

    // Meanings
    if (s.meanings && s.meanings.length) {
      html += `<div class="sym-section"><h5>Meanings &amp; Usage</h5><ul class="sym-meaning-list">`;
      for (const m of s.meanings) {
        html += `<li><strong>${m.field}:</strong> ${m.desc}</li>`;
      }
      html += `</ul></div>`;
    }

    // Overlapping / ambiguity
    if (s.overlap) {
      html += `<div class="sym-section"><h5>Overlapping Meanings &amp; Pitfalls</h5><div class="sym-overlap-box">${s.overlap}</div></div>`;
    }

    // Topics
    if (s.topics && s.topics.length) {
      html += `<div class="sym-section"><h5>Topics Where Used</h5><div class="sym-topic-tags">`;
      for (const t of s.topics) {
        html += `<span class="sym-topic-tag">${t}</span>`;
      }
      html += `</div></div>`;
    }

    detail.innerHTML = html;
    detail.classList.remove("hidden");
    detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ── Event listeners ──
  catBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      catBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCat = btn.dataset.cat;
      renderGrid(searchInput.value);
    });
  });

  searchInput.addEventListener("input", () => renderGrid(searchInput.value));

  renderGrid("");
})();
