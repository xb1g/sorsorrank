import { BANNED_PUBLIC_COPY_TERMS } from "./constants";
import { BackendRuleError } from "./errors";

export function findBannedPublicCopyTerms(copy: string): string[] {
  const found = new Set<string>();

  for (const term of BANNED_PUBLIC_COPY_TERMS) {
    const pattern = new RegExp(`\\b${term}\\b`, "i");
    if (pattern.test(copy)) {
      found.add(term);
    }
  }

  return [...found];
}

export function assertNeutralPublicCopy(copy: string) {
  const bannedTerms = findBannedPublicCopyTerms(copy);

  if (bannedTerms.length > 0) {
    throw new BackendRuleError(
      "InvalidPublicCopyError",
      `Remove: ${bannedTerms.join(", ")}.`
    );
  }
}
