// Matrix & Vector Lab copy — the four-level "what is a matrix, really" prose
// shown under the lab, matching the pattern used by logicData.ts/cryptoData.ts.

export type Level = "kids" | "teen" | "college" | "adult";
export const LEVELS: Level[] = ["kids", "teen", "college", "adult"];

export const PREREQ =
  "**Math you’ll use:** *Linear algebra* — a matrix is a grid of numbers that " +
  "moves points around the plane (or space) in a consistent way: straight lines " +
  "stay straight, and the origin never moves.";

export const LEVEL_PROSE: Record<Level, string> = {
  kids:
    "Think of a matrix as a **recipe for stretching or spinning a picture**. " +
    "Draw a square on a piece of rubber, then pull, squish, or twist it — every " +
    "point on the rubber moves according to the same simple rule. A matrix is " +
    "just the numbers that describe *how much* to pull, squish, or twist. Try " +
    "different numbers above and watch the square change shape!",
  teen:
    "A matrix is a grid of numbers that tells you how to move every point on the " +
    "plane at once, using the same rule. Multiplying a matrix by a vector " +
    "(a point, as an arrow from the origin) gives you the new location of that " +
    "point after the transformation. The columns of the matrix are actually the " +
    "*images* of the basis vectors — where (1,0) and (0,1) land tells you " +
    "everything about where every other point lands, because every point is a " +
    "combination of those two.",
  college:
    "A matrix A ∈ ℝ^(m×n) represents a **linear map** T: ℝⁿ → ℝᵐ satisfying " +
    "T(u + v) = T(u) + T(v) and T(cv) = cT(v); every linear map between " +
    "finite-dimensional vector spaces has a matrix representation once bases are " +
    "fixed. The determinant of a square matrix is the signed scale factor by " +
    "which the transform changes area (2D) or volume (3D) — det = 0 means the " +
    "transform collapses dimension (the matrix is singular, non-invertible). " +
    "Composition of transforms is matrix multiplication: applying B then A is " +
    "the single matrix AB.",
  adult:
    "Matrices are the working language of computer graphics (every rotation, " +
    "scale, and camera projection your GPU does is a matrix multiply — 3D " +
    "engines use 4×4 homogeneous matrices so translation becomes multiplication " +
    "too, not just addition), robotics (joint transforms), and machine learning " +
    "(a neural network layer is literally y = Wx + b — a matrix multiply plus a " +
    "shift, stacked dozens of layers deep). Eigenvalues and eigenvectors — " +
    "directions a matrix only stretches, never rotates — underlie PCA, Google's " +
    "PageRank, and vibration analysis in structural engineering.",
};
