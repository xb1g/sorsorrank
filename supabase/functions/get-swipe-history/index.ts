import { readAppConfig } from "../_shared/appConfig.ts";
import { errorResponse } from "../_shared/errors.ts";
import { HttpError, assertMethod, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { DAILY_CARD_LIMIT, hashVisitorId } from "../_shared/validation.ts";
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
    const today = new Date().toISOString().slice(0, 10);

    await consumeRateLimit(supabase, visitorKeyHash, "get-swipe-history", 60, 3600);

    const { data: events, error } = await supabase
      .from("swipe_events")
      .select(
        "id,action,occurred_on,created_at,politician:politician_id(id,display_name,role_label,party_label,search_query,image_url)"
      )
      .eq("visitor_key_hash", visitorKeyHash)
      .eq("occurred_on", today)
      .order("created_at", { ascending: false })
      .limit(dailyLimit);

    if (error) {
      throw error;
    }

    return jsonResponse({
      date: today,
      items: (events ?? []).map((event) => ({
        id: event.id,
        action: event.action,
        createdAt: event.created_at,
        displayName: event.politician?.display_name ?? "",
        roleLabel: event.politician?.role_label,
        partyLabel: event.politician?.party_label,
        searchQuery: event.politician?.search_query,
        imageUrl: event.politician?.image_url,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
});
