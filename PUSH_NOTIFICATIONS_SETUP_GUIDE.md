
# Push Notifications Setup Guide

## 📋 Prerequisites

1. **Firebase Project** (for FCM)
   - Create a project at https://console.firebase.google.com/
   - Enable Cloud Messaging
   - Get your FCM Server Key

2. **Expo Project ID**
   - Get from https://expo.dev/

## 🔧 Setup Steps

### Step 1: Configure Firebase Cloud Messaging (FCM)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Create a new project or select existing project
3. Go to Project Settings > Cloud Messaging
4. Copy your **Server Key** (legacy) or **Cloud Messaging API Key**

### Step 2: Set Supabase Secrets

Set the FCM Server Key as a Supabase secret:

```bash
# Using Supabase CLI
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here

# Or via Supabase Dashboard
# Go to Project Settings > Edge Functions > Secrets
# Add: FCM_SERVER_KEY = your_fcm_server_key_here
```

### Step 3: Configure app.json

Add expo-notifications plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#A40028",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#A40028",
      "androidMode": "default",
      "androidCollapsedTitle": "RoastLive"
    }
  }
}
```

### Step 4: Update Expo Project ID

In `hooks/usePushNotifications.ts`, replace the placeholder with your actual Expo project ID:

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id', // Replace with your actual project ID
});
```

You can find your project ID at: https://expo.dev/

### Step 5: Deploy Edge Functions

The edge functions have been deployed automatically:
- ✅ `send-push-notification` - Sends push notifications via FCM
- ✅ `check-ban-expirations` - Checks for expired bans and sends notifications

### Step 6: Set Up Cron Job (Optional but Recommended)

