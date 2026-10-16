"""Story mode for the Manim animation pipeline: a narrated, multi-act video.

The single-scene pipeline (animation_pipeline.py) is capped at ~15 seconds on
purpose: one LLM completion has to get the pedagogy, the layout and every
bracket right, and a longer file fails validation or rendering far more
often. That cap is what made clips feel like a flash of shapes rather than an
explanation. Story mode gets length without that fragility by splitting the
video into small, independently rendered pieces:

1. Storyboard — one JSON call plans a title, an opening hook question, 4-6
   acts (each: what is shown, what the narrator says, how long) and a
   one-line recap, following the tutor's own explanation when one is given
   so the video uses the same running example and numbers.
2. Intro and recap cards — deterministic scenes built here, so every video
   opens with the question and closes on the takeaway even if an act fails.
3. Acts — each act is its own short scene (the existing ~15 s rules, the
   existing validators and repair loop apply unchanged), written against a
   ``StoryScene`` base class that draws the act label and the narration
   subtitle, so the model only animates the middle of the frame. Acts are
   written and rendered in parallel. An act that still fails after repairs
   becomes a plain title card, so one bad act never sinks the video.
4. Joining — ffmpeg concatenates the parts into one MP4.
"""

import json
import re
import subprocess
import tempfile
import textwrap
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable, Optional

from ..logging_config import logger
from .animation_pipeline import CODEGEN_SYSTEM_PROMPT, FEWSHOT_EXAMPLE, FEWSHOT_EXAMPLE_2, AnimationPipeline
from .executor import ANIMATIONS_DIR
from .manim_templates import SCENE_PREAMBLE
from .prompts import LEVEL_INSTRUCTIONS

Progress = Callable[[int, str], None]

ACT_WORKERS = 3
ACT_MAX_RETRIES = 2  # per act; a failed act degrades to a card, not a failed video

STORY_PLAN_SYSTEM_PROMPT = textwrap.dedent("""\
You are a math teacher and storyteller planning a short animated explainer
video in the style of 3Blue1Brown. You are NOT writing code yet.
Output ONLY a JSON object, no markdown fences, no commentary, shaped exactly like:
{
  "title": "video title, under 32 characters",
  "hook": "an intriguing question or puzzle that opens the video, under 18 words",
  "acts": [
    {
      "title": "act name, under 26 characters",
      "visual": "what the animation shows and how it moves: concrete shapes, positions, numbers, colors. Under 45 words.",
      "narration": "what the narrator says during this act, 1-2 plain sentences, under 28 words",
      "seconds": 9
    }
  ],
  "key_equation": "the single most important equation in LaTeX, or empty string",
  "recap": "the one-sentence takeaway, under 18 words"
}
Story rules:
- 4 to 6 acts telling ONE story: start from a concrete situation, build the
  intuition with pictures, reveal the key idea (the "aha" moment), then
  connect it to the formal math.
- Pick ONE running example (specific objects, specific small numbers) and
  keep it through every act, so each act visibly builds on the last.
- If the tutor's explanation is given, follow it: same example, same numbers,
  same order of ideas.
- Each act shows one idea with something MOVING or CHANGING on screen —
  geometry before algebra. Never an act that is just text.
- 7 to 12 seconds per act.
""")

STORY_PLAN_PROMPT_TEMPLATE = textwrap.dedent("""\
{level_instruction}Plan an animated explainer video for: {topic}

{context_block}Output the JSON plan now.
""")

