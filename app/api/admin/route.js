import crypto from "crypto";
import { cookies } from "next/headers";
import { sql, initializeDatabase } from "../../../lib/db";

export const runtime = "nodejs";

const SESSION_COOKIE = "fades_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const MIN_INVITE_USES = 1;
const MAX_INVITE_USES = 100000;

// ============================================================
// RATE LIMITING
// ============================================================
//
// These limits are intentionally kept in memory.
//
// IMPORTANT:
// - This protects the route from basic abuse/brute-force attacks.
// - It does NOT require database changes.
// - On serverless/multi-instance deployments, each instance has
//   its own limiter. For stronger distributed protection, use
//   Cloudflare/WAF or Redis later.
//
// Limits:
//
// LOGIN
//   5 attempts / 15 minutes per IP
//
// VALIDATE
//   60 requests / minute per IP
//
// REDEEM
//   10 requests / 10 minutes per IP
//
// ADMIN ACTIONS
//   120 requests / minute per IP
//
// GLOBAL
//   300 requests / minute per IP
//
// ============================================================

const RATE_LIMITS = {
  global: {
    max: 300,
    windowMs: 60 * 1000,
  },

  login: {
    max: 5,
    windowMs: 15 * 60 * 1000,
  },

  validate: {
    max: 60,
    windowMs: 60 * 1000,
  },

  redeem: {
    max: 10,
    windowMs: 10 * 60 * 1000,
  },

  admin: {
    max: 120,
    windowMs: 60 * 1000,
  },
};

const rateLimitStore = new Map();

let lastRateLimitCleanup = Date.now();

const RATE_LIMIT_CLEANUP_INTERVAL =
  5 * 60 * 1000;

// ============================================================
// RATE LIMIT HELPERS
// ============================================================

function getClientIp(request) {
  /*
   * Prefer the platform-provided forwarded IP.
   *
   * We intentionally only use the first IP when multiple
   * addresses are supplied.
   */

  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  if (forwardedFor) {
    const firstIp =
      forwardedFor
        .split(",")[0]
        .trim();

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp =
    request.headers.get(
      "x-real-ip"
    );

  if (realIp) {
    return realIp.trim();
  }

  /*
   * If the platform does not expose an IP,
   * use a safe fallback key.
   */

  return "unknown";
}

function cleanupRateLimits() {
  const now = Date.now();

  if (
    now - lastRateLimitCleanup <
    RATE_LIMIT_CLEANUP_INTERVAL
  ) {
    return;
  }

  lastRateLimitCleanup = now;

  for (
    const [
      key,
      entry,
    ] of rateLimitStore.entries()
  ) {
    if (
      !entry ||
      entry.resetAt <= now
    ) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(
  request,
  type
) {
  cleanupRateLimits();

  const config =
    RATE_LIMITS[type];

  if (!config) {
    return {
      allowed: true,
      remaining: Infinity,
      retryAfter: 0,
    };
  }

  const ip =
    getClientIp(request);

  const now = Date.now();

  const key =
    `${type}:${ip}`;

  let entry =
    rateLimitStore.get(key);

  /*
   * Start a new window.
   */

  if (
    !entry ||
    entry.resetAt <= now
  ) {
    entry = {
      count: 0,
      resetAt:
        now + config.windowMs,
    };

    rateLimitStore.set(
      key,
      entry
    );
  }

  entry.count += 1;

  const remaining =
    Math.max(
      0,
      config.max -
        entry.count
    );

  if (
    entry.count >
    config.max
  ) {
    const retryAfter =
      Math.max(
        1,
        Math.ceil(
          (entry.resetAt -
            now) /
            1000
        )
      );

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      limit: config.max,
      resetAt:
        entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining,
    retryAfter: 0,
    limit: config.max,
    resetAt:
      entry.resetAt,
  };
}

function rateLimitResponse(
  result
) {
  const response =
    json(
      {
        success: false,
        error:
          "Too many requests. Please try again later.",
        retryAfter:
          result.retryAfter,
      },
      429
    );

  /*
   * Add Retry-After so browsers and clients know
   * when they can try again.
   */

  response.headers.set(
    "Retry-After",
    String(
      result.retryAfter
    )
  );

  response.headers.set(
    "X-RateLimit-Limit",
    String(
      result.limit
    )
  );

  response.headers.set(
    "X-RateLimit-Remaining",
    "0"
  );

  return response;
}

function applyRateLimit(
  request,
  type
) {
  /*
   * Global limiter first.
   */

  const global =
    checkRateLimit(
      request,
      "global"
    );

  if (!global.allowed) {
    return global;
  }

  /*
   * Action-specific limiter.
   */

  const specific =
    checkRateLimit(
      request,
      type
    );

  return specific;
}

// ============================================================
// CORS
// ============================================================

const ALLOWED_ORIGINS = new Set([
  "https://mail.fades.lol",
  "https://www.mail.fades.lol",
]);

function applyCors(
  response,
  request
) {
  const origin =
    request.headers.get(
      "origin"
    );

  const headers =
    new Headers(
      response.headers
    );

  if (
    origin &&
    ALLOWED_ORIGINS.has(
      origin
    )
  ) {
    headers.set(
      "Access-Control-Allow-Origin",
      origin
    );

    headers.set(
      "Access-Control-Allow-Credentials",
      "true"
    );

    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, DELETE, OPTIONS"
    );

    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Cache-Control"
    );

    headers.set(
      "Access-Control-Max-Age",
      "86400"
    );

    headers.set(
      "Vary",
      "Origin"
    );
  }

  headers.set(
    "Cache-Control",
    "no-store"
  );

  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers,
    }
  );
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function json(
  data,
  status = 200
) {
  return Response.json(
    data,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================
// ENVIRONMENT
// ============================================================

function getAdminCode() {
  return (
    process.env.ADMIN_CODE ||
    ""
  );
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

function base64url(
  buffer
) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=/g,
      ""
    );
}

function fromBase64url(
  value
) {
  return Buffer.from(
    value
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      ),
    "base64"
  );
}

