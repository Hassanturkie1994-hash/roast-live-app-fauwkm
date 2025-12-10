
# Quick Reference: Push Notifications, R2 & Cache Purge

## 🚀 Quick Start

### 1. Set Environment Variables

**Supabase Secrets (Dashboard → Settings → Edge Functions → Secrets):**
```
FCM_SERVER_KEY=your-fcm-server-key
CF_R2_ACCESS_KEY_ID=your-r2-access-key
CF_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CF_R2_BUCKET=your-bucket-name
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id
CF_SIGNING_SECRET=your-signing-secret
```

**Database Settings (for cron job):**
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://uaqsjqakhgycfopftzzp.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

---

## 📱 Push Notifications

### Send Push Notification

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "tokens": [{"token": "ExponentPushToken[...]", "platform": "android"}],
    "notification": {
      "title": "Test",
      "body": "Test notification",
      "data": {}
    }
  }'
```

### Check Device Tokens

```sql
SELECT * FROM push_device_tokens WHERE user_id = 'user-uuid' AND is_active = true;
```

### View Notification Logs

```sql
SELECT * FROM push_notifications_log WHERE user_id = 'user-uuid' ORDER BY sent_at DESC LIMIT 10;
```

---

## 📦 R2 Storage

### Upload File

**Step 1: Get presigned URL**
```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/upload-to-r2 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.jpg", "fileType": "image/jpeg", "mediaType": "profile"}'
```

**Step 2: Upload file**
```bash
curl -X PUT "PRESIGNED_URL" -H "Content-Type: image/jpeg" --data-binary @test.jpg
```

### Get Signed URL

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/sign-url \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"path": "profiles/test.jpg", "expiresIn": 600}'
```

---

## 🗑️ Cache Purge

### Purge Specific URLs

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/purge-cache \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://cdn.example.com/file.jpg"]}'
```

### Purge by Tags

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/purge-cache \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["profile-images"]}'
```

---

## ⏰ Cron Job

### View Cron Jobs

```sql
SELECT * FROM cron.job;
```

### View Cron Job History

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Manual Trigger

```sql
SELECT public.trigger_ban_expiration_check();
```

---

## 🔧 Troubleshooting

### Push Notifications Not Working

1. Check if in Expo Go on Android (not supported)
2. Verify `EXPO_PROJECT_ID` in `app.json`
3. Check `FCM_SERVER_KEY` is set
4. Verify device token in database
5. Check permissions granted

### Cron Job Not Running

```sql
-- Check settings
SHOW app.settings.supabase_url;
SHOW app.settings.service_role_key;

-- Check job status
SELECT * FROM cron.job WHERE jobname = 'check-ban-expirations-every-5-min';
```

### R2 Upload Failing

1. Verify R2 credentials
2. Check bucket name
3. Verify presigned URL not expired
4. Check Content-Type header

---

## 📊 Monitoring Queries

### Push Notification Stats (Last 7 Days)

```sql
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') as sent,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed
FROM push_notifications_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY type;
```

### Active Device Tokens by Platform

```sql
SELECT 
  platform,
  COUNT(*) as count
FROM push_device_tokens
WHERE is_active = true
GROUP BY platform;
```

### Failed Notifications

```sql
SELECT 
  user_id,
  type,
  title,
  sent_at
FROM push_notifications_log
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC
LIMIT 20;
```

---

## 🏗️ Build Commands

```bash
# Prebuild
npx expo prebuild --clean

# Development build
eas build -p android --profile development

# Production build
eas build -p android --profile production
```

---

## 🔐 Security Checklist

- ✅ All API keys in Supabase/EAS Secrets
- ✅ RLS enabled on all tables
- ✅ Least-privileged Cloudflare API tokens
- ✅ Signed URLs for sensitive media
- ✅ Input validation in Edge Functions
- ✅ No secrets in git
- ✅ No secrets in client code

---

## 📚 Key Files

- `hooks/usePushNotifications.ts` - Push notification registration
- `app/services/r2Service.ts` - R2 upload service
- `supabase/functions/send-push-notification/index.ts` - Send notifications
- `supabase/functions/check-ban-expirations/index.ts` - Ban expiration checks
- `supabase/functions/upload-to-r2/index.ts` - R2 presigned URLs
- `supabase/functions/sign-url/index.ts` - Signed CDN URLs
- `supabase/functions/purge-cache/index.ts` - Cache purging

---

**For detailed documentation, see:** `PUSH_NOTIFICATIONS_R2_IMPLEMENTATION_COMPLETE.md`
