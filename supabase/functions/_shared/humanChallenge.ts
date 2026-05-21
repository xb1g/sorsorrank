import { HttpError } from "./http.ts";

interface TurnstileResponse {
  success?: boolean;
  "error-codes"?: string[];
}

export async function verifyHumanChallenge(token: unknown, request: Request) {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new HttpError(400, "HumanChallengeRequired", "Human verification is required.");
  }

  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    throw new HttpError(503, "HumanChallengeUnavailable", "Human verification is not configured.");
  }

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token.trim());

  const remoteIp = getRemoteIp(request);
  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  const verifyUrl =
    Deno.env.get("TURNSTILE_VERIFY_URL") ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const response = await fetch(verifyUrl, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    throw new HttpError(503, "HumanChallengeUnavailable", "Human verification could not be checked.");
  }

  const result = (await response.json()) as TurnstileResponse;
  if (!result.success) {
    throw new HttpError(403, "HumanChallengeFailed", "Human verification failed.");
  }
}

function getRemoteIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
