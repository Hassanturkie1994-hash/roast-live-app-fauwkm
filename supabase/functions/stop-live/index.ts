
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { live_input_id } = await req.json();

    console.log("Received stop request:", { live_input_id });

    if (!live_input_id) {
      console.error("Missing live_input_id parameter");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing live_input_id parameter",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN");

    console.log("Cloudflare credentials check:", {
      hasAccountId: !!CF_ACCOUNT_ID,
      hasApiToken: !!CF_API_TOKEN,
    });

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      console.error("Missing Cloudflare credentials");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Cloudflare credentials. Please configure CF_ACCOUNT_ID and CF_API_TOKEN in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Deleting Cloudflare live input...");

    const deleteInput = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs/${live_input_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const json = await deleteInput.json();

    console.log("Cloudflare delete response:", JSON.stringify(json, null, 2));

    if (!json.success) {
      console.error("Cloudflare delete error:", json.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: json.errors ? JSON.stringify(json.errors) : "Failed to delete Cloudflare live input",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = {
      success: true,
      message: "Live stream ended",
    };

    console.log("Sending response:", JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Exception in stop-live:", e);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
