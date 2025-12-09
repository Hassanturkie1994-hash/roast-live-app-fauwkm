
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { title, user_id } = await req.json();

    // Validate required fields
    if (!title || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: title and user_id are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read Cloudflare credentials from secrets
    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Cloudflare credentials. Please configure CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) and CF_API_TOKEN in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch moderators for this creator
    const { data: moderators, error: modError } = await supabase
      .from('moderators')
      .select('user_id, profiles(id, username, display_name, avatar_url)')
      .eq('streamer_id', user_id);

    if (modError) {
      console.error('Error fetching moderators:', modError);
    }

    // Create Cloudflare live input
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

    const cloudflareResponse = await createInput.json();

    if (!cloudflareResponse.success || !cloudflareResponse.result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: cloudflareResponse.errors 
            ? JSON.stringify(cloudflareResponse.errors) 
            : "Cloudflare API error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { uid, rtmps, webRTC } = cloudflareResponse.result;

    // Validate required fields from Cloudflare
    if (!uid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing uid in Cloudflare response",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build playback URL
    const playback_url = `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${uid}/manifest/video.m3u8`;

    // Format moderators array
    const moderatorsArray = moderators?.map(mod => ({
      user_id: mod.user_id,
      username: mod.profiles?.username,
      display_name: mod.profiles?.display_name,
      avatar_url: mod.profiles?.avatar_url,
    })) || [];

    // Return response with moderators included
    const response = {
      success: true,
      stream: {
        id: uid,
        live_input_id: uid,
        title: title,
        status: "live",
        playback_url: playback_url,
        moderators: moderatorsArray,
      },
      ingest: {
        webRTC_url: webRTC?.url || null,
        rtmps_url: rtmps?.url || null,
        stream_key: rtmps?.streamKey || null,
      },
    };

    console.log(`✅ Stream started with ${moderatorsArray.length} moderators`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error('Error in start-live function:', e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
