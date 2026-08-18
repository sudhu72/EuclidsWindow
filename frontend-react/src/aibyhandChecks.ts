// "Try it yourself" checks for the AI by Hand lab — one per exercise, keyed by
// exercise id. Every number here is copied from that exercise's own `byhand`
// stage in aibyhandData.ts (already verified in NumPy there), never invented
// fresh — this only asks the learner to reproduce and check a number that's
// already correct in the walkthrough above it, not a new unverified claim.

import { M } from "./aibyhandData";

export interface CheckField {
  label: string;
  answer: number;
  tolerance: number;
}

export interface ByHandCheck {
  prompt: string;
  fields: CheckField[];
  successMsg: string;
}

export const BYHAND_CHECKS: Record<string, ByHandCheck> = {
  feedforward: {
    prompt: `Using ${M("x=[1,2]")}, row 1 of ${M("W")} is ${M("[1,0]")}, and ${M("b_1=0")}: compute ${M("z_1")}. Then row 3 of ${M("W")} is ${M("[1,1]")} with ${M("b_3=-1")}: compute ${M("z_3")}.`,
    fields: [
      { label: "z₁", answer: 1, tolerance: 0.01 },
      { label: "z₃", answer: 2, tolerance: 0.01 },
    ],
    successMsg: "Right — z = [1, 2, 2], and since every entry is already positive, ReLU leaves it unchanged.",
  },
  backprop: {
    prompt: `With ${M("\\frac{dL}{da}=-0.2689")}, ${M("\\frac{da}{dz}=0.1966")}, and ${M("\\frac{dz}{dw}=2")}: multiply the three sensitivities to get ${M("\\frac{dL}{dw}")}.`,
    fields: [{ label: "dL/dw", answer: -0.1058, tolerance: 0.005 }],
    successMsg: "Right — the chain rule is just multiplying sensitivities: -0.2689 × 0.1966 × 2 ≈ -0.1058.",
  },
  dft: {
    prompt: `Signal ${M("x=[1,0,-1,0]")}. Compute ${M("X_0")} (just add the four samples) and ${M("X_1")} (the one-cycle correlation, worked out in the steps above).`,
    fields: [
      { label: "X₀", answer: 0, tolerance: 0.01 },
      { label: "X₁", answer: 2, tolerance: 0.01 },
    ],
    successMsg: "Right — X = [0, 2, 0, 2]. All the energy sits at frequency 1 (and its mirror at 3).",
  },
  batchnorm: {
    prompt: `Batch ${M("[2,4,6,8]")}: compute the mean ${M("\\mu")} and the variance ${M("\\sigma^2")}.`,
    fields: [
      { label: "mean μ", answer: 5, tolerance: 0.01 },
      { label: "variance σ²", answer: 5, tolerance: 0.05 },
    ],
    successMsg: "Right — mean 5, variance 5. Every later step (the z-score, then γ/β) builds on these two numbers.",
  },
  dropout: {
    prompt: `Activations ${M("h=[2,4,6,8]")}, mask ${M("[1,0,1,0]")}, kept entries scaled by ${M("1/(1-p)=2")}. What does entry 1 (${M("h_1=2")}, kept) become? What does entry 2 (${M("h_2=4")}, dropped) become?`,
    fields: [
      { label: "entry 1 after dropout", answer: 4, tolerance: 0.01 },
      { label: "entry 2 after dropout", answer: 0, tolerance: 0.01 },
    ],
    successMsg: "Right — [4, 0, 12, 0]. Kept entries get scaled up to keep the average unchanged; dropped entries go to zero.",
  },
  vectordb: {
    prompt: `Embeddings ${M("a=[1,2]")}, ${M("b=[2,3]")}. Compute the dot product ${M("a\\cdot b")}, then the cosine similarity ${M("\\cos\\theta = a\\cdot b/(\\lVert a\\rVert\\lVert b\\rVert)")} using ${M("\\lVert a\\rVert=\\sqrt5\\approx2.236,\\ \\lVert b\\rVert=\\sqrt{13}\\approx3.606")}.`,
    fields: [
      { label: "a · b", answer: 8, tolerance: 0.01 },
      { label: "cos θ", answer: 0.9923, tolerance: 0.01 },
    ],
    successMsg: "Right — dot product 8, cosine ≈ 0.9923: these two embeddings point in almost the same direction.",
  },
  rnn: {
    prompt: `${M("h_{prev}=0.5,\\ x=1,\\ W_h=0.8,\\ W_x=0.4")}. Compute ${M("h_t=\\tanh(W_h h_{prev}+W_x x)")}. (${M("\\tanh(0.8)\\approx0.664")}.)`,
    fields: [{ label: "h_t", answer: 0.664, tolerance: 0.005 }],
    successMsg: "Right — h_t ≈ 0.664. That value is what gets fed back in as the memory for the next timestep.",
  },
  lstm: {
    prompt: `Using the gates already computed above (${M("f=0.668,\\ i=0.657,\\ \\tilde c=0.691,\\ c_{prev}=0.2")}): compute the new memory ${M("c_t=f\\,c_{prev}+i\\,\\tilde c")}.`,
    fields: [{ label: "c_t", answer: 0.588, tolerance: 0.01 }],
    successMsg: "Right — c_t ≈ 0.588. That's the conveyor-belt memory riding forward almost untouched by the gate multiplications.",
  },
  autoencoder: {
    prompt: `Original ${M("x=[1,2,3]")}, rebuilt ${M("\\hat x=[1,0,3]")}. What is the reconstruction error at the middle position (${M("\\hat x_2-x_2")})?`,
    fields: [{ label: "error at position 2", answer: -2, tolerance: 0.01 }],
    successMsg: "Right — error -2 at the position the 2-wide bottleneck couldn't keep. That's exactly what training pushes the network to reduce.",
  },
  vae: {
    prompt: `Encoder outputs ${M("\\mu=1.0,\\ \\sigma=0.5")}, sampled noise ${M("\\epsilon=0.3")}. Compute ${M("z=\\mu+\\sigma\\epsilon")}.`,
    fields: [{ label: "z", answer: 1.15, tolerance: 0.01 }],
    successMsg: "Right — z = 1.15. Because z is a simple, differentiable function of μ, σ, and ε, backprop can flow straight through the sampling step.",
  },
  selfattention: {
    prompt: `Row 1's attention scores after softmax are given as ${M("[0.67,0.33]")} — what are the two weights (in order)?`,
    fields: [
      { label: "weight on token 1", answer: 0.67, tolerance: 0.01 },
      { label: "weight on token 2", answer: 0.33, tolerance: 0.01 },
    ],
    successMsg: "Right — 0.67 and 0.33. Token 1 mostly attends to itself but pulls in a third of token 2's value.",
  },
  multihead: {
    prompt: `Head B is described as weighting ${M("[0.10,0.90]")} — a distant match. What's Head B's weight on the second (distant) token?`,
    fields: [{ label: "Head B, weight 2", answer: 0.9, tolerance: 0.01 }],
    successMsg: "Right — 0.90. Head A (nearby words) and Head B (a distant match) specialize on different relationships, then get concatenated.",
  },
  transformer: {
    prompt: `Logits ${M("[2,1,0]")} become softmax probabilities ${M("[0.665,0.245,0.090]")}. What's the probability assigned to the highest logit?`,
    fields: [{ label: "softmax of the top logit", answer: 0.665, tolerance: 0.01 }],
    successMsg: "Right — 0.665. Softmax turns the biggest logit into the biggest (but not certain) probability — that's how the model picks its next word.",
  },
  gan: {
    prompt: `Detector says ${M("D(\\text{real})=0.9,\\ D(\\text{fake})=0.2")}. Compute the detective's loss ${M("-(\\log0.9+\\log(1-0.2))")} and the forger's loss ${M("-\\log0.2")}.`,
    fields: [
      { label: "detective loss", answer: 0.329, tolerance: 0.01 },
      { label: "forger loss", answer: 1.61, tolerance: 0.01 },
    ],
    successMsg: "Right — 0.329 and 1.61. The two losses pull in opposite directions, which is exactly what makes it a game.",
  },
  unet: {
    prompt: `The down path halves the image each step: ${M("16\\times16\\to8\\times8\\to4\\times4")}. The up path exactly reverses it. What size comes right after the first upsample from ${M("4\\times4")}? And the final size?`,
    fields: [
      { label: "size after first upsample", answer: 8, tolerance: 0.01 },
      { label: "final output size", answer: 16, tolerance: 0.01 },
    ],
    successMsg: "Right — 8×8, then 16×16, mirroring the down path exactly. That symmetry is why skip connections can reach across to matching sizes.",
  },
  sora: {
    prompt: `The example says a real frame is noised \"100 times\" until it becomes static. How many forward noising steps does that description use?`,
    fields: [{ label: "number of noising steps", answer: 100, tolerance: 0.5 }],
    successMsg: "Right — 100 steps. Generation just runs that same process in reverse, one small denoise at a time.",
  },
  superposition: {
    prompt: `Three vectors spaced ${M("120^\\circ")} apart have pairwise dot products of ${M("\\cos(120^\\circ)")}. What's that value?`,
    fields: [{ label: "cos(120°)", answer: -0.5, tolerance: 0.02 }],
    successMsg: "Right — -0.5. Close to (but not exactly) 0, which is why three \"almost independent\" directions can share a 2D space.",
  },
  rlhf: {
    prompt: `Humans ranked A over B, giving reward-model scores ${M("r(A)=1.2")} and ${M("r(B)=0.3")}. What is ${M("r(A)-r(B)")} — the margin the reward model has to learn to produce?`,
    fields: [{ label: "r(A) − r(B)", answer: 0.9, tolerance: 0.01 }],
    successMsg: "Right — a margin of 0.9. Gradient ascent on the policy pushes it toward answers the reward model scores higher, by roughly that margin.",
  },
  deepseek: {
    prompt: `Of 64 feed-forward experts, the router activates the top 2 per token. What fraction of the experts actually run (as a decimal)?`,
    fields: [{ label: "fraction of experts active", answer: 0.03125, tolerance: 0.002 }],
    successMsg: "Right — 2/64 = 0.03125. Same knowledge available, a tiny fraction of the compute spent per token.",
  },
};
