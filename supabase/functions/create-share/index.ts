import { readAppConfig } from "../_shared/appConfig.ts";
import { errorResponse } from "../_shared/errors.ts";
import { HttpError, assertMethod, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import {
  DAILY_CARD_LIMIT,
  assertNeutralPublicCopy,
  hashVisitorId,
  requireShareType
} from "../_shared/validation.ts";
import { getOrCreateVisitorIdentity } from "../_shared/visitorToken.ts";

const shareCopy = {
  completion: "I researched 10 public figures today. Your turn.",
  streak: "I kept up with my 10.",
  rank_snapshot: "Today's Research Interest Rank"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "POST");

    const body = await readJsonObject(request);
    const identity = await getOrCreateVisitorIdentity(request, false);
    const visitorKeyHash = await hashVisitorId(identity.visitorId);
    const shareType = requireShareType(body.shareType);
    const supabase = createSupabaseAdmin();
    const config = await readAppConfig(supabase);

    if (!config.boolean("share_cards_enabled", true)) {
      throw new HttpError(423, "FreezeModeActiveError", "Share cards are currently paused.");
    }

    if (
      shareType === "rank_snapshot" &&
      (config.boolean("election_freeze", false) || !config.boolean("rankings_public", false))
    ) {
      throw new HttpError(423, "FreezeModeActiveError", "Rank snapshots are currently paused.");
    }

    assertNeutralPublicCopy(shareCopy[shareType]);
    await consumeRateLimit(supabase, visitorKeyHash, "create-share", 20, 86400);

    if (shareType === "completion" || shareType === "streak") {
      const dailyLimit = config.integer("daily_card_limit", DAILY_CARD_LIMIT);
      const today = new Date().toISOString().slice(0, 10);
      const { count, error: countError } = await supabase
        .from("swipe_events")
        .select("id", { count: "exact", head: true })
        .eq("visitor_key_hash", visitorKeyHash)
        .eq("occurred_on", today);

      if (countError) {
        throw countError;
      }

      if ((count ?? 0) < dailyLimit) {
        throw new HttpError(409, "DailyTenIncompleteError", "Complete today's 10 before creating this share.");
      }
    }

    const { data, error } = await supabase
      .from("share_events")
      .insert({
        visitor_key_hash: visitorKeyHash,
        share_type: shareType
      })
      .select("id,created_at")
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({
      id: data.id,
      shareType,
      copy: shareCopy[shareType],
      createdAt: data.created_at
    });
  } catch (error) {
    return errorResponse(error);
  }
});
