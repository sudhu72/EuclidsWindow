// Shared voice-input/voice-output buttons, built on the voice service in
// ./voice (Voicebox when running locally, browser Web Speech API otherwise —
// works with zero install). Drop a MicButton next to any text input and a
// SpeakButton next to any generated text to give it voice I/O.
import { useEffect, useRef, useState } from "react";
import { voice, type VoiceStatus } from "./voice";

export function MicButton({
  onDictate,
  onListening,
  disabled,
}: {
  /** Called with the transcribed text once dictation ends. */
  onDictate: (text: string) => void;
  /** Optional: told whenever listening starts/stops, for a "Listening…" placeholder etc. */
  onListening?: (listening: boolean) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const stopDictation = useRef<(() => void) | null>(null);

  useEffect(() => {
    voice.detect().then(setStatus);
  }, []);

  function setListeningBoth(l: boolean) {
    setListening(l);
    onListening?.(l);
  }

  async function toggle() {
    if (listening) {
      stopDictation.current?.();
      return;
    }
    stopDictation.current = await voice.startDictation(onDictate, setListeningBoth);
  }

  return (
    <button
      type="button"
      className={`icon ${listening ? "on" : ""}`}
      title={`Voice input (${status?.detail ?? "detecting…"})`}
      aria-label="Dictate with your voice"
      onClick={() => void toggle()}
      disabled={disabled}
    >
      {listening ? "⏹" : "🎤"}
    </button>
  );
}

export function SpeakButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [speaking, setSpeaking] = useState(false);

  async function toggle() {
    if (speaking) {
      voice.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await voice.speak(text);
    setSpeaking(false);
  }

  return (
    <button
      type="button"
      className={`icon ${speaking ? "on" : ""}`}
      title="Read this aloud"
      aria-label="Read this aloud"
      onClick={() => void toggle()}
      disabled={disabled || !text.trim()}
    >
      {speaking ? "⏹" : "🔊"}
    </button>
  );
}
