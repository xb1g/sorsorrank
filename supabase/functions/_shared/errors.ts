import { HttpError, jsonResponse } from "./http.ts";

const backendStatuses: Record<string, number> = {
  ConsentRequiredError: 403,
  DailyLimitExceededError: 409,
  DuplicateSwipeError: 409,
  CardImpressionRequiredError: 409,
  PoliticianNotFoundError: 404,
  FreezeModeActiveError: 423,
  InsufficientSampleError: 404,
  RateLimitExceededError: 429,
  UnauthorizedAdminError: 401,
  InvalidRosterEntryError: 400,
  InvalidPublicCopyError: 400,
  VisitorTokenRequired: 401,
  DailyTenIncompleteError: 409,
  HumanChallengeRequired: 400,
  HumanChallengeFailed: 403,
  HumanChallengeUnavailable: 503
};

const backendMessages: Record<string, string> = {
  ConsentRequiredError: "Consent is required before storing Research or Skip actions.",
  DailyLimitExceededError: "You already did your 10 today.",
  DuplicateSwipeError: "This action was already recorded.",
  CardImpressionRequiredError: "A valid issued card impression is required before recording this action.",
  PoliticianNotFoundError: "This public figure is not available.",
  FreezeModeActiveError: "Research rankings are paused during a sensitive review period.",
  InsufficientSampleError: "This rank is hidden until the sample threshold is reached.",
  RateLimitExceededError: "Too many requests. Please try again later.",
  UnauthorizedAdminError: "Admin authorization is required.",
  InvalidRosterEntryError: "Roster entries must stay sparse and safety-compliant.",
  InvalidPublicCopyError: "Public copy contains banned framing.",
  VisitorTokenRequired: "A server-issued visitor token is required.",
  DailyTenIncompleteError: "Complete today's 10 before creating this share.",
  HumanChallengeRequired: "Human verification is required.",
  HumanChallengeFailed: "Human verification failed.",
  HumanChallengeUnavailable: "Human verification is not available."
};

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.code, message: error.message }, error.status);
  }

  const message = getErrorMessage(error);
  const code = Object.keys(backendStatuses).find((candidate) => message.includes(candidate));

  if (code) {
    return jsonResponse(
      {
        error: code,
        message: backendMessages[code]
      },
      backendStatuses[code]
    );
  }

  console.error("Unhandled backend error", error);
  return jsonResponse(
    {
      error: "InternalServerError",
      message: "The request could not be completed."
    },
    500
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return String(error);
}
