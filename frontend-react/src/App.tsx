import { useEffect, useState } from "react";
import Chat from "./Chat";
import Lesson from "./Lesson";
import Discover from "./Discover";
import Solve from "./Solve";
import Library from "./Library";
import Labs from "./Labs";
import Settings from "./Settings";
import Evaluation from "./Evaluation";

type Tab = "learn" | "discover" | "solve" | "chat" | "labs" | "library" | "settings" | "eval";

/** Primary destinations, shown as labelled tabs. */
const TABS: [Tab, string][] = [
  ["learn", "Learn"],
  ["discover", "Discover"],
  ["solve", "Solve"],
  ["chat", "Chat"],
  ["labs", "Labs"],
  ["library", "Library"],
];

/** Utility destinations, shown as icon buttons in the right-hand cluster. */
const UTILITY: [Tab, string, string][] = [
  ["settings", "Settings", "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 15a1.5 1.5 0 0 0 .3 1.65l.05.05a1.83 1.83 0 1 1-2.6 2.6l-.05-.06a1.5 1.5 0 0 0-2.56 1.07v.15a1.83 1.83 0 1 1-3.66 0v-.08a1.5 1.5 0 0 0-2.63-1.07l-.06.06a1.83 1.83 0 1 1-2.59-2.6l.05-.05A1.5 1.5 0 0 0 4.58 14H4.1a1.83 1.83 0 0 1 0-3.66h.08A1.5 1.5 0 0 0 5.25 7.7l-.05-.06a1.83 1.83 0 1 1 2.59-2.59l.06.05a1.5 1.5 0 0 0 2.56-1.07V4.1a1.83 1.83 0 0 1 3.66 0v.08a1.5 1.5 0 0 0 2.56 1.07l.05-.05a1.83 1.83 0 1 1 2.6 2.59l-.06.06a1.5 1.5 0 0 0 1.08 2.53h.15a1.83 1.83 0 0 1 0 3.66h-.08a1.5 1.5 0 0 0-1.07.96z"],
  ["eval", "Evaluation", "M3.5 20.5h17M7 20.5v-6.5M12 20.5V5.5M17 20.5v-10"],
];

const TAB_IDS = new Set<string>([...TABS, ...UTILITY].map(([id]) => id));

/** `/app#chat` opens straight into that tab, so links can deep-link here. */
function tabFromHash(): Tab {
  const id = window.location.hash.replace(/^#/, "");
  return TAB_IDS.has(id) ? (id as Tab) : "learn";
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(tabFromHash);
  const setTab = (next: Tab) => {
    setTabState(next);
    window.history.replaceState(null, "", next === "learn" ? " " : `#${next}`);
  };
  useEffect(() => {
    const onHashChange = () => setTabState(tabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
          <span className="tab-divider" aria-hidden="true" />
          {UTILITY.map(([id, label, d]) => (
            <button
              key={id}
              className={tab === id ? "tab tab-icon on" : "tab tab-icon"}
              onClick={() => setTab(id)}
              title={label}
              aria-label={label}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={d} />
              </svg>
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
        ) : tab === "settings" ? (
          <Settings />
        ) : tab === "eval" ? (
          <Evaluation />
        ) : (
          <Lesson />
        )}
      </main>
    </div>
  );
}
