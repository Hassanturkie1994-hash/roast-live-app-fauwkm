
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { title, user_id } = await req.json();

    console.log("Received request:", { title, user_id });

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

    console.log("Creating Cloudflare live input...");

    const createInput = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: { title, user_id },
        }),
      }
    );

    const json = await createInput.json();

    console.log("Cloudflare API response:", JSON.stringify(json, null, 2));

    if (!json.success || !json.result) {
      console.error("Cloudflare API error:", json.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: json.errors ? JSON.stringify(json.errors) : "Cloudflare API error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { uid, rtmps, webRTC } = json.result;

    console.log("Extracted data:", {
      uid,
      hasRtmps: !!rtmps,
      hasWebRTC: !!webRTC,
    });

    if (!uid) {
      console.error("Missing uid in Cloudflare response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing uid in Cloudflare response",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = {
      success: true,
      live_input_id: uid,
      ingest_url: rtmps?.url || null,
      stream_key: rtmps?.streamKey || null,
      playback_url: `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${uid}/manifest/video.m3u8`,
      webrtc_url: webRTC?.url || null,
    };

    console.log("Sending response:", JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Exception in start-live:", e);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
