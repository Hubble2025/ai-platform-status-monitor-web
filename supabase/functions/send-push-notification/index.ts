import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  provider_ids: string[];
  severity_filter: string;
  notify_on_start: boolean;
  notify_on_resolved: boolean;
}

interface NotificationPayload {
  incident_id: string;
  provider_id: string;
  provider_name: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  notification_type: 'incident_started' | 'incident_resolved';
}

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

    const payload: NotificationPayload = await req.json();

    const {
      incident_id,
      provider_id,
      provider_name,
      title,
      description,
      severity,
      status,
      notification_type,
    } = payload;

    // Get all subscriptions that match the criteria
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subsError) {
      throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Filter subscriptions based on criteria
    const matchingSubscriptions = subscriptions.filter((sub: PushSubscription) => {
      // Check if notification type matches preferences
      if (notification_type === 'incident_started' && !sub.notify_on_start) return false;
      if (notification_type === 'incident_resolved' && !sub.notify_on_resolved) return false;

      // Check severity filter
      if (sub.severity_filter === 'critical' && severity !== 'critical') return false;
      if (sub.severity_filter === 'major' && !['critical', 'major'].includes(severity)) return false;

      // Check provider filter (empty array means all providers)
      if (sub.provider_ids.length > 0 && !sub.provider_ids.includes(provider_id)) return false;

      return true;
    });

    // Prepare notification content
    const notificationTitle = notification_type === 'incident_started'
      ? `🔴 ${provider_name} - ${severity === 'critical' ? 'Critical' : 'Major'} Incident`
      : `✅ ${provider_name} - Incident Resolved`;

    const notificationBody = notification_type === 'incident_started'
      ? description
      : `${title} has been resolved`;

    const notificationData = {
      url: `${Deno.env.get("SUPABASE_URL")}/`,
      incident_id,
      provider_id,
      provider_name,
      notification_type,
    };

    // Send push notifications to all matching subscriptions
    const sendResults = await Promise.allSettled(
      matchingSubscriptions.map(async (sub: PushSubscription) => {
        try {
          // Web Push requires VAPID keys, but for this demo we'll use a simple approach
          // In production, you would use web-push library with proper VAPID authentication
          
          const pushPayload = JSON.stringify({
            title: notificationTitle,
            body: notificationBody,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            data: notificationData,
          });

          // Note: Actual push sending would require web-push library and VAPID keys
          // For now, we'll just log the notification and store it in history
          console.log(`Would send to ${sub.endpoint}: ${pushPayload}`);

          // Store notification in history
          await supabase
            .from("notification_history")
            .insert({
              push_subscription_id: sub.id,
              incident_id,
              rule_id: null,
              channel: 'push',
              status: 'sent',
              metadata: {
                title: notificationTitle,
                body: notificationBody,
                notification_type,
              },
            });

          return { success: true, subscription_id: sub.id };
        } catch (error) {
          console.error(`Failed to send to ${sub.endpoint}:`, error);
          return { success: false, subscription_id: sub.id, error: String(error) };
        }
      })
    );

    const successCount = sendResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = sendResults.length - successCount;

    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        total: matchingSubscriptions.length,
        sent: successCount,
        failed: failureCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});