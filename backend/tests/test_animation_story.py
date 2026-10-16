"""Story-mode animation: storyboard parsing and the generated scaffolding."""
import json

from app.ai.animation_pipeline import AnimationPipeline
from app.ai.animation_story import STORY_SCENE_BASE, card_scene, parse_story


def _story(n_acts=4, seconds=9):
    return {
        "title": "Bayes at the Clinic",
        "hook": "A test is 99% accurate and says you're sick. Should you panic?",
        "acts": [
            {"title": f"Act {i}", "visual": "1000 dots, 10 turn red", "narration": "Start with 1000 people.",
             "seconds": seconds}
            for i in range(n_acts)
        ],
        "key_equation": r"P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}",
        "recap": "Rare things stay rare, even after a positive test.",
    }


def test_parse_story_accepts_a_good_plan_and_clamps_seconds():
    story = parse_story("noise " + json.dumps(_story(seconds=40)) + " trailing")
    assert story is not None and len(story["acts"]) == 4
    assert all(a["seconds"] == 13.0 for a in story["acts"])


def test_parse_story_rejects_too_few_acts_and_bad_json():
    assert parse_story(json.dumps(_story(n_acts=2))) is None
    assert parse_story("not json at all") is None
    bad = _story()
    bad["acts"][1] = {"title": "no visual"}
    assert parse_story(json.dumps(bad)) is None


def test_card_scenes_pass_the_pipeline_validators():
    assert AnimationPipeline._validate_code(card_scene("Bayes at the Clinic", "Should you panic?")) is None
    with_eq = card_scene("The big idea", "Rare stays rare.", equation=r"P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}")
    assert AnimationPipeline._validate_code(with_eq) is None


def test_story_base_does_not_trip_validators_on_long_captions():
    base = STORY_SCENE_BASE.format(act_label="2/5  Sharing the pizza",
                                   caption="A deliberately long narration line " * 4)
    act = base + (
        "class GeneratedScene(StoryScene):\n"
        "    def construct(self):\n"
        "        c = Circle(color=PRIMARY)\n"
        "        self.play(Create(c), run_time=2)\n"
        "        self.wait(2)\n"
        "        self.play(FadeOut(Group(*self.mobjects)))\n"
    )
    assert AnimationPipeline._validate_code(act) is None


def test_parse_story_strips_emoji_and_drops_unfit_equations():
    raw = _story()
    raw["acts"][0]["narration"] = "Split the pizza 🍕 in half!"
    raw["key_equation"] = r"\frac{a}{b" + "x" * 10
    story = parse_story(json.dumps(raw))
    assert story["acts"][0]["narration"] == "Split the pizza in half!"
    assert story["key_equation"] == ""
    raw["key_equation"] = "x" * 200
    assert parse_story(json.dumps(raw))["key_equation"] == ""
