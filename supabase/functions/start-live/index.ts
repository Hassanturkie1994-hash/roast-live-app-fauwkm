
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
          error: json.errors ?? "Cloudflare error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { uid, rtmps, webRTC } = json.result;

    return new Response(
      JSON.stringify({
        success: true,
        stream: { id: uid },
        ingest_url: rtmps?.url,
        stream_key: rtmps?.streamKey,
        rtc_publish_url: webRTC?.url,
        playback_url: `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${uid}/manifest/video.m3u8`,
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
