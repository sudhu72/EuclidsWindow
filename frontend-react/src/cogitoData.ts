// Cogito Gallery manifest — 28 self-contained interactive visualizations
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
