// Discover engine client — Feynman "discover any topic yourself" path.

export interface Discovery {
  topic: string;
  know: string;
  question: string;
  byhand: string;
  discover: string;
  explain: string;
  prerequisites: string[];
  unlocks: string[];
  related: string[];
}

export async function discover(topic: string, level: string): Promise<Discovery> {
  const resp = await fetch("/api/ai/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, level }),
  });
  if (!resp.ok) {
    const detail = (await resp.json().catch(() => ({}))).detail;
    throw new Error(detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}
