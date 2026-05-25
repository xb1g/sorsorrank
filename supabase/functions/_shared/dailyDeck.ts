import { HttpError } from "./http.ts";

const bangkokDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

type SupabaseClientLike = {
  from: (table: string) => any;
};

export interface DailyDeckCardRow {
  deck_date: string;
  position: number;
  politician_id: string;
  politician?: {
    id: string;
    display_name: string;
    role_label: string | null;
    party_label: string | null;
    search_query: string;
    image_url: string | null;
    image_source_url: string | null;
    info_source_url: string | null;
    featured_priority: number | null;
  } | null;
}

export function getBangkokDate(date = new Date()) {
  return bangkokDateFormatter.format(date);
}

export function requireDeckDate(value: unknown, field = "date") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "BadRequest", `${field} must be YYYY-MM-DD.`);
  }

  return value;
}

export async function loadPublishedDailyDeck(supabase: SupabaseClientLike, deckDate: string) {
  const { data, error } = await supabase
    .from("daily_deck_cards")
    .select(
      "deck_date,position,politician_id,politician:politician_id(id,display_name,role_label,party_label,search_query,image_url,image_source_url,info_source_url,featured_priority)"
    )
    .eq("deck_date", deckDate)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as DailyDeckCardRow[];
}

export async function ensurePublishedDailyDeck(
  supabase: SupabaseClientLike,
  deckDate: string,
  dailyLimit: number,
  actorId: string
) {
  const existing = await loadPublishedDailyDeck(supabase, deckDate);
  if (existing.length >= dailyLimit) {
    return existing;
  }

  await autoPickDailyDeck(supabase, deckDate, dailyLimit, actorId, false);
  return loadPublishedDailyDeck(supabase, deckDate);
}

export async function autoPickDailyDeck(
  supabase: SupabaseClientLike,
  deckDate: string,
  dailyLimit: number,
  actorId: string,
  _replaceExisting: boolean
) {
  const existing = await loadPublishedDailyDeck(supabase, deckDate);
  if (existing.length >= dailyLimit) {
    return existing.map((card) => card.politician_id);
  }

  const selectedPoliticianIds = existing.map((card) => card.politician_id);
  const politicianIds = await completeDeckPoliticianIds(supabase, deckDate, selectedPoliticianIds, dailyLimit);

  await replaceDailyDeckCards(supabase, {
    deckDate,
    politicianIds,
    dailyLimit,
    selectionMode: "auto_pick",
    actorId
  });

  return politicianIds;
}

export async function publishManualDailyDeck(
  supabase: SupabaseClientLike,
  request: {
    deckDate: string;
    politicianIds: string[];
    dailyLimit: number;
    actorId: string;
  }
) {
  await validateManualPoliticianIds(supabase, request.politicianIds, request.dailyLimit);
  const politicianIds = await completeDeckPoliticianIds(
    supabase,
    request.deckDate,
    request.politicianIds,
    request.dailyLimit,
    true
  );
  await replaceDailyDeckCards(supabase, {
    deckDate: request.deckDate,
    politicianIds,
    dailyLimit: request.dailyLimit,
    selectionMode: "manual",
    actorId: request.actorId
  });
}

export async function clearFutureDailyDeck(supabase: SupabaseClientLike, deckDate: string, today: string) {
  if (deckDate <= today) {
    throw new HttpError(409, "DailyDeckLockedError", "Only future decks can be cleared.");
  }

  await assertDeckCanChange(supabase, deckDate);
  const { error } = await supabase.from("daily_decks").delete().eq("deck_date", deckDate);
  if (error) {
    throw error;
  }
}

async function validateManualPoliticianIds(
  supabase: SupabaseClientLike,
  politicianIds: string[],
  dailyLimit: number
) {
  const uniqueIds = new Set(politicianIds);
  if (politicianIds.length === 0 || politicianIds.length > dailyLimit || uniqueIds.size !== politicianIds.length) {
    throw new HttpError(400, "InvalidDailyDeckError", "Select between 1 and the daily limit with no duplicates.");
  }

  const { data, error } = await supabase
    .from("politicians")
    .select("id")
    .in("id", politicianIds)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  if ((data ?? []).length !== politicianIds.length) {
    throw new HttpError(404, "PoliticianNotFoundError", "Daily Deck cards must be active roster rows.");
  }
}

