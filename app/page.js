"use client";

import { useEffect, useState } from "react";

const LOGO_SRC = "/logo.png";

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
      <rect x="9" y="9" width="11" height="11" rx="2" />
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
      strokeWidth="1.9"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
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

function TrashIcon() {
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
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInviteStatus(invite) {
  if (invite.revoked) {
    return {
      label: "Revoked",
      className: "revoked",
    };
  }

  if (
    invite.expiresAt &&
    new Date(invite.expiresAt).getTime() <= Date.now()
  ) {
    return {
      label: "Expired",
      className: "expired",
    };
  }

  if (
    invite.maxUses > 0 &&
    invite.uses >= invite.maxUses
  ) {
    return {
      label: "Used",
      className: "used",
    };
  }

  return {
    label: "Active",
    className: "active",
  };
}

function StatCard({ label, value, description }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [maxUses, setMaxUses] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [customCode, setCustomCode] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [notice, setNotice] = useState("");

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => {
      setNotice("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [notice]);

  async function checkSession() {
    try {
      const response = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (data.authenticated) {
        setAuthenticated(true);
        await loadInvites();
      }
    } catch {
      // Not authenticated.
    } finally {
      setAuthChecking(false);
    }
  }

  async function loadInvites() {
    setLoadingInvites(true);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load invitations."
        );
      }

      setInvites(data.invites || []);
    } catch (error) {
      setNotice(
        error.message || "Failed to load invitations."
      );
    } finally {
      setLoadingInvites(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    setLoginError("");

    if (!code.trim()) {
      setLoginError("Enter your admin code.");
      return;
    }

    setLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Invalid admin code."
        );
      }

      setAuthenticated(true);
      setCode("");

      await loadInvites();
    } catch (error) {
      setLoginError(
        error.message || "Invalid admin code."
      );
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });

    setAuthenticated(false);
    setInvites([]);
  }

  async function createInvite(event) {
    event.preventDefault();

    setCreateError("");
    setCreating(true);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          maxUses: Number(maxUses),
          expiresInDays: Number(expiresInDays),
          code: customCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create invite."
        );
      }

      setShowCreate(false);

      setCustomCode("");
      setMaxUses("1");
      setExpiresInDays("7");

      setNotice("Invitation created.");

      await loadInvites();
    } catch (error) {
      setCreateError(
        error.message || "Failed to create invitation."
      );
    } finally {
      setCreating(false);
    }
  }

  async function revokeInvite(code) {
    const confirmed = window.confirm(
      `Revoke ${code}?\n\nAnyone with this invitation link will no longer be able to use it.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/invites/${encodeURIComponent(code)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to revoke invite."
        );
      }

      setNotice("Invitation revoked.");

      await loadInvites();
    } catch (error) {
      setNotice(
        error.message || "Failed to revoke invitation."
      );
    }
  }

  async function copyInvite(invite) {
    try {
      await navigator.clipboard.writeText(
        invite.signupUrl
      );

      setNotice("Signup link copied.");
    } catch {
      setNotice("Couldn't copy the signup link.");
    }
  }

  const activeInvites = invites.filter((invite) => {
    const status = getInviteStatus(invite);
    return status.className === "active";
  });

  const availableUses = invites.reduce((total, invite) => {
    if (invite.revoked) {
      return total;
    }

    if (
      invite.expiresAt &&
      new Date(invite.expiresAt).getTime() <= Date.now()
    ) {
      return total;
    }

    if (invite.maxUses === 0) {
      return total;
    }

    return (
      total +
      Math.max(0, invite.maxUses - invite.uses)
    );
  }, 0);

  const filteredInvites = invites.filter((invite) => {
    if (filter === "all") {
      return true;
    }

    return (
      getInviteStatus(invite).className === filter
    );
  });

  if (authChecking) {
    return (
      <main className="admin-page loading-page">
        <div className="loading-box">
          <Logo size={48} />
          <div className="loading-spinner" />
          <span>Loading Fades Admin</span>
        </div>

        <GlobalStyles />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-page login-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <div className="login-shell">
          <div className="login-brand">
            <div className="login-logo">
              <Logo size={54} />
            </div>

            <span>FADES MAIL</span>
          </div>

          <div className="login-card">
            <div className="login-icon">
              <LockIcon />
            </div>

            <div className="login-heading">
              <span>PRIVATE ADMINISTRATION</span>

              <h1>Invite Admin</h1>

              <p>
                Enter your private administration code
                to manage Fades Mail invitations.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <label className="field">
                <span>Admin code</span>

                <input
                  type="password"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  placeholder="Enter your code"
                  autoComplete="current-password"
                  autoFocus
                />
              </label>

              {loginError && (
                <div className="form-error">
                  <span>!</span>
                  {loginError}
                </div>
              )}

              <button
                className="primary-button login-button"
                type="submit"
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <>
                    <span className="button-spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Enter dashboard
                    <Arrow />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="login-footer">
            <Logo size={19} />
            <span>Fades Systems</span>
            <span>•</span>
            <span>Private access</span>
          </div>
        </div>

        <GlobalStyles />
      </main>
    );
  }

  return (
    <main className="admin-page dashboard-page">
      <header className="dashboard-header">
        <a href="/" className="dashboard-brand">
          <div className="dashboard-logo">
            <Logo size={34} />
          </div>

          <div>
            <strong>Fades</strong>
            <span>Invite Admin</span>
          </div>
        </a>

        <div className="dashboard-actions">
          <button
            className="icon-button"
            type="button"
            onClick={loadInvites}
            disabled={loadingInvites}
            title="Refresh"
          >
            <RefreshIcon />
          </button>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <section className="dashboard-intro">
          <div>
            <span className="eyebrow">
              FADES MAIL
            </span>

            <h1>Invitation control.</h1>

            <p>
              Manage private access to Fades Mail from
              one place.
            </p>
          </div>

          <button
            className="primary-button create-button"
            type="button"
            onClick={() => {
              setCreateError("");
              setShowCreate(true);
            }}
          >
            <PlusIcon />
            Create invitation
          </button>
        </section>

        <section className="stats-grid">
          <StatCard
            label="Total invitations"
            value={invites.length}
            description="All invitations created"
          />

          <StatCard
            label="Active"
            value={activeInvites.length}
            description="Currently usable"
          />

          <StatCard
            label="Available uses"
            value={availableUses}
            description="Remaining one-time access"
          />

          <StatCard
            label="Used"
            value={
              invites.filter(
                (invite) =>
                  getInviteStatus(invite).className ===
                  "used"
              ).length
            }
            description="Fully consumed invitations"
          />
        </section>

        <section className="invites-section">
          <div className="invites-toolbar">
            <div>
              <span className="eyebrow">
                ACCESS CONTROL
              </span>

              <h2>Invitations</h2>
            </div>

            <div className="filter-tabs">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["used", "Used"],
                ["expired", "Expired"],
                ["revoked", "Revoked"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    filter === value
                      ? "filter-active"
                      : ""
                  }
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingInvites ? (
            <div className="empty-state">
              <div className="loading-spinner" />
              <span>Loading invitations...</span>
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-logo">
                <Logo size={30} />
              </div>

              <h3>
                {invites.length === 0
                  ? "No invitations yet"
                  : "Nothing here"}
              </h3>

              <p>
                {invites.length === 0
                  ? "Create your first private Fades Mail invitation."
                  : "There are no invitations matching this filter."}
              </p>

              {invites.length === 0 && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setShowCreate(true)
                  }
                >
                  <PlusIcon />
                  Create invitation
                </button>
              )}
            </div>
          ) : (
            <div className="invite-list">
              {filteredInvites.map((invite) => {
                const status =
                  getInviteStatus(invite);

                return (
                  <article
                    className="invite-card"
                    key={invite.code}
                  >
                    <div className="invite-card-main">
                      <div className="invite-code-row">
                        <code>{invite.code}</code>

                        <span
                          className={`invite-status ${status.className}`}
                        >
                          <span />
                          {status.label}
                        </span>
                      </div>

                      <a
                        href={invite.signupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="invite-url"
                      >
                        {invite.signupUrl}
                      </a>

                      <div className="invite-meta">
                        <div>
                          <span>Uses</span>
                          <strong>
                            {invite.maxUses === 0
                              ? `${invite.uses} / ∞`
                              : `${invite.uses} / ${invite.maxUses}`}
                          </strong>
                        </div>

                        <div>
                          <span>Created</span>
                          <strong>
                            {formatDate(
                              invite.createdAt
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Expires</span>
                          <strong>
                            {invite.expiresAt
                              ? formatDate(
                                  invite.expiresAt
                                )
                              : "Never"}
                          </strong>
                        </div>

                        <div>
                          <span>Last used</span>
                          <strong>
                            {formatDateTime(
                              invite.lastUsedAt
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="invite-card-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          copyInvite(invite)
                        }
                      >
                        <CopyIcon />
                        Copy link
                      </button>

                      {!invite.revoked &&
                        status.className ===
                          "active" && (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              revokeInvite(
                                invite.code
                              )
                            }
                          >
                            <TrashIcon />
                            Revoke
                          </button>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {notice && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {notice}
        </div>
      )}

      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >
          <div className="create-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  NEW INVITATION
                </span>

                <h2>Create invitation</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={createInvite}>
              <label className="field">
                <span>
                  Custom code
                  <small>Optional</small>
                </span>

                <input
                  type="text"
                  value={customCode}
                  onChange={(event) =>
                    setCustomCode(
                      event.target.value
                        .toUpperCase()
                    )
                  }
                  placeholder="FDS-XXXX-XXXX"
                  maxLength={100}
                />

                <em>
                  Leave empty to automatically generate
                  a secure invitation.
                </em>
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>Maximum uses</span>

                  <select
                    value={maxUses}
                    onChange={(event) =>
                      setMaxUses(
                        event.target.value
                      )
                    }
                  >
                    <option value="1">
                      1 use
                    </option>
                    <option value="5">
                      5 uses
                    </option>
                    <option value="10">
                      10 uses
                    </option>
                    <option value="25">
                      25 uses
                    </option>
                    <option value="100">
                      100 uses
                    </option>
                    <option value="0">
                      Unlimited
                    </option>
                  </select>
                </label>

                <label className="field">
                  <span>Expiration</span>

                  <select
                    value={expiresInDays}
                    onChange={(event) =>
                      setExpiresInDays(
                        event.target.value
                      )
                    }
                  >
                    <option value="1">
                      1 day
                    </option>
                    <option value="3">
                      3 days
                    </option>
                    <option value="7">
                      7 days
                    </option>
                    <option value="14">
                      14 days
                    </option>
                    <option value="30">
                      30 days
                    </option>
                    <option value="90">
                      90 days
                    </option>
                    <option value="365">
                      1 year
                    </option>
                  </select>
                </label>
              </div>

              {createError && (
                <div className="form-error">
                  <span>!</span>
                  {createError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="button-spinner" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Create invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GlobalStyles />
    </main>
  );
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      :root {
        --background: #0b0b0c;
        --surface: #111113;
        --surface-2: #151517;
        --surface-3: #19191c;
        --line: rgba(255, 255, 255, 0.085);
        --line-hover: rgba(255, 255, 255, 0.15);
        --text: #f2f2f2;
        --muted: #929297;
        --subtle: #606066;
        --accent: #d6a85c;
      }

      * {
        box-sizing: border-box;
      }

      html {
        background: var(--background);
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
      input,
      select {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .admin-page {
        min-height: 100vh;
        background:
          radial-gradient(
            circle at 50% -10%,
            rgba(255, 255, 255, 0.055),
            transparent 38%
          ),
          var(--background);
      }

      /* ======================================================
         LOGIN
         ====================================================== */

      .login-page {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30px;
        overflow: hidden;
      }

      .ambient {
        position: absolute;
        width: 480px;
        height: 480px;
        border-radius: 50%;
        filter: blur(100px);
        pointer-events: none;
        opacity: 0.08;
      }

      .ambient-one {
        top: -240px;
        left: -180px;
        background: white;
      }

      .ambient-two {
        right: -200px;
        bottom: -280px;
        background: var(--accent);
      }

      .login-shell {
        position: relative;
        z-index: 1;
        width: min(420px, 100%);
        animation: pageEnter 600ms
          cubic-bezier(0.16, 1, 0.3, 1);
      }

      .login-brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 28px;
      }

      .login-brand > span {
        color: #a3a3a8;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
      }

      .login-logo {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .login-card {
        padding: 32px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background:
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.045),
            rgba(255, 255, 255, 0.018)
          );
        box-shadow:
          0 30px 80px rgba(0, 0, 0, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.035);
      }

      .login-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        border: 1px solid var(--line);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.025);
        color: #a5a5aa;
      }

      .login-heading > span,
      .eyebrow {
        color: var(--subtle);
        font-size: 9px;
        font-weight: 750;
        letter-spacing: 0.17em;
      }

      .login-heading h1 {
        margin: 9px 0 9px;
        font-size: 30px;
        line-height: 1.05;
        letter-spacing: -0.045em;
      }

      .login-heading p {
        margin: 0 0 26px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.65;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .field > span {
        display: flex;
        justify-content: space-between;
        color: #b7b7bc;
        font-size: 11px;
        font-weight: 600;
      }

      .field > span small {
        color: var(--subtle);
        font-size: 9px;
        font-weight: 500;
      }

      .field input,
      .field select {
        width: 100%;
        height: 48px;
        padding: 0 14px;
        border: 1px solid var(--line);
        border-radius: 11px;
        outline: none;
        background: rgba(255, 255, 255, 0.025);
        color: var(--text);
        font-size: 13px;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;
      }

      .field select {
        appearance: none;
      }

      .field input::placeholder {
        color: var(--subtle);
      }

      .field input:focus,
      .field select:focus {
        border-color: rgba(255, 255, 255, 0.19);
        background: rgba(255, 255, 255, 0.04);
        box-shadow: 0 0 0 4px
          rgba(255, 255, 255, 0.025);
      }

      .field em {
        color: var(--subtle);
        font-size: 10px;
        line-height: 1.5;
        font-style: normal;
      }

      .form-error {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 12px;
        padding: 11px 12px;
        border: 1px solid rgba(180, 100, 100, 0.13);
        border-radius: 10px;
        background: rgba(180, 100, 100, 0.055);
        color: #bca3a3;
        font-size: 11px;
        line-height: 1.45;
      }

      .form-error > span {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
        border-radius: 6px;
        background: rgba(180, 100, 100, 0.1);
        font-weight: 800;
      }

      .primary-button {
        height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 0 16px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: #ededed;
        color: #101012;
        font-size: 11px;
        font-weight: 700;
        transition:
          transform 0.18s ease,
          background 0.18s ease,
          box-shadow 0.18s ease;
      }

      .primary-button:hover:not(:disabled) {
        transform: translateY(-1px);
        background: #fff;
        box-shadow: 0 9px 24px rgba(0, 0, 0, 0.2);
      }

      .primary-button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .login-button {
        width: 100%;
        margin-top: 17px;
      }

      .secondary-button,
      .danger-button {
        height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 0 12px;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: transparent;
        color: #b1b1b6;
        font-size: 10px;
        font-weight: 650;
        transition:
          border-color 0.18s ease,
          background 0.18s ease,
          color 0.18s ease;
      }

      .secondary-button:hover {
        border-color: var(--line-hover);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
      }

      .danger-button {
        color: #a99a9a;
      }

      .danger-button:hover {
        border-color: rgba(180, 100, 100, 0.2);
        background: rgba(180, 100, 100, 0.055);
        color: #c7adad;
      }

      .login-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        margin-top: 22px;
        color: var(--subtle);
        font-size: 9px;
      }

      /* ======================================================
         DASHBOARD
         ====================================================== */

      .dashboard-header {
        width: min(1180px, calc(100% - 40px));
        height: 76px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--line);
      }

      .dashboard-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dashboard-logo {
        width: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dashboard-brand > div:last-child {
        display: flex;
        flex-direction: column;
      }

      .dashboard-brand strong {
        font-size: 14px;
        line-height: 1;
      }

      .dashboard-brand span {
        margin-top: 4px;
        color: var(--muted);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .dashboard-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .icon-button,
      .logout-button {
        height: 36px;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: transparent;
        color: var(--muted);
        transition:
          border-color 0.18s ease,
          color 0.18s ease,
          background 0.18s ease;
      }

      .icon-button {
        width: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-button:hover,
      .logout-button:hover {
        border-color: var(--line-hover);
        background: rgba(255, 255, 255, 0.035);
        color: var(--text);
      }

      .logout-button {
        padding: 0 12px;
        font-size: 10px;
      }

      .dashboard-container {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
        padding: 65px 0 100px;
      }

      .dashboard-intro {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 30px;
        margin-bottom: 35px;
      }

      .dashboard-intro h1 {
        margin: 9px 0 10px;
        font-size: clamp(34px, 5vw, 50px);
        line-height: 0.98;
        letter-spacing: -0.055em;
      }

      .dashboard-intro p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }

      .create-button {
        flex-shrink: 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 55px;
      }

      .stat-card {
        min-height: 132px;
        padding: 19px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--surface);
      }

      .stat-card > span {
        color: var(--subtle);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .stat-card strong {
        display: block;
        margin-top: 13px;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.045em;
      }

      .stat-card small {
        display: block;
        margin-top: 10px;
        color: var(--subtle);
        font-size: 10px;
      }

      .invites-toolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 18px;
      }

      .invites-toolbar h2 {
        margin: 7px 0 0;
        font-size: 24px;
        letter-spacing: -0.035em;
      }

      .filter-tabs {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 3px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.018);
      }

      .filter-tabs button {
        height: 30px;
        padding: 0 10px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--subtle);
        font-size: 9px;
        font-weight: 650;
      }

      .filter-tabs button:hover {
        color: var(--muted);
      }

      .filter-tabs button.filter-active {
        background: rgba(255, 255, 255, 0.07);
        color: var(--text);
      }

      .invite-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .invite-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 19px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--surface);
        transition:
          border-color 0.18s ease,
          background 0.18s ease;
      }

      .invite-card:hover {
        border-color: var(--line-hover);
        background: var(--surface-2);
      }

      .invite-card-main {
        min-width: 0;
        flex: 1;
      }

      .invite-code-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .invite-code-row code {
        color: #ededed;
        font-family:
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;
        font-size: 13px;
        font-weight: 650;
        letter-spacing: 0.03em;
      }

      .invite-status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 7px;
        border-radius: 99px;
        font-size: 8px;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }

      .invite-status > span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }

      .invite-status.active {
        color: #8f9e92;
        background: rgba(100, 140, 110, 0.08);
      }

      .invite-status.used {
        color: #96969c;
        background: rgba(150, 150, 156, 0.07);
      }

      .invite-status.expired,
      .invite-status.revoked {
        color: #9f8e8e;
        background: rgba(150, 100, 100, 0.07);
      }

      .invite-url {
        display: block;
        width: fit-content;
        max-width: 100%;
        margin-top: 7px;
        overflow: hidden;
        color: var(--subtle);
        font-family:
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .invite-url:hover {
        color: var(--muted);
      }

      .invite-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        margin-top: 16px;
      }

      .invite-meta div {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .invite-meta span {
        color: var(--subtle);
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .invite-meta strong {
        color: #a8a8ad;
        font-size: 10px;
        font-weight: 550;
      }

      .invite-card-actions {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        gap: 6px;
      }

      .empty-state {
        min-height: 280px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        border: 1px solid var(--line);
        border-radius: 15px;
        background: var(--surface);
        text-align: center;
      }

      .empty-logo {
        width: 54px;
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 17px;
        border: 1px solid var(--line);
        border-radius: 14px;
      }

      .empty-state h3 {
        margin: 0;
        font-size: 16px;
      }

      .empty-state p {
        max-width: 330px;
        margin: 7px 0 18px;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.6;
      }

      /* ======================================================
         MODAL
         ====================================================== */

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.68);
        backdrop-filter: blur(9px);
        animation: fadeIn 180ms ease;
      }

      .create-modal {
        width: min(500px, 100%);
        padding: 25px;
        border: 1px solid var(--line-hover);
        border-radius: 18px;
        background: #131315;
        box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5);
        animation: modalEnter 250ms
          cubic-bezier(0.16, 1, 0.3, 1);
      }

      .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 25px;
      }

      .modal-header h2 {
        margin: 7px 0 0;
        font-size: 23px;
        letter-spacing: -0.035em;
      }

      .modal-close {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: transparent;
        color: var(--muted);
      }

      .modal-close:hover {
        color: var(--text);
        background: rgba(255, 255, 255, 0.04);
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 17px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 7px;
        margin-top: 25px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
      }

      /* ======================================================
         TOAST / LOADING
         ====================================================== */

      .toast {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 11px 14px;
        border: 1px solid var(--line-hover);
        border-radius: 10px;
        background: #18181a;
        color: #d2d2d5;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.35);
        font-size: 10px;
        animation: toastEnter 250ms
          cubic-bezier(0.16, 1, 0.3, 1);
      }

      .toast-check {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 19px;
        height: 19px;
        border-radius: 6px;
        background: rgba(100, 140, 110, 0.12);
        color: #9aaf9e;
        font-size: 10px;
      }

      .loading-page {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 13px;
        color: var(--muted);
        font-size: 10px;
      }

      .loading-spinner,
      .button-spinner {
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: rgba(255, 255, 255, 0.75);
        border-radius: 50%;
        animation: spin 700ms linear infinite;
      }

      .loading-spinner {
        width: 22px;
        height: 22px;
      }

      .button-spinner {
        width: 13px;
        height: 13px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pageEnter {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.985);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @keyframes modalEnter {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes toastEnter {
        from {
          opacity: 0;
          transform: translateY(8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ======================================================
         MOBILE
         ====================================================== */

      @media (max-width: 800px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .dashboard-intro {
          align-items: flex-start;
          flex-direction: column;
        }

        .invites-toolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .invite-card {
          align-items: flex-start;
          flex-direction: column;
        }

        .invite-card-actions {
          width: 100%;
        }

        .invite-card-actions button {
          flex: 1;
        }
      }

      @media (max-width: 600px) {
        .login-page {
          padding: 18px;
        }

        .login-card {
          padding: 24px;
        }

        .dashboard-header,
        .dashboard-container {
          width: min(100% - 28px, 1180px);
        }

        .dashboard-header {
          height: 68px;
        }

        .dashboard-container {
          padding-top: 45px;
        }

        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }

        .stat-card {
          min-height: 115px;
          padding: 15px;
        }

        .stat-card strong {
          font-size: 25px;
        }

        .filter-tabs {
          width: 100%;
          overflow-x: auto;
        }

        .filter-tabs button {
          flex-shrink: 0;
        }

        .invite-meta {
          gap: 14px;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .modal-actions {
          flex-direction: column-reverse;
        }

        .modal-actions button {
          width: 100%;
        }

        .toast {
          right: 14px;
          bottom: 14px;
          left: 14px;
        }
      }
    `}</style>
  );
}
