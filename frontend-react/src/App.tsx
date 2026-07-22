import Chat from "./Chat";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Euclid&rsquo;s Window</div>
        <nav className="links">
          <a href="/">← Classic app</a>
          <span className="badge">React · beta</span>
        </nav>
      </header>
      <main className="main">
        <Chat />
      </main>
    </div>
  );
}
