import { errorResponse } from "../_shared/errors.ts";
import { assertMethod, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import {
  hashVisitorId,
  requireString,
  requireSwipeAction
} from "../_shared/validation.ts";
import { getOrCreateVisitorIdentity } from "../_shared/visitorToken.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "POST");

    const body = await readJsonObject(request);
    const identity = await getOrCreateVisitorIdentity(request, false);
    const visitorKeyHash = await hashVisitorId(identity.visitorId);
    const politicianId = requireString(body.politicianId, "politicianId", 80);
    const action = requireSwipeAction(body.action);
    const cardImpressionId = requireString(body.impressionId, "impressionId", 160);
    const idempotencyKey = requireString(body.idempotencyKey, "idempotencyKey", 160);
    const supabase = createSupabaseAdmin();

    await consumeRateLimit(supabase, visitorKeyHash, "record-swipe", 40, 86400);

    const { data, error } = await supabase.rpc("record_swipe_event", {
      p_visitor_key_hash: visitorKeyHash,
      p_politician_id: politicianId,
      p_action: action,
      p_card_impression_id: cardImpressionId,
      p_idempotency_key: idempotencyKey
    });

    if (error) {
      throw error;
    }

    return jsonResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
});
