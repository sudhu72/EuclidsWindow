import { useState } from "react";
import { useAuth } from "./auth";

export default function Login({ onDone }: { onDone: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setStatus("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onDone();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <strong style={{ flex: 1 }}>{mode === "login" ? "Log in" : "Create an account"}</strong>
        <span className="status">{status}</span>
      </div>
      <div className="lesson-body" style={{ maxWidth: 420 }}>
        <p className="dsub">
          Optional — every tab works fine without an account.{" "}
          {mode === "login"
            ? "Log in and your lessons and conversations will be saved to your account instead of staying anonymous."
            : "Sign up and your lessons and conversations will be saved to your account instead of staying anonymous."}
        </p>

        <section className="set-group">
          <div className="set-row">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              autoComplete="email"
            />
          </div>
          {mode === "signup" && (
            <div className="set-row">
              <span>Name (optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
                autoComplete="name"
              />
            </div>
          )}
          <div className="set-row">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          {mode === "signup" && <div className="set-hint">At least 6 characters.</div>}
          <div className="set-actions">
            <button
              className="send"
              onClick={() => void submit()}
              disabled={submitting || !email.trim() || !password}
            >
              {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setStatus("");
                setMode(mode === "login" ? "signup" : "login");
              }}
            >
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
