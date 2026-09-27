"use client";

import { useEffect, useMemo, useState } from "react";

const API = "/api/admin";

const LOGO_SRC = "/logo.png";

function Logo({ size = 42 }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Fades"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
      />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 20 7v5c0 5-3.3 8-8 9-4.7-1-8-4-8-9V7l8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LogoutIcon() {
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
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
      <path d="M20 19v-4h-4" />
    </svg>
  );
}

function statusClass(status) {
  switch (status) {
    case "active":
      return "status-active";

    case "used":
      return "status-used";

    case "revoked":
      return "status-revoked";

    case "expired":
      return "status-expired";

    default:
      return "";
  }
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(date));
  } catch {
    return "—";
  }
}

function formatDateOnly(date) {
  if (!date) {
    return "Never";
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: "medium",
      }
    ).format(new Date(date));
  } catch {
    return "—";
  }
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);

  const [loginCode, setLoginCode] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  const [invites, setInvites] =
    useState([]);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    revoked: 0,
    expired: 0,
  });

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [copiedCode, setCopiedCode] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [toast, setToast] = useState("");

  const [newInvite, setNewInvite] =
    useState(null);

  const [expiration, setExpiration] =
    useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch(
        `${API}?action=session`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (data.authenticated) {
        setAuthenticated(true);
        await loadDashboard();
      }
    } catch {
      // Stay on login screen.
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();

    if (!loginCode.trim()) {
      setLoginError(
        "Enter your administrator code."
      );
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(
        API,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "login",
            code: loginCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoginError(
          data.error ||
            "Unable to authenticate."
        );
        return;
      }

      setAuthenticated(true);
      setLoginCode("");

      await loadDashboard();
    } catch {
      setLoginError(
        "Unable to connect to the admin API."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch(
        `${API}?action=logout`,
        {
          method: "POST",
        }
      );
    } catch {
      // Ignore logout errors.
    }

    setAuthenticated(false);
    setInvites([]);
  }

  async function loadDashboard() {
    setDashboardLoading(true);

    try {
      const [inviteResponse, statsResponse] =
        await Promise.all([
          fetch(
            `${API}?action=invites`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `${API}?action=stats`,
            {
              cache: "no-store",
            }
          ),
        ]);

      if (
        inviteResponse.status === 401 ||
        statsResponse.status === 401
      ) {
        setAuthenticated(false);
        return;
      }

      const inviteData =
        await inviteResponse.json();

      const statsData =
        await statsResponse.json();

      if (inviteData.success) {
        setInvites(
          inviteData.invites || []
        );
      }

      if (statsData.success) {
        setStats(
          statsData.stats || {
            total: 0,
            active: 0,
            used: 0,
            revoked: 0,
            expired: 0,
          }
        );
      }
    } catch {
      showToast(
        "Unable to load invite data."
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  async function createInvite() {
    setCreating(true);

    try {
      let expiresAt = null;

      if (expiration) {
        const date = new Date(
          `${expiration}T23:59:59`
        );

        if (
          Number.isNaN(date.getTime()) ||
          date.getTime() <= Date.now()
        ) {
          showToast(
            "Choose a future expiration date."
          );
          return;
        }

        expiresAt = date.toISOString();
      }

      const response = await fetch(
        `${API}?action=create_invite`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "create_invite",
            expiresAt,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401
      ) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok || !data.success) {
        showToast(
          data.error ||
            "Unable to create invite."
        );
        return;
      }

      setNewInvite(data.invite);
      setExpiration("");

      await loadDashboard();
    } catch {
      showToast(
        "Unable to create invite."
      );
    } finally {
      setCreating(false);
    }
  }

  async function revokeInvite(code) {
    const confirmed = window.confirm(
      `Revoke ${code}?\n\nThis invite will no longer be usable.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}?action=revoke&code=${encodeURIComponent(
          code
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (
        response.status === 401
      ) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok || !data.success) {
        showToast(
          data.error ||
            "Unable to revoke invite."
        );
        return;
      }

      showToast("Invite revoked.");

      await loadDashboard();
    } catch {
      showToast(
        "Unable to revoke invite."
      );
    }
  }

  async function copyText(
    value,
    message = "Copied."
  ) {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopiedCode(value);
      showToast(message);

      window.setTimeout(() => {
        setCopiedCode("");
      }, 1800);
    } catch {
      showToast(
        "Unable to copy to clipboard."
      );
    }
  }

  function showToast(message) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2800);
  }

  const filteredInvites = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return invites.filter((invite) => {
      const matchesSearch =
        !query ||
        invite.code
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        invite.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [invites, search, filter]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <Logo size={44} />
        </div>

        <div className="loading-spinner" />

        <span>
          Loading Fades Administration
        </span>

        <style jsx global>{styles}</style>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <main className="auth-page">
        <div className="auth-glow" />

        <div className="auth-card">
          <div className="auth-logo">
            <Logo size={58} />
          </div>

          <div className="auth-eyebrow">
            FADES SYSTEMS
          </div>

          <h1>
            Administration
          </h1>

          <p>
            Enter your administrator code
            to access the Fades invitation
            system.
          </p>

          <form onSubmit={login}>
            <label htmlFor="admin-code">
              Administrator code
            </label>

            <div
              className={`code-input ${
                loginError
                  ? "code-input-error"
                  : ""
              }`}
            >
              <ShieldIcon />

              <input
                id="admin-code"
                type="password"
                autoComplete="current-password"
                value={loginCode}
                onChange={(event) => {
                  setLoginCode(
                    event.target.value
                  );
                  setLoginError("");
                }}
                placeholder="Enter your code"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <span className="button-spinner" />
                  Verifying
                </>
              ) : (
                <>
                  Continue
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span className="secure-dot" />
            Protected Fades administration
          </div>
        </div>

        <style jsx global>{styles}</style>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <a
          href="https://fades.lol"
          className="dashboard-brand"
        >
          <div className="dashboard-brand-logo">
            <Logo size={35} />
          </div>

          <div>
            <strong>Fades</strong>
            <span>Administration</span>
          </div>
        </a>

        <div className="header-actions">
          <button
            type="button"
            className="header-button"
            onClick={loadDashboard}
            disabled={dashboardLoading}
          >
            <RefreshIcon />
            <span className="desktop-only">
              Refresh
            </span>
          </button>

          <button
            type="button"
            className="header-button"
            onClick={logout}
          >
            <LogoutIcon />
            <span className="desktop-only">
              Sign out
            </span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="dashboard-intro">
          <div>
            <div className="dashboard-eyebrow">
              INVITATION SYSTEM
            </div>

            <h1>
              Fades Mail
              <span> access control.</span>
            </h1>

            <p>
              Create and manage invitation
              codes for private Fades Mail
              registration.
            </p>
          </div>

          <div className="api-indicator">
            <span />
            API Online
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">
              Total
            </span>

            <strong>{stats.total}</strong>

            <span className="stat-description">
              All invitations
            </span>
          </div>

          <div className="stat-card stat-active-card">
            <span className="stat-label">
              Active
            </span>

            <strong>{stats.active}</strong>

            <span className="stat-description">
              Ready for signup
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Used
            </span>

            <strong>{stats.used}</strong>

            <span className="stat-description">
              Completed invites
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Revoked
            </span>

            <strong>{stats.revoked}</strong>

            <span className="stat-description">
              Disabled invites
            </span>
          </div>
        </section>

        <section className="create-panel">
          <div className="create-panel-icon">
            <PlusIcon />
          </div>

          <div className="create-panel-info">
            <span className="section-label">
              NEW INVITATION
            </span>

            <h2>
              Create an invite
            </h2>

            <p>
              Generate a secure one-time
              invitation for Fades Mail.
            </p>
          </div>

          <div className="create-controls">
            <div className="expiration-control">
              <label htmlFor="expiration">
                Expires
              </label>

              <input
                id="expiration"
                type="date"
                value={expiration}
                onChange={(event) =>
                  setExpiration(
                    event.target.value
                  )
                }
              />
            </div>

            <button
              className="create-button"
              type="button"
              onClick={createInvite}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="button-spinner" />
                  Creating
                </>
              ) : (
                <>
                  <PlusIcon />
                  Create invite
                </>
              )}
            </button>
          </div>
        </section>

        {newInvite && (
          <section className="new-invite-panel">
            <div className="new-invite-heading">
              <div>
                <span className="section-label">
                  INVITE CREATED
                </span>

                <h2>
                  Your invitation is ready.
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNewInvite(null)
                }
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="invite-created-code">
              <span>
                {newInvite.code}
              </span>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    newInvite.code,
                    "Invite code copied."
                  )
                }
              >
                <CopyIcon />

                {copiedCode ===
                newInvite.code
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>

            <div className="signup-link">
              <span>
                Signup link
              </span>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    `https://mail.fades.lol/signup?invite=${encodeURIComponent(
                      newInvite.code
                    )}`,
                    "Signup link copied."
                  )
                }
              >
                Copy signup link
              </button>
            </div>
          </section>
        )}

        <section className="invites-section">
          <div className="invites-heading">
            <div>
              <span className="section-label">
                INVITATIONS
              </span>

              <h2>
                Invite codes
              </h2>
            </div>

            <span className="result-count">
              {filteredInvites.length} shown
            </span>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="m20 20-4-4" />
              </svg>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search invite codes..."
              />
            </div>

            <div className="filter-group">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["used", "Used"],
                ["revoked", "Revoked"],
                ["expired", "Expired"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    filter === value
                      ? "filter-active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(value)
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="invite-table">
            <div className="table-header">
              <span>INVITE CODE</span>
              <span>STATUS</span>
              <span>CREATED</span>
              <span>EXPIRES</span>
              <span />
            </div>

            {dashboardLoading &&
            invites.length === 0 ? (
              <div className="empty-state">
                <div className="loading-spinner" />

                <span>
                  Loading invitations...
                </span>
              </div>
            ) : filteredInvites.length ===
              0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Logo size={28} />
                </div>

                <strong>
                  No invitations found
                </strong>

                <span>
                  Create an invite to get
                  started.
                </span>
              </div>
            ) : (
              filteredInvites.map(
                (invite) => (
                  <div
                    className="invite-row"
                    key={invite.id}
                  >
                    <div className="invite-code-cell">
                      <code>
                        {invite.code}
                      </code>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            invite.code,
                            "Invite code copied."
                          )
                        }
                        aria-label="Copy invite"
                      >
                        <CopyIcon />
                      </button>
                    </div>

                    <div>
                      <span
                        className={`status-badge ${statusClass(
                          invite.status
                        )}`}
                      >
                        <span />
                        {invite.status}
                      </span>
                    </div>

                    <div className="date-cell">
                      {formatDate(
                        invite.createdAt
                      )}
                    </div>

                    <div className="date-cell">
                      {formatDateOnly(
                        invite.expiresAt
                      )}
                    </div>

                    <div className="row-actions">
                      {invite.status ===
                        "active" && (
                        <button
                          type="button"
                          className="revoke-button"
                          onClick={() =>
                            revokeInvite(
                              invite.code
                            )
                          }
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>

        <section className="api-info">
          <div className="api-info-icon">
            <ShieldIcon />
          </div>

          <div>
            <span className="section-label">
              API ENDPOINT
            </span>

            <h3>
              /api/admin
            </h3>

            <p>
              The Fades Mail signup service
              can validate and redeem invites
              through this single API route.
            </p>
          </div>
        </section>
      </div>

      {toast && (
        <div className="toast">
          <span className="toast-dot" />
          {toast}
        </div>
      )}

      <footer className="dashboard-footer">
        <span>
          Fades Administration
        </span>

        <span>
          Private system
        </span>

        <a href="https://fades.lol">
          fades.lol
        </a>
      </footer>

      <style jsx global>{styles}</style>
    </main>
  );
}

const styles = `
:root {
  --background: #0b0b0c;
  --surface: #111113;
  --surface-2: #151517;
  --surface-3: #19191b;
  --line: rgba(255,255,255,.075);
  --line-hover: rgba(255,255,255,.14);

  --text: #f1f1f1;
  --muted: #929297;
  --subtle: #65656a;

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

button,
input {
  font: inherit;
}

button {
  -webkit-tap-highlight-color: transparent;
}

a {
  color: inherit;
  text-decoration: none;
}

/* ============================================================
   LOADING
============================================================ */

.loading-screen {
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 17px;

  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(255,255,255,.045),
      transparent 35%
    ),
    var(--background);

  color: var(--muted);
  font-size: 12px;
}

.loading-logo {
  width: 64px;
  height: 64px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid var(--line);
  border-radius: 17px;

  background: rgba(255,255,255,.025);
}

.loading-spinner,
.button-spinner {
  width: 16px;
  height: 16px;

  border: 2px solid rgba(255,255,255,.13);
  border-top-color: rgba(255,255,255,.8);

  border-radius: 50%;

  animation: spin .7s linear infinite;
}

.loading-spinner {
  width: 20px;
  height: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================================
   LOGIN
============================================================ */

.auth-page {
  min-height: 100vh;

  position: relative;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 30px;

  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(255,255,255,.055),
      transparent 38%
    ),
    var(--background);
}

.auth-glow {
  position: absolute;

  width: 600px;
  height: 600px;

  top: -300px;
  left: 50%;

  transform: translateX(-50%);

  border-radius: 50%;

  background: rgba(255,255,255,.025);

  filter: blur(80px);

  pointer-events: none;
}

.auth-card {
  width: min(430px, 100%);

  position: relative;
  z-index: 1;

  padding: 42px;

  border: 1px solid var(--line);
  border-radius: 22px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.035),
      rgba(255,255,255,.015)
    );

  box-shadow:
    0 30px 100px rgba(0,0,0,.35);

  animation: auth-in .45s ease both;
}

@keyframes auth-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-logo {
  width: 74px;
  height: 74px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 28px;

  border: 1px solid var(--line);
  border-radius: 19px;

  background: rgba(255,255,255,.025);
}

.auth-eyebrow,
.dashboard-eyebrow,
.section-label {
  color: var(--muted);

  font-size: 9px;
  font-weight: 700;

  letter-spacing: .18em;
  text-transform: uppercase;
}

.auth-card h1 {
  margin: 12px 0 10px;

  font-size: 32px;
  line-height: 1.05;
  letter-spacing: -.045em;
}

.auth-card > p {
  margin: 0 0 30px;

  color: var(--muted);

  font-size: 13px;
  line-height: 1.7;
}

.auth-card form label {
  display: block;

  margin-bottom: 8px;

  color: var(--muted);

  font-size: 11px;
  font-weight: 600;
}

.code-input {
  height: 53px;

  display: flex;
  align-items: center;
  gap: 11px;

  padding: 0 15px;

  border: 1px solid var(--line);
  border-radius: 12px;

  background: rgba(255,255,255,.025);

  transition:
    border-color .2s ease,
    background .2s ease;
}

.code-input:focus-within {
  border-color: var(--line-hover);
  background: rgba(255,255,255,.04);
}

.code-input svg {
  color: var(--subtle);
  flex-shrink: 0;
}

.code-input input {
  width: 100%;

  border: 0;
  outline: 0;

  background: transparent;
  color: var(--text);

  font-size: 14px;
}

.code-input input::placeholder {
  color: var(--subtle);
}

.code-input-error {
  border-color: rgba(220,90,90,.45);
}

.login-error {
  margin-top: 9px;

  color: #d58b8b;

  font-size: 11px;
}

.login-button {
  width: 100%;
  height: 52px;

  margin-top: 18px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  border: 1px solid var(--line-hover);
  border-radius: 12px;

  background: #f0f0f0;
  color: #101010;

  font-size: 13px;
  font-weight: 700;

  cursor: pointer;

  transition:
    transform .2s ease,
    background .2s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #fff;
}

.login-button:disabled {
  opacity: .55;
  cursor: default;
}

.login-button .button-spinner {
  border-color: rgba(0,0,0,.15);
  border-top-color: #111;
}

.auth-footer {
  margin-top: 25px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  color: var(--subtle);

  font-size: 10px;
}

.secure-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #8b8b8b;
}

