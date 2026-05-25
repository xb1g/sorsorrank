import { readAppConfig } from "../_shared/appConfig.ts";
import { getBangkokDate } from "../_shared/dailyDeck.ts";
import { errorResponse } from "../_shared/errors.ts";
import { assertMethod, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { MIN_RANKING_SAMPLE_SIZE } from "../_shared/validation.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    assertMethod(request, "GET");

    const supabase = createSupabaseAdmin();
    const config = await readAppConfig(supabase);
    const threshold = config.integer("minimum_ranking_sample_size", MIN_RANKING_SAMPLE_SIZE);
    const today = new URL(request.url).searchParams.get("date") ?? getBangkokDate();

    if (config.boolean("election_freeze", false) || !config.boolean("rankings_public", false)) {
      return jsonResponse({
        generatedAt: new Date().toISOString(),
        date: today,
        threshold,
        sampleSize: 0,
        rows: [],
        hidden: true,
        message: "The Research Interest Rank is paused during a sensitive review period."
      });
    }

    const { data, error } = await supabase
      .from("research_interest_rankings")
      .select(
        "date,politician_id,display_name,role_label,party_label,search_query,image_url,image_source_url,info_source_url,featured_priority,eligible_impressions,research_actions,research_interest_score,hidden_below_threshold"
      )
      .eq("date", today)
      .eq("hidden_below_threshold", false)
      .order("research_interest_score", { ascending: false })
      .order("eligible_impressions", { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []).map((row, index) => ({
      rank: index + 1,
      politicianId: row.politician_id,
      displayName: row.display_name,
      roleLabel: row.role_label,
      partyLabel: row.party_label,
      searchQuery: row.search_query,
      imageUrl: row.image_url,
      imageSourceUrl: row.image_source_url,
      infoSourceUrl: row.info_source_url,
      featuredPriority: row.featured_priority,
      eligibleImpressions: row.eligible_impressions,
      researchActions: row.research_actions,
      researchInterestScore: Number(row.research_interest_score),
      hiddenBelowThreshold: row.hidden_below_threshold
    }));
    const sampleSize = rows.reduce((total, row) => total + row.eligibleImpressions, 0);

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      date: today,
      threshold,
      sampleSize,
      rows,
      hidden: false,
      disclaimer: "Aggregate taps only. No public row shows individual choices."
    });
  } catch (error) {
    return errorResponse(error);
  }
});
