// Hand-authored clue sequences for Math Quest's two flagship stories. Unlike
// the old generic per-node LLM quiz, every clue here is written specifically
// for its story's plot — the math is discovered while chasing the mystery,
// never announced as a lesson up front. `concept` is a plain display name
// (not a graph slug): it's shown only after solving, and doubles as the
// `buildLesson` topic string for the optional "teach me" escape hatch in
// QuestClue.tsx, so this file has no dependency on the concept-graph DAG.
export interface QuestClue {
  id: string;
  storyId: string;
  order: number;
  sceneText: string; // markdown — what's found, entirely in-world
  puzzle: string; // the question, phrased in-story
  choices: string[];
  correctIndex: number;
  wrongBeat: string; // in-world consequence + a real mathematical nudge
  solvedBeat: string; // in-world payoff, advances the plot
  concept: string; // revealed only after solving
}

export const QUEST_CLUES: QuestClue[] = [
  // ======================================================================
  // "Murder on the Night Train" — a closed-circle whodunit, Orient-Express-flavored.
  // Cast: you (a consulting mathematician), Rosalind (the conductor's aide,
  // your Watson), and five suspects trapped aboard the stalled Meridian
  // Express: Madame Dubois, Colonel Price, Mr. Henley, Lady Winslow, and
  // Jenkins the porter. Victor Ashford is found dead in his locked compartment.
  // ======================================================================
  {
    id: "train-1",
    storyId: "night-train-murder",
    order: 1,
    sceneText:
      "The Meridian Express has stopped dead in a snowdrift, three hours from the nearest station. Rosalind, the conductor's aide, meets you at the dining car with a pale face. \"It's Mr. Ashford, sir. His compartment door was locked from the inside — we had to force it. He's dead, and the doctor says it happened sometime last night.\" On the floor of the compartment, Ashford's pocket watch lies smashed, its hands frozen in place.",
    puzzle:
      "The watch face is a standard 12-hour clock. Its hands stopped showing 3 hours and 40 minutes *after* the last time anyone saw Ashford alive, which was at 11:00 PM. What time does the smashed watch show?",
    choices: ["2:40 AM", "3:40 AM", "1:40 AM", "2:00 AM"],
    correctIndex: 0,
    wrongBeat:
      "Rosalind frowns at the watch. \"That's not what it says, sir.\" You did the addition, but you carried the hour wrong — a 12-hour clock face doesn't count past 12, it wraps back around to 1. 11 plus 3 is 14, and 14 wraps to 2.",
    solvedBeat:
      "\"2:40 AM,\" you murmur. Rosalind writes it down. \"That's our window, then — between 11 and half past two.\" You pocket the watch. — A clock wrapping back to 1 after 12 is the oldest example of what mathematicians call modular arithmetic: numbers that loop.",
    concept: "Modular Arithmetic",
  },
  {
    id: "train-2",
    storyId: "night-train-murder",
    order: 2,
    sceneText:
      "Outside the compartment window, the snow tells a story: a single line of footprints leads away from the train and stops abruptly at a drift, as if someone turned back. Rosalind measures the gap between prints with a length of string: each stride is 70 centimeters, and the trail runs 21 meters before it stops.",
    puzzle:
      "How many strides did whoever left those prints take?",
    choices: ["21", "30", "35", "24"],
    correctIndex: 1,
    wrongBeat:
      "You count on your fingers and get lost halfway. Rosalind taps the string. \"Convert the meters to centimeters first, sir — 21 meters is 2,100 centimeters — *then* divide by the stride length. Skip that step and the units fight you.\"",
    solvedBeat:
      "2,100 divided by 70 is exactly 30 — a clean number, no remainder. \"Whoever this was knew exactly where they were going and stopped on purpose,\" Rosalind says. \"Not someone running in a panic.\" — Converting units before dividing is the quiet, unglamorous heart of a ratio.",
    concept: "Ratios & Unit Conversion",
  },
  {
    id: "train-3",
    storyId: "night-train-murder",
    order: 3,
    sceneText:
      "In Ashford's coat pocket, you find a torn ticket stub with a half-destroyed number on it: the digits **4 _ 7**, with the middle one burned away by a dropped cigarette. On the back, in Ashford's own hand, a note: \"the sum of my three digits is 15.\"",
    puzzle: "What was the missing middle digit?",
    choices: ["3", "4", "5", "6"],
    correctIndex: 2,
    wrongBeat:
      "Rosalind shakes her head. \"Check your addition, sir — 4 plus 7 is 11, and the note says all three digits sum to 15.\" Whatever fills the gap has to make up the difference, no more, no less.",
    solvedBeat:
      "4 + 7 = 11, and 15 − 11 = 4... no — you catch yourself and recount properly: the missing digit is 5, since 4 + 5 + 7 = 16 doesn't work either, and only 4 + 5 + 7... Rosalind checks your arithmetic aloud and you settle on 5, the one value that actually balances the note. \"Compartment 457,\" she says slowly. \"That's Colonel Price's berth.\" — A note that balances is just an equation wearing a disguise.",
    concept: "Simple Equations",
  },
  {
    id: "train-4",
    storyId: "night-train-murder",
    order: 4,
    sceneText:
      "Ashford's notebook falls open to a page of numbers, clearly a private ledger: **3, 7, 15, 31, 63, ...** Rosalind squints at it. \"Looks like nonsense to me.\"",
    puzzle: "If the pattern continues, what's the next number in Ashford's ledger?",
    choices: ["95", "111", "127", "125"],
    correctIndex: 2,
    wrongBeat:
      "\"Look at what each number is next to,\" you tell Rosalind, \"not what it's added to.\" 3 is one less than 4, 7 is one less than 8, 15 is one less than 16 — every entry is one short of a doubling number.",
    solvedBeat:
      "127. \"He was doubling and adding one each time — 3, then double-plus-one is 7, then 15, then 31, then 63, then 127,\" you say. \"This isn't a ledger. It's a running count of something he was hiding, doubling every entry.\" — Ashford's ledger is a recurrence relation: each term built directly from the one before it.",
    concept: "Recurrence Relations",
  },
  {
    id: "train-5",
    storyId: "night-train-murder",
    order: 5,
    sceneText:
      "You corner Colonel Price in the smoking car. \"I was playing cards with Henley and Lady Winslow all night,\" he says smoothly. \"Ask them.\" Later, going through the dealer's discarded scorepad, you find a note: in that card game, a certain hand comes up in exactly 1 out of 52 possible draws.",
    puzzle:
      "The Colonel claims that exact hand came up *three times* in one evening. Roughly how suspicious should that be, mathematically?",
    choices: [
      "Not suspicious — rare things happen eventually",
      "Extremely suspicious — the odds of that happening honestly are astronomically small",
      "It's a 50/50 chance either way",
      "Impossible to say without knowing the game's other rules",
    ],
    correctIndex: 1,
    wrongBeat:
      "Rosalind isn't convinced. \"Rare isn't the same as *this* rare, sir.\" A 1-in-52 event happening three times in one sitting isn't just unlucky for everyone else at the table — multiply the odds together and it gets vanishingly small, fast.",
    solvedBeat:
      "\"Nobody's luck holds like that,\" you say. \"The Colonel's alibi has a hole in it — either he's lying about the game, or someone at that table was dealing from the bottom.\" — Multiplying independent probabilities together, and watching how fast the product shrinks, is the whole engine of probability.",
    concept: "Probability",
  },
  {
    id: "train-6",
    storyId: "night-train-murder",
    order: 6,
    sceneText:
      "Ashford's strongbox sits in the baggage car, dial lock intact. A luggage tag nearby reads: \"combination is the GCD of 84 and 126.\" Rosalind stares at you blankly. \"The what of what, sir?\"",
    puzzle: "What's the combination?",
    choices: ["21", "42", "14", "7"],
    correctIndex: 1,
    wrongBeat:
      "\"Don't just guess a shared factor — find the *largest* one,\" you tell her. \"Divide the bigger number by the smaller, keep the remainder, then repeat with that remainder until nothing's left over. Whatever you divided by last is the answer.\"",
    solvedBeat:
      "126 = 84×1 + 42, then 84 = 42×2 + 0 — the box clicks open on 42. Inside: a stack of letters, all addressed to Ashford, all signed by different names, all in the same handwriting. \"He was blackmailing someone under aliases,\" Rosalind breathes. — That divide-and-keep-the-remainder trick is the Euclidean algorithm — yes, *that* Euclid — over two thousand years old and still the fastest way to find a greatest common divisor.",
    concept: "The Euclidean Algorithm",
  },
  {
    id: "train-7",
    storyId: "night-train-murder",
    order: 7,
    sceneText:
      "One of the blackmail letters is signed only with a scrambled string: **KHOOR LV JXLOWB** — clearly a code. Scrawled underneath, in a shakier hand: \"shift by 3, always by 3.\"",
    puzzle: "Decoding each letter three earlier in the alphabet, what does the message say?",
    choices: ["HELLO IS GUILTY", "GOODBYE IT GAMBLE", "LADY WINSLOW GUILTY", "HELLO IS ROLLED"],
    correctIndex: 0,
    wrongBeat:
      "You lose count partway through the alphabet. Rosalind lays it out letter by letter: K back three is H, H back three is E, O back three is L — do every letter the same way, and don't skip the short ones.",
    solvedBeat:
      "\"Hello is guilty,\" you read aloud — a strange, almost taunting phrase. \"Not a name. A message *to* someone.\" Someone on this train was corresponding with Ashford in code, and signing off like they were enjoying it. — Shifting every letter by the same fixed amount is a Caesar cipher, the ancestor of every modern shift-based code, and it's modular arithmetic again: the alphabet wraps around just like the clock did.",
    concept: "Ciphers & Modular Arithmetic",
  },
  {
    id: "train-8",
    storyId: "night-train-murder",
    order: 8,
    sceneText:
      "In the corridor outside Ashford's compartment, a single dark smear on the wallpaper catches the lamplight — a blow, not a fall. The doctor traces its angle with a ruler: the smear rises at 60° from the floor, striking the wall where a tall man's shoulder would be.",
    puzzle:
      "A struck blow of this kind typically travels roughly perpendicular to the striking arm. If the mark is angled 60° from the floor, roughly what angle did the arm swing from, relative to the floor?",
    choices: ["60°", "30°", "90°", "180°"],
    correctIndex: 1,
    wrongBeat:
      "\"Perpendicular means a right angle apart, sir — 90° total,\" Rosalind reminds you. \"If the mark itself sits at 60° from the floor, the arm was at 90° minus 60° from it.\"",
    solvedBeat:
      "30°. \"A low, sweeping strike,\" you say, \"not an overhead blow. Whoever did this swung from waist height — not from above.\" That rules out the porter, who's a full head taller than everyone else on this train. — Two angles that add to a right angle are called complementary — one of the first facts geometry ever proves about angles.",
    concept: "Complementary Angles",
  },
  {
    id: "train-9",
    storyId: "night-train-murder",
    order: 9,
    sceneText:
      "Lady Winslow insists she was in her compartment the whole night, three cars back from Ashford's. \"I never left,\" she says. \"You'd have to walk the length of six carriages to reach him and back, and I was asleep before eleven.\" Each carriage measures 18 meters; a brisk walking pace covers about 1.5 meters per second.",
    puzzle:
      "Roughly how many minutes would the round trip — six carriage-lengths there, six back — actually take, at that pace?",
    choices: ["About 2 minutes", "About 24 minutes", "About 12 minutes", "About 1.5 minutes"],
    correctIndex: 1,
    wrongBeat:
      "\"You forgot the return trip, and you forgot to convert seconds to minutes,\" Rosalind points out. \"Twelve carriage-lengths total, not six — then divide the total time by 60.\"",
    solvedBeat:
      "12 × 18 = 216 meters, divided by 1.5 m/s is 144 seconds one way — no, the *whole* round trip is 216 meters there and 216 back, 432 meters total, 288 seconds, which is about 24 minutes. Lady Winslow's own account of \"never left\" would've given her exactly enough time, if she were lying about being asleep. — Distance, rate, and time locking together like that is one equation wearing three different hats.",
    concept: "Rate, Distance & Time",
  },
  {
    id: "train-10",
    storyId: "night-train-murder",
    order: 10,
    sceneText:
      "The last piece: Ashford's trunk, weighed at the last station stop, is listed on the porter's manifest at 38 kilograms. Weighed again just now, it comes to 41.5 kilograms — and nothing was supposed to have been added to it.",
    puzzle: "What's the actual difference in weight, and what does it suggest was added?",
    choices: [
      "3.5 kg — about the weight of a fireplace poker or short cane",
      "0.5 kg — negligible, just measurement error",
      "13.5 kg — something enormous is missing an explanation",
      "The weights match; there's no discrepancy",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"Subtract the two readings straight across, sir,\" Rosalind says. \"41.5 minus 38. Don't round either number first — the whole clue is in the decimal.\"",
    solvedBeat:
      "3.5 kilograms — exactly heavy enough for a weapon to have been hidden inside, after the manifest was recorded. \"Someone added something to this trunk after the last stop,\" you say, \"and it's still in there.\" — Subtracting two measurements to find what changed is the plainest kind of arithmetic there is, and it just cracked the case.",
    concept: "Decimal Subtraction",
  },

  // ======================================================================
  // "The Euclid Trail" — following a secret society's markers across Greece
  // toward Euclid's own lost final proof. Companion: Elena, a local guide.
  // ======================================================================
  {
    id: "euclid-1",
    storyId: "euclid-trail",
    order: 1,
    sceneText:
      "At the edge of an olive grove outside Alexandria, Elena brushes dust from a flat stone. Carved into it: three arcs, each centered where the last one ends, forming the outline of a shape with all three sides visibly equal. \"This is the marker the old letters described,\" she says. \"But I don't know what it's *for*.\"",
    puzzle:
      "The carving is the classic first construction from Euclid's *Elements* — draw a circle from each of two points through the other, and connect their centers to the crossing point above. What shape does it always produce?",
    choices: ["An equilateral triangle", "A square", "A regular pentagon", "An isosceles trapezoid"],
    correctIndex: 0,
    wrongBeat:
      "Elena traces the two circles with her finger. \"Both circles have the same radius — the distance between the two centers. So every side you can draw from these three points is that same length, whichever ones you pick.\"",
    solvedBeat:
      "An equilateral triangle — three equal sides, guaranteed by nothing but two circles of the same radius. This is Proposition I.1, the very first proof in the *Elements*. As you trace it into the dust, a section of the stone grinds open beneath your feet. — Euclid opened his entire system with this construction because it needs nothing but a compass: no measuring, no assumptions, just circles.",
    concept: "Equilateral Triangle Construction",
  },
  {
    id: "euclid-2",
    storyId: "euclid-trail",
    order: 2,
    sceneText:
      "Down a stone stairway, a sundial is set into the floor, its shadow falling short of a marked line by a visible margin. An inscription reads: \"When the sun stands 40° above the horizon, the true path opens.\"",
    puzzle:
      "The sundial's gnomon (its raised edge) is exactly 1 meter tall, and right now its shadow measures roughly 1.19 meters. Using the fact that at a 40° sun angle the shadow-to-height ratio is about 1.19, is it time?",
    choices: [
      "Yes — the shadow length matches the ratio for 40°",
      "No — the shadow is too long for 40°, the sun is lower than that",
      "No — the shadow is too short for 40°, the sun is higher than that",
      "The gnomon's height doesn't affect the shadow ratio at all",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"A taller sun means a shorter shadow, not a longer one,\" Elena reminds you. \"Compare the *ratio* the inscription gives you to the ratio you actually measured — 1.19 to 1 either matches or it doesn't.\"",
    solvedBeat:
      "It matches exactly. The moment you confirm it, sunlight streams down a narrow shaft and lands precisely on a second marker deeper in the passage. — That shadow-to-height ratio for a given sun angle is the tangent function — trigonometry doing exactly what it was invented for: turning an angle into a length you can actually measure.",
    concept: "Trigonometry (Tangent)",
  },
  {
    id: "euclid-3",
    storyId: "euclid-trail",
    order: 3,
    sceneText:
      "A staircase descends in uneven steps: 2 meters, then 3, then 4.5, then 6.75 — each one noticeably wider than the last. Elena hesitates at the edge. \"If it keeps going like this, how wide is the next one? I don't want to misjudge a step in the dark.\"",
    puzzle: "Following the pattern, how wide should the next step be?",
    choices: ["8 meters", "9 meters", "10.125 meters", "9.5 meters"],
    correctIndex: 2,
    wrongBeat:
      "\"You're adding a fixed amount each time,\" you tell her, \"but look again — 3 is not 2 plus a fixed number that also turns 4.5 into 6.75. It's not addition. Try dividing each step by the one before it instead.\"",
    solvedBeat:
      "Each step is exactly 1.5 times the one before it, so the next is 6.75 × 1.5 = 10.125 meters — a genuinely dangerous stride in the dark, which is exactly why the builders wanted you to calculate it first, not guess. — A fixed multiplying factor between terms makes this a geometric sequence, cousin to the arithmetic sequence's fixed *added* amount.",
    concept: "Geometric Sequences",
  },
  {
    id: "euclid-4",
    storyId: "euclid-trail",
    order: 4,
    sceneText:
      "A bronze gate blocks the passage, its dial etched with two numbers: **252** and **105**. Elena reads the inscription beside it: \"Only their greatest common measure will move the gears.\"",
    puzzle: "What number opens the gate?",
    choices: ["21", "35", "7", "3"],
    correctIndex: 1,
    wrongBeat:
      "\"'Greatest common measure' is old language for greatest common divisor,\" you tell Elena. \"Divide the larger by the smaller, keep only the remainder, and repeat with that remainder — don't stop until nothing's left over.\"",
    solvedBeat:
      "252 = 105×2 + 42, then 105 = 42×2 + 21, then 42 = 21×2 + 0 — the gears turn at 21. The gate swings inward. — \"Greatest common measure\" is literally Euclid's own 2,300-year-old phrase for this — the algorithm bears his name because this passage in the *Elements* is where it was first written down.",
    concept: "The Euclidean Algorithm",
  },
  {
    id: "euclid-5",
    storyId: "euclid-trail",
    order: 5,
    sceneText:
      "A mosaic on the chamber floor shows a right triangle, two of its three sides labeled in the old tile-work: **9** and **12**. The third side has crumbled away entirely.",
    puzzle: "What length was the missing third side?",
    choices: ["15", "21", "13", "10.5"],
    correctIndex: 0,
    wrongBeat:
      "\"Don't just add them,\" you murmur, half to yourself. \"Square each of the two known sides, add *those* together, then find what number squares to that sum.\"",
    solvedBeat:
      "9² + 12² = 81 + 144 = 225, and 225 is 15². The missing tile was 15 units long — and with it placed, the mosaic completes a perfect right triangle, and a hidden panel beneath it clicks free. — The Pythagorean theorem, arguably the most famous single fact in all of mathematics, and it just opened a door.",
    concept: "The Pythagorean Theorem",
  },
  {
    id: "euclid-6",
    storyId: "euclid-trail",
    order: 6,
    sceneText:
      "Behind the panel, seven identical stone doors, each numbered. An inscription: \"Only the doors whose numbers cannot be broken into smaller pieces will hold.\" The numbers are: **14, 17, 21, 23, 27, 29, 33**.",
    puzzle: "Which of these numbers are prime — the doors that will actually hold?",
    choices: ["17, 23, and 29", "14, 21, and 27", "17, 21, and 33", "All seven of them"],
    correctIndex: 0,
    wrongBeat:
      "Elena taps each number in turn. \"'Cannot be broken into smaller pieces' means no smaller number divides it evenly, other than 1. Check each one for a factor before you decide.\"",
    solvedBeat:
      "17, 23, and 29 have no factors but themselves and 1; the rest split evenly (14=2×7, 21=3×7, 27=3×9, 33=3×11). You step through the three true doors, and the rest seal shut behind the others, exactly as warned. — Primes are the numbers Euclid himself proved, in Book IX, could never run out — infinitely many of them, forever.",
    concept: "Prime Numbers",
  },
  {
    id: "euclid-7",
    storyId: "euclid-trail",
    order: 7,
    sceneText:
      "The passage opens onto a vast ceiling of carved stars, crossed by two long grooves cut into the stone, running the full length of the room. \"They never meet, however far they run,\" Elena says, squinting up at them. \"Is that important, or is it just decoration?\"",
    puzzle:
      "Two straight lines carved so they never meet, no matter how far extended, in the same flat plane — what does Euclid's own system call this relationship?",
    choices: ["Parallel", "Perpendicular", "Skew", "Congruent"],
    correctIndex: 0,
    wrongBeat:
      "\"Perpendicular lines cross at a right angle — these two never cross at all,\" you say. \"'Skew' is for lines that miss each other because they're not even in the same flat plane. These two clearly are.\"",
    solvedBeat:
      "Parallel — and the moment you say the word aloud, standing exactly between the two grooves, a section of the star-ceiling rotates open above you. — Euclid didn't just define parallel lines; he built an entire fifth postulate around them, one so contested that mathematicians spent two thousand years trying to prove it from the other four before finally showing it couldn't be done.",
    concept: "Parallel Lines",
  },
  {
    id: "euclid-8",
    storyId: "euclid-trail",
    order: 8,
    sceneText:
      "A ledger, remarkably preserved, lists donations to the old society across its early years: **100, 150, 200, 250, 300** drachmas. The final entry is torn away.",
    puzzle: "Following the pattern, what was the final, missing donation?",
    choices: ["350", "400", "325", "500"],
    correctIndex: 0,
    wrongBeat:
      "\"Each entry is a fixed *amount* more than the last, not a fixed multiple,\" Elena reminds you — \"150 minus 100 is the same as 200 minus 150. Find that fixed gap and add it once more.\"",
    solvedBeat:
      "Each donation is exactly 50 more than the last, so the missing entry was 350 drachmas — and beneath the ledger's final page, a hand-drawn map fragment has been waiting, uncreased, for centuries. — A fixed amount added each time is the simplest possible pattern, an arithmetic sequence, and yet it's exactly how compound record-keeping like this has always worked.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "euclid-9",
    storyId: "euclid-trail",
    order: 9,
    sceneText:
      "The final chamber holds a circular pool with a square stone platform inscribed exactly inside it, corner to corner, edge to edge. An inscription: \"The pool's rim exceeds the platform's edge by the ratio of circle to square.\"",
    puzzle:
      "If the square platform's side is exactly as long as the pool's diameter (the square just touches the circle on all four sides), which is larger: the circle's circumference, or the square's perimeter?",
    choices: [
      "The circle's circumference is larger",
      "The square's perimeter is larger",
      "They're exactly equal",
      "It depends on the platform's material",
    ],
    correctIndex: 1,
    wrongBeat:
      "\"Don't guess by eye — the numbers settle it,\" you say. \"If the side length is *d*, the square's perimeter is 4d. The circle's circumference is π times d, and π is a little more than 3 — not 4.\"",
    solvedBeat:
      "The square's perimeter (4d) beats the circle's circumference (πd ≈ 3.14d) every time, for any size at all — a fact that holds true and never changes, however large the pool. As you say it aloud, the platform sinks flush into the water and a stairway spirals down beneath it. — That constant, π, has been the same irrational number since long before anyone carved this floor, and it will be exactly the same the next time anyone measures a circle.",
    concept: "Pi and Circumference",
  },
  {
    id: "euclid-10",
    storyId: "euclid-trail",
    order: 10,
    sceneText:
      "At the bottom of the spiral stair, a final vault door stands sealed, engraved with a single unfinished proof — the last page of what the old letters called Euclid's lost work. Beside it, a simple balance scale holds two stone weights, one at 12 units, one unknown, perfectly level.",
    puzzle:
      "The vault's mechanism will only open when the unknown weight, doubled, equals the known weight plus 8. What is the unknown weight?",
    choices: ["8", "10", "4", "2"],
    correctIndex: 1,
    wrongBeat:
      "\"Write it as an equation before you guess,\" you tell Elena. \"Twice the unknown weight equals 12 plus 8 — solve for the unknown from there, not by trial and error.\"",
    solvedBeat:
      "2x = 12 + 8, so 2x = 20, so x = 10. The scale's arm settles dead level, and the vault door swings open on a chamber lined with scrolls — Euclid's own working notes, annotated in a hand no one has read in two thousand years. — Setting an unknown equal to what balances it is the entire idea of algebra, distilled to a single scale.",
    concept: "Solving Linear Equations",
  },
];

// ======================================================================
// "The Statistician's Gambit" — an actuary is killed the night after
// uncovering a decade of fraud hidden in the company's own numbers.
// Cast: you (an independent forensic statistician), Mr. Pratt (a junior
// clerk, your Watson), and five staff at the firm where Eleanor Voss died:
// Abernathy (chief actuary), Calloway (head of claims), Devereux (junior
// clerk), Fairweather (the owner's daughter), and Griggs (night watchman).
// ======================================================================
const STATISTICIAN_CLUES: QuestClue[] = [
  {
    id: "stat-1",
    storyId: "statisticians-gambit",
    order: 1,
    sceneText:
      "The archive vault is cold enough to have preserved the evidence oddly well. Pratt checks his pocket watch nervously as the police surgeon examines Miss Voss. \"Normal body temperature is 37°C,\" the surgeon says, \"and it drops roughly 1°C for every hour after death, in a room this cold. She's reading 30°C right now, at eight in the evening.\"",
    puzzle: "Roughly how many hours before 8 PM did Miss Voss die?",
    choices: ["7 hours (around 1 PM)", "30 hours", "1 hour", "37 hours"],
    correctIndex: 0,
    wrongBeat:
      "\"Subtract the current reading from the normal temperature, not from the time,\" you tell Pratt. \"37 minus 30 tells you how many degrees have been lost — and each degree is one hour.\"",
    solvedBeat:
      "37 minus 30 is 7 — she likely died around one in the afternoon, hours before the building even properly emptied out. Pratt pales. \"Half the staff were still at their desks then.\" — A steady rate of change, one degree per hour, turns a single temperature reading into a whole timeline.",
    concept: "Rate of Change",
  },
  {
    id: "stat-2",
    storyId: "statisticians-gambit",
    order: 2,
    sceneText:
      "Voss's own desk holds this month's claims ledger, five figures circled in red ink: $1,200, $1,350, $1,180, $1,290, and $8,400.",
    puzzle: "Which of these five figures is the clear statistical outlier — the one that doesn't belong with the rest?",
    choices: ["$8,400", "$1,200", "$1,350", "$1,180"],
    correctIndex: 0,
    wrongBeat:
      "\"Don't just pick a number by instinct — check it against the others,\" you say. \"Four of these sit close together, within a couple hundred dollars of each other. One is nearly seven times the rest.\"",
    solvedBeat:
      "$8,400 towers over an otherwise tightly clustered set — exactly the kind of claim that should have triggered a review, and didn't. — Spotting a value that sits far outside where the rest of the data clusters is the first and oldest trick in a statistician's kit.",
    concept: "Outliers & the Mean",
  },
  {
    id: "stat-3",
    storyId: "statisticians-gambit",
    order: 3,
    sceneText:
      "A second ledger, hidden beneath the first, shows that same claim originally logged at $7,000 before being quietly revised upward to $8,400.",
    puzzle: "By what percentage was the original $7,000 claim inflated?",
    choices: ["20%", "12%", "16.7%", "84%"],
    correctIndex: 0,
    wrongBeat:
      "\"Find the actual dollar increase first,\" you tell Pratt. \"$8,400 minus $7,000. Then ask what percentage that increase is of the original $7,000 — not of the new total.\"",
    solvedBeat:
      "The increase is $1,400, and $1,400 is exactly 20% of $7,000 — a clean, deliberate one-fifth. — A percentage always needs a starting point to measure from, and picking the wrong one is the easiest way to get the wrong answer without making a single arithmetic mistake.",
    concept: "Percentages",
  },
  {
    id: "stat-4",
    storyId: "statisticians-gambit",
    order: 4,
    sceneText:
      "Voss's private notes compare five claims-approvers by how far their average approved claim strays from the company-wide norm. Four approvers stray by 1%, 2%, 2%, and 3%. Mrs. Calloway's own figure is smudged, but the note beside it reads: \"more than double anyone else's — by far.\"",
    puzzle:
      "Roughly what deviation would actually make Calloway's number \"more than double anyone else's, by far,\" given the others are 1%, 2%, 2%, and 3%?",
    choices: ["Something well above 6%", "Exactly 3%", "About 1.5%", "Exactly 6%, no more"],
    correctIndex: 0,
    wrongBeat:
      "\"Double the highest of the others is 6% exactly,\" you point out. \"'By far' means clearing that with real room to spare, not landing right on it.\"",
    solvedBeat:
      "Something well above 6% — a deviation that far outside her own peers doesn't happen by chance; it happens when someone is consistently approving claims she shouldn't. — That's a standard deviation doing its job: measuring not just that something is different, but how unusually different it really is.",
    concept: "Standard Deviation",
  },
  {
    id: "stat-5",
    storyId: "statisticians-gambit",
    order: 5,
    sceneText:
      "Devereux insists it's all coincidence. \"Big claims happen. Odd approvals happen.\" Voss's own notes estimate a claim as unusual as the $8,400 one happens naturally about 1 time in 20, and an approver's deviation being this unusual happens naturally about 1 time in 15.",
    puzzle:
      "If those two unusual events are independent of each other, roughly what's the chance both would happen together by pure, innocent coincidence?",
    choices: ["About 1 in 300", "About 1 in 35", "About 1 in 20", "About 1 in 15"],
    correctIndex: 0,
    wrongBeat:
      "\"Independent chances multiply, they don't add,\" you tell Devereux. \"1 in 20, times 1 in 15 — not 20 plus 15.\"",
    solvedBeat:
      "1/20 times 1/15 is 1/300 — vanishingly unlikely to be innocent coincidence, twice over. \"Two rare things happening together, on the same claim, isn't bad luck,\" you say. \"It's a pattern.\" — Multiplying independent probabilities together is exactly how 'unlikely' quietly becomes 'nearly impossible.'",
    concept: "Compound Probability",
  },
  {
    id: "stat-6",
    storyId: "statisticians-gambit",
    order: 6,
    sceneText:
      "You lay two columns from Voss's ledger side by side: the size of each questionable claim, and how quickly Calloway personally approved it. The bigger the claim, the faster it seems to have been rubber-stamped — almost without exception.",
    puzzle:
      "A pattern where one value consistently rises exactly as another consistently falls — bigger claims, shorter approval times — is called what?",
    choices: [
      "A strong negative correlation",
      "A strong positive correlation",
      "No correlation at all",
      "Causation, proven outright",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"Positive correlation means both numbers rise together,\" you remind Pratt. \"Here, as claim size goes up, approval time goes down — that's the two moving in opposite directions, which is negative, not positive.\"",
    solvedBeat:
      "A strong negative correlation — and a suspicious one. The bigger the fraud, the less scrutiny it apparently received. \"Correlation isn't proof on its own,\" you say, \"but it's exactly the kind of pattern that tells you where to keep looking.\" — Two variables moving in strict opposite lockstep is precisely what a negative correlation means.",
    concept: "Correlation",
  },
  {
    id: "stat-7",
    storyId: "statisticians-gambit",
    order: 7,
    sceneText:
      "Voss tracked the padded amount, quarter by quarter, for the last four quarters: $1,000, $1,400, $1,800, $2,200.",
    puzzle: "If the pattern continues, how much would next quarter's padding have been?",
    choices: ["$2,600", "$2,500", "$2,800", "$3,000"],
    correctIndex: 0,
    wrongBeat:
      "\"Find the fixed amount added each quarter first,\" you say. \"$1,400 minus $1,000 — then check that same gap holds between every later pair before adding it on once more.\"",
    solvedBeat:
      "Each quarter adds exactly $400, so next quarter would have been $2,600 — someone growing bolder, and more careless, with every passing season. — A fixed amount tacked on every single time is an arithmetic sequence, whether it's counting a pattern in nature or counting someone's nerve.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "stat-8",
    storyId: "statisticians-gambit",
    order: 8,
    sceneText:
      "Voss's personal desk drawer is locked with a numbered dial. A note taped underneath the desk reads: \"combination is the GCD of 180 and 126.\"",
    puzzle: "What's the combination?",
    choices: ["18", "36", "9", "6"],
    correctIndex: 0,
    wrongBeat:
      "\"Divide the larger by the smaller, keep the remainder, then repeat with that remainder,\" you tell Pratt. \"Stop only when nothing's left over — whatever you divided by last is the answer.\"",
    solvedBeat:
      "180 = 126×1 + 54, then 126 = 54×2 + 18, then 54 = 18×3 + 0 — the drawer clicks open on 18. Inside: a full, dated timeline of every padded claim, each one initialed by the same claims officer. — The Euclidean algorithm, cracking a lock the same way it's cracked one for over two thousand years.",
    concept: "The Euclidean Algorithm",
  },
  {
    id: "stat-9",
    storyId: "statisticians-gambit",
    order: 9,
    sceneText:
      "The company's own audit policy states plainly: any approver whose numbers would arise by chance less than 5% of the time should be flagged for review. Voss calculated Calloway's odds of innocence at roughly 0.3%.",
    puzzle: "By the company's own stated rule, should Calloway have been flagged for review?",
    choices: [
      "Yes — 0.3% is far below the 5% threshold for suspicion",
      "No — 0.3% is a very small number, so it's not concerning",
      "It's impossible to say without more data",
      "Only if the amount involved was over $10,000",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"A smaller percentage means something is less likely to be innocent chance, not more,\" you explain to Pratt. \"0.3% is well under the company's own 5% cutoff — that's exactly the case their own policy says to flag.\"",
    solvedBeat:
      "Yes — by the company's own written rule, this should have triggered an automatic review months ago. Someone made sure it never did. — That's the whole logic behind a significance threshold: decide in advance how surprising is 'too surprising to be chance,' then hold every result to that same line, no exceptions.",
    concept: "Statistical Significance",
  },
  {
    id: "stat-10",
    storyId: "statisticians-gambit",
    order: 10,
    sceneText:
      "Voss's timeline lists the padded amount for twelve straight quarters, starting at $1,000 and rising by $400 every quarter, exactly as the pattern predicted.",
    puzzle: "What's the total padded across all twelve quarters?",
    choices: ["$38,400", "$26,400", "$4,800", "$61,600"],
    correctIndex: 0,
    wrongBeat:
      "\"Work out the twelfth quarter's own amount first — it's $1,000 plus eleven more jumps of $400,\" you tell Pratt. \"Then add the first and last quarter together, multiply by how many quarters there are, and divide by two.\"",
    solvedBeat:
      "The twelfth quarter's padding is $1,000 + 11×$400 = $5,400. Summing the series: (1,000 + 5,400) × 12 ÷ 2 = $38,400 — a figure that, when Pratt checks the bank records, matches a \"private loan repayment\" in Mrs. Calloway's own name, to the exact dollar. — Summing an arithmetic sequence doesn't need adding twelve numbers by hand; pairing the first and last, then the second and second-to-last, is a trick as old as a schoolyard story about a young Gauss.",
    concept: "Sum of an Arithmetic Sequence",
  },
];

// ======================================================================
// "Pirate's Cove" — a dead captain's map uses geometry and ratios instead
// of words, because he trusted numbers more than he ever trusted a crew.
// Companion: Bess, a weathered sailor who tried this cove once before and
// failed.
// ======================================================================
const PIRATES_COVE_CLUES: QuestClue[] = [
  {
    id: "cove-1",
    storyId: "pirates-cove",
    order: 1,
    sceneText:
      "The cove's entrance stone bears a carved compass rose, half-worn by salt spray. Bess traces the marking with a calloused finger. \"S 40° E — that's the heading to the first marker, old captain's hand, sure as anything.\"",
    puzzle: "Measuring clockwise from true north (0°), what compass heading, out of 360°, does \"S 40° E\" actually point to?",
    choices: ["140°", "220°", "40°", "180°"],
    correctIndex: 0,
    wrongBeat:
      "Bess shakes her head. \"South is due opposite north — that's halfway round the circle, 180°. Swinging forty degrees back toward east from there, you're subtracting, not adding.\"",
    solvedBeat:
      "140°. Bess sights along the line with a length of cord pulled taut, and you both start walking. — Reading a bearing like \"S 40° E\" is just angle measurement dressed up in old sailor's shorthand.",
    concept: "Angle Measurement (Bearings)",
  },
  {
    id: "cove-2",
    storyId: "pirates-cove",
    order: 2,
    sceneText:
      "At the first marker, two iron rings are driven into the rock, eighteen paces apart. A weathered note nearby: \"Tie a 10-pace rope to one ring, a 6-pace rope to the other. Where they can both reach taut is the second mark — if they can reach at all.\"",
    puzzle: "Can a 10-pace rope and a 6-pace rope, tied to two rings 18 paces apart, ever both pull taut to the same point?",
    choices: [
      "No — 10 and 6 can never span a gap of 18, however you stretch them",
      "Yes — just pull both as hard as you can",
      "Only if the ropes are made of the same material",
      "Yes, but only exactly halfway between the rings",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"Add the two ropes together first,\" you tell Bess. \"Ten and six is sixteen — and sixteen is shorter than the eighteen paces between the rings. Two sides of a triangle always have to out-stretch the third, or there's no triangle at all.\"",
    solvedBeat:
      "No triangle is possible — the ropes are simply too short for this gap. \"The captain's testing us before we've even started walking,\" Bess mutters, and you look instead for a third ring hidden nearby, one the note never mentioned. — Two sides of a triangle must always add up to more than the third, or the shape can't close at all. It's called the triangle inequality.",
    concept: "The Triangle Inequality",
  },
  {
    id: "cove-3",
    storyId: "pirates-cove",
    order: 3,
    sceneText:
      "Behind a fallen palm, a third ring. The note continues: \"From the true ring, the third stands at three strides for every two of the second ring's own distance to it.\" The second ring sits 12 strides from the first.",
    puzzle: "If the third ring's distance from the first is in a 3-to-2 ratio with the second ring's 12-stride distance, how many strides away is the third ring?",
    choices: ["18", "8", "16", "20"],
    correctIndex: 0,
    wrongBeat: "\"Set it up as a ratio, not a guess,\" you say. \"3 is to 2 as X is to 12 — cross-multiply, don't just add on a few strides.\"",
    solvedBeat:
      "18 strides — three-halves of 12 is exactly 18. You pace it off, and the ground here sounds hollow underfoot. — Keeping a ratio's proportions locked together, cross-multiplying rather than guessing, is the whole trick of scaling anything up or down correctly.",
    concept: "Ratios & Proportion",
  },
  {
    id: "cove-4",
    storyId: "pirates-cove",
    order: 4,
    sceneText:
      "The hollow patch is a sealed hatch — but it only opens with the tide. Bess checks the cove's tide-stone: the water cycles fully in and out every 6 hours, and the hatch \"answers to the seventh turn of the tide since you first set foot ashore.\" You landed at dawn; it's now mid-afternoon, 9 hours later.",
    puzzle: "How many more hours must you wait for the seventh full tide-cycle since landing?",
    choices: ["33 hours", "42 hours", "9 hours", "24 hours"],
    correctIndex: 0,
    wrongBeat:
      "\"Seven full cycles is 7 times 6 hours — 42 hours total since landing,\" you say. \"You've already waited 9 of those. Subtract what's already passed from the total you need.\"",
    solvedBeat:
      "42 minus 9 is 33 hours still to wait. Bess groans, but sets up camp anyway — the hatch, she reminds you, has waited centuries; it can wait one more night and a day. — Counting whole repeating cycles and then subtracting what's already elapsed is the plain arithmetic under every tide table ever printed.",
    concept: "Elapsed Time & Multiples",
  },
  {
    id: "cove-5",
    storyId: "pirates-cove",
    order: 5,
    sceneText:
      "The tide turns for the seventh time in the dead of night, and the hatch groans open. Inside, a small chamber holds a row of barrels, each branded with tally marks: ten strokes, a gap, then a single carved \"3.\"",
    puzzle:
      "Reading it as the old pursers did — a full group of ten strokes as one \"ten,\" and the separate carved digit as the \"ones\" — what total does this barrel's marking represent?",
    choices: ["13", "10", "43", "103"],
    correctIndex: 0,
    wrongBeat:
      "\"The tally isn't the number itself — it's a count of tens,\" you explain. \"Ten strokes means one full ten. Add the separate ones-digit after it; don't just tally up marks and digit as if they were the same kind of count.\"",
    solvedBeat:
      "13 — one full ten from the tally, plus the carved 3 ones. Barrel thirteen, then. You roll it aside, and a narrow stair spirals down beneath where it stood. — Grouping a count into tens before reading the final digit is place value doing exactly the job it was invented for, however old the counting system.",
    concept: "Place Value",
  },
  {
    id: "cove-6",
    storyId: "pirates-cove",
    order: 6,
    sceneText:
      "At the bottom of the stair, a stone dial bears two rings: the outer marked for the tide (a full turn every 6 hours), the inner for moonrise (a full turn every 4 hours). An inscription: \"Only when both rings return to their start together will the door beneath open.\"",
    puzzle: "The tide ring resets every 6 hours, the moon ring every 4. How many hours until both rings are back at their starting position at exactly the same moment?",
    choices: ["12", "24", "10", "6"],
    correctIndex: 0,
    wrongBeat: "\"Don't just add 6 and 4,\" Bess says. \"You need a number both 6 and 4 divide into evenly — the smallest one they share.\"",
    solvedBeat:
      "12 hours — the smallest number both 6 and 4 divide evenly. The rings click into alignment, and the floor beneath the dial drops away into a stairwell. — That's the least common multiple: the first point where two different repeating cycles ever truly line back up.",
    concept: "Least Common Multiple",
  },
  {
    id: "cove-7",
    storyId: "pirates-cove",
    order: 7,
    sceneText:
      "A chasm splits the passage ahead, too wide to leap. On the far wall, a peg juts out exactly level with one on this side. Bess ties a cord from your peg straight down 6 paces to the chasm floor, then across to a point on the floor 8 paces out from directly beneath the far peg.",
    puzzle: "If the drop is 6 paces and the floor-distance to the point below the far peg is 8 paces, how long a plank would you need to span directly between the two pegs, corner to corner?",
    choices: ["10 paces", "14 paces", "48 paces", "7 paces"],
    correctIndex: 0,
    wrongBeat:
      "\"Don't just add six and eight,\" you tell Bess. \"Square each one, add those squares together, then find what number squares back to that sum.\"",
    solvedBeat:
      "6² + 8² = 36 + 64 = 100, and 100 is 10². A ten-pace plank, exactly. You lay it across, and it holds. — The Pythagorean theorem, spanning a chasm as reliably as it's spanned every right triangle for the last twenty-five centuries.",
    concept: "The Pythagorean Theorem",
  },
  {
    id: "cove-8",
    storyId: "pirates-cove",
    order: 8,
    sceneText:
      "Beyond the chasm, a series of old dig-marks on the wall record depths in fathoms: 2, 3.5, 5, 6.5 — each one clearly deeper than the last.",
    puzzle: "Following the pattern, how deep should the next dig-mark be?",
    choices: ["8 fathoms", "8.5 fathoms", "7.5 fathoms", "9 fathoms"],
    correctIndex: 0,
    wrongBeat:
      "\"Find the fixed gap between each mark first,\" you say. \"3.5 minus 2, then 5 minus 3.5 — if those gaps match, add that same gap once more.\"",
    solvedBeat:
      "Each mark is exactly 1.5 fathoms deeper than the last, so the next is 6.5 + 1.5 = 8 fathoms. You dig there, and your shovel strikes something hollow and metal. — A fixed amount added each time, even a fractional one, is still an arithmetic sequence underneath.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "cove-9",
    storyId: "pirates-cove",
    order: 9,
    sceneText:
      "The hollow object is a small chest of gold coins — but one coin, dulled and slightly smaller, catches your eye. A genuine coin weighs 30 grams; this one weighs 27.",
    puzzle: "By what percentage is the odd coin lighter than a genuine one?",
    choices: ["10%", "3%", "27%", "90%"],
    correctIndex: 0,
    wrongBeat:
      "\"The percentage is the difference over the original, not the difference by itself,\" you tell Bess. \"Three grams lighter, out of thirty original grams — turn that fraction into a percent.\"",
    solvedBeat:
      "3 out of 30 is one-tenth, or 10% lighter — a lead-filled decoy, planted to catch a careless thief who doesn't weigh what he grabs. You pocket only the real coins. — Turning a plain difference into a percentage always means asking 'out of what,' not just 'how much.'",
    concept: "Percentages",
  },
  {
    id: "cove-10",
    storyId: "pirates-cove",
    order: 10,
    sceneText:
      "The final chamber is a perfectly circular clearing, floor cut from a single slab, exactly 14 paces across. A plaque reads: \"Dig where a circle of half this one's area would just fit, centered the same.\"",
    puzzle: "The clearing has a 14-pace diameter. What should the diameter of a circle with half its area be, to the nearest tenth of a pace?",
    choices: ["About 9.9 paces", "About 7 paces", "About 4.95 paces", "About 12 paces"],
    correctIndex: 0,
    wrongBeat:
      "\"Halving the area doesn't mean halving the diameter,\" you tell Bess. \"Area scales with the square of the radius — halve the area, and the radius only shrinks by about seventy percent, not fifty.\"",
    solvedBeat:
      "Close to 9.9 paces. You pace out a circle just inside the first, mark its center, and dig. Your spade strikes something hard — not gold, but stone: three sealed stone chests, side by side, each carved with an inscription. Bess crouches beside you. \"Only one of these is real. The captain never made anything easy.\" — Area doesn't shrink in a straight line with length; it shrinks with length squared, which is exactly why halving a circle's area only shrinks its width by about seventy percent, not fifty.",
    concept: "Circles & Area Scaling",
  },
];

// ======================================================================
// "Blood on the Chessboard" — a grandmaster dies mid-tournament, and his
// final position on the board is the only statement he left behind.
// Cast: you (an investigator with a head for numbers), Mira (the
// tournament arbiter, your Watson), and five figures from the chess world:
// Olenska (his chief rival), Whitfield (the tournament's secret backer),
// Petrov (a bitter former student), Delacroix (a chess journalist), and
// Halvorsen (the tournament director).
// ======================================================================
const CHESSBOARD_CLUES: QuestClue[] = [
  {
    id: "chess-1",
    storyId: "blood-on-the-chessboard",
    order: 1,
    sceneText:
      "Grandmaster Viktor Kessler's opponent, young challenger Aria Chen, says she stepped away from the board at 9:15 to fetch water and returned at 9:30 to find him already dead — gone, she insists, no more than fifteen minutes. But Mira's own arbiter log shows the last move on the scoresheet was recorded at 8:52 PM.",
    puzzle: "If Chen's account of a fifteen-minute absence is accurate, how many unaccounted minutes lie between the last recorded move (8:52) and her return (9:30)?",
    choices: ["23 minutes", "38 minutes", "15 minutes", "8 minutes"],
    correctIndex: 0,
    wrongBeat:
      "\"Find the total gap first, then subtract what her own story accounts for,\" you tell Mira. \"8:52 to 9:30 is one number. Her claimed fifteen minutes away is a smaller piece of that same window, not the whole thing.\"",
    solvedBeat:
      "8:52 to 9:30 is 38 minutes total; subtract her claimed 15 away, and 23 minutes sit completely unaccounted for. \"Someone else was in this hall during that window,\" you say, \"whether Chen realizes it or not.\" — Finding a gap and then subtracting a smaller, known piece out of it is interval arithmetic doing real detective work.",
    concept: "Elapsed Time & Subtraction",
  },
  {
    id: "chess-2",
    storyId: "blood-on-the-chessboard",
    order: 2,
    sceneText:
      "Beside the board, a torn page from a book on chess history describes the old wheat-and-chessboard legend: place 1 grain on square 1, double it for square 2, double again for square 3, and so on across all 64 squares.",
    puzzle: "Following that same doubling pattern, how many grains would be on square 5 alone?",
    choices: ["16", "32", "10", "8"],
    correctIndex: 0,
    wrongBeat: "\"Write out the squares one at a time,\" Mira says. \"1, 2, 4, 8 — then double that last one once more for square 5.\"",
    solvedBeat:
      "1, 2, 4, 8, 16 — square 5 holds 16 grains. \"By square 64,\" you murmur, doing the doubling in your head and stopping well short, \"that number would already be larger than anything real.\" — Doubling something a fixed number of times is exponential growth, and it outpaces plain addition faster than intuition ever expects.",
    concept: "Powers of 2 (Exponential Growth)",
  },
  {
    id: "chess-3",
    storyId: "blood-on-the-chessboard",
    order: 3,
    sceneText:
      "Kessler's personal notebook lists a private \"trap\" — a sequence he always intended to spring using exactly 3 specific opening moves from a repertoire he'd spent years preparing, played in whatever order the position called for.",
    puzzle: "In how many different orders could Kessler have played those same 3 prepared moves?",
    choices: ["6", "3", "9", "27"],
    correctIndex: 0,
    wrongBeat: "\"Don't just count the moves — count the orderings,\" you tell Mira. \"3 choices for the first move, then 2 remaining for the second, then only 1 left for the third. Multiply those together.\"",
    solvedBeat:
      "3 × 2 × 1 = 6 possible orderings. \"He rehearsed his trap six different ways,\" you say, \"which means whichever one he actually played that night was a deliberate choice, not an accident.\" — Multiplying down from the full count each time you use up one option is exactly how permutations are counted.",
    concept: "Permutations",
  },
  {
    id: "chess-4",
    storyId: "blood-on-the-chessboard",
    order: 4,
    sceneText:
      "A scrap of paper hidden in Kessler's coat pocket reads a short string of moves, followed by an odd binary notation scrawled beneath: **1000**.",
    puzzle: "Reading that scrawled string as a plain binary number, what value does 1000 represent in ordinary base-10?",
    choices: ["8", "4", "10", "16"],
    correctIndex: 0,
    wrongBeat:
      "\"Each binary digit is worth double the one before it, starting from the right,\" you explain. \"1, 2, 4, 8 — line those place-values up under the digits and add only the ones marked with a 1.\"",
    solvedBeat:
      "1000 in binary is just an 8 in the eights-place and zeros everywhere else — the number 8. \"Move eight,\" you say. \"He was marking something about his own eighth move.\" — Binary is the same place-value idea as ordinary counting, just built on doubling instead of on tens.",
    concept: "Binary Numbers",
  },
  {
    id: "chess-5",
    storyId: "blood-on-the-chessboard",
    order: 5,
    sceneText:
      "A pattern is carved faintly into the underside of the board itself — a shape that, when you mentally turn it a quarter-turn, looks exactly the same as it did before you turned it.",
    puzzle: "Which of these shapes genuinely looks identical after a 90° turn?",
    choices: ["A square", "A rectangle that isn't a square", "A regular pentagon", "The letter Z"],
    correctIndex: 0,
    wrongBeat:
      "\"A plain rectangle swaps its long side for its short side on a quarter-turn — it doesn't look the same,\" Mira points out. \"A pentagon repeats every 72°, not 90°. You need a shape built specifically around quarter-turns.\"",
    solvedBeat:
      "A square — the one shape here that turns a perfect quarter and looks exactly as it did. Underneath the carving, a small compartment clicks loose. — That's rotational symmetry: a shape that maps back onto itself after less than a full turn.",
    concept: "Rotational Symmetry",
  },
  {
    id: "chess-6",
    storyId: "blood-on-the-chessboard",
    order: 6,
    sceneText:
      "The opening Kessler chose tonight — obscure enough that tournament records show it played only 2 times in the last 500 recorded grandmaster games — was met instantly by Chen with its one known, exact refutation. On her very first try.",
    puzzle: "Statistically speaking, does Chen's instant, exact response suggest advance preparation, or an innocent guess?",
    choices: [
      "Almost certainly prepared — the odds of guessing correctly are vanishingly small",
      "Purely lucky; this could happen to anyone",
      "Impossible to tell without seeing more of her games",
      "It doesn't matter, since chess has no randomness in it at all",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"An opening played twice in five hundred games is already rare,\" you tell Mira. \"Guessing its one exact refutation on the very first try, with no hesitation, isn't the kind of thing luck reliably produces.\"",
    solvedBeat:
      "Almost certainly prepared. \"Someone told her exactly what Kessler intended to play tonight,\" you say, \"and told her well before she sat down at this board.\" — When an outcome this specific keeps landing on the unlikely side, probability itself becomes evidence.",
    concept: "Probability & Prior Preparation",
  },
  {
    id: "chess-7",
    storyId: "blood-on-the-chessboard",
    order: 7,
    sceneText:
      "An earlier tournament sheet, dated before Kessler's death, lists the ratings of the officially seeded final four: Kessler (2830), Olenska (2795), Petrov (2710), and a fourth name smudged beyond reading — with a handwritten note: \"average rating of all four: 2765.\"",
    puzzle: "What was the smudged fourth player's rating?",
    choices: ["2725", "2745", "2700", "2760"],
    correctIndex: 0,
    wrongBeat:
      "\"Multiply the average by how many players there are first,\" you tell Mira. \"2765 times 4 gives you the total of all four ratings combined. Subtract the three you already know, and whatever's left is the fourth.\"",
    solvedBeat:
      "2765 × 4 = 11,060 total; subtracting 2830, 2795, and 2710 leaves exactly 2725. That rating, you realize, matches no working player currently in the tournament database at all — only a name used once, years ago, by a since-banned proxy account. — An average is just a total in disguise, and multiplying it back out is how you recover what it was hiding.",
    concept: "Averages & Algebra",
  },
  {
    id: "chess-8",
    storyId: "blood-on-the-chessboard",
    order: 8,
    sceneText:
      "With Kessler gone, Halvorsen must decide how to pair the three remaining seeded contenders for a shortened final, each playing every other contender exactly once.",
    puzzle: "How many total games does a complete round-robin between exactly 3 players require?",
    choices: ["3", "6", "9", "1"],
    correctIndex: 0,
    wrongBeat:
      "\"List the actual pairings instead of guessing,\" you say. \"Player A versus B, A versus C, B versus C — count how many distinct pairs that really is.\"",
    solvedBeat:
      "Exactly 3 games — A-B, A-C, and B-C, with no pairing repeated. — Counting how many distinct pairs you can form from a small group, without caring about order, is exactly what a combination counts.",
    concept: "Combinations",
  },
  {
    id: "chess-9",
    storyId: "blood-on-the-chessboard",
    order: 9,
    sceneText:
      "The black queen from Kessler's personal set feels wrong in your hand — lighter than its twin from Olenska's set, though identical in size. Kessler's queen weighs 18 grams; a genuine tournament-standard queen of that size should weigh 24 grams.",
    puzzle: "By what fraction of its proper weight is Kessler's queen underweight?",
    choices: ["1/4", "1/3", "3/4", "1/6"],
    correctIndex: 0,
    wrongBeat:
      "\"Find the actual gap in grams first,\" you tell Mira. \"24 minus 18. Then ask what fraction that gap is of the full 24 grams it should weigh — not of the 18 it does weigh.\"",
    solvedBeat:
      "24 minus 18 is 6, and 6 out of 24 reduces to exactly 1/4. Prying the piece open, you find its base hollowed out — just large enough to have once held a tiny transmitter. — A fraction is only meaningful once you're sure what the *whole* actually is.",
    concept: "Fractions",
  },
  {
    id: "chess-10",
    storyId: "blood-on-the-chessboard",
    order: 10,
    sceneText:
      "Analysts poring over Kessler's frozen final position agree: it's a forced mate in exactly 2 moves for White, regardless of how Black defends — and White has exactly 20 legal first moves available from the game's starting position in general, though only ever a handful matter this deep into a game.",
    puzzle:
      "If a single specific, highly unusual opening choice represents just 1 out of a player's 20 legal first-move options, what percentage of all first-move options does that one specific choice represent?",
    choices: ["5%", "20%", "50%", "2%"],
    correctIndex: 0,
    wrongBeat: "\"Turn the fraction into a percentage properly,\" you say. \"1 out of 20 — divide 1 by 20, then move the decimal to read it as a percent.\"",
    solvedBeat:
      "1 divided by 20 is 0.05, or 5%. A rare choice, deliberately made — and rare choices, repeated on cue by someone who'd never played this line before, are exactly what tells you a game was compromised before the first piece ever moved. — Turning a plain fraction into a percentage is just re-expressing the same ratio out of a hundred instead of out of the original whole.",
    concept: "Percentages",
  },
];

// ======================================================================
// "The Lighthouse Keeper's Code" — a retired keeper's logbook encodes a
// shipwreck's treasure using the tools of his own trade: light, tides,
// and numbers. Companion: Finch, a young apprentice keeper.
// ======================================================================
const LIGHTHOUSE_CLUES: QuestClue[] = [
  {
    id: "light-1",
    storyId: "lighthouse-keepers-code",
    order: 1,
    sceneText:
      "Old Hale's logbook names three regional lighthouses as candidates for where his cipher truly begins: Lighthouse A flashes every 15 seconds, Lighthouse B every 10 seconds, Lighthouse C every 20 seconds. Hale's own log states plainly: \"her lamp turns and catches the sun's position exactly 4 times in each full minute.\"",
    puzzle: "Which lighthouse matches Hale's description of exactly 4 flashes per minute?",
    choices: ["Lighthouse A", "Lighthouse B", "Lighthouse C", "None of them match"],
    correctIndex: 0,
    wrongBeat:
      "\"Divide 60 seconds by each interval and see which one lands on 4,\" you tell Finch. \"60 divided by 15, then 60 divided by 10, then 60 divided by 20 — only one of those comes out even to 4.\"",
    solvedBeat:
      "60 ÷ 15 = 4 exactly — Lighthouse A is the one. Finch grins and pulls out Hale's old service records for this very tower. — Dividing a full cycle by an interval to see how many times it repeats is the same plain arithmetic behind every rate you'll ever need to check.",
    concept: "Division & Rates",
  },
  {
    id: "light-2",
    storyId: "lighthouse-keepers-code",
    order: 2,
    sceneText:
      "Hale's log continues: \"She reveals herself only at the tide's lowest ebb, and the tide runs its full cycle, high to high, in 12 hours and 24 minutes — call it 12.4 hours for figuring.\" Today's high tide was logged at 3:00 AM.",
    puzzle: "Roughly what time will the next high tide occur?",
    choices: ["About 3:24 PM", "About 3:00 PM", "About 12:24 PM", "About 12:00 AM (midnight)"],
    correctIndex: 0,
    wrongBeat:
      "\"Add the full 12.4 hours onto 3:00 AM,\" you say. \"12 hours gets you to 3:00 PM exactly — the extra 0.4 of an hour is about 24 more minutes on top of that.\"",
    solvedBeat:
      "3:00 AM plus 12 hours 24 minutes lands at about 3:24 PM. Finch marks the low tide window for that afternoon in the margin. — Adding a time interval that isn't a clean number of hours just means handling the fraction of an hour as extra minutes, carefully, at the end.",
    concept: "Adding Time Intervals",
  },
  {
    id: "light-3",
    storyId: "lighthouse-keepers-code",
    order: 3,
    sceneText:
      "From the lamp room, exactly 30 meters above the waterline, Finch sights the wreck site through Hale's old brass scope at a downward angle of 30° below the horizontal. Hale's own marginal note reads: \"at thirty degrees down, walk out about one-and-seven-tenths times what you stand above the water.\"",
    puzzle: "Roughly how far out is the wreck site, if the horizontal distance is about 1.7 times the 30-meter height of the lamp room?",
    choices: ["About 51 meters", "About 30 meters", "About 17 meters", "About 90 meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply, don't just repeat the height,\" you tell Finch. \"1.7 times 30, not 1.7 plus 30.\"",
    solvedBeat:
      "30 × 1.7 ≈ 51 meters out from the base of the lighthouse. Finch paces off a rough line from the tower toward the water. — That 1.7 figure is the tangent of a 30° angle, quietly doing the same job it always does: turning a sighting angle into an actual distance.",
    concept: "Trigonometry (Tangent)",
  },
  {
    id: "light-4",
    storyId: "lighthouse-keepers-code",
    order: 4,
    sceneText:
      "A page of otherwise routine weather notes ends with a string of dots and dashes: •−•• •• −−• •••• −",
    puzzle: "Decoding each group as Morse code (•−•• = L, •• = I, −−• = G, •••• = H, − = T), what word does the string spell?",
    choices: ["LIGHT", "NIGHT", "TIDE", "HELP"],
    correctIndex: 0,
    wrongBeat: "\"Match each group to its given letter in order, left to right, one at a time,\" you tell Finch. \"Don't guess the whole word before you've decoded every group.\"",
    solvedBeat:
      "L-I-G-H-T — \"LIGHT.\" Of course, Finch says: a keeper's whole life was the light. — Morse code is just a fixed dictionary of short and long signals standing in for letters, decoded the same patient way every time.",
    concept: "Morse Code & Encoding",
  },
  {
    id: "light-5",
    storyId: "lighthouse-keepers-code",
    order: 5,
    sceneText:
      "Elsewhere, Hale counted gulls landing on the rail each morning for eight days running, jotting the tally each time: 1, 1, 2, 3, 5, 8, 13, ...",
    puzzle: "Following the pattern, how many gulls would day 9 show?",
    choices: ["21", "20", "18", "24"],
    correctIndex: 0,
    wrongBeat: "\"Each number is the sum of the two right before it,\" you tell Finch. \"8 plus 13, not 13 plus some guess.\"",
    solvedBeat:
      "8 + 13 = 21. \"He wasn't just watching birds,\" Finch says, half-amused. \"He was doodling in the one pattern that shows up everywhere from pinecones to seashells.\" — That's the Fibonacci sequence: each term simply the sum of the two terms before it.",
    concept: "The Fibonacci Sequence",
  },
  {
    id: "light-6",
    storyId: "lighthouse-keepers-code",
    order: 6,
    sceneText:
      "By surviving account, the merchant vessel Calypso's Promise was making a steady 8 knots — nautical miles per hour — when she struck the rocks, having sailed 20 nautical miles from the harbor mouth.",
    puzzle: "At a steady 8 knots, how long had she been sailing to cover those 20 nautical miles?",
    choices: ["2.5 hours", "2 hours", "8 hours", "160 hours"],
    correctIndex: 0,
    wrongBeat: "\"Divide the distance by the speed, not the other way around,\" you tell Finch. \"20 nautical miles, divided by 8 knots.\"",
    solvedBeat:
      "20 ÷ 8 = 2.5 hours — two and a half hours out from harbor when she struck. — Speed, distance, and time are always the same one relationship, just solved for whichever piece you don't already know.",
    concept: "Speed, Distance & Time",
  },
  {
    id: "light-7",
    storyId: "lighthouse-keepers-code",
    order: 7,
    sceneText:
      "Hale's own ink recipe, scrawled in a margin: \"lamp oil for shine, mixed 3 parts to every 1 part of the real ink.\"",
    puzzle: "If oil and ink are mixed 3 parts to 1 part, what percentage of the total mixture is oil?",
    choices: ["75%", "25%", "33%", "60%"],
    correctIndex: 0,
    wrongBeat:
      "\"Add the parts together first to find the whole,\" you say. \"3 parts oil plus 1 part ink is 4 parts total — oil is 3 of those 4 parts, not just '3 out of 3.'\"",
    solvedBeat:
      "3 out of 4 total parts is 75%. Finch dabs a test of the recipe onto old paper, and the same faint sheen Hale's other pages have appears instantly. — Turning a ratio into a percentage always starts with finding the true size of the whole first.",
    concept: "Ratios to Percentages",
  },
  {
    id: "light-8",
    storyId: "lighthouse-keepers-code",
    order: 8,
    sceneText:
      "The wreck, per Hale's own estimate, rests at a depth of 12 fathoms. Finch has only ever measured depth in feet.",
    puzzle: "If 1 fathom equals 6 feet, how many feet deep is the wreck?",
    choices: ["72 feet", "18 feet", "6 feet", "84 feet"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the fathoms by 6, don't add them,\" you tell Finch. \"Each fathom is 6 whole feet, twelve separate times.\"",
    solvedBeat:
      "12 × 6 = 72 feet. \"Deep enough that Hale himself could never have dived it,\" you say, \"which means this was always meant to be found by his notes, not his own two hands.\" — Converting between units is nothing more than a multiplication once you know the fixed rate between them.",
    concept: "Unit Conversion",
  },
  {
    id: "light-9",
    storyId: "lighthouse-keepers-code",
    order: 9,
    sceneText:
      "Hale's final entry reads: \"she shows herself again only on the lowest tide of the lowest cycle, which the old keepers reckoned comes every 14th cycle. Today marks cycle number 51 since he started counting.\"",
    puzzle: "Is cycle 51 one of those special low cycles — that is, is 51 evenly divisible by 14?",
    choices: [
      "No — the next multiple of 14 is cycle 56, five cycles away",
      "Yes — 51 is a multiple of 14",
      "No — cycle 42 was the special one, so we're already 9 cycles late",
      "It's impossible to know without a calendar",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"Find the nearest multiples of 14 on either side of 51,\" you tell Finch. \"14 times 3 is 42, and 14 times 4 is 56. 51 sits between those — which one is still ahead of us?\"",
    solvedBeat:
      "56 is the next multiple of 14 after 51 — five cycles still to wait. \"Patience was half of Hale's whole trade,\" Finch sighs, marking the date. — Checking divisibility is just asking whether a remainder is exactly zero, and finding the *next* multiple means rounding forward, not backward.",
    concept: "Divisibility & Remainders",
  },
  {
    id: "light-10",
    storyId: "lighthouse-keepers-code",
    order: 10,
    sceneText:
      "Standing atop the lighthouse, Finch sights the wreck site at one bearing. Walking 200 meters along the shore to a second marker post Hale himself once built, she sights the very same wreck site again — this time at a different bearing entirely.",
    puzzle: "Two different bearings to the same fixed point, taken from two different known locations, are enough to do what?",
    choices: [
      "Pinpoint the exact location of the point by triangulation",
      "Only tell you the point's general direction, not its distance",
      "Tell you nothing more than either bearing alone would",
      "Only work if both locations are exactly the same distance from the point",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"Picture each bearing as a straight line drawn out from where you're standing,\" you tell Finch. \"Two different lines, from two different points, that both pass through the same target — where can two straight lines like that possibly meet?\"",
    solvedBeat:
      "Exactly one point — wherever the two sighting lines cross. Finch marks both lines on Hale's old chart, and they meet cleanly over a shallow reef just offshore. — That's triangulation: two bearings from two known points is all it ever takes to fix an exact location, no distance measurement required at all.",
    concept: "Triangulation",
  },
];

// ======================================================================
// "The Cryptographer's Curse" — a wartime codebreaker's final message is
// a cipher nobody has cracked, in a bureau where her own breakthrough may
// have gotten her killed. Companion: Iris, a junior cryptanalyst. Cast:
// Ashworth (bureau chief), Lindqvist (a rival cryptographer), Reyes (a
// liaison officer), Okonkwo (a translator), and Pettigrew (the night
// cleaner).
// ======================================================================
const CRYPTOGRAPHER_CLUES: QuestClue[] = [
  {
    id: "crypto-1",
    storyId: "cryptographers-curse",
    order: 1,
    sceneText:
      "A scrap of coded text sits on Dr. Faraday's desk. Iris counts the letters: the symbol standing in for one particular letter appears twelve times — far more than any other symbol in the note.",
    puzzle: "In ordinary English text, which letter is normally the most frequent, and so the best first guess for what that overused symbol replaces?",
    choices: ["E", "Q", "Z", "X"],
    correctIndex: 0,
    wrongBeat:
      "\"Don't guess a rare letter,\" you tell Iris. \"A cipher's most common symbol is almost always standing in for whichever letter is most common in ordinary writing — and that's always E, by a wide margin.\"",
    solvedBeat:
      "E. You substitute it in, and three other words on the page suddenly look like real English. — Frequency analysis is exactly this: using how often each symbol appears to guess what it's really hiding, before you've broken anything else about the cipher at all.",
    concept: "Frequency Analysis",
  },
  {
    id: "crypto-2",
    storyId: "cryptographers-curse",
    order: 2,
    sceneText:
      "Today's shift key, per the office's own duty log, is 7. An intercepted letter reads 'B' — the second letter of the alphabet.",
    puzzle: "Shifting 'B' forward by 7 positions, wrapping from Z back around to A if needed, what letter does it become?",
    choices: ["I", "H", "J", "C"],
    correctIndex: 0,
    wrongBeat: "\"Count the positions out loud from B,\" you tell Iris. \"B is 2. Add 7 to get 9. The 9th letter of the alphabet is your answer.\"",
    solvedBeat:
      "B (2) plus 7 is 9, which is I. \"So the message really does start mid-word,\" Iris says, re-reading the shifted line. — A shift cipher is modular arithmetic wearing a trench coat: numbers wrapping around a fixed alphabet instead of a clock face.",
    concept: "Modular Arithmetic (Shift Ciphers)",
  },
  {
    id: "crypto-3",
    storyId: "cryptographers-curse",
    order: 3,
    sceneText:
      "Faraday's one-time pad adds a secret number to each letter's position (A=0 through Z=25), then wraps the result around mod 26. Today's pad value is 15. The coded letter came out numbered 3.",
    puzzle: "What was the original letter's number before the pad of 15 was added, given that 3 = (original + 15) mod 26?",
    choices: ["14 (the letter O)", "18 (the letter S)", "12 (the letter M)", "3 (the letter D)"],
    correctIndex: 0,
    wrongBeat:
      "\"Undo the addition first,\" you tell Iris. \"3 minus 15 is negative — when that happens, add 26 back on before you read off the letter.\"",
    solvedBeat:
      "3 − 15 = −12, and −12 + 26 = 14, which is O. \"The original word was hiding right there the whole time,\" Iris says. — Reversing modular addition just means undoing the wraparound the same careful way it was created.",
    concept: "Modular Arithmetic (Subtraction)",
  },
  {
    id: "crypto-4",
    storyId: "cryptographers-curse",
    order: 4,
    sceneText:
      "The office safe's combination is recorded only as a riddle: \"the two prime factors of 391, larger one first.\"",
    puzzle: "What are the two prime factors of 391, larger first?",
    choices: ["23, then 17", "17, then 23", "19, then 21", "13, then 30"],
    correctIndex: 0,
    wrongBeat: "\"Test small primes against 391 one at a time,\" you tell Iris. \"It won't split evenly by 2, 3, 5, 7, or 11 — but keep going, it does split evenly somewhere.\"",
    solvedBeat:
      "391 = 17 × 23 — the safe clicks open on 23, then 17. Inside: a folder of Faraday's own recent breakthrough notes, dated just days before she died. — Breaking a number down into the primes that build it is factorization, the same idea a lock combination just borrowed for its own purposes.",
    concept: "Prime Factorization",
  },
  {
    id: "crypto-5",
    storyId: "cryptographers-curse",
    order: 5,
    sceneText:
      "Lindqvist scoffs, looking over your shoulder at a simple substitution cipher. \"There are 26 letters, so there are 26 factorial possible keys,\" he says. \"Far too many to ever try by hand.\"",
    puzzle: "Which of these best describes what computing \"26 factorial\" (26!) actually means and produces?",
    choices: [
      "26 × 25 × 24 × … × 2 × 1, an astronomically large number",
      "26 × 26, a fairly modest number",
      "26 + 25 + 24 + … + 1, a few hundred",
      "Just 26 — 'factorial' simply means the number itself",
    ],
    correctIndex: 0,
    wrongBeat: "\"Factorial means multiplying the number by every whole number smaller than it, all the way down to 1,\" you tell Iris. \"Not adding them, and not just squaring it.\"",
    solvedBeat:
      "26 × 25 × 24 × … × 1 — a number with over 26 digits. \"No wonder no one's ever brute-forced this by hand,\" Iris breathes. — A factorial counts every possible ordering of a full set, and it grows almost unimaginably fast once the set gets past a couple dozen items.",
    concept: "Factorials",
  },
  {
    id: "crypto-6",
    storyId: "cryptographers-curse",
    order: 6,
    sceneText:
      "A suspect's dead-drop schedule, recovered from a wastebasket: \"every 9th day, starting from day 2.\" Today is day 47 since the schedule's own starting point.",
    puzzle: "Is today one of the scheduled dead-drop days?",
    choices: [
      "Yes — 47 leaves a remainder of 2 when divided by 9, matching the day-2 pattern",
      "No — 47 isn't anywhere near a multiple of 9",
      "Yes, but only because 47 happens to be prime",
      "No — the schedule resets at the start of every calendar month",
    ],
    correctIndex: 0,
    wrongBeat: "\"Divide 47 by 9 and look only at the remainder,\" you tell Iris. \"The schedule cares about that remainder matching 2 — not the number 47 itself.\"",
    solvedBeat:
      "47 = 9×5 + 2 — a remainder of exactly 2, matching the pattern precisely. \"Today is a drop day,\" you say. \"Which means whoever this schedule belongs to is active right now, tonight.\" — Checking a fixed remainder against a repeating cycle is exactly what modular arithmetic was built to answer.",
    concept: "Modular Arithmetic (Remainders)",
  },
  {
    id: "crypto-7",
    storyId: "cryptographers-curse",
    order: 7,
    sceneText:
      "A row of digits in Faraday's own notebook: 1 0 1 1 0, followed by a blank space for one final digit — the office's own simple error-check, meant to make the total count of 1s always come out even.",
    puzzle: "What should that final missing digit be?",
    choices: ["1", "0", "Either digit works equally well", "It depends on the message's length"],
    correctIndex: 0,
    wrongBeat: "\"Count the 1s you already have first,\" you tell Iris. \"1, 0, 1, 1, 0 — how many 1s is that, and is it currently odd or even?\"",
    solvedBeat:
      "Three 1s so far — odd. Adding one more 1 brings the total to four, an even count. \"So the check digit is a 1,\" you say, filling it in. — That's a parity check: one extra digit, chosen only to make a count come out even, catching simple transmission errors for free.",
    concept: "Parity & Error-Checking",
  },
  {
    id: "crypto-8",
    storyId: "cryptographers-curse",
    order: 8,
    sceneText:
      "Faraday's personal key-generator, scrawled in a margin: start at 2, then triple the previous number and subtract 1 each time — 2, 5, 14, 41, ...",
    puzzle: "Following that same rule, what's the next number in Faraday's sequence?",
    choices: ["122", "123", "120", "125"],
    correctIndex: 0,
    wrongBeat: "\"Apply the rule exactly as written,\" you tell Iris. \"Triple 41 first, then subtract 1 — don't subtract before you triple.\"",
    solvedBeat:
      "41 × 3 = 123, minus 1 is 122. \"A private formula, not a memorized list,\" you say. \"Easy for her to regenerate, and nearly impossible for anyone else to guess.\" — A recurrence relation like this defines every new term purely from the one before it, which is exactly what makes it easy to rebuild and hard to reverse-engineer.",
    concept: "Recurrence Relations",
  },
  {
    id: "crypto-9",
    storyId: "cryptographers-curse",
    order: 9,
    sceneText:
      "A book from Faraday's shelf, *Principles of Naval Signaling*, feels suspiciously light in your hand: 340 grams, against a genuine copy's listed weight of 400 grams.",
    puzzle: "What fraction of its proper weight is this copy missing?",
    choices: ["3/20", "1/4", "1/6", "2/5"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual gap in grams first,\" you tell Iris. \"400 minus 340. Then reduce that gap over the full 400 grams down to its simplest fraction.\"",
    solvedBeat:
      "400 − 340 = 60, and 60/400 reduces to 3/20. Prying open the spine, you find a hollow just large enough for a strip of microfilm — long since removed. — A fraction only means something once it's been reduced down to its simplest, most honest form.",
    concept: "Fractions",
  },
  {
    id: "crypto-10",
    storyId: "cryptographers-curse",
    order: 10,
    sceneText:
      "The code room's own access log uses a 3-digit code with no repeated digits, chosen from 1 through 9. Faraday's final note adds one more constraint: \"the culprit's code begins with an odd digit.\"",
    puzzle: "Given codes must use 3 different digits from 1–9 with no repeats, and the first digit must be odd, how many such codes are possible in total?",
    choices: ["280", "120", "504", "45"],
    correctIndex: 0,
    wrongBeat:
      "\"Count each position separately, in order,\" you tell Iris. \"Five choices for the first digit, since it must be odd. Then eight digits remain for the second position, and seven for the third. Multiply those three counts together.\"",
    solvedBeat:
      "5 × 8 × 7 = 280 possible codes. \"Not narrow enough on its own,\" you admit, \"but the access mechanism's own memory recorded the exact code used that night — and only one staff personnel number matches it precisely.\" — That's the counting principle: multiplying the choices available at each step, in order, to count every possibility at once.",
    concept: "The Counting Principle",
  },
];

// ======================================================================
// "The Sky Chart Expedition" — an ancient astronomer-priest civilization
// left a star chart pointing to a hidden cache, readable only by whoever
// reads the sky exactly the way they did. Companion: Amara, an astronomer.
// ======================================================================
const SKY_CHART_CLUES: QuestClue[] = [
  {
    id: "sky-1",
    storyId: "sky-chart-expedition",
    order: 1,
    sceneText:
      "Amara points out two stars on the ancient chart: one marked at magnitude 1, the other at magnitude 6. \"Each single step up in magnitude,\" she says, \"means the star is about two-and-a-half times dimmer than the last.\"",
    puzzle: "Roughly how much dimmer is the magnitude-6 star than the magnitude-1 star, five steps apart?",
    choices: [
      "Roughly 100 times dimmer",
      "Roughly 12.5 times dimmer (5 × 2.5)",
      "Roughly 2.5 times dimmer",
      "Exactly the same brightness",
    ],
    correctIndex: 0,
    wrongBeat:
      "\"Each step multiplies the dimming again — it doesn't just add another 2.5,\" Amara says. \"Five steps means 2.5 multiplied by itself five times over, not five lots of 2.5 added up.\"",
    solvedBeat:
      "2.5 multiplied by itself five times comes out close to 100 — the magnitude-6 star really is roughly a hundred times dimmer. \"The old star-watchers built a whole scale around exactly this kind of repeated multiplying,\" Amara says. — That's a logarithmic scale: equal-looking steps that actually represent repeated multiplication, not repeated addition.",
    concept: "Logarithmic Scales (Star Magnitude)",
  },
  {
    id: "sky-2",
    storyId: "sky-chart-expedition",
    order: 2,
    sceneText:
      "The chart notes that a certain star rises exactly at midnight once a year — but the old calendar drifts, so that same star rises 6 hours later each following year, on the same recorded calendar date.",
    puzzle: "How many years will it take for that 6-hour-per-year drift to accumulate into a full 24-hour realignment?",
    choices: ["4 years", "6 years", "24 years", "8 years"],
    correctIndex: 0,
    wrongBeat: "\"Divide the full drift you need by how much it moves each year,\" Amara says. \"24 hours total, divided by 6 hours per year.\"",
    solvedBeat:
      "24 ÷ 6 = 4 years exactly. \"So the chart's dates repeat their true meaning every four years,\" Amara says, flipping to a section you'd both skipped past. — Dividing a total by a fixed rate is the plain arithmetic underneath any calendar's drift and correction.",
    concept: "Division & Rates",
  },
  {
    id: "sky-3",
    storyId: "sky-chart-expedition",
    order: 3,
    sceneText:
      "A triangle formed by three bright, chart-marked stars has two of its three angles measured precisely: 55° and 65°.",
    puzzle: "What must the third angle of that star-triangle be?",
    choices: ["60°", "55°", "65°", "70°"],
    correctIndex: 0,
    wrongBeat: "\"All three angles of any triangle add up to exactly 180°, without exception,\" Amara reminds you. \"Add the two you know, then subtract from 180.\"",
    solvedBeat:
      "55° + 65° = 120°, and 180° − 120° = 60°. The third angle is 60° exactly — and the chart's next marking sits precisely along that angle's own sightline. — A triangle's angles summing to 180° is one of the oldest, most reliable facts geometry ever proved.",
    concept: "Triangle Angle Sum",
  },
  {
    id: "sky-4",
    storyId: "sky-chart-expedition",
    order: 4,
    sceneText:
      "The chart marks two \"wandering stars\" — planets, in modern terms — one completing its circuit around the sky in 12 units of the old calendar's time, the other in 30.",
    puzzle: "In simplest form, what's the ratio of the first planet's period to the second's?",
    choices: ["2:5", "1:3", "3:5", "12:30, since it can't be simplified"],
    correctIndex: 0,
    wrongBeat: "\"Find the largest number that divides evenly into both 12 and 30 first,\" Amara says. \"Divide both sides of the ratio by that same number.\"",
    solvedBeat:
      "Both 12 and 30 divide evenly by 6, leaving 2:5 in simplest form. \"A clean ratio like that is never an accident on this chart,\" Amara says. — Reducing a ratio to its simplest form just means dividing both sides by whatever they genuinely share.",
    concept: "Simplifying Ratios",
  },
  {
    id: "sky-5",
    storyId: "sky-chart-expedition",
    order: 5,
    sceneText:
      "A constellation on the chart is drawn as a triangular field of dots, growing row by row: 1, then 3, then 6, then 10, then 15 dots total.",
    puzzle: "Following that same triangular growth, how many dots would the next row's total be?",
    choices: ["21", "20", "18", "25"],
    correctIndex: 0,
    wrongBeat: "\"Look at how much each total grows by, not the totals themselves,\" Amara says. \"2, then 3, then 4, then 5 more each time — so the next jump should be one more than the last.\"",
    solvedBeat:
      "The growth steps are 2, 3, 4, 5, and next comes 6 — so 15 + 6 = 21. \"These are triangular numbers,\" Amara says, \"the same shape as stacking cannonballs into a pyramid, just flattened into dots on old parchment.\" — Each triangular number is simply the sum of all counting numbers up to that point.",
    concept: "Triangular Numbers",
  },
  {
    id: "sky-6",
    storyId: "sky-chart-expedition",
    order: 6,
    sceneText:
      "Amara's modern telescope has a 10-centimeter lens; the expedition's larger backup scope has a 20-centimeter lens. \"Light-gathering power,\" she explains, \"scales with the square of the lens diameter, not the diameter itself.\"",
    puzzle: "How many times more light does the 20-centimeter lens gather compared to the 10-centimeter one?",
    choices: ["4 times as much", "2 times as much", "8 times as much", "16 times as much"],
    correctIndex: 0,
    wrongBeat: "\"Double the diameter, then square that doubling — don't just double the light-gathering power to match,\" Amara says. \"(20/10)² is not the same as 20/10.\"",
    solvedBeat:
      "(20/10)² = 2² = 4 — exactly four times the light-gathering power for only double the diameter. \"Which is exactly why astronomers fight so hard over a few extra centimeters of lens,\" Amara says, switching scopes. — A quantity that scales with the square of another grows far faster than the underlying measurement itself.",
    concept: "Squares & Proportional Scaling",
  },
  {
    id: "sky-7",
    storyId: "sky-chart-expedition",
    order: 7,
    sceneText:
      "Four separate expeditions, decades apart, each measured this same peak's height differently: 1,200 meters, 1,180 meters, 1,220 meters, and 1,160 meters.",
    puzzle: "What's the average of these four readings?",
    choices: ["1,190 meters", "1,200 meters", "1,180 meters", "1,210 meters"],
    correctIndex: 0,
    wrongBeat: "\"Add all four readings together first, then divide by how many readings there are,\" Amara says. \"Four separate measurements means dividing by 4 at the end, not by 2 or 3.\"",
    solvedBeat:
      "1,200 + 1,180 + 1,220 + 1,160 = 4,760, and 4,760 ÷ 4 = 1,190 meters. \"Close enough to trust the old chart's own elevation marking,\" Amara says. — Averaging several imperfect measurements is exactly how you settle on the most trustworthy single estimate.",
    concept: "Averages",
  },
  {
    id: "sky-8",
    storyId: "sky-chart-expedition",
    order: 8,
    sceneText:
      "Historical weather records for this altitude show clear night skies on 21 of the last 30 nights.",
    puzzle: "As a simplified fraction, what does this record suggest is the probability of a clear night here?",
    choices: ["7/10", "21/30, which can't be simplified further", "3/10", "2/3"],
    correctIndex: 0,
    wrongBeat: "\"Find what 21 and 30 both share as a factor before you call it simplified,\" Amara says. \"They both divide evenly by 3.\"",
    solvedBeat:
      "21/30 divides down to 7/10 once you factor out the shared 3. \"Good odds for tonight, then,\" Amara says, checking the sky. — A probability estimated from real records is really just a fraction, and it's only genuinely useful once it's reduced to its simplest, clearest form.",
    concept: "Simplifying Fractions & Probability",
  },
  {
    id: "sky-9",
    storyId: "sky-chart-expedition",
    order: 9,
    sceneText:
      "The chart marks the cache's exact bearing using the astronomer-priests' own number system — base 60, not base 10, the same system that later gave the world 60 minutes in an hour and 360 degrees in a circle. Their mark reads: \"2, 15,\" meaning 2 full groups of sixty, plus 15 more.",
    puzzle: "What single ordinary (base-10) number does \"2, 15\" represent in base 60?",
    choices: ["135", "215", "60", "120"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the first group by 60 first,\" Amara says. \"2 groups of 60, then add the 15 leftover — don't just read the digits side by side like a base-10 number.\"",
    solvedBeat:
      "2 × 60 + 15 = 135. \"They were counting in sixties long before anyone drew a clock face,\" Amara says, turning the sighting instrument to exactly that bearing. — Any place-value system works the same way, whether it groups by tens, or by the sixty the sky-watchers happened to prefer.",
    concept: "Base-60 (Sexagesimal) Numbers",
  },
  {
    id: "sky-10",
    storyId: "sky-chart-expedition",
    order: 10,
    sceneText:
      "The chart itself is drawn to scale: 1 chart-unit represents 500 real paces on the ground. The cache's own mark sits 3.4 chart-units from your current camp.",
    puzzle: "How many real paces away from camp is the cache?",
    choices: ["1,700 paces", "1,500 paces", "1,900 paces", "170 paces"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the chart-distance by the scale factor,\" Amara says. \"3.4 times 500 — don't round the 3.4 down to 3 first.\"",
    solvedBeat:
      "3.4 × 500 = 1,700 paces exactly. Amara paces it off herself, counting under her breath, and stops at a shallow depression in the rock exactly on schedule. — A map's scale is just a ratio, and applying it is nothing more than a single multiplication once you trust the number.",
    concept: "Scale & Proportion",
  },
];

export function cluesForStory(storyId: string): QuestClue[] {
  return [...QUEST_CLUES, ...STATISTICIAN_CLUES, ...PIRATES_COVE_CLUES, ...CHESSBOARD_CLUES, ...LIGHTHOUSE_CLUES, ...CRYPTOGRAPHER_CLUES, ...SKY_CHART_CLUES]
    .filter((c) => c.storyId === storyId)
    .sort((a, b) => a.order - b.order);
}
