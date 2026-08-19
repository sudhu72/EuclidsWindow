// Cogito Gallery manifest — 61 self-contained interactive visualizations
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
