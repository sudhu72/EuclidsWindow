// LaTeX normalization ported from the vanilla app (app.js). Small local models
// emit messy math: prose wrapped in \text{...}, bare \sqrt/\frac/greek outside
// any math delimiters, unclosed braces. This repairs those, then hands off to
// remark-math by converting the resulting \(...\)/\[...\] to $...$/$$...$$.

const GREEK_UNICODE: Record<string, string> = {
  "\\λ": "\\lambda", "\\α": "\\alpha", "\\β": "\\beta", "\\γ": "\\gamma",
  "\\δ": "\\delta", "\\θ": "\\theta", "\\π": "\\pi", "\\σ": "\\sigma",
  "\\μ": "\\mu", "\\ω": "\\omega",
};

// Remove \text{...} wrappers OUTSIDE math, keeping the wrapped content — even
// when the braces span embedded \(...\)/\[...\] segments. \text inside math is
// valid KaTeX and left alone.
function unwrapProseTextCommands(input: string): string {
  if (!input || !input.includes("\\text{")) return input;
  let out = "";
  let i = 0;
  let mathCloser: string | null = null;
  let depth = 0;
  const textDepths: number[] = [];
  while (i < input.length) {
    const two = input.slice(i, i + 2);
    if (mathCloser) {
      out += input[i];
      if (two === mathCloser) { out += input[i + 1]; i += 2; mathCloser = null; continue; }
      i += 1;
      continue;
    }
    if (two === "\\(" || two === "\\[") {
      mathCloser = two === "\\(" ? "\\)" : "\\]";
      out += two;
      i += 2;
      continue;
    }
    if (input.startsWith("\\text{", i)) {
      textDepths.push(depth);
      depth += 1;
      i += 6;
      continue;
    }
    const ch = input[i];
    if (ch === "{" && input[i - 1] !== "\\") {
      depth += 1;
    } else if (ch === "}" && input[i - 1] !== "\\") {
      depth -= 1;
      if (textDepths.length && textDepths[textDepths.length - 1] === depth) {
        textDepths.pop();
        i += 1;
        continue;
      }
    }
    out += ch;
    i += 1;
  }
  return out;
}

// Close unbalanced "{" groups inside a math segment.
function repairMathSegment(segment: string): string {
  const openDelim = segment.slice(0, 2);
  const closeDelim = segment.slice(-2);
  let body = segment.slice(2, -2);
  const unclosed: number[] = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "{" && body[i - 1] !== "\\") unclosed.push(i);
    else if (body[i] === "}" && body[i - 1] !== "\\") unclosed.pop();
  }
  if (!unclosed.length) return segment;
  for (const pos of unclosed.reverse()) {
    const rest = body.slice(pos);
    const operator = rest.match(/\s(?:[+\-=<>]|\\pm|\\le|\\ge|\\cdot|\\times)\s/);
    const insertAt = operator && operator.index !== undefined ? pos + operator.index : body.length;
    body = body.slice(0, insertAt) + "}" + body.slice(insertAt);
  }
  return openDelim + body + closeDelim;
}

// Wrap bare LaTeX commands that appear outside any math delimiters.
function wrapBareMathCommands(part: string): string {
  return part
    // Prose text commands the model emits -> markdown (bold/italic/plain).
    .replace(/\\textbf\{([^{}]*)\}/g, "**$1**")
    .replace(/\\textit\{([^{}]*)\}/g, "*$1*")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(
      /\\(?:d?frac|tfrac|binom)\{[^{}]*\}\{[^{}]*\}|\\sqrt(?:\[[^\]]*\])?\{[^{}]*\}/g,
      (m) => `\\(${m}\\)`
    )
    .replace(
      /\\(?:pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|phi|infty)\b(?!\s*[{^_])/g,
      (m) => `\\(${m}\\)`
    );
}

/** Full normalize → returns text with $...$ / $$...$$ delimiters for remark-math. */
const CURRENCY = "\uE000"; // sentinel to shield currency $ from math delimiters

export function normalizeForKatex(text: string): string {
  if (!text) return "";
  let n = text;
  for (const [uni, cmd] of Object.entries(GREEK_UNICODE)) n = n.split(uni).join(cmd);
  // A "$" right before a digit is almost always currency ($1.00), not a math
  // delimiter — shield it so the $...$ rule below can't pair two prices and
  // turn the prose between them into math. Restored as a literal "\$" at the end.
  n = n.replace(/\$(?=\d)/g, CURRENCY);
  // Normalize any $-delimited math into \(...\)/\[...\] so the repair pipeline
  // (which works on \(...\) segments) can see all of it.
  n = n.replace(/\$\$([\s\S]+?)\$\$/g, "\\[$1\\]");
  n = n.replace(/\$([^$\n]+?)\$/g, "\\($1\\)");
  n = n.replace(/\\\\([()[\]])/g, "\\$1");
  n = unwrapProseTextCommands(n);
  n = n
    .split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/)
    .map((part, i) => (i % 2 === 1 ? repairMathSegment(part) : wrapBareMathCommands(part)))
    .join("");
  // Hand off to remark-math: \(...\) -> $...$, \[...\] -> $$...$$
  n = n
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `\n\n$$${inner.trim()}$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);
  // Restore shielded currency markers as escaped literal dollars.
  n = n.split(CURRENCY).join("\\$");
  return n;
}
