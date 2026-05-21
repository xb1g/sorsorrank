import { HttpError } from "./http.ts";

export const CURRENT_CONSENT_VERSION = "2026-05-20";
export const DEFAULT_PRIVACY_NOTICE_HASH = "c0".repeat(32);
export const DAILY_CARD_LIMIT = 10;
export const MIN_RANKING_SAMPLE_SIZE = 120;

const publicCopyBannedTerms = [
  "vote",
  "support",
  "endorse",
  "best",
  "winner",
  "leading",
  "approval",
  "odds",
  "prediction",
  "hot",
  "match",
  "crush"
];

const royalContentPatterns = [
  /\bmonarchy\b/i,
  /\broyal\s+family\b/i,
  /\broyal\s+institution\b/i,
  /\bking\b/i,
  /\bqueen\b/i,
  /สถาบันพระมหากษัตริย์/u,
  /พระมหากษัตริย์/u,
  /ราชวงศ์/u
];

export function requireString(value: unknown, field: string, maxLength = 240) {
  if (typeof value !== "string") {
    throw new HttpError(400, "BadRequest", `${field} is required.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new HttpError(400, "BadRequest", `${field} has an invalid length.`);
  }

  return trimmed;
}

export function optionalString(value: unknown, field: string, maxLength = 240) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return requireString(value, field, maxLength);
}

export function requireBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new HttpError(400, "BadRequest", `${field} must be true or false.`);
  }

  return value;
}

export function requireSwipeAction(value: unknown) {
  if (value !== "research" && value !== "skip") {
    throw new HttpError(400, "BadRequest", "action must be research or skip.");
  }

  return value;
}

export function requireShareType(value: unknown) {
  if (value !== "completion" && value !== "streak" && value !== "rank_snapshot") {
    throw new HttpError(400, "BadRequest", "shareType is invalid.");
  }

  return value;
}

export async function hashVisitorId(visitorId: string) {
  const salt = Deno.env.get("VISITOR_HASH_SALT");
  if (!salt || salt.length < 16) {
    throw new Error("VISITOR_HASH_SALT of at least 16 characters is required.");
  }

  return sha256Hex(`${salt}:${visitorId}`);
}

export async function hashRequestAbuseKey(request: Request, scope: string) {
  const salt = Deno.env.get("ABUSE_HASH_SALT") ?? Deno.env.get("VISITOR_HASH_SALT");
  if (!salt || salt.length < 16) {
    throw new Error("ABUSE_HASH_SALT or VISITOR_HASH_SALT of at least 16 characters is required.");
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown-ip";
  const userAgent = request.headers.get("user-agent") ?? "unknown-ua";

  return sha256Hex(`${salt}:${scope}:${ip}:${userAgent}`);
}

export async function hashAdminRateKey(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  return sha256Hex(`admin:${auth.slice(0, 32)}`);
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validateRosterText(...values: Array<string | null>) {
  const joined = values.filter(Boolean).join(" ");

  if (/[<>]|javascript:/i.test(joined)) {
    throw new HttpError(400, "InvalidRosterEntryError", "Roster display fields cannot contain markup.");
  }

  for (const pattern of royalContentPatterns) {
    if (pattern.test(joined)) {
      throw new HttpError(
        400,
        "InvalidRosterEntryError",
        "Royal, monarchy, or royal-institution content is excluded."
      );
    }
  }
}

export function assertNeutralPublicCopy(copy: string) {
  const lowerCopy = copy.toLowerCase();
  const found = publicCopyBannedTerms.filter((term) => {
    return new RegExp(`\\b${term}\\b`, "i").test(lowerCopy);
  });

  if (found.length > 0) {
    throw new HttpError(400, "InvalidPublicCopyError", `Remove: ${found.join(", ")}.`);
  }
}

export function requireAdmin(request: Request) {
  const expected = Deno.env.get("ADMIN_API_TOKEN");
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!expected || !timingSafeEqual(actual, expected)) {
    throw new HttpError(401, "UnauthorizedAdminError", "Admin authorization is required.");
  }

  return Deno.env.get("ADMIN_ID") ?? "admin-api";
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
