// Pólya "How to Solve It" coach client — start a session, then coach per phase.

export interface PolyaStart {
  restated: string;
  problem_type: string;
  opening: string;
  questions: string[];
}

export interface PolyaCoach {
  feedback: string;
  hint: string;
  ready: boolean;
  suggestions: string[];
  verified: boolean;
  revised: boolean;
}

export async function polyaStart(
  problem: string,
  level: string,
  difficulty: string
): Promise<PolyaStart> {
  return post("/api/ai/polya/start", { problem, level, difficulty });
}

export async function polyaCoach(args: {
  problem: string;
  phase: string;
  user_input: string;
  notes?: string;
  level: string;
  difficulty: string;
  stuck?: boolean;
}): Promise<PolyaCoach> {
  return post("/api/ai/polya/coach", args);
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const detail = (await resp.json().catch(() => ({}))).detail;
    throw new Error(detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}
