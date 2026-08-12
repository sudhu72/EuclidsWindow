// Streaming chat client — reads the /api/chat/stream SSE and delivers tokens
// as they arrive so the UI renders the reply in real time.

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Follow-ups and takeaways, delivered once the answer is complete. */
export interface TutorAids {
  takeaways: string[];
  next_questions: string[];
}

/** What the tutor used to answer, reported before any text arrives. */
export interface TutorMeta {
  source: "curated" | "llm";
  topic_id: string;
  learner_level: string;
  library_grounded: boolean;
}

/**
 * Streaming tutor — same SSE shape as streamChat, but hits /api/ai/tutor/stream
 * so the answer carries the full tutor grounding (curated catalog, uploaded
 * library/RAG, concept graph, learner level) instead of the concept graph alone.
 */
export async function streamTutor(
  question: string,
  opts: {
    history?: ChatMsg[];
    learnerLevel?: string;
    sessionId?: string;
    onMeta?: (m: TutorMeta) => void;
    onAids?: (a: TutorAids) => void;
  },
  onToken: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const resp = await fetch("/api/ai/tutor/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      history: opts.history ?? [],
      learner_level: opts.learnerLevel ?? "teen",
      session_id: opts.sessionId,
    }),
    signal,
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`tutor stream failed: HTTP ${resp.status}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(line.slice(5).trim());
      } catch {
        continue; // ignore a malformed frame rather than killing the stream
      }
      if (data.meta) opts.onMeta?.(data.meta as TutorMeta);
      if (data.t) onToken(data.t as string);
      if (data.error) throw new Error(String(data.error));
      if (data.done) {
        opts.onAids?.({
          takeaways: (data.takeaways as string[]) ?? [],
          next_questions: (data.next_questions as string[]) ?? [],
        });
        return;
      }
    }
  }
}

export async function streamChat(
  message: string,
  history: ChatMsg[],
  onToken: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const resp = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`chat stream failed: HTTP ${resp.status}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const data = JSON.parse(line.slice(5).trim());
        if (data.t) onToken(data.t as string);
        if (data.error) throw new Error(data.error);
        if (data.done) return;
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}