/* ============================================================
   DASHBOARD
============================================================ */

.dashboard {
  min-height: 100vh;

  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(255,255,255,.035),
      transparent 35%
    ),
    var(--background);
}

.dashboard-header {
  height: 74px;

  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid var(--line);
}

.dashboard-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.dashboard-brand-logo {
  width: 35px;

  display: flex;
  justify-content: center;
}

.dashboard-brand strong {
  display: block;

  font-size: 14px;
  line-height: 1;
  letter-spacing: -.02em;
}

.dashboard-brand span {
  display: block;

  margin-top: 5px;

  color: var(--muted);

  font-size: 8px;
  font-weight: 700;

  letter-spacing: .14em;
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  gap: 7px;
}

.header-button {
  height: 36px;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 0 12px;

  border: 1px solid var(--line);
  border-radius: 9px;

  background: rgba(255,255,255,.02);
  color: var(--muted);

  font-size: 11px;

  cursor: pointer;

  transition:
    background .2s ease,
    border-color .2s ease,
    color .2s ease;
}

.header-button:hover {
  border-color: var(--line-hover);
  background: rgba(255,255,255,.045);
  color: var(--text);
}

.header-button:disabled {
  opacity: .5;
  cursor: default;
}

.dashboard-content {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;

  padding: 65px 0 80px;
}

