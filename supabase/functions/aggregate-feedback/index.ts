import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: aggregateError } = await supabase.rpc(
      "aggregate_feedback_hourly"
    );

    if (aggregateError) throw aggregateError;

    const { data: stats, error: statsError } = await supabase
      .from("feedback_aggregations")
      .select("*")
      .gte("hour_bucket", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order("hour_bucket", { ascending: false });

    if (statsError) throw statsError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Feedback aggregated successfully",
        aggregations: stats?.length || 0,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error aggregating feedback:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
