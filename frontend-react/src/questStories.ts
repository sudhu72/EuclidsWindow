// A comprehensive list of selectable story wrappers for Math Quest. Each
// story shares the same underlying engine, graph, and per-category flavor
// text as its theme (mystery = detective, treasure = explorer) -- only the
// title/setting/blurb differ, so this stays a handful of short strings
// (bounded content, same principle as quest_flavor.json's chapter blurbs)
// rather than 16x the node-level content.
import type { QuestTheme } from "./questApi";

export interface QuestStory {
  id: string;
  theme: QuestTheme;
  title: string;
  blurb: string;
  setting: string;
  /** "ready" stories are fully hand-authored and playable; "soon" are announced but not yet built. */
  status: "ready" | "soon";
}

export const QUEST_STORIES: QuestStory[] = [
  // --- Murder mysteries (deductive logic, detective skin) ------------------
  {
    id: "missing-proof",
    status: "ready",
    theme: "mystery",
    title: "The Case of the Missing Proof",
    blurb: "Euclid's own lost proof has vanished from the Library of Alexandria the night before it was to be unveiled.",
    setting: "Ancient Alexandria",
  },
  {
    id: "observatory-murder",
    status: "ready",
    theme: "mystery",
    title: "Murder at the Observatory",
    blurb: "An astronomer is found dead beside an unfinished star chart — the killer left a trail of numbers, not words.",
    setting: "A 19th-century observatory",
  },
  {
    id: "vanishing-manuscript",
    status: "ready",
    theme: "mystery",
    title: "The Vanishing Manuscript",
    blurb: "A monastery's only copy of a forbidden theorem disappears the same night a monk is found unconscious in the scriptorium.",
    setting: "A medieval monastery",
  },
  {
    id: "clockmakers-secret",
    status: "ready",
    theme: "mystery",
    title: "The Clockmaker's Secret",
    blurb: "A master clockmaker is found dead in a workshop full of gears that shouldn't be able to move the way they do.",
    setting: "A clockmaker's workshop",
  },
  {
    id: "alexandria-ledger",
    status: "ready",
    theme: "mystery",
    title: "The Alexandria Ledger",
    blurb: "A merchant's coded ledger is the only evidence of a break-in — and the only motive anyone can find.",
    setting: "A merchant's counting-house",
  },
  {
    id: "locked-dome",
    status: "ready",
    theme: "mystery",
    title: "The Locked Observatory Dome",
    blurb: "A body is found inside a dome that was locked from within, beside a slowly turning brass orrery.",
    setting: "A locked-room observatory",
  },
  {
    id: "cryptographers-curse",
    status: "ready",
    theme: "mystery",
    title: "The Cryptographer's Curse",
    blurb: "A wartime codebreaker's final message is a cipher nobody has cracked — until now.",
    setting: "A wartime codebreaking office",
  },
  {
    id: "impossible-angles",
    status: "ready",
    theme: "mystery",
    title: "The Garden of Impossible Angles",
    blurb: "A landscaper's death hides inside a geometric folly that shouldn't be able to exist on flat ground.",
    setting: "A formal garden maze",
  },
  {
    id: "conservatory-killing",
    status: "ready",
    theme: "mystery",
    title: "The Conservatory Killing",
    blurb: "A conductor is found dead mid-rehearsal — the last page of the score is written in numbers, not notes.",
    setting: "A grand symphony hall",
  },
  {
    id: "blood-on-the-chessboard",
    status: "ready",
    theme: "mystery",
    title: "Blood on the Chessboard",
    blurb: "A grandmaster dies mid-tournament, and the final position on the board is the only statement he left behind.",
    setting: "An international chess championship",
  },
  {
    id: "architects-folly",
    status: "ready",
    theme: "mystery",
    title: "The Architect's Folly",
    blurb: "A building collapses mid-construction — someone tampered with the calculations, and the blueprints don't lie.",
    setting: "A half-built skyscraper",
  },
  {
    id: "carnival-of-lost-souls",
    status: "ready",
    theme: "mystery",
    title: "The Carnival of Lost Souls",
    blurb: "A fortune-teller's rigged booth hides a killer's trick — and the trick is pure, cold mathematics.",
    setting: "A traveling carnival",
  },
  {
    id: "night-train-murder",
    status: "ready",
    theme: "mystery",
    title: "Murder on the Night Train",
    blurb: "A passenger is found dead in a locked compartment, and the timetable everyone trusted doesn't add up.",
    setting: "An overnight express train",
  },
  {
    id: "statisticians-gambit",
    status: "ready",
    theme: "mystery",
    title: "The Statistician's Gambit",
    blurb: "An actuary is killed the night after uncovering fraud hidden deep inside a decade of company numbers.",
    setting: "An insurance company's archive",
  },
  {
    id: "museum-heist",
    status: "ready",
    theme: "mystery",
    title: "The Museum Heist",
    blurb: "A priceless artifact vanishes from behind a security system its own designer called unbreakable.",
    setting: "A city museum after hours",
  },

  // --- Treasure hunts (explorer skin) ---------------------------------------
  {
    id: "euclid-trail",
    status: "ready",
    theme: "treasure",
    title: "The Euclid Trail",
    blurb: "Follow Euclid's own footsteps across ancient Greece, decoding the landmarks he left behind.",
    setting: "Ancient Greece",
  },
  {
    id: "lost-city-numbers",
    status: "ready",
    theme: "treasure",
    title: "The Lost City of Numbers",
    blurb: "A jungle ruin is encoded entirely in mathematics — every doorway is a puzzle, not a lock.",
    setting: "A jungle ruin",
  },
  {
    id: "pirates-cove",
    status: "ready",
    theme: "treasure",
    title: "Pirate's Cove",
    blurb: "A pirate captain's treasure map uses angles and ratios instead of words — sloppier crews never made it past the first cove.",
    setting: "A pirate's hidden cove",
  },
  {
    id: "pharaohs-vault",
    status: "ready",
    theme: "treasure",
    title: "The Pharaoh's Vault",
    blurb: "A pyramid's inner chambers are sealed by mathematical locks left by builders who trusted numbers more than guards.",
    setting: "A pyramid's inner chambers",
  },
  {
    id: "sunken-library",
    status: "ready",
    theme: "treasure",
    title: "The Sunken Library",
    blurb: "An underwater ruin holds the last surviving copies of texts everyone thought were lost forever.",
    setting: "A sunken library",
  },
  {
    id: "sky-chart-expedition",
    status: "ready",
    theme: "treasure",
    title: "The Sky Chart Expedition",
    blurb: "Ancient astronomers left a star map pointing to a hidden cache — you just have to read the sky the way they did.",
    setting: "A mountaintop expedition camp",
  },
  {
    id: "silk-road-cipher",
    status: "ready",
    theme: "treasure",
    title: "The Silk Road Cipher",
    blurb: "Every waypoint on this old trade route hides a number puzzle left by merchants protecting their route.",
    setting: "An ancient trade route",
  },
  {
    id: "clockwork-mountain",
    status: "ready",
    theme: "treasure",
    title: "The Clockwork Mountain",
    blurb: "An old mechanical vault is buried deep inside a mountain, built entirely from gears, ratios, and one very old sense of humor.",
    setting: "A mountain's mechanical vault",
  },
  {
    id: "cartographers-riddle",
    status: "ready",
    theme: "treasure",
    title: "The Cartographer's Riddle",
    blurb: "A mapmaker died before finishing his final map — the blank corner is exactly where the vault should be.",
    setting: "A retired cartographer's study",
  },
  {
    id: "ice-vault-expedition",
    status: "ready",
    theme: "treasure",
    title: "The Ice Vault Expedition",
    blurb: "A melting glacier is uncovering a sealed vault no one has seen in centuries — and you're racing the thaw.",
    setting: "A retreating glacier",
  },
  {
    id: "desert-star-compass",
    status: "ready",
    theme: "treasure",
    title: "The Desert Star Compass",
    blurb: "A nomadic star-reading tradition marks the way to a hidden oasis, if you can read the sky like they did.",
    setting: "A vast desert at night",
  },
  {
    id: "floating-market-trail",
    status: "ready",
    theme: "treasure",
    title: "The Floating Market Trail",
    blurb: "Every vendor on this river market holds one piece of a number puzzle, and none of them will simply tell you.",
    setting: "A river floating market",
  },
  {
    id: "vineyards-buried-fortune",
    status: "ready",
    theme: "treasure",
    title: "The Vineyard's Buried Fortune",
    blurb: "A centuries-old vineyard hides a fortune behind a chain of harvest-record riddles no heir ever solved.",
    setting: "An old hillside vineyard",
  },
  {
    id: "lighthouse-keepers-code",
    status: "ready",
    theme: "treasure",
    title: "The Lighthouse Keeper's Code",
    blurb: "A retired keeper's logbook encodes the exact location of a shipwreck's treasure, one tide table at a time.",
    setting: "A remote coastal lighthouse",
  },
  {
    id: "canyon-of-echoes",
    status: "ready",
    theme: "treasure",
    title: "The Canyon of Echoes",
    blurb: "A canyon's strange acoustics hide a puzzle that only gives up its answer to careful, patient math.",
    setting: "A deep desert canyon",
  },
];

export function storyById(id: string): QuestStory | undefined {
  return QUEST_STORIES.find((s) => s.id === id);
}
