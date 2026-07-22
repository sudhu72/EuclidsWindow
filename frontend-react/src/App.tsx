import { useState } from "react";
import Chat from "./Chat";
import Lesson from "./Lesson";

type Tab = "chat" | "learn";

export default function App() {
  const [tab, setTab] = useState<Tab>("learn");
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Euclid&rsquo;s Window</div>
        <nav className="tabs">
          <button className={tab === "learn" ? "tab on" : "tab"} onClick={() => setTab("learn")}>
            📖 Learn
          </button>
          <button className={tab === "chat" ? "tab on" : "tab"} onClick={() => setTab("chat")}>
            💬 Chat
          </button>
        </nav>
        <nav className="links">
          <a href="/">← Classic app</a>
          <span className="badge">React · beta</span>
        </nav>
      </header>
      <main className="main">{tab === "chat" ? <Chat /> : <Lesson />}</main>
    </div>
  );
}
