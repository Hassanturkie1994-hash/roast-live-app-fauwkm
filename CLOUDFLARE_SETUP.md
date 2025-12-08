
# Cloudflare Stream Integration Setup Guide

This guide explains how to configure Cloudflare Stream for live streaming in the Roast Live app.

## Overview

The app uses **Cloudflare Stream** for:
- **RTMP Ingest**: Broadcasters send live video via RTMP
- **HLS Playback**: Viewers watch streams via adaptive bitrate HLS
- **CDN Delivery**: Global content delivery with low latency
- **Automatic Transcoding**: Multiple quality levels (240p-1080p)

## Architecture

```
Broadcaster (OBS/App) → RTMP → Cloudflare Stream → HLS → Cloudflare CDN → Viewers
                                        ↓
                                   Supabase DB
                                (Stream Metadata)
```

## Required Cloudflare Credentials

You need two pieces of information from your Cloudflare account:

### 1. Account ID
- Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Navigate to **Stream** in the left sidebar
- Your Account ID is displayed in the URL: `dash.cloudflare.com/<ACCOUNT_ID>/stream`

### 2. API Token
- Go to **My Profile** → **API Tokens**
- Click **Create Token**
- Use the **Edit Cloudflare Stream** template
- Or create a custom token with these permissions:
  - **Account** → **Stream** → **Edit**
- Copy the generated token (you won't see it again!)

## Setting Up Environment Variables in Supabase

The Cloudflare credentials must be stored as **secrets** in Supabase Edge Functions:

### Via Supabase Dashboard:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → **Secrets**
4. Add the following secrets:
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token

### Via Supabase CLI:
```bash
# Set Cloudflare Account ID
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Set Cloudflare API Token
supabase secrets set CLOUDFLARE_API_TOKEN=your_api_token_here
```

## How It Works

### 1. Starting a Live Stream

When a broadcaster clicks "Go Live":

1. **Frontend** calls `cloudflareService.startLive(title, broadcasterId)`
2. **Edge Function** (`start-live`) creates a Cloudflare Stream live input
3. **Cloudflare** returns:
   - `rtmp_url`: RTMP ingest endpoint
   - `stream_key`: Unique stream key
   - `playback_url`: HLS manifest URL
4. **Supabase** stores stream metadata in the `streams` table
5. **Frontend** displays RTMP credentials to broadcaster

### 2. Broadcasting

The broadcaster uses streaming software (OBS, Streamlabs, etc.) with:
- **Server**: The RTMP URL from Cloudflare
- **Stream Key**: The unique key for this session

Cloudflare automatically:
- Transcodes to multiple qualities
- Generates HLS manifest
- Distributes via CDN

### 3. Viewing

When a viewer opens a stream:

1. **Frontend** fetches stream data from Supabase
2. **expo-video** plays the HLS stream from `playback_url`
3. **Adaptive bitrate** automatically adjusts quality
4. **Cloudflare CDN** serves video segments globally

### 4. Ending a Stream

When a broadcaster stops streaming:

1. **Frontend** calls `cloudflareService.stopLive(streamId)`
2. **Edge Function** (`stop-live`) deletes the Cloudflare live input
3. **Supabase** updates stream status to "ended"

## Database Schema

The `streams` table stores:

```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id UUID REFERENCES users(id),
  cloudflare_stream_id TEXT,      -- Cloudflare live input ID
  ingest_url TEXT,                 -- RTMP ingest URL
  stream_key TEXT,                 -- RTMP stream key
  playback_url TEXT,               -- HLS playback URL
  title TEXT NOT NULL,
  status TEXT DEFAULT 'ended',     -- 'live' or 'ended'
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

✅ **RTMP credentials are never exposed in the frontend**
- Only returned once when stream starts
- Stored securely in Supabase
- Only accessible to the broadcaster

✅ **API tokens are stored as Edge Function secrets**
- Never committed to version control
- Only accessible to Edge Functions
- Encrypted at rest

✅ **Row Level Security (RLS) policies**
- Users can only access their own streams
- Viewers can only see public stream data

## Testing Your Setup

### 1. Test Stream Creation
```typescript
// In your app
const response = await cloudflareService.startLive('Test Stream', userId);
console.log('RTMP URL:', response.ingest_url);
console.log('Stream Key:', response.stream_key);
console.log('Playback URL:', response.playback_url);
```

### 2. Test with OBS
1. Open OBS Studio
2. Go to **Settings** → **Stream**
3. Select **Custom** as Service
4. Enter the RTMP URL as Server
5. Enter the Stream Key
6. Click **Start Streaming**

### 3. Test Playback
1. Open the app
2. Navigate to the live stream
3. The HLS player should load and play automatically

## Troubleshooting

### "Cloudflare credentials not configured"
- Verify secrets are set in Supabase Edge Functions
- Check secret names match exactly: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`

### "Failed to start stream"
- Check Cloudflare API token has correct permissions
- Verify Account ID is correct
- Check Edge Function logs in Supabase Dashboard

### Video not playing
- Verify `playback_url` is set in database
- Check that stream is actually live (broadcasting via RTMP)
- Test playback URL directly in a browser

### Stream ends immediately
- Ensure broadcaster is actively sending RTMP stream
- Check RTMP credentials are correct
- Verify firewall allows RTMP traffic (port 1935)

## Cloudflare Stream Pricing

Cloudflare Stream pricing (as of 2024):
- **Storage**: $5/1000 minutes stored
- **Delivery**: $1/1000 minutes delivered
- **Live**: Included with Stream subscription

For current pricing, visit: https://www.cloudflare.com/products/cloudflare-stream/

## Additional Resources

- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)
- [Cloudflare Stream API Reference](https://developers.cloudflare.com/api/operations/stream-live-inputs-create-a-live-input)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [expo-video Documentation](https://docs.expo.dev/versions/latest/sdk/video/)

## Support

For issues with:
- **Cloudflare Stream**: Contact Cloudflare Support
- **Supabase**: Check Supabase Documentation or Discord
- **App Integration**: Check application logs and Edge Function logs
