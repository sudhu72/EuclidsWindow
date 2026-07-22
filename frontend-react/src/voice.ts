// Two-way voice for the tutor. Prefers Voicebox (local, via the backend proxy at
// /api/voice/*); falls back to the browser's Web Speech API so voice works even
// when Voicebox isn't running. Adapted from the Oracle project's voice service.

export type VoiceStatus = {
  backend: "voicebox" | "browser" | "none";
  profiles: string[];
  detail: string;
};

class VoiceService {
  private status: VoiceStatus | null = null;
  private browserVoices: SpeechSynthesisVoice[] = [];

  async detect(): Promise<VoiceStatus> {
    let voicebox = false;
    let profiles: string[] = [];
    try {
      const r = await fetch("/api/voice/status");
      const d = await r.json();
      voicebox = !!d.voicebox?.reachable;
      profiles = d.voicebox?.profiles ?? [];
    } catch {
      /* backend down — try browser */
    }
    const hasBrowserTTS = typeof window !== "undefined" && "speechSynthesis" in window;
    if (voicebox) {
      this.status = { backend: "voicebox", profiles, detail: "Voicebox (local)" };
    } else if (hasBrowserTTS) {
      this.status = { backend: "browser", profiles: [], detail: "browser Web Speech" };
    } else {
      this.status = { backend: "none", profiles: [], detail: "no voice available" };
    }
    if (hasBrowserTTS) this.browserVoices = window.speechSynthesis.getVoices();
    return this.status;
  }

  getStatus(): VoiceStatus | null {
    return this.status;
  }

  cancel() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // ---- TTS ----
  async speak(text: string, profile?: string): Promise<void> {
    const clean = text.trim().slice(0, 1200);
    if (!clean) return;
    if (this.status?.backend === "voicebox") {
      try {
        const r = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, profile: profile ?? null }),
        });
        if (r.ok) {
          await this.playBlob(await r.blob());
          return;
        }
      } catch {
        /* fall through to browser */
      }
    }
    await this.speakBrowser(clean);
  }

  private playBlob(blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => resolve();
      void audio.play().catch(() => resolve());
    });
  }

  private speakBrowser(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      if (this.browserVoices.length) u.voice = this.browserVoices[0];
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  // ---- STT (push-to-talk). Returns a stop() function. ----
  async startDictation(
    onResult: (text: string) => void,
    onState: (listening: boolean) => void
  ): Promise<() => void> {
    if (this.status?.backend === "voicebox") {
      return this.dictateVoicebox(onResult, onState);
    }
    return this.dictateBrowser(onResult, onState);
  }

  private async dictateVoicebox(
    onResult: (t: string) => void,
    onState: (l: boolean) => void
  ): Promise<() => void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      onState(false);
      const blob = new Blob(chunks, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "audio.webm");
      try {
        const r = await fetch("/api/voice/stt", { method: "POST", body: fd });
        const d = await r.json();
        if (d.text) onResult(d.text);
      } catch {
        /* ignore */
      }
    };
    rec.start();
    onState(true);
    return () => rec.state !== "inactive" && rec.stop();
  }

  private dictateBrowser(
    onResult: (t: string) => void,
    onState: (l: boolean) => void
  ): () => void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      onState(false);
      return () => {};
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    rec.onend = () => onState(false);
    rec.onerror = () => onState(false);
    rec.start();
    onState(true);
    return () => rec.stop();
  }
}

export const voice = new VoiceService();