# The act scenes inherit from this. It draws the act label (top-left) and the
# narration subtitle (bottom band) so the generated code only has to animate
# the middle of the frame, and it keeps the subtitle above everything else.
# Strings arrive as class attributes, not Text("...") literals, so the
# pipeline's text-length validators only see the model's own code.
STORY_SCENE_BASE = SCENE_PREAMBLE + '''

class StoryScene(Scene):
    ACT_LABEL = {act_label!r}
    CAPTION = {caption!r}

    def setup(self):
        self.camera.background_color = BG
        label = Text(self.ACT_LABEL, font=MONO, font_size=20, color=DIM)
        label.to_corner(UL, buff=0.3)
        self.add(label)
        if self.CAPTION:
            cap = Text(self.CAPTION, font=MONO, font_size=22, color=WHITE, line_spacing=0.8)
            if cap.width > 12.8:
                cap.scale_to_fit_width(12.8)
            cap.to_edge(DOWN, buff=0.25)
            band = BackgroundRectangle(cap, color=BG, fill_opacity=0.9, buff=0.12)
            self.add_foreground_mobjects(band, cap)

    def dot_grid(self, n, cols=10, color=PRIMARY, radius=0.09):
        """n dots in a grid (at most 200), centred in the safe area."""
        g = VGroup(*[Dot(radius=radius, color=color) for _ in range(min(int(n), 200))])
        g.arrange_in_grid(cols=min(int(cols), max(1, len(g))), buff=0.12)
        return g.move_to(UP * 0.4)

    def play(self, *animations, **kwargs):
        # Small models routinely build a row or label that runs off the
        # frame. Fit each NEW mobject into the safe area (above the subtitle)
        # just before it first appears, so nothing visibly jumps.
        # (No nested loop here: the pipeline's validator rejects any.)
        on_screen = set(self.get_mobject_family_members())
        targets = [getattr(a, "mobject", None) for a in animations]
        targets += [getattr(a, "target_mobject", None) for a in animations]
        for m in targets:
            if isinstance(m, Mobject) and m not in on_screen and (m.width or m.height):
                _fit(m)
        super().play(*animations, **kwargs)


def _fit(m, left=-6.6, right=6.6, bottom=-2.5, top=3.4):
    if m.width > right - left:
        m.scale_to_fit_width(right - left)
    if m.height > top - bottom:
        m.scale_to_fit_height(top - bottom)
    dx = max(0, left - m.get_left()[0]) - max(0, m.get_right()[0] - right)
    dy = max(0, bottom - m.get_bottom()[1]) - max(0, m.get_top()[1] - top)
    if dx or dy:
        m.shift(RIGHT * dx + UP * dy)

'''

ACT_SYSTEM_PROMPT = (
    CODEGEN_SYSTEM_PROMPT.replace(
        "2. The scene class MUST be named `GeneratedScene` and inherit from `Scene`.",
        "2. The scene class MUST be named `GeneratedScene` and inherit from `StoryScene`\n"
        "   (already defined for you — do not define or import it).",
    )
    .replace(
        "8. Keep the animation under 15 seconds total.",
        "8. Keep this act to the length you are given (never over 15 seconds).",
    )
    .format(fewshot_example=FEWSHOT_EXAMPLE, fewshot_example_2=FEWSHOT_EXAMPLE_2)
)

ACT_PROMPT_TEMPLATE = textwrap.dedent("""\
{level_instruction}You are animating ONE act of a {n}-act explainer video about: {topic}

The whole story, for continuity (animate ONLY act {i}):
{outline}

ACT {i}: {title}
Show: {visual}
The narrator says (already shown as a subtitle — do NOT draw this text): {narration}
Length: about {seconds} seconds in total across self.play()/self.wait().

The StoryScene base class already draws the act label in the top-left corner
and the narration subtitle along the bottom, and sets the background. So:
- write `class GeneratedScene(StoryScene):` with a construct() method;
- do NOT add a title, heading or narration sentence — short labels only
  (a number, a word, a short equation);
- keep every visual between y = -2.4 and y = 3.2 (above the subtitle band)
  and within x = -6.5 .. 6.5;
- make the main visual BIG: it should fill most of that area (roughly 10-12
  wide or 4-5 tall). Small shapes in an empty frame look like a mistake;
- never put more than 12 items in one row. For many items (people, dots,
  coins) use the built-in helper `grid = self.dot_grid(100, cols=20, color=PRIMARY)`
  (a VGroup of Dots; color some with `grid[:10].animate.set_color(HIGHLIGHT)`)
  — never write nested loops; only use Manim methods you are sure exist;
- after building any group, `if g.width > 12: g.scale_to_fit_width(12)`;
- give each label its own spot (`.next_to(shape, UP/DOWN, buff=0.2)`) — two
  labels must never share a position; MathTex at font_size 40 or larger;
- use color to carry meaning (e.g. PRIMARY = one group, HIGHLIGHT = the other)
  and keep it the same as earlier acts;
- every act starts on an empty screen: re-create whatever you need from
  earlier acts (the same running example, same numbers, same colors);
- make something move or transform — this is an animation, not a slide;
- end with `self.play(FadeOut(Group(*self.mobjects)))`.

Output the complete Python script.
""")

CARD_SCENE = SCENE_PREAMBLE + '''

class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        head = Text({head!r}, font=MONO, font_size={head_size}, color={head_color}, weight=BOLD)
        if head.width > 12.5:
            head.scale_to_fit_width(12.5)
        head.move_to(UP * 1.2)
        body = Text({body!r}, font=MONO, font_size=28, color=WHITE, line_spacing=0.9)
        if body.width > 12.0:
            body.scale_to_fit_width(12.0)
        body.next_to(head, DOWN, buff=0.7)
        line = Line(LEFT * 3, RIGHT * 3, color=PRIMARY, stroke_width=3).next_to(body, DOWN, buff=0.6)
        self.play(Write(head), run_time=1.2)
        self.play(FadeIn(body, shift=UP * 0.2), Create(line), run_time=1.2)
        dot = Dot(color=ACCENT).move_to(line.get_start())
        self.play(MoveAlongPath(dot, line), run_time={travel})
{equation_block}        self.wait({hold})
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)
'''

