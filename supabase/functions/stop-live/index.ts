
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { live_input_id } = await req.json();

    if (!live_input_id) {
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

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Cloudflare credentials. Please configure CF_ACCOUNT_ID and CF_API_TOKEN in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

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

    if (!json.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: json.errors ?? "Failed to delete Cloudflare live input",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Live stream ended",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
