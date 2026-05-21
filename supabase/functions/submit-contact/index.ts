import { errorResponse } from "../_shared/errors.ts";
import { HttpError, assertMethod, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { hashRequestAbuseKey, hashVisitorId, optionalString, requireString } from "../_shared/validation.ts";
import { getOrCreateVisitorIdentity, visitorCookieHeader } from "../_shared/visitorToken.ts";

const requestTypes = new Set(["roster_correction", "takedown", "privacy", "other"]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "POST");

    const body = await readJsonObject(request);
    const identity = await getOrCreateVisitorIdentity(request, true, body.humanChallengeToken);
    const visitorKeyHash = await hashVisitorId(identity.visitorId);
    const contactEmail = requireString(body.contactEmail, "contactEmail", 254);
    const requestType = requireString(body.requestType, "requestType", 64);
    const publicFigure = optionalString(body.publicFigure, "publicFigure", 160);
    const explanation = requireString(body.explanation, "explanation", 4000);
    const evidenceUrl = optionalString(body.evidenceUrl, "evidenceUrl", 1000);

    if (!requestTypes.has(requestType)) {
      throw new HttpError(400, "BadRequest", "requestType is invalid.");
    }

    const supabase = createSupabaseAdmin();
    const abuseKeyHash = await hashRequestAbuseKey(request, "submit-contact");
    await consumeRateLimit(supabase, abuseKeyHash, "submit-contact-abuse", 12, 3600);
    await consumeRateLimit(supabase, visitorKeyHash, "submit-contact", 5, 3600);

    const { data, error } = await supabase
      .from("takedown_requests")
      .insert({
        visitor_key_hash: visitorKeyHash,
        contact_email: contactEmail,
        request_type: requestType,
        public_figure: publicFigure,
        explanation,
        evidence_url: evidenceUrl
      })
      .select("id,created_at")
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({
      id: data.id,
      status: "received",
      createdAt: data.created_at
    }, 200, {
      "Set-Cookie": visitorCookieHeader(identity.token)
    });
  } catch (error) {
    return errorResponse(error);
  }
});