.dashboard-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;

  margin-bottom: 38px;
}

.dashboard-intro h1 {
  margin: 13px 0 12px;

  font-size: clamp(34px, 5vw, 56px);
  line-height: .98;
  letter-spacing: -.055em;
}

.dashboard-intro h1 span {
  color: #67676c;
}

.dashboard-intro p {
  max-width: 530px;

  margin: 0;

  color: var(--muted);

  font-size: 13px;
  line-height: 1.7;
}

.api-indicator {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 9px 11px;

  border: 1px solid var(--line);
  border-radius: 9px;

  color: var(--muted);

  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.api-indicator span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #858585;

  box-shadow: 0 0 10px rgba(255,255,255,.25);
}

/* ============================================================
   STATS
============================================================ */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  margin-bottom: 12px;
}

.stat-card {
  min-height: 145px;

  padding: 20px;

  display: flex;
  flex-direction: column;

  border: 1px solid var(--line);
  border-radius: 15px;

  background: var(--surface);
}

.stat-label {
  color: var(--muted);

  font-size: 9px;
  font-weight: 700;

  text-transform: uppercase;
  letter-spacing: .13em;
}

.stat-card strong {
  margin-top: 22px;

  font-size: 34px;
  line-height: 1;

  letter-spacing: -.045em;
}

