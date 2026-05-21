import { readAppConfig } from "../_shared/appConfig.ts";
import { errorResponse } from "../_shared/errors.ts";
import { assertMethod, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import {
  CURRENT_CONSENT_VERSION,
  DEFAULT_PRIVACY_NOTICE_HASH,
  hashRequestAbuseKey,
  hashVisitorId,
  requireBoolean
} from "../_shared/validation.ts";
import { getOrCreateVisitorIdentity, visitorCookieHeader } from "../_shared/visitorToken.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "POST");

    const body = await readJsonObject(request);
    const accepted = requireBoolean(body.accepted, "accepted");
    const privacyNoticeHash = Deno.env.get("PRIVACY_NOTICE_HASH") ?? DEFAULT_PRIVACY_NOTICE_HASH;
    const now = new Date().toISOString();
    const supabase = createSupabaseAdmin();
    const abuseKeyHash = await hashRequestAbuseKey(request, "accept-consent");
    await consumeRateLimit(supabase, abuseKeyHash, "accept-consent-abuse-hour", 4, 3600);
    await consumeRateLimit(supabase, abuseKeyHash, "accept-consent-abuse-day", 8, 86400);

    const identity = await getOrCreateVisitorIdentity(request, true, body.humanChallengeToken);
    const visitorKeyHash = await hashVisitorId(identity.visitorId);
    const config = await readAppConfig(supabase);
    const consentVersion = config.string("consent_version", CURRENT_CONSENT_VERSION);

    await consumeRateLimit(supabase, visitorKeyHash, "accept-consent", 12, 3600);

    const { error } = await supabase.from("consent_records").insert({
      visitor_key_hash: visitorKeyHash,
      consent_version: consentVersion,
      privacy_notice_hash: privacyNoticeHash,
      accepted_at: accepted ? now : null,
      declined_at: accepted ? null : now
    });

    if (error) {
      throw error;
    }

    return jsonResponse({
      accepted,
      consentVersion,
      canSwipe: accepted,
      visitorToken: identity.token
    }, 200, {
      "Set-Cookie": visitorCookieHeader(identity.token)
    });
  } catch (error) {
    return errorResponse(error);
  }
});
