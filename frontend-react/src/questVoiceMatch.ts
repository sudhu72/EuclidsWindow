// Fuzzy-match a dictated answer to one of several multiple-choice options.
// Shared by QuestClue.tsx and QuestCheckpoint.tsx (originally written inline
// in QuestStage.tsx).
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/** Returns the matched choice index, or null if confidence is too low. */
export function matchChoice(said: string, choices: string[]): number | null {
  const saidN = normalize(said);
  if (!saidN) return null;
  const letters = ["a", "b", "c", "d"];
  const letterIdx = letters.indexOf(saidN.replace(/^option\s+/, ""));
  if (letterIdx >= 0 && letterIdx < choices.length) return letterIdx;

  let best = -1;
  let bestScore = 0;
  choices.forEach((c, i) => {
    const cn = normalize(c);
    let score = 0;
    if (cn === saidN) score = 100;
    else if (cn.includes(saidN) || saidN.includes(cn)) score = 60 + Math.min(cn.length, saidN.length);
    else {
      const cWords = new Set(cn.split(" ").filter(Boolean));
      const overlap = saidN.split(" ").filter((w) => cWords.has(w)).length;
      score = overlap * 15;
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 20 ? best : null;
}