.stat-description {
  margin-top: auto;

  color: var(--subtle);

  font-size: 10px;
}

.stat-active-card {
  border-color: rgba(255,255,255,.12);
}

/* ============================================================
   CREATE
============================================================ */

.create-panel {
  min-height: 130px;

  display: flex;
  align-items: center;
  gap: 18px;

  padding: 20px;

  border: 1px solid var(--line);
  border-radius: 15px;

  background: var(--surface);

  margin-bottom: 42px;
}

.create-panel-icon {
  width: 48px;
  height: 48px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid var(--line);
  border-radius: 13px;

  background: rgba(255,255,255,.025);
}

.create-panel-info {
  min-width: 0;
}

.create-panel-info h2 {
  margin: 7px 0 5px;

  font-size: 17px;
  letter-spacing: -.025em;
}

.create-panel-info p {
  margin: 0;

  color: var(--muted);

  font-size: 11px;
}

.create-controls {
  margin-left: auto;

  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.expiration-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expiration-control label {
  color: var(--subtle);

  font-size: 9px;
  font-weight: 700;

  text-transform: uppercase;
  letter-spacing: .1em;
}

.expiration-control input {
  height: 41px;

  padding: 0 10px;

  border: 1px solid var(--line);
  border-radius: 9px;

  outline: none;

  background: rgba(255,255,255,.025);
  color: var(--text);

  font-size: 11px;
}

.create-button {
  height: 41px;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 0 14px;

  border: 1px solid var(--line-hover);
  border-radius: 9px;

  background: #eaeaea;
  color: #111;

  font-size: 11px;
  font-weight: 700;

  cursor: pointer;
}

.create-button:hover:not(:disabled) {
  background: #fff;
}

.create-button:disabled {
  opacity: .55;
  cursor: default;
}

/* ============================================================
   NEW INVITE
============================================================ */

.new-invite-panel {
  padding: 23px;

  margin-bottom: 42px;

  border: 1px solid rgba(255,255,255,.13);
  border-radius: 15px;

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,.015)
    );

  animation: panel-in .3s ease both;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(7px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.new-invite-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.new-invite-heading h2 {
  margin: 8px 0 20px;

  font-size: 18px;
  letter-spacing: -.03em;
}

.close-button {
  width: 30px;
  height: 30px;

  border: 1px solid var(--line);
  border-radius: 8px;

  background: transparent;
  color: var(--muted);

  font-size: 20px;

  cursor: pointer;
}

.invite-created-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  padding: 15px;

  border: 1px solid var(--line);
  border-radius: 10px;

  background: rgba(0,0,0,.15);
}