async function completeDeckPoliticianIds(
  supabase: SupabaseClientLike,
  deckDate: string,
  selectedPoliticianIds: string[],
  dailyLimit: number,
  preserveIssuedPositions = false
) {
  const politicianIds = Array.from({ length: dailyLimit }, () => "");
  const selected = new Set<string>();

  if (preserveIssuedPositions) {
    const { data: issuedRows, error: issuedError } = await supabase
      .from("card_impressions")
      .select("politician_id")
      .eq("occurred_on", deckDate);

    if (issuedError) {
      throw issuedError;
    }

    const issuedPoliticianIds = new Set((issuedRows ?? []).map((row: { politician_id: string }) => row.politician_id));
    if (issuedPoliticianIds.size > 0) {
      const existing = await loadPublishedDailyDeck(supabase, deckDate);
      for (const card of existing) {
        if (!issuedPoliticianIds.has(card.politician_id)) {
          continue;
        }

        politicianIds[card.position - 1] = card.politician_id;
        selected.add(card.politician_id);
      }
    }
  }

  for (const politicianId of selectedPoliticianIds) {
    if (selected.has(politicianId)) {
      continue;
    }

    const openIndex = politicianIds.findIndex((candidate) => candidate === "");
    if (openIndex < 0) {
      break;
    }

    politicianIds[openIndex] = politicianId;
    selected.add(politicianId);
  }

  const { data: activePoliticians, error } = await supabase
    .from("politicians")
    .select("id")
    .eq("status", "active");

  if (error) {
    throw error;
  }

  const fillPoliticianIds = (activePoliticians ?? [])
    .filter((politician: { id: string }) => !selected.has(politician.id))
    .sort((left: { id: string }, right: { id: string }) => {
      const leftScore = dailySelectionScore(deckDate, left.id);
      const rightScore = dailySelectionScore(deckDate, right.id);
      if (leftScore !== rightScore) {
        return leftScore.localeCompare(rightScore);
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, politicianIds.filter((politicianId) => politicianId === "").length)
    .map((politician: { id: string }) => politician.id);

  for (const fillPoliticianId of fillPoliticianIds) {
    const openIndex = politicianIds.findIndex((candidate) => candidate === "");
    if (openIndex < 0) {
      break;
    }
    politicianIds[openIndex] = fillPoliticianId;
  }

  return politicianIds.filter(Boolean);
}

async function assertDeckCanChange(supabase: SupabaseClientLike, deckDate: string) {
  const { count, error } = await supabase
    .from("card_impressions")
    .select("id", { count: "exact", head: true })
    .eq("occurred_on", deckDate);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    throw new HttpError(409, "DailyDeckLockedError", "Only unissued future Daily Decks can be cleared.");
  }
}

async function replaceDailyDeckCards(
  supabase: SupabaseClientLike,
  request: {
    deckDate: string;
    politicianIds: string[];
    dailyLimit: number;
    selectionMode: "manual" | "auto_pick";
    actorId: string;
  }
) {
  const now = new Date().toISOString();
  const { error: deckError } = await supabase.from("daily_decks").upsert({
    deck_date: request.deckDate,
    status: "published",
    selection_mode: request.selectionMode,
    daily_limit: request.dailyLimit,
    generated_at: now,
    published_at: now,
    created_by: request.actorId,
    updated_by: request.actorId
  });

  if (deckError) {
    throw deckError;
  }

  const { error: deleteError } = await supabase
    .from("daily_deck_cards")
    .delete()
    .eq("deck_date", request.deckDate);

  if (deleteError) {
    throw deleteError;
  }

  if (request.politicianIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("daily_deck_cards")
    .upsert(
      request.politicianIds.map((politicianId, index) => ({
        deck_date: request.deckDate,
        position: index + 1,
        politician_id: politicianId
      })),
      { onConflict: "deck_date,position" }
    );

  if (insertError) {
    throw insertError;
  }
}

function dailySelectionScore(deckDate: string, politicianId: string) {
  let hash = 0;
  const input = `${deckDate}:${politicianId}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}
