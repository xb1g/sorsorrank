export type BackendErrorCode =
  | "ConsentRequiredError"
  | "DailyLimitExceededError"
  | "DuplicateSwipeError"
  | "CardImpressionRequiredError"
  | "PoliticianNotFoundError"
  | "FreezeModeActiveError"
  | "InsufficientSampleError"
  | "RateLimitExceededError"
  | "UnauthorizedAdminError"
  | "InvalidRosterEntryError"
  | "InvalidPublicCopyError";

const messages: Record<BackendErrorCode, string> = {
  ConsentRequiredError: "Consent is required before storing Research or Skip actions.",
  DailyLimitExceededError: "The daily 10-card limit has already been reached.",
  DuplicateSwipeError: "This card action was already recorded.",
  CardImpressionRequiredError: "A valid issued card impression is required before recording this action.",
  PoliticianNotFoundError: "This public figure is not available in the active roster.",
  FreezeModeActiveError: "Research rankings are paused during a sensitive review period.",
  InsufficientSampleError: "This ranking is hidden until the minimum sample threshold is reached.",
  RateLimitExceededError: "Too many requests. Please try again later.",
  UnauthorizedAdminError: "Admin authorization is required.",
  InvalidRosterEntryError: "Roster entries must stay sparse and safety-compliant.",
  InvalidPublicCopyError: "Public copy contains banned framing."
};

export class BackendRuleError extends Error {
  readonly code: BackendErrorCode;

  constructor(code: BackendErrorCode, detail?: string) {
    super(detail ? `${messages[code]} ${detail}` : messages[code]);
    this.name = code;
    this.code = code;
  }
}

export function raise(code: BackendErrorCode, detail?: string): never {
  throw new BackendRuleError(code, detail);
}
