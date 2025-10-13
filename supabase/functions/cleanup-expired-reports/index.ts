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

    const { error: cleanupError } = await supabase.rpc(
      "cleanup_expired_reports"
    );

    if (cleanupError) throw cleanupError;

    const { data: expiredReports, error: countError } = await supabase
      .from("user_issue_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (countError) throw countError;

    const cleanedCount = (expiredReports as any)?.count || 0;

    const { data: activeReports, error: activeError } = await supabase
      .from("user_issue_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "validated"]);

    if (activeError) throw activeError;

    const activeCount = (activeReports as any)?.count || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Expired reports cleaned up successfully",
        cleaned: cleanedCount,
        active: activeCount,
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
    console.error("Error cleaning up reports:", error);
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
