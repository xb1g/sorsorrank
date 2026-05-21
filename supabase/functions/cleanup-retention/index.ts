import { errorResponse } from "../_shared/errors.ts";
import { assertMethod, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { requireAdmin } from "../_shared/validation.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "POST");
    requireAdmin(request);

    const supabase = createSupabaseAdmin();
    const retentionDays = Number(Deno.env.get("RAW_EVENT_RETENTION_DAYS") ?? "7");
    const days = Number.isFinite(retentionDays) && retentionDays > 0 ? Math.min(retentionDays, 7) : 7;
    const { data, error } = await supabase.rpc("cleanup_short_retention", {
      max_age: `${days} days`
    });

    if (error) {
      throw error;
    }

    return jsonResponse({
      retentionDays: days,
      result: data
    });
  } catch (error) {
    return errorResponse(error);
  }
});
