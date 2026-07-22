import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { streamChat, type ChatMsg } from "./api";
import { voice, type VoiceStatus } from "./voice";

function Bubble({ role, content }: ChatMsg) {
  return (
    <div className={`bubble ${role}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content || "…"}
      </ReactMarkdown>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [vstatus, setVstatus] = useState<VoiceStatus | null>(null);
  const stopDictation = useRef<(() => void) | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    voice.detect().then(setVstatus);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo(0, scroller.current.scrollHeight);
  }, [messages]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    let full = "";
    try {
      await streamChat(q, history, (tok) => {
        full += tok;
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      });
    } catch (err) {
      full = `⚠️ ${(err as Error).message}`;
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: "assistant", content: full };
        return copy;
      });
    } finally {
      setBusy(false);
      if (speak && full && !full.startsWith("⚠️")) void voice.speak(full);
    }
  }

  async function toggleMic() {
    if (listening) {
      stopDictation.current?.();
      return;
    }
    stopDictation.current = await voice.startDictation(
      (t) => {
        setInput(t);
        // auto-send what was dictated
        void send(t);
      },
      setListening
    );
  }

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scroller}>
        {messages.length === 0 && (
          <div className="empty">
            Ask Euclid anything in mathematics. Replies stream in real time — turn on 🔊 to
            hear them, or 🎤 to talk.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <button
          type="button"
          className={`icon ${listening ? "on" : ""}`}
          title={`Voice input (${vstatus?.detail ?? "detecting…"})`}
          onClick={() => void toggleMic()}
        >
          {listening ? "⏹" : "🎤"}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Ask a math question…"}
          disabled={busy}
        />
        <button
          type="button"
          className={`icon ${speak ? "on" : ""}`}
          title="Speak replies aloud"
          onClick={() => {
            if (speak) voice.cancel();
            setSpeak((s) => !s);
          }}
        >
          🔊
        </button>
        <button type="submit" className="send" disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>
      <div className="vhint">
        Voice: {vstatus?.detail ?? "detecting…"}
        {vstatus?.backend === "browser" && " — run Voicebox for local neural voices"}
      </div>
    </div>
  );
}