.invite-created-code span {
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  font-size: 16px;
  font-weight: 700;
  letter-spacing: .08em;
}

.invite-created-code button,
.signup-link button {
  display: flex;
  align-items: center;
  gap: 7px;

  padding: 8px 10px;

  border: 1px solid var(--line);
  border-radius: 8px;

  background: rgba(255,255,255,.025);
  color: var(--muted);

  font-size: 10px;
  font-weight: 600;

  cursor: pointer;
}

.signup-link {
  margin-top: 10px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  color: var(--muted);

  font-size: 10px;
}

/* ============================================================
   INVITES
============================================================ */

.invites-section {
  margin-top: 10px;
}

.invites-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  margin-bottom: 17px;
}

.invites-heading h2 {
  margin: 8px 0 0;

  font-size: 24px;
  letter-spacing: -.035em;
}

.result-count {
  color: var(--subtle);

  font-size: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  margin-bottom: 10px;
}

.search-box {
  height: 42px;

  width: 280px;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 0 12px;

  border: 1px solid var(--line);
  border-radius: 9px;

  background: var(--surface);
}

.search-box svg {
  color: var(--subtle);
  flex-shrink: 0;
}

.search-box input {
  width: 100%;

  border: 0;
  outline: 0;

  background: transparent;
  color: var(--text);

  font-size: 11px;
}

