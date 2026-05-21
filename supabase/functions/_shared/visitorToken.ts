import { HttpError } from "./http.ts";
import { verifyHumanChallenge } from "./humanChallenge.ts";
import { createSupabaseAdmin } from "./supabaseAdmin.ts";

export interface VisitorIdentity {
  visitorId: string;
  token?: string;
  created: boolean;
  source: "supabase-auth" | "visitor-token";
}

const tokenPrefix = "sr_v1";
const maxTokenAgeMs = 180 * 24 * 60 * 60 * 1000;

export async function getOrCreateVisitorIdentity(
  request: Request,
  allowCreate: boolean,
  humanChallengeToken?: unknown
): Promise<VisitorIdentity> {
  const bearerToken = getBearerToken(request);
  const cookieToken = getCookie(request, "sr_visitor");

  if (bearerToken) {
    const visitorId = await verifyVisitorToken(bearerToken);
    if (visitorId) {
      return {
        visitorId,
        token: bearerToken,
        created: false,
        source: "visitor-token"
      };
    }

    const supabaseUserId = await verifySupabaseAuthToken(bearerToken);
    if (supabaseUserId) {
      return {
        visitorId: `supabase:${supabaseUserId}`,
        token: bearerToken,
        created: false,
        source: "supabase-auth"
      };
    }
  }

  if (cookieToken) {
    const visitorId = await verifyVisitorToken(cookieToken);
    if (visitorId) {
      return {
        visitorId,
        token: cookieToken,
        created: false,
        source: "visitor-token"
      };
    }
  }

  if (!allowCreate) {
    throw new HttpError(401, "VisitorTokenRequired", "A server-issued visitor token is required.");
  }

  await verifyHumanChallenge(humanChallengeToken, request);

  const visitorId = crypto.randomUUID();
  const token = await signVisitorToken(visitorId, Date.now());

  return {
    visitorId,
    token,
    created: true,
    source: "visitor-token"
  };
}

export function visitorCookieHeader(token: string) {
  return `sr_visitor=${token}; Path=/; Max-Age=${180 * 24 * 60 * 60}; HttpOnly; Secure; SameSite=None`;
}

async function signVisitorToken(visitorId: string, issuedAt: number) {
  const payload = `${visitorId}.${issuedAt}`;
  const signature = await hmacBase64Url(payload);
  return `${tokenPrefix}.${payload}.${signature}`;
}

async function verifyVisitorToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== tokenPrefix) {
    return null;
  }

  const [, visitorId, issuedAtRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!visitorId || !Number.isFinite(issuedAt) || Date.now() - issuedAt > maxTokenAgeMs) {
    return null;
  }

  const expected = await hmacBase64Url(`${visitorId}.${issuedAtRaw}`);
  return timingSafeEqual(signature, expected) ? visitorId : null;
}

async function verifySupabaseAuthToken(token: string) {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) {
      return null;
    }

    return data.user.id;
  } catch (_) {
    return null;
  }
}

async function hmacBase64Url(payload: string) {
  const secret = Deno.env.get("VISITOR_SIGNING_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("VISITOR_SIGNING_SECRET of at least 32 characters is required.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64Url(new Uint8Array(signature));
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match?.[1] ?? null;
}

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  const parts = cookie.split(";").map((part) => part.trim());

  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const cookieName = part.slice(0, separator);
    const cookieValue = part.slice(separator + 1);
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  return null;
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}
