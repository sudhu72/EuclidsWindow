// Cogito Gallery manifest — 153 self-contained interactive visualizations
// adapted from the Feynman-method "cogito" tutorials, served from
// /visualizations/cogito/.
//
// THIS IS THE SOURCE OF TRUTH for the gallery. To add a visualization after a
// cogito sync: copy the HTML into backend/static/visualizations/cogito/, add an
// entry here, add a concept to backend/data/cogito_concepts.json, re-run
// scripts/seed_cogito_library.py, and bump the counts in README.md.

export interface GalleryItem {
  /** Filename under /visualizations/cogito/ */
  file: string;
  title: string;
  /** One-line description shown on the card. */
  one: string;
  /** Question sent to the tutor by "Explore in Learn". */
  prompt: string;
}

export interface GalleryCategory {
  id: string;
  title: string;
  blurb: string;
  items: GalleryItem[];
}

export const GALLERY_BASE = "/visualizations/cogito/";

export const GALLERY: GalleryCategory[] = [
  {
    "id": "math",
    "title": "Mathematics",
    "blurb": "Notation, transformations, structure, chance, and number theory — the ideas behind the symbols.",
    "items": [
      {
        "file": "elementary_math_visualizer.html",
        "title": "The Toolkit, Made Visible",
        "one": "Order of operations, sign rules, fractions, exponent laws, and logarithms — the moves everything else assumes.",
        "prompt": "Explain the elementary toolkit the rest of mathematics assumes: why the order of operations is a convention rather than a law, why a negative times a negative is positive, how fractions really work, the exponent laws, and what a logarithm actually asks."
      },
      {
        "file": "algebra_visualizer.html",
        "title": "Restoring the Balance",
        "one": "Tip a balance scale, expand the distributive property, complete the square, and feed a function machine.",
        "prompt": "Explain algebra from first principles: an equation as a balance you keep level, what the distributive property really says, why completing the square works, and what a function machine is doing."
      },
      {
        "file": "geometry_visualizer.html",
        "title": "Shapes, Rearranged",
        "one": "Prove the angle sum by tearing corners, rearrange Pythagoras, unroll a circle, and scale a cube.",
        "prompt": "Explain geometry through rearrangement: why a triangle's angles sum to 180 degrees, a visual proof of the Pythagorean theorem, why a circle's area is pi r squared when you unroll it, and why area and volume scale differently."
      },
      {
        "file": "trigonometry_visualizer.html",
        "title": "Turning Angles Into Numbers",
        "one": "Right-triangle ratios become the unit circle, radians, polar coordinates, and the familiar waves.",
        "prompt": "Explain trigonometry from first principles: how right-triangle ratios become the unit circle, why radians are the natural angle measure, how polar and Cartesian coordinates relate, and why sine and cosine draw waves."
      },
      {
        "file": "complex_numbers_visualizer.html",
        "title": "The Missing Direction",
        "one": "The number line gains a second axis; multiplication turns out to be rotate-and-scale.",
        "prompt": "Explain complex numbers from first principles: why we needed a direction off the number line, why multiplying by i is a 90-degree rotation, how Bombelli's cubic forced the issue, and what the roots of unity are."
      },
      {
        "file": "sequences_series_visualizer.html",
        "title": "Running Totals, Made Visible",
        "one": "Zeno's halving series converges, the harmonic series doesn't, and Taylor coefficients build themselves.",
        "prompt": "Explain sequences and series: what convergence means, why Zeno's geometric series sums to a finite number while the harmonic series diverges, and how a power series builds up a Taylor approximation."
      },
      {
        "file": "calculus_visualizer.html",
        "title": "Zoom, Accumulate, Approximate",
        "one": "Zoom until a curve looks straight, watch differentiation and integration undo each other, then stack a Taylor tower.",
        "prompt": "Explain calculus from first principles: the derivative as zooming in until a curve looks straight, the integral as accumulation, why the fundamental theorem makes them inverses, and how Taylor series approximate a function."
      },
      {
        "file": "probability_visualizer.html",
        "title": "Multiply Down, Add Across",
        "one": "Walk an AND/OR tree, grade predictions with cross-entropy, and watch the law of large numbers bite.",
        "prompt": "Explain probability from first principles: why you multiply along a branch and add across branches, what cross-entropy measures about a prediction, and what the law of large numbers actually guarantees."
      },
      {
        "file": "statistics_visualizer.html",
        "title": "Reasoning Backward From Data",
        "one": "A Galton board builds the bell curve, then sampling, hypothesis tests, and Simpson's paradox.",
        "prompt": "Explain statistics as reasoning backward from data: why the Galton board produces a normal distribution, what a sampling distribution is, what a hypothesis test really claims, and how Simpson's paradox reverses a conclusion."
      },
      {
        "file": "logic_visualizer.html",
        "title": "What Must Be True",
        "one": "Build truth tables row by row and check whether an argument is actually valid.",
        "prompt": "Explain formal logic: how truth tables define the connectives, the difference between an argument being valid and its conclusion being true, and how to check validity mechanically."
      },
      {
        "file": "markov_chains_visualizer.html",
        "title": "Markov Chains & Probability Trees",
        "one": "Drag a medical test's prevalence and accuracy, then watch a wandering token settle into its stationary distribution.",
        "prompt": "Explain probability trees and Markov chains from first principles: conditional probability and the base-rate surprise in medical tests, the memoryless property, transition matrices, and why the chain settles into a stationary distribution."
      },
      {
        "file": "euler_identity_visualizer.html",
        "title": "Our Jewel — Euler's Identity",
        "one": "Watch e^{iπ} + 1 = 0 assemble on the unit circle, one motion at a time.",
        "prompt": "Explain Euler's identity e^{i\\pi} + 1 = 0 from first principles — why does it connect e, i, pi, 1, and 0?"
      },
      {
        "file": "language_visualizer.html",
        "title": "The Second Language of Math",
        "one": "Read mathematical notation as a language — quantifiers, sets, and sums, interactively.",
        "prompt": "Teach me to read mathematical notation as a language: quantifiers, set-builder notation, and summation."
      },
      {
        "file": "normalization_visualizer.html",
        "title": "Five Lenses on Normalization",
        "one": "See normalization five ways — probability, min-max, z-score, unit vectors, and softmax.",
        "prompt": "Explain the different meanings of 'normalization' in math and ML: probability, min-max, z-score, unit vectors, softmax."
      },
      {
        "file": "number_theory_visualizer.html",
        "title": "The Clock and the Atoms",
        "one": "Modular arithmetic as a clock, and primes as the atoms every integer factors into.",
        "prompt": "Explain the foundations of number theory: modular arithmetic (clock arithmetic) and prime factorization."
      },
      {
        "file": "three_motions_visualizer.html",
        "title": "Three Motions — Transform, Zoom, Flow",
        "one": "Linear transforms, derivatives as local zoom, and differential equations as flow.",
        "prompt": "Explain the connection between linear transformations, derivatives (local zoom), and differential equations (flow)."
      },
      {
        "file": "three_structures_visualizer.html",
        "title": "Three Structures — Counting, Symmetry, Shape",
        "one": "Combinatorics, group theory, and topology as three ways to see structure.",
        "prompt": "Explain how combinatorics (counting), group theory (symmetry), and topology (shape) each describe structure."
      },
      {
        "file": "symmetry_invariance_visualizer.html",
        "title": "Symmetry & Invariance",
        "one": "Tile a mutilated chessboard, sweep equal areas in an orbit, and roll a ball off the Mexican hat.",
        "prompt": "Explain symmetry and invariance as the master concept: how an invariant like parity proves the mutilated chessboard cannot be tiled, why Noether's theorem ties every conservation law to a symmetry, and what spontaneous symmetry breaking means."
      },
      {
        "file": "abstract_algebra_and_real_analysis_visualizer.html",
        "title": "The Tower and the Gap — Abstract Algebra & Real Analysis",
        "one": "Groups, rings, and fields build up structure from an operation and its rules; real analysis asks what happens in the gaps between rational numbers.",
        "prompt": "Explain abstract algebra (groups, rings, fields) and real analysis (limits, continuity, completeness) from first principles: what structure survives when you strip a number system down to just its operations, and what it means for the real numbers to have no gaps."
      },
      {
        "file": "continuity_and_extrema_visualizer.html",
        "title": "Continuity and Extrema — Where Functions Behave, and Where They Peak",
        "one": "What it actually means for a function to have no jumps, and why every continuous function on a closed interval must hit a highest and lowest point.",
        "prompt": "Explain continuity (the epsilon-delta idea, intuitively) and the extreme value theorem: why a continuous function on a closed interval is guaranteed to reach a maximum and minimum."
      },
      {
        "file": "eigenvalues_and_eigenvectors_visualizer.html",
        "title": "Eigenvalues and Eigenvectors — The Directions a Transformation Can't Rotate Away From",
        "one": "Most vectors get pushed off their line by a transformation; eigenvectors are the special directions that only get stretched.",
        "prompt": "Explain eigenvalues and eigenvectors from first principles: what makes a direction special enough that a linear transformation only scales it instead of rotating it, and why that matters."
      },
      {
        "file": "set_theory_visualizer.html",
        "title": "Collections, Counted Two Ways — Set Theory",
        "one": "Union, intersection, and subset aren't just Venn-diagram shading — they're the grammar every other branch of math quietly assumes.",
        "prompt": "Explain set theory from first principles: what a set actually is, what union/intersection/subset mean, why the empty set matters, and how these few rules end up underneath the rest of mathematics."
      },
      {
        "file": "jacobian_and_svd_visualizer.html",
        "title": "Rotate, Stretch, Rotate — Jacobians & SVD",
        "one": "Every matrix, however complicated, is secretly just a rotation, a stretch along perpendicular axes, and another rotation.",
        "prompt": "Explain the Jacobian matrix and singular value decomposition from first principles: what a Jacobian captures about a transformation locally, and why SVD says any matrix decomposes into rotate-stretch-rotate."
      },
      {
        "file": "graph_theory_visualizer.html",
        "title": "Graph Theory, Made Visible",
        "one": "Dots and the lines between them turn out to be enough machinery to describe road maps, social networks, and the Königsberg bridge problem alike.",
        "prompt": "Explain graph theory from first principles: what a graph (vertices and edges) actually represents, how the Königsberg bridge problem started the field, and what a spanning tree or shortest path means."
      },
      {
        "file": "compression_and_hashing_visualizer.html",
        "title": "Compression & Hashing, Made Visible",
        "one": "Huffman coding squeezes out redundancy; a hash function throws away almost everything on purpose — two very different ways of turning data into fewer bits.",
        "prompt": "Explain data compression and hashing from first principles: how Huffman coding and LZ77 shrink data without losing it, what a hash function guarantees (and doesn't), and why a tiny input change causes an avalanche of output change."
      },
      {
        "file": "mutual_information_visualizer.html",
        "title": "How Much Does Y Tell You About X? — Mutual Information",
        "one": "Knowing one variable can shrink your uncertainty about another — mutual information measures exactly how much.",
        "prompt": "Explain mutual information from first principles: what it means for one random variable to reduce uncertainty about another, and how mutual information quantifies that shared information in bits."
      },
      {
        "file": "notation_rosetta_stone_visualizer.html",
        "title": "Notation Rosetta Stone, Drawn Live",
        "one": "The same handful of symbols — sums, products, quantifiers, set-builder brackets — keep reappearing across every branch of math, once you learn to read them.",
        "prompt": "Walk me through the most common pieces of mathematical notation (sums, products, quantifiers, set-builder notation) and what each one is really shorthand for."
      },
      {
        "file": "pdf_cdf_visualizer.html",
        "title": "PDFs and CDFs, Made Visible",
        "one": "A probability density function is a shape you integrate; a cumulative distribution function is the running total as you sweep across it.",
        "prompt": "Explain probability density functions and cumulative distribution functions from first principles: why a PDF's height isn't a probability by itself, and how the CDF is built by accumulating area under the PDF."
      },
      {
        "file": "proof_and_axiomatic_method_visualizer.html",
        "title": "Layered Towers — Proof & the Axiomatic Method",
        "one": "Every theorem is a tower built on axioms and earlier theorems — the axiomatic method is just being honest about which floor you're standing on.",
        "prompt": "Explain the axiomatic method and mathematical proof from first principles: what an axiom is, how theorems build on axioms and prior theorems, and why that layered structure is what makes a proof a proof."
      },
      {
        "file": "abacus_visualizer.html",
        "title": "The Abacus, Bead by Bead",
        "one": "A bead-and-rod frame is place value made physical — every carrying trick a fast abacus user performs is the same rule your own arithmetic already uses, wearing a costume.",
        "prompt": "Explain how an abacus works from first principles: why each rod is one place-value column, how the soroban's 1-heaven/4-earth bead design covers every digit with zero redundancy, and how carrying between rods is physically the same operation as carrying in written arithmetic."
      },
      {
        "file": "classification_and_completeness_visualizer.html",
        "title": "Classification and Completeness, Live",
        "one": "Sometimes math can prove a list is finished forever — five Platonic solids, 230 space groups — and sometimes a theorem proves no such finished list can ever exist at all.",
        "prompt": "Explain classification and completeness in mathematics: how the Platonic solids and crystallographic restriction theorem prove a search is finite and finished, and how Gödel's incompleteness theorem proves the opposite is sometimes true — that no finite set of axioms can ever settle every true statement."
      },
      {
        "file": "godels_incompleteness_visualizer.html",
        "title": "A Sentence That Talks About Itself",
        "one": "Swap the Liar's Paradox's 'false' for 'unprovable' and the contradiction resolves into a true, stable sentence a rulebook can never prove — Hilbert's dream, gone in one substitution.",
        "prompt": "Explain Gödel's incompleteness theorem from first principles: why Hilbert's program wanted a complete, decidable set of axioms for arithmetic, why the Liar's Paradox can't be used directly to break it, how Gödel numbering lets a sentence about numbers also be a sentence about proofs, and why swapping 'false' for 'unprovable' produces a true sentence the system can never prove instead of a contradiction."
      },
      {
        "file": "matrix_factorization_visualizer.html",
        "title": "One Matrix, Many Factorizations",
        "one": "LU, Cholesky, QR, SVD, and NMF are all the same question — write a matrix as simpler pieces — answered a different way for a different job.",
        "prompt": "Explain matrix factorization from first principles: why LU decomposition speeds up solving Ax=b for many b's, why Cholesky halves the work for symmetric positive-definite matrices, and how non-negative matrix factorization trades away SVD's optimality for interpretable, non-negative parts."
      },
      {
        "file": "game_theory_visualizer.html",
        "title": "When Your Best Move Depends on Theirs",
        "one": "The Prisoner's Dilemma, the Nash equilibrium, and why the mathematically 'stable' outcome isn't always the best one for anybody.",
        "prompt": "Explain game theory from first principles: what a payoff matrix is, why the Prisoner's Dilemma shows self-interest can make both players worse off, and what a Nash equilibrium actually guarantees (and doesn't)."
      },
      {
        "file": "logical_fallacies_visualizer.html",
        "title": "The Forged Signature of an Argument",
        "one": "A fallacy is an argument that keeps its persuasive shell after the logical machinery inside it has already broken — this is the field guide to spotting the break.",
        "prompt": "Explain logical fallacies from first principles: the difference between a formally invalid pattern and an informal fallacy, why a fallacious argument can still feel completely persuasive, and how the same broken pattern shows up in courtrooms, ads, and scientific papers alike."
      },
      {
        "file": "philosophy_of_mathematics_visualizer.html",
        "title": "What Kind of Thing Is the Number 7?",
        "one": "Every proof quietly assumes an answer to whether mathematical objects are discovered or invented — and the four different answers can make the same valid proof acceptable to one mathematician and rejected by another.",
        "prompt": "Explain the philosophy of mathematics from first principles: what Platonism, formalism, and intuitionism each claim a mathematical object actually is, and why a perfectly valid existence proof by cases can be accepted by one school and rejected outright by another."
      },
      {
        "file": "power_laws_visualizer.html",
        "title": "When There's No Such Thing as Typical",
        "one": "Power laws are what happens when a quantity has no natural typical size at all — the same shape at every scale is why a handful of cities, words, or websites hold a wildly disproportionate share of everything.",
        "prompt": "Explain power laws and scale-free networks from first principles: what scale invariance actually means, why it makes 'the average city size' a meaningless number, and a real generative mechanism that produces a power law from scratch."
      },
      {
        "file": "ones_and_twos_complement_visualizer.html",
        "title": "Negative Numbers With No Minus Sign",
        "one": "Three ways to store a negative in bits, why flip-and-add-1 won, overflow, sign extension, and the internet checksum.",
        "prompt": "Explain one's and two's complement from first principles: how a computer stores negative numbers with no minus sign, why 'flip the bits and add 1' works, why one adder can serve both signed and unsigned numbers, and how overflow and sign extension behave."
      },
      {
        "file": "floating_point_visualizer.html",
        "title": "Scientific Notation in 64 Switches",
        "one": "The IEEE-754 bit layout, why 0.1 + 0.2 isn't 0.3, machine epsilon, cancellation, log-sum-exp, and half precision.",
        "prompt": "Explain floating-point numbers and numerical stability from first principles: how a 64-bit float stores a number, why 0.1 + 0.2 is not exactly 0.3, what machine epsilon and catastrophic cancellation are, and why tricks like log-sum-exp keep computations stable."
      },
      {
        "file": "roots_of_equations_visualizer.html",
        "title": "Where the Function Hits Zero",
        "one": "One question in many disguises — break-even, internal rate of return, ray-sphere hits — and the solvers that answer it.",
        "prompt": "Explain finding the roots of equations from first principles: why so many practical problems reduce to 'where is this function zero?', and how bisection and Newton's method find the answer when no formula exists, with examples like internal rate of return and ray-sphere intersection."
      },
      {
        "file": "trilateration_and_triangulation_visualizer.html",
        "title": "Pinning Down a Point, Two Ways",
        "one": "Locate a hidden point from distances (trilateration, like GPS) or from angles (triangulation, like surveying).",
        "prompt": "Explain trilateration and triangulation from first principles: how GPS finds your position from distances to known points, how surveyors find a position from angles, and why each needs the number of reference points it does."
      },
      {
        "file": "affine_transformations_visualizer.html",
        "title": "Linear Maps That Are Allowed to Move",
        "one": "Linear vs. affine maps, homogeneous coordinates, why order matters, and why neural network layers need activations.",
        "prompt": "Explain affine transformations from first principles: how they differ from linear maps by allowing a shift, how homogeneous coordinates turn a shift into a matrix multiply, why the order of transformations matters, and why stacking affine layers without activations collapses to a single layer."
      },
      {
        "file": "normed_vector_spaces_visualizer.html",
        "title": "How Long Is a Vector?",
        "one": "Morph the unit ball from diamond (L1) to circle (L2) to square (L-infinity) and compute any p-norm.",
        "prompt": "Explain normed vector spaces from first principles: what a norm is, how the L1, L2 and L-infinity norms measure length differently, why their unit balls are a diamond, a circle and a square, and where each shows up in machine learning."
      },
      {
        "file": "four_fundamental_subspaces_visualizer.html",
        "title": "What a Matrix Can Reach, What It Kills",
        "one": "Row space, null space, column space and left null space — when Ax = b has a solution, and least squares as a shadow.",
        "prompt": "Explain the four fundamental subspaces of a matrix from first principles: the row space, null space, column space and left null space, how they decide whether Ax = b can be solved and how many solutions it has, and why least squares is a projection onto the column space."
      },
      {
        "file": "linear_algebra_advanced_visualizer.html",
        "title": "Six Sharp Tools",
        "one": "Trace and determinant as eigenvalue sum and product, matrix norms, Cauchy-Schwarz, Jordan form, conjugate gradient, Kronecker products.",
        "prompt": "Explain six advanced linear algebra tools from first principles: why the trace and determinant are the sum and product of the eigenvalues, what matrix norms measure, the Cauchy-Schwarz inequality, similar matrices and Jordan form, the conjugate gradient method, and the Kronecker product."
      },
      {
        "file": "matrix_calculus_visualizer.html",
        "title": "Derivatives of Whole Vectors and Matrices",
        "one": "Four rules, the normal equations, a layer's backward pass, and batch gradients — each checked against finite differences.",
        "prompt": "Explain matrix calculus from first principles: how to take derivatives with respect to whole vectors and matrices, the handful of rules that cover most of machine learning, how they derive the normal equations, and how they give a neural network layer's backward pass."
      },
      {
        "file": "vector_calculus_visualizer.html",
        "title": "Directions, Volumes, Flows, Best Paths",
        "one": "Directional derivatives, double integrals, the Gaussian integral in polar form, divergence and curl, line integrals, calculus of variations.",
        "prompt": "Explain multivariable and vector calculus from first principles: directional derivatives and the gradient, double integrals, why switching to polar coordinates solves the Gaussian integral, what divergence and curl measure, line integrals and the big theorems, and the calculus of variations."
      },
      {
        "file": "hessian_and_curvature_visualizer.html",
        "title": "The Shape of the Ground",
        "one": "Quadratic-form bowls and saddles, second-order Taylor, the second-derivative test, and why Newton's method beats zigzagging descent.",
        "prompt": "Explain the Hessian and curvature from first principles: how the matrix of second derivatives describes bowls, ridges and saddles, how it gives the second-derivative test in many dimensions, and why using curvature lets Newton's method avoid gradient descent's zigzag."
      },
      {
        "file": "constrained_optimization_and_kkt_visualizer.html",
        "title": "Is the Fence Actually Stopping You?",
        "one": "Slack vs. binding constraints, the four KKT conditions, penalties as budgets, and why SVMs have support vectors.",
        "prompt": "Explain constrained optimization and the KKT conditions from first principles: what a Lagrange multiplier measures, when a constraint is binding versus slack, what each of the four KKT conditions says, and how this explains regularization and the support vectors in an SVM."
      },
      {
        "file": "linear_programming_and_duality_visualizer.html",
        "title": "Slide the Line to the Corner",
        "one": "The best answer to a linear program sits at a vertex of the feasible region, and every primal has a dual that prices its constraints.",
        "prompt": "Explain linear programming and duality from first principles: why the optimum of a linear program always sits at a corner of the feasible region, how the simplex method walks those corners, and what the dual problem means as prices on the constraints."
      },
      {
        "file": "automatic_differentiation_visualizer.html",
        "title": "Derivatives the Computer Gets Exactly Right",
        "one": "Dual numbers for forward mode, a reverse-mode computation graph, and when each direction is cheaper.",
        "prompt": "Explain automatic differentiation from first principles: how dual numbers carry a derivative along with every value in forward mode, how reverse mode walks a computation graph backward, and why reverse mode is what makes training neural networks practical."
      },
      {
        "file": "joint_distributions_visualizer.html",
        "title": "Two Random Things at Once",
        "one": "Joint and marginal tables, covariance and correlation, why Var(X + Y) needs a cross term, and the bivariate normal.",
        "prompt": "Explain joint distributions and covariance from first principles: how a joint table gives marginal and conditional distributions, what covariance and correlation measure, why the variance of a sum includes a covariance term, and what the bivariate normal looks like."
      },
      {
        "file": "likelihood_and_estimation_visualizer.html",
        "title": "Where Every Loss Function Comes From",
        "one": "Likelihood vs. probability, why we take logs, squared error and cross-entropy as negative log-likelihood, MAP, and Fisher information.",
        "prompt": "Explain likelihood and estimation from first principles: how likelihood differs from probability, why we maximize the log-likelihood, how mean squared error and cross-entropy fall out as negative log-likelihoods, what MAP estimation adds, and what Fisher information measures."
      },
      {
        "file": "causal_inference_visualizer.html",
        "title": "Cause or Coincidence?",
        "one": "Simpson's paradox on real kidney-stone data, potential outcomes, confounded vs. randomized studies, and forks, chains and colliders.",
        "prompt": "Explain causal inference from first principles: why correlation is not causation, how Simpson's paradox can reverse a conclusion, what potential outcomes and the average treatment effect are, why randomization removes confounding, and how causal diagrams of forks, chains and colliders tell you what to control for."
      }
    ]
  },
  {
    "id": "ml",
    "title": "Machine Learning & Deep Learning",
    "blurb": "Backprop, attention, loss functions, regularization, and evaluation — built up from scratch.",
    "items": [
      {
        "file": "network_forward_backward_animation.html",
        "title": "Forward & Backward Pass",
        "one": "Step through a 3-layer network's forward pass and the backprop that follows.",
        "prompt": "Walk me through the forward pass and backpropagation of a small 3-layer neural network, step by step."
      },
      {
        "file": "backprop_visualizer.html",
        "title": "Compute Once, Reuse Backward",
        "one": "Why backprop is cheap: the chain rule's middle term is shared, so each gradient reuses the last.",
        "prompt": "Explain why backpropagation is efficient rather than just correct: how the chain rule's shared middle term lets each layer reuse the gradient computed after it, instead of recomputing derivatives from scratch for every weight."
      },
      {
        "file": "chain_rule_gears_animation.html",
        "title": "The Chain Rule as a Gear Train",
        "one": "Backprop's chain rule visualized as meshed gears multiplying their ratios.",
        "prompt": "Explain the chain rule of calculus as a gear train, and how backpropagation uses it."
      },
      {
        "file": "attention_matrix_scaling_animation.html",
        "title": "Attention's Matrix Math",
        "one": "Q·Kᵀ, the 1/√d scaling, softmax, and multi-head attention, drawn out.",
        "prompt": "Explain the matrix math of attention: query·key products, the 1/sqrt(d) scaling, softmax, and multi-head attention."
      },
      {
        "file": "kv_cache_gqa_mla_animation.html",
        "title": "KV-Cache, GQA & MLA",
        "one": "How transformers cache keys/values, and how GQA and MLA shrink that cache.",
        "prompt": "Explain the KV-cache in transformers and how Grouped-Query Attention and Multi-Head Latent Attention reduce it."
      },
      {
        "file": "cross_entropy_animation.html",
        "title": "Cross-Entropy — Why −log(p)?",
        "one": "Why the loss for a correct-class probability p is −log(p), shown as surprise.",
        "prompt": "Explain cross-entropy loss and why the penalty for predicting probability p on the true class is -log(p)."
      },
      {
        "file": "l2_regularization_animation.html",
        "title": "L2 Regularization — Why Squared?",
        "one": "How the squared-weight penalty pulls weights toward zero and smooths the fit.",
        "prompt": "Explain L2 regularization and why we penalize the squared magnitude of the weights."
      },
      {
        "file": "early_stopping_animation.html",
        "title": "When Do You Stop Training?",
        "one": "Training vs validation loss diverging — the moment early stopping catches.",
        "prompt": "Explain early stopping: how do training and validation loss tell you when to stop training?"
      },
      {
        "file": "cnn_convolution_animation.html",
        "title": "Convolution — A Filter Sliding",
        "one": "A kernel sliding across an image, computing feature maps cell by cell.",
        "prompt": "Explain how convolution works in a CNN: a filter/kernel sliding across an image to make a feature map."
      },
      {
        "file": "waveform_to_spectrogram_animation.html",
        "title": "From Waveform to Spectrogram",
        "one": "Turning a raw audio waveform into a time–frequency spectrogram.",
        "prompt": "Explain how a raw audio waveform becomes a spectrogram, and what the axes of a spectrogram mean."
      },
      {
        "file": "precision_recall_threshold_animation.html",
        "title": "Precision, Recall & the Threshold",
        "one": "Slide the decision threshold and watch precision and recall trade off.",
        "prompt": "Explain precision and recall and how moving the classification threshold trades one against the other."
      },
      {
        "file": "imbalance_accuracy_trap.html",
        "title": "The Accuracy Trap",
        "one": "Why 99% accuracy can be worthless when classes are imbalanced.",
        "prompt": "Explain why accuracy is a misleading metric under class imbalance, and what to use instead."
      },
      {
        "file": "outlier_robustness_animation.html",
        "title": "Mean vs Median",
        "one": "Drag one outlier and watch the mean chase it while the median holds.",
        "prompt": "Explain why the median is robust to outliers but the mean is not."
      },
      {
        "file": "simpsons_paradox_animation.html",
        "title": "Simpson's Paradox",
        "one": "A trend that reverses when you split the data into groups.",
        "prompt": "Explain Simpson's paradox with an example: how can a trend reverse after grouping the data?"
      },
      {
        "file": "titanic_survival_by_group.html",
        "title": "Titanic — Survival by Group",
        "one": "Survival rates broken down by sex and class — a first EDA in one chart.",
        "prompt": "Explain how to read survival rates by group (sex, passenger class) in the Titanic dataset as exploratory data analysis."
      },
      {
        "file": "bias_variance_visualizer.html",
        "title": "Bias and Variance: watch the decomposition happen live",
        "one": "Split a model's total error into the part from being too simple and the part from being too sensitive to the training data.",
        "prompt": "Explain the bias-variance tradeoff: why total prediction error decomposes into bias, variance, and irreducible noise, and how model complexity trades one against the other."
      },
      {
        "file": "empirical_risk_visualizer.html",
        "title": "Empirical Risk vs. Risk: watch generalization theory happen live",
        "one": "The error you measure on your training set is a guess at the error you'll never be able to measure directly — the true risk.",
        "prompt": "Explain the difference between empirical risk (measured on a finite sample) and true risk (the theoretical expectation over the whole distribution), and why minimizing one doesn't guarantee minimizing the other."
      },
      {
        "file": "sample_complexity_visualizer.html",
        "title": "Sample Complexity and PAC Learning: how much data is enough?",
        "one": "Probably Approximately Correct learning answers a very practical question with real math: how many examples before you can trust the model?",
        "prompt": "Explain sample complexity and PAC (Probably Approximately Correct) learning theory: how many training examples are needed to guarantee, with high probability, a model that's approximately correct."
      },
      {
        "file": "resampling_and_shrinkage_visualizer.html",
        "title": "Resampling and Shrinkage: the Bootstrap, live",
        "one": "Resample your own data with replacement to estimate how uncertain your estimate really is — no new data required.",
        "prompt": "Explain the bootstrap: how resampling a dataset with replacement estimates the variability of a statistic, and what shrinkage estimators borrow from that idea."
      },
      {
        "file": "regularization_visualizer.html",
        "title": "Regularization: L1, L2, and Elastic Net, live",
        "one": "Penalize large weights and a model stops memorizing noise — L1 zeroes out features entirely, L2 just shrinks them, Elastic Net does both.",
        "prompt": "Explain L1 (Lasso), L2 (Ridge), and Elastic Net regularization: what penalty each one adds to the loss function, and why L1 produces sparse (zeroed-out) weights while L2 does not."
      },
      {
        "file": "cross_validation_visualizer.html",
        "title": "Cross-Validation Strategies, live",
        "one": "K-fold, stratified, and time-series splits — why the right way to fake unseen data depends on what your data actually looks like.",
        "prompt": "Explain cross-validation strategies: k-fold, stratified k-fold, and time-series splits, and why choosing the wrong one silently leaks information."
      },
      {
        "file": "choosing_a_scaler_visualizer.html",
        "title": "Choosing a Scaler: model first, data shape second",
        "one": "StandardScaler, MinMaxScaler, or RobustScaler — which one to reach for depends on your model and your outliers, not habit.",
        "prompt": "Explain how to choose between StandardScaler, MinMaxScaler, and RobustScaler based on the model being used and whether the data has outliers."
      },
      {
        "file": "standard_scaler_animation.html",
        "title": "Feature Scaling: fit(), transform(), and why it helps the model",
        "one": "fit() learns the mean and spread from training data; transform() applies it — mixing the two up is how data leakage happens.",
        "prompt": "Explain feature scaling and data leakage: what fit() and transform() each actually do, why you must fit only on training data, and how scaling before splitting leaks test information into training."
      },
      {
        "file": "fit_transform_bell_curve.html",
        "title": "Watch fit() and transform() reshape a bell curve",
        "one": "A second look at scaling, this time watching a full distribution — not just individual points — get re-centered and re-scaled.",
        "prompt": "Explain what StandardScaler's fit() and transform() do to an entire distribution of data, not just individual points — why the shape of a bell curve is preserved while its scale changes."
      },
      {
        "file": "fit_transform_movement.html",
        "title": "Watch fit() and transform() move the data",
        "one": "Every point shifts and stretches together when a scaler transforms a dataset — the relationships between points never change, only their coordinates.",
        "prompt": "Explain what actually happens, point by point, when a fitted scaler's transform() is applied to a dataset — why the relative distances between points are preserved even though the coordinates change."
      },
      {
        "file": "frequentist_vs_bayesian_visualizer.html",
        "title": "Frequentist vs. Bayesian: procedures vs. beliefs, made live",
        "one": "Two entirely different answers to \"what does probability mean\" — long-run frequency of a procedure, or a degree of belief that updates with evidence.",
        "prompt": "Explain the difference between frequentist and Bayesian statistics: what each school means by 'probability,' and how a Bayesian updates a belief using Bayes' theorem as new data arrives."
      },
      {
        "file": "discriminant_analysis_animation.html",
        "title": "Discriminant Analysis: the best direction, and the shape of each class",
        "one": "Instead of a decision boundary that just separates classes, find the single direction that separates them best.",
        "prompt": "Explain linear discriminant analysis (LDA): how it finds the projection direction that best separates classes by maximizing between-class variance relative to within-class variance."
      },
      {
        "file": "knn_decision_boundary_animation.html",
        "title": "K-Nearest Neighbors: drag the query point, watch the vote",
        "one": "No training, no formula — just ask the k closest labeled points what they think and go with the majority.",
        "prompt": "Explain k-nearest neighbors classification: why it has no training phase, how the choice of k changes the decision boundary, and why it struggles in high dimensions."
      },
      {
        "file": "roc_auc_construction_animation.html",
        "title": "Building a ROC curve, one threshold at a time",
        "one": "Slide the classification threshold from 0 to 1 and watch the true-positive/false-positive tradeoff trace out the ROC curve, and its area.",
        "prompt": "Explain how a ROC curve is built by sweeping the classification threshold, what the area under it (AUC) measures, and why it's threshold-independent."
      },
      {
        "file": "anscombes_quartet_animation.html",
        "title": "Anscombe's Quartet — same stats, different realities",
        "one": "Four datasets with identical mean, variance, correlation, and regression line — and four wildly different scatter plots.",
        "prompt": "Explain Anscombe's quartet: how four datasets can share identical summary statistics (mean, variance, correlation, regression line) while looking completely different when plotted, and why that's an argument for always visualizing data."
      },
      {
        "file": "galton_board_animation.html",
        "title": "The Galton Board — watching the bell curve assemble itself",
        "one": "Drop balls through a grid of pegs, each bounce a coin flip, and watch the normal distribution emerge from pure chance.",
        "prompt": "Explain the Galton board and why it produces a normal distribution: how a sum of many independent random left/right bounces converges to a bell curve, connecting to the central limit theorem."
      },
      {
        "file": "memorylessness_animation.html",
        "title": "Memorylessness — the bus that never learns",
        "one": "If a process is memoryless, how long you've already waited tells you nothing about how much longer you'll wait.",
        "prompt": "Explain the memoryless property of the exponential distribution: why waiting 10 minutes for a bus that hasn't come tells you nothing about how much longer you'll wait, and how this connects to Markov chains."
      },
      {
        "file": "llm_roadmap_ladder.html",
        "title": "The 2026 LLM Engineering Roadmap — the ladder of levers",
        "one": "From prompting to fine-tuning to building your own architecture — a ladder of increasingly powerful (and expensive) levers for shaping an LLM's behavior.",
        "prompt": "Explain the ladder of techniques for shaping an LLM's behavior, from cheapest to most expensive: prompting, retrieval-augmented generation, fine-tuning, and pretraining — and when each one is the right tool."
      },
      {
        "file": "react_agent_loop.html",
        "title": "The ReAct Agent Loop — Thought → Action → Observation",
        "one": "An LLM agent that interleaves reasoning with acting: think, take an action, observe the result, and repeat.",
        "prompt": "Explain the ReAct (Reasoning + Acting) agent pattern: how interleaving a Thought step with an Action and an Observation lets an LLM use tools and correct course mid-task."
      },
      {
        "file": "reinforcement_learning_visualizer.html",
        "title": "Reinforcement Learning, live",
        "one": "An agent that learns by trial, error, and reward — no labeled examples, just a policy that gets better every episode.",
        "prompt": "Explain reinforcement learning from first principles: what a policy, a reward signal, and a Markov decision process are, and how an agent improves its policy purely from trial and error."
      },
      {
        "file": "correlation_matrix_visualizer.html",
        "title": "The Correlation Matrix, live",
        "one": "One grid, every pair of variables at once — how strongly, and in which direction, each one moves with every other.",
        "prompt": "Explain the correlation matrix from first principles: what the Pearson correlation coefficient actually measures, why it's bounded between -1 and 1, and what a full matrix of pairwise correlations reveals that looking at variables one at a time misses."
      },
      {
        "file": "global_workspace_theory_visualizer.html",
        "title": "A Global Workspace, Illustrated",
        "one": "Many specialized processes compete for a shared spotlight; whatever wins gets broadcast everywhere at once.",
        "prompt": "Explain Global Workspace Theory from first principles: what the 'global workspace' metaphor for consciousness/attention proposes, and why broadcasting one winning signal to many specialized modules is a useful way to think about it."
      },
      {
        "file": "calibration_metrics_visualizer.html",
        "title": "Calibration Metrics, live",
        "one": "A model that says '70% confident' should be right about 70% of the time — calibration is what actually checks that promise.",
        "prompt": "Explain model calibration from first principles: what it means for a predicted probability to be calibrated, how a reliability diagram checks it, and why an accurate model can still be badly calibrated."
      },
      {
        "file": "how_to_measure_everything_visualizer.html",
        "title": "How to Measure Everything, live",
        "one": "Almost anything you think is 'unmeasurable' turns out to have a clever, cheap way to put a number on it.",
        "prompt": "Explain the core idea behind 'how to measure anything': how to turn a vague, seemingly unmeasurable quantity into a concrete estimate with a defensible range."
      },
      {
        "file": "latent_dirichlet_allocation_visualizer.html",
        "title": "Latent Dirichlet Allocation, made visible",
        "one": "Every document is a mix of hidden topics, and every topic is a mix of words — LDA works backward from the words to guess both.",
        "prompt": "Explain Latent Dirichlet Allocation from first principles: what a 'topic' means as a probability distribution over words, and how LDA infers a document's mixture of topics purely from the words it contains."
      },
      {
        "file": "log_loss_visualizer.html",
        "title": "Log Loss vs. Brier Score, live",
        "one": "Two different ways to grade a probability forecast — one punishes confident wrong answers brutally, the other more gently.",
        "prompt": "Explain log loss and the Brier score from first principles: what a 'proper scoring rule' is, why log loss punishes a confident wrong prediction so much more harshly than the Brier score does, and when you'd prefer one over the other."
      },
      {
        "file": "lora_tinylora_qlora_visualizer.html",
        "title": "LoRA, TinyLoRA & QLoRA, live",
        "one": "Instead of retraining a giant model's weights, freeze them and learn a tiny low-rank patch on top — three flavors of the same trick.",
        "prompt": "Explain LoRA, TinyLoRA, and QLoRA from first principles: why fine-tuning by adding a small low-rank update instead of touching the original weights saves so much memory, and what changes between the three variants."
      },
      {
        "file": "model_quantization_and_compression_visualizer.html",
        "title": "Model Quantization & Compression, live",
        "one": "Most of a neural network's precision is wasted — round its numbers to fewer bits and it barely notices, but your GPU memory certainly does.",
        "prompt": "Explain model quantization from first principles: why storing weights in fewer bits (like int8 instead of float32) usually costs little accuracy, and how that trades off against model size and inference speed."
      },
      {
        "file": "multiclass_cross_entropy_visualizer.html",
        "title": "Multi-Class Cross-Entropy, live",
        "one": "Binary cross-entropy asks 'how wrong about yes/no'; multi-class cross-entropy asks the same question across every possible category at once.",
        "prompt": "Explain multi-class cross-entropy from first principles: how softmax turns raw scores into a probability distribution over classes, and how cross-entropy then measures how wrong that distribution is."
      },
      {
        "file": "ranking_metrics_visualizer.html",
        "title": "Ranking Metrics, live",
        "one": "Getting the right answer isn't enough for a search engine or recommender — it has to put the right answer near the TOP.",
        "prompt": "Explain ranking metrics from first principles: why accuracy alone doesn't capture ranking quality, and what mean average precision and NDCG actually reward."
      },
      {
        "file": "tree_based_methods_visualizer.html",
        "title": "Tree-Based Methods, live",
        "one": "A decision tree asks one good yes/no question at a time; forests and boosting are just clever ways to combine many imperfect trees into one good answer.",
        "prompt": "Explain tree-based methods from first principles: how a single decision tree splits data, why one tree tends to overfit, and how bagging (random forests) and boosting (gradient boosted trees) each fix that in a different way."
      },
      {
        "file": "voice_and_speech_recognition_visualizer.html",
        "title": "Voice & Speech Recognition, live",
        "one": "Turning a sound wave into words means bridging raw audio, learned acoustic representations, and language all at once.",
        "prompt": "Explain automatic speech recognition from first principles: how a raw audio waveform becomes text, and what problem modern speech models are actually solving at each stage."
      },
      {
        "file": "wape_and_forecast_bias_visualizer.html",
        "title": "WAPE and Forecast Bias, live",
        "one": "Average percentage error can look great while consistently forecasting too high or too low — WAPE and bias catch different mistakes.",
        "prompt": "Explain WAPE (weighted absolute percentage error) and forecast bias from first principles: how each one scores a forecast differently, and why a forecast can have low error but still be systematically biased."
      },
      {
        "file": "wav2vec_self_supervised_visualizer.html",
        "title": "wav2vec 2.0, live",
        "one": "Instead of needing transcribed speech to learn from, wav2vec 2.0 learns to predict masked chunks of raw audio from context — self-supervision, for sound.",
        "prompt": "Explain wav2vec 2.0 from first principles: what self-supervised pretraining means for audio, and how predicting masked audio segments teaches the model useful speech representations without any transcripts."
      },
      {
        "file": "whisper_training_objective_visualizer.html",
        "title": "Whisper's Multitask Objective, live",
        "one": "Whisper doesn't just transcribe — one training objective teaches it to transcribe, translate, detect language, and time-stamp, all at once.",
        "prompt": "Explain Whisper's multitask training objective from first principles: how a single sequence-to-sequence model is trained to handle transcription, translation, and language identification together."
      },
      {
        "file": "naive_bayes_visualizer.html",
        "title": "Naive Bayes: word by word, and the Gaussian boundary",
        "one": "Assume every feature is independent (it's usually a lie), multiply their probabilities anyway, and you get a shockingly good classifier.",
        "prompt": "Explain Naive Bayes from first principles: what the 'naive' conditional-independence assumption actually assumes, why it works well despite being wrong, and how it draws a decision boundary between classes."
      },
      {
        "file": "support_vector_machines_visualizer.html",
        "title": "Support Vector Machines: the widest street, live-solved",
        "one": "An SVM doesn't just separate two classes — it finds the widest possible street between them, using only the points closest to the border.",
        "prompt": "Explain support vector machines from first principles: what it means to maximize the margin between classes, why only the 'support vectors' end up mattering, and what the kernel trick lets you do."
      },
      {
        "file": "clustering_visualizer.html",
        "title": "Clustering, live",
        "one": "No labels, no answer key — just group the points that belong together, and let the data reveal its own structure.",
        "prompt": "Explain clustering from first principles: how k-means, hierarchical clustering, and DBSCAN each decide what counts as a 'group' differently, with no labeled data to learn from."
      },
      {
        "file": "dimensionality_reduction_visualizer.html",
        "title": "Dimensionality Reduction, live",
        "one": "Most of a high-dimensional dataset's real structure often lives in just a handful of directions — dimensionality reduction finds them.",
        "prompt": "Explain dimensionality reduction from first principles: what PCA is really doing when it finds the directions of greatest variance, and how that compares to techniques like t-SNE and UMAP built for visualization instead."
      },
      {
        "file": "time_series_and_forecasting_visualizer.html",
        "title": "Time Series & Forecasting: decomposition, stationarity, and a live forecast",
        "one": "Trend, seasonality, and noise are tangled together in every time series — pull them apart first, and forecasting gets much easier.",
        "prompt": "Explain time series forecasting from first principles: how to decompose a series into trend, seasonality, and residual noise, what 'stationarity' means and why it matters, and how a simple forecasting model uses all of that."
      },
      {
        "file": "agent_harness_engineering_visualizer.html",
        "title": "Agent Harness Engineering — The Body Around the Brain",
        "one": "A model is a brain in a jar; tools, MCP, Skills, and the agent loop are the body — sensors, muscles, and rules — that turn it into something that can act.",
        "prompt": "Explain agent harness engineering from first principles: what a harness gives a model that the model can't do alone (tools, MCP, Skills, the agent loop, context engineering), and how those pieces combine into a system that can act instead of only speak."
      },
      {
        "file": "matrix_completion_visualizer.html",
        "title": "Filling In the Missing 99%",
        "one": "A recommender's ratings matrix is over 99% empty — matrix completion fills the holes by assuming the same low-rank structure SVD already proves exists.",
        "prompt": "Explain matrix completion from first principles: why you can't just run SVD on a matrix with missing entries, how the alternating imputation algorithm fills holes by repeatedly trusting low-rank structure then trusting the real data, and how this is exactly the technique behind the Netflix Prize."
      },
      {
        "file": "text_embeddings_visualizer.html",
        "title": "One Word Doing Three Jobs",
        "one": "'Embedding' means a lookup-table row, a context-dependent Transformer activation, and a similarity-trained vector — three different objects, and most embedding bugs come from silently swapping one for another.",
        "prompt": "Explain text embeddings from first principles: the difference between a static lookup-table embedding, a context-dependent Transformer activation, and a task-trained similarity vector, and why treating them as interchangeable causes real production bugs."
      },
      {
        "file": "agentic_eval_engine_visualizer.html",
        "title": "Does It Actually Work, or Did It Just Get Lucky?",
        "one": "One successful demo run can't tell 'right for the right reasons' apart from 'right by a lucky shortcut' — an eval engine automates asking that question hundreds of times instead of once.",
        "prompt": "Explain agentic eval engine architecture from first principles: why a single watched transcript can't distinguish a sound process from a lucky non-deterministic run, and how an eval engine turns 'it worked once' into a measured success rate that catches regressions."
      },
      {
        "file": "shape_and_spread_explorer.html",
        "title": "The Shape Your Summary Numbers Hide",
        "one": "A mean and standard deviation can describe wildly different-looking datasets identically — histograms, box plots, violin plots, and Q-Q plots each reveal a different way a distribution's shape hides from its own summary statistics.",
        "prompt": "Explain how to read the shape of a data distribution from first principles: what a histogram, box plot, violin plot, and Q-Q plot each show that a mean and standard deviation alone cannot, and why checking shape before trusting summary statistics matters."
      },
      {
        "file": "linear_regression_visualizer.html",
        "title": "The Line That Fits Best",
        "one": "Closed form vs. gradient descent landing on the same answer, regression diagnostics, coefficient inference, and multicollinearity.",
        "prompt": "Explain linear regression from first principles: how the closed-form least-squares solution and gradient descent reach the same line, how to read residual diagnostics, how to tell whether a coefficient is real, and why correlated features make coefficients unstable."
      },
      {
        "file": "logistic_regression_visualizer.html",
        "title": "From Odds to Probabilities",
        "one": "Why a straight line fails on yes/no data, probability vs. odds vs. log-odds, reading coefficients, fitting, and perfectly separable data.",
        "prompt": "Explain logistic regression from first principles: why a straight line fails for yes/no outcomes, how probability, odds and log-odds relate, how to read a coefficient as a change in log-odds, how the model is fitted, and what goes wrong when the data are perfectly separable."
      },
      {
        "file": "regression_metrics_visualizer.html",
        "title": "Same MAE, Different RMSE",
        "one": "Five houses show how MAE, MSE, RMSE and Huber loss weigh errors differently, and why mean vs. median matters.",
        "prompt": "Explain regression metrics from first principles: what MAE, MSE and RMSE each measure, why two models can share an MAE but differ in RMSE, how Huber loss blends the two, and why minimizing absolute error targets the median while squared error targets the mean."
      },
      {
        "file": "multiclass_confusion_matrix_visualizer.html",
        "title": "Who Got Mistaken for Whom",
        "one": "Edit a multiclass confusion matrix and watch per-class precision, recall and F1, plus macro vs. micro averages, update live.",
        "prompt": "Explain the multiclass confusion matrix from first principles: how to read rows and columns, how per-class precision, recall and F1 come from it, and how macro and micro averaging can tell very different stories."
      },
      {
        "file": "class_imbalance_visualizer.html",
        "title": "Synthetic Minority Samples",
        "one": "How SMOTE builds a new minority example on the line between two neighbors, and how it can bleed into the majority class.",
        "prompt": "Explain SMOTE for class imbalance from first principles: how it creates a synthetic minority example by interpolating between a point and its nearest neighbor, and how that interpolation can contaminate the majority class."
      },
      {
        "file": "feature_engineering_and_encoding_visualizer.html",
        "title": "Turning Categories Into Numbers",
        "one": "Ordinal vs. one-hot, target encoding and its leak, out-of-fold fixes, frequency encoding, and the hashing trick for high cardinality.",
        "prompt": "Explain categorical feature encoding from first principles: when ordinal versus one-hot encoding is right, how target encoding works and why it leaks the label, how out-of-fold encoding fixes that, and how frequency encoding and the hashing trick handle categories with thousands of values."
      },
      {
        "file": "missing_data_imputation_visualizer.html",
        "title": "Filling the Holes Honestly",
        "one": "MCAR, MAR and MNAR, why mean filling shrinks variance, KNN and MICE imputation, missing indicators, and pipeline leakage.",
        "prompt": "Explain missing-data imputation from first principles: the difference between data missing completely at random, at random, and not at random, why filling with the mean shrinks variance, how KNN and MICE imputation work, and how imputing before splitting leaks information."
      },
      {
        "file": "hyperparameter_search_visualizer.html",
        "title": "Grid, Random, or Bayesian?",
        "one": "Why random search beats a grid when only one knob matters, and how Bayesian optimization decides where to try next.",
        "prompt": "Explain hyperparameter search from first principles: why random search usually beats grid search when only a few hyperparameters matter, and how Bayesian optimization uses a surrogate model to choose the next setting to try."
      },
      {
        "file": "anomaly_detection_visualizer.html",
        "title": "Finding the Odd One Out",
        "one": "Local outlier factor by hand, one-class SVM and its nu, and three detectors disagreeing on the same data.",
        "prompt": "Explain anomaly detection from first principles: how the local outlier factor compares a point's density to its neighbors', how a one-class SVM draws a boundary around normal data, what its nu parameter controls, and why different detectors flag different points."
      },
      {
        "file": "model_monitoring_and_drift_visualizer.html",
        "title": "When the World Moves Under the Model",
        "one": "PSI and the KS test by hand, a simulated year of drift, and when to trigger retraining.",
        "prompt": "Explain model monitoring and data drift from first principles: how the population stability index and the Kolmogorov-Smirnov test detect a shifted distribution, how drift erodes a deployed model over time, and how to decide when to retrain."
      },
      {
        "file": "weight_initialization_visualizer.html",
        "title": "Starting the Weights Just Right",
        "one": "Push a batch through 50 layers and watch activations explode, vanish, or hold steady under Xavier and He initialization.",
        "prompt": "Explain weight initialization from first principles: why badly scaled initial weights make activations and gradients explode or vanish through many layers, and how Xavier and He initialization choose a variance of about 1/n to keep the signal steady."
      },
      {
        "file": "activation_slopes_visualizer.html",
        "title": "Activation Slopes and Saturation",
        "one": "Each activation's local slope multiplies the gradient; see sigmoid saturate through many layers and ReLU die where Leaky ReLU survives.",
        "prompt": "Explain activation functions through their slopes: why backprop multiplies the gradient by each activation's local derivative, why sigmoid and tanh saturate and shrink gradients through many layers, and how dying ReLU happens and Leaky ReLU avoids it."
      },
      {
        "file": "residual_connections_visualizer.html",
        "title": "Residual Connections Keep Gradients Alive",
        "one": "A real stack of tanh layers shows gradients dying with depth, and how the identity path of a skip connection rescues them.",
        "prompt": "Explain residual connections from first principles: why gradients shrink as they pass back through many layers, how adding a skip connection gives the Jacobian an identity term, and why that lets very deep networks train."
      },
      {
        "file": "dropout_visualizer.html",
        "title": "Dropout: Raw vs. Inverted",
        "one": "Drag the keep probability and see why inverted dropout rescales during training so nothing changes at test time.",
        "prompt": "Explain dropout from first principles: how randomly dropping activations during training acts as regularization, why the expected output shrinks unless you rescale, and why inverted dropout divides by the keep probability during training so inference needs no change."
      },
      {
        "file": "adam_optimizer_visualizer.html",
        "title": "Momentum, Adaptivity, Adam",
        "one": "SGD vs. momentum vs. Adam on a stretched valley, Nesterov, AdaGrad vs. RMSprop, and why Adam needs bias correction.",
        "prompt": "Explain the Adam optimizer from first principles: why plain SGD zigzags or diverges on a stretched valley, how momentum smooths the path, how AdaGrad and RMSprop give each parameter its own step size, and why Adam needs bias correction early in training."
      },
      {
        "file": "learning_rate_schedules_visualizer.html",
        "title": "Learning-Rate Schedules and Warmup",
        "one": "Step, cosine and warmup schedules computed exactly, a noisy-SGD race between them, and Adam's blind first step.",
        "prompt": "Explain learning-rate schedules from first principles: why a learning rate that is good early in training is too large later, how step decay and cosine schedules lower it, and why warmup protects Adam's first steps."
      },
      {
        "file": "rnn_lstm_visualizer.html",
        "title": "Memory Through Time",
        "one": "An unrolled RNN with BPTT checked against finite differences, vanishing and exploding gradients, an RNN-vs-LSTM race, clipping, and seq2seq attention.",
        "prompt": "Explain RNNs and LSTMs from first principles: how a recurrent network carries a hidden state through time, how backpropagation through time computes its gradients, why those gradients vanish or explode, how the LSTM's gates fix that, and how attention improved sequence-to-sequence models."
      },
      {
        "file": "tokenization_bpe_visualizer.html",
        "title": "Byte-Pair Encoding, Step by Step",
        "one": "Train BPE by merging the most frequent pair, encode unseen words, and compare characters, words and subwords.",
        "prompt": "Explain tokenization with byte-pair encoding from first principles: how BPE learns merges by repeatedly joining the most frequent neighboring pair, how it splits words it has never seen, and why subword tokens beat both characters and whole words."
      },
      {
        "file": "positional_encoding_and_rope_visualizer.html",
        "title": "Where Each Token Sits",
        "one": "Sinusoidal encodings as rotations, and how RoPE makes attention depend only on the relative offset between tokens.",
        "prompt": "Explain positional encoding and RoPE from first principles: why attention needs to be told where each token is, how sinusoidal encodings let a fixed rotation shift any position by an offset, and how rotary position embeddings make attention scores depend only on relative position."
      },
      {
        "file": "attention_math_connections_visualizer.html",
        "title": "Attention's Math Connections",
        "one": "One attention row seen three ways: temperature and entropy, a complete graph, and kernel regression.",
        "prompt": "Explain the mathematical connections of self-attention: how the softmax temperature controls the entropy of attention weights, how attention is message passing on a complete graph, and how it is a form of kernel regression."
      },
      {
        "file": "bert_vs_gpt_masking_visualizer.html",
        "title": "BERT vs. GPT Masking",
        "one": "Click a token to see what it may attend to under GPT's causal mask vs. BERT's bidirectional one, then run BERT's 80/10/10 recipe.",
        "prompt": "Explain how BERT and GPT differ through their attention masks: why GPT's causal mask lets each token see only earlier tokens, why BERT sees both directions, and how BERT's 80/10/10 masking recipe trains it."
      },
      {
        "file": "mixture_of_experts_visualizer.html",
        "title": "Mixture of Experts",
        "one": "Route a token through a real top-k router, watch sparse activation, and see why load balancing is needed.",
        "prompt": "Explain mixture-of-experts models from first principles: how a router sends each token to only a few experts, why that gives a large model a small compute cost per token, and why a load-balancing loss is needed to stop all tokens going to the same experts."
      },
      {
        "file": "vision_transformer_and_clip_visualizer.html",
        "title": "Images as Sequences",
        "one": "Patchify an image for a Vision Transformer, tune temperature on a CLIP similarity matrix, and classify zero-shot.",
        "prompt": "Explain Vision Transformers and CLIP from first principles: how an image is cut into patches and treated as a token sequence, how CLIP trains images and captions into a shared embedding space with a contrastive loss, and how that enables zero-shot classification."
      },
      {
        "file": "data_augmentation_and_transfer_learning_visualizer.html",
        "title": "More Data From Less",
        "one": "Watch augmentation turn memorization into generalization, and reuse frozen convolution kernels on a new task.",
        "prompt": "Explain data augmentation and transfer learning from first principles: how augmented copies of training data push a model from memorizing to generalizing, and how a network's learned features can be frozen and reused on a new task with little data."
      },
      {
        "file": "object_detection_visualizer.html",
        "title": "Find It, Box It, Outline It",
        "one": "IoU, anchor boxes, non-max suppression, the YOLO grid, mAP, U-Net shapes and Dice loss, each as a worked example.",
        "prompt": "Explain object detection and segmentation from first principles: how intersection over union scores a box, how anchors and the YOLO grid propose boxes, how non-max suppression removes duplicates, how mAP measures a detector, and how U-Net and Dice loss handle pixel-level segmentation."
      },
      {
        "file": "graph_neural_networks_visualizer.html",
        "title": "Learning on Graphs",
        "one": "Watch a vertex aggregate its neighbors in a GCN update, and see that a CNN is just a GNN on a grid.",
        "prompt": "Explain graph neural networks from first principles: how message passing lets each node aggregate its neighbors' features, what the normalized GCN update does, and why a convolutional network is a special case of a GNN on a grid graph."
      },
      {
        "file": "generative_models_visualizer.html",
        "title": "VAEs, GANs and Diffusion",
        "one": "Check the key math live: the VAE's KL term and reparameterization, the GAN game, and diffusion's forward noising and reverse denoising.",
        "prompt": "Explain generative models from first principles: how a variational autoencoder balances reconstruction against a KL penalty and uses the reparameterization trick, how a GAN pits a generator against a discriminator, and how diffusion models learn to reverse a gradual noising process."
      },
      {
        "file": "preference_optimization_visualizer.html",
        "title": "How RLHF Actually Works",
        "one": "The pipeline from pretraining to assistant: reward model, the KL leash, DPO, and GRPO.",
        "prompt": "Explain how preference optimization turns a language model into an assistant: supervised fine-tuning, training a reward model from human comparisons, why a KL penalty keeps the policy close to the original, and how DPO and GRPO simplify RLHF."
      },
      {
        "file": "interpretability_visualizer.html",
        "title": "Looking Inside the Model",
        "one": "Saliency vs. integrated gradients, Grad-CAM, linear probes, superposition and sparse autoencoders, probing vs. patching.",
        "prompt": "Explain neural network interpretability from first principles: how saliency maps and integrated gradients attribute a prediction to inputs, what Grad-CAM shows, what a linear probe can and cannot prove, why features live in superposition, and how sparse autoencoders and activation patching help."
      },
      {
        "file": "distributed_training_visualizer.html",
        "title": "Training Across Many GPUs",
        "one": "Memory per GPU, ring all-reduce, pipeline bubbles, gradient accumulation, activation checkpointing, and tensor parallelism.",
        "prompt": "Explain distributed training from first principles: how much memory a model needs per GPU, how ring all-reduce averages gradients efficiently, why pipeline parallelism has bubbles, and how gradient accumulation, activation checkpointing and tensor parallelism trade compute, memory and communication."
      },
      {
        "file": "llm_scale_and_inference_visualizer.html",
        "title": "Model Scale and Inference",
        "one": "Why more parameters buy accuracy, chain-of-thought compounding, FlashAttention's online softmax, speculative decoding, continuous batching.",
        "prompt": "Explain how language model scale and inference work: why more parameters buy better approximation, why chain-of-thought helps on multi-step problems, how FlashAttention computes softmax in tiles, and how speculative decoding and continuous batching make serving faster."
      },
      {
        "file": "llm_decoding_strategies_visualizer.html",
        "title": "Beam Search vs. Greedy Decoding",
        "one": "Step through generation and watch which candidates beam search keeps and prunes compared with greedy decoding.",
        "prompt": "Explain how a language model chooses its next tokens: how greedy decoding picks the single most likely token, how beam search keeps several candidates to find a more likely sequence overall, and the trade-offs between them."
      },
      {
        "file": "model_router_visualizer.html",
        "title": "Which Model Should Answer?",
        "one": "Three router decision shapes, the economics of a confidence threshold, and why calibration decides whether routing pays off.",
        "prompt": "Explain model routing from first principles: how a router decides whether a cheap or an expensive model should answer, how the confidence threshold trades cost against quality, and why the router's confidence must be calibrated for that trade to work."
      }
    ]
  },
  {
    "id": "python",
    "title": "Algorithms & Problem Patterns",
    "blurb": "The core interview patterns — search, two pointers, stacks, DP, and graph traversal.",
    "items": [
      {
        "file": "pattern_decision_tree.html",
        "title": "Pattern Decision Tree",
        "one": "From problem clues to the right algorithmic pattern, as a decision tree.",
        "prompt": "Help me build a decision process for choosing the right algorithm pattern from a coding problem's clues."
      },
      {
        "file": "binary_search_visualizer.html",
        "title": "Binary Search",
        "one": "Watch lo/hi/mid converge, including the tricky boundary variants.",
        "prompt": "Explain binary search and its boundary variants (first/last occurrence, lower/upper bound) carefully."
      },
      {
        "file": "two_pointers_sliding_window.html",
        "title": "Two Pointers & Sliding Window",
        "one": "Two pointers converging and a window expanding/shrinking over an array.",
        "prompt": "Explain the two-pointers and sliding-window patterns and when each one applies."
      },
      {
        "file": "monotonic_stack_and_heap.html",
        "title": "Monotonic Stack & Heap",
        "one": "A monotonic stack popping to keep order, and a heap sifting to the top.",
        "prompt": "Explain the monotonic stack pattern and the heap (priority queue) pattern with examples."
      },
      {
        "file": "bfs_dfs_tree_graph.html",
        "title": "BFS vs DFS",
        "one": "Breadth-first waves vs depth-first dives over the same tree and graph.",
        "prompt": "Explain BFS and DFS on trees and graphs: how they traverse, and when to pick each."
      },
      {
        "file": "dp_grid_builder.html",
        "title": "DP Grid Builder",
        "one": "Fill a dynamic-programming table cell by cell and trace the recurrence.",
        "prompt": "Explain dynamic programming by building up a DP table cell by cell from a recurrence."
      }
    ]
  }
];
