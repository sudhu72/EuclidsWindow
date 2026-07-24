// AI by Hand — Feynman discovery walkthroughs (ported natively from the classic
// lab). Content is curated & static; every by-hand number was verified in NumPy.

export interface Exercise {
  id: string;
  title: string;
  tier: string;
  prereqs: string[];
  oneLiner: string;
  stages: {
    know: string;
    question: string;
    byhand: string;
    discover: string;
    explain: string;
    connect: { back: string[]; forward: string[] };
  };
}

const M = (s: string): string => `\\(${s}\\)`; // inline math shorthand
// Small helper to render a matrix/vector as an HTML table.
function mat(rows: string[][]): string {
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="abh-mat"><tbody>${body}</tbody></table>`;
}

export const EXERCISES: Exercise[] = [
  // ── Tier 1: Foundations ────────────────────────────────────────────
  {
    id: "feedforward", title: "Feed-Forward (a neuron layer)", tier: "Foundations",
    prereqs: ["dot product", "matrix × vector", "ReLU"],
    oneLiner: "A layer is just: multiply, add, then bend.",
    stages: {
      know: "You can take a <b>dot product</b>: multiply matching entries and add. You can multiply a matrix by a vector (one dot product per row).",
      question: "How can a machine turn 2 input numbers into 3 useful features? What is the simplest mixing rule that can also make non-linear decisions?",
      byhand: `Input ${M("x=[1,2]")}. Weights ${mat([["1","0"],["0","1"],["1","1"]])} bias ${M("b=[0,0,-1]")}.
        <div class="abh-step">1) Each output row is a dot product: ${M("z_1=1\\cdot1+0\\cdot2+0=1")}, ${M("z_2=0\\cdot1+1\\cdot2+0=2")}, ${M("z_3=1\\cdot1+1\\cdot2-1=2")}. So ${M("z=[1,2,2]")}.</div>
        <div class="abh-step">2) Bend with ReLU (keep positives): ${M("\\text{ReLU}(z)=[1,2,2]")}.</div>`,
      discover: `You just built ${M("a=\\text{ReLU}(Wx+b)")}. Every layer of every network is this. Stack two and you can carve any decision region — because the ReLU 'bend' is what escapes straight-line thinking.`,
      explain: "A neuron listens to all inputs, weights how much it cares about each, adds them up, and fires only if the total clears a bar. A layer is many neurons listening at once.",
      connect: { back: ["dot product", "linear combinations"], forward: ["backpropagation", "self-attention"] },
    },
  },
  {
    id: "backprop", title: "Backpropagation", tier: "Foundations",
    prereqs: ["derivative", "chain rule"],
    oneLiner: "The chain rule, walked backwards through the network.",
    stages: {
      know: "The <b>chain rule</b>: if a change flows through steps, multiply the sensitivities of each step. " + M("\\frac{dL}{dw}=\\frac{dL}{da}\\cdot\\frac{da}{dz}\\cdot\\frac{dz}{dw}") + ".",
      question: "A network guessed wrong. Which knob (weight) do I turn, and by how much, to reduce the error? Trying all knobs is hopeless — can calculus point straight at the answer?",
      byhand: `One neuron: ${M("a=\\sigma(wx+b)")}, with ${M("x=2,\\ w=0.5,\\ b=0")}, target ${M("t=1")}, loss ${M("L=\\tfrac12(a-t)^2")}.
        <div class="abh-step">Forward: ${M("z=0.5\\cdot2=1")}, ${M("a=\\sigma(1)=0.7311")}, ${M("L=0.0362")}.</div>
        <div class="abh-step">Backward (multiply the three sensitivities): ${M("\\frac{dL}{da}=a-t=-0.2689")}, ${M("\\frac{da}{dz}=a(1-a)=0.1966")}, ${M("\\frac{dz}{dw}=x=2")}.</div>
        <div class="abh-step">${M("\\frac{dL}{dw}=-0.2689\\cdot0.1966\\cdot2=-0.1058")}. Negative → nudging ${M("w")} up lowers the loss.</div>`,
      discover: "Do this for every weight, reusing the pieces you already computed as you move backward from the output. That reuse — computing each layer's sensitivity once and passing it back — <em>is</em> backpropagation.",
      explain: "Blame flows backward. The output says 'you were 0.27 too low'; each layer passes that blame to the layer before it, scaled by how much it mattered, until every weight knows its share.",
      connect: { back: ["chain rule", "feedforward"], forward: ["RNN", "transformer", "GAN"] },
    },
  },
  {
    id: "dft", title: "Discrete Fourier Transform", tier: "Foundations",
    prereqs: ["complex numbers", "cosine/sine", "dot product"],
    oneLiner: "Ask a signal: 'how much of each pure wave are you?'",
    stages: {
      know: "You met the octave in the Guitar lab: a signal is a sum of pure waves. A dot product measures 'how much of B is inside A.'",
      question: "Given 4 samples in time, how do I find which frequencies they contain — without hearing them?",
      byhand: `Signal ${M("x=[1,0,-1,0]")}. Correlate with each frequency ${M("k")} using ${M("X_k=\\sum_n x_n e^{-2\\pi i kn/4}")}.
        <div class="abh-step">${M("k=0")} (constant): ${M("1+0-1+0=0")}.</div>
        <div class="abh-step">${M("k=1")} (one cycle): ${M("1\\cdot1+0\\cdot(-i)+(-1)(-1)+0\\cdot i=2")}.</div>
        <div class="abh-step">Result ${M("X=[0,2,0,2]")}: all the energy is at frequency 1 (and its mirror at 3). The signal <em>is</em> a single cosine.</div>`,
      discover: "Each ${M('X_k')} is just a dot product of the signal against a pure rotating wave. Stack them and you have the DFT matrix — the same idea the FFT computes fast.",
      explain: "Play the signal against every tuning fork at once; each fork rings in proportion to how much of that pitch is present.",
      connect: { back: ["complex numbers", "harmonic series"], forward: ["SORA (diffusion)", "signal processing"] },
    },
  },
  {
    id: "batchnorm", title: "Batch Normalization", tier: "Foundations",
    prereqs: ["mean & variance", "standardization (z-score)"],
    oneLiner: "Re-center and re-scale each layer so training stops wobbling.",
    stages: {
      know: "The z-score: subtract the mean, divide by the standard deviation, and any list becomes mean 0, spread 1.",
      question: "Deep layers keep shifting the ground under each other, so training crawls. What if we forced every layer's inputs onto a stable scale?",
      byhand: `Batch of activations ${M("[2,4,6,8]")}.
        <div class="abh-step">Mean ${M("\\mu=5")}, variance ${M("\\sigma^2=5")}.</div>
        <div class="abh-step">Normalize ${M("\\hat x=(x-\\mu)/\\sqrt{\\sigma^2+\\epsilon}")}: ${M("[-1.34,-0.45,0.45,1.34]")}.</div>
        <div class="abh-step">Then a learnable ${M("\\gamma\\hat x+\\beta")} lets the network re-stretch if it wants to.</div>`,
      discover: "Normalize per feature across the batch, keep a learnable scale/shift, and remember running stats for inference. That's the whole trick that let very deep nets train reliably.",
      explain: "Before each layer speaks, translate everyone to the same units. No layer gets drowned out just because its numbers happened to be big.",
      connect: { back: ["mean & variance", "z-score"], forward: ["dropout", "training deep nets"] },
    },
  },
  {
    id: "dropout", title: "Dropout", tier: "Foundations",
    prereqs: ["probability", "expectation"],
    oneLiner: "Randomly silence neurons so none becomes a crutch.",
    stages: {
      know: "Expectation: if you keep a value with probability ${M('1-p')}, scaling the survivors by ${M('1/(1-p)')} keeps the average the same.",
      question: "A network memorizes the training set by leaning on a few neurons. How do I force it to spread the knowledge and generalize?",
      byhand: `Activations ${M("h=[2,4,6,8]")}, drop probability ${M("p=0.5")}, random mask ${M("[1,0,1,0]")}.
        <div class="abh-step">Zero the dropped, scale the kept by ${M("1/(1-p)=2")}: ${M("[4,0,12,0]")}.</div>
        <div class="abh-step">At test time: no dropping, no scaling — the scaling already matched the averages.</div>`,
      discover: "Each training step trains a different random sub-network; averaging them all is a free ensemble. The inverted scaling is what makes train and test agree.",
      explain: "Practice with a random half of your team benched each day — everyone learns to contribute, so the whole team is robust on game day.",
      connect: { back: ["probability", "expectation"], forward: ["regularization", "ensembles"] },
    },
  },
  {
    id: "vectordb", title: "Vector Database", tier: "Foundations",
    prereqs: ["vectors", "dot product", "cosine similarity"],
    oneLiner: "Meaning becomes geometry; search becomes 'nearest point.'",
    stages: {
      know: "Cosine similarity: ${M('\\cos\\theta=\\frac{a\\cdot b}{\\lVert a\\rVert\\,\\lVert b\\rVert}')} — 1 means same direction, 0 means unrelated.",
      question: "How do I find the document 'most similar in meaning' to a query, when meaning isn't keywords?",
      byhand: `Two embeddings ${M("a=[1,2]")}, ${M("b=[2,3]")}.
        <div class="abh-step">${M("a\\cdot b=1\\cdot2+2\\cdot3=8")}, ${M("\\lVert a\\rVert=\\sqrt5,\\ \\lVert b\\rVert=\\sqrt{13}")}.</div>
        <div class="abh-step">${M("\\cos\\theta=8/(\\sqrt5\\sqrt{13})=0.9923")} → almost the same direction, so very similar.</div>`,
      discover: "Embed everything as vectors, then 'search' is just: return the vectors with the highest cosine to the query. This is exactly the RAG library in this app.",
      explain: "Turn every idea into an arrow. Similar ideas point the same way. To search, find the arrows pointing most like your question.",
      connect: { back: ["vectors", "cosine similarity"], forward: ["RAG / this app's library", "self-attention"] },
    },
  },

  // ── Tier 2: Sequences & memory ─────────────────────────────────────
  {
    id: "rnn", title: "Recurrent Neural Network (RNN)", tier: "Sequences & memory",
    prereqs: ["feedforward", "tanh"],
    oneLiner: "A neuron that feeds its own last answer back in.",
    stages: {
      know: "A neuron computes ${M('\\tanh(\\text{weighted sum})')}. ${M('\\tanh')} squashes to ${M('(-1,1)')}.",
      question: "Text and audio are sequences — the meaning of 'it' depends on earlier words. How can a fixed-size neuron remember what came before?",
      byhand: `State ${M("h_{prev}=0.5")}, input ${M("x=1")}, ${M("W_h=0.8,\\ W_x=0.4")}.
        <div class="abh-step">${M("h_t=\\tanh(W_h h_{prev}+W_x x)=\\tanh(0.8\\cdot0.5+0.4\\cdot1)=\\tanh(0.8)=0.664")}.</div>
        <div class="abh-step">Feed ${M("h_t")} back in for the next word — memory is the loop.</div>`,
      discover: "Reuse the same weights at every timestep and let ${M('h')} carry the past. Unroll it and backprop as usual ('backprop through time').",
      explain: "Read one word, jot a summary, read the next word with that summary in hand. The jotted note is the hidden state.",
      connect: { back: ["feedforward", "backpropagation"], forward: ["LSTM", "transformer"] },
    },
  },
  {
    id: "lstm", title: "LSTM (Long Short-Term Memory)", tier: "Sequences & memory",
    prereqs: ["RNN", "sigmoid gates"],
    oneLiner: "An RNN with valves that decide what to forget and keep.",
    stages: {
      know: "A sigmoid ${M('\\sigma')} outputs 0–1 — a perfect 'valve': 0 closes, 1 opens.",
      question: "Plain RNNs forget long-range facts (gradients vanish). How can memory survive across many steps?",
      byhand: `${M("h=0.5,\\ x=1,\\ c_{prev}=0.2")}. Forget gate ${M("f=\\sigma(0.6\\cdot0.5+0.9\\cdot1-0.5)=0.668")}.
        <div class="abh-step">Input gate ${M("i=0.657")}, candidate ${M("\\tilde c=\\tanh(\\cdots)=0.691")}, output gate ${M("o=0.711")}.</div>
        <div class="abh-step">New memory ${M("c_t=f\\,c_{prev}+i\\,\\tilde c=0.668\\cdot0.2+0.657\\cdot0.691=0.588")}.</div>
        <div class="abh-step">New state ${M("h_t=o\\,\\tanh(c_t)=0.376")}.</div>`,
      discover: "Add a straight 'conveyor belt' ${M('c')} that information rides with only gentle multiplications by gates — so gradients don't vanish and facts persist.",
      explain: "A notebook with three valves: one erases old notes, one writes new ones, one decides what to read aloud now.",
      connect: { back: ["RNN", "sigmoid"], forward: ["attention", "transformer"] },
    },
  },
  {
    id: "autoencoder", title: "Autoencoder", tier: "Sequences & memory",
    prereqs: ["feedforward", "compression"],
    oneLiner: "Squeeze data through a bottleneck, then rebuild it.",
    stages: {
      know: "A layer maps vectors to smaller vectors (fewer rows in ${M('W')}). Reconstruction error = how far the rebuilt vector is from the original.",
      question: "Can a network learn the <em>essence</em> of data with no labels — figure out what matters by trying to reproduce its own input?",
      byhand: `${M("x=[1,2,3]")}. Encoder keeps entries 1 and 3: latent ${M("z=[1,3]")} (3→2, compressed).
        <div class="abh-step">Decoder rebuilds ${M("\\hat x=[1,0,3]")}. Error ${M("\\hat x-x=[0,-2,0]")} — it lost the middle number.</div>
        <div class="abh-step">Training pushes weights to lose less; the bottleneck forces it to keep only what matters.</div>`,
      discover: "Minimize ${M('\\lVert x-\\hat x\\rVert^2')} through a narrow middle layer and the network discovers a compressed code — unsupervised features.",
      explain: "Explain a picture in 5 words, then have a friend redraw it. To do well, your 5 words must capture what truly matters.",
      connect: { back: ["feedforward", "compression"], forward: ["variational autoencoder", "U-Net"] },
    },
  },
  {
    id: "vae", title: "Variational Autoencoder (VAE)", tier: "Sequences & memory",
    prereqs: ["autoencoder", "mean & variance", "sampling"],
    oneLiner: "An autoencoder whose bottleneck is a probability cloud you can sample.",
    stages: {
      know: "A normal distribution is a mean ${M('\\mu')} and spread ${M('\\sigma')}. To sample it: ${M('z=\\mu+\\sigma\\,\\epsilon')} with ${M('\\epsilon')} random.",
      question: "An autoencoder can rebuild inputs but can't <em>invent</em> new ones. How do we make the latent space smooth so we can sample brand-new data?",
      byhand: `Encoder outputs ${M("\\mu=1.0,\\ \\sigma=0.5")}. Draw noise ${M("\\epsilon=0.3")}.
        <div class="abh-step">Reparameterize: ${M("z=\\mu+\\sigma\\epsilon=1.0+0.5\\cdot0.3=1.15")}. Now ${M("z")} is random <em>and</em> differentiable.</div>
        <div class="abh-step">Loss = reconstruction + a term pulling ${M("(\\mu,\\sigma)")} toward ${M("(0,1)")} so the space stays smooth.</div>`,
      discover: "Encode to a distribution, sample via ${M('\\mu+\\sigma\\epsilon')} (the 'reparameterization trick' keeps backprop alive), and regularize toward a standard normal. Now decoding a random point yields a new, plausible sample.",
      explain: "Instead of one exact summary, store a fuzzy region of 'things like this.' Sample anywhere in the region and decode to get a fresh creation.",
      connect: { back: ["autoencoder", "normal distribution"], forward: ["diffusion / SORA", "generative models"] },
    },
  },

  // ── Tier 3: Attention & Transformers ───────────────────────────────
  {
    id: "selfattention", title: "Self-Attention", tier: "Attention & Transformers",
    prereqs: ["dot product", "softmax", "weighted average"],
    oneLiner: "Every word looks at every other word and mixes in what's relevant.",
    stages: {
      know: "Softmax turns scores into weights that sum to 1. A weighted average blends vectors by those weights.",
      question: "In 'the animal didn't cross because <em>it</em> was tired', which earlier word should 'it' pull meaning from? How can a word gather context from any distance in one step?",
      byhand: `Two tokens ${M("X=\\begin{smallmatrix}1&0\\\\0&1\\end{smallmatrix}")}, with ${M("Q=K=X")}, ${M("V=\\begin{smallmatrix}2&0\\\\0&3\\end{smallmatrix}")}.
        <div class="abh-step">Scores ${M("QK^\\top/\\sqrt2")}: diagonal ${M("0.707")}, off-diagonal ${M("0")}.</div>
        <div class="abh-step">Softmax each row → weights ${M("[0.67,0.33]")} and ${M("[0.33,0.67]")}.</div>
        <div class="abh-step">Output ${M("=")} weighted avg of ${M("V")} ${M("=\\begin{smallmatrix}1.34&0.99\\\\0.66&2.01\\end{smallmatrix}")}. Each token kept mostly itself, mixed in some of the other.</div>`,
      discover: "Score = query·key (relevance), softmax → weights, output = weighted sum of values. That single formula ${M('\\text{softmax}(QK^\\top/\\sqrt d)V')} lets any token reach any other in one hop — no recurrence needed.",
      explain: "Every word raises its hand to ask a question (query); every word wears a label (key). Words attend most to the labels that answer their question, and copy those meanings.",
      connect: { back: ["dot product", "softmax", "vector database"], forward: ["multihead attention", "transformer"] },
    },
  },
  {
    id: "multihead", title: "Multihead Attention", tier: "Attention & Transformers",
    prereqs: ["self-attention", "linear projections"],
    oneLiner: "Run several attentions in parallel, each on a different 'view.'",
    stages: {
      know: "A linear projection (multiply by a weight matrix) can rotate/select a subspace — a different 'view' of the same vectors.",
      question: "One attention can only track one kind of relationship (say, subject–verb). How do we capture grammar <em>and</em> meaning <em>and</em> position at once?",
      byhand: `Project the tokens with ${M("h=2")} different ${M("(W_Q,W_K,W_V)")} sets → 2 heads.
        <div class="abh-step">Head A might weight ${M("[0.67,0.33]")} (nearby words); Head B might weight ${M("[0.10,0.90]")} (a distant match).</div>
        <div class="abh-step">Concatenate both heads' outputs, then one more linear layer mixes them back to the model width.</div>`,
      discover: "Split ${M('Q,K,V')} into ${M('h')} smaller heads, attend independently, concatenate, project. Each head specializes — cheap parallelism, richer relationships.",
      explain: "Instead of one reader, send several specialists over the sentence — one watches grammar, one watches meaning — then merge their notes.",
      connect: { back: ["self-attention", "linear algebra"], forward: ["transformer", "Deepseek"] },
    },
  },
  {
    id: "transformer", title: "Transformer", tier: "Attention & Transformers",
    prereqs: ["multihead attention", "feedforward", "batch/layer norm"],
    oneLiner: "Attention + a feed-forward layer, stacked, with shortcuts.",
    stages: {
      know: "You have all the pieces: multihead attention (mix context), feed-forward (transform each token), normalization (stability), and softmax (final probabilities).",
      question: "How do we assemble these into one architecture that reads all words in parallel and predicts the next token?",
      byhand: `One block on a token: <div class="abh-step">1) attention output added back to the input (residual shortcut), then normalized.</div>
        <div class="abh-step">2) feed-forward on each token, added back and normalized.</div>
        <div class="abh-step">Final layer + softmax over the vocabulary. e.g. logits ${M("[2,1,0]")} → ${M("[0.665,0.245,0.090]")} → pick the first word.</div>`,
      discover: "Block = (attention → add & norm → feed-forward → add & norm). Stack ${M('N')} of them, add positional info, cap with softmax. Residual shortcuts keep gradients flowing so you can stack deep. This is GPT's skeleton.",
      explain: "Each word gathers context from all others, then thinks privately, then passes an improved version upward — many times — until it can guess what comes next.",
      connect: { back: ["multihead attention", "feedforward", "backpropagation"], forward: ["Deepseek", "RLHF", "SORA"] },
    },
  },

  // ── Tier 4: Generative & advanced ──────────────────────────────────
  {
    id: "gan", title: "GAN (Generative Adversarial Network)", tier: "Generative & advanced",
    prereqs: ["backpropagation", "probability", "log loss"],
    oneLiner: "A forger and a detective train each other.",
    stages: {
      know: "Binary cross-entropy loss ${M('-\\log(p)')} punishes confident wrong guesses. Backprop can push a network to fool another.",
      question: "How do you generate realistic images with no formula for 'realistic'? What if one network judged another?",
      byhand: `Detector says real image ${M("D=0.9")}, fake image ${M("D=0.2")}.
        <div class="abh-step">Detective loss ${M("-(\\log0.9+\\log(1-0.2))=0.329")} — wants ${M("D(\\text{real})\\to1,\\ D(\\text{fake})\\to0")}.</div>
        <div class="abh-step">Forger loss ${M("-\\log D(\\text{fake})=-\\log0.2=1.61")} — wants the fake to score high. They pull in opposite directions.</div>`,
      discover: "Alternate: improve the detective on real+fake, then improve the forger to fool the current detective. The two-player game converges to fakes indistinguishable from real.",
      explain: "A counterfeiter and a cop. Each time the cop learns a tell, the counterfeiter fixes it — until the money is perfect.",
      connect: { back: ["backpropagation", "log loss"], forward: ["diffusion / SORA", "U-Net"] },
    },
  },
  {
    id: "unet", title: "U-Net", tier: "Generative & advanced",
    prereqs: ["autoencoder", "convolution"],
    oneLiner: "An autoencoder with shortcuts that preserve fine detail.",
    stages: {
      know: "Autoencoders squeeze then rebuild. A convolution slides a small filter to detect local patterns (edges, textures).",
      question: "Squeezing an image to a tiny code loses the sharp boundaries you need for segmentation or denoising. How do we keep both the big picture and the fine detail?",
      byhand: `<div class="abh-step">Down path: image ${M("16\\times16\\to8\\times8\\to4\\times4")} (capture 'what').</div>
        <div class="abh-step">Up path: ${M("4\\times4\\to8\\times8\\to16\\times16")} (recover 'where').</div>
        <div class="abh-step">Skip connections copy each down-layer straight across to the matching up-layer, so edges survive the squeeze.</div>`,
      discover: "It's an autoencoder shaped like a 'U', with skip links between mirror levels. Those links are why U-Net gives crisp masks — and why diffusion models use it to denoise.",
      explain: "Zoom out to understand the whole scene, then zoom back in — but keep photocopies of each zoom level so you don't lose the sharp lines on the way back.",
      connect: { back: ["autoencoder", "convolution"], forward: ["SORA (diffusion)", "segmentation"] },
    },
  },
  {
    id: "sora", title: "SORA (diffusion video)", tier: "Generative & advanced",
    prereqs: ["VAE", "U-Net", "normal distribution"],
    oneLiner: "Start from pure noise and denoise, step by step, toward a video.",
    stages: {
      know: "You can sample noise ${M('\\epsilon\\sim\\mathcal N(0,1)')}, and a U-Net can predict-and-remove noise from an image.",
      question: "How can a model create a video it has never seen? What if generation were the <em>reverse</em> of destruction?",
      byhand: `<div class="abh-step">Forward (training): take a real frame, add a little noise 100 times until it's static. Easy to simulate.</div>
        <div class="abh-step">Reverse (generating): start from static, and at each step the U-Net predicts the noise to subtract: ${M("x_{t-1}=x_t-\\hat\\epsilon")}.</div>
        <div class="abh-step">After many steps, structured frames emerge; a transformer over space-time patches keeps frames consistent.</div>`,
      discover: "Learn to undo one small noising step, then apply that skill many times from pure noise. Diffusion = 'sculpting by removing noise' instead of predicting pixels directly.",
      explain: "Photograph something, then blur it to TV static in slow motion. Learn to run the blur backwards, and you can turn fresh static into something new.",
      connect: { back: ["VAE", "U-Net", "DFT"], forward: ["multimodal generation"] },
    },
  },
  {
    id: "superposition", title: "Superposition", tier: "Generative & advanced",
    prereqs: ["vectors", "dot product", "dimensionality"],
    oneLiner: "Pack more features than dimensions by making them nearly perpendicular.",
    stages: {
      know: "Two vectors are 'independent' when their dot product is near 0 (perpendicular). In ${M('n')} dimensions you get only ${M('n')} truly perpendicular directions.",
      question: "A layer of width 100 seems to represent thousands of concepts. How can it store more features than it has neurons?",
      byhand: `<div class="abh-step">In 2D you can fit 2 perpendicular features. But 3 vectors at ${M("120^\\circ")} have dot products ${M("-0.5")} — <em>almost</em> independent.</div>
        <div class="abh-step">If features are rare (seldom active together), that small overlap rarely causes confusion, so you can cram in far more than 2.</div>`,
      discover: "Sparse features can share a space as 'nearly orthogonal' directions; the network tolerates tiny interference because collisions are rare. This is why small models punch above their dimension — and why interpretability is hard.",
      explain: "A small closet holds many outfits if you rarely wear two at once — you overlap the hangers you seldom need together.",
      connect: { back: ["vectors", "dot product"], forward: ["interpretability", "vector database"] },
    },
  },
  {
    id: "rlhf", title: "RLHF (RL from Human Feedback)", tier: "Generative & advanced",
    prereqs: ["transformer", "probability", "gradient ascent"],
    oneLiner: "Turn human 'A is better than B' into a reward the model climbs.",
    stages: {
      know: "Gradient ascent nudges parameters to increase a score. Probabilities of tokens can be raised or lowered by backprop.",
      question: "A pretrained model predicts likely text, not <em>helpful</em> text. How do we teach preferences we can only judge, not write as a formula?",
      byhand: `<div class="abh-step">1) Humans rank answers: ${M("A\\succ B")}. Train a reward model so ${M("r(A)>r(B)")} (e.g. ${M("r(A)=1.2>r(B)=0.3")}).</div>
        <div class="abh-step">2) The language model generates, gets reward ${M("r")}, and does gradient ascent to make high-reward answers more likely — with a leash (KL penalty) so it doesn't drift into gibberish.</div>`,
      discover: "Replace the missing loss function with a <em>learned</em> one (the reward model) trained from comparisons, then optimize the policy against it. Preferences → numbers → gradients.",
      explain: "You can't define 'good answer', but you can point at the better of two. Collect enough pointing, learn a taste, then coach the model toward that taste.",
      connect: { back: ["transformer", "backpropagation"], forward: ["aligned assistants", "Deepseek"] },
    },
  },
  {
    id: "deepseek", title: "Deepseek (efficient LLM)", tier: "Generative & advanced",
    prereqs: ["transformer", "multihead attention", "RLHF"],
    oneLiner: "A transformer tuned to think more while computing less.",
    stages: {
      know: "A transformer's cost grows with width and with the attention key/value cache. Not every parameter must fire for every token.",
      question: "How do you get frontier reasoning without frontier compute? Which parts of a transformer can be made cheaper without losing quality?",
      byhand: `<div class="abh-step">Mixture-of-Experts: of, say, 64 feed-forward 'experts', a router picks the top ${M("2")} per token — so only ${M("2/64")} run. Same knowledge, a fraction of the compute.</div>
        <div class="abh-step">Multi-head latent attention compresses the K/V cache, shrinking memory. Then RL (like RLHF) sharpens step-by-step reasoning.</div>`,
      discover: "Keep the transformer skeleton but make it <em>sparse</em> (activate few experts) and <em>compressed</em> (smaller attention cache), then train reasoning with RL. Efficiency is an architecture choice, not just scale.",
      explain: "Instead of asking all 64 specialists every question, a receptionist routes you to the 2 who know — faster, cheaper, just as smart.",
      connect: { back: ["transformer", "multihead attention", "RLHF"], forward: ["frontier reasoning models"] },
    },
  },
];

export const TIERS = ["Foundations", "Sequences & memory", "Attention & Transformers", "Generative & advanced"];
export const STAGE_ORDER: [keyof Omit<Exercise["stages"], "connect">, string][] = [
  ["know", "① What you already know"],
  ["question", "② The question that makes you invent it"],
  ["byhand", "③ Do it by hand"],
  ["discover", "④ Discover the rule"],
  ["explain", "⑤ Explain it simply (Feynman)"],
];
