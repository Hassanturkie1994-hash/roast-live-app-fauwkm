
# Setup Commands - Cloudflare R2 + FCM

This file contains all the commands you need to run to set up Cloudflare R2 and Firebase FCM for Roast Live.

## Prerequisites

- Cloudflare account with R2 enabled
- Firebase project created
- Supabase project set up
- EAS CLI installed (`npm install -g eas-cli`)
- Supabase CLI installed (optional, for local development)

---

## 1. Cloudflare R2 Setup

### Create R2 Bucket (via Dashboard)

1. Go to https://dash.cloudflare.com/
2. Navigate to R2 Object Storage
3. Click "Create bucket"
4. Name: `roast-live-media`
5. Click "Create bucket"

### Generate R2 API Tokens (via Dashboard)

1. In R2 dashboard, click "Manage R2 API Tokens"
2. Click "Create API token"
3. Name: `roast-live-upload`
4. Permissions: Object Read & Write
5. Bucket: `roast-live-media`
6. Click "Create API Token"
7. **Save these values**:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

---

## 2. Firebase FCM Setup

### Create Firebase Project (via Console)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: `roast-live`
4. Follow setup wizard

### Add Android App (via Console)

1. In Firebase project, click "Add app" → "Android"
2. Package name: `com.roastlive.roastlive`
3. Download `google-services.json`
4. Place in project root

### Get FCM Server Key (via Console)

1. Go to Project Settings → Cloud Messaging
2. Enable Cloud Messaging API (Legacy) if not enabled
3. Copy "Server key"

---

## 3. Set Supabase Secrets

Run these commands to set secrets in Supabase:

```bash
# Cloudflare R2 credentials
supabase secrets set CF_R2_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
supabase secrets set CF_R2_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
supabase secrets set CF_R2_BUCKET="roast-live-media"
supabase secrets set CLOUDFLARE_ACCOUNT_ID="YOUR_ACCOUNT_ID"

# Cloudflare API token (for cache purge, zone management)
supabase secrets set CF_API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN"

# Signing secret for temporary URLs (generate a random 32-character string)
# You can generate one with: openssl rand -hex 32
supabase secrets set CF_SIGNING_SECRET="YOUR_RANDOM_32_CHAR_SECRET"

# Firebase FCM server key
supabase secrets set FCM_SERVER_KEY="YOUR_FCM_SERVER_KEY"

# Supabase service role key (get from Supabase dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

### Generate Random Signing Secret

```bash
# On macOS/Linux
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Set EAS Secrets

Run these commands to set secrets in EAS:

```bash
# Log in to EAS
eas login

# Set project secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY"
eas secret:create --scope project --name CLOUDFLARE_R2_PUBLIC_BASE_URL --value "https://pub-YOUR_ACCOUNT_ID.r2.dev"
eas secret:create --scope project --name CLOUDFLARE_ACCOUNT_ID --value "YOUR_ACCOUNT_ID"
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "YOUR_EXPO_PROJECT_ID"
```

### Get Your Expo Project ID

```bash
# If you don't have one yet
eas init

# Or check your existing project
eas project:info
```

---

## 5. Local Development Setup

### Create .env.local

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your values
# DO NOT commit this file to git
```

### .env.local Contents

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://pub-YOUR_ACCOUNT_ID.r2.dev
CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID
SUPABASE_FUNCTIONS_URL=https://YOUR_PROJECT.supabase.co/functions/v1
EXPO_PUBLIC_PROJECT_ID=YOUR_EXPO_PROJECT_ID
GOOGLE_SERVICES_JSON=./google-services.json
```

---

## 6. Verify Edge Functions

The Edge Functions have already been deployed. Verify they're working:

```bash
# Test upload-to-r2
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/upload-to-r2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.jpg","fileType":"image/jpeg","mediaType":"profile"}'

# Test sign-url
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sign-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":"profile/user-id/test.jpg","expiresIn":600}'

# Test send-push-notification
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-id",
    "tokens":[{"token":"test-token","platform":"android"}],
    "notification":{"title":"Test","body":"Test notification"}
  }'
```

---

## 7. Build and Test

### Configure EAS Build

```bash
# Initialize EAS (if not already done)
eas build:configure
```

### Build for Android

```bash
# Development build (for testing)
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Install on Device

```bash
# After build completes, download and install the APK
# Or use EAS CLI to install directly
eas build:run --platform android --profile development
```

---

## 8. Test Push Notifications

### Register Device Token

1. Open the app on your device
2. Log in
3. Device token should be registered automatically
4. Check `push_device_tokens` table in Supabase

### Send Test Notification

```bash
# Via Supabase SQL Editor
SELECT * FROM push_device_tokens WHERE user_id = 'YOUR_USER_ID';

# Then use the token to send a test notification via Edge Function
```

Or use the admin panel in the app to send test notifications.

---

## 9. Verify Setup

### Check Supabase Secrets

```bash
supabase secrets list
```

Should show:
- CF_R2_ACCESS_KEY_ID
- CF_R2_SECRET_ACCESS_KEY
- CF_R2_BUCKET
- CLOUDFLARE_ACCOUNT_ID
- CF_API_TOKEN
- CF_SIGNING_SECRET
- FCM_SERVER_KEY
- SUPABASE_SERVICE_ROLE_KEY

### Check EAS Secrets

```bash
eas secret:list
```

Should show:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- CLOUDFLARE_R2_PUBLIC_BASE_URL
- CLOUDFLARE_ACCOUNT_ID
- EXPO_PUBLIC_PROJECT_ID

### Check Edge Functions

```bash
# List all functions
supabase functions list

# Check function logs
supabase functions logs upload-to-r2
supabase functions logs sign-url
supabase functions logs send-push-notification
```

---

## 10. Troubleshooting

### R2 Upload Fails

```bash
# Check Supabase secrets
supabase secrets list

# Check Edge Function logs
supabase functions logs upload-to-r2 --tail

# Verify R2 bucket permissions in Cloudflare dashboard
```

### Push Notifications Not Working

```bash
# Check FCM server key
supabase secrets list | grep FCM

# Check device tokens
# In Supabase SQL Editor:
SELECT * FROM push_device_tokens WHERE is_active = true;

# Check Edge Function logs
supabase functions logs send-push-notification --tail

# Verify google-services.json is in project root
ls -la google-services.json
```

### Build Fails

```bash
# Check EAS secrets
eas secret:list

# Check build logs
eas build:list

# View specific build log
eas build:view BUILD_ID
```

---

## Quick Reference

### Generate Random Secret

```bash
openssl rand -hex 32
```

### Set Supabase Secret

```bash
supabase secrets set KEY="VALUE"
```

### Set EAS Secret

```bash
eas secret:create --scope project --name KEY --value "VALUE"
```

### Build for Android

```bash
eas build --platform android --profile development
```

### View Logs

```bash
supabase functions logs FUNCTION_NAME --tail
```

---

## Important Notes

1. **Never commit secrets to git**
2. **Use .env.local for local development** (gitignored)
3. **Test on real device** (Expo Go doesn't support FCM on Android)
4. **Monitor Edge Function logs** for errors
5. **Rotate secrets regularly** for security

---

## Support

If you encounter issues:
1. Check Edge Function logs in Supabase dashboard
2. Review Cloudflare R2 dashboard
3. Check Firebase Console for FCM delivery status
4. Review EAS build logs
5. Refer to CLOUDFLARE_R2_FCM_SETUP_GUIDE.md