To automatically check for expired bans every 5 minutes, set up a cron job:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the ban expiration check to run every 5 minutes
SELECT cron.schedule(
  'check-ban-expirations',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/check-ban-expirations',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

**Note:** Replace `YOUR_SERVICE_ROLE_KEY` with your actual Supabase service role key.

Alternatively, you can use an external cron service like:
- Vercel Cron
- GitHub Actions
- Cron-job.org

### Step 7: Test Push Notifications

#### Test Device Token Registration

```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

// This happens automatically on login via usePushNotifications hook
// But you can test manually:
await pushNotificationService.registerDeviceToken(
  userId,
  'test-token-123',
  'ios'
);
```

#### Test Sending a Notification

```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'SYSTEM_WARNING',
  'Test Notification',
  'This is a test push notification.',
  { test: true }
);
```

#### Check Notification Logs

```typescript
const logs = await pushNotificationService.getPushNotificationLogs(userId);
console.log('Notification logs:', logs);
```

## 📱 Platform-Specific Setup

### iOS

1. **Apple Developer Account Required**
   - You need an Apple Developer account ($99/year)
   - Create an App ID
   - Enable Push Notifications capability
   - Create APNs certificates

2. **Configure in Firebase**
   - Go to Project Settings > Cloud Messaging
   - Upload your APNs certificate or key

3. **Build with EAS**
   ```bash
   eas build --platform ios
   ```

### Android

1. **No special requirements** - FCM works out of the box

2. **Build with EAS**
   ```bash
   eas build --platform android
   ```

### Web

Web push notifications are not yet implemented. The system will skip web tokens gracefully.

## 🧪 Testing

### Test in Development

1. **Start Expo Dev Server**
   ```bash
   npm run dev
   ```

2. **Login to the app** - Push token will be registered automatically

3. **Trigger a notification** - Use any of the integrated flows:
   - AI moderation (send a message with offensive content)
   - Submit an appeal
   - Admin applies a penalty

4. **Check logs**
   ```typescript
   const logs = await pushNotificationService.getPushNotificationLogs(userId);
   ```

### Test Edge Functions Directly

```bash
# Test send-push-notification
curl -X POST \
  https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "tokens": [{"token": "test-token", "platform": "android"}],
    "notification": {
      "title": "Test",
      "body": "This is a test"
    }
  }'

# Test check-ban-expirations
curl -X POST \
  https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/check-ban-expirations \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 🔍 Monitoring

### View Push Notification Logs

```sql
-- All push notifications
SELECT * FROM push_notifications_log
ORDER BY sent_at DESC
LIMIT 100;

-- Failed deliveries
SELECT * FROM push_notifications_log
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC;

-- By notification type
SELECT type, COUNT(*) as count
FROM push_notifications_log
GROUP BY type
ORDER BY count DESC;
```

### View Device Tokens

```sql
-- Active tokens
SELECT * FROM push_device_tokens
WHERE is_active = true;

-- Tokens by platform
SELECT platform, COUNT(*) as count
FROM push_device_tokens
WHERE is_active = true
GROUP BY platform;
```

## 🐛 Troubleshooting

### Issue: No notifications received

**Check:**
1. Device token is registered
   ```typescript
   const tokens = await pushNotificationService.getActiveDeviceTokens(userId);
   console.log('Tokens:', tokens);
   ```

2. Notification was logged
   ```typescript
   const logs = await pushNotificationService.getPushNotificationLogs(userId);
   console.log('Logs:', logs);
   ```

3. FCM_SERVER_KEY is set correctly
   ```bash
   supabase secrets list
   ```

4. Edge function logs
   ```bash
   supabase functions logs send-push-notification
   ```

### Issue: Invalid token errors

**Solution:**
- Tokens are automatically deactivated when FCM returns invalid/not registered errors
- User needs to re-login to register a new token

### Issue: Delivery status always 'pending'

**Check:**
1. Edge function is deployed
   ```bash
   supabase functions list
   ```

2. FCM_SERVER_KEY environment variable is set
   ```bash
   supabase secrets list
   ```

3. Edge function logs for errors
   ```bash
   supabase functions logs send-push-notification --tail
   ```

### Issue: Notifications work on Android but not iOS

**Check:**
1. APNs certificates are configured in Firebase
2. App is built with proper provisioning profile
3. Push Notifications capability is enabled in Xcode

## 📊 Analytics

### Get Notification Statistics

```typescript
// Get all logs
const allLogs = await pushNotificationService.getAllPushNotificationLogs({
  limit: 1000
});

// Calculate success rate
const sent = allLogs.filter(log => log.delivery_status === 'sent').length;
const failed = allLogs.filter(log => log.delivery_status === 'failed').length;
const successRate = (sent / (sent + failed)) * 100;

console.log(`Success rate: ${successRate.toFixed(2)}%`);
```

### Get Notifications by Type

```typescript
const moderationWarnings = await pushNotificationService.getAllPushNotificationLogs({
  type: 'MODERATION_WARNING',
  limit: 100
});

console.log(`Moderation warnings sent: ${moderationWarnings.length}`);
```

## 🔐 Security

### RLS Policies

The following RLS policies are in place:

**push_device_tokens:**
- Users can only view/insert/update/delete their own tokens

**push_notifications_log:**
- Users can only view their own notification logs
- Admins can view all notification logs

### Best Practices

1. **Never expose FCM_SERVER_KEY** - Keep it in Supabase secrets only
2. **Validate user permissions** - Check user role before sending admin notifications
3. **Rate limiting** - Implement rate limiting to prevent notification spam
4. **Token rotation** - Tokens are automatically updated on each login

## 🚀 Production Checklist

- [ ] FCM_SERVER_KEY is set in Supabase secrets
- [ ] Expo project ID is configured in usePushNotifications.ts
- [ ] Edge functions are deployed
- [ ] Cron job is set up for ban expiration checks
- [ ] APNs certificates are configured (iOS)
- [ ] Notification icons and sounds are added
- [ ] Deep linking is tested
- [ ] RLS policies are verified
- [ ] Monitoring is set up

## 📚 Additional Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Push Notification Best Practices](https://developer.apple.com/design/human-interface-guidelines/notifications)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review edge function logs: `supabase functions logs send-push-notification`
3. Check database logs for errors
4. Verify all environment variables are set correctly
