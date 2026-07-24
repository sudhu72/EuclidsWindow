import { useState } from "react";
import Chat from "./Chat";
import Lesson from "./Lesson";
import Discover from "./Discover";
import Solve from "./Solve";
import Library from "./Library";
import Labs from "./Labs";

type Tab = "learn" | "discover" | "solve" | "chat" | "labs" | "library";

const TABS: [Tab, string][] = [
  ["learn", "📖 Learn"],
  ["discover", "💡 Discover"],
  ["solve", "⊹ Solve"],
  ["chat", "💬 Chat"],
  ["labs", "🧪 Labs"],
  ["library", "📚 Library"],
];

export default function App() {
  const [tab, setTab] = useState<Tab>("learn");
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Euclid&rsquo;s Window</div>
        <nav className="tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? "tab on" : "tab"} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <nav className="links">
          <a href="/">← Classic app</a>
          <span className="badge">React · beta</span>
        </nav>
      </header>
      <main className="main">
        {tab === "chat" ? (
          <Chat />
        ) : tab === "discover" ? (
          <Discover />
        ) : tab === "solve" ? (
          <Solve />
        ) : tab === "labs" ? (
          <Labs />
        ) : tab === "library" ? (
          <Library />
        ) : (
          <Lesson />
        )}
      </main>
    </div>
  );
}
