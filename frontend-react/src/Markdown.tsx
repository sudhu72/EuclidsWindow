import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeForKatex } from "./latex";

/** Markdown + KaTeX renderer shared by the chat and the lesson player.
 *  Repairs the messy LaTeX small models emit (prose \text{}, bare \sqrt/\frac,
 *  unclosed braces) before handing off to remark-math. */
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children ? normalizeForKatex(children) : ""}
    </ReactMarkdown>
  );
}