// ============================================================
// SESSION
// ============================================================

function createSessionToken() {
  const secret =
    getSessionSecret();

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured."
    );
  }

  const timestamp =
    Date.now().toString();

  const random =
    crypto
      .randomBytes(32)
      .toString("hex");

  const payload =
    `${timestamp}.${random}`;

  const signature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(payload)
      .digest();

  return (
    `${base64url(
      Buffer.from(payload)
    )}.${base64url(
      signature
    )}`
  );
}

function verifySessionToken(
  token
) {
  try {
    if (!token) {
      return false;
    }

    const parts =
      token.split(".");

    if (
      parts.length !== 2
    ) {
      return false;
    }

    const payload =
      fromBase64url(
        parts[0]
      ).toString();

    const suppliedSignature =
      fromBase64url(
        parts[1]
      );

    const secret =
      getSessionSecret();

    if (!secret) {
      return false;
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
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

    const [
      timestamp,
    ] =
      payload.split(".");

    const createdAt =
      Number(timestamp);

    if (
      !Number.isFinite(
        createdAt
      )
    ) {
      return false;
    }

    const age =
      Date.now() -
      createdAt;

    if (
      age < 0 ||
      age >
        SESSION_MAX_AGE *
          1000
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function isAdmin() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  return verifySessionToken(
    token
  );
}

// ============================================================
// DATABASE MIGRATION
// ============================================================

async function ensureInviteUsageColumns() {
  await sql`
    ALTER TABLE invites
    ADD COLUMN IF NOT EXISTS max_uses INTEGER NOT NULL DEFAULT 1
  `;

  await sql`
    ALTER TABLE invites
    ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0
  `;

  await sql`
    UPDATE invites
    SET max_uses = 1
    WHERE max_uses IS NULL
       OR max_uses < 1
  `;

  await sql`
    UPDATE invites
    SET use_count = 0
    WHERE use_count IS NULL
       OR use_count < 0
  `;

  await sql`
    UPDATE invites
    SET use_count = max_uses
    WHERE status = 'used'
      AND use_count < max_uses
  `;
}

// ============================================================
// INVITE HELPERS
// ============================================================

function normalizeCode(
  code
) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function generateInviteCode() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const makePart = () => {
    const bytes =
      crypto.randomBytes(4);

    let output = "";

    for (
      let i = 0;
      i < 4;
      i++
    ) {
      output +=
        alphabet[
          bytes[i] %
            alphabet.length
        ];
    }

    return output;
  };

  return (
    `FDS-${makePart()}-${makePart()}-${makePart()}`
  );
}

function generateId() {
  return crypto.randomUUID();
}

function parseExpiration(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function parseMaxUses(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 1;
  }

  const number =
    Number(value);

  if (
    !Number.isInteger(
      number
    )
  ) {
    return null;
  }

  if (
    number <
      MIN_INVITE_USES ||
    number >
      MAX_INVITE_USES
  ) {
    return null;
  }

  return number;
}

function getMaxUses(
  invite
) {
  const value =
    Number(
      invite.max_uses
    );

  if (
    !Number.isInteger(
      value
    ) ||
    value < 1
  ) {
    return 1;
  }

  return value;
}

function getUseCount(
  invite
) {
  const value =
    Number(
      invite.use_count
    );

  if (
    !Number.isInteger(
      value
    ) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function getRemainingUses(
  invite
) {
  return Math.max(
    0,
    getMaxUses(invite) -
      getUseCount(invite)
  );
}

function calculateStatus(
  invite
) {
  if (
    invite.status ===
    "revoked"
  ) {
    return "revoked";
  }

  const maxUses =
    getMaxUses(invite);

  const useCount =
    getUseCount(invite);

  if (
    invite.status ===
      "used" ||
    useCount >= maxUses
  ) {
    return "used";
  }

  if (
    invite.expires_at &&
    new Date(
      invite.expires_at
    ).getTime() <=
      Date.now()
  ) {
    return "expired";
  }

  return "active";
}

// ============================================================
// LOGIN
// ============================================================

async function handleLogin(
  request
) {
  const rateLimit =
    applyRateLimit(
      request,
      "login"
    );

  if (
    !rateLimit.allowed
  ) {
    return rateLimitResponse(
      rateLimit
    );
  }

  const body =
    await request
      .json()
      .catch(
        () => ({})
      );

  const suppliedCode =
    String(
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
    Buffer.from(
      suppliedCode
    );

  const configuredBuffer =
    Buffer.from(
      configuredCode
    );

  const validLength =
    suppliedBuffer.length ===
    configuredBuffer.length;

  let valid = false;

  if (validLength) {
    valid =
      crypto.timingSafeEqual(
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
      sameSite:
        "strict",
      path: "/",
      maxAge:
        SESSION_MAX_AGE,
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
      sameSite:
        "strict",
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

async function handleSession(
  request
) {
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
        error:
          "Unauthorized.",
      },
      401
    );
  }

  const body =
    await request
      .json()
      .catch(
        () => ({})
      );

  const requestedExpiration =
    parseExpiration(
      body.expiresAt
    );

  if (
    body.expiresAt &&
    !requestedExpiration
  ) {
    return json(
      {
        success: false,
        error:
          "Invalid expiration date.",
      },
      400
    );
  }

  if (
    requestedExpiration &&
    new Date(
      requestedExpiration
    ).getTime() <=
      Date.now()
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

  const maxUses =
    parseMaxUses(
      body.maxUses
    );

  if (
    maxUses === null
  ) {
    return json(
      {
        success: false,
        error:
          `maxUses must be a whole number between ${MIN_INVITE_USES} and ${MAX_INVITE_USES}.`,
      },
      400
    );
  }

  let code =
    generateInviteCode();

  let unique = false;

  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {
    const existing =
      await sql`
        SELECT id
        FROM invites
        WHERE code = ${code}
        LIMIT 1
      `;

    if (
      existing.length === 0
    ) {
      unique = true;
      break;
    }

    code =
      generateInviteCode();
  }

  if (!unique) {
    return json(
      {
        success: false,
        error:
          "Unable to generate a unique invite code.",
      },
      500
    );
  }

  const id =
    generateId();

  await sql`
    INSERT INTO invites (
      id,
      code,
      status,
      expires_at,
      max_uses,
      use_count
    )
    VALUES (
      ${id},
      ${code},
      'active',
      ${requestedExpiration},
      ${maxUses},
      0
    )
  `;

  return json({
    success: true,
    invite: {
      id,
      code,
      status:
        "active",
      createdAt:
        new Date().toISOString(),
      expiresAt:
        requestedExpiration,
      maxUses,
      useCount: 0,
      remainingUses:
        maxUses,
    },
  });
}

// ============================================================
// LIST INVITES
// ============================================================

async function handleListInvites(
  request
) {
  if (!(await isAdmin())) {
    return json(
      {
        success: false,
        error:
          "Unauthorized.",
      },
      401
    );
  }

  const result =
    await sql`
      SELECT
        id,
        code,
        status,
        created_at,
        used_at,
        revoked_at,
        expires_at,
        max_uses,
        use_count
      FROM invites
      ORDER BY created_at DESC
    `;

  const invites =
    result.map(
      (invite) => {
        const maxUses =
          getMaxUses(
            invite
          );

        const useCount =
          getUseCount(
            invite
          );

        const remainingUses =
          Math.max(
            0,
            maxUses -
              useCount
          );

        return {
          id:
            invite.id,

          code:
            invite.code,

          status:
            calculateStatus(
              invite
            ),

          createdAt:
            invite.created_at,

          usedAt:
            invite.used_at,

          revokedAt:
            invite.revoked_at,

          expiresAt:
            invite.expires_at,

          maxUses,

          useCount,

          remainingUses,
        };
      }
    );

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
  const rateLimit =
    applyRateLimit(
      request,
      "validate"
    );

  if (
    !rateLimit.allowed
  ) {
    return rateLimitResponse(
      rateLimit
    );
  }

  const {
    searchParams,
  } =
    new URL(
      request.url
    );

  const code =
    normalizeCode(
      searchParams.get(
        "code"
      )
    );

  if (!code) {
    return json({
      valid: false,
    });
  }

  /*
   * Prevent absurdly large inputs from being
   * sent to the database.
   */

  if (
    code.length > 64
  ) {
    return json({
      valid: false,
    });
  }

  const result =
    await sql`
      SELECT
        id,
        code,
        status,
        expires_at,
        max_uses,
        use_count
      FROM invites
      WHERE code = ${code}
      LIMIT 1
    `;

  if (
    result.length === 0
  ) {
    return json({
      valid: false,
    });
  }

  const invite =
    result[0];

  const maxUses =
    getMaxUses(invite);

  const useCount =
    getUseCount(invite);

  const remainingUses =
    Math.max(
      0,
      maxUses -
        useCount
    );

  if (
    invite.status ===
    "revoked"
  ) {
    return json({
      valid: false,
    });
  }

  if (
    invite.status ===
      "used" ||
    remainingUses <= 0
  ) {
    return json({
      valid: false,
    });
  }

  if (
    invite.expires_at &&
    new Date(
      invite.expires_at
    ).getTime() <=
      Date.now()
  ) {
    return json({
      valid: false,
    });
  }

  return json({
    valid: true,
    invite: {
      code:
        invite.code,

      maxUses,

      useCount,

      remainingUses,

      expiresAt:
        invite.expires_at,
    },
  });
}

// ============================================================
// REDEEM INVITE
// ============================================================

async function handleRedeemInvite(
  request
) {
  const rateLimit =
    applyRateLimit(
      request,
      "redeem"
    );

  if (
    !rateLimit.allowed
  ) {
    return rateLimitResponse(
      rateLimit
    );
  }

  const body =
    await request
      .json()
      .catch(
        () => ({})
      );

  const code =
    normalizeCode(
      body.code
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

  if (
    code.length > 64
  ) {
    return json(
      {
        success: false,
        error:
          "Invalid invite code.",
      },
      400
    );
  }

  const result =
    await sql`
      UPDATE invites
      SET
        use_count =
          use_count + 1,

        status =
          CASE
            WHEN use_count + 1 >= max_uses
              THEN 'used'
            ELSE 'active'
          END,

        used_at =
          CASE
            WHEN use_count + 1 >= max_uses
              THEN COALESCE(
                used_at,
                NOW()
              )
            ELSE used_at
          END

      WHERE
        code = ${code}

        AND status = 'active'

        AND use_count < max_uses

        AND (
          expires_at IS NULL
          OR expires_at > NOW()
        )

      RETURNING
        id,
        code,
        status,
        used_at,
        expires_at,
        max_uses,
        use_count
    `;

  if (
    result.length === 0
  ) {
    return json(
      {
        success: false,
        error:
          "Invite code is invalid, expired, revoked, or has no remaining uses.",
      },
      400
    );
  }

  const invite =
    result[0];

  const maxUses =
    getMaxUses(invite);

  const useCount =
    getUseCount(invite);

  const remainingUses =
    Math.max(
      0,
      maxUses -
        useCount
    );

  return json({
    success: true,

    invite: {
      id:
        invite.id,

      code:
        invite.code,

      status:
        calculateStatus(
          invite
        ),

      usedAt:
        invite.used_at,

      expiresAt:
        invite.expires_at,

      maxUses,

      useCount,

      remainingUses,
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
        error:
          "Unauthorized.",
      },
      401
    );
  }

  const {
    searchParams,
  } =
    new URL(
      request.url
    );

  const code =
    normalizeCode(
      searchParams.get(
        "code"
      )
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

  const result =
    await sql`
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
        revoked_at,
        max_uses,
        use_count
    `;

  if (
    result.length === 0
  ) {
    return json(
      {
        success: false,
        error:
          "Invite was not found or is no longer active.",
      },
      404
    );
  }

  const invite =
    result[0];

  return json({
    success: true,

    invite: {
      id:
        invite.id,

      code:
        invite.code,

      status:
        "revoked",

      revokedAt:
        invite.revoked_at,

      maxUses:
        getMaxUses(
          invite
        ),

      useCount:
        getUseCount(
          invite
        ),

      remainingUses:
        getRemainingUses(
          invite
        ),
    },
  });
}

// ============================================================
// STATS
// ============================================================

async function handleStats(
  request
) {
  if (!(await isAdmin())) {
    return json(
      {
        success: false,
        error:
          "Unauthorized.",
      },
      401
    );
  }

  const result =
    await sql`
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE
            status = 'active'
            AND use_count < max_uses
            AND (
              expires_at IS NULL
              OR expires_at > NOW()
            )
        )::int AS active,

        COUNT(*) FILTER (
          WHERE
            status = 'used'
            OR use_count >= max_uses
        )::int AS used,

        COUNT(*) FILTER (
          WHERE
            status = 'revoked'
        )::int AS revoked,

        COUNT(*) FILTER (
          WHERE
            status = 'active'
            AND use_count < max_uses
            AND expires_at IS NOT NULL
            AND expires_at <= NOW()
        )::int AS expired,

        COALESCE(
          SUM(use_count),
          0
        )::int AS total_redemptions,

        COALESCE(
          SUM(max_uses),
          0
        )::int AS total_available_uses

      FROM invites
    `;

  const stats =
    result[0];

  return json({
    success: true,

    stats: {
      total:
        Number(
          stats.total
        ) || 0,

      active:
        Number(
          stats.active
        ) || 0,

      used:
        Number(
          stats.used
        ) || 0,

      revoked:
        Number(
          stats.revoked
        ) || 0,

      expired:
        Number(
          stats.expired
        ) || 0,

      totalRedemptions:
        Number(
          stats.total_redemptions
        ) || 0,

      totalAvailableUses:
        Number(
          stats.total_available_uses
        ) || 0,
    },
  });
}

// ============================================================
// OPTIONS — CORS PREFLIGHT
// ============================================================

export async function OPTIONS(
  request
) {
  return applyCors(
    new Response(null, {
      status: 204,
    }),
    request
  );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request
) {
  try {
    /*
     * Global protection applies to every GET request.
     */

    const globalRateLimit =
      checkRateLimit(
        request,
        "global"
      );

    if (
      !globalRateLimit.allowed
    ) {
      return applyCors(
        rateLimitResponse(
          globalRateLimit
        ),
        request
      );
    }

    await initializeDatabase();

    await ensureInviteUsageColumns();

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const action =
      searchParams.get(
        "action"
      ) || "session";

    /*
     * Action-specific protection.
     */

    let rateLimitType =
      null;

    if (
      action ===
      "validate"
    ) {
      rateLimitType =
        "validate";
    } else {
      rateLimitType =
        "admin";
    }

    const actionRateLimit =
      checkRateLimit(
        request,
        rateLimitType
      );

    if (
      !actionRateLimit.allowed
    ) {
      return applyCors(
        rateLimitResponse(
          actionRateLimit
        ),
        request
      );
    }

    let response;

    switch (action) {
      case "session":
        response =
          await handleSession(
            request
          );
        break;

      case "invites":
        response =
          await handleListInvites(
            request
          );
        break;

      case "validate":
        response =
          await handleValidateInvite(
            request
          );
        break;

      case "stats":
        response =
          await handleStats(
            request
          );
        break;

      default:
        response =
          json(
            {
              success: false,
              error:
                "Unknown action.",
            },
            400
          );
        break;
    }

    return applyCors(
      response,
      request
    );
  } catch (error) {
    console.error(
      "Fades Admin GET error:",
      error
    );

    return applyCors(
      json(
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
      ),
      request
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request
) {
  try {
    /*
     * Global POST protection.
     */

    const globalRateLimit =
      checkRateLimit(
        request,
        "global"
      );

    if (
      !globalRateLimit.allowed
    ) {
      return applyCors(
        rateLimitResponse(
          globalRateLimit
        ),
        request
      );
    }

    await initializeDatabase();

    await ensureInviteUsageColumns();

    const url =
      new URL(
        request.url
      );

    let action =
      url.searchParams.get(
        "action"
      );

    if (!action) {
      const body =
        await request
          .clone()
          .json()
          .catch(
            () => ({})
          );

      action =
        body.action;
    }

    /*
     * Action-specific rate limits.
     */

    let rateLimitType =
      "admin";

    if (
      action === "login"
    ) {
      rateLimitType =
        "login";
    }

    if (
      action === "redeem"
    ) {
      rateLimitType =
        "redeem";
    }

    const actionRateLimit =
      checkRateLimit(
        request,
        rateLimitType
      );

    if (
      !actionRateLimit.allowed
    ) {
      return applyCors(
        rateLimitResponse(
          actionRateLimit
        ),
        request
      );
    }

    let response;

    switch (action) {
      case "login":
        response =
          await handleLogin(
            request
          );
        break;

      case "logout":
        response =
          await handleLogout();
        break;

      case "create_invite":
        response =
          await handleCreateInvite(
            request
          );
        break;

      case "redeem":
        response =
          await handleRedeemInvite(
            request
          );
        break;

      default:
        response =
          json(
            {
              success: false,
              error:
                "Unknown action.",
            },
            400
          );
        break;
    }

    return applyCors(
      response,
      request
    );
  } catch (error) {
    console.error(
      "Fades Admin POST error:",
      error
    );

    return applyCors(
      json(
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
      ),
      request
    );
  }
}

// ============================================================
// DELETE
// ============================================================

export async function DELETE(
  request
) {
  try {
    const globalRateLimit =
      checkRateLimit(
        request,
        "global"
      );

    if (
      !globalRateLimit.allowed
    ) {
      return applyCors(
        rateLimitResponse(
          globalRateLimit
        ),
        request
      );
    }

    const adminRateLimit =
      checkRateLimit(
        request,
        "admin"
      );

    if (
      !adminRateLimit.allowed
    ) {
      return applyCors(
        rateLimitResponse(
          adminRateLimit
        ),
        request
      );
    }

    await initializeDatabase();

    await ensureInviteUsageColumns();

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const action =
      searchParams.get(
        "action"
      );

    let response;

    if (
      action !==
      "revoke"
    ) {
      response =
        json(
          {
            success: false,
            error:
              "Unknown action.",
          },
          400
        );
    } else {
      response =
        await handleRevokeInvite(
          request
        );
    }

    return applyCors(
      response,
      request
    );
  } catch (error) {
    console.error(
      "Fades Admin DELETE error:",
      error
    );

    return applyCors(
      json(
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
      ),
      request
    );
  }
}