.search-box input::placeholder {
  color: var(--subtle);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 3px;

  border: 1px solid var(--line);
  border-radius: 9px;

  background: var(--surface);
}

.filter-group button {
  height: 34px;

  padding: 0 10px;

  border: 0;
  border-radius: 6px;

  background: transparent;
  color: var(--subtle);

  font-size: 10px;

  cursor: pointer;
}

.filter-group button:hover {
  color: var(--text);
}

.filter-group button.filter-active {
  background: var(--surface-3);
  color: var(--text);
}

.invite-table {
  overflow: hidden;

  border: 1px solid var(--line);
  border-radius: 15px;

  background: var(--surface);
}

.table-header,
.invite-row {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.5fr)
    .7fr
    1fr
    1fr
    80px;

  align-items: center;

  gap: 15px;
}

.table-header {
  min-height: 43px;

  padding: 0 18px;

  border-bottom: 1px solid var(--line);

  color: var(--subtle);

  font-size: 8px;
  font-weight: 700;

  letter-spacing: .13em;
}

.invite-row {
  min-height: 68px;

  padding: 0 18px;

  border-bottom: 1px solid var(--line);

  transition: background .15s ease;
}

.invite-row:last-child {
  border-bottom: 0;
}

.invite-row:hover {
  background: rgba(255,255,255,.018);
}

.invite-code-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}

.invite-code-cell code {
  color: var(--text);

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  font-size: 11px;
  letter-spacing: .04em;
}

.invite-code-cell button {
  width: 27px;
  height: 27px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 0;
  border-radius: 7px;

  background: transparent;
  color: var(--subtle);

  cursor: pointer;
}

.invite-code-cell button:hover {
  background: rgba(255,255,255,.05);
  color: var(--text);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  font-size: 9px;
  font-weight: 700;

  text-transform: uppercase;
  letter-spacing: .08em;
}

