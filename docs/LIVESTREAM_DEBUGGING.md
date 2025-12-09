
# Livestream Debugging Guide

## Overview

This guide helps you debug issues with the Cloudflare livestreaming integration.

## Common Issues

### Issue 1: "Missing live_input_id in server response"

**Cause:** This error occurs when the Cloudflare API doesn't return a valid response, usually because:

1. **Cloudflare credentials are not configured** in Supabase Edge Function secrets
2. **Cloudflare API returned an error** (invalid credentials, API limits, etc.)

**Solution:**

1. **Check if Cloudflare credentials are configured:**
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Verify that `CF_ACCOUNT_ID` and `CF_API_TOKEN` are set
   - Get these values from your Cloudflare dashboard

2. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → start-live → Logs
   - Look for console.log messages that show:
     - "Cloudflare credentials check" - should show `hasAccountId: true` and `hasApiToken: true`
     - "Cloudflare API response" - shows the full response from Cloudflare
     - If you see "Missing Cloudflare credentials", configure the secrets
     - If you see "Cloudflare API error", check the error details

3. **Verify Cloudflare credentials:**
   - Log into Cloudflare Dashboard
   - Go to Stream → API Tokens
   - Create a new API token with "Stream:Edit" permissions
   - Get your Account ID from the URL or dashboard

### Issue 2: Stream starts but no video appears

**Cause:** The stream was created successfully, but video is not being ingested.

**Solution:**

1. **Check if RTMP credentials are present:**
   - Look at the app console logs for "Setting stream data"
   - Verify that `ingest_url` and `stream_key` are not null
   - If they are null, the Cloudflare API didn't return RTMP credentials

2. **Verify WebRTC URL:**
   - Check if `webrtc_url` is present in the logs
   - This is needed for browser-based streaming

3. **Test with external RTMP client:**
   - Use OBS Studio or similar to test the RTMP ingest
   - Server: `ingest_url` (from logs)
   - Stream Key: `stream_key` (from logs)

### Issue 3: "Failed to stop live stream"

**Cause:** The stop-live Edge Function couldn't delete the Cloudflare live input.

**Solution:**

1. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → stop-live → Logs
   - Look for "Cloudflare delete response"
   - Check if there are any error messages

2. **Verify the live_input_id:**
   - Make sure the app is sending the correct `live_input_id`
   - Check app console logs for "Stopping live stream"

3. **Manual cleanup (if needed):**
   - Go to Cloudflare Dashboard → Stream → Live Inputs
   - Manually delete any stuck live inputs

## Debugging Steps

### Step 1: Enable Verbose Logging

The app now has comprehensive logging with emoji indicators:

- 🎥 Starting operations
- 📡 Network requests
- 📥 Responses received
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warnings

### Step 2: Check App Console Logs

When you tap "GO LIVE", you should see:

```
🎬 Starting live stream with title: [your title]
📡 Calling start-live Edge Function...
📥 Response status: 200
📥 Response text: {"success":true,"live_input_id":"...","ingest_url":"...","stream_key":"...","playback_url":"...","webrtc_url":"..."}
📥 Parsed response: [full JSON object]
✅ Setting stream data: [stream details]
✅ Stream started successfully!
```

If you see errors, they will be marked with ❌.

### Step 3: Check Edge Function Logs

Go to Supabase Dashboard → Edge Functions → start-live → Logs

You should see:

```
Received request: {"title":"...","user_id":"..."}
Cloudflare credentials check: {"hasAccountId":true,"hasApiToken":true}
Creating Cloudflare live input...
Cloudflare API response: {"success":true,"result":{"uid":"...","rtmps":{...},"webRTC":{...}}}
Extracted data: {"uid":"...","hasRtmps":true,"hasWebRTC":true}
Sending response: {"success":true,"live_input_id":"...","ingest_url":"...","stream_key":"...","playback_url":"...","webrtc_url":"..."}
```

### Step 4: Verify Response Format

The Edge Function MUST return this exact format:

```json
{
  "success": true,
  "live_input_id": "XXXX",
  "ingest_url": "rtmps://xxxxx",
  "stream_key": "xxxxx",
  "playback_url": "https://xxxxx/manifest/video.m3u8",
  "webrtc_url": "https://xxxxx/webRTC/publish"
}
```

All fields except `webrtc_url` are required.

## Testing Checklist

- [ ] Cloudflare credentials are configured in Supabase Edge Function secrets
- [ ] Edge Function returns 200 status code
- [ ] Response contains `success: true`
- [ ] Response contains `live_input_id`
- [ ] Response contains `ingest_url`, `stream_key`, and `playback_url`
- [ ] App console shows "✅ Stream started successfully!"
- [ ] No error messages in app console or Edge Function logs

## Getting Help

If you're still having issues:

1. **Collect logs:**
   - App console logs (from the moment you tap "GO LIVE")
   - Edge Function logs (from Supabase Dashboard)

2. **Check Cloudflare Dashboard:**
   - Go to Stream → Live Inputs
   - See if any live inputs were created
   - Check their status

3. **Verify API credentials:**
   - Test your Cloudflare API token with curl:
     ```bash
     curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/stream/live_inputs" \
       -H "Authorization: Bearer YOUR_API_TOKEN"
     ```

## Quick Fix Commands

### Re-deploy Edge Functions

If you need to re-deploy the Edge Functions with the latest code, they have already been deployed with version 22 (start-live) and version 20 (stop-live).

### Clear App State

If the app gets stuck in a bad state:

1. Force close the app
2. Clear app data (if needed)
3. Restart the app
4. Try starting a new stream

## Response Validation

The app now validates responses more thoroughly:

1. **Checks if response is valid JSON**
2. **Checks if `success` is true**
3. **Checks if `live_input_id` is present**
4. **Warns if optional fields are missing**
5. **Provides detailed error messages**

All validation errors will be shown in the app console with ❌ indicators.
