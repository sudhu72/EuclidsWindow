// Matrix arithmetic for the Matrix Lab. Dimension mismatches throw with a
// message that names the shapes, because getting that wrong is the whole
// lesson the first few times.

export type Matrix = number[][];
export type Vec = number[];

export const zeros = (rows: number, cols: number): Matrix =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

export const shape = (m: Matrix) => `${m.length}×${m[0]?.length ?? 0}`;

export function add(a: Matrix, b: Matrix): Matrix {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error(`Cannot add ${shape(a)} to ${shape(b)} — addition needs identical shapes.`);
  }
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error(`Cannot subtract ${shape(b)} from ${shape(a)} — subtraction needs identical shapes.`);
  }
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  if (a[0].length !== b.length) {
    throw new Error(
      `Cannot multiply ${shape(a)} by ${shape(b)} — the inner dimensions (${a[0].length} and ${b.length}) must match.`
    );
  }
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0))
  );
}

export function applyToVector(m: Matrix, v: Vec): Vec {
  if (m[0].length !== v.length) {
    throw new Error(`Cannot apply a ${shape(m)} matrix to a ${v.length}-vector.`);
  }
  return m.map((row) => row.reduce((sum, val, i) => sum + val * v[i], 0));
}

export type Operation = "add" | "subtract" | "multiply";

export const OPERATIONS: [Operation, string][] = [
  ["add", "C = A + B"],
  ["subtract", "C = A − B"],
  ["multiply", "C = A × B"],
];

export function applyOperation(a: Matrix, b: Matrix, op: Operation): Matrix {
  if (op === "add") return add(a, b);
  if (op === "subtract") return subtract(a, b);
  return multiply(a, b);
}

/**
 * Project a result onto the x-y plane. A 3-vector is treated as homogeneous
 * coordinates, so a 3×3 transform can be drawn on the same grid as a 2×2 one.
 */
export function projectXY(vec: Vec): [number, number] {
  if (vec.length <= 2) return [vec[0] ?? 0, vec[1] ?? 0];
  const z = Math.abs(vec[2]) < 1e-8 ? 1 : vec[2];
  return [vec[0] / z, vec[1] / z];
}

/** The unit square, closed, ready to be drawn as a path. */
export const UNIT_SQUARE: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

/** Push the unit square through a transform, in 2-D or homogeneous 3-D. */
export function transformSquare(c: Matrix): [number, number][] {
  const n = c.length;
  return UNIT_SQUARE.map((p) => {
    if (n === 2 && c[0].length === 2) {
      return [c[0][0] * p[0] + c[0][1] * p[1], c[1][0] * p[0] + c[1][1] * p[1]] as [number, number];
    }
    if (c[0].length === 3) return projectXY(applyToVector(c, [p[0], p[1], 1]));
    return p;
  });
}

export const approxEq = (a: number, b: number, eps = 1e-6) =>
  Math.abs((a || 0) - (b || 0)) <= eps;

export interface WorkCell {
  label: string;
  entered: number;
  expected: number;
  ok: boolean;
}

/** Compare a learner's predicted C and C·v against the truth. */
export function checkWork(
  predictedC: Matrix,
  predictedCv: Vec,
  c: Matrix,
  cv: Vec
): { cells: WorkCell[]; wrong: WorkCell[] } {
  const cells: WorkCell[] = [];
  for (let i = 0; i < c.length; i++) {
    for (let j = 0; j < c[0].length; j++) {
      const entered = predictedC[i]?.[j] ?? 0;
      cells.push({ label: `C${i + 1}${j + 1}`, entered, expected: c[i][j], ok: approxEq(entered, c[i][j]) });
    }
  }
  const axes = ["x", "y", "z", "w"];
  for (let i = 0; i < cv.length; i++) {
    const entered = predictedCv[i] ?? 0;
    cells.push({
      label: `C·v ${axes[i] ?? i + 1}`,
      entered,
      expected: cv[i],
      ok: approxEq(entered, cv[i]),
    });
  }
  return { cells, wrong: cells.filter((c2) => !c2.ok) };
}

/** The arithmetic written out term by term, as you would do it on paper. */
export function byHandSteps(a: Matrix, b: Matrix, op: Operation, v: Vec): string[] {
  const lines: string[] = [];
  const c = applyOperation(a, b, op);
  const symbol = op === "subtract" ? "−" : "+";

  for (let i = 0; i < c.length; i++) {
    for (let j = 0; j < c[0].length; j++) {
      if (op === "multiply") {
        const terms = a[i].map((av, k) => `(${av})(${b[k][j]})`).join(" + ");
        lines.push(`C${i + 1}${j + 1} = ${terms} = ${c[i][j]}`);
      } else {
        lines.push(`C${i + 1}${j + 1} = ${a[i][j]} ${symbol} ${b[i][j]} = ${c[i][j]}`);
      }
    }
  }

  if (c[0].length === v.length) {
    const cv = applyToVector(c, v);
    const axes = ["x", "y", "z", "w"];
    for (let i = 0; i < cv.length; i++) {
      const terms = c[i].map((cval, k) => `(${cval})(${v[k]})`).join(" + ");
      lines.push(`(C·v)${axes[i] ?? i + 1} = ${terms} = ${cv[i]}`);
    }
  }
  return lines;
}