.status-badge > span {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: currentColor;
}

.status-active {
  color: #a0a0a0;
}

.status-used {
  color: #77777c;
}

.status-revoked,
.status-expired {
  color: #55555a;
}

.date-cell {
  color: var(--muted);
  font-size: 10px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
}

.revoke-button {
  padding: 7px 9px;

  border: 1px solid var(--line);
  border-radius: 7px;

  background: transparent;
  color: var(--muted);

  font-size: 9px;

  cursor: pointer;
}

.revoke-button:hover {
  border-color: rgba(255,255,255,.16);
  color: #ddd;
}

.empty-state {
  min-height: 220px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 8px;

  color: var(--subtle);

  font-size: 11px;
}

.empty-state strong {
  margin-top: 4px;

  color: var(--muted);

  font-size: 12px;
}

.empty-icon {
  width: 52px;
  height: 52px;

  margin-bottom: 5px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid var(--line);
  border-radius: 14px;
}

/* ============================================================
   API INFO
============================================================ */

.api-info {
  margin-top: 35px;

  display: flex;
  align-items: flex-start;
  gap: 14px;

  padding: 20px;

  border: 1px solid var(--line);
  border-radius: 13px;

  background: rgba(255,255,255,.012);
}

.api-info-icon {
  width: 39px;
  height: 39px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border: 1px solid var(--line);
  border-radius: 10px;

  color: var(--muted);
}

.api-info h3 {
  margin: 7px 0 5px;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  font-size: 13px;
}

.api-info p {
  margin: 0;

  color: var(--muted);

  font-size: 10px;
  line-height: 1.6;
}

/* ============================================================
   TOAST
============================================================ */

.toast {
  position: fixed;

  right: 22px;
  bottom: 22px;

  z-index: 20;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 11px 14px;

  border: 1px solid var(--line-hover);
  border-radius: 10px;

  background: #171719;

  box-shadow: 0 15px 45px rgba(0,0,0,.4);

  color: var(--text);

  font-size: 11px;

  animation: toast-in .25s ease both;
}

.toast-dot {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: #999;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================
   FOOTER
============================================================ */

.dashboard-footer {
  width: min(1200px, calc(100% - 40px));
  min-height: 75px;

  margin: 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-top: 1px solid var(--line);

  color: var(--subtle);

  font-size: 9px;
}

.dashboard-footer a {
  color: var(--muted);
}

/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .create-panel {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .create-controls {
    width: 100%;
    margin-left: 66px;
  }
}

@media (max-width: 700px) {
  .dashboard-header,
  .dashboard-content,
  .dashboard-footer {
    width: min(100% - 28px, 1200px);
  }

  .dashboard-content {
    padding-top: 42px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .filter-group {
    overflow-x: auto;
  }

  .filter-group button {
    white-space: nowrap;
  }

  .table-header {
    display: none;
  }

  .invite-row {
    grid-template-columns: 1fr auto;
    gap: 12px;

    padding: 17px;
  }

  .invite-row > div:nth-child(2),
  .invite-row > div:nth-child(3),
  .invite-row > div:nth-child(4) {
    display: none;
  }

  .row-actions {
    grid-column: 2;
    grid-row: 1;
  }

  .invite-code-cell {
    grid-column: 1;
    grid-row: 1;
  }

  .create-controls {
    margin-left: 0;
  }
}

@media (max-width: 500px) {
  .auth-page {
    padding: 18px;
  }

  .auth-card {
    padding: 28px 22px;
  }

  .dashboard-intro h1 {
    font-size: 38px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card {
    min-height: 125px;
  }

  .stat-card strong {
    font-size: 28px;
  }

  .create-panel {
    flex-direction: column;
  }

  .create-panel-info {
    width: 100%;
  }

  .create-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .expiration-control input,
  .create-button {
    width: 100%;
  }

  .invite-created-code {
    align-items: stretch;
    flex-direction: column;
  }

  .invite-created-code button {
    justify-content: center;
  }

  .signup-link {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-footer {
    flex-wrap: wrap;
    gap: 10px;
    padding: 20px 0;
  }

  .desktop-only {
    display: none;
  }
}
`;
