// Playful display labels for the kids/teen/college/adult learner-level values.
// The underlying value (sent to the backend, stored in conversations, used as
// demo_topics.json field-name suffixes) stays "kids"/"teen"/"college"/"adult"
// — only what's shown in the UI changes here.
export const LEVEL_LABELS: Record<string, string> = {
  kids: "🌱 Sprout",
  teen: "🌿 Sapling",
  college: "🌳 Rooted",
  adult: "🌲 Evergreen",
};

export function levelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level[0].toUpperCase() + level.slice(1);
}
