import { BackendRuleError } from "./errors";
import type { PublicFigure } from "./types";

const ROYAL_CONTENT_PATTERNS = [
  /\bmonarchy\b/i,
  /\broyal\s+family\b/i,
  /\broyal\s+institution\b/i,
  /\bking\b/i,
  /\bqueen\b/i,
  /สถาบันพระมหากษัตริย์/u,
  /พระมหากษัตริย์/u,
  /ราชวงศ์/u
];

const MARKUP_PATTERN = /[<>]|javascript:/i;

export function validateRosterEntry(entry: PublicFigure) {
  const publicText = [
    entry.displayName,
    entry.roleLabel ?? "",
    entry.partyLabel ?? "",
    entry.searchQuery
  ].join(" ");

  if (MARKUP_PATTERN.test(publicText)) {
    throw new BackendRuleError("InvalidRosterEntryError", "Display fields cannot contain markup.");
  }

  for (const pattern of ROYAL_CONTENT_PATTERNS) {
    if (pattern.test(publicText)) {
      throw new BackendRuleError(
        "InvalidRosterEntryError",
        "Royal, monarchy, or royal-institution content is excluded."
      );
    }
  }

  if (entry.displayName.trim().length === 0 || entry.searchQuery.trim().length === 0) {
    throw new BackendRuleError("InvalidRosterEntryError", "Display name and search query are required.");
  }
}
