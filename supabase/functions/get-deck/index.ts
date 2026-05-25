import { readAppConfig } from "../_shared/appConfig.ts";
import { ensurePublishedDailyDeck, getBangkokDate } from "../_shared/dailyDeck.ts";
import { errorResponse } from "../_shared/errors.ts";
import { HttpError, assertMethod, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { CURRENT_CONSENT_VERSION, DAILY_CARD_LIMIT, hashVisitorId } from "../_shared/validation.ts";
import { getOrCreateVisitorIdentity } from "../_shared/visitorToken.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "GET");

    const supabase = createSupabaseAdmin();
    const config = await readAppConfig(supabase);
    const dailyLimit = config.integer("daily_card_limit", DAILY_CARD_LIMIT);
    const identity = await getOrCreateVisitorIdentity(request, false);
    const visitorKeyHash = await hashVisitorId(identity.visitorId);
    const today = getBangkokDate();
    const consentVersion = config.string("consent_version", CURRENT_CONSENT_VERSION);

    await consumeRateLimit(supabase, visitorKeyHash, "get-deck", 120, 3600);

    const { data: consentRows, error: consentError } = await supabase
      .from("consent_records")
      .select("accepted_at,declined_at,created_at")
      .eq("visitor_key_hash", visitorKeyHash)
      .eq("consent_version", consentVersion)
      .order("created_at", { ascending: false })
      .limit(1);

    if (consentError) {
      throw consentError;
    }

    const latestConsent = consentRows?.[0];
    if (!latestConsent?.accepted_at || latestConsent.declined_at) {
      throw new HttpError(403, "ConsentRequiredError", "Consent is required before issuing today's deck.");
    }

    const { count: usedToday, error: countError } = await supabase
      .from("swipe_events")
      .select("id", { count: "exact", head: true })
      .eq("visitor_key_hash", visitorKeyHash)
      .eq("occurred_on", today);

    if (countError) {
      throw countError;
    }

    if (config.boolean("election_freeze", false) || !config.boolean("swipe_enabled", true)) {
      return jsonResponse({
        cards: [],
        dailyLimit,
        usedToday: usedToday ?? 0,
        remaining: Math.max(dailyLimit - (usedToday ?? 0), 0),
        freezeMode: true,
        message: "The daily 10 is paused during a sensitive review period."
      });
    }

    if ((usedToday ?? 0) >= dailyLimit) {
      return jsonResponse({
        cards: [],
        dailyLimit,
        usedToday: usedToday ?? 0,
        remaining: 0,
        doneToday: true
      });
    }

    const needed = dailyLimit - (usedToday ?? 0);
    const { data: existingImpressions, error: existingError } = await supabase
      .from("card_impressions")
      .select("id,politician_id")
      .eq("visitor_key_hash", visitorKeyHash)
      .eq("occurred_on", today)
      .is("consumed_at", null);

    if (existingError) {
      throw existingError;
    }

    const existingPoliticianIds = new Set((existingImpressions ?? []).map((impression) => impression.politician_id));
    const { data: swipedEvents, error: swipedError } = await supabase
      .from("swipe_events")
      .select("politician_id")
      .eq("visitor_key_hash", visitorKeyHash)
      .eq("occurred_on", today);

    if (swipedError) {
      throw swipedError;
    }

    const excludedPoliticianIds = new Set([
      ...existingPoliticianIds,
      ...(swipedEvents ?? []).map((event) => event.politician_id)
    ]);

    const dailyDeckCards = await ensurePublishedDailyDeck(supabase, today, dailyLimit, "public-auto");
    const deckPositionByPoliticianId = new Map(
      dailyDeckCards.map((card) => [card.politician_id, card.position])
    );
    const validExistingImpressions = (existingImpressions ?? []).filter((impression) => {
      return deckPositionByPoliticianId.has(impression.politician_id);
    });
    const candidates = dailyDeckCards.filter((card) => {
      return !excludedPoliticianIds.has(card.politician_id);
    });
    const newCardsNeeded = Math.max(needed - validExistingImpressions.length, 0);
    const newImpressions = candidates.slice(0, newCardsNeeded).map((politician) => ({
      id: crypto.randomUUID(),
      visitor_key_hash: visitorKeyHash,
      politician_id: politician.politician_id,
      occurred_on: today
    }));

    if (newImpressions.length > 0) {
      const { error: insertError } = await supabase
        .from("card_impressions")
        .upsert(newImpressions, {
          onConflict: "visitor_key_hash,politician_id,occurred_on",
          ignoreDuplicates: true
        });
      if (insertError) {
        throw insertError;
      }
    }

    const { data: issuedImpressions, error: issuedError } = await supabase
      .from("card_impressions")
      .select("id,politician_id")
      .eq("visitor_key_hash", visitorKeyHash)
      .eq("occurred_on", today)
      .is("consumed_at", null);

    if (issuedError) {
      throw issuedError;
    }

    const impressionByPoliticianId = new Map<string, string>();
    for (const impression of issuedImpressions ?? []) {
      impressionByPoliticianId.set(impression.politician_id, impression.id);
    }

    const issuedPoliticianIds = Array.from(impressionByPoliticianId.keys()).filter((politicianId) => {
      return deckPositionByPoliticianId.has(politicianId);
    });
    let deckPoliticians: any[] = [];
    if (issuedPoliticianIds.length > 0) {
      const { data: fetchedPoliticians, error: fetchError } = await supabase
        .from("politicians")
        .select("id,display_name,role_label,party_label,search_query,image_url,image_source_url,info_source_url,featured_priority")
        .in("id", issuedPoliticianIds);
      
      if (fetchError) {
        throw fetchError;
      }
      deckPoliticians = fetchedPoliticians ?? [];
    }

    // Sort to match the shared Daily Deck order chosen for this date.
    deckPoliticians.sort((a, b) => {
      return (deckPositionByPoliticianId.get(a.id) ?? 999) - (deckPositionByPoliticianId.get(b.id) ?? 999);
    });

    const voteRecordsByPoliticianId = new Map<string, any[]>();
    if (deckPoliticians.length > 0) {
      const { data: voteRows, error: voteError } = await supabase
        .from("politician_vote_records")
        .select("politician_id,vote_event_id,title,start_date,option,source_url")
        .in("politician_id", deckPoliticians.map((politician) => politician.id))
        .order("start_date", { ascending: false });

      if (voteError) {
        throw voteError;
      }

      for (const row of voteRows ?? []) {
        const existing = voteRecordsByPoliticianId.get(row.politician_id) ?? [];
        if (existing.length < 3) {
          existing.push(row);
          voteRecordsByPoliticianId.set(row.politician_id, existing);
        }
      }
    }

    const cards = deckPoliticians
      .slice(0, needed)
      .map((politician) => ({
        id: politician.id,
        displayName: politician.display_name,
        roleLabel: politician.role_label,
        partyLabel: politician.party_label,
        searchQuery: politician.search_query,
        imageUrl: politician.image_url,
        imageSourceUrl: politician.image_source_url,
        infoSourceUrl: politician.info_source_url,
        featuredPriority: politician.featured_priority,
        voteRecords: (voteRecordsByPoliticianId.get(politician.id) ?? []).map((record) => ({
          voteEventId: record.vote_event_id,
          title: record.title,
          startDate: record.start_date,
          option: record.option,
          sourceUrl: record.source_url
        })),
        impressionId: impressionByPoliticianId.get(politician.id)
      }));

    return jsonResponse({
      cards,
      dailyLimit,
      usedToday: usedToday ?? 0,
      remaining: Math.max(dailyLimit - (usedToday ?? 0), 0),
      freezeMode: false,
      doneToday: false
    });
  } catch (error) {
    return errorResponse(error);
  }
});
