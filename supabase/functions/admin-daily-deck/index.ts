import { readAppConfig } from "../_shared/appConfig.ts";
import {
  autoPickDailyDeck,
  clearFutureDailyDeck,
  getBangkokDate,
  loadPublishedDailyDeck,
  publishManualDailyDeck,
  requireDeckDate
} from "../_shared/dailyDeck.ts";
import { errorResponse } from "../_shared/errors.ts";
import { HttpError, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { DAILY_CARD_LIMIT, hashAdminRateKey, requireAdmin, requireString } from "../_shared/validation.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    const adminId = requireAdmin(request);
    const supabase = createSupabaseAdmin();
    const adminRateKey = await hashAdminRateKey(request);
    await consumeRateLimit(supabase, adminRateKey, "admin-daily-deck", 240, 3600);

    if (request.method === "GET") {
      return await handleGet(request, supabase);
    }

    if (request.method !== "POST") {
      throw new HttpError(405, "MethodNotAllowed", "GET or POST is required.");
    }

    const config = await readAppConfig(supabase);
    const dailyLimit = config.integer("daily_card_limit", DAILY_CARD_LIMIT);
    const body = await readJsonObject(request);
    const mode = requireString(body.mode, "mode", 32);
    const deckDate = requireDeckDate(body.date ?? getBangkokDate());

    if (mode === "auto-pick") {
      const politicianIds = await autoPickDailyDeck(supabase, deckDate, dailyLimit, adminId, true);
      await auditDeckChange(supabase, adminId, "daily_deck.auto_pick", deckDate, { count: politicianIds.length });
      return jsonResponse(await getDeckPayload(supabase, deckDate));
    }

    if (mode === "manual") {
      const politicianIds = requirePoliticianIds(body.politicianIds);
      await publishManualDailyDeck(supabase, {
        deckDate,
        politicianIds,
        dailyLimit,
        actorId: adminId
      });
      await auditDeckChange(supabase, adminId, "daily_deck.manual_publish", deckDate, {
        count: politicianIds.length
      });
      return jsonResponse(await getDeckPayload(supabase, deckDate));
    }

    if (mode === "clear") {
      await clearFutureDailyDeck(supabase, deckDate, getBangkokDate());
      await auditDeckChange(supabase, adminId, "daily_deck.clear", deckDate, {});
      return jsonResponse(await getDeckPayload(supabase, deckDate));
    }

    throw new HttpError(400, "BadRequest", "mode must be auto-pick, manual, or clear.");
  } catch (error) {
    return errorResponse(error);
  }
});

async function handleGet(request: Request, supabase: any) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (from || to) {
    const fromDate = requireDeckDate(from ?? getBangkokDate(), "from");
    const toDate = requireDeckDate(to ?? fromDate, "to");
    const { data, error } = await supabase
      .from("daily_decks")
      .select("deck_date,selection_mode,daily_limit,published_at,updated_at,daily_deck_cards(position,politician_id)")
      .gte("deck_date", fromDate)
      .lte("deck_date", toDate)
      .order("deck_date", { ascending: true });

    if (error) {
      throw error;
    }

    return jsonResponse({
      from: fromDate,
      to: toDate,
      schedule: (data ?? []).map((deck: any) => ({
        date: deck.deck_date,
        selectionMode: deck.selection_mode,
        dailyLimit: deck.daily_limit,
        publishedAt: deck.published_at,
        updatedAt: deck.updated_at,
        cardCount: deck.daily_deck_cards?.length ?? 0
      }))
    });
  }

  const deckDate = requireDeckDate(url.searchParams.get("date") ?? getBangkokDate());
  return jsonResponse(await getDeckPayload(supabase, deckDate));
}

async function getDeckPayload(supabase: any, deckDate: string) {
  const [deckCards, roster] = await Promise.all([
    loadPublishedDailyDeck(supabase, deckDate),
    loadActiveRoster(supabase)
  ]);

  return {
    date: deckDate,
    today: getBangkokDate(),
    cards: deckCards.map((card) => ({
      position: card.position,
      politicianId: card.politician_id,
      displayName: card.politician?.display_name ?? "",
      roleLabel: card.politician?.role_label,
      partyLabel: card.politician?.party_label,
      searchQuery: card.politician?.search_query,
      imageUrl: card.politician?.image_url,
      imageSourceUrl: card.politician?.image_source_url,
      infoSourceUrl: card.politician?.info_source_url,
      featuredPriority: card.politician?.featured_priority
    })),
    roster
  };
}

async function loadActiveRoster(supabase: any) {
  const { data, error } = await supabase
    .from("politicians")
    .select("id,display_name,role_label,party_label,search_query,image_url,image_source_url,info_source_url,featured_priority,updated_at")
    .eq("status", "active")
    .order("featured_priority", { ascending: true, nullsFirst: false })
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    displayName: row.display_name,
    roleLabel: row.role_label,
    partyLabel: row.party_label,
    searchQuery: row.search_query,
    imageUrl: row.image_url,
    imageSourceUrl: row.image_source_url,
    infoSourceUrl: row.info_source_url,
    featuredPriority: row.featured_priority,
    updatedAt: row.updated_at
  }));
}

function requirePoliticianIds(value: unknown) {
  if (!Array.isArray(value)) {
    throw new HttpError(400, "InvalidDailyDeckError", "politicianIds must be an array.");
  }

  return value.map((item) => requireString(item, "politicianId", 80));
}

async function auditDeckChange(
  supabase: any,
  adminId: string,
  action: string,
  deckDate: string,
  metadata: Record<string, unknown>
) {
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: "daily_deck",
    target_id: deckDate,
    metadata
  });

  if (error) {
    throw error;
  }
}