EQUATION_BLOCK = '''        eq = MathTex({eq!r}, font_size=46, color=ACCENT)
        if eq.width > 11:
            eq.scale_to_fit_width(11)
        eq.next_to(line, DOWN, buff=0.5)
        self.play(Write(eq), run_time=1.5)
'''


def _wrap(text: str, width: int = 56, max_lines: int = 3) -> str:
    lines = textwrap.wrap(" ".join(str(text).split()), width=width)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .,;:") + "…"
    return "\n".join(lines)


# Emoji and other symbols outside the mono font render as empty boxes.
_NO_GLYPH = re.compile("[\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F\u200D]")


def _clip(text, n: int) -> str:
    return " ".join(_NO_GLYPH.sub("", str(text or "")).split())[:n]


def _equation(tex) -> str:
    """The recap's LaTeX, or "" if it's too long to fit or has unbalanced braces
    (clipping it would leave half an equation on screen)."""
    tex = " ".join(str(tex or "").split())
    if len(tex) > 160 or tex.count("{") != tex.count("}"):
        return ""
    return tex


def card_scene(head: str, body: str, *, head_color: str = "PRIMARY", head_size: int = 40,
               equation: str = "", hold: float = 2.0) -> str:
    """A title/body card that always renders (text and primitives only)."""
    return CARD_SCENE.format(
        head=_wrap(head, 30, 2), body=_wrap(body, 44, 4), head_color=head_color, head_size=head_size,
        travel=1.5, hold=hold,
        equation_block=EQUATION_BLOCK.format(eq=equation) if equation else "",
    )


