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
