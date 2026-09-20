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

  // ------------------------------------------------------------------
  // The Cryptographer's Curse
  // ------------------------------------------------------------------
  {
    id: "crypto-mid",
    storyId: "cryptographers-curse",
    afterClue: "crypto-5",
    kind: "mid",
    title: "Five Accounts",
    scenario:
      "You gather the five accounts of that evening and lay them side by side.\n\n" +
      "**Ashworth:** \"I was on duty at the front desk from six until midnight — the duty sergeant signed my log himself.\"\n\n" +
      "**Lindqvist:** \"I left my office at six sharp, straight home. Nothing more to say.\"\n\n" +
      "**Reyes:** \"I was on the overnight line to the coastal station from seven until well past ten — check the exchange's own records.\"\n\n" +
      "**Okonkwo:** \"I was alone in the cipher room, working through the backlog. No one else was there to see it.\"\n\n" +
      "**Pettigrew:** \"I did my rounds as usual, every hour on the hour. Lindqvist's office light was still burning well past nine — I remember thinking it odd, since he'd told me earlier he meant to leave early.\"\n\n" +
      "You already know Dr. Faraday's body was found at half past ten, and that whoever reached her had to pass directly beneath Pettigrew's own rounds route.",
    entities: ["Ashworth", "Lindqvist", "Reyes", "Okonkwo", "Pettigrew"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      Ashworth: "Alibi Holds",
      Lindqvist: "Alibi Breaks",
      Reyes: "Alibi Holds",
      Okonkwo: "Alibi Breaks",
      Pettigrew: "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and a full day's lead slips away chasing it. Look again at who has independent corroboration from someone with nothing at stake, and who is only vouching for themselves — an unwitnessed account isn't proof of guilt, but it isn't proof of anything else either.",
    explain:
      "Ashworth's log is countersigned by the duty sergeant, so it holds. Reyes's account is confirmed independently by the exchange's own phone records. Pettigrew has no motive at all and is the one supplying the key contradicting detail, so his account holds too. But Lindqvist's claim of leaving at six sharp is directly contradicted by Pettigrew's own rounds — an office light burning three hours after he said he'd already gone. And Okonkwo's account is entirely unwitnessed, alone in the cipher room at exactly the hour that matters.",
  },
  {
    id: "crypto-final",
    storyId: "cryptographers-curse",
    afterClue: "crypto-10",
    kind: "final",
    title: "The Code Room",
    scenario:
      "You confront the two remaining names in the code room itself, the day's traffic still pinned to the board between you.\n\n" +
      "**Lindqvist:** \"It was Okonkwo. Ask anyone — she never forgave Faraday for what happened with her fiancé, years back. Old wounds don't close, not really.\"\n\n" +
      "**Okonkwo:** \"Ask instead who stood to lose everything the moment Faraday's real breakthrough went on record under her own name, instead of his.\"\n\n" +
      "You already know the access code recovered from the final lock matches, digit for digit, a personnel number issued to exactly one person in this room.",
    entities: ["Lindqvist", "Okonkwo"],
    options: ["Guilty", "Innocent"],
    answer: { Lindqvist: "Guilty", Okonkwo: "Innocent" },
    wrongConsequence:
      "The code room goes quiet, and nothing more is offered — you've named the wrong name, and whatever nerve the real culprit had left settles right back into place. Consider which of these two actually stood to lose their whole career the moment Faraday's name, not theirs, went into the official record.",
    explain:
      "Okonkwo's old grief is genuine but years cold, and grief rarely waits for the one night a shift key finally breaks to act. Lindqvist's motive is immediate and professional: Faraday's breakthrough, once decoded, would have credited her alone for the exact cipher method he'd spent months publicly claiming as nearly his own. And the access code recovered from the final lock — decoded digit by digit — matches his personnel number precisely, not hers.",
    resolution:
      "You lay it out for the room, piece by piece: the frequency count that cracked her final message before anyone else even tried. The shift that turned nonsense into her own handwriting, describing a cipher method two years ahead of anything published. The day's key, recovered the same way every day's key was recovered — by trusting the remainder, not the guess. The safe's combination, broken open by factoring a number nobody else had bothered to factor properly. The parity check that caught the one deliberately falsified entry in an otherwise honest logbook. And the access code, recovered digit by digit from the counting principle's own arithmetic, matching a personnel number that has never once belonged to anyone but Lindqvist.\n\n" +
      "Lindqvist doesn't run — there's nowhere in this building left to run to. \"She was going to publish it under her own name,\" he says quietly, \"two years of my own work, credited to her instead.\" Iris looks faintly ill as the duty sergeant is sent for. \"She wasn't stealing anything,\" she says. \"She was just finally about to prove she'd already solved it — and that's exactly what he couldn't survive.\" You close the code room's log gently. In the end, the woman who cracked the bureau's hardest cipher and the arithmetic that finally caught her killer were built from the very same kind of patience — checking the numbers all the way through, however long it took.",
  },

  // ------------------------------------------------------------------
  // The Sky Chart Expedition
  // ------------------------------------------------------------------
  {
    id: "sky-mid",
    storyId: "sky-chart-expedition",
    afterClue: "sky-5",
    kind: "mid",
    title: "Three Star-Paths",
    scenario:
      "Before committing to a route up the ridge, three carved trail-markers block three onward paths, each bearing a claim in the astronomer-priests' own hand. Amara reads them aloud:\n\n" +
      "**Path A:** \"Two triangles with the same three angles always have their corresponding sides in the same ratio, however large or small each triangle is.\"\n\n" +
      "**Path B:** \"A star's brightness, as it appears to us, always depends only on its true size, never on how far away it is.\"\n\n" +
      "**Path C:** \"Given any two whole numbers, the larger one is always an exact multiple of the smaller one.\"\n\n" +
      "\"The true path sits behind whichever claim is actually, provably true,\" Amara says. \"Every time, no exceptions — that was always their one rule.\"",
    entities: ["Path A", "Path B", "Path C"],
    options: ["True Claim", "False Claim"],
    answer: { "Path A": "True Claim", "Path B": "False Claim", "Path C": "False Claim" },
    wrongConsequence:
      "The wrong path narrows to a sheer drop, and you climb back down with nothing but tired legs for the trouble. \"Test each one the way they would have,\" Amara says. \"Not 'does this sound plausible' — is it true for absolutely every case, or can you think of even one where it breaks?\"",
    explain:
      "Path A describes real similar-triangle geometry, and it holds for every matching pair of angles, at any scale. Path B is false — two stars of the same true size can look wildly different in brightness depending on distance alone, which is exactly why brightness alone can't tell you a star's true size. Path C is false too: 7 and 3 are both whole numbers, and 7 is not a multiple of 3 — one clean counterexample is all it takes to break an 'always' claim.",
  },
  {
    id: "sky-final",
    storyId: "sky-chart-expedition",
    afterClue: "sky-10",
    kind: "final",
    title: "Three Marked Valleys",
    scenario:
      "Amara reads each valley marker's carved inscription aloud:\n\n" +
      "**Valley 1:** \"A triangle's exterior angle always equals the sum of the two interior angles that aren't next to it.\"\n\n" +
      "**Valley 2:** \"Squaring a negative number always gives a negative result.\"\n\n" +
      "**Valley 3:** \"The average of a set of numbers must always be one of the numbers in that set.\"\n\n" +
      "\"One of these is true without a single exception,\" Amara says. \"They built their whole cache's protection on that one rule — no guessing, no 'usually.'\"",
    entities: ["Valley 1", "Valley 2", "Valley 3"],
    options: ["Real Valley", "False Valley"],
    answer: { "Valley 1": "Real Valley", "Valley 2": "False Valley", "Valley 3": "False Valley" },
    wrongConsequence:
      "You descend into the wrong valley and find only bare rock for your trouble. \"Check the claim against a real example,\" Amara calls down. \"Work it out with small numbers by hand, not a guess about how it probably goes.\"",
    explain:
      "Valley 1 holds exactly, every time — a triangle's exterior angle is what's left once you remove its adjacent interior angle from a straight line, and that leftover always equals the other two interior angles combined. Valley 2 is false: a negative number times itself is a positive, always — (-3) × (-3) = 9, not -9. Valley 3 is false because an average frequently lands on a number that isn't in the original set at all — the average of 1 and 3 is 2, and 2 was never one of the numbers you started with.",
    resolution:
      "The real valley opens onto a shallow basin, and there it is — the astronomer-priests' true cache, sun-bleached instruments and star-charts sealed in stone for longer than any nearby nation has kept written records. Beneath the charts, wrapped in oiled cloth, one final tablet in a steadier hand: \"We trusted the sky because it never once lied to us about what was true — a shadow's angle, a star's true brightness once distance is accounted for, a ratio that holds however far you scale it. We hid this where only that same patience could ever find it.\"\n\n" +
      "Amara sits back against the rock, chart forgotten for a moment, turning the tablet over in her hands. \"They weren't hiding this from thieves,\" she says slowly. \"They were hiding it *for* whoever was patient enough to check their numbers instead of just admiring the sky.\" Above the valley, the stars are already wheeling toward morning, exactly on schedule, exactly as they always were.",
  },

  // ------------------------------------------------------------------
  // The Clockmaker's Secret
  // ------------------------------------------------------------------
  {
    id: "clock-mid",
    storyId: "clockmakers-secret",
    afterClue: "clock-5",
    kind: "mid",
    title: "Five Accounts",
    scenario:
      "You gather the five accounts of that evening and lay them side by side.\n\n" +
      "**Callum:** \"I left straight after closing, same as always — the corner baker can vouch, he waves at me most nights on my way home.\"\n\n" +
      "**Mercer:** \"I was at my own shop preparing tomorrow's commission bid — my journeyman was there with me the whole time.\"\n\n" +
      "**Lady Ashcombe:** \"I was at a dinner party clear across town. A dozen witnesses, if you need them.\"\n\n" +
      "**Grimsby:** \"I stayed late doing this month's books, same as any month's end — Pruitt saw my light on past eleven.\"\n\n" +
      "**Pruitt:** \"I did my rounds as usual, every hour. Grimsby's light was indeed still burning past eleven — though the ledger page open on his desk wasn't this month's at all. It was three months back.\"\n\n" +
      "You already know Thorne's body was found by Wren just past midnight, and that the workshop's side door is only reachable from inside the building, past both the workbench and Grimsby's own office.",
    entities: ["Callum", "Mercer", "Lady Ashcombe", "Grimsby", "Pruitt"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      Callum: "Alibi Breaks",
      Mercer: "Alibi Holds",
      "Lady Ashcombe": "Alibi Holds",
      Grimsby: "Alibi Breaks",
      Pruitt: "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and a full night's lead slips away chasing it. Look again at which claims are corroborated by someone confirming *that specific night*, and which are only corroborated by habit — and check whether Pruitt's own detail actually matches what someone claimed to be doing.",
    explain:
      "Mercer's account is independently confirmed by his journeyman, and Lady Ashcombe has a dozen witnesses placing her elsewhere entirely — both hold. Pruitt himself has no motive and supplies the key detail, so his account holds too. But Callum's alibi rests only on a baker who 'waves most nights' — a habit, not a confirmation of this particular one. And Grimsby's claim of doing 'this month's books' doesn't survive Pruitt's own sighting: a ledger three months old, open on his desk, the wrong book entirely for a man supposedly closing out this month's accounts.",
  },
  {
    id: "clock-final",
    storyId: "clockmakers-secret",
    afterClue: "clock-10",
    kind: "final",
    title: "The Workshop",
    scenario:
      "You confront the two remaining names among the Sentinel's silent gears.\n\n" +
      "**Callum:** \"It was Grimsby. Thorne's own ledgers were about to expose years of skimming — ask anyone in the trade, that kind of secret is worth killing to keep buried.\"\n\n" +
      "**Grimsby:** \"Ask instead who resented being passed over for the whole workshop just last month. Old wounds like that don't stay quiet forever.\"\n\n" +
      "You already know the recovered ledger page — the one Pruitt unknowingly spotted, three months out of date — was deliberately left open to a page Grimsby had personally altered, and that Thorne's own precise recalculation would have made the true balance public within the week.",
    entities: ["Callum", "Grimsby"],
    options: ["Guilty", "Innocent"],
    answer: { Callum: "Innocent", Grimsby: "Guilty" },
    wrongConsequence:
      "The workshop goes quiet, and nothing more is offered — you've named the wrong man, and whatever nerve the real culprit had left settles right back into place. Consider which of these two actually stood to be exposed and ruined, versus which one merely lost a promotion he could still earn back with time.",
    explain:
      "Callum's grievance is real but survivable — passed over once doesn't erase thirty years of skill, and nothing suggests the succession was even final. Grimsby's exposure was total and immediate: the altered ledger page, the discrepancy Pruitt himself unknowingly witnessed, and Thorne's own precise bookkeeping closing in within the week. The stamped sequence hidden in the drawer wasn't a threat at all — it was Thorne's own worked calculation of exactly how much Grimsby had taken.",
    resolution:
      "You lay it out for Wren, piece by piece: the gear ratio that first hinted the Sentinel's teeth counts were never chosen for timekeeping alone. The least common multiple marking exactly when two marked gears would realign — the same interval, it turns out, as Grimsby's own quarterly reports. The escapement's steady ticking, giving you the precise hour Thorne's heart actually stopped. The compound ratio buried three gears deep, spelling out nothing until multiplied through in the right order. The modular wrap of the secret dial, landing on exactly the hour matching Grimsby's own falsified entry. The scaled-up pendulum, confirming the model matched the real machine down to the centimeter. The stamped arithmetic sequence, leading straight to the hidden drawer's combination. And the percentage itself — a clean, quarter-share of an account slowly bled dry, calculated the same painstaking way Thorne calculated everything else in his life.\n\n" +
      "Grimsby doesn't bother denying it once the ledger page is laid flat beside Thorne's own final tally. \"He was going to ruin me over arithmetic,\" he says bitterly, as if the numbers themselves were the crime. Wren looks at the Sentinel's still, silent gears for a long moment. \"He built his own death into the very thing he loved most,\" she says finally, \"and he still left it exact enough that we could read it properly.\" Above the workbench, the Sentinel's message-gears sit motionless now, finally, precisely where Thorne left them — telling their true story to whoever was patient enough to count.",
  },

  // ------------------------------------------------------------------
  // The Pharaoh's Vault
  // ------------------------------------------------------------------
  {
    id: "pharaoh-mid",
    storyId: "pharaohs-vault",
    afterClue: "pharaoh-5",
    kind: "mid",
    title: "Three Sealed Passages",
    scenario:
      "Beyond the entrance shaft, the corridor splits into three sealed passages, each carved with a claim. Nadia reads them aloud:\n\n" +
      "**Passage A:** \"A pyramid's volume is always exactly one-third of a rectangular box built to the same base and height.\"\n\n" +
      "**Passage B:** \"Doubling a square's side length always doubles its area.\"\n\n" +
      "**Passage C:** \"A triangle can have two obtuse angles.\"\n\n" +
      "\"The builders sealed the false passages behind claims that sound reasonable but fall apart under real arithmetic,\" Nadia says. \"Check every one properly before you trust it.\"",
    entities: ["Passage A", "Passage B", "Passage C"],
    options: ["True Claim", "False Claim"],
    answer: { "Passage A": "True Claim", "Passage B": "False Claim", "Passage C": "False Claim" },
    wrongConsequence:
      "Sand pours through a hidden vent and you scramble back before the passage floor drops away entirely — no fall, just lost time and a lungful of dust. \"Test each claim against real numbers,\" Nadia says. \"Not what sounds reasonable — what actually holds up once you calculate it.\"",
    explain:
      "Passage A restates exactly what you already proved with your own hands: a pyramid always holds a third of the matching box's volume. Passage B is false — doubling a square's side doesn't double its area, it quadruples it, since area scales with the square of the side, not the side itself. Passage C is false too: any triangle's three angles must sum to exactly 180°, and two angles over 90° each would already exceed that total before the third angle is even counted.",
  },
  {
    id: "pharaoh-final",
    storyId: "pharaohs-vault",
    afterClue: "pharaoh-10",
    kind: "final",
    title: "Three Final Chambers",
    scenario:
      "Nadia reads each final chamber's carved inscription aloud:\n\n" +
      "**Chamber 1:** \"A square's diagonal is always longer than any one of its own sides.\"\n\n" +
      "**Chamber 2:** \"If you double a cube's edge length, its volume also just doubles.\"\n\n" +
      "**Chamber 3:** \"Every rectangle is also a square.\"\n\n" +
      "\"One of these is true without a single exception,\" Nadia says. \"The builders trusted their whole treasury's protection on that one rule.\"",
    entities: ["Chamber 1", "Chamber 2", "Chamber 3"],
    options: ["Real Chamber", "False Chamber"],
    answer: { "Chamber 1": "Real Chamber", "Chamber 2": "False Chamber", "Chamber 3": "False Chamber" },
    wrongConsequence:
      "Stone grinds down over the wrong chamber, sealed for good this time. \"Don't trust the shape of the sentence,\" Nadia says. \"Work the actual numbers, small and concrete, before you decide.\"",
    explain:
      "Chamber 1 holds exactly: a square's diagonal is always side × √2, which is always longer than the side itself, without exception. Chamber 2 is false — doubling a cube's edge doesn't double its volume, it multiplies it by 2³, eight times over, the same trap that catches anyone scaling a solid shape. Chamber 3 is false too: every square happens to be a rectangle, but plenty of rectangles — anything not perfectly equal-sided — are not squares at all.",
    resolution:
      "The real chamber gives way at last, and lantern light spills across a space untouched in millennia — not gold stacked to the ceiling as legend promised, but something the builders clearly valued just as highly: shelf after shelf of measuring rods, sighting instruments, and slate tablets dense with worked calculations, every one checked and rechecked in a careful, ancient hand.\n\n" +
      "\"They really did trust arithmetic over guards,\" Nadia says, running a finger along a tablet's edge. \"No curse, no army — just numbers precise enough that anyone careless would seal themselves out before ever reaching this far.\" Tucked among the tablets, a final inscription, translated slowly by lantern-light: \"What we built, we built to a proportion that never wavers. What we hid, we hid where only the same patience could ever find it.\" Outside, the desert sun is already climbing toward noon, indifferent, exactly on schedule, exactly as the builders' own sundials always promised it would be.",
  },

  // ------------------------------------------------------------------
  // The Conservatory Killing
  // ------------------------------------------------------------------
  {
    id: "conservatory-mid",
    storyId: "conservatory-killing",
    afterClue: "conservatory-5",
    kind: "mid",
    title: "Five Musicians",
    scenario:
      "You gather the five accounts of the break and lay them side by side.\n\n" +
      "**Sabrina Lowe:** \"I was warming up alone in my dressing room the entire break — nobody saw me, but I never left.\"\n\n" +
      "**Dmitri Volkov:** \"I was meeting the hall's board about the guest-conducting post — three board members can vouch for every minute.\"\n\n" +
      "**Countess Fenwick:** \"I was in my private box the whole time, entertaining out-of-town donors. Ask any of them.\"\n\n" +
      "**Pemberton:** \"I was in the box office reconciling tonight's count, same as every night — Ravi saw me still there near intermission.\"\n\n" +
      "**Ravi:** \"I did my usual walk-through before curtain. Pemberton was indeed still in the box office — though the ledger open in front of him wasn't tonight's sales sheet at all. It was last week's.\"\n\n" +
      "You already know Vale's body was found by Odile just after the break ended, and that the podium is reachable only by crossing directly behind the box office.",
    entities: ["Sabrina Lowe", "Dmitri Volkov", "Countess Fenwick", "Pemberton", "Ravi"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      "Sabrina Lowe": "Alibi Breaks",
      "Dmitri Volkov": "Alibi Holds",
      "Countess Fenwick": "Alibi Holds",
      Pemberton: "Alibi Breaks",
      Ravi: "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and the trail goes cold for the night. Look again at which accounts are confirmed by someone with nothing at stake, and which rest only on the speaker's own word — and check whether Ravi's own detail actually matches what someone claimed to be doing.",
    explain:
      "Volkov's account is independently confirmed by three board members, and Fenwick's donors place her elsewhere the entire time — both hold. Ravi has no motive and supplies the key detail, so his account holds too. But Sabrina's alibi rests on no one but herself, alone in her dressing room the whole break. And Pemberton's claim of reconciling 'tonight's count' doesn't survive Ravi's own sighting: a ledger from last week, open on the desk, the wrong sheet entirely for a man supposedly counting tonight's receipts.",
  },
  {
    id: "conservatory-final",
    storyId: "conservatory-killing",
    afterClue: "conservatory-10",
    kind: "final",
    title: "The Podium",
    scenario:
      "You confront the two remaining names at the empty podium.\n\n" +
      "**Sabrina Lowe:** \"It was Pemberton. Vale's own audit was about to expose years of skimmed ticket money — ask anyone who's seen a man protect his own numbers that closely.\"\n\n" +
      "**Pemberton:** \"Ask instead who's been passed over for concertmaster twice now, and who finally ran out of patience waiting for a promise that was never going to be kept.\"\n\n" +
      "You already know the geometric-sequence pattern hidden in Vale's own audit notes — each week's discrepancy doubling — traces the fraud precisely to Pemberton's private account. You also know Sabrina's promotion had already been finalized in writing the very morning Vale died, a fact she never knew.",
    entities: ["Sabrina Lowe", "Pemberton"],
    options: ["Guilty", "Innocent"],
    answer: { "Sabrina Lowe": "Innocent", Pemberton: "Guilty" },
    wrongConsequence:
      "The podium stays silent, and nothing more is offered — you've named the wrong name, and whatever nerve the real culprit had left settles right back into place. Consider which of these two actually had a promise already kept versus one who had everything left to lose.",
    explain:
      "Sabrina's grievance evaporates the moment you learn her promotion had already been signed — she had every reason to want Vale alive to see it through properly, not dead. Pemberton's exposure was total: the doubling discrepancy trailing straight back to his own account, and Vale's own meticulous audit closing in by the week's end.",
    resolution:
      "You lay it out for Odile, piece by piece: the octave ratio that first showed you Vale trusted numbers as much as notes. The time signature's odd beat count, marking exactly which measure he'd stopped conducting mid-rehearsal. The tempo, converted into real minutes, giving you the precise window Vale went silent. The harmonic series, tracing a hidden second melody buried in his own tuning notes. The note-value fractions, breaking his final passage down into exactly the pieces he meant it to be read in. The decibel scale, explaining why no one in a packed hall heard a single cry over the orchestra's own volume. The combinations, narrowing five possible witnesses down to the ones who could have actually seen anything. The geometric sequence, doubling week after week, in an account that was never supposed to exist. The equation Vale solved in his own margin notes, balancing to exactly the amount missing. And the percentage — a clean, exact rate of increase that Pemberton needed the fraud to keep growing at, just to stay ahead of Vale's own audit.\n\n" +
      "Pemberton doesn't bother denying it once the ledger's true sheet is laid beside Vale's own final tally. \"He was going to ruin me over arithmetic,\" he mutters, as though the numbers themselves were somehow the crime. Odile looks at the empty podium for a long moment. \"He built his last message out of the very thing he loved,\" she says quietly, \"and he still made sure it could be read properly, if anyone was patient enough to work it out.\" The symphony hall, dark now but for a single work light over the score, keeps its silence — precisely, finally, exactly on time.",
  },

  // ------------------------------------------------------------------
  // The Silk Road Cipher
  // ------------------------------------------------------------------
  {
    id: "silk-road-mid",
    storyId: "silk-road-cipher",
    afterClue: "silk-road-5",
    kind: "mid",
    title: "Three Waypoints",
    scenario:
      "Beyond the caravanserai, the trail splits at three waypoints, each carved with a claim. Layla reads them aloud:\n\n" +
      "**Waypoint A:** \"Converting between two units is always just multiplying by a single fixed conversion factor.\"\n\n" +
      "**Waypoint B:** \"A 30% markup followed by a 30% markdown always brings a price back to where it started.\"\n\n" +
      "**Waypoint C:** \"If a caravan doubles its speed, it always covers triple the distance in the same time.\"\n\n" +
      "\"The old guild sealed the false waypoints behind claims that sound reasonable but fall apart under real arithmetic,\" Layla says. \"Check every one properly before you trust it.\"",
    entities: ["Waypoint A", "Waypoint B", "Waypoint C"],
    options: ["True Claim", "False Claim"],
    answer: { "Waypoint A": "True Claim", "Waypoint B": "False Claim", "Waypoint C": "False Claim" },
    wrongConsequence:
      "The wrong waypoint's trail narrows to a dead end, and you double back with nothing but lost daylight for the trouble. \"Test each claim against real numbers,\" Layla says. \"Not what sounds reasonable — what actually holds up once you calculate it.\"",
    explain:
      "Waypoint A restates exactly what you've already used at every single border post: converting units is one multiplication by a fixed factor, every time. Waypoint B is false — a 30% markup followed by a 30% markdown does not cancel out, because the markdown applies to the new, larger price, leaving you at 91% of the original, not back to 100%. Waypoint C is false too: doubling speed while time stays fixed doubles the distance covered, not triples it — distance is rate times time, and only the rate changed.",
  },
  {
    id: "silk-road-final",
    storyId: "silk-road-cipher",
    afterClue: "silk-road-10",
    kind: "final",
    title: "Three Final Caches",
    scenario:
      "Layla reads each final cache's carved inscription aloud:\n\n" +
      "**Cache 1:** \"Compounding growth at a fixed rate always grows faster over time than simply adding the same fixed amount each time.\"\n\n" +
      "**Cache 2:** \"If two ratios have the same difference between their two numbers, they must be equal ratios.\"\n\n" +
      "**Cache 3:** \"Splitting a profit in proportion to contribution always gives every partner an equal share.\"\n\n" +
      "\"One of these is true without a single exception,\" Layla says. \"The guild trusted their whole cache's protection on that one rule.\"",
    entities: ["Cache 1", "Cache 2", "Cache 3"],
    options: ["Real Cache", "False Cache"],
    answer: { "Cache 1": "Real Cache", "Cache 2": "False Cache", "Cache 3": "False Cache" },
    wrongConsequence:
      "Stone grinds down over the wrong cache, sealed for good this time. \"Don't trust the shape of the sentence,\" Layla says. \"Work the actual numbers, small and concrete, before you decide.\"",
    explain:
      "Cache 1 holds exactly: a fixed percentage compounding over time eventually outpaces any fixed amount added repeatedly, however large that fixed amount starts out. Cache 2 is false — 3:5 and 5:7 share the same difference of 2 between their numbers, but 3/5 = 0.6 while 5/7 ≈ 0.71, so they are not the same ratio at all. Cache 3 is false too, and you proved it yourself already: a 2-3-5 split divides a shared profit unevenly, exactly in proportion to what each partner actually put in.",
    resolution:
      "The real cache gives way at last, and lantern light spills across sacks of spice, bolts of silk still vivid after centuries sealed away, and — tucked beneath them — a merchant's private ledger, its final page covered edge to edge in careful figures.\n\n" +
      "\"They really did trust the ledger over the sword,\" Layla says, running a finger down columns of exchange rates and shipping weights. \"No guard could be bribed around a number that simply doesn't add up.\" The ledger's last line, translated slowly: \"What the road takes in tolls and thieves, arithmetic returns in full to whoever keeps the count honest.\" Outside, the next caravan is already forming up at the gate, indifferent to any of this, exactly as it always has, and exactly as it always will.",
  },

  // ------------------------------------------------------------------
  // The Carnival of Lost Souls
  // ------------------------------------------------------------------
  {
    id: "carnival-mid",
    storyId: "carnival-of-lost-souls",
    afterClue: "carnival-5",
    kind: "mid",
    title: "Five Accounts",
    scenario:
      "You gather the five accounts of that closing night and lay them side by side.\n\n" +
      "**Dexter:** \"I was breaking down the ring-toss same as every night — packed up every prize myself, nobody helped.\"\n\n" +
      "**Madame Zora:** \"I was in my tent reading cards for a late customer, the last one of the night. Ask him yourself, he tipped generously.\"\n\n" +
      "**Big Tom:** \"I was hauling the heavy crates to the wagon, same as always — Higgins was right there helping me the whole time.\"\n\n" +
      "**Ruthie:** \"I was doing the night's cash count in the office trailer, alone, same as any closing night.\"\n\n" +
      "**Old Higgins:** \"I did my usual rounds checking every ride's brakes before bed. Big Tom's telling the truth — I was right there with him the whole time hauling crates. Though I did notice Ruthie's office light was already dark by the time I passed it, a good hour before she says she was still counting cash.\"\n\n" +
      "You already know Crane's body was found by Nell just past midnight, and that the fortune-teller's tent sits directly behind the cash office.",
    entities: ["Dexter", "Madame Zora", "Big Tom", "Ruthie", "Old Higgins"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      Dexter: "Alibi Breaks",
      "Madame Zora": "Alibi Holds",
      "Big Tom": "Alibi Holds",
      Ruthie: "Alibi Breaks",
      "Old Higgins": "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and the trail goes cold before morning. Look again at which accounts are confirmed by someone with nothing at stake, and which rest only on the speaker's own word — and check whether Higgins's own detail actually matches what someone claimed to be doing.",
    explain:
      "Zora's account is confirmed by an actual customer, and Tom's is corroborated directly by Higgins — both hold. Higgins himself has no motive and supplies the key detail, so his account holds too. But Dexter was alone the entire time with no one to vouch for him. And Ruthie's claim of counting cash until late doesn't survive Higgins's own sighting: her office light already dark a full hour before she says she was still working.",
  },
  {
    id: "carnival-final",
    storyId: "carnival-of-lost-souls",
    afterClue: "carnival-10",
    kind: "final",
    title: "The Midway",
    scenario:
      "You confront the two remaining names on the darkened midway.\n\n" +
      "**Dexter:** \"It was Ruthie. She's the one who inherits this whole carnival outright the moment Crane's gone — ask any lawyer what a will like that is worth.\"\n\n" +
      "**Ruthie:** \"Ask instead who's been quietly pocketing the ring-toss's real take for months, and who was about to be exposed publicly by Crane's own recount.\"\n\n" +
      "You already know the true expected-value calculation of the ring-toss booth, worked out honestly, matches almost exactly the extra amount that's gone missing from the nightly totals for months — and that Crane's own audit notebook, recovered from his tent, names the booth specifically, not the office.",
    entities: ["Dexter", "Ruthie"],
    options: ["Guilty", "Innocent"],
    answer: { Dexter: "Guilty", Ruthie: "Innocent" },
    wrongConsequence:
      "The midway stays silent, and nothing more is offered — you've named the wrong name, and whatever nerve the real culprit had left settles right back into place. Consider which of these two the numbers actually point to, versus which one merely has an old motive with nothing new tying them to tonight.",
    explain:
      "Ruthie's inheritance motive is real, but nothing beyond guesswork ties her to the tent itself, and the missing money was never traced to the office at all. Dexter's exposure was total and specific: Crane's own audit notebook named the ring-toss booth by name, and the true expected value you calculated yourself matches, almost to the coin, exactly what's been quietly skimmed for months.",
    resolution:
      "You lay it out for Nell, piece by piece: the wheel's own honest odds, one in twenty, that first made the ring-toss's actual win rate look impossible. The odds-to-probability conversion, confirming Crane's own suspicion in his own handwriting. The dice booth's vanishing odds of a double six, proving Crane really did check every game on the midway, not just one. The shifting odds of an unreplaced raffle ticket, showing exactly how carefully he'd worked through each booth's numbers. The expected value of the honest game, a clean, provable loss for any player, however the crowd felt about their odds. The complementary probability, telling you exactly how often nothing at all should happen at that booth — and how far the real numbers strayed from it. The two-stage probability tree, mapping out every way a mark could be steered from Zora's tent straight into Dexter's rigged wheel. The percentage deviation between the booth's true odds and its actual results, the very gap Crane had circled twice in red ink. The simplified ratio of wins to losses, cleaner and uglier than any honest game's numbers should ever be. And the true expected value of the rigged version, worked out fully, landing almost exactly on the sum that had gone missing every month for the better part of a year.\n\n" +
      "Dexter doesn't run — there's nowhere on a closed midway left to run to. \"It was never supposed to be enough to notice,\" he says quietly, staring at his own rigged wheel. \"Just a coin or two, every single night.\" Nell looks at the wheel for a long moment, then gives it one slow, final spin, watching it settle on nothing in particular. \"He built his whole trick on the fact that most people never bother checking the actual math,\" she says. \"Turns out that's exactly the kind of trick honest arithmetic can always catch, eventually.\" Above the silent midway, the carnival's lights are already going dark for the season, one string at a time, precisely on schedule.",
  },

  // ------------------------------------------------------------------
  // The Ice Vault Expedition
  // ------------------------------------------------------------------
  {
    id: "ice-vault-mid",
    storyId: "ice-vault-expedition",
    afterClue: "ice-vault-5",
    kind: "mid",
    title: "Three Passages",
    scenario:
      "Beyond the entrance shaft, the tunnel splits into three ice passages, each marked with a claim carved by an unseen hand. Freya reads them aloud:\n\n" +
      "**Passage A:** \"Ice is less dense than liquid water, which is exactly why it floats.\"\n\n" +
      "**Passage B:** \"Doubling a rectangular block's length, width, and height all at once only doubles its volume.\"\n\n" +
      "**Passage C:** \"Water always freezes at exactly the same temperature, regardless of what's dissolved in it.\"\n\n" +
      "\"The Wardens sealed the false passages behind claims that sound reasonable but fall apart under real arithmetic,\" Freya says. \"Check every one properly before you trust it.\"",
    entities: ["Passage A", "Passage B", "Passage C"],
    options: ["True Claim", "False Claim"],
    answer: { "Passage A": "True Claim", "Passage B": "False Claim", "Passage C": "False Claim" },
    wrongConsequence:
      "The wrong passage's floor gives way to a cold plunge pool, and you scramble back soaked and shivering rather than trapped. \"Test each claim against real numbers,\" Freya says. \"Not what sounds reasonable — what actually holds up once you calculate it.\"",
    explain:
      "Passage A holds exactly: ice genuinely is less dense than liquid water, which is why it floats instead of sinking — a real, provable exception to how most substances behave when they freeze. Passage B is false: doubling every dimension of a block multiplies its volume by 2×2×2, eight times over, not two. Passage C is false too — dissolved salts and other impurities measurably lower water's freezing point, which is exactly why salted roads resist icing at temperatures where plain water would freeze solid.",
  },
  {
    id: "ice-vault-final",
    storyId: "ice-vault-expedition",
    afterClue: "ice-vault-10",
    kind: "final",
    title: "Three Final Vaults",
    scenario:
      "Freya reads each final vault's carved inscription aloud:\n\n" +
      "**Vault 1:** \"Fresh water is denser at 4°C than it is as ice.\"\n\n" +
      "**Vault 2:** \"If a substance's temperature in Celsius is doubled, its temperature in Fahrenheit also doubles.\"\n\n" +
      "**Vault 3:** \"An exponential decay process eventually reaches exactly zero.\"\n\n" +
      "\"One of these is true without a single exception,\" Freya says. \"The Wardens trusted their whole vault's protection on that one rule.\"",
    entities: ["Vault 1", "Vault 2", "Vault 3"],
    options: ["Real Vault", "False Vault"],
    answer: { "Vault 1": "Real Vault", "Vault 2": "False Vault", "Vault 3": "False Vault" },
    wrongConsequence:
      "Ice grinds shut over the wrong vault, sealed for good this time. \"Don't trust the shape of the sentence,\" Freya says. \"Work the actual numbers, small and concrete, before you decide.\"",
    explain:
      "Vault 1 holds exactly: fresh water reaches its greatest density at about 4°C, denser than both colder water and solid ice — a real, measurable exception in how most substances behave as they cool. Vault 2 is false: converting Celsius to Fahrenheit always adds 32 after multiplying, so doubling the Celsius reading never simply doubles the Fahrenheit result. Vault 3 is false too — exponential decay keeps losing the same percentage forever, shrinking closer and closer to zero without ever actually reaching it.",
    resolution:
      "The real vault gives way at last, and lantern light spills across gear and journals frozen in place for centuries — not gold, but something the Frost Wardens clearly valued just as highly: measuring rods, sighting glasses, and slate tablets dense with worked calculations on ice, melt, and time.\n\n" +
      "\"They really did trust the numbers over the cold,\" Freya says, brushing frost from a tablet's edge. \"No lock could be picked around arithmetic that simply doesn't lie.\" The tablet's final line, translated slowly: \"What the ice keeps, it keeps exactly as long as the numbers say it will, and not one day more.\" Outside, the glacier groans softly, indifferent, melting at exactly the rate it always has, and exactly the rate it always will, whether anyone is patient enough to calculate it or not.",
  },

  // ------------------------------------------------------------------
  // The Architect's Folly
  // ------------------------------------------------------------------
  {
    id: "architect-mid",
    storyId: "architects-folly",
    afterClue: "architect-5",
    kind: "mid",
    title: "Five Accounts",
    scenario:
      "You gather the five accounts of that evening and lay them side by side.\n\n" +
      "**Dana Whitfield:** \"I was in the site trailer finalizing next week's schedule — my foreman can vouch, he's in and out of that trailer most evenings.\"\n\n" +
      "**Sanjay Kapoor:** \"I was double-checking the east wing's rebar placement, alone, same as any night shift.\"\n\n" +
      "**Ms. Okafor:** \"I was at a dinner with three city permit officials, trying to smooth over the delay. Ask any of them.\"\n\n" +
      "**Grady:** \"I did my full safety walk of every floor, same as every night — Feeny saw me finishing up near the loading dock.\"\n\n" +
      "**Old Feeny:** \"I ran the crane's shutdown checks like always. Grady's telling the truth, I did see him at the loading dock. Though the east wing's rebar Sanjay claims he was checking all night — that section was already inspected and signed off two days ago. Nothing left there to check.\"\n\n" +
      "You already know Reyes's body was found in the site office, and that the office sits directly beside the east wing stairwell.",
    entities: ["Dana Whitfield", "Sanjay Kapoor", "Ms. Okafor", "Grady", "Old Feeny"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      "Dana Whitfield": "Alibi Breaks",
      "Sanjay Kapoor": "Alibi Breaks",
      "Ms. Okafor": "Alibi Holds",
      Grady: "Alibi Holds",
      "Old Feeny": "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and a full night's lead slips away chasing it. Look again at which claims are confirmed by someone specifically placing them there tonight, and which rest on a vague habit — and check whether Feeny's own detail actually matches what someone claimed to be doing.",
    explain:
      "Okafor's account is confirmed by three independent city officials, and Grady's is corroborated directly by Feeny — both hold. Feeny himself has no motive and supplies the key detail, so his account holds too. But Dana's corroboration is vague at best — a foreman who's simply 'in and out most evenings' doesn't actually confirm her whereabouts tonight. And Sanjay's claim of checking rebar that was already signed off two days earlier doesn't survive Feeny's own knowledge of the schedule.",
  },
  {
    id: "architect-final",
    storyId: "architects-folly",
    afterClue: "architect-10",
    kind: "final",
    title: "The Site Office",
    scenario:
      "You confront the two remaining names in the site office itself, blueprints still spread across the desk.\n\n" +
      "**Dana Whitfield:** \"It was Sanjay. He's the one who actually stamped those beam calculations — ask any engineer what a falsified signature like that is worth in court.\"\n\n" +
      "**Sanjay Kapoor:** \"Ask instead who ordered the cheaper beams in the first place, and who stood to lose an entire contract's worth of profit if Reyes ever filed that report.\"\n\n" +
      "You already know the final load-equation Reyes solved in his own notebook, balancing the exact tonnage difference between the beams that were ordered and the beams the blueprints specified, matches a payment Dana authorized personally, under a supplier name that doesn't appear anywhere else in the project's books.",
    entities: ["Dana Whitfield", "Sanjay Kapoor"],
    options: ["Guilty", "Innocent"],
    answer: { "Dana Whitfield": "Guilty", "Sanjay Kapoor": "Innocent" },
    wrongConsequence:
      "The site office goes quiet, and nothing more is offered — you've named the wrong name, and whatever nerve the real culprit had left settles right back into place. Consider which of these two actually profited financially from the switch, versus who was following orders under pressure with nothing personally to gain.",
    explain:
      "Sanjay's stamped signature is damning on paper, but a junior engineer signing off under pressure from a contractor who controls his contract is a common, survivable mistake, not a murder motive. Dana's exposure was total and financial: the falsified beam order traces straight back to a payment she personally authorized, under a supplier name invented specifically to hide it, and Reyes's own load equation matches that exact discrepancy, ton for ton.",
    resolution:
      "You lay it out for Priya, piece by piece: the total load calculation that first showed the floor's true capacity, no more and no less. The safety factor, proving the beams installed were rated for a fraction of what the blueprints demanded. The stress calculation, the exact number climbing past what any honest beam could bear. The blueprint's own scale, confirming the failed brace matched the plans on paper, if nowhere else. The diagonal brace's clean, provable length, the same clean arithmetic Reyes trusted in everything he built. The percentage shortfall in the substituted material's rated strength, a number too precise to be an accident. The concrete mix ratio, thinned exactly enough to save money and just enough to matter. The arithmetic sequence of floor loads, climbing steadily toward a failure that was never really a surprise. The unit conversion, turning a contractor's quiet cost-cutting into tons nobody could argue with. And the load equation itself, solved in Reyes's own hand, balancing to the exact tonnage difference that ties directly back to Dana's own falsified order.\n\n" +
      "Dana doesn't bother denying it once the supplier name is traced back to her own signature. \"The whole project would have collapsed financially, not just physically,\" she says, as if that were somehow a defense. Priya looks up at the half-built tower for a long moment. \"He built his whole career trusting that the numbers don't lie,\" she says quietly, \"and in the end, they're exactly what caught her.\" Above the site, the crane sits motionless against the night sky, work halted, finally, for reasons that have nothing to do with the weather.",
  },

  // ------------------------------------------------------------------
  // The Canyon of Echoes
  // ------------------------------------------------------------------
  {
    id: "canyon-mid",
    storyId: "canyon-of-echoes",
    afterClue: "canyon-5",
    kind: "mid",
    title: "Three Passages",
    scenario:
      "Beyond the narrows, the canyon splits into three side-passages, each marked with a claim carved into the rock. Talia reads them aloud:\n\n" +
      "**Passage A:** \"Doubling the distance from a sound source always cuts its intensity to one-quarter, not one-half.\"\n\n" +
      "**Passage B:** \"A tube open at both ends and a tube closed at one end produce the exact same fundamental wavelength for the same length.\"\n\n" +
      "**Passage C:** \"The frequency of a sound and its wavelength always move in the same direction — a higher frequency always means a longer wavelength.\"\n\n" +
      "\"The Echo Keepers sealed the false passages behind claims that sound reasonable but fall apart under real arithmetic,\" Talia says. \"Check every one properly before you trust it.\"",
    entities: ["Passage A", "Passage B", "Passage C"],
    options: ["True Claim", "False Claim"],
    answer: { "Passage A": "True Claim", "Passage B": "False Claim", "Passage C": "False Claim" },
    wrongConsequence:
      "The wrong passage narrows to a dead end, and you double back with nothing but an echo of your own footsteps for the trouble. \"Test each claim against real numbers,\" Talia says. \"Not what sounds reasonable — what actually holds up once you calculate it.\"",
    explain:
      "Passage A restates exactly what you calculated yourself: intensity drops with the square of the distance, so doubling distance always cuts it to a quarter, not a half. Passage B is false — a tube closed at one end only fits a quarter-wavelength, not a half, so its fundamental wavelength is four times its length, not twice. Passage C is false too: wavelength and frequency move in opposite directions for a fixed speed of sound — a higher frequency always means a shorter wavelength, never a longer one.",
  },
  {
    id: "canyon-final",
    storyId: "canyon-of-echoes",
    afterClue: "canyon-10",
    kind: "final",
    title: "Three Final Chambers",
    scenario:
      "Talia reads each final chamber's carved inscription aloud:\n\n" +
      "**Chamber 1:** \"Two sounds of the same frequency, played together in phase, combine to a louder sound than either alone.\"\n\n" +
      "**Chamber 2:** \"The speed of sound in air stays exactly the same at every temperature.\"\n\n" +
      "**Chamber 3:** \"If you double a sound's frequency while its speed stays the same, its wavelength also doubles.\"\n\n" +
      "\"One of these is true without a single exception,\" Talia says. \"The Echo Keepers trusted their whole cache's protection on that one rule.\"",
    entities: ["Chamber 1", "Chamber 2", "Chamber 3"],
    options: ["Real Chamber", "False Chamber"],
    answer: { "Chamber 1": "Real Chamber", "Chamber 2": "False Chamber", "Chamber 3": "False Chamber" },
    wrongConsequence:
      "Stone grinds down over the wrong chamber, sealed for good this time. \"Don't trust the shape of the sentence,\" Talia says. \"Work the actual numbers, small and concrete, before you decide.\"",
    explain:
      "Chamber 1 holds exactly: two in-phase sound waves of the same frequency really do combine constructively into a louder sound — a real, measurable effect called constructive interference. Chamber 2 is false: sound actually travels faster through warmer air, since warmer molecules bump into each other more quickly — the speed of sound is not a fixed constant regardless of temperature. Chamber 3 is false too, and you've already proven it yourself: doubling the frequency while speed stays fixed halves the wavelength, it doesn't double it, since wavelength and frequency move in opposite directions.",
    resolution:
      "The real chamber gives way at last, and lantern light spills across a shallow chamber lined with carved resonating pipes, each tuned centuries ago to a note that still rings true today. Tucked among them, wrapped against the dry desert air, a stack of thin stone tablets dense with worked calculations — echo timings, tuned intervals, careful notes on how sound itself behaves.\n\n" +
      "\"They really did trust their own careful listening over any map,\" Talia says, running a hand along one silent pipe. \"No guard could out-argue arithmetic that simply repeats the same result, echo after echo, century after century.\" The topmost tablet's final line, translated slowly: \"What the canyon returns to you is never more, and never less, than what you sent into it — measured honestly, it never once lies.\" Outside, the canyon walls carry your own voice back to you one last time, precisely on schedule, exactly as they always have.",
  },

  // ------------------------------------------------------------------
  // The Museum Heist
  // ------------------------------------------------------------------
  {
    id: "museum-mid",
    storyId: "museum-heist",
    afterClue: "museum-5",
    kind: "mid",
    title: "Five Accounts",
    scenario:
      "You gather the five accounts of that evening and lay them side by side.\n\n" +
      "**Marcus Webb:** \"I was at my own office across town, finishing paperwork for tomorrow's install — my assistant was there the entire evening.\"\n\n" +
      "**Priya Anand:** \"I was at a gallery opening downtown, surrounded by at least thirty other people all evening.\"\n\n" +
      "**Colette Fischer:** \"I did my usual rounds all night, checking every gallery hourly — ask Baptiste, he saw me on my last round.\"\n\n" +
      "**Alderman Reeves:** \"I was at a board dinner, then home. My driver dropped me off, though I let him leave before I actually went inside.\"\n\n" +
      "**Old Baptiste:** \"I did my usual cleaning rounds. Colette's telling the truth, I did see her on her last pass. Though the gap in her own shift log — the one hour right before the theft — was marked as a break she doesn't usually take.\"\n\n" +
      "You already know Dr. Voss's body was found by Odette in the control room, and that the control room sits directly beside the service corridor.",
    entities: ["Marcus Webb", "Priya Anand", "Colette Fischer", "Alderman Reeves", "Old Baptiste"],
    options: ["Alibi Holds", "Alibi Breaks"],
    answer: {
      "Marcus Webb": "Alibi Holds",
      "Priya Anand": "Alibi Holds",
      "Colette Fischer": "Alibi Breaks",
      "Alderman Reeves": "Alibi Breaks",
      "Old Baptiste": "Alibi Holds",
    },
    wrongConsequence:
      "You clear the wrong people, and a full night's lead slips away chasing it. Look again at which claims are confirmed by someone specifically placing them there tonight, and which leave a gap unaccounted for — and check whether Baptiste's own detail actually matches what someone claimed to be doing.",
    explain:
      "Webb's account is confirmed by his assistant, and Priya's by thirty independent witnesses at a public event — both hold. Baptiste himself has no motive and supplies the key detail, so his account holds too. But Colette's shift log shows an unusual, unscheduled break logged in the exact hour before the theft — not her usual pattern. And Reeves's claim falls apart the moment you notice he sent his driver away before actually going inside, leaving no one to confirm he ever did.",
  },
  {
    id: "museum-final",
    storyId: "museum-heist",
    afterClue: "museum-10",
    kind: "final",
    title: "The Control Room",
    scenario:
      "You confront the two remaining names in the control room itself, monitors still dark.\n\n" +
      "**Colette Fischer:** \"It was Reeves. He needed that insurance payout to cover the funding scandal — ask anyone on the board what a write-off like that is worth.\"\n\n" +
      "**Alderman Reeves:** \"Ask instead who actually knows this building's sensor grid well enough to walk through it blind, and who's been quietly meeting with a buyer for months.\"\n\n" +
      "You already know the midpoint coordinates worked out from the two disabled sensors point exactly to the service corridor only night staff carry keys to, and that Colette's own personnel file lists a prior position installing sensor systems — the same specialized training Marcus Webb once gave his own staff.",
    entities: ["Colette Fischer", "Alderman Reeves"],
    options: ["Guilty", "Innocent"],
    answer: { "Colette Fischer": "Guilty", "Alderman Reeves": "Innocent" },
    wrongConsequence:
      "The control room stays silent, and nothing more is offered — you've named the wrong name, and whatever nerve the real culprit had left settles right back into place. Consider which of these two actually had the technical knowledge to beat two independent sensors, versus who merely had a financial motive with no way to actually pull it off.",
    explain:
      "Reeves's financial motive is real, but nothing places him anywhere near the sensor grid itself, and insurance fraud rarely requires personally disabling two independent systems by hand. Colette's exposure was total and specific: her own unscheduled break lines up exactly with the theft window, her prior training gave her the exact technical knowledge to beat both sensors, and the disabled sensors' own midpoint traces straight to the one corridor only she had keys to that night.",
    resolution:
      "You lay it out for Odette, piece by piece: the binary scrap that first hinted someone had written the real access code down before they'd fully memorized it. The distance between the two disabled sensors, wide enough for exactly one careful person to pass through untouched. The overlapping access logs, narrowing the field down to the three people who could have reached both rooms at all. The AND gate's own unforgiving logic, proving both sensors had to be beaten, not just one. The rotating dial's modular arithmetic, landing on precisely the position it was actually found on. The lock's full combination count, and the blind-spot percentage that made exactly one approach angle survivable. The keypad's timing pattern, and the digit code's own count, narrowing an impossible number of guesses down to one deliberate, informed choice. And the midpoint between the two disabled sensors, pointing directly at the one corridor only Colette carried keys to that night.\n\n" +
      "Colette doesn't run — there's nowhere in a locked museum left to run to. \"I could have made triple my salary in one night,\" she says quietly, \"and no one was ever supposed to get hurt over it.\" Odette looks at the empty display case for a long moment. \"Dr. Voss trusted the numbers to catch what people couldn't see,\" she says. \"Turns out he was right, even about the person he trusted enough to teach.\" Above the darkened galleries, the museum's real security system — the one built from careful, patient arithmetic — finally, quietly, does its job.",
  },

  // ------------------------------------------------------------------
  // The Cartographer's Riddle
  // ------------------------------------------------------------------
  {
    id: "cartographer-mid",
    storyId: "cartographers-riddle",
    afterClue: "cartographer-5",
    kind: "mid",
    title: "Three Passages",
    scenario:
      "Beyond the marked stone, the trail splits into three overgrown passages, each carved with a claim. Marisol reads them aloud:\n\n" +
      "**Passage A:** \"A map's scale is a single fixed ratio, however large or small the real distance being measured is.\"\n\n" +
      "**Passage B:** \"Slope is calculated by dividing the horizontal run by the vertical rise.\"\n\n" +
      "**Passage C:** \"Interpolating a value between two known points always requires knowing at least three data points.\"\n\n" +
      "\"Grandfather sealed his false notes behind claims that sound reasonable but fall apart under real arithmetic,\" Marisol says. \"Check every one properly before you trust it.\"",
    entities: ["Passage A", "Passage B", "Passage C"],
    options: ["True Claim", "False Claim"],
    answer: { "Passage A": "True Claim", "Passage B": "False Claim", "Passage C": "False Claim" },
    wrongConsequence:
      "The wrong passage narrows to a dead end, and you double back with nothing but lost daylight for the trouble. \"Test each claim against real numbers,\" Marisol says. \"Not what sounds reasonable — what actually holds up once you calculate it.\"",
    explain:
      "Passage A restates exactly what you proved yourself: a map's scale never changes, whatever distance you're actually measuring. Passage B is false — slope is rise over run, the vertical change divided by the horizontal change, not the other way around. Passage C is false too, and you already proved it: interpolating a midpoint value needs only the two known ends, nothing more.",
  },
  {
    id: "cartographer-final",
    storyId: "cartographers-riddle",
    afterClue: "cartographer-10",
    kind: "final",
    title: "Three Marked Plots",
    scenario:
      "Marisol reads each marked plot's carved inscription aloud:\n\n" +
      "**Plot 1:** \"A back-bearing is always exactly 180 degrees from the original bearing, no matter which direction you started facing.\"\n\n" +
      "**Plot 2:** \"Doubling a rectangular plot's length and width both at once only doubles its area.\"\n\n" +
      "**Plot 3:** \"Interpolating between two elevation points always assumes the ground rises or falls in a perfectly straight line, and that assumption is always exactly correct in the real world.\"\n\n" +
      "\"One of these is true without a single exception,\" Marisol says. \"Grandfather trusted his whole vault's protection on that one rule.\"",
    entities: ["Plot 1", "Plot 2", "Plot 3"],
    options: ["Real Plot", "False Plot"],
    answer: { "Plot 1": "Real Plot", "Plot 2": "False Plot", "Plot 3": "False Plot" },
    wrongConsequence:
      "The wrong plot yields nothing but bare, undisturbed ground, and you're left resetting your bearings by lamplight. \"Don't trust the shape of the sentence,\" Marisol says. \"Work the actual numbers, small and concrete, before you decide.\"",
    explain:
      "Plot 1 holds exactly: a back-bearing is always a perfect 180-degree reversal of the original bearing, without exception. Plot 2 is false — doubling both a rectangle's length and width multiplies its area by four, not two, the same trap that catches any two-dimensional scaling. Plot 3 is false too: real ground rarely rises in a perfectly straight line, so elevation interpolation is always a useful approximation, never a guaranteed exact answer.",
    resolution:
      "The real plot gives way to Marisol's careful digging, and there it is — Cornelius Drake's true vault, exactly where two independent methods, a triangulation and a map scale, both said it would be. Inside, wrapped against the damp, his real final map: not the blank-cornered one he left behind for the world, but a complete one, filled in with decades of careful, checked measurements no one else was ever meant to see.\n\n" +
      "\"He always said a map you couldn't verify twice wasn't worth trusting once,\" Marisol says, unrolling it carefully. Tucked into the map's corner, a note in Drake's own hand: \"Anyone patient enough to check my numbers twice has earned the right to see where they actually lead.\" Above the plot, the sun is already dropping toward the horizon, and Marisol, for once, isn't worried about finding her way back — she has the bearing for that too.",
  },
];

export function checkpointsForStory(storyId: string): QuestCheckpoint[] {
  return QUEST_CHECKPOINTS.filter((c) => c.storyId === storyId);
}

export function checkpointAfterClue(storyId: string, clueId: string): QuestCheckpoint | undefined {
  return QUEST_CHECKPOINTS.find((c) => c.storyId === storyId && c.afterClue === clueId);
}
