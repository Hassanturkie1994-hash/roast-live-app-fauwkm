
# Cloudflare R2 + CDN + Firebase FCM Setup Guide

This guide covers the complete setup for Cloudflare R2 storage, CDN delivery with signed URLs, and Firebase Cloud Messaging (FCM) for push notifications in the Roast Live app.

## Table of Contents

1. [Cloudflare R2 Setup](#cloudflare-r2-setup)
2. [Supabase Edge Functions Configuration](#supabase-edge-functions-configuration)
3. [Firebase FCM Setup](#firebase-fcm-setup)
4. [EAS Build Configuration](#eas-build-configuration)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)

---

## 1. Cloudflare R2 Setup

### Step 1.1: Create R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name your bucket (e.g., `roast-live-media`)
5. Choose a location hint (optional)
6. Click **Create bucket**

### Step 1.2: Generate R2 API Tokens

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure permissions:
   - **Token name**: `roast-live-upload`
   - **Permissions**: Object Read & Write
   - **Bucket**: Select your bucket
4. Click **Create API Token**
5. **IMPORTANT**: Copy and save:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

### Step 1.3: Enable Public Access (Optional)

For public CDN access:

1. Go to your bucket settings
2. Enable **Public Access**
3. Note the public URL format: `https://pub-<ACCOUNT_ID>.r2.dev/<file-path>`

### Step 1.4: Configure Custom Domain (Optional)

For custom CDN domain:

1. In bucket settings, click **Connect Domain**
2. Enter your custom domain (e.g., `cdn.roastlive.com`)
3. Add the CNAME record to your DNS:
   ```
   cdn.roastlive.com CNAME <bucket-name>.<account-id>.r2.cloudflarestorage.com
   ```
4. Wait for DNS propagation
5. Enable HTTPS

---

## 2. Supabase Edge Functions Configuration

### Step 2.1: Set Supabase Secrets

Set the following secrets in your Supabase project:

```bash
# Cloudflare R2 credentials
supabase secrets set CF_R2_ACCESS_KEY_ID="your-access-key-id"
supabase secrets set CF_R2_SECRET_ACCESS_KEY="your-secret-access-key"
supabase secrets set CF_R2_BUCKET="roast-live-media"
supabase secrets set CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Cloudflare API token (for cache purge, zone management)
supabase secrets set CF_API_TOKEN="your-cloudflare-api-token"

# Signing secret for temporary URLs (generate a random 32-character string)
supabase secrets set CF_SIGNING_SECRET="your-random-signing-secret"

# Firebase FCM server key
supabase secrets set FCM_SERVER_KEY="your-fcm-server-key"

# Supabase service role key (for cron webhook calls)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 2.2: Deploy Edge Functions

The following Edge Functions have been deployed:

1. **upload-to-r2**: Returns presigned PUT URL for R2 uploads
   - Endpoint: `https://<project-ref>.supabase.co/functions/v1/upload-to-r2`
   - Method: POST
   - Body: `{ fileName: string, fileType: string, mediaType?: string }`
   - Returns: `{ uploadUrl: string, publicUrl: string, filePath: string }`

2. **sign-url**: Returns signed CDN URL with expiration
   - Endpoint: `https://<project-ref>.supabase.co/functions/v1/sign-url`
   - Method: POST
   - Body: `{ path: string, expiresIn?: number, watermark?: string }`
   - Returns: `{ signedUrl: string, expiresAt: number }`

3. **send-push-notification**: Sends FCM push notifications
   - Endpoint: `https://<project-ref>.supabase.co/functions/v1/send-push-notification`
   - Method: POST
   - Body: `{ userId: string, tokens: Array, notification: object }`

4. **check-ban-expirations**: Cron job for ban expiry checks
   - Endpoint: `https://<project-ref>.supabase.co/functions/v1/check-ban-expirations`
   - Method: POST
   - Scheduled via Supabase Cron

---

## 3. Firebase FCM Setup

### Step 3.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name: `roast-live`
4. Follow the setup wizard

### Step 3.2: Add Android App

1. In Firebase project, click **Add app** → **Android**
2. Enter Android package name: `com.roastlive.roastlive`
3. Download `google-services.json`
4. Place it in your project root (it will be referenced in `app.config.js`)

### Step 3.3: Get FCM Server Key

1. In Firebase Console, go to **Project Settings** → **Cloud Messaging**
2. Under **Cloud Messaging API (Legacy)**, enable it if not already enabled
3. Copy the **Server key**
4. Set it as a Supabase secret:
   ```bash
   supabase secrets set FCM_SERVER_KEY="your-fcm-server-key"
   ```

### Step 3.4: Configure Push Notifications

The app is already configured with `expo-notifications`. The push notification flow:

1. User logs in → Device token is registered
2. Server sends notification → `send-push-notification` Edge Function
3. Edge Function uses FCM to deliver to device
4. Invalid tokens are automatically deactivated

---

## 4. EAS Build Configuration

### Step 4.1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 4.2: Configure EAS Project

```bash
eas build:configure
```

This creates/updates `eas.json` with build profiles.

### Step 4.3: Set EAS Secrets

```bash
# Set environment variables for EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-supabase-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name CLOUDFLARE_R2_PUBLIC_BASE_URL --value "https://pub-YOUR_ACCOUNT_ID.r2.dev"
eas secret:create --scope project --name CLOUDFLARE_ACCOUNT_ID --value "your-account-id"
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-expo-project-id"
```

### Step 4.4: Build for Android

```bash
# Development build
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

---

## 5. Environment Variables

### 5.1 Runtime Variables (app.config.js)

These are accessible in the app via `Constants.expoConfig.extra`:

```javascript
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://pub-YOUR_ACCOUNT_ID.r2.dev
CLOUDFLARE_ACCOUNT_ID=your-account-id
SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

### 5.2 Build-Time Secrets (Supabase)

These are only accessible in Edge Functions:

```bash
CF_R2_ACCESS_KEY_ID=your-access-key-id
CF_R2_SECRET_ACCESS_KEY=your-secret-access-key
CF_R2_BUCKET=roast-live-media
CF_API_TOKEN=your-cloudflare-api-token
CF_SIGNING_SECRET=your-random-signing-secret
FCM_SERVER_KEY=your-fcm-server-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5.3 Local Development (.env.local)

Create a `.env.local` file (DO NOT commit to git):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://pub-YOUR_ACCOUNT_ID.r2.dev
CLOUDFLARE_ACCOUNT_ID=your-account-id
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

---

## 6. Testing

### 6.1 Test R2 Upload

```typescript
import { r2Service } from '@/app/services/r2Service';

// Upload a file
const file = new Blob(['test content'], { type: 'text/plain' });
const result = await r2Service.uploadFile(file, 'test.txt', 'other');

if (result.success) {
  console.log('Uploaded to:', result.publicUrl);
} else {
  console.error('Upload failed:', result.error);
}
```

### 6.2 Test Signed URL

```typescript
import { r2Service } from '@/app/services/r2Service';

// Get signed URL
const signedUrlResult = await r2Service.getSignedUrl(
  'profile/user-id/avatar.jpg',
  600, // 10 minutes
  'RoastLive'
);

if (signedUrlResult.success) {
  console.log('Signed URL:', signedUrlResult.signedUrl);
} else {
  console.error('Failed to get signed URL:', signedUrlResult.error);
}
```

### 6.3 Test Push Notifications

```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Send a test notification
await pushNotificationService.sendPushNotification(
  'user-id',
  'SYSTEM_WARNING',
  'Test Notification',
  'This is a test push notification',
  { route: 'Home' }
);
```

### 6.4 Test on Device

1. Build the app with EAS:
   ```bash
   eas build --platform android --profile development
   ```

2. Install the build on your Android device

3. Test push notifications:
   - Log in to the app
   - Device token should be registered automatically
   - Send a test notification from Supabase dashboard or admin panel

---

## Important Notes

### Security

- **NEVER** commit secrets to git
- Use Supabase secrets for server-side credentials
- Use EAS secrets for build-time environment variables
- Rotate signing secrets regularly

### Cloudflare Stream API

- **NOT INCLUDED** in this setup as per requirements
- Live streaming uses WebRTC, not Cloudflare Stream
- R2 is only for static assets (images, thumbnails, gifts)

### Push Notifications

- **Expo Go does not support FCM on Android (SDK 53+)**
- Must use EAS development build for testing
- Use `eas build --platform android --profile development` for testing

### Autolinking

- `react-native-nodemediaclient` is excluded from autolinking
- This is configured in `app.config.js` under `autolinking.exclude`

---

## Troubleshooting

### R2 Upload Fails

1. Check Supabase secrets are set correctly
2. Verify R2 bucket permissions
3. Check Edge Function logs in Supabase dashboard

### Push Notifications Not Working

1. Verify FCM_SERVER_KEY is set in Supabase secrets
2. Check device token is registered in `push_device_tokens` table
3. Ensure app is built with EAS (not Expo Go)
4. Check Edge Function logs for errors

### Signed URLs Not Working

1. Verify CF_SIGNING_SECRET is set
2. Check URL expiration time
3. Ensure path is correct

---

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Review Cloudflare R2 dashboard
- Check Firebase Console for FCM delivery status
- Review EAS build logs

