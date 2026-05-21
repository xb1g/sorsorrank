import { errorResponse } from "../_shared/errors.ts";
import { HttpError, assertMethod, jsonResponse, optionsResponse, readJsonObject } from "../_shared/http.ts";
import { consumeRateLimit } from "../_shared/rateLimit.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import {
  hashAdminRateKey,
  optionalString,
  requireAdmin,
  requireBoolean,
  requireString,
  validateRosterText
} from "../_shared/validation.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    const adminId = requireAdmin(request);
    const supabase = createSupabaseAdmin();
    const adminRateKey = await hashAdminRateKey(request);
    await consumeRateLimit(supabase, adminRateKey, "admin-roster", 240, 3600);

    if (request.method === "GET") {
      const { data, error } = await supabase
        .from("politicians")
        .select("id,display_name,slug,role_label,party_label,status,search_query,active_candidate,legal_reviewed_at,roster_version,updated_at")
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      return jsonResponse({ roster: data ?? [] });
    }

    assertMethod(request, "POST");
    const body = await readJsonObject(request);
    const id = optionalString(body.id, "id", 80);
    const displayName = requireString(body.displayName, "displayName", 160);
    const slug = requireString(body.slug, "slug", 120);
    const roleLabel = optionalString(body.roleLabel, "roleLabel", 120);
    const partyLabel = optionalString(body.partyLabel, "partyLabel", 120);
    const status = requireString(body.status ?? "draft", "status", 16);
    const searchQuery = requireString(body.searchQuery, "searchQuery", 240);
    const activeCandidate =
      body.activeCandidate === undefined ? false : requireBoolean(body.activeCandidate, "activeCandidate");
    const legalReviewedAt = optionalString(body.legalReviewedAt, "legalReviewedAt", 64);

    if (!["draft", "active", "archived"].includes(status)) {
      throw new HttpError(400, "BadRequest", "status must be draft, active, or archived.");
    }

    validateRosterText(displayName, roleLabel, partyLabel, searchQuery);

    const payload = {
      ...(id ? { id } : {}),
      display_name: displayName,
      slug,
      role_label: roleLabel,
      party_label: partyLabel,
      status,
      search_query: searchQuery,
      active_candidate: activeCandidate,
      legal_reviewed_at: legalReviewedAt
    };

    const { data, error } = await supabase
      .from("politicians")
      .upsert(payload, { onConflict: "id" })
      .select("id,display_name,slug,status,updated_at")
      .single();

    if (error) {
      throw error;
    }

    const { error: auditError } = await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      action: id ? "roster.update" : "roster.create",
      target_type: "politician",
      target_id: data.id,
      metadata: {
        slug,
        status,
        activeCandidate
      }
    });

    if (auditError) {
      throw auditError;
    }

    return jsonResponse({ rosterItem: data });
  } catch (error) {
    return errorResponse(error);
  }
});
