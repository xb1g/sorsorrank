import { errorResponse } from "../_shared/errors.ts";
import { assertMethod, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { hashAdminRateKey, requireAdmin, requireBoolean } from "../_shared/validation.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "POST");

    const adminId = requireAdmin(request);
    const body = await readJsonObject(request);
    const electionFreeze = requireBoolean(body.electionFreeze, "electionFreeze");
    const rankingsPublic =
      body.rankingsPublic === undefined ? !electionFreeze : requireBoolean(body.rankingsPublic, "rankingsPublic");
    const swipeEnabled =
      body.swipeEnabled === undefined ? !electionFreeze : requireBoolean(body.swipeEnabled, "swipeEnabled");
    const supabase = createSupabaseAdmin();
    const adminRateKey = await hashAdminRateKey(request);

    await consumeRateLimit(supabase, adminRateKey, "admin-freeze", 60, 3600);

    const updates = [
      { key: "election_freeze", value: electionFreeze },
      { key: "rankings_public", value: rankingsPublic },
      { key: "swipe_enabled", value: swipeEnabled }
    ];

    for (const update of updates) {
      const { error } = await supabase.from("app_config").upsert({
        key: update.key,
        value: update.value,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }
    }

    const { error: auditError } = await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      action: "config.freeze",
      target_type: "app_config",
      target_id: "freeze",
      metadata: {
        electionFreeze,
        rankingsPublic,
        swipeEnabled
      }
    });

    if (auditError) {
      throw auditError;
    }

    return jsonResponse({
      electionFreeze,
      rankingsPublic,
      swipeEnabled
    });
  } catch (error) {
    return errorResponse(error);
  }
});