def parse_story(raw: str) -> Optional[dict]:
    """Validate the storyboard; None (not a partial story) if it's unusable."""
    match = re.search(r"\{.*\}", raw or "", re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    acts = data.get("acts")
    if not isinstance(acts, list) or not (3 <= len(acts) <= 7):
        return None
    clean = []
    for a in acts:
        if not isinstance(a, dict) or not a.get("visual") or not a.get("title"):
            return None
        try:
            seconds = float(a.get("seconds", 9))
        except (TypeError, ValueError):
            seconds = 9.0
        clean.append({
            "title": _clip(a["title"], 40),
            "visual": _clip(a["visual"], 400),
            "narration": _clip(a.get("narration", ""), 220),
            "seconds": round(max(6.0, min(seconds, 13.0)), 1),
        })
    return {
        "title": _clip(data.get("title"), 48),
        "hook": _clip(data.get("hook"), 160),
        "acts": clean,
        "key_equation": _equation(data.get("key_equation")),
        "recap": _clip(data.get("recap"), 180),
    }


class StoryAnimator:
    """Builds a multi-act narrated animation on top of AnimationPipeline."""

    def __init__(self, pipeline: AnimationPipeline) -> None:
        self._pipeline = pipeline
        self._llm = pipeline._llm

    # ------------------------------------------------------------------
    def generate(self, topic: str, context: str, learner_level: str, job_id: str,
                 progress: Progress) -> Optional[dict]:
        """Render the story to ANIMATIONS_DIR/<job_id>.mp4; returns {url, format}.

        Falls back to the single-clip pipeline when the LLM is unavailable or
        the storyboard is unusable, so the caller always gets something.
        """
        level = learner_level if learner_level in LEVEL_INSTRUCTIONS else "teen"
        story = None
        if self._llm.is_available():
            progress(6, "Writing the storyboard")
            story = self._plan(topic, context, level)
        if story is None:
            logger.info("StoryAnimator: no usable storyboard, falling back to a single clip")
            progress(20, "Animating a single scene")
            payload = self._pipeline.generate(topic, context, learner_level=level, output_format="mp4")
            return {"url": payload.data["url"], "format": payload.data["format"]} if payload else None

        acts = story["acts"]
        n = len(acts)
        logger.info(f"StoryAnimator: {n} acts planned for {topic!r}")
        title = story["title"] or topic
        parts: list[Optional[Path]] = [None] * (n + 2)
        done = [0]

        def tick(stage: str) -> None:
            done[0] += 1
            progress(10 + int(80 * done[0] / (n + 2)), stage)

        progress(10, f"Storyboard ready: {n} acts. Animating…")
        parts[0] = self._render_card(card_scene(title, story["hook"] or topic, hold=2.5), topic)
        tick("Opening question ready")

        def act_job(i: int) -> None:
            parts[i + 1] = self._render_act(topic, story, i, level)
            tick(f"Act {i + 1} of {n} ready")

        with ThreadPoolExecutor(ACT_WORKERS) as pool:
            list(pool.map(act_job, range(n)))

        recap = story["recap"] or story["acts"][-1]["narration"]
        outro = None
        if story["key_equation"]:
            outro = self._render_card(card_scene("The big idea", recap, head_color="ACCENT",
                                                 equation=story["key_equation"], hold=3.0), topic)
        parts[-1] = outro or self._render_card(card_scene("The big idea", recap, head_color="ACCENT",
                                                          hold=3.0), topic)
        tick("Recap ready")

        progress(94, "Joining the acts")
        files = [p for p in parts if p is not None]
        if not files:
            return None
        out = ANIMATIONS_DIR / f"{job_id}.mp4"
        ok = self._concat(files, out)
        for p in files:
            p.unlink(missing_ok=True)
        if not ok:
            return None
        return {"url": f"/animations/{out.name}", "format": "mp4"}

    # ------------------------------------------------------------------
    def _plan(self, topic: str, context: str, level: str) -> Optional[dict]:
        from .concept_graph import get_concept_graph

        graph = get_concept_graph().context_for(topic)
        ctx = context.strip()[:3000]
        block = f"The tutor's explanation to follow:\n<<<\n{ctx}\n>>>\n\n" if ctx else ""
        if graph:
            block += f"Related concepts:\n{graph[:800]}\n\n"
        messages = [
            {"role": "system", "content": STORY_PLAN_SYSTEM_PROMPT},
            {"role": "user", "content": STORY_PLAN_PROMPT_TEMPLATE.format(
                level_instruction=LEVEL_INSTRUCTIONS[level], topic=topic, context_block=block)},
        ]
        for attempt in range(2):
            try:
                raw = self._llm.chat(messages, task="codegen", timeout_seconds=90, num_predict=2500,
                                     temperature=0.5 if attempt == 0 else 0.3, json_format=True)
            except Exception as exc:  # noqa: BLE001 - planning failure means fallback, not a crash
                logger.warning(f"StoryAnimator: storyboard call failed: {exc}")
                continue
            story = parse_story(raw)
            if story:
                return story
            logger.warning(f"StoryAnimator: storyboard unusable (attempt {attempt + 1})")
        return None

    def _render_act(self, topic: str, story: dict, i: int, level: str) -> Optional[Path]:
        acts = story["acts"]
        act = acts[i]
        base = STORY_SCENE_BASE.format(
            act_label=f"{i + 1}/{len(acts)}  {act['title']}", caption=_wrap(act["narration"])
        )
        outline = "\n".join(f"{k + 1}. {a['title']}: {a['visual']}" for k, a in enumerate(acts))
        messages = [
            {"role": "system", "content": ACT_SYSTEM_PROMPT},
            {"role": "user", "content": ACT_PROMPT_TEMPLATE.format(
                level_instruction=LEVEL_INSTRUCTIONS[level], n=len(acts), topic=topic, outline=outline,
                i=i + 1, title=act["title"], visual=act["visual"], narration=act["narration"],
                seconds=act["seconds"])},
        ]
        code = None
        for attempt in range(2):
            # 12000: Claude thinks by default and max_tokens covers thinking + code;
            # 4500 was observed running out before any code was written.
            raw = self._llm.chat(messages, task="codegen", timeout_seconds=180, num_predict=12000,
                                 num_ctx=12000, temperature=0.3 if attempt == 0 else 0.15)
            body = AnimationPipeline._extract_python(raw or "")
            if body and "GeneratedScene" in body and "construct" in body:
                code = base + body
                break
        if code:
            payload = self._pipeline._render_with_retry(code, topic, f"act_{i + 1}", output_format="mp4",
                                                         max_retries=ACT_MAX_RETRIES)
            if payload is not None:
                return ANIMATIONS_DIR / Path(payload.data["url"]).name
            logger.warning(f"StoryAnimator: act {i + 1} failed to render, using a title card")
        return self._render_card(card_scene(act["title"], act["narration"] or act["visual"],
                                            hold=max(2.0, act["seconds"] - 5)), topic)

    def _render_card(self, code: str, topic: str) -> Optional[Path]:
        payload, error = self._pipeline._executor.execute_manim_detailed(code, title=topic, output_format="mp4")
        if payload is None:
            logger.warning(f"StoryAnimator: card failed to render: {(error or '')[-300:]}")
            return None
        return ANIMATIONS_DIR / Path(payload.data["url"]).name

    @staticmethod
    def _concat(files: list[Path], out: Path) -> bool:
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as lst:
            for f in files:
                lst.write(f"file '{f}'\n")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst.name,
               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        finally:
            Path(lst.name).unlink(missing_ok=True)
        if res.returncode != 0:
            logger.error(f"StoryAnimator: ffmpeg concat failed: {res.stderr[-500:]}")
            return False
        return True
