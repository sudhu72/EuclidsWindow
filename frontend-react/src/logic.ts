// Propositional logic: tokenizer, recursive-descent parser and evaluator.
//
// Shared by the truth-table builder and the gate challenges. The classic lab
// checked gate answers by building a string and handing it to `Function()`,
// which executes whatever the user typed; parsing it properly costs nothing
// extra here since the parser already existed for truth tables.

export type Node =
  | { op: "VAR"; name: string }
  | { op: "NOT"; a: Node }
  | { op: "AND" | "OR" | "IMPLIES" | "IFF"; a: Node; b: Node };

export function tokenize(expr: string): string[] {
  return expr
    .replace(/<->/g, " IFF ")
    .replace(/->/g, " IMPLIES ")
    .replace(/&&/g, " AND ")
    .replace(/\|\|/g, " OR ")
    .replace(/!/g, " NOT ")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const KEYWORDS = new Set(["AND", "OR", "NOT", "IMPLIES", "IFF", "(", ")"]);

/** Single-letter variables, in alphabetical order. */
export function extractVars(tokens: string[]): string[] {
  const vars = new Set<string>();
  for (const t of tokens) if (/^[A-Z]$/.test(t) && !KEYWORDS.has(t)) vars.add(t);
  return [...vars].sort();
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: string[]) {}

  parse(): Node {
    const node = this.expr();
    if (this.pos < this.tokens.length) {
      throw new Error(`unexpected "${this.tokens[this.pos]}"`);
    }
    return node;
  }

  private expr(): Node {
    let left = this.or();
    while (this.peek() === "IMPLIES" || this.peek() === "IFF") {
      const op = this.next() as "IMPLIES" | "IFF";
      left = { op, a: left, b: this.or() };
    }
    return left;
  }
  private or(): Node {
    let left = this.and();
    while (this.peek() === "OR") {
      this.next();
      left = { op: "OR", a: left, b: this.and() };
    }
    return left;
  }
  private and(): Node {
    let left = this.not();
    while (this.peek() === "AND") {
      this.next();
      left = { op: "AND", a: left, b: this.not() };
    }
    return left;
  }
  private not(): Node {
    if (this.peek() === "NOT") {
      this.next();
      return { op: "NOT", a: this.not() };
    }
    return this.atom();
  }
  private atom(): Node {
    const t = this.next();
    if (t === undefined) throw new Error("unexpected end of formula");
    if (t === "(") {
      const node = this.expr();
      if (this.next() !== ")") throw new Error("missing closing parenthesis");
      return node;
    }
    if (!/^[A-Z]$/.test(t)) throw new Error(`"${t}" is not a variable`);
    return { op: "VAR", name: t };
  }

  private peek() {
    return this.tokens[this.pos];
  }
  private next() {
    return this.tokens[this.pos++];
  }
}

export const parse = (tokens: string[]): Node => new Parser(tokens).parse();

export function evaluate(node: Node, env: Record<string, number>): 0 | 1 {
  switch (node.op) {
    case "VAR":
      return env[node.name] ? 1 : 0;
    case "NOT":
      return evaluate(node.a, env) ? 0 : 1;
    case "AND":
      return evaluate(node.a, env) && evaluate(node.b, env) ? 1 : 0;
    case "OR":
      return evaluate(node.a, env) || evaluate(node.b, env) ? 1 : 0;
    case "IMPLIES":
      return !evaluate(node.a, env) || evaluate(node.b, env) ? 1 : 0;
    case "IFF":
      return evaluate(node.a, env) === evaluate(node.b, env) ? 1 : 0;
  }
}

export interface TruthTable {
  vars: string[];
  /** One row per assignment: the variable values, then the result. */
  rows: { values: number[]; result: 0 | 1 }[];
  trueCount: number;
  verdict: "tautology" | "contradiction" | "contingent";
}

/** All 2^n assignments for a formula. Throws on a malformed formula. */
export function truthTable(formula: string, forcedVars?: string[]): TruthTable {
  const tokens = tokenize(formula);
  const vars = forcedVars ?? extractVars(tokens);
  if (vars.length === 0) throw new Error("no variables found — use single letters A–Z");
  if (vars.length > 6) throw new Error("use at most 6 variables");
  const tree = parse(tokens);

  const rows: TruthTable["rows"] = [];
  let trueCount = 0;
  const total = 1 << vars.length;
  for (let r = 0; r < total; r++) {
    const env: Record<string, number> = {};
    const values: number[] = [];
    for (let c = 0; c < vars.length; c++) {
      const val = (r >> (vars.length - 1 - c)) & 1;
      env[vars[c]] = val;
      values.push(val);
    }
    const result = evaluate(tree, env);
    if (result) trueCount++;
    rows.push({ values, result });
  }

  return {
    vars,
    rows,
    trueCount,
    verdict:
      trueCount === total ? "tautology" : trueCount === 0 ? "contradiction" : "contingent",
  };
}

/**
 * Evaluate a formula over given variables. Returns null when the formula does
 * not parse, so callers can show "ERR" per row rather than failing outright.
 */
export function safeEvaluator(
  formula: string,
  vars: string[]
): ((env: Record<string, number>) => 0 | 1) | null {
  try {
    const tree = parse(tokenize(formula));
    // Reject variables the puzzle does not define, rather than treating them as
    // false and quietly marking a wrong answer right.
    const used = extractVars(tokenize(formula));
    if (used.some((v) => !vars.includes(v))) return null;
    return (env) => evaluate(tree, env);
  } catch {
    return null;
  }
}
