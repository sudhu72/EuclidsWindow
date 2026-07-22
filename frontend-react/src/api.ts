// Streaming chat client — reads the /api/chat/stream SSE and delivers tokens
// as they arrive so the UI renders the reply in real time.

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
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
