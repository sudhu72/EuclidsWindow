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

export function cluesForStory(storyId: string): QuestClue[] {
  return [...QUEST_CLUES, ...STATISTICIAN_CLUES, ...PIRATES_COVE_CLUES]
    .filter((c) => c.storyId === storyId)
    .sort((a, b) => a.order - b.order);
}
