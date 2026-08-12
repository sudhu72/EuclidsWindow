import { useEffect, useRef, useState } from "react";
import Chat from "./Chat";
import Lesson from "./Lesson";
import Discover from "./Discover";
import Solve from "./Solve";
import Library from "./Library";
import Labs from "./Labs";
import Settings from "./Settings";
import Evaluation from "./Evaluation";
import Symbols from "./Symbols";
import Resources from "./Resources";
import Prompts from "./Prompts";
import ConceptGraph from "./ConceptGraph";
import MathMap from "./MathMap";
import Gallery from "./Gallery";
import Euclid from "./Euclid";

type Tab =
  | "learn" | "discover" | "solve" | "chat" | "labs" | "library"
  | "symbols" | "resources" | "prompts" | "concepts" | "mathmap"
  | "gallery" | "euclid" | "settings" | "eval";

/** Primary destinations, always visible as labelled tabs. */
const TABS: [Tab, string][] = [
  ["learn", "Learn"],
  ["discover", "Discover"],
  ["solve", "Solve"],
  ["chat", "Chat"],
  ["labs", "Labs"],
  ["library", "Library"],
];

/**
 * Reference surfaces, gathered under one menu. Deliberately kept out of the top
 * row: thirteen flat tabs is what made the classic header unusable.
 */
const EXPLORE: [Tab, string, string][] = [
  ["concepts", "Concept Graph", "◌"],
  ["mathmap", "Map of Mathematics", "◈"],
  ["gallery", "Cogito Gallery", "◉"],
  ["euclid", "Euclid's Elements", "△"],
  ["symbols", "Symbols", "𝑥"],
  ["resources", "Resources", "☰"],
  ["prompts", "Prompt Library", "❖"],
];

/** Utility destinations, shown as icon buttons in the right-hand cluster. */
const UTILITY: [Tab, string, string][] = [
  ["settings", "Settings", "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 15a1.5 1.5 0 0 0 .3 1.65l.05.05a1.83 1.83 0 1 1-2.6 2.6l-.05-.06a1.5 1.5 0 0 0-2.56 1.07v.15a1.83 1.83 0 1 1-3.66 0v-.08a1.5 1.5 0 0 0-2.63-1.07l-.06.06a1.83 1.83 0 1 1-2.59-2.6l.05-.05A1.5 1.5 0 0 0 4.58 14H4.1a1.83 1.83 0 0 1 0-3.66h.08A1.5 1.5 0 0 0 5.25 7.7l-.05-.06a1.83 1.83 0 1 1 2.59-2.59l.06.05a1.5 1.5 0 0 0 2.56-1.07V4.1a1.83 1.83 0 0 1 3.66 0v.08a1.5 1.5 0 0 0 2.56 1.07l.05-.05a1.83 1.83 0 1 1 2.6 2.59l-.06.06a1.5 1.5 0 0 0 1.08 2.53h.15a1.83 1.83 0 0 1 0 3.66h-.08a1.5 1.5 0 0 0-1.07.96z"],
  ["eval", "Evaluation", "M3.5 20.5h17M7 20.5v-6.5M12 20.5V5.5M17 20.5v-10"],
];

const ALL_IDS = new Set<string>([...TABS, ...EXPLORE, ...UTILITY].map(([id]) => id));

/** `/app#chat` opens straight into that tab, so links can deep-link here. */
function tabFromHash(): Tab {
  const id = window.location.hash.replace(/^#/, "");
  return ALL_IDS.has(id) ? (id as Tab) : "learn";
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(tabFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const setTab = (next: Tab) => {
    setTabState(next);
    setMenuOpen(false);
    window.history.replaceState(null, "", next === "learn" ? " " : `#${next}`);
  };

  // A prompt, concept or visualization chosen elsewhere is handed to Learn.
  const [seedTopic, setSeedTopic] = useState<string | null>(null);
  const askInLearn = (question: string) => {
    setSeedTopic(question);
    setTab("learn");
  };

  useEffect(() => {
    const onHashChange = () => setTabState(tabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const exploreActive = EXPLORE.some(([id]) => id === tab);

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

          <div className="tab-menu" ref={menuRef}>
            <button
              className={`tab ${exploreActive ? "on" : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              Explore
              <span className={`tab-caret ${menuOpen ? "open" : ""}`} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="tab-menu-list">
                {EXPLORE.map(([id, label, icon]) => (
                  <button
                    key={id}
                    className={`tab-menu-item ${tab === id ? "on" : ""}`}
                    onClick={() => setTab(id)}
                  >
                    <span className="tab-menu-icon" aria-hidden="true">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
          <Labs onAsk={askInLearn} />
        ) : tab === "library" ? (
          <Library />
        ) : tab === "symbols" ? (
          <Symbols />
        ) : tab === "resources" ? (
          <Resources />
        ) : tab === "prompts" ? (
          <Prompts onAsk={askInLearn} />
        ) : tab === "concepts" ? (
          <ConceptGraph onAsk={askInLearn} />
        ) : tab === "mathmap" ? (
          <MathMap onAsk={askInLearn} />
        ) : tab === "gallery" ? (
          <Gallery onAsk={askInLearn} />
        ) : tab === "euclid" ? (
          <Euclid onAsk={askInLearn} />
        ) : tab === "settings" ? (
          <Settings />
        ) : tab === "eval" ? (
          <Evaluation />
        ) : (
          <Lesson seedTopic={seedTopic} onSeedUsed={() => setSeedTopic(null)} />
        )}
      </main>
    </div>
  );
}
