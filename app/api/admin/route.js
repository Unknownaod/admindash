import crypto from "crypto";
import { cookies } from "next/headers";
import { sql, initializeDatabase } from "../../../lib/db";

export const runtime = "nodejs";

const SESSION_COOKIE = "fades_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ============================================================
// RESPONSE HELPERS
// ============================================================

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

// ============================================================
// ENVIRONMENT
// ============================================================

function getAdminCode() {
  return process.env.ADMIN_CODE || "";
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_CODE ||
    ""
  );
}

// ============================================================
// BASE64URL
// ============================================================

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function fromBase64url(value) {
  return Buffer.from(
    value.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
}

// ============================================================
// SESSION
// ============================================================

function createSessionToken() {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured."
    );
  }

  const timestamp = Date.now().toString();

  const random = crypto
    .randomBytes(32)
    .toString("hex");

  const payload = `${timestamp}.${random}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();

  return `${base64url(
    Buffer.from(payload)
  )}.${base64url(signature)}`;
}

function verifySessionToken(token) {
  try {
    if (!token) {
      return false;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const payload = fromBase64url(
      parts[0]
    ).toString();

    const suppliedSignature =
      fromBase64url(parts[1]);

    const secret = getSessionSecret();

    if (!secret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest();

    if (
      suppliedSignature.length !==
      expectedSignature.length
    ) {
      return false;
    }

    if (
      !crypto.timingSafeEqual(
        suppliedSignature,
        expectedSignature
      )
    ) {
      return false;
    }

    const [timestamp] =
      payload.split(".");

    const createdAt = Number(timestamp);

    if (!Number.isFinite(createdAt)) {
      return false;
    }

    const age =
      Date.now() - createdAt;

    if (
      age < 0 ||
      age > SESSION_MAX_AGE * 1000
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function isAdmin() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE
  )?.value;

  return verifySessionToken(token);
}

// ============================================================
// INVITE HELPERS
// ============================================================

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function generateInviteCode() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const makePart = () => {
    const bytes = crypto.randomBytes(4);

    let output = "";

    for (let i = 0; i < 4; i++) {
      output +=
        alphabet[
          bytes[i] % alphabet.length
        ];
    }

    return output;
  };

  return `FDS-${makePart()}-${makePart()}-${makePart()}`;
}

function generateId() {
  return crypto.randomUUID();
}

function parseExpiration(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function calculateStatus(invite) {
  if (invite.status === "revoked") {
    return "revoked";
  }

  if (invite.status === "used") {
    return "used";
  }

  if (
    invite.expires_at &&
    new Date(invite.expires_at).getTime() <=
      Date.now()
  ) {
    return "expired";
  }

  return "active";
}

// ============================================================
// LOGIN
// ============================================================

async function handleLogin(request) {
  const body = await request
    .json()
    .catch(() => ({}));

  const suppliedCode = String(
    body.code || ""
  );

  const configuredCode =
    getAdminCode();

  if (!configuredCode) {
    return json(
      {
        success: false,
        error:
          "ADMIN_CODE is not configured on the server.",
      },
      500
    );
  }

  const suppliedBuffer =
    Buffer.from(suppliedCode);

  const configuredBuffer =
    Buffer.from(configuredCode);

  const validLength =
    suppliedBuffer.length ===
    configuredBuffer.length;

  let valid = false;

  if (validLength) {
    valid = crypto.timingSafeEqual(
      suppliedBuffer,
      configuredBuffer
    );
  }

  if (!valid) {
    return json(
      {
        success: false,
        error:
          "Invalid administrator code.",
      },
      401
    );
  }

  const token =
    createSessionToken();

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    }
  );

  return json({
    success: true,
  });
}

// ============================================================
// LOGOUT
// ============================================================

async function handleLogout() {
  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    }
  );

  return json({
    success: true,
  });
}

// ============================================================
// SESSION
// ============================================================

async function handleSession() {
  return json({
    authenticated:
      await isAdmin(),
  });
}

// ============================================================
// CREATE INVITE
// ============================================================

async function handleCreateInvite(
  request
) {
  if (!(await isAdmin())) {
    return json(
      {
        success: false,
        error: "Unauthorized.",
      },
      401
    );
  }

  const body = await request
    .json()
    .catch(() => ({}));

  const requestedExpiration =
    parseExpiration(
      body.expiresAt
    );

  if (
    requestedExpiration &&
    new Date(
      requestedExpiration
    ).getTime() <= Date.now()
  ) {
    return json(
      {
        success: false,
        error:
          "Expiration must be in the future.",
      },
      400
    );
  }

  let code =
    generateInviteCode();

  // Make sure the generated code
  // isn't already in the database.
  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {
    const existing = await sql`
      SELECT id
      FROM invites
      WHERE code = ${code}
      LIMIT 1
    `;

    // Neon returns an array directly.
    if (existing.length === 0) {
      break;
    }

    code =
      generateInviteCode();
  }

  const id =
    generateId();

  await sql`
    INSERT INTO invites (
      id,
      code,
      status,
      expires_at
    )
    VALUES (
      ${id},
      ${code},
      'active',
      ${requestedExpiration}
    )
  `;

  return json({
    success: true,
    invite: {
      id,
      code,
      status: "active",
      expiresAt:
        requestedExpiration,
    },
  });
}

// ============================================================
// LIST INVITES
// ============================================================

async function handleListInvites() {
  if (!(await isAdmin())) {
    return json(
      {
        success: false,
        error: "Unauthorized.",
      },
      401
    );
  }

  const result = await sql`
    SELECT
      id,
      code,
      status,
      created_at,
      used_at,
      revoked_at,
      expires_at
    FROM invites
    ORDER BY created_at DESC
  `;

  // Neon returns the rows directly.
  const invites =
    result.map((invite) => ({
      id: invite.id,
      code: invite.code,
      status:
        calculateStatus(invite),
      createdAt:
        invite.created_at,
      usedAt:
        invite.used_at,
      revokedAt:
        invite.revoked_at,
      expiresAt:
        invite.expires_at,
    }));

  return json({
    success: true,
    invites,
  });
}

// ============================================================
// VALIDATE INVITE
// ============================================================

async function handleValidateInvite(
  request
) {
  const { searchParams } =
    new URL(request.url);

  const code =
    normalizeCode(
      searchParams.get("code")
    );

  if (!code) {
    return json({
      valid: false,
    });
  }

  const result = await sql`
    SELECT
      code,
      status,
      expires_at
    FROM invites
    WHERE code = ${code}
    LIMIT 1
  `;

  // Neon returns an array.
  if (result.length === 0) {
    return json({
      valid: false,
    });
  }

  const invite =
    result[0];

  if (
    invite.status !==
    "active"
  ) {
    return json({
      valid: false,
    });
  }

  if (
    invite.expires_at &&
    new Date(
      invite.expires_at
    ).getTime() <= Date.now()
  ) {
    return json({
      valid: false,
    });
  }

  return json({
    valid: true,
  });
}

// ============================================================
// REDEEM INVITE
// ============================================================

async function handleRedeemInvite(
  request
) {
  const body = await request
    .json()
    .catch(() => ({}));

  const code =
    normalizeCode(body.code);

  if (!code) {
    return json(
      {
        success: false,
        error:
          "Invite code is required.",
      },
      400
    );
  }

  /*
   * Atomic redemption.
   *
   * Only an active and non-expired
   * invite can become used.
   *
   * This prevents two signup
   * requests from consuming the
   * same invite.
   */

  const result = await sql`
    UPDATE invites
    SET
      status = 'used',
      used_at = NOW()
    WHERE
      code = ${code}
      AND status = 'active'
      AND (
        expires_at IS NULL
        OR expires_at > NOW()
      )
    RETURNING
      id,
      code,
      status,
      used_at
  `;

  // Neon returns an array.
  if (result.length === 0) {
    return json(
      {
        success: false,
        error:
          "Invite code is invalid, expired, revoked, or already used.",
      },
      400
    );
  }

  const invite =
    result[0];

  return json({
    success: true,
    invite: {
      id: invite.id,
      code: invite.code,
      status: invite.status,
      usedAt: invite.used_at,
    },
  });
}

// ============================================================
// REVOKE INVITE
// ============================================================

async function handleRevokeInvite(
  request
) {
  if (!(await isAdmin())) {
    return json(
      {
        success: false,
        error: "Unauthorized.",
      },
      401
    );
  }

  const { searchParams } =
    new URL(request.url);

  const code =
    normalizeCode(
      searchParams.get("code")
    );

  if (!code) {
    return json(
      {
        success: false,
        error:
          "Invite code is required.",
      },
      400
    );
  }

  const result = await sql`
    UPDATE invites
    SET
      status = 'revoked',
      revoked_at = NOW()
    WHERE
      code = ${code}
      AND status = 'active'
    RETURNING
      id,
      code,
      status,
      revoked_at
  `;

  // Neon returns an array.
  if (result.length === 0) {
    return json(
      {
        success: false,
        error:
          "Invite was not found or is no longer active.",
      },
      404
    );
  }

  return json({
    success: true,
  });
}

// ============================================================
// STATS
// ============================================================

async function handleStats() {
  if (!(await isAdmin())) {
    return json(
      {
        success: false,
        error: "Unauthorized.",
      },
      401
    );
  }

  const result = await sql`
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE
          status = 'active'
          AND (
            expires_at IS NULL
            OR expires_at > NOW()
          )
      )::int AS active,

      COUNT(*) FILTER (
        WHERE status = 'used'
      )::int AS used,

      COUNT(*) FILTER (
        WHERE status = 'revoked'
      )::int AS revoked,

      COUNT(*) FILTER (
        WHERE
          status = 'active'
          AND expires_at IS NOT NULL
          AND expires_at <= NOW()
      )::int AS expired

    FROM invites
  `;

  // Neon returns an array.
  const stats =
    result[0];

  return json({
    success: true,
    stats: {
      total:
        Number(stats.total) || 0,

      active:
        Number(stats.active) || 0,

      used:
        Number(stats.used) || 0,

      revoked:
        Number(stats.revoked) || 0,

      expired:
        Number(stats.expired) || 0,
    },
  });
}

// ============================================================
// GET
// ============================================================

export async function GET(request) {
  try {
    await initializeDatabase();

    const { searchParams } =
      new URL(request.url);

    const action =
      searchParams.get("action") ||
      "session";

    switch (action) {
      case "session":
        return handleSession();

      case "invites":
        return handleListInvites();

      case "validate":
        return handleValidateInvite(
          request
        );

      case "stats":
        return handleStats();

      default:
        return json(
          {
            success: false,
            error:
              "Unknown action.",
          },
          400
        );
    }
  } catch (error) {
    console.error(
      "Fades Admin GET error:",
      error
    );

    return json(
      {
        success: false,
        error:
          "Internal server error.",
        details:
          process.env.NODE_ENV !==
          "production"
            ? String(
                error?.message ||
                  error
              )
            : undefined,
      },
      500
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(request) {
  try {
    await initializeDatabase();

    const url =
      new URL(request.url);

    let action =
      url.searchParams.get(
        "action"
      );

    if (!action) {
      const clone =
        request.clone();

      const body =
        await clone
          .json()
          .catch(() => ({}));

      action =
        body.action;
    }

    switch (action) {
      case "login":
        return handleLogin(
          request
        );

      case "logout":
        return handleLogout();

      case "create_invite":
        return handleCreateInvite(
          request
        );

      case "redeem":
        return handleRedeemInvite(
          request
        );

      default:
        return json(
          {
            success: false,
            error:
              "Unknown action.",
          },
          400
        );
    }
  } catch (error) {
    console.error(
      "Fades Admin POST error:",
      error
    );

    return json(
      {
        success: false,
        error:
          "Internal server error.",
        details:
          process.env.NODE_ENV !==
          "production"
            ? String(
                error?.message ||
                  error
              )
            : undefined,
      },
      500
    );
  }
}

// ============================================================
// DELETE
// ============================================================

export async function DELETE(request) {
  try {
    await initializeDatabase();

    const { searchParams } =
      new URL(request.url);

    const action =
      searchParams.get(
        "action"
      );

    if (action !== "revoke") {
      return json(
        {
          success: false,
          error:
            "Unknown action.",
        },
        400
      );
    }

    return handleRevokeInvite(
      request
    );
  } catch (error) {
    console.error(
      "Fades Admin DELETE error:",
      error
    );

    return json(
      {
        success: false,
        error:
          "Internal server error.",
        details:
          process.env.NODE_ENV !==
          "production"
            ? String(
                error?.message ||
                  error
              )
            : undefined,
      },
      500
    );
  }
}
