"""Agent skills — operating-procedure documents injected into math-agent prompts.

Skill files live in ``app/ai/skills/*.md`` (markdown with optional YAML
frontmatter). The flagship skill is ``standing-orders.md``: a verification /
anti-hallucination protocol (re-derive every number, mark claims as
certain / likely / assumption, say "I don't know" instead of fabricating).

Cloud models get the full document; small local models get a distilled core
so the instructions don't crowd out the actual task.
"""
import re
from pathlib import Path

SKILLS_DIR = Path(__file__).resolve().parent / "skills"

# Hand-distilled core of standing-orders.md, sized for 1.5B-4B local models.
COMPACT_SKILL = (
    "Operating procedure (mandatory):\n"
    "- Re-derive every number and formula step by step before stating it; "
    "never trust a figure because the sentence reads smoothly.\n"
    "- Mark claims you did not verify: say 'Likely: ...' or 'Assumption: ...'. "
    "State verified facts plainly.\n"
    "- If you cannot support an answer with a computation or a source given "
    "to you, say 'I don't know' and what would be needed to know — never "
    "invent facts, names, or formulas.\n"
    "- When reference excerpts are provided, ground your answer in them and "
    "mention the source; do not contradict them.\n"
    "- Lead with the answer, then the reasoning, then any caveats."
)


def _strip_frontmatter(text: str) -> str:
    return re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.DOTALL)


def load_skill(name: str = "standing-orders") -> str:
    path = SKILLS_DIR / f"{name}.md"
    try:
        return _strip_frontmatter(path.read_text(encoding="utf-8")).strip()
    except OSError:
        return ""


def skill_prelude(compact: bool = True) -> str:
    """Skill text to append to a system prompt.

    ``compact=True`` (local models) uses the distilled core; ``compact=False``
    (cloud models with large contexts) uses the full document.
    """
    if compact:
        return COMPACT_SKILL
    full = load_skill("standing-orders")
    return full or COMPACT_SKILL


def skill_for_current_provider(store) -> str:
    """Pick compact vs full skill based on the active model provider."""
    try:
        provider = (store.get_effective_settings().get("llm_provider") or "ollama").lower()
    except Exception:
        provider = "ollama"
    return skill_prelude(compact=(provider == "ollama"))
