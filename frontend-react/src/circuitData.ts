// Circuit Builder — data for the logic-gate circuit game in the Formal Logic
// Lab. Separate from GATE_PUZZLES in logicData.ts (that game asks you to type
// a boolean formula; this one asks you to actually wire gates together).

export type GateType = "AND" | "OR" | "NOT" | "XOR" | "NAND" | "NOR";

export const ALL_GATE_TYPES: GateType[] = ["AND", "OR", "NOT", "XOR", "NAND", "NOR"];

/** True (inverting) for gates that carry the small output bubble in the diagram. */
export const INVERTING: Record<GateType, boolean> = {
  AND: false, OR: false, XOR: false, NOT: true, NAND: true, NOR: true,
};

export function gateArity(type: GateType): 1 | 2 {
  return type === "NOT" ? 1 : 2;
}

export function evalGate(type: GateType, a: number, b: number): number {
  switch (type) {
    case "AND": return a && b ? 1 : 0;
    case "OR": return a || b ? 1 : 0;
    case "NOT": return a ? 0 : 1;
    case "XOR": return a ^ b;
    case "NAND": return a && b ? 0 : 1;
    case "NOR": return a || b ? 0 : 1;
  }
}

export interface CircuitChallenge {
  title: string;
  blurb: string;
  inputLabels: string[];
  target: (...bits: number[]) => number;
  allowedGates: GateType[];
  hint: string;
}

export const CIRCUIT_CHALLENGES: CircuitChallenge[] = [
  {
    title: "Build XOR — using only AND, OR, and NOT",
    blurb: "XOR (\"exactly one of these, not both\") isn't one of your gate pieces this round. Build it out of the three most basic gates there are.",
    inputLabels: ["A", "B"],
    target: (a, b) => a ^ b,
    allowedGates: ["AND", "OR", "NOT"],
    hint: "A XOR B is true when (A is true and B is false) or (A is false and B is true). You'll need two AND gates, an OR, and two NOTs.",
  },
  {
    title: "Build a NOT gate — using only NAND",
    blurb: "This is half of the classic \"NAND is universal\" result: every other gate can be built from NAND alone. Start with the simplest case.",
    inputLabels: ["A"],
    target: (a) => (a ? 0 : 1),
    allowedGates: ["NAND"],
    hint: "Feed the same input into both sides of a single NAND gate.",
  },
  {
    title: "Build Majority Vote — 2 of 3",
    blurb: "Output 1 when at least two of the three inputs are 1. This is how fault-tolerant systems vote in aerospace and distributed computing.",
    inputLabels: ["A", "B", "C"],
    target: (a, b, c) => (a + b + c >= 2 ? 1 : 0),
    allowedGates: ["AND", "OR"],
    hint: "Majority = (A AND B) OR (A AND C) OR (B AND C) — three AND gates feeding one OR.",
  },
];
