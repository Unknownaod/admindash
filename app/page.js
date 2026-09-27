"use client";

import { useState } from "react";

const LOGO_SRC = "/logo.png";

const SYSTEMS = [
  {
    name: "Fades AI",
    description: "Your intelligent AI workspace.",
    url: "https://www.fades.lol",
    status: "Available",
  },
  {
    name: "Fades Mail",
    description: "Private email, beautifully simple.",
    url: "https://mail.fades.lol",
    status: "Available",
  },
  {
    name: "Fades Browser",
    description: "A browser built for the Fades ecosystem.",
    url: "https://browse.fades.lol",
    status: "In development",
  },
  {
    name: "Fades Chat",
    description: "Simple, private conversations.",
    url: "https://chat.fades.lol",
    status: "Coming soon",
  },
  {
    name: "Fades Domains",
    description: "Simple, easy domain management.",
    url: "https://domains.fades.lol",
    status: "Coming soon",
  },
];

function Logo({ size = 42 }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Fades"
      style={{
        width: size,
        height: "auto",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

function Arrow() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="m19 5-8 8" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredSystems = SYSTEMS.filter((system) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      system.name.toLowerCase().includes(query) ||
      system.description.toLowerCase().includes(query)
    );
  });

  return (
    <main className="fades-explorer">
      <header className="explorer-header">
        <a href="/" className="brand">
          <div className="brand-logo">
            <Logo size={38} />
          </div>

          <div className="brand-text">
            <strong>Fades</strong>
            <span>Systems</span>
          </div>
        </a>

        <nav className="header-nav">
          <a href="#systems">Systems</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-logo">
          <Logo size={76} />
        </div>

        <div className="hero-eyebrow">
          FADES SYSTEMS
        </div>

        <h1>
          Explore
          <br />
          <span>Fades.</span>
        </h1>

        <p>
          One place to discover everything built
          within the Fades ecosystem.
        </p>

        <div className="explorer-search">
          <SearchIcon />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search Fades systems..."
            aria-label="Search Fades systems"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </section>

      <section
        className="systems-section"
        id="systems"
      >
        <div className="section-heading">
          <div>
            <span className="section-label">
              DIRECTORY
            </span>

            <h2>Fades Systems</h2>
          </div>

          <span className="system-count">
            {filteredSystems.length}{" "}
            {filteredSystems.length === 1
              ? "system"
              : "systems"}
          </span>
        </div>

        {filteredSystems.length > 0 ? (
          <div className="system-grid">
            {filteredSystems.map((system) => (
              <a
                href={system.url}
                key={system.name}
                className="system-card"
              >
                <div className="system-card-top">
                  <div className="system-icon">
                    <Logo size={30} />
                  </div>

                  <span
                    className={`system-status ${
                      system.status ===
                      "Available"
                        ? "available"
                        : ""
                    }`}
                  >
                    <span className="status-dot" />
                    {system.status}
                  </span>
                </div>

                <div className="system-card-content">
                  <h3>{system.name}</h3>

                  <p>
                    {system.description}
                  </p>
                </div>

                <div className="system-card-footer">
                  <span>
                    Explore
                  </span>

                  <Arrow />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-logo">
              <Logo size={34} />
            </div>

            <h3>No systems found</h3>

            <p>
              Try searching for something else.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          </div>
        )}
      </section>

      <section
        className="about-section"
        id="about"
      >
        <div className="about-mark">
          <Logo size={42} />
        </div>

        <div>
          <span className="section-label">
            ABOUT FADES
          </span>

          <h2>
            A growing collection of
            <br />
            systems built by Fades.
          </h2>

          <p>
            Fades Systems is the home for the
            applications, services, and tools
            that make up the Fades ecosystem.
          </p>
        </div>
      </section>

      <footer className="explorer-footer">
        <div className="footer-brand">
          <Logo size={25} />

          <span>
            Fades Systems
          </span>
        </div>

        <span>
          © {new Date().getFullYear()} Fades
        </span>

        <a href="https://fades.lol">
          fades.lol
          <ExternalIcon />
        </a>
      </footer>

      <style jsx global>{`
        :root {
          --background: #0c0c0d;
          --surface: #121214;
          --surface-hover: #171719;
          --line: rgba(255, 255, 255, 0.09);
          --line-hover: rgba(255, 255, 255, 0.16);
          --text: #f1f1f1;
          --muted: #8d8d91;
          --subtle: #5e5e63;
          --accent: #d6a85c;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--background);
          color: var(--text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input {
          font: inherit;
        }

        .fades-explorer {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(255, 255, 255, 0.045),
              transparent 38%
            ),
            var(--background);
        }

        .explorer-header {
          width: min(1180px, calc(100% - 40px));
          height: 76px;
          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom: 1px solid var(--line);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .brand-logo {
          width: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .brand-text strong {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .brand-text span {
          margin-top: 4px;
          color: var(--muted);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .header-nav a {
          color: var(--muted);
          font-size: 13px;
          transition: color 0.2s ease;
        }

        .header-nav a:hover {
          color: var(--text);
        }

        .hero {
          width: min(900px, calc(100% - 40px));
          margin: 0 auto;
          padding: 105px 0 90px;
          text-align: center;
        }

        .hero-logo {
          width: 76px;
          min-height: 76px;
          margin: 0 auto 27px;

          display: flex;
          align-items: center;
          justify-content: center;

          opacity: 0.82;
        }

        .hero-eyebrow,
        .section-label {
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
        }

        .hero h1 {
          margin: 18px 0 20px;

          font-size: clamp(58px, 9vw, 100px);
          line-height: 0.92;
          letter-spacing: -0.065em;
          font-weight: 700;
        }

        .hero h1 span {
          color: #77777b;
        }

        .hero > p {
          max-width: 500px;
          margin: 0 auto;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.7;
        }

        .explorer-search {
          width: min(560px, 100%);
          height: 56px;
          margin: 36px auto 0;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 0 17px;

          border: 1px solid var(--line);
          border-radius: 14px;

          background: rgba(255, 255, 255, 0.025);

          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .explorer-search:focus-within {
          border-color: var(--line-hover);
          background: rgba(255, 255, 255, 0.04);
        }

        .explorer-search svg {
          flex-shrink: 0;
          color: var(--subtle);
        }

        .explorer-search input {
          width: 100%;
          min-width: 0;

          border: 0;
          outline: 0;

          background: transparent;
          color: var(--text);

          font-size: 14px;
        }

        .explorer-search input::placeholder {
          color: var(--subtle);
        }

        .explorer-search button {
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
        }

        .systems-section {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 20px 0 100px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          margin-bottom: 22px;
        }

        .section-heading h2 {
          margin: 8px 0 0;
          font-size: 26px;
          letter-spacing: -0.035em;
        }

        .system-count {
          color: var(--subtle);
          font-size: 12px;
        }

        .system-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 12px;
        }

        .system-card {
          min-height: 235px;
          padding: 20px;

          display: flex;
          flex-direction: column;

          border: 1px solid var(--line);
          border-radius: 16px;

          background: var(--surface);

          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .system-card:hover {
          transform: translateY(-3px);
          border-color: var(--line-hover);
          background: var(--surface-hover);
        }

        .system-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .system-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid var(--line);
          border-radius: 13px;

          background: rgba(
            255,
            255,
            255,
            0.025
          );
        }

        .system-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          color: var(--subtle);
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .system-status.available {
          color: #929292;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .system-card-content {
          margin-top: 30px;
        }

        .system-card-content h3 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -0.025em;
        }

        .system-card-content p {
          max-width: 260px;
          margin: 8px 0 0;

          color: var(--muted);
          font-size: 12px;
          line-height: 1.65;
        }

        .system-card-footer {
          margin-top: auto;
          padding-top: 25px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          color: var(--muted);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .system-card:hover .system-card-footer {
          color: var(--text);
        }

        .system-card-footer svg {
          transition: transform 0.2s ease;
        }

        .system-card:hover .system-card-footer svg {
          transform: translateX(3px);
        }

        .no-results {
          padding: 80px 20px;
          text-align: center;

          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--surface);
        }

        .no-results-logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid var(--line);
          border-radius: 16px;
        }

        .no-results h3 {
          margin: 0;
          font-size: 18px;
        }

        .no-results p {
          margin: 7px 0 18px;
          color: var(--muted);
          font-size: 13px;
        }

        .no-results button {
          padding: 9px 14px;

          border: 1px solid var(--line);
          border-radius: 9px;

          background: transparent;
          color: var(--text);

          cursor: pointer;
        }

        .about-section {
          width: min(900px, calc(100% - 40px));
          margin: 0 auto 100px;
          padding: 38px;

          display: grid;
          grid-template-columns: 70px 1fr;
          gap: 28px;

          border: 1px solid var(--line);
          border-radius: 18px;

          background: rgba(255, 255, 255, 0.018);
        }

        .about-mark {
          width: 62px;
          height: 62px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid var(--line);
          border-radius: 16px;
        }

        .about-section h2 {
          margin: 10px 0 13px;

          font-size: 25px;
          line-height: 1.2;
          letter-spacing: -0.035em;
        }

        .about-section p {
          max-width: 560px;
          margin: 0;

          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .explorer-footer {
          width: min(1180px, calc(100% - 40px));
          min-height: 80px;
          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          border-top: 1px solid var(--line);

          color: var(--subtle);
          font-size: 11px;
        }

        .footer-brand,
        .explorer-footer a {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .explorer-footer a {
          color: var(--muted);
        }

        @media (max-width: 850px) {
          .system-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }

        @media (max-width: 600px) {
          .explorer-header {
            height: 68px;
          }

          .header-nav {
            display: none;
          }

          .hero {
            padding: 75px 0 65px;
          }

          .hero h1 {
            font-size: 62px;
          }

          .hero > p {
            font-size: 14px;
          }

          .system-grid {
            grid-template-columns: 1fr;
          }

          .section-heading {
            align-items: flex-start;
          }

          .about-section {
            grid-template-columns: 1fr;
            padding: 25px;
          }

          .explorer-footer {
            flex-wrap: wrap;
            padding: 22px 0;
          }
        }
      `}</style>
    </main>
  );
}

