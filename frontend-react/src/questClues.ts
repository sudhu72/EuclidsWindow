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

const CLOCKMAKER_CLUES: QuestClue[] = [
  {
    id: "clock-1",
    storyId: "clockmakers-secret",
    order: 1,
    sceneText:
      "On the workbench, two meshed gears sit mid-turn: the driver has 40 teeth, the smaller driven gear has 10 teeth.",
    puzzle: "If the driver gear completes one full turn, how many full turns does the smaller driven gear make?",
    choices: ["4 turns", "10 turns", "40 turns", "1/4 turn"],
    correctIndex: 0,
    wrongBeat: "\"Compare the teeth counts as a ratio,\" you tell Wren. \"Divide the driver's teeth by the driven gear's teeth — not the other way around.\"",
    solvedBeat:
      "40 ÷ 10 = 4 — the smaller gear spins four full times for every one turn of the larger one. Wren notes it down carefully. — A gear ratio is simply the ratio of two teeth counts, and it always trades speed for size in exact proportion.",
    concept: "Gear Ratios",
  },
  {
    id: "clock-2",
    storyId: "clockmakers-secret",
    order: 2,
    sceneText:
      "Thorne scratched a tiny mark on two gears deep in his private message-train: one with 12 teeth, one with 18 teeth. Both marks point straight up right now, at the same moment.",
    puzzle: "How many teeth need to pass before both marks point straight up again at the same time?",
    choices: ["36 teeth", "12 teeth", "18 teeth", "216 teeth"],
    correctIndex: 0,
    wrongBeat: "\"Don't just multiply the two counts together,\" you tell Wren. \"Find the smallest number that 12 and 18 both divide into evenly.\"",
    solvedBeat:
      "The least common multiple of 12 and 18 is 36 — after 36 teeth pass, both marks realign. \"So the message repeats on a fixed cycle,\" Wren says. — That's exactly what a least common multiple measures: the first point where two repeating patterns line back up together.",
    concept: "Least Common Multiple",
  },
  {
    id: "clock-3",
    storyId: "clockmakers-secret",
    order: 3,
    sceneText:
      "The Sentinel's escapement gear ticks once every 2 seconds, exactly, and has done so without fail for thirty years.",
    puzzle: "How many full ticks does it make in one hour (3,600 seconds)?",
    choices: ["1,800 ticks", "3,600 ticks", "900 ticks", "7,200 ticks"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total seconds by the seconds each tick takes,\" you tell Wren. \"Don't multiply the two together.\"",
    solvedBeat:
      "3,600 ÷ 2 = 1,800 ticks every hour. \"Which means I can time exactly how long he'd been gone,\" Wren says, counting the ticks since the workshop was last seen occupied. — Turning a repeating rate into a total count is just dividing the whole span by the length of one cycle.",
    concept: "Rate Conversion",
  },
  {
    id: "clock-4",
    storyId: "clockmakers-secret",
    order: 4,
    sceneText:
      "The Sentinel's minute hand measures 20 centimeters from center to tip.",
    puzzle: "Using circumference = 2πr, roughly how far (to the nearest centimeter) does the tip travel in one full revolution?",
    choices: ["about 126 cm", "about 63 cm", "about 40 cm", "about 400 cm"],
    correctIndex: 0,
    wrongBeat: "\"Circumference is 2 times π times the radius,\" you tell Wren, \"not π times the radius alone, and not the radius squared.\"",
    solvedBeat:
      "2 × π × 20 ≈ 125.7, so about 126 centimeters every single hour. \"An entire meter, near enough, every sixty minutes,\" Wren says, tracing the sweep with a finger. — Circumference is exactly the distance around a full circle, once around, however large that circle is.",
    concept: "Circumference",
  },
  {
    id: "clock-5",
    storyId: "clockmakers-secret",
    order: 5,
    sceneText:
      "The message-train links three gears in sequence: the first drives the second at a ratio of 1 to 3, and the second drives the third at a ratio of 1 to 2.",
    puzzle: "Overall, for every 1 turn of the first gear, how many turns does the third gear make?",
    choices: ["6 turns", "5 turns", "3.5 turns", "2 turns"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the two ratios together in sequence,\" you tell Wren. \"Don't add them — a chain of gears compounds, it doesn't accumulate.\"",
    solvedBeat:
      "3 × 2 = 6 — the last gear spins six times for every single turn of the first. \"That's the multiplier on his whole message,\" Wren says. — Chaining gear ratios through a train means multiplying each stage together, one after another.",
    concept: "Compound Ratios",
  },
  {
    id: "clock-6",
    storyId: "clockmakers-secret",
    order: 6,
    sceneText:
      "The Sentinel's secret inner dial currently reads 9. A gear ratio carved into the case adds exactly 29 hours to whatever the dial shows.",
    puzzle: "Since the dial only runs 1 through 12 before wrapping back around, what hour will it show after those 29 hours pass?",
    choices: ["2 o'clock", "5 o'clock", "9 o'clock", "11 o'clock"],
    correctIndex: 0,
    wrongBeat: "\"Add the hours first,\" you tell Wren, \"then divide by 12 and keep only the remainder — that remainder is the hour the dial actually lands on.\"",
    solvedBeat:
      "9 + 29 = 38, and 38 divided by 12 leaves a remainder of 2 — the dial lands on 2 o'clock. — A 12-hour clock face is modular arithmetic in disguise, wrapping back around every twelve counts.",
    concept: "Modular Arithmetic (Clock Arithmetic)",
  },
  {
    id: "clock-7",
    storyId: "clockmakers-secret",
    order: 7,
    sceneText:
      "A miniature brass model of the Sentinel sits on a shelf, built to exactly 1/8th the size of the real clock in every dimension. The model's pendulum measures 6 centimeters.",
    puzzle: "How long is the real Sentinel's actual pendulum?",
    choices: ["48 cm", "14 cm", "0.75 cm", "56 cm"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the model's measurement by the scale factor,\" you tell Wren. \"The real one is larger, so don't divide.\"",
    solvedBeat:
      "6 × 8 = 48 centimeters, full scale. \"Exactly what's swinging in the corner right now,\" Wren says. — Scaling a model up or down means multiplying every one of its measurements by the very same factor.",
    concept: "Scale & Proportion",
  },
  {
    id: "clock-8",
    storyId: "clockmakers-secret",
    order: 8,
    sceneText:
      "A row of tiny brass numerals is stamped inside the case, meant to be read in order: 3, 7, 11, 15, ...",
    puzzle: "What's the next number in Thorne's stamped sequence?",
    choices: ["19", "18", "21", "23"],
    correctIndex: 0,
    wrongBeat: "\"Find the constant gap between each number and the one before it,\" you tell Wren, \"then add that same gap once more to the last one.\"",
    solvedBeat:
      "Each term is 4 more than the last, so 15 + 4 = 19. \"He never once broke his own pattern,\" Wren says. — A sequence with the same fixed gap at every step is called an arithmetic sequence.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "clock-9",
    storyId: "clockmakers-secret",
    order: 9,
    sceneText:
      "Thorne's own ledger shows a shared workshop account that should hold £1,200. The actual balance on hand is only £900.",
    puzzle: "What percentage of the expected £1,200 is missing?",
    choices: ["25%", "20%", "30%", "75%"],
    correctIndex: 0,
    wrongBeat: "\"Find the missing amount first,\" you tell Wren, \"expected minus actual — then divide that gap by the expected total.\"",
    solvedBeat:
      "£1,200 − £900 = £300 missing, and 300 ÷ 1,200 = 25%. \"A quarter of the account, gone,\" Wren says quietly. — A percentage is just a fraction of the whole, rescaled so it's measured out of a hundred.",
    concept: "Percentages",
  },
  {
    id: "clock-10",
    storyId: "clockmakers-secret",
    order: 10,
    sceneText:
      "The Sentinel's hidden drawer only opens if four specific gears — already set aside on the bench — are inserted in exactly the right order, one at a time, with no repeats.",
    puzzle: "How many different orderings of those same four gears are possible in total?",
    choices: ["24", "16", "12", "4"],
    correctIndex: 0,
    wrongBeat: "\"Count the choices at each position, in order,\" you tell Wren. \"Four for the first slot, then three left, then two, then one — multiply them together.\"",
    solvedBeat:
      "4 × 3 × 2 × 1 = 24 possible orderings. Wren tries them one at a time, and on the ninth attempt, the drawer clicks free. — That's a factorial: every distinct ordering of a full set, found by shrinking the choices by one at each step.",
    concept: "Permutations (Factorial Counting)",
  },
];

const PHARAOH_CLUES: QuestClue[] = [
  {
    id: "pharaoh-1",
    storyId: "pharaohs-vault",
    order: 1,
    sceneText:
      "Nadia's own measurements: the pyramid's vertical height is 120 meters, and half of the square base runs 90 meters, corner to center-line.",
    puzzle: "Using the Pythagorean theorem, what's the slant height running up the middle of each face, from base to apex?",
    choices: ["150 meters", "210 meters", "30 meters", "180 meters"],
    correctIndex: 0,
    wrongBeat: "\"Square both numbers, add them together, then take the square root of that sum,\" Nadia says. \"Don't just add 120 and 90 directly.\"",
    solvedBeat:
      "120² + 90² = 14,400 + 8,100 = 22,500, and the square root of 22,500 is exactly 150. \"A clean number,\" Nadia says. \"They wouldn't have built it any other way.\" — The Pythagorean theorem turns two straight measurements into the length of the diagonal connecting them.",
    concept: "Pythagorean Theorem",
  },
  {
    id: "pharaoh-2",
    storyId: "pharaohs-vault",
    order: 2,
    sceneText:
      "An inscription divides the treasury's expected wealth using only unit fractions — the builders' preferred way of writing any fraction, with a numerator of exactly 1. It reads: \"one part in two, and one part in three.\"",
    puzzle: "Added together, what single ordinary fraction do \"one-half\" and \"one-third\" equal?",
    choices: ["5/6", "2/5", "1/6", "3/5"],
    correctIndex: 0,
    wrongBeat: "\"Give both fractions a common denominator before adding them,\" Nadia says. \"Sixths work for both a half and a third.\"",
    solvedBeat:
      "1/2 = 3/6 and 1/3 = 2/6, so together that's 5/6. \"Never a fraction with any numerator but one,\" Nadia says. \"Every other fraction, they simply built out of these.\" — Writing a fraction as a sum of distinct unit fractions is exactly how the real builders of ancient Egypt recorded their arithmetic.",
    concept: "Egyptian Unit Fractions",
  },
  {
    id: "pharaoh-3",
    storyId: "pharaohs-vault",
    order: 3,
    sceneText:
      "Nadia plants a 2-meter stick upright in the sand; it casts a shadow exactly 3 meters long. At the very same moment, the pyramid's own shadow stretches a measured 180 meters from its base.",
    puzzle: "Using the stick's own height-to-shadow ratio, how tall must the pyramid be?",
    choices: ["120 meters", "270 meters", "90 meters", "135 meters"],
    correctIndex: 0,
    wrongBeat: "\"Set up the stick's height-to-shadow ratio first,\" Nadia says, \"then apply that exact same ratio to the pyramid's own shadow length.\"",
    solvedBeat:
      "The stick's ratio is 2 to 3, and 180 × (2/3) = 120 meters — matching Nadia's own measurement exactly. \"Two completely different methods, one answer,\" she says. \"That's how you know you can trust it.\" — Similar triangles cast by the same sun at the same moment always share the same height-to-shadow ratio, however large one triangle is next to the other.",
    concept: "Similar Triangles (Shadow-Stick Method)",
  },
  {
    id: "pharaoh-4",
    storyId: "pharaohs-vault",
    order: 4,
    sceneText:
      "Each triangular face of the pyramid runs 180 meters along its base, rising 150 meters along the slant to the apex.",
    puzzle: "What's the area of just one triangular face?",
    choices: ["13,500 square meters", "27,000 square meters", "5,400 square meters", "33,000 square meters"],
    correctIndex: 0,
    wrongBeat: "\"Area of a triangle is one-half times base times height,\" Nadia says. \"Don't forget to halve the product.\"",
    solvedBeat:
      "½ × 180 × 150 = 13,500 square meters, for just one of the four faces. \"Imagine facing that in solid limestone,\" Nadia says. — A triangle's area is always half of its base times its height, no matter how large the triangle is.",
    concept: "Area of a Triangle",
  },
  {
    id: "pharaoh-5",
    storyId: "pharaohs-vault",
    order: 5,
    sceneText:
      "The pyramid's square base measures 180 meters on each side; its full height is 120 meters.",
    puzzle: "Using volume = one-third times base area times height, what's the pyramid's total volume?",
    choices: ["1,296,000 cubic meters", "3,888,000 cubic meters", "2,160,000 cubic meters", "648,000 cubic meters"],
    correctIndex: 0,
    wrongBeat: "\"Find the square base's area first — side times side,\" Nadia says, \"multiply by the height, then divide that whole product by 3. Don't skip the one-third.\"",
    solvedBeat:
      "180 × 180 = 32,400 square meters of base, times 120 meters of height, divided by 3, comes to 1,296,000 cubic meters. \"An enormous number for an enormous secret,\" Nadia says. — A pyramid always holds exactly one-third the volume of a rectangular box built to the very same base and height.",
    concept: "Volume of a Pyramid",
  },
  {
    id: "pharaoh-6",
    storyId: "pharaohs-vault",
    order: 6,
    sceneText:
      "A ceremonial doorway is carved so its full height divided by its width comes out to almost exactly 1.618 — a proportion Nadia has seen carved into doorways across three different sites.",
    puzzle: "If the doorway's width is 100 centimeters, roughly how tall is it, using that same 1.618 ratio?",
    choices: ["about 162 cm", "about 200 cm", "about 118 cm", "about 262 cm"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the width by the ratio itself,\" Nadia says. \"Don't just tack the ratio's digits onto the width.\"",
    solvedBeat:
      "100 × 1.618 ≈ 162 centimeters. \"The golden ratio,\" Nadia says. \"Turns up again and again in what these builders considered beautiful — and, more usefully for us, in what they considered worth building precisely.\" — That ratio, roughly 1.618, is the proportion where a whole divided by its larger part equals that larger part divided by the smaller.",
    concept: "The Golden Ratio",
  },
  {
    id: "pharaoh-7",
    storyId: "pharaohs-vault",
    order: 7,
    sceneText:
      "Nadia's team estimates the pyramid's outer limestone casing, mostly stripped away by centuries of scavenging, once added a full 15 meters to the current height of 120 meters.",
    puzzle: "As a percentage of the pyramid's current height, how much extra height has been lost?",
    choices: ["12.5%", "15%", "20%", "8%"],
    correctIndex: 0,
    wrongBeat: "\"Divide the lost amount by the current height,\" Nadia says, \"then convert that fraction into a percentage.\"",
    solvedBeat:
      "15 ÷ 120 = 0.125, or 12.5%. \"Smaller than people assume,\" Nadia says, \"but it's exactly why the old drawings never quite match what's standing today.\" — A percentage is simply a fraction of some whole, rescaled so it's measured out of a hundred.",
    concept: "Percentages",
  },
  {
    id: "pharaoh-8",
    storyId: "pharaohs-vault",
    order: 8,
    sceneText:
      "A corridor wall carries a row of carved numerals, evenly spaced apart: 5, 9, 13, 17, ...",
    puzzle: "What number comes next in that same carved sequence?",
    choices: ["21", "19", "20", "25"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each number and the one before it,\" Nadia says, \"then add that same gap once more to the last number.\"",
    solvedBeat:
      "Each number is 4 more than the last, so 17 + 4 = 21. \"Consistent, like everything else they built,\" Nadia says. — A sequence that adds the very same amount every step is an arithmetic sequence, and its next term is never a guess.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "pharaoh-9",
    storyId: "pharaohs-vault",
    order: 9,
    sceneText:
      "To check the base is still square and true after centuries of shifting sand, Nadia needs a measuring rope cut to fit exactly around all four sides, each running 180 meters.",
    puzzle: "How long a rope does she need to go all the way around the base once?",
    choices: ["720 meters", "360 meters", "180 meters", "900 meters"],
    correctIndex: 0,
    wrongBeat: "\"Add up all four equal sides,\" Nadia says, \"or just multiply one side's length by four.\"",
    solvedBeat:
      "4 × 180 = 720 meters of rope, and it fits with nothing left over. \"Still square, after all this time,\" Nadia says, clearly relieved. — A perimeter is just the total distance around a shape's outer edge, all sides added together.",
    concept: "Perimeter",
  },
  {
    id: "pharaoh-10",
    storyId: "pharaohs-vault",
    order: 10,
    sceneText:
      "The final vault door has no lock at all — only a dial marked with two empty slots, and an inscription: \"the base, and the height, reduced to their simplest terms.\"",
    puzzle: "Using the pyramid's own base of 180 meters and height of 120 meters, what's that ratio reduced to its simplest form?",
    choices: ["3 : 2", "180 : 120, since it can't be reduced further", "9 : 6", "6 : 4"],
    correctIndex: 0,
    wrongBeat: "\"Find the largest number that divides evenly into both 180 and 120,\" Nadia says, \"then divide both sides of the ratio by it.\"",
    solvedBeat:
      "Both 180 and 120 divide evenly by 60, leaving 3 : 2 in simplest form. Nadia turns the dial to 3, then 2, and something deep in the stone finally shifts. — A ratio is never truly simplified until it's been divided down by everything both sides genuinely share.",
    concept: "Simplifying Ratios",
  },
];

const CONSERVATORY_CLUES: QuestClue[] = [
  {
    id: "conservatory-1",
    storyId: "conservatory-killing",
    order: 1,
    sceneText:
      "Odile shows you Vale's own tuning notes: a string tuned to 220 Hz, and its octave tuned to exactly double that frequency.",
    puzzle: "What frequency is the octave string tuned to?",
    choices: ["440 Hz", "220 Hz", "330 Hz", "880 Hz"],
    correctIndex: 0,
    wrongBeat: "\"An octave is always exactly double the frequency below it,\" Odile says. \"Multiply — don't add a fixed amount.\"",
    solvedBeat:
      "220 × 2 = 440 Hz — concert pitch A, exactly. \"He tuned by the numbers, not by ear alone,\" Odile says. — An octave is defined by a frequency ratio of exactly 2 to 1, no matter which note you start from.",
    concept: "Ratios in Music (Octaves)",
  },
  {
    id: "conservatory-2",
    storyId: "conservatory-killing",
    order: 2,
    sceneText: "The score's final page is marked in an unusual time signature: 7 over 8.",
    puzzle: "In a measure marked 7/8, how many eighth-note beats does each measure actually contain?",
    choices: ["7 beats", "8 beats", "15 beats", "1 beat"],
    correctIndex: 0,
    wrongBeat: "\"The top number of a time signature tells you how many beats per measure,\" Odile says. \"The bottom number just says what kind of note counts as one beat.\"",
    solvedBeat:
      "7 eighth-note beats per measure — an odd, lopsided meter Vale clearly chose on purpose. — A time signature is really just a fraction: beats per measure over the note value that equals one beat.",
    concept: "Time Signatures as Fractions",
  },
  {
    id: "conservatory-3",
    storyId: "conservatory-killing",
    order: 3,
    sceneText: "Vale's metronome marking reads 96 beats per minute. The final passage runs exactly 144 beats long.",
    puzzle: "How many minutes does that passage take to perform, at that tempo?",
    choices: ["1.5 minutes", "2 minutes", "1 minute", "2.5 minutes"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total beats by the beats-per-minute rate,\" Odile says. \"Don't multiply them.\"",
    solvedBeat:
      "144 ÷ 96 = 1.5 minutes exactly. \"Ninety seconds,\" Odile says, checking it against the rehearsal clock. — Converting a beat count into real time is just dividing by the rate, the same as any other speed calculation.",
    concept: "Tempo & Duration",
  },
  {
    id: "conservatory-4",
    storyId: "conservatory-killing",
    order: 4,
    sceneText:
      "A fundamental note vibrates at 110 Hz. Vale's own notes list its overtone series: the second harmonic, the third, and so on, each a whole-number multiple of the fundamental.",
    puzzle: "What frequency is the fourth harmonic of a 110 Hz fundamental?",
    choices: ["440 Hz", "220 Hz", "330 Hz", "550 Hz"],
    correctIndex: 0,
    wrongBeat: "\"Each harmonic is a whole-number multiple of the fundamental,\" Odile says. \"The fourth harmonic means four times the fundamental frequency.\"",
    solvedBeat:
      "110 × 4 = 440 Hz. \"The same note as the octave-tuned string, from a completely different string,\" Odile says, startled. — The harmonic series is just the fundamental frequency multiplied by 1, 2, 3, 4, and onward, forever.",
    concept: "The Harmonic Series",
  },
  {
    id: "conservatory-5",
    storyId: "conservatory-killing",
    order: 5,
    sceneText:
      "A dotted quarter note lasts 1.5 beats. Vale's handwritten margin asks how many sixteenth notes — each worth 0.25 of a beat — fit into that same span.",
    puzzle: "How many sixteenth notes fit exactly into a dotted quarter note's 1.5 beats?",
    choices: ["6", "4", "3", "8"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total beat length by the length of a single sixteenth note,\" Odile says. \"Don't just guess from the numbers in front of you.\"",
    solvedBeat:
      "1.5 ÷ 0.25 = 6 sixteenth notes exactly. \"He rewrote the whole passage that way,\" Odile says, \"note values doing arithmetic instead of just keeping time.\" — Dividing one note's duration by another's is exactly how musicians work out how subdivisions fit together.",
    concept: "Note-Value Fractions",
  },
  {
    id: "conservatory-6",
    storyId: "conservatory-killing",
    order: 6,
    sceneText:
      "Vale's own notes record the orchestra's typical volume at 80 decibels. The decibel scale is logarithmic: every added 10 decibels means the sound is 10 times more intense, not just a little louder.",
    puzzle: "How many times more intense is a 100-decibel fortissimo than the orchestra's usual 80-decibel sound?",
    choices: ["100 times more intense", "20 times more intense", "2 times more intense", "1,000 times more intense"],
    correctIndex: 0,
    wrongBeat: "\"Find how many 10-decibel steps separate the two levels,\" Odile says, \"then multiply by 10 for every single step. Don't just compare the two numbers directly.\"",
    solvedBeat:
      "100 − 80 = 20 decibels, or two steps of 10, and 10 × 10 = 100 times more intense. \"No wonder nobody heard anything over a fortissimo passage,\" Odile says grimly. — Decibels are a logarithmic scale, so equal-looking jumps in the number represent repeated multiplying of the actual sound intensity.",
    concept: "The Decibel Scale (Logarithmic Loudness)",
  },
  {
    id: "conservatory-7",
    storyId: "conservatory-killing",
    order: 7,
    sceneText:
      "For the season finale, Vale needed to choose exactly 3 soloists to feature, from a shortlist of 7 candidates — the order they're announced in doesn't matter, only who's chosen.",
    puzzle: "How many different groups of 3 soloists could Vale choose from those 7 candidates?",
    choices: ["35", "21", "210", "7"],
    correctIndex: 0,
    wrongBeat: "\"Since order doesn't matter here, don't just multiply 7×6×5,\" Odile says. \"That counts every group multiple times over — divide by the number of ways to reorder the 3 you picked.\"",
    solvedBeat:
      "7×6×5 = 210 ordered picks, divided by 3×2×1 = 6 ways to reorder any 3 of them, giving 35 distinct groups. \"He'd narrowed it to one specific group already,\" Odile says, tapping the margin. — That's a combination: counting groups where order truly doesn't matter, unlike a permutation.",
    concept: "Combinations",
  },
  {
    id: "conservatory-8",
    storyId: "conservatory-killing",
    order: 8,
    sceneText: "A column of numbers in Vale's audit notes: 4, 8, 16, 32, ...",
    puzzle: "What's the next number in that same doubling sequence?",
    choices: ["64", "48", "36", "40"],
    correctIndex: 0,
    wrongBeat: "\"Check what's actually happening between each number and the next,\" Odile says. \"It isn't adding a fixed amount — it's multiplying by the same fixed amount every time.\"",
    solvedBeat:
      "Each number is exactly double the one before it, so 32 × 2 = 64. \"An account that keeps doubling on its own is not an accident,\" Odile says grimly. — That's a geometric sequence: every term multiplied by the same fixed ratio, rather than added to by a fixed amount.",
    concept: "Geometric Sequences",
  },
  {
    id: "conservatory-9",
    storyId: "conservatory-killing",
    order: 9,
    sceneText: "In the score's margin, Vale scrawled what looks like a simple equation: 3x + 5 = 20.",
    puzzle: "Solving for x, what number was Vale working out?",
    choices: ["5", "15", "25", "3"],
    correctIndex: 0,
    wrongBeat: "\"Isolate x by undoing each step in reverse,\" Odile says. \"Subtract 5 from both sides first, then divide by 3.\"",
    solvedBeat:
      "20 − 5 = 15, and 15 ÷ 3 = 5. \"Five,\" Odile says slowly. \"The exact number of missing ledger pages Pemberton always claimed were 'still being filed.'\" — Solving an equation for an unknown is just undoing, one careful step at a time, whatever was done to build it.",
    concept: "Solving a Linear Equation",
  },
  {
    id: "conservatory-10",
    storyId: "conservatory-killing",
    order: 10,
    sceneText: "Vale's tempo notes show the finale needs to speed up from 96 beats per minute to a full 120 beats per minute.",
    puzzle: "What percentage increase in tempo does that represent?",
    choices: ["25%", "20%", "24%", "30%"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual increase first — new minus old,\" Odile says, \"then divide that increase by the original tempo, not the new one.\"",
    solvedBeat:
      "120 − 96 = 24, and 24 ÷ 96 = 25%. \"The same rate,\" Odile says, comparing it to a line in the ledger, \"that a certain account has been quietly growing by every single week.\" — A percentage increase always measures the change against the original amount, never the new one.",
    concept: "Percent Increase",
  },
];

const SILK_ROAD_CLUES: QuestClue[] = [
  {
    id: "silk-road-1",
    storyId: "silk-road-cipher",
    order: 1,
    sceneText: "At the border post, the moneylender's chart shows 1 gold dinar trades for exactly 12 silver dirhams.",
    puzzle: "How many silver dirhams would 7 gold dinars be worth, at that same rate?",
    choices: ["84 dirhams", "19 dirhams", "96 dirhams", "72 dirhams"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the number of dinars by the exchange rate,\" Layla says. \"Don't add the two numbers together.\"",
    solvedBeat:
      "12 × 7 = 84 silver dirhams. \"Merchants who couldn't do that in their heads got cheated at every single post,\" Layla says. — An exchange rate is simply a ratio, and converting through it is one multiplication, however many posts you cross.",
    concept: "Currency Exchange Rates",
  },
  {
    id: "silk-road-2",
    storyId: "silk-road-cipher",
    order: 2,
    sceneText: "The old trade ledgers weigh silk in catties, not kilograms — and one catty equals exactly 0.6 kilograms.",
    puzzle: "How many kilograms does a shipment of 50 catties of silk weigh?",
    choices: ["30 kilograms", "50 kilograms", "83.3 kilograms", "20 kilograms"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the number of catties by how many kilograms one catty equals,\" Layla says. \"Don't divide.\"",
    solvedBeat:
      "50 × 0.6 = 30 kilograms exactly. \"Every ledger on this route uses a different set of units,\" Layla says, \"and every single one of them converts by simple multiplication once you know the rate.\" — Converting between units is always just multiplying by a fixed conversion factor.",
    concept: "Unit Conversion",
  },
  {
    id: "silk-road-3",
    storyId: "silk-road-cipher",
    order: 3,
    sceneText: "The caravan travels at a steady 24 kilometers per day. The next waypoint marked on Layla's map sits 180 kilometers ahead.",
    puzzle: "At that same pace, how many days will it take the caravan to reach the next waypoint?",
    choices: ["7.5 days", "6 days", "8 days", "9 days"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total distance by the daily distance covered,\" Layla says. \"Don't multiply the two together.\"",
    solvedBeat:
      "180 ÷ 24 = 7.5 days. \"Half a day short of eight,\" Layla says, already adjusting the water rationing. — Distance divided by rate always gives you the time needed to cover it, whatever the units.",
    concept: "Distance, Rate & Time",
  },
  {
    id: "silk-road-4",
    storyId: "silk-road-cipher",
    order: 4,
    sceneText: "A merchant bought a crate of spices for 40 coins and sold it further down the route for 52 coins.",
    puzzle: "As a percentage of the original cost, what was the merchant's profit margin?",
    choices: ["30%", "12%", "23%", "25%"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual profit first — sale price minus cost,\" Layla says, \"then divide that profit by the original cost, not the sale price.\"",
    solvedBeat:
      "52 − 40 = 12 coins profit, and 12 ÷ 40 = 30%. \"A fair markup, by this route's standards,\" Layla says. — A profit margin measured this way is a percentage of the original cost, showing how much was gained relative to what was spent.",
    concept: "Profit Margin (Percentage)",
  },
  {
    id: "silk-road-5",
    storyId: "silk-road-cipher",
    order: 5,
    sceneText:
      "A merchant blends two grades of silk: 30 kilograms of a grade worth 8 coins per kilogram, and 20 kilograms of a grade worth 13 coins per kilogram.",
    puzzle: "What's the blend's average value per kilogram, weighted by how much of each grade went in?",
    choices: ["10 coins per kilogram", "10.5 coins per kilogram", "9 coins per kilogram", "11 coins per kilogram"],
    correctIndex: 0,
    wrongBeat: "\"Multiply each grade's weight by its own value first, add both totals together, then divide by the combined weight,\" Layla says. \"Don't just average the two prices directly.\"",
    solvedBeat:
      "(30 × 8) + (20 × 13) = 240 + 260 = 500 coins total, divided by 50 kilograms, is 10 coins per kilogram. \"Not simply the middle of 8 and 13,\" Layla notes, \"because there was more of the cheaper grade in the mix.\" — A weighted average accounts for how much of each part there actually is, not just how many parts there are.",
    concept: "Weighted Average",
  },
  {
    id: "silk-road-6",
    storyId: "silk-road-cipher",
    order: 6,
    sceneText:
      "A merchant invests 100 coins in a trade venture that grows by 10% at each of three successive stops along the route, compounding each time.",
    puzzle: "How much is that 100-coin investment worth after three stops of 10% compounding growth?",
    choices: ["about 133 coins", "130 coins", "121 coins", "110 coins"],
    correctIndex: 0,
    wrongBeat: "\"Apply the 10% growth three separate times in a row, each time to the new total,\" Layla says. \"Don't just add 10% three times to the original amount.\"",
    solvedBeat:
      "100 × 1.1 × 1.1 × 1.1 ≈ 133 coins. \"Compounding, not just adding,\" Layla says. \"Exactly how a small, honest-looking discrepancy in an account grows into a fortune, given enough stops.\" — Compound growth multiplies by the same growth factor repeatedly, so the amount added gets larger at every step.",
    concept: "Compound Growth",
  },
  {
    id: "silk-road-7",
    storyId: "silk-road-cipher",
    order: 7,
    sceneText: "Three partners funded this leg of the caravan in a ratio of 2 to 3 to 5. The leg's profit comes to exactly 200 coins to split.",
    puzzle: "How many coins does the partner who contributed the \"3\" share receive?",
    choices: ["60 coins", "66 coins", "40 coins", "100 coins"],
    correctIndex: 0,
    wrongBeat: "\"Add up all the ratio parts first to find what one part is worth,\" Layla says, \"then multiply that single part's value by the share in question.\"",
    solvedBeat:
      "2 + 3 + 5 = 10 total parts, so each part is worth 200 ÷ 10 = 20 coins, and 3 parts comes to 60 coins. \"Fair, and provable, down to the coin,\" Layla says. — Dividing something proportionally means splitting it in the exact same ratio as whatever was originally contributed.",
    concept: "Proportional Division",
  },
  {
    id: "silk-road-8",
    storyId: "silk-road-cipher",
    order: 8,
    sceneText:
      "Two market entries sit in the same ledger, in different handwriting: \"1 bolt of silk and 2 jars of spice: 20 coins total\" and \"3 bolts of silk and 1 jar of spice: 25 coins total.\"",
    puzzle: "Working out both prices at once, what does a single bolt of silk cost?",
    choices: ["6 coins", "7 coins", "5 coins", "8 coins"],
    correctIndex: 0,
    wrongBeat: "\"Solve one equation for one item in terms of the other,\" Layla says, \"then substitute that into the second equation before solving.\"",
    solvedBeat:
      "From the first entry, silk = 20 − 2×spice. Substituting into the second gives spice = 7 coins, and silk = 20 − 14 = 6 coins. \"Two unknowns, but only one honest answer that satisfies both entries at once,\" Layla says. — A system of two equations pins down two unknowns at the same time, using each equation as a check on the other.",
    concept: "Systems of Linear Equations",
  },
  {
    id: "silk-road-9",
    storyId: "silk-road-cipher",
    order: 9,
    sceneText: "At the last fair, 5 bolts of silk sold for 40 silver coins.",
    puzzle: "At that same rate, how many silver coins would 8 bolts of silk sell for?",
    choices: ["64 coins", "56 coins", "48 coins", "72 coins"],
    correctIndex: 0,
    wrongBeat: "\"Find the price of a single bolt first by dividing,\" Layla says, \"then multiply that single price by the new number of bolts.\"",
    solvedBeat:
      "40 ÷ 5 = 8 coins per bolt, and 8 × 8 = 64 coins for eight bolts. \"Merchants along this whole route priced everything by that same method,\" Layla says. — That's the rule of three: find the value of one unit first, then scale it up or down to whatever quantity you need.",
    concept: "The Rule of Three (Direct Proportion)",
  },
  {
    id: "silk-road-10",
    storyId: "silk-road-cipher",
    order: 10,
    sceneText:
      "The vault's final dial has no numbers on it at all — only an inscription: \"the caravan's silk, and its spice, reduced to their simplest terms,\" beside two empty slots. Tonight's manifest lists 84 bolts of silk and 56 jars of spice.",
    puzzle: "What's the ratio of silk to spice, 84 to 56, reduced to its simplest form?",
    choices: ["3 : 2", "2 : 1", "6 : 4", "84 : 56, since it can't be reduced further"],
    correctIndex: 0,
    wrongBeat: "\"Find the largest number that divides evenly into both 84 and 56,\" Layla says, \"then divide both sides of the ratio by it.\"",
    solvedBeat:
      "Both 84 and 56 divide evenly by 28, leaving 3 : 2 in simplest form. Layla turns the dial to 3, then 2, and the old lock finally gives. — A ratio is never truly in its simplest form until you've divided out everything both numbers genuinely share.",
    concept: "Simplifying Ratios",
  },
];

const CARNIVAL_CLUES: QuestClue[] = [
  {
    id: "carnival-1",
    storyId: "carnival-of-lost-souls",
    order: 1,
    sceneText: "Nell shows you the carousel's prize wheel: 20 equal slots, and only 1 of them marked as the grand prize.",
    puzzle: "What's the probability of landing on the grand prize in a single honest spin?",
    choices: ["1/20", "1/5", "1/10", "1/4"],
    correctIndex: 0,
    wrongBeat: "\"Count the favorable outcome over the total number of equally likely outcomes,\" Nell says. \"One grand-prize slot out of twenty total.\"",
    solvedBeat:
      "1 out of 20 equally likely slots, so the probability is exactly 1/20. \"Which makes what happened at the ring-toss booth even stranger,\" Nell says. — Basic probability is simply the number of favorable outcomes divided by the total number of equally likely outcomes.",
    concept: "Basic Probability",
  },
  {
    id: "carnival-2",
    storyId: "carnival-of-lost-souls",
    order: 2,
    sceneText: "Crane's own notes describe the ring-toss game's true odds as \"19 to 1 against winning.\"",
    puzzle: "Converting \"19 to 1 against\" into an ordinary probability, what fraction of the time should a player actually win?",
    choices: ["1/20", "1/19", "19/20", "1/1"],
    correctIndex: 0,
    wrongBeat: "\"Add both numbers in the odds together to find the total number of equal parts,\" Nell says, \"then the winning side's number becomes the numerator over that total.\"",
    solvedBeat:
      "19 + 1 = 20 total parts, and the winning side is 1 of them, so the probability of winning is 1/20. \"Exactly what the wheel's own odds say it should be,\" Nell notes. — Odds and probability describe the same thing two different ways; converting between them just means adding both sides together for the total.",
    concept: "Odds vs. Probability",
  },
  {
    id: "carnival-3",
    storyId: "carnival-of-lost-souls",
    order: 3,
    sceneText: "The dice booth uses two separate, fair six-sided dice. Crane wanted to know how often a player would roll double sixes.",
    puzzle: "What's the probability of rolling a six on both dice at once?",
    choices: ["1/36", "1/12", "1/6", "2/6"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the two individual probabilities together for independent events,\" Nell says. \"Don't just add them.\"",
    solvedBeat:
      "1/6 × 1/6 = 1/36. \"Rare enough that anyone rolling it twice in a night should raise an eyebrow,\" Nell says. — For independent events, the probability of both happening is the product of each one's own probability.",
    concept: "The Multiplication Rule (Independent Events)",
  },
  {
    id: "carnival-4",
    storyId: "carnival-of-lost-souls",
    order: 4,
    sceneText:
      "A raffle drum holds 10 tickets, 2 of them marked as winners. Crane drew one ticket to check it, without putting it back, then wanted the odds for the very next draw.",
    puzzle: "After removing one non-winning ticket, what's the probability the next ticket drawn is a winner?",
    choices: ["2/9", "1/5", "2/10", "1/9"],
    correctIndex: 0,
    wrongBeat: "\"Update both the total count and, if needed, the winning count based on exactly what was removed,\" Nell says, \"before recalculating the fraction.\"",
    solvedBeat:
      "9 tickets remain, still with 2 winners among them, so the probability is 2/9. \"The odds shift every single time something's removed and not replaced,\" Nell says. — Probability without replacement changes at every draw, since the counts can shrink as tickets disappear from the pool.",
    concept: "Probability Without Replacement",
  },
  {
    id: "carnival-5",
    storyId: "carnival-of-lost-souls",
    order: 5,
    sceneText: "A carnival game costs 2 coins to play and pays out 20 coins on a win. Crane calculated the true win probability at 1 in 20.",
    puzzle: "What's the expected value of playing this game once, accounting for both the cost and the payout?",
    choices: ["A loss of 1 coin, on average", "A gain of 1 coin, on average", "Break-even, exactly", "A loss of 2 coins, on average"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the payout by the win probability first to get the average payout,\" Nell says, \"then subtract the fixed cost to play.\"",
    solvedBeat:
      "20 × (1/20) = 1 coin average payout, minus the 2-coin cost, comes to a loss of 1 coin on average, every single time it's played. \"No wonder the booth never runs out of takers,\" Nell mutters. \"It just quietly grinds them down.\" — Expected value weighs every possible outcome by its own probability, telling you what a game truly earns or costs over the long run.",
    concept: "Expected Value",
  },
  {
    id: "carnival-6",
    storyId: "carnival-of-lost-souls",
    order: 6,
    sceneText: "Crane's notebook asks: if the ring-toss's true win probability is 1/20, how often should a player expect to lose instead?",
    puzzle: "What's the complementary probability of losing, given a 1/20 chance of winning?",
    choices: ["19/20", "1/20", "9/20", "1/19"],
    correctIndex: 0,
    wrongBeat: "\"A probability and its complement always add up to exactly 1,\" Nell says. \"Subtract the winning probability from 1 to get the losing one.\"",
    solvedBeat:
      "1 − 1/20 = 19/20. \"Nineteen times out of twenty, nothing at all should happen,\" Nell says. — Complementary probability always fills in the rest of the whole: everything that isn't the outcome you're tracking.",
    concept: "Complementary Probability",
  },
  {
    id: "carnival-7",
    storyId: "carnival-of-lost-souls",
    order: 7,
    sceneText:
      "A two-stage game: first a spin that wins 1/4 of the time, and only if that spin wins, a second draw that wins 1/2 of the time.",
    puzzle: "Mapping out both stages, what's the probability of winning both the spin and the draw?",
    choices: ["1/8", "1/6", "3/4", "1/4"],
    correctIndex: 0,
    wrongBeat: "\"Follow the branch where the first stage actually wins,\" Nell says, \"then multiply that branch's probability by the second stage's own probability.\"",
    solvedBeat:
      "1/4 × 1/2 = 1/8. \"Every branch of the tree has to be followed all the way through,\" Nell says, sketching it out. — A probability tree maps every possible path through a multi-stage event, and each full path's probability is just those stages multiplied together.",
    concept: "Probability Trees",
  },
  {
    id: "carnival-8",
    storyId: "carnival-of-lost-souls",
    order: 8,
    sceneText:
      "The ring-toss booth's true win probability is 5%. Crane's own month-long tally shows it actually paying out on 12% of all plays.",
    puzzle: "How many percentage points higher is the booth's actual win rate than its true probability?",
    choices: ["7 percentage points", "5 percentage points", "12 percentage points", "2.4 percentage points"],
    correctIndex: 0,
    wrongBeat: "\"Subtract the true probability from the actual observed rate,\" Nell says. \"Not the other way around, and don't divide them.\"",
    solvedBeat:
      "12% − 5% = 7 percentage points higher than it should ever honestly run. \"That's not luck,\" Nell says flatly. \"That's a rigged wheel.\" — Comparing an actual rate to its true probability is exactly how a real discrepancy gets caught.",
    concept: "Percentage Deviation",
  },
  {
    id: "carnival-9",
    storyId: "carnival-of-lost-souls",
    order: 9,
    sceneText: "Crane's tally for the month: 84 wins recorded against 56 losses at the ring-toss booth.",
    puzzle: "What's the ratio of wins to losses, 84 to 56, reduced to its simplest form?",
    choices: ["3 : 2", "2 : 1", "6 : 4", "84 : 56, since it can't be reduced further"],
    correctIndex: 0,
    wrongBeat: "\"Find the largest number that divides evenly into both 84 and 56,\" Nell says, \"then divide both sides of the ratio by it.\"",
    solvedBeat:
      "Both 84 and 56 divide evenly by 28, leaving 3 : 2 in simplest form. \"A wheel with true one-in-twenty odds should never come anywhere near three wins for every two losses,\" Nell says. — A ratio is never truly in its simplest form until you've divided out everything both numbers genuinely share.",
    concept: "Simplifying Ratios",
  },
  {
    id: "carnival-10",
    storyId: "carnival-of-lost-souls",
    order: 10,
    sceneText:
      "Crane's final note works out the ring-toss's real expected value if it actually paid out at that rigged 12% rate instead of the honest 5%, on the same 2-coin cost, 20-coin payout game.",
    puzzle: "What's the expected value of the game at the rigged 12% win rate?",
    choices: ["A gain of 0.4 coins for the house's opponent, meaning a steady loss for the booth", "Still a loss of 1 coin, same as before", "Break-even, exactly", "A loss of 2.4 coins"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the payout by the rigged win probability first,\" Nell says, \"then subtract the fixed cost, exactly like before — just with the real rate this time.\"",
    solvedBeat:
      "20 × 0.12 = 2.4 coins average payout, minus the 2-coin cost, leaves a gain of 0.4 coins per play for whoever was winning that often — a steady bleed straight out of the booth's own till. \"There's your missing money,\" Nell says quietly. — The same expected-value formula, run honestly on the real numbers, exposes exactly what a rigged game is actually costing someone.",
    concept: "Expected Value (Rigged Game)",
  },
];

const ICE_VAULT_CLUES: QuestClue[] = [
  {
    id: "ice-vault-1",
    storyId: "ice-vault-expedition",
    order: 1,
    sceneText: "Freya's stakes in the ice show it melting at a steady rate of 3 centimeters per day.",
    puzzle: "At that steady rate, how many centimeters will melt away over 12 days?",
    choices: ["36 cm", "15 cm", "4 cm", "24 cm"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the daily melting rate by the number of days,\" Freya says. \"Don't add the two numbers together.\"",
    solvedBeat:
      "3 × 12 = 36 centimeters. \"Which tells us exactly how many days we actually have left,\" Freya says, checking the vault's depth against that same rate. — A steady rate multiplied by time always tells you the total amount changed.",
    concept: "Rate of Melting",
  },
  {
    id: "ice-vault-2",
    storyId: "ice-vault-expedition",
    order: 2,
    sceneText: "Freya's thermometer reads the ice core's internal temperature at -10°C. Her equipment back home is calibrated in Fahrenheit only.",
    puzzle: "Using °F = (°C × 9/5) + 32, what is -10°C in Fahrenheit?",
    choices: ["14°F", "10°F", "-10°F", "22°F"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the Celsius temperature by 9/5 first,\" Freya says, \"then add 32 to that result — don't add 32 before multiplying.\"",
    solvedBeat:
      "(-10 × 9/5) + 32 = -18 + 32 = 14°F. \"Cold enough to keep everything exactly as it was left,\" Freya says. — Converting between temperature scales is just a fixed linear formula, applied the same careful way every single time.",
    concept: "Temperature Conversion",
  },
  {
    id: "ice-vault-3",
    storyId: "ice-vault-expedition",
    order: 3,
    sceneText:
      "The safest crossing rigs a rope from a point 30 meters straight across a crevasse, anchored 40 meters up the ice wall on the far side.",
    puzzle: "Using the Pythagorean theorem, how long a rope does Freya need for that diagonal crossing?",
    choices: ["50 meters", "70 meters", "35 meters", "60 meters"],
    correctIndex: 0,
    wrongBeat: "\"Square both measurements, add them together, then take the square root of that sum,\" Freya says.",
    solvedBeat:
      "30² + 40² = 900 + 1,600 = 2,500, and the square root of 2,500 is exactly 50. \"A clean number,\" Freya says, already measuring out the rope. — The Pythagorean theorem turns two straight measurements into the length of the diagonal connecting them, every time.",
    concept: "The Pythagorean Theorem",
  },
  {
    id: "ice-vault-4",
    storyId: "ice-vault-expedition",
    order: 4,
    sceneText: "The sealed ice block protecting the vault door measures 4 meters long, 3 meters wide, and 2 meters thick.",
    puzzle: "What's the total volume of that ice block?",
    choices: ["24 cubic meters", "9 cubic meters", "14 cubic meters", "48 cubic meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply all three dimensions together,\" Freya says. \"Length times width times height.\"",
    solvedBeat:
      "4 × 3 × 2 = 24 cubic meters of solid ice. \"That's what stands between us and the door,\" Freya says grimly. — The volume of any rectangular block is simply its length times its width times its height.",
    concept: "Volume of a Rectangular Prism",
  },
  {
    id: "ice-vault-5",
    storyId: "ice-vault-expedition",
    order: 5,
    sceneText:
      "Freya's field guide lists glacial ice at a density of roughly 0.9 grams per cubic centimeter — meaning 0.9 grams of mass in every single cubic centimeter of ice.",
    puzzle: "Using that density, roughly how many grams does 1,000 cubic centimeters of this ice weigh?",
    choices: ["900 grams", "1,000 grams", "90 grams", "1,900 grams"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the volume by the density,\" Freya says. \"Don't just add the density value onto the volume.\"",
    solvedBeat:
      "1,000 × 0.9 = 900 grams. \"Which is exactly why nobody's simply carving through that block by hand,\" Freya says. — Density multiplied by volume always gives you mass, whatever the material.",
    concept: "Density",
  },
  {
    id: "ice-vault-6",
    storyId: "ice-vault-expedition",
    order: 6,
    sceneText: "Freya calculates the vault's ice cap has 84 centimeters left before full exposure, melting at the steady rate of 3 centimeters per day you already measured.",
    puzzle: "At that rate, how many full days remain before the vault is completely exposed?",
    choices: ["28 days", "24 days", "32 days", "18 days"],
    correctIndex: 0,
    wrongBeat: "\"Divide the remaining thickness by the daily melting rate,\" Freya says. \"Don't multiply the two together.\"",
    solvedBeat:
      "84 ÷ 3 = 28 days exactly. \"Four weeks,\" Freya says, already recalculating the expedition's supply count. — Dividing a remaining amount by a steady rate always tells you how much time is actually left.",
    concept: "Time Remaining (Division)",
  },
  {
    id: "ice-vault-7",
    storyId: "ice-vault-expedition",
    order: 7,
    sceneText:
      "Freya's own survey markers show this glacier's edge sat 2,000 meters further out ten years ago. Today it's retreated back to a position only 1,400 meters from where it started.",
    puzzle: "As a percentage of its original extent, how much has the glacier's edge retreated?",
    choices: ["30%", "40%", "25%", "60%"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual distance retreated first — original minus current,\" Freya says, \"then divide that by the original distance.\"",
    solvedBeat:
      "2,000 − 1,400 = 600 meters retreated, and 600 ÷ 2,000 = 30%. \"Faster every single year we've measured it,\" Freya says quietly. — A percentage change always measures against the original amount, not the new one.",
    concept: "Percentage Change",
  },
  {
    id: "ice-vault-8",
    storyId: "ice-vault-expedition",
    order: 8,
    sceneText: "That same 4-by-3-by-2-meter ice block needs to be fully wrapped in insulating cloth before the final approach, to slow its melting.",
    puzzle: "What's the total surface area of all six faces of that ice block?",
    choices: ["52 square meters", "24 square meters", "36 square meters", "44 square meters"],
    correctIndex: 0,
    wrongBeat: "\"Find the area of each of the three different face-pairs separately,\" Freya says, \"add those three areas together, then double the whole total for both matching faces on each side.\"",
    solvedBeat:
      "(4×3) + (4×2) + (3×2) = 12 + 8 + 6 = 26, and doubling that for both matching faces on every side gives 52 square meters total. \"Every centimeter of that needs covering,\" Freya says, unrolling the cloth. — Surface area adds up every face of a solid, and a rectangular block always has three pairs of matching faces.",
    concept: "Surface Area of a Rectangular Prism",
  },
  {
    id: "ice-vault-9",
    storyId: "ice-vault-expedition",
    order: 9,
    sceneText: "Freya's notes date the vault's sealing to exactly 3 years before the glacier's retreat was first recorded.",
    puzzle: "Using 365 days in a year, how many days does that 3-year span come to?",
    choices: ["1,095 days", "1,000 days", "1,200 days", "900 days"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the number of years by the number of days in a single year,\" Freya says. \"Don't just guess at a round number.\"",
    solvedBeat:
      "365 × 3 = 1,095 days exactly. \"Every one of them logged, if the old records are right,\" Freya says. — Converting years into days is just another fixed conversion factor, multiplied straight through.",
    concept: "Unit Conversion (Years to Days)",
  },
  {
    id: "ice-vault-10",
    storyId: "ice-vault-expedition",
    order: 10,
    sceneText: "The ice core samples show the vault's protective ice cap losing 8% of its remaining thickness every week, compounding as it thins.",
    puzzle: "If the cap is currently 100 centimeters thick, how many centimeters remain after 3 weeks of that compounding 8% loss?",
    choices: ["about 78 cm", "76 cm", "84 cm", "92 cm"],
    correctIndex: 0,
    wrongBeat: "\"Apply the 8% loss three separate times in a row, each time to the new remaining thickness,\" Freya says. \"Don't just subtract 24% all at once from the original.\"",
    solvedBeat:
      "100 × 0.92 × 0.92 × 0.92 ≈ 78 centimeters. \"Compounding, the same as it always does,\" Freya says, checking her instruments again. \"We have less time than a simple subtraction would suggest.\" — Exponential decay shrinks a quantity by the same percentage repeatedly, so the actual amount lost gets smaller each time even as the total keeps dropping.",
    concept: "Exponential Decay",
  },
];

const ARCHITECT_CLUES: QuestClue[] = [
  {
    id: "architect-1",
    storyId: "architects-folly",
    order: 1,
    sceneText: "Priya shows you the specs for one floor section: 40 support columns, each rated to carry 2,500 kilograms safely.",
    puzzle: "What's the floor section's total safe load capacity, combining all 40 columns?",
    choices: ["100,000 kilograms", "62,500 kilograms", "40,000 kilograms", "2,500 kilograms"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the number of columns by the safe load each one carries,\" Priya says. \"Don't just add the two numbers together.\"",
    solvedBeat:
      "40 × 2,500 = 100,000 kilograms total safe capacity. \"Which is exactly the number Reyes was cross-checking the night he died,\" Priya says. — Total capacity is simply each unit's own capacity multiplied by how many units share the load.",
    concept: "Load Calculation",
  },
  {
    id: "architect-2",
    storyId: "architects-folly",
    order: 2,
    sceneText: "A beam is rated to withstand 12,000 kilograms before failing, but the building code requires it to actually carry no more than 4,000 kilograms in normal use.",
    puzzle: "What's this beam's safety factor — its failure capacity divided by its actual working load?",
    choices: ["3", "4", "8", "1/3"],
    correctIndex: 0,
    wrongBeat: "\"Divide the beam's failure capacity by the load it's actually meant to carry,\" Priya says. \"Don't subtract the two numbers.\"",
    solvedBeat:
      "12,000 ÷ 4,000 = 3. \"A safety factor of 3 is standard,\" Priya says. \"Meaning this beam could handle three times its normal job before failing.\" — A safety factor is simply how many times stronger something is built than it strictly needs to be.",
    concept: "Safety Factor",
  },
  {
    id: "architect-3",
    storyId: "architects-folly",
    order: 3,
    sceneText: "A support column carries a load of 60,000 newtons of force, spread evenly across a cross-section measuring 0.03 square meters.",
    puzzle: "What's the stress on that column, in newtons per square meter (force divided by area)?",
    choices: ["2,000,000 N/m²", "1,800,000 N/m²", "20,000 N/m²", "600,000 N/m²"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total force by the cross-sectional area,\" Priya says. \"Don't multiply the two together.\"",
    solvedBeat:
      "60,000 ÷ 0.03 = 2,000,000 newtons per square meter. \"That number has to stay under whatever the material can actually take,\" Priya says. — Stress is always force divided by the area it's spread across, whatever the material.",
    concept: "Stress (Force ÷ Area)",
  },
  {
    id: "architect-4",
    storyId: "architects-folly",
    order: 4,
    sceneText: "The blueprint is drawn at a scale where 1 centimeter represents 2 meters of the real building. A support brace measures 7.5 centimeters on the drawing.",
    puzzle: "How long is that brace in the real, built structure?",
    choices: ["15 meters", "9.5 meters", "3.75 meters", "20 meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the drawing's measurement by the scale factor,\" Priya says. \"Don't add the two numbers.\"",
    solvedBeat:
      "7.5 × 2 = 15 meters, full scale. \"Exactly the brace that failed,\" Priya says quietly. — A blueprint's scale is just a fixed ratio, and reading a real measurement off it is one multiplication.",
    concept: "Scale & Proportion",
  },
  {
    id: "architect-5",
    storyId: "architects-folly",
    order: 5,
    sceneText: "A diagonal support brace needs to span a gap 9 meters wide and 12 meters tall, corner to corner.",
    puzzle: "Using the Pythagorean theorem, how long does that diagonal brace need to be?",
    choices: ["15 meters", "21 meters", "10.5 meters", "18 meters"],
    correctIndex: 0,
    wrongBeat: "\"Square both measurements, add them together, then take the square root of that sum,\" Priya says.",
    solvedBeat:
      "9² + 12² = 81 + 144 = 225, and the square root of 225 is exactly 15. \"A clean number,\" Priya says. \"Reyes always said a real brace length should come out clean, or you'd measured something wrong.\" — The Pythagorean theorem turns two straight measurements into the length of the diagonal connecting them.",
    concept: "The Pythagorean Theorem",
  },
  {
    id: "architect-6",
    storyId: "architects-folly",
    order: 6,
    sceneText: "The beams actually installed are rated at only 7,800 kilograms, though the blueprints specify beams rated for 12,000 kilograms.",
    puzzle: "What percentage below the specified strength are the installed beams?",
    choices: ["35%", "65%", "30%", "42%"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual shortfall first — specified minus installed,\" Priya says, \"then divide that shortfall by the specified strength.\"",
    solvedBeat:
      "12,000 − 7,800 = 4,200 kilograms short, and 4,200 ÷ 12,000 = 35%. \"More than a third weaker than the plans ever allowed,\" Priya says grimly. — A percentage shortfall always measures the missing amount against what was originally required.",
    concept: "Percentage Decrease",
  },
  {
    id: "architect-7",
    storyId: "architects-folly",
    order: 7,
    sceneText: "The site's concrete mix is specified as a ratio of 1 part cement to 2 parts sand to 3 parts gravel, by volume.",
    puzzle: "For a batch using 12 buckets of gravel, how many buckets of cement does that same ratio call for?",
    choices: ["4 buckets", "6 buckets", "3 buckets", "8 buckets"],
    correctIndex: 0,
    wrongBeat: "\"Find how many times the gravel's own ratio-part fits into 12 buckets,\" Priya says, \"then apply that same multiple to the cement's ratio-part.\"",
    solvedBeat:
      "12 buckets of gravel is 4 times the ratio's \"3 parts,\" so cement's \"1 part\" scales the same way: 1 × 4 = 4 buckets. \"Get that ratio wrong and the whole mix is weaker than it looks,\" Priya says. — A ratio holds steady no matter how large the actual batch gets, as long as every part scales by the same multiple.",
    concept: "Ratio & Proportion",
  },
  {
    id: "architect-8",
    storyId: "architects-folly",
    order: 8,
    sceneText: "Reyes's notebook lists the expected load on each successive floor, growing by a fixed amount floor by floor: 20, 26, 32, 38 tons, ...",
    puzzle: "Following that same pattern, what load would the next floor up carry?",
    choices: ["44 tons", "42 tons", "40 tons", "46 tons"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each floor's load and the one before it,\" Priya says, \"then add that same gap once more to the last number.\"",
    solvedBeat:
      "Each floor adds exactly 6 tons over the last, so 38 + 6 = 44 tons. \"Which is exactly why the lower floors needed the stronger beams,\" Priya says. — A sequence with the same fixed gap at every step is called an arithmetic sequence.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "architect-9",
    storyId: "architects-folly",
    order: 9,
    sceneText: "Reyes's notes record the discrepancy in the shipment records as 2.1 tons of missing steel.",
    puzzle: "Using 2,000 pounds in a ton, how many pounds does that 2.1-ton discrepancy come to?",
    choices: ["4,200 pounds", "2,100 pounds", "4,000 pounds", "2,000 pounds"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the number of tons by how many pounds are in one ton,\" Priya says. \"Don't just guess at a round number.\"",
    solvedBeat:
      "2.1 × 2,000 = 4,200 pounds exactly. \"A very specific number, for something Dana kept calling 'a rounding error,'\" Priya says. — Converting tons into pounds is just another fixed conversion factor, multiplied straight through.",
    concept: "Unit Conversion (Tons to Pounds)",
  },
  {
    id: "architect-10",
    storyId: "architects-folly",
    order: 10,
    sceneText: "Reyes's final notebook page works out an equation for the missing beam strength: 3x − 8 = 22, where x is the shortfall, in hundreds of kilograms.",
    puzzle: "Solving for x, what number was Reyes working out?",
    choices: ["10", "8", "6", "14"],
    correctIndex: 0,
    wrongBeat: "\"Isolate x by undoing each step in reverse,\" Priya says. \"Add 8 to both sides first, then divide by 3.\"",
    solvedBeat:
      "22 + 8 = 30, and 30 ÷ 3 = 10. \"A thousand kilograms of missing strength, floor after floor,\" Priya says quietly. — Solving an equation for an unknown is just undoing, one careful step at a time, whatever was done to build it.",
    concept: "Solving a Linear Equation",
  },
];

const CANYON_CLUES: QuestClue[] = [
  {
    id: "canyon-1",
    storyId: "canyon-of-echoes",
    order: 1,
    sceneText: "Talia claps sharply against the canyon wall. The echo returns exactly 2 seconds later. Sound travels through this desert air at about 340 meters per second.",
    puzzle: "Since the sound has to travel to the wall and back, how far away is that canyon wall?",
    choices: ["340 meters", "680 meters", "170 meters", "1,020 meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the speed by the total time first,\" Talia says, \"then divide by 2, since the sound makes a round trip — there and back.\"",
    solvedBeat:
      "340 × 2 = 680 meters total round trip, divided by 2 is 340 meters to the wall. \"Exactly what the old markers claim,\" Talia says. — An echo's distance is always the round-trip distance divided by two, since the sound has to travel there and back.",
    concept: "Speed of Sound (Echo Distance)",
  },
  {
    id: "canyon-2",
    storyId: "canyon-of-echoes",
    order: 2,
    sceneText: "Talia's tuning fork rings at 340 Hz. Sound moves through this canyon air at 340 meters per second.",
    puzzle: "Using wavelength = speed ÷ frequency, what's the wavelength of that 340 Hz tone?",
    choices: ["1 meter", "340 meters", "0.5 meters", "2 meters"],
    correctIndex: 0,
    wrongBeat: "\"Divide the speed of sound by the frequency,\" Talia says. \"Don't multiply the two together.\"",
    solvedBeat:
      "340 ÷ 340 = 1 meter exactly. \"A clean number, on purpose,\" Talia says, marking the tuning fork's case. — Wavelength is simply how far one full wave travels in the time it takes to complete a single cycle.",
    concept: "Wavelength & Frequency",
  },
  {
    id: "canyon-3",
    storyId: "canyon-of-echoes",
    order: 3,
    sceneText: "A second tuning fork rings at a steady 50 Hz.",
    puzzle: "Using period = 1 ÷ frequency, how long does one single cycle of that 50 Hz tone take?",
    choices: ["0.02 seconds (20 milliseconds)", "50 seconds", "2 seconds", "0.5 seconds"],
    correctIndex: 0,
    wrongBeat: "\"Period is 1 divided by frequency,\" Talia says. \"Don't just move the decimal point on the frequency itself.\"",
    solvedBeat:
      "1 ÷ 50 = 0.02 seconds, or 20 milliseconds, per cycle. \"Faster than you could ever count by hand,\" Talia says. — Period and frequency are always reciprocals of each other: one full cycle's time, divided into a single second.",
    concept: "Period (Time per Cycle)",
  },
  {
    id: "canyon-4",
    storyId: "canyon-of-echoes",
    order: 4,
    sceneText: "A narrow side-canyon acts like an open tube, 4 meters deep. For a tube open at both ends, the longest resonant wavelength that fits is exactly twice the tube's length.",
    puzzle: "What's that fundamental resonant wavelength for a 4-meter-deep open tube?",
    choices: ["8 meters", "4 meters", "2 meters", "16 meters"],
    correctIndex: 0,
    wrongBeat: "\"Double the tube's length,\" Talia says. \"The fundamental wavelength for an open tube is always twice as long as the tube itself.\"",
    solvedBeat:
      "2 × 4 = 8 meters. \"Which is exactly the tone that hums through here at dusk,\" Talia says. — An open tube's longest resonant wave is always twice its own length, the same relationship in every wind instrument built this way.",
    concept: "Resonance (Open-Tube Harmonics)",
  },
  {
    id: "canyon-5",
    storyId: "canyon-of-echoes",
    order: 5,
    sceneText: "Talia's sound meter reads 80 units of intensity at 2 meters from a source. The inverse-square law says intensity falls off with the square of the distance.",
    puzzle: "Using that same law, what intensity should the meter read at 4 meters — twice the distance — from that same source?",
    choices: ["20 units", "40 units", "10 units", "60 units"],
    correctIndex: 0,
    wrongBeat: "\"Doubling the distance doesn't just halve the intensity,\" Talia says. \"Square the distance ratio first, then divide the original intensity by that squared number.\"",
    solvedBeat:
      "Doubling the distance means dividing the intensity by 2² = 4, so 80 ÷ 4 = 20 units. \"Sound fades faster than people expect,\" Talia says. — The inverse-square law means intensity drops with the square of the distance, not the distance itself.",
    concept: "The Inverse-Square Law",
  },
  {
    id: "canyon-6",
    storyId: "canyon-of-echoes",
    order: 6,
    sceneText:
      "Talia claps again. This time, two echoes return: one after 1 second, from the near wall, and a second, fainter echo 3 seconds after the clap, from a farther wall deeper in the canyon.",
    puzzle: "Using 340 meters per second for sound, how far away is that second, farther wall?",
    choices: ["510 meters", "1,020 meters", "170 meters", "680 meters"],
    correctIndex: 0,
    wrongBeat: "\"Use the full round-trip time for that specific echo,\" Talia says, \"multiply by the speed of sound, then divide by 2 for the one-way distance.\"",
    solvedBeat:
      "340 × 3 = 1,020 meters round trip, divided by 2 is 510 meters. \"Deep enough to be the second marker on the old map,\" Talia says. — Each separate echo gets its own round-trip calculation, no matter how many walls are bouncing sound back at once.",
    concept: "Echo Timing (Multiple Reflections)",
  },
  {
    id: "canyon-7",
    storyId: "canyon-of-echoes",
    order: 7,
    sceneText: "A carved flute found at the canyon's mouth plays a note at 220 Hz. Talia says the old markers respond only to its octave, exactly double that frequency.",
    puzzle: "What frequency is that octave?",
    choices: ["440 Hz", "220 Hz", "330 Hz", "880 Hz"],
    correctIndex: 0,
    wrongBeat: "\"An octave is always exactly double the frequency below it,\" Talia says. \"Multiply — don't add a fixed amount.\"",
    solvedBeat:
      "220 × 2 = 440 Hz. \"The same note carved into the flute's own case, if you look closely,\" Talia says. — An octave is defined by a frequency ratio of exactly 2 to 1, no matter which note you start from.",
    concept: "Ratios in Music (Octaves)",
  },
  {
    id: "canyon-8",
    storyId: "canyon-of-echoes",
    order: 8,
    sceneText: "A patch of soft canyon sand absorbs sound instead of reflecting it. An echo that should carry 100 units of intensity returns carrying only 65 units after crossing that patch.",
    puzzle: "What percentage of the sound's intensity did that sand patch absorb?",
    choices: ["35%", "65%", "30%", "70%"],
    correctIndex: 0,
    wrongBeat: "\"Find the amount actually lost first,\" Talia says, \"the original intensity minus what came back, then express that loss as a percentage of the original.\"",
    solvedBeat:
      "100 − 65 = 35 units lost, and 35 ÷ 100 = 35%. \"Which is exactly why that stretch never echoes right,\" Talia says. — A percentage loss like this always measures the missing amount against the original total.",
    concept: "Percentage Loss",
  },
  {
    id: "canyon-9",
    storyId: "canyon-of-echoes",
    order: 9,
    sceneText: "Talia wants the canyon's own speed of sound, 340 meters per second, converted into kilometers per hour for her field notes.",
    puzzle: "Using 3,600 seconds in an hour and 1,000 meters in a kilometer, what's 340 meters per second in kilometers per hour?",
    choices: ["1,224 km/h", "340 km/h", "3,400 km/h", "612 km/h"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the speed by 3,600 to convert seconds to hours,\" Talia says, \"then divide by 1,000 to convert meters to kilometers.\"",
    solvedBeat:
      "340 × 3,600 = 1,224,000 meters per hour, divided by 1,000 is 1,224 kilometers per hour. \"Faster than it feels, standing still in a canyon,\" Talia says. — Converting a rate between units just means applying each unit's own conversion factor in turn.",
    concept: "Unit Conversion (Speed)",
  },
  {
    id: "canyon-10",
    storyId: "canyon-of-echoes",
    order: 10,
    sceneText: "The final marker gives only a time: a clap at the cache's entrance takes exactly 2.5 seconds for its echo to return to this exact spot.",
    puzzle: "Using 340 meters per second for sound, how far away is the cache's entrance?",
    choices: ["425 meters", "850 meters", "212.5 meters", "680 meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the speed by the full round-trip time,\" Talia says, \"then divide by 2 for the one-way distance to the cache.\"",
    solvedBeat:
      "340 × 2.5 = 850 meters round trip, divided by 2 is 425 meters. Talia paces it off herself, counting under her breath. — The same echo calculation works at any distance, once you trust the numbers instead of guessing at the sound.",
    concept: "Speed, Distance & Time",
  },
];

const MUSEUM_CLUES: QuestClue[] = [
  {
    id: "museum-1",
    storyId: "museum-heist",
    order: 1,
    sceneText: "The vault's keypad accepts codes only in binary. Odette recovers a scrap of paper from the wastebasket reading: 1 0 1 1 0.",
    puzzle: "What's that binary number, 10110, converted into an ordinary base-10 number?",
    choices: ["22", "26", "18", "20"],
    correctIndex: 0,
    wrongBeat: "\"Count each binary digit's own place value,\" Odette says, \"16, 8, 4, 2, 1 from left to right, and add up only the places marked with a 1.\"",
    solvedBeat:
      "16 + 4 + 2 = 22. \"Someone wrote down part of the real code before they'd fully memorized it,\" Odette says. — Binary numbers use only 0s and 1s, but each position still stands for a power of two, the same way each position in an ordinary number stands for a power of ten.",
    concept: "Binary Numbers",
  },
  {
    id: "museum-2",
    storyId: "museum-heist",
    order: 2,
    sceneText: "The floor plan marks the pressure-sensor grid on a coordinate map. One sensor sits at (2, 3), another at (6, 6).",
    puzzle: "Using the distance formula, how far apart are those two sensors?",
    choices: ["5 units", "7 units", "4 units", "10 units"],
    correctIndex: 0,
    wrongBeat: "\"Find the difference in each coordinate separately,\" Odette says, \"square both differences, add them together, then take the square root.\"",
    solvedBeat:
      "(6−2)² + (6−3)² = 16 + 9 = 25, and the square root of 25 is exactly 5. \"A clean gap,\" Odette says, \"exactly wide enough for someone to slip through untouched.\" — The distance formula is really just the Pythagorean theorem, applied to two points on a coordinate grid.",
    concept: "Coordinate Geometry (Distance Formula)",
  },
  {
    id: "museum-3",
    storyId: "museum-heist",
    order: 3,
    sceneText: "Museum records show 8 staff members have access to the vault room, and 6 have access to the control room. Exactly 3 staff members have access to both rooms.",
    puzzle: "Using those numbers, how many staff members have access to at least one of the two rooms?",
    choices: ["11", "14", "5", "17"],
    correctIndex: 0,
    wrongBeat: "\"Add both groups together,\" Odette says, \"then subtract the number counted twice — the ones with access to both rooms.\"",
    solvedBeat:
      "8 + 6 − 3 = 11 staff members total. \"Which means only three of them could have gotten into both rooms the same night,\" Odette says. — Adding two overlapping groups together double-counts whoever belongs to both, so that overlap has to be subtracted back out.",
    concept: "Set Theory (Overlapping Groups)",
  },
  {
    id: "museum-4",
    storyId: "museum-heist",
    order: 4,
    sceneText:
      "The vault's alarm only stays silent if the pressure sensor reads clear AND the motion sensor reads clear. If either one alone reads clear but the other doesn't, the alarm still fires.",
    puzzle: "If the pressure sensor is clear but the motion sensor detects movement, does the alarm stay silent?",
    choices: [
      "No — the alarm fires, since AND requires both conditions true",
      "Yes — one clear sensor is enough",
      "Only if the pressure sensor was clear first",
      "It depends on the time of night",
    ],
    correctIndex: 0,
    wrongBeat: "\"An AND gate only stays silent when every single condition is true at once,\" Odette says. \"One true and one false is still not enough.\"",
    solvedBeat:
      "With an AND gate, both sensors must read clear at the same time, or the alarm fires — one clear reading alone changes nothing. \"So whoever did this beat both sensors, not just one,\" Odette says grimly. — Boolean AND logic requires every single condition to hold true before the whole statement counts as true.",
    concept: "Boolean Logic (AND Gates)",
  },
  {
    id: "museum-5",
    storyId: "museum-heist",
    order: 5,
    sceneText:
      "The vault's rotating dial has 40 numbered positions, wrapping back to 0 after 39. It currently rests on position 15. Odette knows the thief rotated it forward exactly 57 positions to open it.",
    puzzle: "Since the dial wraps every 40 positions, what position does it land on after rotating forward 57 from position 15?",
    choices: ["32", "17", "72", "12"],
    correctIndex: 0,
    wrongBeat: "\"Add the rotation to the starting position first,\" Odette says, \"then divide by 40 and keep only the remainder.\"",
    solvedBeat:
      "15 + 57 = 72, and 72 divided by 40 leaves a remainder of 32. \"Which matches the position it was actually found on,\" Odette says. — A dial that wraps around after a fixed number of positions is modular arithmetic in disguise, the same as a clock face.",
    concept: "Modular Arithmetic (Rotating Lock)",
  },
  {
    id: "museum-6",
    storyId: "museum-heist",
    order: 6,
    sceneText: "The vault's backup lock uses 4 distinct digits chosen from 0 through 9, entered in a specific order, with no repeats.",
    puzzle: "How many different codes are possible for that backup lock?",
    choices: ["5,040", "10,000", "210", "40"],
    correctIndex: 0,
    wrongBeat: "\"Count the choices at each position, in order,\" Odette says. \"Ten for the first digit, then nine left, then eight, then seven — multiply them together.\"",
    solvedBeat:
      "10 × 9 × 8 × 7 = 5,040 possible codes. \"Far too many to guess blind,\" Odette says, \"which means someone already knew it.\" — That's a permutation: every distinct ordering of a set, found by shrinking the choices by one at each step.",
    concept: "Permutations",
  },
  {
    id: "museum-7",
    storyId: "museum-heist",
    order: 7,
    sceneText: "Marcus Webb's own coverage report claims the sensor grid covers 96% of the gallery floor, leaving the remaining area as blind spots.",
    puzzle: "Out of a gallery floor measuring 150 square meters total, how many square meters are blind spots?",
    choices: ["6 square meters", "96 square meters", "14.4 square meters", "4 square meters"],
    correctIndex: 0,
    wrongBeat: "\"Find the uncovered percentage first,\" Odette says, \"100% minus 96%, then apply that percentage to the total floor area.\"",
    solvedBeat:
      "100% − 96% = 4% uncovered, and 4% of 150 is 6 square meters. \"Small,\" Odette says, \"but more than enough room to stand in.\" — Even a small uncovered percentage still translates into real, physical space once you apply it to the actual total.",
    concept: "Percentage",
  },
  {
    id: "museum-8",
    storyId: "museum-heist",
    order: 8,
    sceneText: "The keypad's timing log shows entry attempts spaced exactly the same interval apart: 5, 9, 13, 17 seconds after the first attempt.",
    puzzle: "Following that same pattern, how many seconds after the first attempt would the next entry come?",
    choices: ["21", "20", "19", "23"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each time and the one before it,\" Odette says, \"then add that same gap once more to the last one.\"",
    solvedBeat:
      "Each interval is 4 seconds more than the last, so 17 + 4 = 21 seconds. \"Too steady to be a nervous guess,\" Odette says. \"That's someone who already knew exactly what they were doing.\" — A sequence with the same fixed gap at every step is called an arithmetic sequence.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "museum-9",
    storyId: "museum-heist",
    order: 9,
    sceneText: "The final override panel needs a 3-digit code using digits 1 through 6, with repeats allowed, and the first digit must be even.",
    puzzle: "How many such codes are possible in total?",
    choices: ["108", "216", "36", "18"],
    correctIndex: 0,
    wrongBeat: "\"Count each position's own choices separately, in order,\" Odette says. \"Three even digits for the first slot, then six choices each for the second and third, since repeats are allowed — multiply them all together.\"",
    solvedBeat:
      "3 × 6 × 6 = 108 possible codes. \"Not narrow enough on its own,\" Odette admits, \"but the panel's own memory recorded the exact code used that night.\" — That's the counting principle: multiplying the choices available at each step, in order, to count every possibility at once.",
    concept: "The Counting Principle",
  },
  {
    id: "museum-10",
    storyId: "museum-heist",
    order: 10,
    sceneText: "The two disabled sensors sit at coordinates (10, 14) and (30, 26) on the gallery's floor plan.",
    puzzle: "Using the midpoint formula, what point sits exactly between those two disabled sensors?",
    choices: ["(20, 20)", "(20, 40)", "(15, 20)", "(40, 40)"],
    correctIndex: 0,
    wrongBeat: "\"Average the two x-coordinates separately,\" Odette says, \"then average the two y-coordinates separately.\"",
    solvedBeat:
      "(10+30)/2 = 20, and (14+26)/2 = 20, giving (20, 20). \"Right where the service corridor door sits,\" Odette says slowly. — A midpoint is always the simple average of both points' coordinates, one axis at a time.",
    concept: "Coordinate Geometry (Midpoint Formula)",
  },
];

const CARTOGRAPHER_CLUES: QuestClue[] = [
  {
    id: "cartographer-1",
    storyId: "cartographers-riddle",
    order: 1,
    sceneText: "Drake's notes describe the trail from the study running on a bearing of 60 degrees. At the marked stone, the trail turns 45 degrees further clockwise.",
    puzzle: "What's the trail's new bearing after that turn?",
    choices: ["105°", "15°", "90°", "135°"],
    correctIndex: 0,
    wrongBeat: "\"Add the turn directly onto the original bearing,\" Marisol says, \"since both are measured the same way — clockwise from north.\"",
    solvedBeat:
      "60° + 45° = 105°. \"Exactly the angle marked on the second stone,\" Marisol says. — A compass bearing is just an angle measured clockwise from north, and turning further clockwise simply adds to it.",
    concept: "Compass Bearings",
  },
  {
    id: "cartographer-2",
    storyId: "cartographers-riddle",
    order: 2,
    sceneText:
      "Marisol paces off a 300-meter baseline between the old well and the chapel ruins, both landmarks marked on Drake's map. From the well, the vault sits exactly 400 meters away, on a line that meets the well-to-chapel baseline at a perfect right angle.",
    puzzle: "Using the Pythagorean theorem, how far is the vault from the chapel ruins?",
    choices: ["500 meters", "700 meters", "350 meters", "600 meters"],
    correctIndex: 0,
    wrongBeat: "\"Square both known distances, add them together, then take the square root of that sum,\" Marisol says.",
    solvedBeat:
      "300² + 400² = 90,000 + 160,000 = 250,000, and the square root of 250,000 is exactly 500. \"Triangulating from two fixed points is exactly how Drake always worked,\" Marisol says. — Triangulation uses two known points and the distances or angles between them to pin down a third point exactly.",
    concept: "Triangulation",
  },
  {
    id: "cartographer-3",
    storyId: "cartographers-riddle",
    order: 3,
    sceneText: "Drake's final map is drawn at a scale where 1 centimeter represents 50 meters of real ground. The distance from the well to the vault measures 10 centimeters on the map.",
    puzzle: "How far is that in real meters?",
    choices: ["500 meters", "50 meters", "510 meters", "450 meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the map's measurement by the scale factor,\" Marisol says. \"Don't add the two numbers.\"",
    solvedBeat:
      "10 × 50 = 500 meters, matching your own triangulation exactly. \"Two different methods, the same answer,\" Marisol says. \"That's how you know you can trust it.\" — A map's scale is just a fixed ratio, and reading a real distance off it is one multiplication.",
    concept: "Scale & Proportion",
  },
  {
    id: "cartographer-4",
    storyId: "cartographers-riddle",
    order: 4,
    sceneText: "A trail on Drake's map rises 60 meters in elevation over a horizontal distance of 200 meters.",
    puzzle: "What's the slope of that trail, expressed as rise over run?",
    choices: ["0.3 (or 3/10)", "3.3", "0.03", "6"],
    correctIndex: 0,
    wrongBeat: "\"Divide the rise by the run,\" Marisol says. \"Don't divide the run by the rise, and don't just subtract them.\"",
    solvedBeat:
      "60 ÷ 200 = 0.3. \"A gentle climb, easy walking,\" Marisol says, checking her boots anyway. — Slope is always rise divided by run, telling you exactly how steep something is, however long the actual path.",
    concept: "Slope of a Line (Rise Over Run)",
  },
  {
    id: "cartographer-5",
    storyId: "cartographers-riddle",
    order: 5,
    sceneText:
      "Two marked contour points on Drake's map: one at 100 meters elevation, another 400 meters farther along the trail at 160 meters elevation. The vault marker sits exactly halfway between them.",
    puzzle: "Assuming a steady climb, what elevation should the vault marker sit at?",
    choices: ["130 meters", "150 meters", "120 meters", "140 meters"],
    correctIndex: 0,
    wrongBeat: "\"Average the two elevations directly,\" Marisol says, \"since the point sits exactly halfway between them along a steady climb.\"",
    solvedBeat:
      "(100 + 160) ÷ 2 = 130 meters. \"Right where the old marker stone actually sits,\" Marisol says, brushing off moss. — Interpolating along a steady slope means the value at the midpoint is simply the average of the two ends.",
    concept: "Elevation Interpolation",
  },
  {
    id: "cartographer-6",
    storyId: "cartographers-riddle",
    order: 6,
    sceneText: "On Drake's coordinate grid, the well sits at (10, 20) and the chapel ruins sit at (30, 60).",
    puzzle: "Using the midpoint formula, what point sits exactly halfway between them?",
    choices: ["(20, 40)", "(20, 20)", "(40, 80)", "(15, 30)"],
    correctIndex: 0,
    wrongBeat: "\"Average the two x-coordinates separately,\" Marisol says, \"then average the two y-coordinates separately.\"",
    solvedBeat:
      "(10+30)/2 = 20, and (20+60)/2 = 40, giving (20, 40). \"Right where the trail forks,\" Marisol says. — A midpoint is always the simple average of both points' coordinates, one axis at a time.",
    concept: "Coordinate Geometry (Midpoint Formula)",
  },
  {
    id: "cartographer-7",
    storyId: "cartographers-riddle",
    order: 7,
    sceneText: "Drake's notes describe the search plot as a rectangle 80 meters by 45 meters.",
    puzzle: "What's the total area of that plot?",
    choices: ["3,600 square meters", "1,800 square meters", "2,500 square meters", "4,000 square meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the two side lengths together,\" Marisol says. \"Don't add them.\"",
    solvedBeat:
      "80 × 45 = 3,600 square meters. \"A lot of ground to search without knowing exactly where to dig,\" Marisol says. — The area of a rectangle is always its length times its width.",
    concept: "Area of a Rectangular Plot",
  },
  {
    id: "cartographer-8",
    storyId: "cartographers-riddle",
    order: 8,
    sceneText: "Drake's final map claims the well-to-chapel distance is 400 meters. Marisol's own careful pacing measures it at 420 meters.",
    puzzle: "What percentage error does that represent, compared to Drake's claimed distance?",
    choices: ["5%", "4.8%", "20%", "2%"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual difference first,\" Marisol says, \"then divide that difference by Drake's original claimed distance.\"",
    solvedBeat:
      "420 − 400 = 20 meters off, and 20 ÷ 400 = 5%. \"Small enough to trust the rest of the map,\" Marisol says, relieved. — A percentage error always measures the gap against the original claimed value.",
    concept: "Percentage Error",
  },
  {
    id: "cartographer-9",
    storyId: "cartographers-riddle",
    order: 9,
    sceneText: "A row of numbered survey stakes along the trail reads: 5, 11, 17, 23, ...",
    puzzle: "Following that same pattern, what number should the next stake carry?",
    choices: ["29", "28", "25", "31"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each stake's number and the one before it,\" Marisol says, \"then add that same gap once more.\"",
    solvedBeat:
      "Each stake is 6 more than the last, so 23 + 6 = 29. \"Drake never numbered anything carelessly,\" Marisol says. — A sequence with the same fixed gap at every step is an arithmetic sequence, and its next term is never a guess.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "cartographer-10",
    storyId: "cartographers-riddle",
    order: 10,
    sceneText: "The vault's final marker gives only Drake's outbound bearing to reach it: 130 degrees from the study. Marisol needs the exact return bearing to get back safely in the dark.",
    puzzle: "Using back-bearing = original bearing ± 180°, what's the return bearing from the vault back to the study?",
    choices: ["310°", "50°", "230°", "130°"],
    correctIndex: 0,
    wrongBeat: "\"Add 180 degrees to the original bearing if it's under 180, or subtract 180 if it's over,\" Marisol says. \"The return path is always exactly opposite the outbound one.\"",
    solvedBeat:
      "130° + 180° = 310°. Marisol notes it carefully before the light fails. — A back-bearing is always exactly opposite the original direction, a perfect half-turn of 180 degrees.",
    concept: "Back-Bearing",
  },
];

const GARDEN_CLUES: QuestClue[] = [
  {
    id: "garden-1",
    storyId: "impossible-angles",
    order: 1,
    sceneText:
      "Beatrix shows you Sorrel's own perspective sketch: hedges meant to look identical in height from the garden's entrance, even though they actually get taller the farther back they stand. The nearest hedge is 2 meters tall, sitting 4 meters from the viewing point.",
    puzzle: "If the next hedge sits 8 meters from the viewing point — twice as far — how tall must it be to appear exactly the same height from that same spot?",
    choices: ["4 meters (twice as tall)", "2 meters (same height)", "1 meter (half as tall)", "8 meters (four times as tall)"],
    correctIndex: 0,
    wrongBeat: "\"The ratio of height to distance has to stay exactly the same for the apparent size to match,\" Beatrix says. \"Set up that same ratio and solve for the new height.\"",
    solvedBeat:
      "2/4 = 0.5, and 0.5 × 8 = 4 meters. \"Taller, not shorter, the farther back it stands,\" Beatrix says, startled. \"Everyone assumes distant things always look smaller because they are smaller.\" — Similar triangles keep the same height-to-distance ratio, which is exactly how forced perspective tricks the eye.",
    concept: "Similar Triangles (Forced Perspective)",
  },
  {
    id: "garden-2",
    storyId: "impossible-angles",
    order: 2,
    sceneText: "From the garden entrance, the sightline to the folly's left edge sits 18° to the left of straight ahead; the sightline to its right edge sits 24° to the right of straight ahead.",
    puzzle: "What's the folly's total angular width, as seen from the entrance?",
    choices: ["42°", "6°", "33°", "48°"],
    correctIndex: 0,
    wrongBeat: "\"Add the two angles together,\" Beatrix says, \"since one is measured left of center and the other right of center — together they span the object's full width.\"",
    solvedBeat:
      "18° + 24° = 42°. \"Wider than it has any right to look from here,\" Beatrix says. — Angles measured on opposite sides of a central sightline simply add together to give the total angle spanned.",
    concept: "Angle of View",
  },
  {
    id: "garden-3",
    storyId: "impossible-angles",
    order: 3,
    sceneText: "A stone statue, 2 meters tall in reality, appears a certain apparent size when viewed from 10 meters away. Beatrix wants to know its apparent size from twice that distance.",
    puzzle: "For an object of fixed real size, apparent size is inversely proportional to distance. If you double the viewing distance, what happens to the statue's apparent size?",
    choices: ["It's cut in half", "It stays exactly the same", "It doubles", "It becomes a quarter of the original"],
    correctIndex: 0,
    wrongBeat: "\"Inverse proportion means apparent size and distance move in opposite directions by the exact same factor,\" Beatrix says. \"Doubling one exactly halves the other.\"",
    solvedBeat:
      "Doubling the distance exactly halves the apparent size, for any object of fixed real size. \"Which is exactly the rule Sorrel's folly was built to break,\" Beatrix says. — Inverse proportion means two quantities change by the exact same factor, but in opposite directions.",
    concept: "Inverse Proportion",
  },
  {
    id: "garden-4",
    storyId: "impossible-angles",
    order: 4,
    sceneText: "One of the folly's garden beds is trapezoid-shaped: parallel sides measuring 6 meters and 10 meters, with a height — the distance between them — of 4 meters.",
    puzzle: "What's the area of that trapezoid-shaped bed?",
    choices: ["32 square meters", "40 square meters", "24 square meters", "64 square meters"],
    correctIndex: 0,
    wrongBeat: "\"Average the two parallel sides first,\" Beatrix says, \"then multiply by the height between them.\"",
    solvedBeat:
      "(6+10)/2 = 8, and 8 × 4 = 32 square meters. \"Exactly where the new hedge line was planted last month,\" Beatrix says. — A trapezoid's area is always the average of its two parallel sides, multiplied by the height between them.",
    concept: "Area of a Trapezoid",
  },
  {
    id: "garden-5",
    storyId: "impossible-angles",
    order: 5,
    sceneText: "Sorrel's own design notes call for the folly's rectangular reflecting pool to follow the golden ratio, roughly 1.618, between its length and width.",
    puzzle: "If the pool's width is 3 meters, roughly how long should it be, using that same 1.618 ratio?",
    choices: ["about 4.9 meters", "about 6 meters", "about 3.6 meters", "about 8 meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the width by the ratio itself,\" Beatrix says. \"Don't just tack the ratio's digits onto the width.\"",
    solvedBeat:
      "3 × 1.618 ≈ 4.9 meters. \"Exactly the pool's real measurement,\" Beatrix says, checking the plans. — That ratio, roughly 1.618, is the proportion designers have trusted for centuries to look naturally pleasing.",
    concept: "The Golden Ratio",
  },
  {
    id: "garden-6",
    storyId: "impossible-angles",
    order: 6,
    sceneText: "The hedges installed at the illusion's start measure 3 meters, but the design called for the row to shrink to 2.1 meters at that same point.",
    puzzle: "What percentage below the design height are the installed hedges — or are they above it? Find the size of the difference as a percentage of the design height.",
    choices: ["About 43% above the design height", "About 30% below the design height", "About 43% below the design height", "Exactly on target"],
    correctIndex: 0,
    wrongBeat: "\"Find the actual difference first,\" Beatrix says, \"then divide that difference by the design height, not the installed height.\"",
    solvedBeat:
      "3 − 2.1 = 0.9 meters over, and 0.9 ÷ 2.1 ≈ 43% above the design height. \"Someone stopped trimming these rows to spec weeks ago,\" Beatrix says. — A percentage difference always measures the gap against whichever value you're comparing to, so it matters which one that is.",
    concept: "Percentage Decrease",
  },
  {
    id: "garden-7",
    storyId: "impossible-angles",
    order: 7,
    sceneText: "The illusion's hedges are meant to shrink by the same percentage every row: 8 meters, then 6 meters, then 4.5 meters, ...",
    puzzle: "Following that same shrinking pattern, what height should the next row be?",
    choices: ["3.375 meters", "3 meters", "2.5 meters", "3.5 meters"],
    correctIndex: 0,
    wrongBeat: "\"Check what's actually happening between each height and the next,\" Beatrix says. \"It isn't subtracting a fixed amount — it's multiplying by the same fixed fraction every time.\"",
    solvedBeat:
      "Each height is exactly 0.75 times the one before it, so 4.5 × 0.75 = 3.375 meters. \"Consistent, until it suddenly wasn't,\" Beatrix says, checking the real row against it. — That's a geometric sequence: every term multiplied by the same fixed ratio, rather than reduced by a fixed amount.",
    concept: "Geometric Sequences",
  },
  {
    id: "garden-8",
    storyId: "impossible-angles",
    order: 8,
    sceneText: "The maze is meant to be perfectly symmetric across its central path. One hedge on the left sits at coordinates (3, 5) relative to that center line.",
    puzzle: "What coordinates should its mirrored twin on the right occupy, reflected across the center line at x = 0?",
    choices: ["(-3, 5)", "(3, -5)", "(-3, -5)", "(5, 3)"],
    correctIndex: 0,
    wrongBeat: "\"Reflecting across a vertical center line flips the sign of the x-coordinate only,\" Beatrix says. \"The y-coordinate stays exactly the same.\"",
    solvedBeat:
      "Reflecting (3, 5) across x = 0 gives (-3, 5) — same height, opposite side. \"Which is exactly where a hedge is missing,\" Beatrix says, checking the plan against the real maze. — A reflection across a line flips only the coordinate measured perpendicular to that line, and leaves the other exactly as it was.",
    concept: "Reflection & Symmetry",
  },
  {
    id: "garden-9",
    storyId: "impossible-angles",
    order: 9,
    sceneText: "One of the folly's garden beds is circular, with a radius of 5 meters.",
    puzzle: "Using circumference = 2πr (with π ≈ 3.14), what's the distance around that circular bed?",
    choices: ["31.4 meters", "15.7 meters", "78.5 meters", "10 meters"],
    correctIndex: 0,
    wrongBeat: "\"Circumference is 2 times π times the radius,\" Beatrix says. \"Not π times the radius alone, and not the radius squared.\"",
    solvedBeat:
      "2 × 3.14 × 5 = 31.4 meters. \"Doesn't match its neighbors at all,\" Beatrix says, comparing it to the plan. — Circumference is exactly the distance around a full circle, once around, however large that circle is.",
    concept: "Circumference",
  },
  {
    id: "garden-10",
    storyId: "impossible-angles",
    order: 10,
    sceneText: "Sorrel's final notebook page works out where a person would need to stand to see straight through the one gap in the hedge illusion: a sightline 2 meters tall at a hedge sitting 6 meters away, matched against the folly's own hidden gap sitting 15 meters away.",
    puzzle: "Using that same height-to-distance ratio, how tall would an obstruction at 15 meters need to be to close that same sightline?",
    choices: ["5 meters", "3.6 meters", "4.5 meters", "7.5 meters"],
    correctIndex: 0,
    wrongBeat: "\"Set up the ratio from the known hedge first — height over distance,\" Beatrix says, \"then apply that same ratio to the new distance.\"",
    solvedBeat:
      "2/6 = 1/3, and 15 × (1/3) = 5 meters. \"Which is exactly one meter shorter than the hedge that's actually standing there,\" Beatrix says slowly. \"That's the gap.\" — The same similar-triangle ratio that builds an illusion can also be used to find exactly where it breaks.",
    concept: "Similar Triangles (Forced Perspective)",
  },
];

const LOST_CITY_CLUES: QuestClue[] = [
  {
    id: "lost-city-1",
    storyId: "lost-city-numbers",
    order: 1,
    sceneText: "Itzel translates a carved number from the old counting priests' base-20 system: it reads \"3, 12\" — meaning 3 groups of twenty, plus 12 more.",
    puzzle: "What single ordinary (base-10) number does \"3, 12\" represent in base 20?",
    choices: ["72", "312", "60", "32"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the first group by 20 first,\" Itzel says, \"then add the second number as the leftover — don't just read the digits side by side like a base-10 number.\"",
    solvedBeat:
      "3 × 20 + 12 = 72. \"They counted in twenties, not tens,\" Itzel says. \"Fingers and toes together, most likely.\" — Any place-value system works the same way, whether it groups by tens, or by the twenty these builders happened to prefer.",
    concept: "Base-20 (Vigesimal) Numbers",
  },
  {
    id: "lost-city-2",
    storyId: "lost-city-numbers",
    order: 2,
    sceneText: "A second carved number reads \"2, 0, 5\" in the priests' three-position system — but the middle position is marked with a special shell symbol, their own sign for nothing at all in that place.",
    puzzle: "In a base-20 system, what does \"2, 0, 5\" actually equal, given that the shell simply means zero in that position?",
    choices: ["805", "25", "400", "2005"],
    correctIndex: 0,
    wrongBeat: "\"The first position is worth 20×20=400, the middle is worth 20, and the last is worth 1,\" Itzel says. \"Multiply each digit by its own position's value, even when that digit is zero, and add them all together.\"",
    solvedBeat:
      "2 × 400 + 0 × 20 + 5 × 1 = 800 + 0 + 5 = 805. \"Without a symbol for zero, that middle position would be impossible to read at all,\" Itzel says. \"They worked that out independently, centuries before anyone in Europe did.\" — Zero as a genuine placeholder is one of the great, quietly revolutionary ideas in the whole history of counting.",
    concept: "Zero as a Placeholder",
  },
  {
    id: "lost-city-3",
    storyId: "lost-city-numbers",
    order: 3,
    sceneText: "A circular jungle temple stands 6 meters in radius and 10 meters tall.",
    puzzle: "Using volume = π × radius² × height (with π ≈ 3.14), roughly what's the temple's total volume?",
    choices: ["about 1,130 cubic meters", "about 360 cubic meters", "about 1,884 cubic meters", "about 600 cubic meters"],
    correctIndex: 0,
    wrongBeat: "\"Square the radius first, multiply by π,\" Itzel says, \"then multiply that whole result by the height.\"",
    solvedBeat:
      "3.14 × 36 × 10 ≈ 1,130 cubic meters. \"Enormous, even by these builders' standards,\" Itzel says. — The volume of a cylinder is always π times the radius squared, times the height, whatever the actual size.",
    concept: "Volume of a Cylinder",
  },
  {
    id: "lost-city-4",
    storyId: "lost-city-numbers",
    order: 4,
    sceneText: "A stone door lock only opens when set to the two prime factors of 323, larger one first.",
    puzzle: "What are the two prime factors of 323, larger first?",
    choices: ["19, then 17", "23, then 14", "17, then 19", "29, then 11"],
    correctIndex: 0,
    wrongBeat: "\"Test small primes against 323 one at a time,\" Itzel says. \"It won't split evenly by 2, 3, 5, 7, 11, or 13 — but keep going, it does split evenly somewhere.\"",
    solvedBeat:
      "323 = 17 × 19 — the door clicks open on 19, then 17. \"They trusted arithmetic no guard could ever be bribed around,\" Itzel says. — Breaking a number down into the primes that build it is factorization, the same idea this lock just borrowed for its own purposes.",
    concept: "Prime Factorization",
  },
  {
    id: "lost-city-5",
    storyId: "lost-city-numbers",
    order: 5,
    sceneText: "A carved relief shows figures in a strict ratio: for every 3 priests carved, there are 5 offerings depicted.",
    puzzle: "If a longer relief shows 20 offerings carved in that same ratio, how many priests does it show?",
    choices: ["12 priests", "15 priests", "8 priests", "20 priests"],
    correctIndex: 0,
    wrongBeat: "\"Find how many times the offerings' own ratio-part fits into 20,\" Itzel says, \"then apply that same multiple to the priests' ratio-part.\"",
    solvedBeat:
      "20 offerings is 4 times the ratio's \"5 parts,\" so priests scale the same way: 3 × 4 = 12. \"Consistent, carving after carving,\" Itzel says. — A ratio holds steady no matter how large the actual scene gets, as long as every part scales by the same multiple.",
    concept: "Ratio & Proportion",
  },
  {
    id: "lost-city-6",
    storyId: "lost-city-numbers",
    order: 6,
    sceneText: "The vault's final stone door needs a 3-symbol combination chosen from the priests' 5 sacred glyphs, repeats allowed, in a specific order.",
    puzzle: "How many different combinations are possible?",
    choices: ["125", "15", "60", "243"],
    correctIndex: 0,
    wrongBeat: "\"Count the choices at each position separately, in order,\" Itzel says. \"Five choices each time, since repeats are allowed — multiply them all together.\"",
    solvedBeat:
      "5 × 5 × 5 = 125 possible combinations. \"Not narrow enough alone,\" Itzel admits, \"but the door's own wear pattern shows exactly which three glyphs get touched most.\" — That's the counting principle: multiplying the choices available at each step, in order, to count every possibility at once.",
    concept: "The Counting Principle",
  },
  {
    id: "lost-city-7",
    storyId: "lost-city-numbers",
    order: 7,
    sceneText: "Itzel estimates the central plaza, originally 500 square meters of exposed stone, now has only 320 square meters still visible above the jungle growth.",
    puzzle: "What percentage of the plaza is now covered by overgrowth?",
    choices: ["36%", "64%", "18%", "44%"],
    correctIndex: 0,
    wrongBeat: "\"Find the covered amount first,\" Itzel says, \"original minus what's still visible, then divide that by the original total.\"",
    solvedBeat:
      "500 − 320 = 180 square meters covered, and 180 ÷ 500 = 36%. \"More than a third, reclaimed just since the city was abandoned,\" Itzel says. — A percentage like this always measures the covered amount against the original total.",
    concept: "Percentage",
  },
  {
    id: "lost-city-8",
    storyId: "lost-city-numbers",
    order: 8,
    sceneText: "A stepped pyramid's stone courses are stacked in a triangular pattern: 1, then 3, then 6, then 10 blocks per course, moving up.",
    puzzle: "Following that same pattern, how many blocks make up the next course?",
    choices: ["15", "14", "12", "21"],
    correctIndex: 0,
    wrongBeat: "\"Look at how much each total grows by, not the totals themselves,\" Itzel says. \"2, then 3, then 4 more each time — so the next jump should be one more than the last.\"",
    solvedBeat:
      "The growth steps are 2, 3, 4, and next comes 5 — so 10 + 5 = 15. \"The same shape as stacking cannonballs into a pyramid,\" Itzel says, \"just built centuries before anyone called it that.\" — Each triangular number is simply the sum of all counting numbers up to that point.",
    concept: "Triangular Numbers",
  },
  {
    id: "lost-city-9",
    storyId: "lost-city-numbers",
    order: 9,
    sceneText: "The city's circular ceremonial plaza measures 14 meters in radius.",
    puzzle: "Using area = π × radius² (with π ≈ 3.14), roughly what's the plaza's total area?",
    choices: ["about 615 square meters", "about 88 square meters", "about 1,230 square meters", "about 196 square meters"],
    correctIndex: 0,
    wrongBeat: "\"Square the radius first, then multiply by π,\" Itzel says. \"Don't multiply the radius by π first and stop there.\"",
    solvedBeat:
      "3.14 × 14² = 3.14 × 196 ≈ 615 square meters. \"Room enough for the whole city to gather at once,\" Itzel says. — The area of a circle is always π times its radius squared, however large the circle actually is.",
    concept: "Area of a Circle",
  },
  {
    id: "lost-city-10",
    storyId: "lost-city-numbers",
    order: 10,
    sceneText: "The final vault door has no numbers on it at all — only the priests' own glyphs, reading \"4, 15\" in their base-20 notation.",
    puzzle: "What single ordinary (base-10) number does \"4, 15\" represent in base 20?",
    choices: ["95", "415", "60", "75"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the first group by 20,\" Itzel says, \"then add the second number as the leftover.\"",
    solvedBeat:
      "4 × 20 + 15 = 95. Itzel turns the stone dial to exactly 95, and something ancient finally shifts loose. — The same place-value trick works at any scale, once you trust the numbers instead of guessing at the glyphs.",
    concept: "Base-20 (Vigesimal) Numbers",
  },
];

const LEDGER_CLUES: QuestClue[] = [
  {
    id: "ledger-1",
    storyId: "alexandria-ledger",
    order: 1,
    sceneText: "Nefret points to a column heading in Philemon's ledger, written the old way: \"MCDXLVII\" denarii.",
    puzzle: "What's MCDXLVII in ordinary numbers?",
    choices: ["1,447", "1,497", "1,400", "1,543"],
    correctIndex: 0,
    wrongBeat: "\"Work through the numerals left to right,\" Nefret says. \"Subtract a smaller value placed before a larger one, add otherwise — M is 1000, CD is 400, XL is 40, VII is 7.\"",
    solvedBeat:
      "M (1000) + CD (400) + XL (40) + VII (7) = 1,447. \"Exactly the sum missing from last month's tally,\" Nefret says. — Roman numerals combine addition and subtraction depending on which symbol comes first, smaller before larger meaning subtract.",
    concept: "Roman Numeral Conversion",
  },
  {
    id: "ledger-2",
    storyId: "alexandria-ledger",
    order: 2,
    sceneText: "Two entries in the ledger need to be added together: \"CCXLIV\" denarii from one shipment, and \"CXVIII\" from another.",
    puzzle: "What's CCXLIV plus CXVIII, in ordinary numbers?",
    choices: ["362", "352", "372", "342"],
    correctIndex: 0,
    wrongBeat: "\"Convert each Roman numeral to an ordinary number first,\" Nefret says, \"then add the two ordinary numbers together — don't try to add the numerals symbol by symbol.\"",
    solvedBeat:
      "244 + 118 = 362. \"The safest way to add these old numerals is to translate first, and only then add,\" Nefret says. — Roman numerals were never really built for arithmetic — converting to a place-value system first makes any calculation far more reliable.",
    concept: "Roman Numeral Arithmetic",
  },
  {
    id: "ledger-3",
    storyId: "alexandria-ledger",
    order: 3,
    sceneText: "Philemon's own bookkeeping rule: total debits must always exactly equal total credits. Today's page lists debits of 850 denarii, but credits sum to only 790.",
    puzzle: "How many denarii are missing to bring the page back into balance?",
    choices: ["60 denarii", "140 denarii", "790 denarii", "850 denarii"],
    correctIndex: 0,
    wrongBeat: "\"Subtract the smaller total from the larger one,\" Nefret says. \"The gap between them is exactly what's unaccounted for.\"",
    solvedBeat:
      "850 − 790 = 60 denarii unaccounted for. \"The first page where it doesn't balance,\" Nefret says grimly. — A ledger only tells the truth when both sides genuinely match; any gap between them is real money that needs explaining.",
    concept: "Balancing an Equation",
  },
  {
    id: "ledger-4",
    storyId: "alexandria-ledger",
    order: 4,
    sceneText: "Philemon lent 500 denarii to a client at a simple interest rate of 8% per year.",
    puzzle: "Using simple interest = principal × rate × time, how much interest would that loan earn over 3 years?",
    choices: ["120 denarii", "40 denarii", "540 denarii", "1,200 denarii"],
    correctIndex: 0,
    wrongBeat: "\"Multiply the principal by the rate first,\" Nefret says, \"then multiply that result by the number of years — don't apply the rate more than once per year on its own.\"",
    solvedBeat:
      "500 × 0.08 × 3 = 120 denarii. \"Which matches exactly what Berenice still owes, interest included,\" Nefret says. — Simple interest grows by the very same fixed amount every year, unlike compounding, which builds on itself.",
    concept: "Simple Interest",
  },
  {
    id: "ledger-5",
    storyId: "alexandria-ledger",
    order: 5,
    sceneText: "The counting-house's total holdings should be 4,000 denarii. After today's count, only 3,760 denarii can actually be found.",
    puzzle: "What percentage of the total holdings is missing?",
    choices: ["6%", "24%", "4%", "94%"],
    correctIndex: 0,
    wrongBeat: "\"Find the missing amount first,\" Nefret says, \"the expected total minus what's actually there, then divide that gap by the expected total.\"",
    solvedBeat:
      "4,000 − 3,760 = 240 denarii missing, and 240 ÷ 4,000 = 6%. \"Small enough to hide, if no one ever checked closely,\" Nefret says. — A percentage like this always measures the missing amount against the total it was supposed to be part of.",
    concept: "Percentage",
  },
  {
    id: "ledger-6",
    storyId: "alexandria-ledger",
    order: 6,
    sceneText: "A shipment paid partly in Alexandrian drachmas and partly in Roman denarii, exchanged at a rate of 4 drachmas to every 1 denarius.",
    puzzle: "If a payment comes to 60 drachmas, how many denarii is that worth at the same rate?",
    choices: ["15 denarii", "240 denarii", "64 denarii", "56 denarii"],
    correctIndex: 0,
    wrongBeat: "\"Divide by the exchange rate, since you're converting from drachmas back to denarii,\" Nefret says. \"Don't multiply the two together.\"",
    solvedBeat:
      "60 ÷ 4 = 15 denarii. \"Merchants who mixed that up got cheated at every counting-house on this coast,\" Nefret says. — An exchange rate is simply a ratio, and converting through it correctly depends on which direction you're actually converting.",
    concept: "Ratio & Proportion",
  },
  {
    id: "ledger-7",
    storyId: "alexandria-ledger",
    order: 7,
    sceneText: "One entry reads \"CCCXII\" denarii received, and a second entry below it reads \"LXXV\" denarii returned as a refund.",
    puzzle: "What's CCCXII minus LXXV, in ordinary numbers?",
    choices: ["237", "247", "227", "387"],
    correctIndex: 0,
    wrongBeat: "\"Convert both numerals to ordinary numbers first,\" Nefret says, \"then subtract the smaller amount from the larger one.\"",
    solvedBeat:
      "312 − 75 = 237. \"The true net amount, once you actually do the subtraction,\" Nefret says. — Just like addition, subtracting Roman numerals directly is far riskier than converting them first.",
    concept: "Roman Numeral Arithmetic",
  },
  {
    id: "ledger-8",
    storyId: "alexandria-ledger",
    order: 8,
    sceneText: "Two shipments arrive: 40 amphorae worth 12 denarii each, and 60 amphorae worth 20 denarii each.",
    puzzle: "What's the weighted average value per amphora across both shipments combined?",
    choices: ["16.8 denarii", "16 denarii", "18 denarii", "15 denarii"],
    correctIndex: 0,
    wrongBeat: "\"Multiply each shipment's count by its own value first, add both totals together, then divide by the combined count,\" Nefret says. \"Don't just average the two prices directly.\"",
    solvedBeat:
      "(40 × 12) + (60 × 20) = 480 + 1,200 = 1,680 denarii total, divided by 100 amphorae, is 16.8 denarii each. \"Not simply the middle of 12 and 20,\" Nefret notes, \"because there were more of the pricier ones.\" — A weighted average accounts for how much of each part there actually is, not just how many parts there are.",
    concept: "Weighted Average",
  },
  {
    id: "ledger-9",
    storyId: "alexandria-ledger",
    order: 9,
    sceneText: "Kaeso's own small accounts, month by month, show a suspicious pattern: 15, 22, 29, 36 denarii \"adjusted\" each month.",
    puzzle: "Following that same pattern, how many denarii would next month's entry show?",
    choices: ["43", "42", "40", "45"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each month's amount and the one before it,\" Nefret says, \"then add that same gap once more to the last one.\"",
    solvedBeat:
      "Each month is 7 denarii more than the last, so 36 + 7 = 43. \"Steady, deliberate, month after month,\" Nefret says. \"Not a mistake anyone makes by accident.\" — A sequence with the same fixed gap at every step is called an arithmetic sequence.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "ledger-10",
    storyId: "alexandria-ledger",
    order: 10,
    sceneText: "Philemon's final page works out an equation for the true embezzled total: 4x + 60 = 232, where x represents years of steady skimming.",
    puzzle: "Solving for x, what number was Philemon working out?",
    choices: ["43", "58", "73", "35"],
    correctIndex: 0,
    wrongBeat: "\"Isolate x by undoing each step in reverse,\" Nefret says. \"Subtract 60 from both sides first, then divide by 4.\"",
    solvedBeat:
      "232 − 60 = 172, and 172 ÷ 4 = 43. \"Forty-three denarii, skimmed the same way, year after year,\" Nefret says quietly. — Solving an equation for an unknown is just undoing, one careful step at a time, whatever was done to build it.",
    concept: "Solving a Linear Equation",
  },
];

const LIBRARY_CLUES: QuestClue[] = [
  {
    id: "library-1",
    storyId: "sunken-library",
    order: 1,
    sceneText: "Delia's dive computer confirms the old rule: water pressure increases by 1 atmosphere for every 10 meters of depth, on top of the 1 atmosphere already pressing down at the surface.",
    puzzle: "What's the total pressure, in atmospheres, at a depth of 30 meters?",
    choices: ["4 atmospheres", "3 atmospheres", "30 atmospheres", "10 atmospheres"],
    correctIndex: 0,
    wrongBeat: "\"Start from the 1 atmosphere already present at the surface,\" Delia says, \"then add one more atmosphere for every 10 meters of depth.\"",
    solvedBeat:
      "1 + (30 ÷ 10) = 4 atmospheres. \"Four times what your lungs are used to,\" Delia says, checking her gauge. — Pressure underwater builds steadily and predictably with depth, the same relationship at any dive site.",
    concept: "Pressure at Depth",
  },
  {
    id: "library-2",
    storyId: "sunken-library",
    order: 2,
    sceneText: "Delia's tank holds 200 units of air. At this depth, she's using it at a steady rate of 25 units per minute.",
    puzzle: "How many minutes of air does she have remaining?",
    choices: ["8 minutes", "25 minutes", "175 minutes", "5 minutes"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total air remaining by the rate it's being used,\" Delia says. \"Don't multiply the two together.\"",
    solvedBeat:
      "200 ÷ 25 = 8 minutes. \"Which is exactly how long we have to find this chamber,\" Delia says, checking the clock. — Dividing a total supply by its rate of use always tells you how much time is actually left.",
    concept: "Air Consumption Rate",
  },
  {
    id: "library-3",
    storyId: "sunken-library",
    order: 3,
    sceneText: "Seawater has a density of about 1.03 grams per cubic centimeter. A carved stone tablet Delia recovers has a density of 2.7 grams per cubic centimeter.",
    puzzle: "Since the tablet's density is greater than seawater's, what should happen if it's released underwater?",
    choices: ["It sinks", "It floats", "It stays exactly where it's released", "It dissolves"],
    correctIndex: 0,
    wrongBeat: "\"An object denser than the fluid around it always sinks,\" Delia says. \"An object less dense always floats — compare the two densities directly.\"",
    solvedBeat:
      "2.7 is greater than 1.03, so the tablet sinks, exactly as it should. \"Which is exactly why it's still down here after all this time,\" Delia says. — Buoyancy always comes down to comparing an object's density to the fluid around it.",
    concept: "Buoyancy",
  },
  {
    id: "library-4",
    storyId: "sunken-library",
    order: 4,
    sceneText: "The first submerged chamber measures 8 meters long, 5 meters wide, and 3 meters tall.",
    puzzle: "What's the total volume of that chamber?",
    choices: ["120 cubic meters", "40 cubic meters", "16 cubic meters", "96 cubic meters"],
    correctIndex: 0,
    wrongBeat: "\"Multiply all three dimensions together,\" Delia says. \"Length times width times height.\"",
    solvedBeat:
      "8 × 5 × 3 = 120 cubic meters. \"Enough room to have held an entire archive,\" Delia says. — The volume of any rectangular room is simply its length times its width times its height.",
    concept: "Volume of a Rectangular Chamber",
  },
  {
    id: "library-5",
    storyId: "sunken-library",
    order: 5,
    sceneText: "Delia's notes give a chamber's pressure reading as 5.5 atmospheres total.",
    puzzle: "Using the same rule — 1 atmosphere at the surface, plus 1 more for every 10 meters of depth — how deep is that chamber?",
    choices: ["45 meters", "55 meters", "50 meters", "40 meters"],
    correctIndex: 0,
    wrongBeat: "\"Subtract the 1 surface atmosphere first,\" Delia says, \"then multiply the remainder by 10 meters per atmosphere.\"",
    solvedBeat:
      "5.5 − 1 = 4.5, and 4.5 × 10 = 45 meters. \"Deeper than anyone's ever dived here safely,\" Delia says, checking her equipment. — Reversing a rate calculation just means undoing each step in the opposite order it was built.",
    concept: "Unit Conversion (Pressure to Depth)",
  },
  {
    id: "library-6",
    storyId: "sunken-library",
    order: 6,
    sceneText: "Delia's tank started this dive with 200 units of air. She now has 55 units left.",
    puzzle: "What percentage of her original air supply remains?",
    choices: ["27.5%", "55%", "72.5%", "45%"],
    correctIndex: 0,
    wrongBeat: "\"Divide what's left by the original full amount,\" Delia says, \"then convert that fraction into a percentage.\"",
    solvedBeat:
      "55 ÷ 200 = 0.275, or 27.5%. \"Barely a quarter left,\" Delia says, checking the gauge twice. — A percentage remaining is always the current amount divided by the original total.",
    concept: "Percentage",
  },
  {
    id: "library-7",
    storyId: "sunken-library",
    order: 7,
    sceneText: "Safe diving practice limits ascent to no more than 9 meters per minute. Delia is currently at 45 meters and needs to surface.",
    puzzle: "At that maximum safe rate, what's the minimum time her ascent should take?",
    choices: ["5 minutes", "9 minutes", "45 minutes", "4 minutes"],
    correctIndex: 0,
    wrongBeat: "\"Divide the total depth by the maximum safe rate per minute,\" Delia says. \"Don't multiply the two together.\"",
    solvedBeat:
      "45 ÷ 9 = 5 minutes, minimum. \"Rushing it is exactly how divers get hurt,\" Delia says, checking her own dive plan. — Dividing a distance by a rate always tells you the time needed to safely cover it.",
    concept: "Rate & Time",
  },
  {
    id: "library-8",
    storyId: "sunken-library",
    order: 8,
    sceneText: "Delia's light meter shows brightness halving every 5 meters of depth: 800, then 400, then 200, then 100 units, ...",
    puzzle: "Following that same halving pattern, what reading comes next?",
    choices: ["50", "75", "25", "60"],
    correctIndex: 0,
    wrongBeat: "\"Check what's actually happening between each reading and the next,\" Delia says. \"It isn't subtracting a fixed amount — it's multiplying by the same fixed fraction every time.\"",
    solvedBeat:
      "Each reading is exactly half the one before it, so 100 ÷ 2 = 50. \"Which is why we brought our own light down here at all,\" Delia says. — That's a geometric sequence: every term multiplied by the same fixed ratio, rather than reduced by a fixed amount.",
    concept: "Geometric Sequences",
  },
  {
    id: "library-9",
    storyId: "sunken-library",
    order: 9,
    sceneText: "A row of numbered archive shelves, carved into the chamber wall, reads: 4, 9, 14, 19, ...",
    puzzle: "Following that same pattern, what number should the next shelf carry?",
    choices: ["24", "23", "22", "26"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each shelf's number and the one before it,\" Delia says, \"then add that same gap once more.\"",
    solvedBeat:
      "Each shelf is 5 more than the last, so 19 + 5 = 24. \"They numbered everything, right down to the last scroll,\" Delia says. — A sequence with the same fixed gap at every step is an arithmetic sequence, and its next term is never a guess.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "library-10",
    storyId: "sunken-library",
    order: 10,
    sceneText: "The final chamber's marker carves an equation directly into the stone: 1 + d ÷ 10 = 6.8, where d is the depth in meters.",
    puzzle: "Solving for d, how deep is the final chamber?",
    choices: ["58 meters", "68 meters", "60 meters", "48 meters"],
    correctIndex: 0,
    wrongBeat: "\"Isolate d by undoing each step in reverse,\" Delia says. \"Subtract 1 from both sides first, then multiply by 10.\"",
    solvedBeat:
      "6.8 − 1 = 5.8, and 5.8 × 10 = 58 meters. Delia checks her gauge one final time before the descent. — Solving an equation for an unknown is just undoing, one careful step at a time, whatever was done to build it.",
    concept: "Solving a Linear Equation",
  },
];

const MANUSCRIPT_CLUES: QuestClue[] = [
  {
    id: "manuscript-1",
    storyId: "vanishing-manuscript",
    order: 1,
    sceneText: "Brother Teodor's manuscript begins with a sequence he calls \"the rabbit problem\": 1, 1, 2, 3, 5, 8, 13, ...",
    puzzle: "Following that same pattern — each number the sum of the two before it — what comes next after 13?",
    choices: ["21", "18", "20", "26"],
    correctIndex: 0,
    wrongBeat: "\"Add the two most recent numbers together to get the next one,\" Aldric says, \"not the two before those.\"",
    solvedBeat:
      "8 + 13 = 21. \"He called this his rabbit problem,\" Aldric says, tracing the numbers. \"Counting how quickly a single pair could multiply.\" — Each term in this sequence is simply the sum of the two terms right before it, a pattern that turns up again and again throughout the natural world.",
    concept: "The Fibonacci Sequence",
  },
  {
    id: "manuscript-2",
    storyId: "vanishing-manuscript",
    order: 2,
    sceneText: "Teodor's margin notes divide consecutive pairs from his sequence: 13 divided by 8, then 21 divided by 13, each landing closer and closer to the very same number.",
    puzzle: "Roughly what number do those ratios keep approaching, the further along the sequence you go?",
    choices: ["about 1.618", "about 1.5", "about 2", "about 1.414"],
    correctIndex: 0,
    wrongBeat: "\"Divide a few consecutive pairs yourself,\" Aldric says, \"and watch where the results start to settle — they get closer to the same value the further into the sequence you go.\"",
    solvedBeat:
      "13/8 ≈ 1.625, and 21/13 ≈ 1.615 — both closing in on roughly 1.618. \"The same proportion carved into half the cathedrals in Europe,\" Aldric says, awed. — The ratio between consecutive Fibonacci numbers approaches the golden ratio more and more closely the further along the sequence you look.",
    concept: "The Golden Ratio",
  },
  {
    id: "manuscript-3",
    storyId: "vanishing-manuscript",
    order: 3,
    sceneText: "Teodor's manuscript compares two ways of writing the very same number: \"MCMXCVIII\" beside a simpler mark, \"1998.\"",
    puzzle: "What does MCMXCVIII actually equal?",
    choices: ["1,998", "1,898", "1,988", "1,908"],
    correctIndex: 0,
    wrongBeat: "\"Work through the numerals left to right,\" Aldric says, \"subtracting a smaller value placed before a larger one — M is 1000, CM is 900, XC is 90, VIII is 8.\"",
    solvedBeat:
      "1,000 + 900 + 90 + 8 = 1,998. \"Nine separate symbols,\" Aldric says, \"against just four with the new numerals. He wrote whole pages proving the new way was simply better.\" — The very same number, written two completely different ways, is exactly the comparison that made this manuscript so controversial.",
    concept: "Roman Numeral Conversion",
  },
  {
    id: "manuscript-4",
    storyId: "vanishing-manuscript",
    order: 4,
    sceneText: "Teodor's notes explain the new numerals' real advantage: in \"4,725,\" the digit 7 doesn't just mean seven — its position tells you it actually means seven hundred.",
    puzzle: "In the number 4,725, what does the digit 2 actually represent?",
    choices: ["Twenty (2 tens)", "Two", "Two hundred", "Two thousand"],
    correctIndex: 0,
    wrongBeat: "\"Look at exactly which position the 2 sits in,\" Aldric says. \"The tens place, not the ones place or the hundreds place.\"",
    solvedBeat:
      "The 2 sits in the tens place, so it represents twenty. \"Roman numerals never worked this way,\" Aldric says. \"Every symbol always meant the same fixed amount, no matter where you put it.\" — Place value means the very same digit can represent wildly different amounts, purely depending on where it sits.",
    concept: "Place Value",
  },
  {
    id: "manuscript-5",
    storyId: "vanishing-manuscript",
    order: 5,
    sceneText: "Teodor's manuscript walks through multiplying 24 by 13 using the new numerals, step by step.",
    puzzle: "What's 24 times 13?",
    choices: ["312", "288", "302", "324"],
    correctIndex: 0,
    wrongBeat: "\"Break the multiplication into parts using place value,\" Aldric says, \"24 times 10, plus 24 times 3, then add the two results together.\"",
    solvedBeat:
      "24 × 10 = 240, and 24 × 3 = 72, so 240 + 72 = 312. \"Try that same multiplication in Roman numerals sometime,\" Aldric says, half-laughing. \"He included that comparison too, for exactly this reason.\" — Place value makes even fairly large multiplications straightforward, breaking them down into simple, manageable steps.",
    concept: "Multiplication",
  },
  {
    id: "manuscript-6",
    storyId: "vanishing-manuscript",
    order: 6,
    sceneText: "Further into the manuscript, Teodor's sequence continues past where the torn page picks back up: ..., 34, 55, 89, ...",
    puzzle: "Following that same pattern, what number comes right after 89?",
    choices: ["144", "134", "124", "154"],
    correctIndex: 0,
    wrongBeat: "\"Add the two most recent numbers together,\" Aldric says. \"55 and 89, this time.\"",
    solvedBeat:
      "55 + 89 = 144. \"It never once breaks its own rule,\" Aldric says, checking the torn edge against the next surviving page. — The same simple rule — each term the sum of the two before it — carries the sequence forward indefinitely, however far you extend it.",
    concept: "The Fibonacci Sequence",
  },
  {
    id: "manuscript-7",
    storyId: "vanishing-manuscript",
    order: 7,
    sceneText: "The monastery's own grain stores should hold 600 measures. After the winter count, only 522 measures remain.",
    puzzle: "What percentage of the grain stores is missing?",
    choices: ["13%", "22%", "87%", "10%"],
    correctIndex: 0,
    wrongBeat: "\"Find the missing amount first,\" Aldric says, \"the expected total minus what's actually there, then divide that gap by the expected total.\"",
    solvedBeat:
      "600 − 522 = 78 measures missing, and 78 ÷ 600 = 13%. \"More than anyone accounted for at harvest,\" Aldric says. — A percentage like this always measures the missing amount against the total it was supposed to be part of.",
    concept: "Percentage",
  },
  {
    id: "manuscript-8",
    storyId: "vanishing-manuscript",
    order: 8,
    sceneText: "The manuscript's own illuminated border follows a strict proportion: for every 5 units of height, the border runs 8 units wide.",
    puzzle: "If a smaller illustration follows that same ratio and measures 15 units tall, how wide should it be?",
    choices: ["24 units", "20 units", "18 units", "27 units"],
    correctIndex: 0,
    wrongBeat: "\"Find how many times the height's own ratio-part fits into 15,\" Aldric says, \"then apply that same multiple to the width's ratio-part.\"",
    solvedBeat:
      "15 is 3 times the ratio's \"5 parts,\" so width scales the same way: 8 × 3 = 24 units. \"The same careful proportion, page after page,\" Aldric says. — A ratio holds steady no matter how large the actual illustration gets, as long as every part scales by the same multiple.",
    concept: "Ratio & Proportion",
  },
  {
    id: "manuscript-9",
    storyId: "vanishing-manuscript",
    order: 9,
    sceneText: "Teodor's final chapter contrasts his rabbit sequence against a very different pattern: a single debt doubling every year — 10, 20, 40, 80 gold coins, ...",
    puzzle: "Following that same doubling pattern, what would the debt be after one more year?",
    choices: ["160 gold coins", "120 gold coins", "100 gold coins", "150 gold coins"],
    correctIndex: 0,
    wrongBeat: "\"Check what's actually happening between each amount and the next,\" Aldric says. \"It isn't adding a fixed amount — it's multiplying by the same fixed amount every time.\"",
    solvedBeat:
      "Each year is exactly double the last, so 80 × 2 = 160 gold coins. \"He wanted to show how differently two patterns can grow,\" Aldric says, \"even starting from numbers that don't look so different.\" — That's a geometric sequence, growing by repeated multiplication rather than repeated addition, and it can outpace almost anything remarkably fast.",
    concept: "Geometric Sequences",
  },
  {
    id: "manuscript-10",
    storyId: "vanishing-manuscript",
    order: 10,
    sceneText: "The manuscript's final page hides its true location in one last rabbit-sequence riddle: the missing page number is the sequence's own next term after 144, 233.",
    puzzle: "Following the same pattern — each term the sum of the two before it — what page number comes next?",
    choices: ["377", "367", "357", "387"],
    correctIndex: 0,
    wrongBeat: "\"Add the two most recent numbers together,\" Aldric says. \"144 and 233, this time.\"",
    solvedBeat:
      "144 + 233 = 377. Aldric turns straight to page 377, and there, tucked into the binding, the manuscript's own missing final leaf. — The same rule that built the whole sequence from its very first pair still holds, no matter how far along you carry it.",
    concept: "The Fibonacci Sequence",
  },
];

const MARKET_CLUES: QuestClue[] = [
  {
    id: "market-1",
    storyId: "floating-market-trail",
    order: 1,
    sceneText: "Sula counts 6 vendor stalls scattered across the floating market, and every single stall connects to every other stall by its own direct boat route.",
    puzzle: "How many direct boat routes connect all 6 stalls to each other, counting each route only once?",
    choices: ["15 routes", "30 routes", "6 routes", "12 routes"],
    correctIndex: 0,
    wrongBeat: "\"Count how many routes lead out from each stall,\" Sula says, \"multiply by the number of stalls, then divide by 2 so you're not counting each route twice.\"",
    solvedBeat:
      "6 × 5 ÷ 2 = 15 distinct routes. \"More paths through here than most people ever notice,\" Sula says. — Connecting every point to every other point once each is exactly the classic handshake problem, and it always works out to n times n-minus-one, divided by two.",
    concept: "Graph Theory (Counting Connections)",
  },
  {
    id: "market-2",
    storyId: "floating-market-trail",
    order: 2,
    sceneText: "Two routes lead to the spice vendor's stall: one running 3 stops of 40 meters each, the other running straight across in a single 150-meter crossing.",
    puzzle: "Which route is shorter, and by how much?",
    choices: ["The 3-stop route, by 30 meters", "The straight crossing, by 30 meters", "They're exactly equal", "The 3-stop route, by 10 meters"],
    correctIndex: 0,
    wrongBeat: "\"Find the total distance of each route separately first,\" Sula says, \"then compare the two totals directly.\"",
    solvedBeat:
      "3 × 40 = 120 meters for the winding route, which is 30 meters shorter than the single 150-meter crossing. \"Longer looking doesn't always mean longer,\" Sula says, steering that way instead. — Comparing routes always comes down to adding up each one's own total distance and setting them side by side.",
    concept: "Shortest Path",
  },
  {
    id: "market-3",
    storyId: "floating-market-trail",
    order: 3,
    sceneText: "Sula needs to visit exactly 3 of the market's 7 spice stalls today, in any order — order doesn't matter, only which three she picks.",
    puzzle: "How many different groups of 3 stalls could she choose from those 7?",
    choices: ["35", "21", "210", "7"],
    correctIndex: 0,
    wrongBeat: "\"Since order doesn't matter here, don't just multiply 7×6×5,\" Sula says. \"That counts every group multiple times over — divide by the number of ways to reorder the 3 you picked.\"",
    solvedBeat:
      "7×6×5 = 210 ordered picks, divided by 3×2×1 = 6 ways to reorder any 3 of them, giving 35 distinct groups. \"Even narrowing it down, there's no shortage of choices,\" Sula says. — That's a combination: counting groups where order truly doesn't matter, unlike a permutation.",
    concept: "Combinations",
  },
  {
    id: "market-4",
    storyId: "floating-market-trail",
    order: 4,
    sceneText: "The market's main loop runs along four connected docks: 80 meters, 65 meters, 90 meters, and 55 meters.",
    puzzle: "What's the total distance all the way around that loop?",
    choices: ["290 meters", "270 meters", "310 meters", "300 meters"],
    correctIndex: 0,
    wrongBeat: "\"Add up all four dock lengths together,\" Sula says. \"The full trip around covers every single one of them.\"",
    solvedBeat:
      "80 + 65 + 90 + 55 = 290 meters, all the way around. \"A long paddle, if you're doing the whole loop,\" Sula says. — A perimeter is just the total distance around a shape's outer edge, all sides added together.",
    concept: "Perimeter",
  },
  {
    id: "market-5",
    storyId: "floating-market-trail",
    order: 5,
    sceneText: "Upriver, goods are priced in copper rings; downriver, the same goods are priced in silver beads, exchanged at a rate of 6 copper rings to 1 silver bead.",
    puzzle: "How many silver beads would a price of 42 copper rings be worth, at that same rate?",
    choices: ["7 silver beads", "36 silver beads", "48 silver beads", "252 silver beads"],
    correctIndex: 0,
    wrongBeat: "\"Divide by the exchange rate,\" Sula says, \"since you're converting from copper rings to silver beads, not the other way around.\"",
    solvedBeat:
      "42 ÷ 6 = 7 silver beads. \"Traders who mix that up get cheated at every stall on this river,\" Sula says. — An exchange rate is simply a ratio, and converting through it correctly depends on which direction you're actually converting.",
    concept: "Ratio & Proportion",
  },
  {
    id: "market-6",
    storyId: "floating-market-trail",
    order: 6,
    sceneText: "Five small market islands are connected by bridges: enough bridges that every island connects directly to every other island, exactly once each.",
    puzzle: "How many bridges does that take in total?",
    choices: ["10 bridges", "20 bridges", "5 bridges", "25 bridges"],
    correctIndex: 0,
    wrongBeat: "\"Count how many bridges lead out from each island,\" Sula says, \"multiply by the number of islands, then divide by 2 so you're not counting each bridge twice.\"",
    solvedBeat:
      "5 × 4 ÷ 2 = 10 bridges. \"Every one of them worth crossing at least once,\" Sula says. — The same handshake formula works for bridges between islands as it does for routes between stalls: n times n-minus-one, divided by two.",
    concept: "Graph Theory (Counting Connections)",
  },
  {
    id: "market-7",
    storyId: "floating-market-trail",
    order: 7,
    sceneText: "A boat arrives with 150 units of cargo. By the time it reaches the far stall, 18 units have spoiled in the heat.",
    puzzle: "What percentage of the cargo spoiled along the way?",
    choices: ["12%", "18%", "15%", "8%"],
    correctIndex: 0,
    wrongBeat: "\"Divide the amount that spoiled by the original total cargo,\" Sula says, \"then convert that fraction into a percentage.\"",
    solvedBeat:
      "18 ÷ 150 = 0.12, or 12%. \"Better than most boats manage on a hot day,\" Sula says. — A percentage like this always measures the spoiled amount against the original total.",
    concept: "Percentage",
  },
  {
    id: "market-8",
    storyId: "floating-market-trail",
    order: 8,
    sceneText: "A row of numbered buoys marking the channel reads: 6, 13, 20, 27, ...",
    puzzle: "Following that same pattern, what number should the next buoy carry?",
    choices: ["34", "33", "31", "36"],
    correctIndex: 0,
    wrongBeat: "\"Find the fixed gap between each buoy's number and the one before it,\" Sula says, \"then add that same gap once more.\"",
    solvedBeat:
      "Each buoy is 7 more than the last, so 27 + 7 = 34. \"Whoever set these never once broke the pattern,\" Sula says. — A sequence with the same fixed gap at every step is an arithmetic sequence, and its next term is never a guess.",
    concept: "Arithmetic Sequences",
  },
  {
    id: "market-9",
    storyId: "floating-market-trail",
    order: 9,
    sceneText: "One stall sells 25 kilograms of rice at 4 coins per kilogram; another sells 75 kilograms at 8 coins per kilogram.",
    puzzle: "What's the weighted average price per kilogram across both stalls combined?",
    choices: ["7 coins per kilogram", "6 coins per kilogram", "6.5 coins per kilogram", "8 coins per kilogram"],
    correctIndex: 0,
    wrongBeat: "\"Multiply each stall's weight by its own price first,\" Sula says, \"add both totals together, then divide by the combined weight. Don't just average the two prices directly.\"",
    solvedBeat:
      "(25 × 4) + (75 × 8) = 100 + 600 = 700 coins total, divided by 100 kilograms, is 7 coins per kilogram. \"Closer to the busier stall's price, since there was so much more of it,\" Sula notes. — A weighted average accounts for how much of each part there actually is, not just how many parts there are.",
    concept: "Weighted Average",
  },
  {
    id: "market-10",
    storyId: "floating-market-trail",
    order: 10,
    sceneText: "The final marker gives only a network: 8 stalls, connected so that every stall reaches every other stall by exactly one direct route.",
    puzzle: "Using that same connection formula, how many total routes make up this final network?",
    choices: ["28 routes", "56 routes", "8 routes", "64 routes"],
    correctIndex: 0,
    wrongBeat: "\"Apply the same formula as before,\" Sula says. \"Number of points times one less than that number, divided by two.\"",
    solvedBeat:
      "8 × 7 ÷ 2 = 28 routes. Sula counts them off on the map, one by one, until the twenty-eighth leads somewhere new entirely. — The same handshake formula scales to any number of connected points, however large the network gets.",
    concept: "Graph Theory (Counting Connections)",
  },
];

export function cluesForStory(storyId: string): QuestClue[] {
  return [...QUEST_CLUES, ...STATISTICIAN_CLUES, ...PIRATES_COVE_CLUES, ...CHESSBOARD_CLUES, ...LIGHTHOUSE_CLUES, ...CRYPTOGRAPHER_CLUES, ...SKY_CHART_CLUES, ...CLOCKMAKER_CLUES, ...PHARAOH_CLUES, ...CONSERVATORY_CLUES, ...SILK_ROAD_CLUES, ...CARNIVAL_CLUES, ...ICE_VAULT_CLUES, ...ARCHITECT_CLUES, ...CANYON_CLUES, ...MUSEUM_CLUES, ...CARTOGRAPHER_CLUES, ...GARDEN_CLUES, ...LOST_CITY_CLUES, ...LEDGER_CLUES, ...LIBRARY_CLUES, ...MANUSCRIPT_CLUES, ...MARKET_CLUES]
    .filter((c) => c.storyId === storyId)
    .sort((a, b) => a.order - b.order);
}
