
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { title, user_id } = await req.json();

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

    if (!json.success || !json.result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: json.errors ? JSON.stringify(json.errors) : "Cloudflare API error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { uid, rtmps, webRTC } = json.result;

    if (!uid) {
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

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
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
