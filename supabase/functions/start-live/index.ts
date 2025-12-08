
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { title, user_id } = await req.json();

    if (!title || !user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: title and user_id' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Cloudflare credentials from environment
    const CF_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const CF_ACCOUNT = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

    if (!CF_TOKEN || !CF_ACCOUNT) {
      console.error('Missing Cloudflare credentials');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing Cloudflare credentials" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating Cloudflare live input for user:', user_id);

    // Create live input in Cloudflare Stream
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream/live_inputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: { 
            user_id,
            title 
          },
          recording: {
            mode: "automatic",
            timeoutSeconds: 10
          }
        }),
      }
    );

    const cfData = await cfResponse.json();

    if (!cfData.success || !cfData.result) {
      console.error('Cloudflare API error:', cfData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create Cloudflare live input',
          cloudflareError: cfData 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = cfData.result;
    console.log('Cloudflare live input created:', result.uid);

    // Extract stream details with fallbacks to ensure no undefined values
    const liveInputId = result.uid || '';
    const ingestUrl = result.rtmps?.url || result.rtmp?.url || '';
    const streamKey = result.rtmps?.streamKey || result.rtmp?.streamKey || '';
    const playbackUrl = result.playback?.hls || '';
    const rtcPublishUrl = result.webRTC?.url || null;

    // Validate required fields are not empty
    if (!liveInputId || !ingestUrl || !streamKey || !playbackUrl) {
      console.error('Missing required fields from Cloudflare response:', {
        liveInputId: !!liveInputId,
        ingestUrl: !!ingestUrl,
        streamKey: !!streamKey,
        playbackUrl: !!playbackUrl
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Incomplete response from Cloudflare Stream - missing required fields' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Store stream in database using fetch
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/streams`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          broadcaster_id: user_id,
          cloudflare_stream_id: liveInputId,
          title: title,
          ingest_url: ingestUrl,
          stream_key: streamKey,
          playback_url: playbackUrl,
          status: 'live',
          viewer_count: 0,
          started_at: new Date().toISOString(),
        })
      }
    );

    if (!dbResponse.ok) {
      const dbError = await dbResponse.text();
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store stream in database',
          dbError 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const streams = await dbResponse.json();
    const stream = streams[0];

    if (!stream || !stream.id) {
      console.error('No stream returned from database or missing stream.id');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to retrieve created stream with valid ID' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Stream stored in database with ID:', stream.id);

    // Return response in the EXACT format expected by the frontend
    // All fields must be defined (not undefined)
    const response = {
      success: true,
      stream: {
        id: stream.id, // This is the critical field that must always be present
      },
      ingest_url: ingestUrl,
      stream_key: streamKey,
      playback_url: playbackUrl,
    };

    console.log('Returning success response with stream.id:', response.stream.id);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
