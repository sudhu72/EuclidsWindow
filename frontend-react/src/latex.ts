// LaTeX normalization ported from the vanilla app (app.js). Small local models
// emit messy math: prose wrapped in \text{...}, bare \sqrt/\frac/greek outside
// any math delimiters, unclosed braces, and even LaTeX environments. This
// repairs those, then hands off to remark-math ($...$ / $$...$$).

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
  return (
    part
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
      )
      // A power or index outside math renders as literal "r^2". Wrap it — in
      // prose an exponent is always meant as maths.
      .replace(
        /(?<![\\$\w^_])([A-Za-z])(\^|_)(\{[^{}]*\}|[A-Za-z0-9]+)/g,
        (m) => `\\(${m}\\)`
      )
  );
}

/**
 * Merge math spans separated only by whitespace.
 *
 * Two spans side by side become `$a$$b$` once handed to remark-math, and that
 * `$$` reads as a display-math delimiter — which swallows the following prose
 * and leaks braces into the page. Merging keeps `\pi r^2` as one expression,
 * which is what it was meant to be anyway.
 */
function mergeAdjacentMath(text: string): string {
  let out = text;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(
      /\\\(([^()]*?)\\\)(\s*)\\\(([^()]*?)\\\)/g,
      (_m, a: string, gap: string, b: string) => `\\(${a}${gap ? " " : ""}${b}\\)`
    );
    if (next === out) break;
    out = next;
  }
  return out;
}

// A math span or LaTeX environment, whose contents must not be treated as
// prose. One capture group, so String.split puts these at odd indices.
const MATH_SPAN =
  /(\$\$[\s\S]*?\$\$|\\begin\{[a-zA-Z]+\*?\}[\s\S]*?\\end\{[a-zA-Z]+\*?\}|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/;

/**
 * LaTeX line breaks, which are not math.
 *
 * `\\[1em]` is a line break with extra spacing, but the normaliser that repairs
 * `\\(` into `\(` turns it into `\[` — a display-math opener with no closer, so
 * it survives to the page as a literal "[1em]". Handle these first.
 *
 * Only outside math: within a matrix or `aligned` block the same `\\` is a row
 * separator. Rewriting those to blank lines splits the surrounding `$$...$$`
 * across markdown paragraphs, which strands the rest of the matrix as raw text.
 */
function convertLineBreaks(text: string): string {
  return text
    .split(new RegExp(MATH_SPAN.source, "g"))
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(/\\\\\s*\[\s*[\d.]+\s*(?:em|ex|pt|cm|mm|in)\s*\]/g, "\n\n")
            .replace(/\\\\(?=\s|$)/g, "\n\n")
    )
    .join("");
}

// Small models emit LaTeX environments despite instructions. Convert the ones
// KaTeX/remark-math can't handle: tabular -> a markdown table; equation/align/
// gather -> display math.
function convertEnvironments(text: string): string {
  let n = text;
  n = n.replace(
    /\\begin\{tabular\}(?:\{[^}]*\})?([\s\S]*?)\\end\{tabular\}/g,
    (whole, body: string) => {
      const cleaned = body.replace(/\\hline/g, " ");
      const rows = cleaned
        .split(/\\{1,}\s*n?/) // \\  \  \\n  \n  row separators (model output is messy)
        .map((r) => r.trim())
        .filter((r) => r.includes("&"));
      const grid = rows.map((r) => r.split("&").map((c) => c.trim()));
      if (grid.length < 2) return whole; // give up rather than mangle
      const cols = Math.max(...grid.map((g) => g.length));
      const pad = (g: string[]) => g.concat(Array(Math.max(0, cols - g.length)).fill(""));
      const lines = [
        "| " + pad(grid[0]).join(" | ") + " |",
        "| " + Array(cols).fill("---").join(" | ") + " |",
        ...grid.slice(1).map((g) => "| " + pad(g).join(" | ") + " |"),
      ];
      return "\n\n" + lines.join("\n") + "\n\n";
    }
  );
  n = n.replace(
    /\\begin\{(equation|align|gather|displaymath)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_m, env: string, bodyRaw: string) => {
      let body = bodyRaw.trim();
      if (env === "align") body = `\\begin{aligned}${body}\\end{aligned}`;
      return `\n\n$$${body}$$\n\n`;
    }
  );
  return n;
}

// Does a $...$ span look like math (vs currency/prose)? Lets "$25 - x = 19$"
// render while "$1.00" between two prices stays literal text.
function isMathLike(inner: string): boolean {
  const s = inner.trim();
  if (/^[\d.,\s]+$/.test(s)) return false; // pure number -> currency
  if (/[\\=^_<>]/.test(s)) return true; // latex command / relational
  if (/\d\s*[-+*/]\s*[\d(]/.test(s)) return true; // arithmetic like 25 - (0.1)
  if (/^[a-zA-Z]('|\^.+)?(\([^)]*\))?$/.test(s)) return true; // x, f(x), x^2
  if (/^[[(][\d\s.,;-]+[\])]$/.test(s)) return true; // a vector: [1,1,1,1]
  return false;
}

/** Full normalize → returns text with $...$ / $$...$$ delimiters for remark-math. */
export function normalizeForKatex(text: string): string {
  if (!text) return "";
  let n = text;
  for (const [uni, cmd] of Object.entries(GREEK_UNICODE)) n = n.split(uni).join(cmd);
  // Before anything turns `\\[` into `\[` and mistakes a line break for maths.
  n = convertLineBreaks(n);
  n = convertEnvironments(n);
  n = n.replace(/\$\$([\s\S]+?)\$\$/g, "\\[$1\\]");
  // Only treat $...$ as math when the content looks mathematical.
  n = n.replace(/\$([^$\n]+?)\$/g, (m, inner: string) => (isMathLike(inner) ? `\\(${inner}\\)` : m));
  // Any remaining $ is currency or an unmatched delimiter -> literal, so
  // remark-math can't pair two prices into a math span.
  n = n.replace(/\$/g, () => "\\$");
  n = n.replace(/\\\\([()[\]])/g, "\\$1");
  n = unwrapProseTextCommands(n);
  n = n
    .split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/)
    .map((part, i) => (i % 2 === 1 ? repairMathSegment(part) : wrapBareMathCommands(part)))
    .join("");
  n = mergeAdjacentMath(n);
  // Hand off to remark-math: \(...\) -> $...$, \[...\] -> $$...$$
  n = n
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `\n\n$$${inner.trim()}$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);
  return n;
}
