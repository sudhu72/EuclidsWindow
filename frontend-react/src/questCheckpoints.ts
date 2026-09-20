// Deduction checkpoints for Math Quest's flagship stories — modeled directly
// on LogicLab.tsx's KnightsGame/KnavePuzzle: a fixed cast, one option picked
// per entity, checked all-or-nothing against a pre-baked answer, same
// green/red verdict language. This is where the actual "who did it" /
// "which path is real" reasoning lives — not in the per-clue multiple choice.
export interface QuestCheckpoint {
  id: string;
  storyId: string;
  afterClue: string; // clue id that must be solved before this checkpoint appears
  kind: "mid" | "final";
  title: string;
  scenario: string; // markdown
  entities: string[];
  options: string[];
  answer: Record<string, string>;
  wrongConsequence: string; // real narrative cost + a genuine logical nudge
  explain: string;
  resolution?: string; // "final" only — the story's actual written ending
}

export const QUEST_CHECKPOINTS: QuestCheckpoint[] = [
  // ------------------------------------------------------------------
  // Murder on the Night Train
  // ------------------------------------------------------------------
  {
    id: "train-mid",
    storyId: "night-train-murder",
    afterClue: "train-6",
    kind: "mid",
    title: "Five Alibis",
    scenario:
      "You gather what you've learned and lay out each passenger's account side by side.\n\n" +
      "**Madame Dubois:** \"The Colonel and I played cards in the dining car until one, then I went straight to bed.\"\n\n" +
      "**Colonel Price:** \"Just as she says — cards until one, exactly.\"\n\n" +
      "**Mr. Henley:** \"I never left my compartment after ten. Ask the dining staff — they saw me turn in.\"\n\n" +
      "**Lady Winslow:** \"Fast asleep by eleven. Alone, so no one can vouch for me — which I realize looks poor.\"\n\n" +
      "**Jenkins (porter):** \"I did my rounds until midnight. I'm the one who found Mr. Ashford's door forced.\"\n\n" +
      "You already know two things that don't sit well: the \"exact hand\" the Colonel and Dubois both swear to is statistically almost impossible to have happened honestly — and the blow itself came from a swing far too low for a man of Jenkins's height.",
    entities: ["Madame Dubois", "Colonel Price", "Mr. Henley", "Lady Winslow", "Jenkins"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      "Madame Dubois": "Alibi Breaks",
      "Colonel Price": "Alibi Breaks",
      "Mr. Henley": "Alibi Holds",
      "Lady Winslow": "Alibi Breaks",
      Jenkins: "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and the investigation loses ground — one more nervous passenger, one more day you don't have. Look again at *who corroborates whom*: two people vouching for each other isn't the same as two people being telling the truth, especially when the story they're both vouching for doesn't hold up on its own (remember the odds you calculated). And an unwitnessed alibi isn't proof of guilt by itself — only proof that you can't yet rule it out.",
    explain:
      "Dubois and Price corroborate a card game whose central claim is statistically almost impossible — the kind of mutual corroboration that's more consistent with two people covering for each other than with two people telling the truth. Henley's account is independently confirmed by dining staff, so it holds. Winslow's alibi is unwitnessed and — as your rate-and-distance calculation showed — leaves exactly enough time for a round trip, so it breaks, though that alone doesn't make her guilty. Jenkins is cleared outright by physical evidence: the blow's low angle doesn't fit a man his height.",
  },
  {
    id: "train-final",
    storyId: "night-train-murder",
    afterClue: "train-10",
    kind: "final",
    title: "The Dining Car",
    scenario:
      "You gather the three remaining suspects in the dining car. Rosalind stands by the door.\n\n" +
      "**Madame Dubois:** \"It was the Colonel. I saw him leave his compartment near two in the morning — I was too frightened to say so before.\"\n\n" +
      "**Colonel Price:** \"She's lying to save herself. *She's* the one Ashford was blackmailing — under the name 'Countess Renard.' Ask him yourselves whose handwriting matches those letters.\"\n\n" +
      "**Lady Winslow:** \"I only wanted my letters back. I never touched him — I didn't even know where his compartment was.\"\n\n" +
      "You already know Ashford was blackmailing several people under different aliases, in the same hand — and that the taunting cipher, once decoded, wasn't a confession. It was a message sent *to* someone.",
    entities: ["Madame Dubois", "Colonel Price", "Lady Winslow"],
    options: ["Guilty", "Innocent"],
    answer: {
      "Madame Dubois": "Innocent",
      "Colonel Price": "Guilty",
      "Lady Winslow": "Innocent",
    },
    wrongConsequence:
      "The dining car goes silent, and then — nothing. No confession, no crack in anyone's composure except a single, brief flicker from the Colonel when you look away from him. You've named the wrong name. Think again about who has the oldest, deepest motive — not who has the most to hide tonight, but who's had the longest time to want this.",
    explain:
      "Dubois's secret — the blackmail alias — gives her a motive to hide something, but not to kill; a blackmail victim who murders their blackmailer usually does it quietly, not with a struggle loud enough to leave a smashed watch and a bloodstained wall. Winslow's alibi broke on the numbers, but breaking an alibi only proves opportunity, not intent, and nothing else ties her to the scene. Colonel Price had the oldest motive of all — a business betrayal years before this train ever left the station — and every clue that seemed to clear him (the corroborated alibi, the composed manner) turns out to be exactly the kind of alibi a planner builds in advance.",
    resolution:
      "You lay it out for the dining car, piece by piece: the watch, wound back through a clock that loops on itself. The stride length in the snow — thirty exact paces, someone who knew precisely where they were going and precisely how to stop. The strongbox, opened not by luck but by an algorithm two thousand years old, spilling out proof that Ashford was blackmailing half the car. The cipher — not a confession, but a taunt, sent by someone who thought they'd already won. The angle of the blow, ruling out the one man tall enough to be above suspicion by his silhouette. And the improbable hand of cards, corroborated by two people whose stories were built to protect each other rather than to be true.\n\n" +
      "Colonel Price doesn't run — there's nowhere to run, on a train stuck in a snowdrift. He simply sets down his glass. \"He ruined me once, twenty years ago,\" he says quietly. \"I only meant to talk to him.\" Rosalind sends word ahead the moment the line reopens. As the Meridian Express finally lurches forward into the grey morning, you realize the case was never really about a dead man in a locked room — it was about a column of numbers that simply refused to add up to an innocent explanation, however many times everyone at that table tried to make them.",
  },

  // ------------------------------------------------------------------
  // The Euclid Trail
  // ------------------------------------------------------------------
  {
    id: "euclid-mid",
    storyId: "euclid-trail",
    afterClue: "euclid-5",
    kind: "mid",
    title: "The Three Paths",
    scenario:
      "Beyond the mosaic chamber, the passage splits into three carved paths, each inscribed with a claim in old Greek. Elena reads them aloud:\n\n" +
      "**Path A:** \"The three angles of any triangle, drawn on a flat floor, always sum to two right angles.\"\n\n" +
      "**Path B:** \"Two lines drawn parallel will, given enough distance, eventually meet.\"\n\n" +
      "**Path C:** \"Every triangle contains exactly one right angle.\"\n\n" +
      "\"One of these is safe,\" Elena says. \"The old builders always hid their true path behind a claim that's actually, provably true — every time, for every case. The others are traps.\"",
    entities: ["Path A", "Path B", "Path C"],
    options: ["True Path", "False Path"],
    answer: { "Path A": "True Path", "Path B": "False Path", "Path C": "False Path" },
    wrongConsequence:
      "The floor tilts beneath false stone and you scramble back before it fully opens — no fall, just a lost hour retracing your steps. Elena catches her breath. \"Test each claim the way Euclid would,\" she says. \"Not 'is this true for a triangle I can picture' — is it true for *every* triangle, *every* pair of lines, without exception?\"",
    explain:
      "Path A states the angle-sum theorem, true for every flat triangle without exception — the real path. Path B directly contradicts the parallel postulate: parallel lines are defined by never meeting, however far extended. Path C is false because most triangles have zero right angles, and at most one triangle-type (right triangles) has exactly one — 'every triangle' is doing all the false work in that sentence.",
  },
  {
    id: "euclid-final",
    storyId: "euclid-trail",
    afterClue: "euclid-10",
    kind: "final",
    title: "Three Chambers",
    scenario:
      "Beyond the vault door, three final chambers, each sealed, each marked with an inscription:\n\n" +
      "**Chamber 1:** \"The sum of the first n odd numbers is always a perfect square.\"\n\n" +
      "**Chamber 2:** \"The ratio of a circle's circumference to its diameter eventually repeats its digits.\"\n\n" +
      "**Chamber 3:** \"Some prime number greater than two is even.\"\n\n" +
      "\"The real chamber holds the scroll,\" Elena says. \"The other two are sealed forever the moment you choose wrong. Choose carefully.\"",
    entities: ["Chamber 1", "Chamber 2", "Chamber 3"],
    options: ["Real Chamber", "False Chamber"],
    answer: { "Chamber 1": "Real Chamber", "Chamber 2": "False Chamber", "Chamber 3": "False Chamber" },
    wrongConsequence:
      "Stone grinds shut behind the wrong door, sealed for good this time. Elena exhales slowly. \"Check the claim against a real example, not a feeling,\" she says. \"1, then 1+3, then 1+3+5 — do the actual sums, and see what they become.\"",
    explain:
      "1 = 1², 1+3 = 4 = 2², 1+3+5 = 9 = 3² — the pattern holds for every case and never fails, so Chamber 1 is real. Pi is irrational: its digits never repeat, ever, which was proven long after Euclid but is exactly the kind of claim his own method of proof by contradiction can still be used to establish. And 2 is the only even prime there will ever be — every other even number is divisible by 2 itself, so it can never be prime.",
    resolution:
      "The true chamber opens onto a small, dry room, untouched for two thousand years. At its center, a stone table holds a single sealed scroll case — and beside it, an inscription that isn't a proof at all, but a note, added centuries after Euclid's death by whoever built this place: \"He asked us to hide his private notes, not his public work — the *Elements* he gave to everyone. These pages were only ever for the ones patient enough to walk the whole path themselves.\"\n\n" +
      "Elena laughs, quietly, in the torchlight. \"Two thousand years of guardians,\" she says, \"just to protect a man's rough drafts.\" You break the seal carefully. Inside: diagrams in a hand you recognize immediately from a hundred textbook facsimiles — corrections, false starts, a proof crossed out and rewritten twice in the margin. Not a treasure of gold. Something better: proof that even Euclid himself had to work it out one wrong turn at a time, exactly like you just did.",
  },

  // ------------------------------------------------------------------
  // The Statistician's Gambit
  // ------------------------------------------------------------------
  {
    id: "stat-mid",
    storyId: "statisticians-gambit",
    afterClue: "stat-5",
    kind: "mid",
    title: "Five Alibis, Five Numbers",
    scenario:
      "You gather what's known and lay each account side by side.\n\n" +
      "**Mr. Abernathy:** \"I was reviewing pricing models all evening, alone in my office.\"\n\n" +
      "**Mrs. Calloway:** \"I left promptly at five, straight home. Ask anyone.\"\n\n" +
      "**Mr. Devereux:** \"I was in the archive returning files Miss Voss lent me — I saw her still working at six.\"\n\n" +
      "**Miss Fairweather:** \"I wasn't even in the building. I had a dinner engagement clear across town.\"\n\n" +
      "**Mr. Griggs:** \"I did my rounds as usual. Saw Mr. Devereux leaving around six-fifteen — and the claims office lights still burning well after that.\"\n\n" +
      "You already know death likely came in the early afternoon, hours before most of the staff had even gone home for the evening.",
    entities: ["Mr. Abernathy", "Mrs. Calloway", "Mr. Devereux", "Miss Fairweather", "Mr. Griggs"],
    options: ["Trustworthy", "Evasive"],
    answer: {
      "Mr. Abernathy": "Evasive",
      "Mrs. Calloway": "Evasive",
      "Mr. Devereux": "Trustworthy",
      "Miss Fairweather": "Trustworthy",
      "Mr. Griggs": "Trustworthy",
    },
    wrongConsequence:
      "You clear the wrong people, and a day is lost chasing it. Look again at who has independent corroboration and who doesn't: Griggs's own account — from someone with nothing at stake either way — either backs up a story or quietly contradicts it. An alibi nobody else can confirm isn't proof of guilt, but it isn't proof of anything else either.",
    explain:
      "Devereux's account is independently confirmed by Griggs, so it holds. Fairweather has an outside alibi — a dinner engagement — that places her elsewhere entirely, and nothing ties her to the building. Griggs himself has no motive and is the one supplying the key independent detail, so his account holds too. But Calloway's claim of leaving \"promptly at five\" doesn't survive Griggs's own sighting of lights still on in the claims office well after Devereux left at six-fifteen — her own office, unaccounted for. And Abernathy's alibi is entirely unwitnessed, alone in his office at exactly the hour that matters most.",
  },
  {
    id: "stat-final",
    storyId: "statisticians-gambit",
    afterClue: "stat-10",
    kind: "final",
    title: "The Claims Office",
    scenario:
      "You confront the two remaining names in the claims office itself, ledgers spread across the desk between you.\n\n" +
      "**Mr. Abernathy:** \"It was Calloway. She's the one whose signature approves every fraudulent claim on Voss's list — not mine.\"\n\n" +
      "**Mrs. Calloway:** \"Abernathy's only trying to save his precious pricing models from embarrassment. I signed what I was told to sign — by him.\"\n\n" +
      "You already know the total padded across twelve quarters matches, to the exact dollar, a private loan repayment recorded under one name alone.",
    entities: ["Mr. Abernathy", "Mrs. Calloway"],
    options: ["Guilty", "Innocent"],
    answer: { "Mr. Abernathy": "Innocent", "Mrs. Calloway": "Guilty" },
    wrongConsequence:
      "The claims office goes quiet, and nothing more is said — you've accused the wrong name, and whatever nerve the real culprit had left settles right back into place. Think about which of these two actually stood to go to prison over this, versus which one merely stood to be embarrassed by a faulty model.",
    explain:
      "Abernathy's models being discredited is a professional humiliation, not a crime — an unflattering outcome, but not one that usually drives a person to murder over. Calloway's exposure is criminal, direct, and provable: her own signature is on the fraudulent approvals, her own deviation from the norm was statistically damning on its own, and the exact total matches a debt in her own name. Every clue that pointed generally at 'the claims department' pointed, once followed all the way through, specifically at her.",
    resolution:
      "You lay it out for her, piece by piece: the body's own temperature, ticking backward to an hour when half the staff could still place her in the building. The one claim that stood out from all the rest like a struck match. The exact percentage it had been padded by — clean, deliberate, no different from the padding on eleven quarters before it. Her own approval pattern, deviating from every colleague's by a margin no honest coincidence could produce twice, let alone as a matter of routine. The correlation between claim size and rubber-stamp speed, running in the one direction an honest process should never run. And the sum of it all, added up the way a schoolboy once summed the first hundred numbers in an afternoon, landing on a dollar figure that matched a loan only she had taken out.\n\n" +
      "Mrs. Calloway doesn't deny it — there's nothing left to deny. \"The debt would have ruined me either way,\" she says quietly, \"the moment anyone actually checked the numbers.\" Pratt looks faintly ill as the police are sent for. \"She was the one person in this building who genuinely understood how easy the fraud was to spot,\" he says, \"and she still thought no one ever would.\" You close Miss Voss's ledger gently. In the end, the woman who died uncovering the pattern and the numbers that finally convicted her killer were the very same ones — Voss had simply run out of time to act on what she'd found.",
  },

  // ------------------------------------------------------------------
  // Pirate's Cove
  // ------------------------------------------------------------------
  {
    id: "cove-mid",
    storyId: "pirates-cove",
    afterClue: "cove-5",
    kind: "mid",
    title: "Which Marker Tells the Truth?",
    scenario:
      "Before descending further, three carved markers block three onward passages, each bearing a claim in the old captain's hand. Bess reads them aloud:\n\n" +
      "**Marker A:** \"Tie two ropes of equal length from the same two fixed points to a moving third point — that point can trace a path where the two ropes plus the fixed distance between the points always add up to the same total, however it moves.\"\n\n" +
      "**Marker B:** \"A triangle can have two right angles.\"\n\n" +
      "**Marker C:** \"Any three lengths at all, whatever they are, can be joined to form a triangle.\"\n\n" +
      "\"The true passage sits behind whichever claim is actually, provably true,\" Bess says. \"Every time, no exceptions — that was always the old captain's one rule.\"",
    entities: ["Marker A", "Marker B", "Marker C"],
    options: ["True Claim", "False Claim"],
    answer: { "Marker A": "True Claim", "Marker B": "False Claim", "Marker C": "False Claim" },
    wrongConsequence:
      "The wrong passage narrows to a dead end, and you double back with nothing but sore shins for the trouble. \"Check each one the way the captain would have,\" Bess says. \"Not 'does this sound plausible' — is it true for absolutely every case, or can you think of even one where it breaks?\"",
    explain:
      "Marker A describes a real, provable construction — an ellipse, in fact, and it holds for every position the third point takes. Marker B is false: a triangle's three angles must sum to exactly two right angles total, so two right angles alone would leave nothing at all for the third. Marker C is false too — you just proved it yourself at the first two rings: three lengths only form a triangle if any two of them together outstretch the third.",
  },
  {
    id: "cove-final",
    storyId: "pirates-cove",
    afterClue: "cove-10",
    kind: "final",
    title: "Three Chests",
    scenario:
      "Bess reads each stone chest's carved inscription aloud:\n\n" +
      "**Chest 1:** \"Every gold coin in the real chest weighs exactly the same — weigh any ten of them, and you know the weight of all one hundred.\"\n\n" +
      "**Chest 2:** \"A circle can be divided into seven perfectly equal pie-slices using nothing but a straightedge and compass, the same as it can be divided into six.\"\n\n" +
      "**Chest 3:** \"Double a chest's width, height, and depth all at once, and you double how much it holds.\"\n\n" +
      "\"One of these is true without a single exception,\" Bess says. \"The other two are the captain's last joke on anyone in too much of a hurry to check.\"",
    entities: ["Chest 1", "Chest 2", "Chest 3"],
    options: ["Real Chest", "False Chest"],
    answer: { "Chest 1": "Real Chest", "Chest 2": "False Chest", "Chest 3": "False Chest" },
    wrongConsequence:
      "Stone grinds down over the wrong chest, sealed for good. Bess sighs. \"Doubling every side of something doesn't just double what's inside it,\" she says. \"Think about what happens to a cube's volume when you double each edge — try it with small numbers before you pick again.\"",
    explain:
      "Chest 1 holds exactly, always — if every coin genuinely weighs the same, ten of them tell you the truth about all one hundred, with no exception possible. Chest 2 is false: a regular hexagon can be built with just a compass and straightedge, but a regular heptagon provably cannot — a real, two-thousand-year-old fact about which shapes those two tools alone can ever produce. And Chest 3 is false because volume scales with the cube of the size, not the size itself: doubling every dimension multiplies the volume by 2×2×2, eight times over, not two.",
    resolution:
      "The real chest gives way with a groan of old iron, and there it is — Captain Corvin Blackwater's true hoard, exactly as the letters promised, gold and gemstones dulled by a century of salt air but unmistakably real. Tucked beneath the coins, a waterproofed logbook, the captain's own hand: \"A crew will lie to your face for a share. A rope will lie about its own length if you're careless measuring it. But two and two has never once lied to any man who checked it properly, and so I built my whole fortune's protection on nothing else.\"\n\n" +
      "Bess laughs, low and disbelieving, running gold through her fingers. \"Ten years chasing this cove,\" she says, \"and it turns out the old devil trusted arithmetic more than he trusted people — and he wasn't wrong to.\" You seal the logbook carefully; some things are worth more read twice. Above you, the tide is already turning for its next cycle, indifferent, exactly on schedule, exactly as it always was.",
  },

  // ------------------------------------------------------------------
  // Blood on the Chessboard
  // ------------------------------------------------------------------
  {
    id: "chess-mid",
    storyId: "blood-on-the-chessboard",
    afterClue: "chess-5",
    kind: "mid",
    title: "Five Accounts",
    scenario:
      "You gather the five accounts of that evening and lay them side by side.\n\n" +
      "**Olenska:** \"I was resting in my room from eight until ten, alone, preparing for tomorrow's round.\"\n\n" +
      "**Whitfield:** \"I spent the whole evening in the analysis room, discussing broadcast plans with the arbiters.\"\n\n" +
      "**Petrov:** \"I left the venue entirely around seven — dinner with my wife, clear across town.\"\n\n" +
      "**Delacroix:** \"I was interviewing Olenska in the press room until nine. She can confirm it.\"\n\n" +
      "**Halvorsen:** \"I did my usual rounds all evening, checking every board myself.\"\n\n" +
      "You already know 23 minutes sit entirely unaccounted for between the last recorded move and Chen's return — and Halvorsen's own rounds log makes no mention of ever seeing Whitfield in the analysis room at all.",
    entities: ["Olenska", "Whitfield", "Petrov", "Delacroix", "Halvorsen"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      Olenska: "Alibi Holds",
      Whitfield: "Alibi Breaks",
      Petrov: "Alibi Breaks",
      Delacroix: "Alibi Holds",
      Halvorsen: "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and Halvorsen quietly loses patience with the delay. Look again at which accounts actually confirm *each other* independently, rather than each person simply vouching for themselves — and ask whether anyone else's own account happens to either back up or quietly contradict a claim.",
    explain:
      "Olenska and Delacroix confirm each other's account directly, and neither one's story depends only on their own word. Halvorsen has no motive and is the one supplying an independent, consistent record of his own rounds. But Whitfield's claimed evening in the analysis room is never once mentioned in that same rounds log, and Petrov's account is entirely unwitnessed from the moment he says he left — the two accounts with no outside confirmation at all.",
  },
  {
    id: "chess-final",
    storyId: "blood-on-the-chessboard",
    afterClue: "chess-10",
    kind: "final",
    title: "The Analysis Room",
    scenario:
      "You confront the two remaining names where the tournament's real business always happened — the analysis room, boards still set up from the night's broadcast.\n\n" +
      "**Whitfield:** \"It was Petrov. Everyone in this world knows he never forgave Kessler for that book — ask anyone.\"\n\n" +
      "**Petrov:** \"Ask instead who had a fortune riding on tonight's result, and go looking for a betting account under a name that isn't his own.\"\n\n" +
      "You already know the smudged fourth rating decodes to a proxy account, and that Chen's flawless, instant preparation only makes sense if someone leaked Kessler's own intended opening to her in advance.",
    entities: ["Whitfield", "Petrov"],
    options: ["Guilty", "Innocent"],
    answer: { Whitfield: "Guilty", Petrov: "Innocent" },
    wrongConsequence:
      "The room goes silent, and nothing more is offered — you've named the wrong man, and whatever composure the real culprit had left settles right back into place. Consider which of these two actually stood to lose real money the moment Kessler's position turned winning again, tonight, of all nights.",
    explain:
      "Petrov's grudge is old, public, and years cold — precisely the kind of motive that makes a dramatic headline but rarely a fresh murder. Whitfield's motive is immediate and financial: a leaked opening engineered to make Kessler lose, a betting account hidden behind a proxy name, and a rounds log that quietly places him nowhere near where he claimed to be at the one moment that matters. When Kessler's position turned toward a forced win instead of the loss Whitfield's fortune depended on, the plan stopped being about chess at all.",
    resolution:
      "You lay it out plainly: the 23 unaccounted minutes, matching exactly the gap in Halvorsen's own rounds log where Whitfield claims he never left the analysis room. The leaked opening, landing in Chen's hands with a precision no honest preparation explains. The smudged fourth rating, decoding to a proxy account that traces straight back to an underground betting ring — Whitfield's ring, built on Kessler losing tonight, not winning. And Kessler's own final, frozen position: a forced mate in two, the plan already failing before anyone ever touched him.\n\n" +
      "Whitfield doesn't bother denying it once Mira produces the arbiter's actual rounds log. \"He was going to win anyway,\" he says quietly, as if that were somehow the injustice. \"All of it, gone, over one game.\" Petrov says nothing for a long moment, then simply turns back to the board — his board now, in a final he never expected to reach honestly. \"Kessler would have appreciated the irony,\" he says at last. \"Undone by the same odds he spent his whole life calculating in his opponents' favor.\"",
  },

  // ------------------------------------------------------------------
  // The Lighthouse Keeper's Code
  // ------------------------------------------------------------------
  {
    id: "lighthouse-mid",
    storyId: "lighthouse-keepers-code",
    afterClue: "light-5",
    kind: "mid",
    title: "Three Theories",
    scenario:
      "Before trusting the rest of Hale's cipher, Finch proposes three theories about how the old keeper's numbers actually behave, each backed by a claim:\n\n" +
      "**Theory A:** \"Any two numbers that are both evenly divisible by 7 will always have a difference that's also evenly divisible by 7.\"\n\n" +
      "**Theory B:** \"A number divisible by both 2 and 3 might still leave a remainder when divided by 6.\"\n\n" +
      "**Theory C:** \"The remainder when dividing any whole number by 14 can be as large as 14 itself.\"\n\n" +
      "\"Hale only ever trusted a rule that held every single time,\" Finch says. \"Which of these actually does?\"",
    entities: ["Theory A", "Theory B", "Theory C"],
    options: ["Always True", "Not Always True"],
    answer: { "Theory A": "Always True", "Theory B": "Not Always True", "Theory C": "Not Always True" },
    wrongConsequence:
      "You trust the wrong rule for a while, and it costs you a wasted afternoon re-checking work that never needed re-checking. \"Test it against real numbers, not just the shape of the sentence,\" Finch says. \"Try small examples before you decide a rule always holds.\"",
    explain:
      "Theory A holds every time: if 7 divides both numbers evenly, it divides their difference evenly too, without exception. Theory B is false — 6 is exactly 2 times 3, so anything divisible by both 2 and 3 is automatically divisible by 6 as well, with nothing left over. Theory C is false because a remainder must always be smaller than what you're dividing by — dividing by 14 can leave at most 13, never 14 itself.",
  },
  {
    id: "lighthouse-final",
    storyId: "lighthouse-keepers-code",
    afterClue: "light-10",
    kind: "final",
    title: "Three Dive Spots",
    scenario:
      "Three possible dive spots sit within the triangulated area, each marked on Hale's chart with a claim:\n\n" +
      "**Spot 1:** \"A triangle with sides 5, 12, and 13 must be a right triangle.\"\n\n" +
      "**Spot 2:** \"A prime number can never be one more than a multiple of 4.\"\n\n" +
      "**Spot 3:** \"Flip a fair coin 10 times, and you're guaranteed exactly 5 heads.\"\n\n" +
      "\"Only one of these is true without a single exception,\" Finch says. \"Hale built his whole code on that one rule — no guessing, no 'usually.'\"",
    entities: ["Spot 1", "Spot 2", "Spot 3"],
    options: ["Real Spot", "False Spot"],
    answer: { "Spot 1": "Real Spot", "Spot 2": "False Spot", "Spot 3": "False Spot" },
    wrongConsequence:
      "You dive the wrong spot and surface with nothing but cold water and lost time. \"Check the claim against a real example,\" Finch calls down. \"Small numbers, worked out by hand, not a guess about how it probably goes.\"",
    explain:
      "Spot 1 holds exactly: 5² + 12² = 25 + 144 = 169 = 13², a genuine Pythagorean triple, true every time those three numbers appear together. Spot 2 is false — 5 and 13 are both prime and both exactly one more than a multiple of 4 (4×1+1 and 4×3+1). Spot 3 is false because probability never guarantees a specific outcome, only makes some outcomes more likely than others; ten fair flips could just as easily land 7 heads, or 2.",
    resolution:
      "The chest at Spot 1 gives way to Finch's crowbar, and the Calypso's Promise reveals herself at last — timbers long since claimed by the reef, but her strongbox intact, exactly where two honest bearings said it would be. Inside, alongside the coin and silver, one final page in Hale's own hand, sealed in oilcloth against a century of seawater: \"A keeper's whole trade is trusting what repeats — the light's own turn, the tide's own hour, a number that never once lies about what it truly is. I hid this where only that same patience could ever find it.\"\n\n" +
      "Finch sits back against the rocks, treasure forgotten for a moment, just reading the old man's hand. \"He wasn't hiding it from thieves at all,\" she says slowly. \"He was hiding it *for* whoever was patient enough to actually check his numbers instead of just believing them.\" Above the cove, right on schedule, the tide has already begun its long, patient turn toward the next low.",
  },
];

export function checkpointsForStory(storyId: string): QuestCheckpoint[] {
  return QUEST_CHECKPOINTS.filter((c) => c.storyId === storyId);
}

export function checkpointAfterClue(storyId: string, clueId: string): QuestCheckpoint | undefined {
  return QUEST_CHECKPOINTS.find((c) => c.storyId === storyId && c.afterClue === clueId);
}
