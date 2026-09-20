// The prologue for each flagship story — sets the scene, introduces the full
// cast up front with their visible motives, and plants the specific facts
// (measurements, times, names) that later clues and checkpoints reuse. This
// is the "fair play" convention classic detective fiction runs on: nothing
// at the final reveal should be information the player couldn't have had
// all along.
export interface QuestCastEntry {
  name: string;
  detail: string;
}

export interface QuestIntro {
  storyId: string;
  sceneText: string; // markdown — the full prologue
  cast: QuestCastEntry[];
}

export const QUEST_INTROS: QuestIntro[] = [
  {
    storyId: "night-train-murder",
    sceneText:
      "**The Meridian Express, somewhere in the mountains, well past midnight.**\n\n" +
      "The train lurches to a final stop, buried nose-first in a snowdrift. It will not move again before morning. You are a consulting mathematician, three carriages back from the private compartments, when Rosalind — the young conductor's aide — knocks on your door, out of breath. \"There's been a death, sir. Mr. Victor Ashford. His door was locked from the inside, and the doctor says he's been gone for hours. The nearest police are a day away by road, and stuck same as we are by rail. The conductor asks if you'll look into it before anyone's memory of tonight gets any less reliable.\"\n\n" +
      "You agree, and Rosalind lays out what's already known. Ashford was last seen alive at **11:00 PM**, in the dining car, arguing quietly with someone she couldn't identify. He owned a controlling share in a shipping firm, and was, by every account, a man with a gift for making enemies. The train is seven carriages long, each measuring exactly **18 meters**, with Ashford's compartment in the fourth. Only five other passengers are travelling in this section tonight, and none of them could have left the train.",
    cast: [
      {
        name: "Madame Dubois",
        detail: "A jewel dealer, several months behind on a considerable debt to Ashford.",
      },
      {
        name: "Colonel Price",
        detail: "A retired officer. Rosalind mentions, in passing, an old business dealing gone sour between the two men — \"years ago now, but he's never been quiet about it after a drink.\"",
      },
      {
        name: "Mr. Henley",
        detail: "Ashford's business partner. Under the terms of their partnership, Ashford's shares pass to Henley outright if Ashford dies without a will — and Ashford, everyone agrees, never got around to writing one.",
      },
      {
        name: "Lady Winslow",
        detail: "A socialite travelling alone. Rosalind notices she's been avoiding Ashford all evening, though she can't say why.",
      },
      {
        name: "Jenkins",
        detail: "The train's porter — unusually tall, well-liked by the staff, seemingly with nothing at all to gain from Ashford's death.",
      },
    ],
  },
  {
    storyId: "euclid-trail",
    sceneText:
      "**A dig site outside Alexandria, at the edge of an old olive grove.**\n\n" +
      "Elena, your guide and translator, has spent three years chasing rumors of a society that once called itself the Keepers of the Elements — a small circle who, the old letters say, guarded something Euclid himself asked to be hidden after his death: not his famous public work, copied and taught for two thousand years, but something else entirely. \"Every trial they built tests the same idea,\" Elena tells you, unrolling a fragile translated fragment. \"They only ever trusted a path forward when its claim was true *without exception* — not true sometimes, not true for one example you happened to think of, but true for every case, always. That was the whole test. Anyone who couldn't tell the difference was never meant to get further.\"\n\n" +
      "The fragment describes the trial in three stages: first, three tests of geometry and number, cut into stone along the entry passage; then a fork with three carved paths, only one of them real; then, deeper still, a locked vault, and beyond it, three final sealed chambers. \"If the letters are right,\" Elena says, \"whatever's inside was never meant for everyone — only for whoever was patient enough to check every claim properly, all the way down.\"",
    cast: [
      {
        name: "Elena",
        detail: "Your guide and translator — she reads the old Greek inscriptions faster than you can work out the mathematics behind them.",
      },
      {
        name: "The Keepers of the Elements",
        detail: "The old society that built this place. Long gone, but their one rule survives in every trial: trust only what's true without exception.",
      },
    ],
  },
  {
    storyId: "statisticians-gambit",
    sceneText:
      "**An insurance company's archive, eight o'clock in the evening.**\n\n" +
      "You are an independent forensic statistician, called in after hours because the firm's own people can't agree on what they're looking at. Miss Eleanor Voss, a senior clerk in the actuarial department, has been found dead in the archive vault — and everyone already knows why she was down there. For the past several weeks, Voss had been quietly building a case that a decade of insurance claims had been systematically inflated, the fraud so well hidden it took someone who genuinely understood the company's own numbers to even notice the pattern.\n\n" +
      "Mr. Pratt, a junior clerk young enough to still be shaken by it, walks you through what's known. The police surgeon puts her body temperature at **30°C** at 8 PM, in a vault that runs unusually cold. Voss's own private ledgers, still spread across her desk, show the fraud pattern rising steadily, quarter after quarter, for **twelve straight quarters**. Five people had access to the archive that evening.",
    cast: [
      {
        name: "Mr. Abernathy",
        detail: "The firm's chief actuary. If Voss's fraud discovery goes public, it discredits an entire decade of his own pricing models.",
      },
      {
        name: "Mrs. Calloway",
        detail: "Head of claims. Every fraudulent payout in Voss's files was approved through her department, over her own signature.",
      },
      {
        name: "Mr. Devereux",
        detail: "A junior clerk who owed Voss a considerable personal debt — she had quietly lent him money some months back.",
      },
      {
        name: "Miss Fairweather",
        detail: "The company owner's daughter, set to inherit the firm outright — a firm whose reputation, and value, depends on this fraud staying buried.",
      },
      {
        name: "Mr. Griggs",
        detail: "The night watchman. Keys to every door in the building, and — as far as anyone can tell — nothing at all to gain from Miss Voss's death.",
      },
    ],
  },
  {
    storyId: "pirates-cove",
    sceneText:
      "**A hidden cove, somewhere no chart quite agrees on.**\n\n" +
      "Bess has been chasing this cove for the better part of ten years — ever since she was young enough to still believe the stories about Captain Corvin Blackwater's lost hoard. \"Most captains hid their treasure behind a riddle or a threat,\" she tells you, unrolling the map's tattered second half across a flat rock. \"Blackwater hid his behind mathematics. He never trusted a crew he couldn't verify, and he trusted words even less — half his own men couldn't read. Numbers, angles, ropes and tides: those, he trusted completely, because they can't lie to you the way a person can.\"\n\n" +
      "The map marks the cove's entrance stone, a tide that cycles fully every **6 hours**, and — scrawled almost as an afterthought in the margin — a moon-cycle marking of **4 hours** that Bess admits she's never been able to make sense of. \"Every trial on this island tests the same thing,\" she says. \"Whether you check your answer properly, or just guess and hope. Blackwater built this whole cove to separate the two kinds of people.\"",
    cast: [
      {
        name: "Bess",
        detail: "Your guide, and the only person alive who's made it this far into the cove before — though never past it.",
      },
      {
        name: "Captain Corvin Blackwater",
        detail: "Dead a century now. Built this cove's trials himself, trusting arithmetic over any living crew member.",
      },
    ],
  },
];

export function introForStory(storyId: string): QuestIntro | undefined {
  return QUEST_INTROS.find((i) => i.storyId === storyId);
}
