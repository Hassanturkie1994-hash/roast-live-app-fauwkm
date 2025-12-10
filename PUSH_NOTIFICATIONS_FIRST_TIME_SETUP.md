
# 🚀 Push Notifications - First Time Setup

## ⏱️ Total Time: ~20 minutes

Follow these steps in order to get push notifications working.

---

## Step 1: Firebase Setup (5 minutes)

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "RoastLive" (or your app name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Cloud Messaging

1. In your Firebase project, go to **Project Settings** (gear icon)
2. Click on **Cloud Messaging** tab
3. You should see your **Server Key** (under Cloud Messaging API (Legacy))
4. Copy the **Server Key** - you'll need it in the next step

### 1.3 Set FCM Server Key in Supabase

**Option A: Using Supabase CLI**
```bash
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here
```

**Option B: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/uaqsjqakhgycfopftzzp
2. Click on **Edge Functions** in the left sidebar
3. Click on **Secrets** tab
4. Click **Add Secret**
5. Name: `FCM_SERVER_KEY`
6. Value: Your FCM Server Key from Firebase
7. Click **Save**

✅ **Checkpoint:** FCM_SERVER_KEY is now set in Supabase

---

## Step 2: Expo Configuration (2 minutes)

### 2.1 Get Your Expo Project ID

1. Go to https://expo.dev/
2. Sign in with your Expo account
3. Find your project
4. Copy the **Project ID** (looks like: `abc123-def456-ghi789`)

### 2.2 Update usePushNotifications Hook

Open `hooks/usePushNotifications.ts` and find this line:

```typescript
projectId: 'your-expo-project-id', // Replace with your Expo project ID
```

Replace with your actual project ID:

```typescript
projectId: 'abc123-def456-ghi789', // Your actual Expo project ID
```

✅ **Checkpoint:** Expo project ID is configured

---

## Step 3: Test Push Notifications (5 minutes)

### 3.1 Login to Your App

1. Start your app: `npm run dev`
2. Login with your account
3. Check console for: `✅ Push notification token registered successfully`

### 3.2 Send a Test Notification

Add this code temporarily to any screen (e.g., Profile screen):

```typescript
import { pushNotificationTestService } from '@/app/services/pushNotificationTestService';
import { useAuth } from '@/contexts/AuthContext';

// In your component
const { user } = useAuth();

// Add a test button
<TouchableOpacity
  onPress={async () => {
    if (user) {
      await pushNotificationTestService.testModerationWarning(user.id);
      Alert.alert('Success', 'Test notification sent! Check your device.');
    }
  }}
>
  <Text>Send Test Notification</Text>
</TouchableOpacity>
```

### 3.3 Verify It Worked

Check your device - you should see a notification!

Also check the logs:
```typescript
await pushNotificationTestService.printNotificationStats(user.id);
```

✅ **Checkpoint:** Test notification received on device

---

## Step 4: Set Up Automatic Ban Expiration (5 minutes)

### 4.1 Enable pg_cron Extension

Run this in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 4.2 Create Cron Job

Run this in Supabase SQL Editor:

```sql
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

**Important:** Replace `YOUR_SERVICE_ROLE_KEY` with your actual Supabase service role key.

You can find your service role key at:
- Supabase Dashboard → Project Settings → API → service_role key

### 4.3 Verify Cron Job

```sql
-- Check if cron job is scheduled
SELECT * FROM cron.job;
```

You should see `check-ban-expirations` in the list.

✅ **Checkpoint:** Cron job is running every 5 minutes

---

## Step 5: iOS Setup (Optional - 15 minutes)

**Only if you're targeting iOS devices**

### 5.1 Apple Developer Account

1. You need an Apple Developer account ($99/year)
2. Sign up at https://developer.apple.com/

### 5.2 Create App ID

1. Go to https://developer.apple.com/account/
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → Continue
5. Enter description and Bundle ID
6. Enable **Push Notifications** capability
7. Click **Continue** → **Register**

### 5.3 Generate APNs Key

1. Go to **Keys** → **+** button
2. Enter key name: "RoastLive Push Notifications"
3. Enable **Apple Push Notifications service (APNs)**
4. Click **Continue** → **Register**
5. Download the `.p8` key file
6. Note the **Key ID** and **Team ID**

### 5.4 Upload to Firebase

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under **Apple app configuration**, click **Upload**
3. Upload your `.p8` key file
4. Enter your **Key ID** and **Team ID**
5. Click **Upload**

✅ **Checkpoint:** iOS push notifications configured

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] FCM_SERVER_KEY is set in Supabase secrets
- [ ] Expo project ID is configured in usePushNotifications.ts
- [ ] Test notification received on device
- [ ] Device token appears in database
- [ ] Notification logged in push_notifications_log
- [ ] In-app notification created
- [ ] Cron job is scheduled
- [ ] Edge functions are deployed
- [ ] (iOS only) APNs configured in Firebase

## 🧪 Final Test

Run this complete test:

```typescript
import { pushNotificationTestService } from '@/app/services/pushNotificationTestService';
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();

if (user) {
  // 1. Verify token is registered
  await pushNotificationTestService.printTokenInfo(user.id);
  
  // 2. Send all test notifications
  await pushNotificationTestService.sendAllTestNotifications(user.id);
  
  // 3. Check statistics
  await pushNotificationTestService.printNotificationStats(user.id);
}
```

Expected output:
```
📱 Device Token Information
===========================
Registered: Yes
Token Count: 1
Platforms: ios

📲 Sending 10 test notifications...
✅ All test notifications sent

📊 Push Notification Statistics
================================
Total: 10
Sent: 10
Failed: 0
Pending: 0
Success Rate: 100.00%

By Type:
  MODERATION_WARNING: 1
  TIMEOUT_APPLIED: 1
  BAN_APPLIED: 1
  BAN_EXPIRED: 1
  APPEAL_RECEIVED: 1
  APPEAL_APPROVED: 1
  APPEAL_DENIED: 1
  ADMIN_ANNOUNCEMENT: 1
  SAFETY_REMINDER: 1
  SYSTEM_WARNING: 1
```

## 🎉 You're Done!

If all tests pass, your push notification system is fully operational!

## 🔄 What Happens Now?

### Automatic Behaviors

1. **On User Login:**
   - Device token registered automatically
   - Old tokens marked inactive
   - Ready to receive notifications

2. **When AI Moderates:**
   - Violation detected
   - Push notification sent
   - In-app notification created
   - Logged in database

3. **When User Appeals:**
   - Appeal submitted
   - Push notification sent
   - In-app notification created
   - Admin notified

4. **When Ban Expires:**
   - Cron job checks every 5 minutes
   - Expired bans detected
   - Push notifications sent
   - In-app notifications created

## 📱 User Experience

### What Users See

**When moderated:**
- 📲 Push notification on device
- 📬 Notification in app inbox
- Can tap to view details

**When timed out:**
- 📲 Push notification with duration
- 📬 Notification in app inbox
- Cannot chat until timeout ends

**When banned:**
- 📲 Push notification with reason
- 📬 Notification in app inbox
- Can appeal via Appeals Center

**When appeal reviewed:**
- 📲 Push notification with decision
- 📬 Notification in app inbox
- Tap to view details (deep link)

**When ban expires:**
- 📲 Push notification automatically
- 📬 Notification in app inbox
- Can interact again

## 🔍 Monitoring

### Check Notification Logs

**Via Admin Screen:**
- Navigate to Admin Dashboard
- Click "Push Notifications"
- View all notifications, filter by status

**Via Code:**
```typescript
const logs = await pushNotificationService.getAllPushNotificationLogs({
  deliveryStatus: 'failed',
  limit: 50
});
console.log('Failed deliveries:', logs);
```

**Via SQL:**
```sql
SELECT * FROM push_notifications_log
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC
LIMIT 50;
```

## 🆘 Need Help?

### Common Issues

**"FCM_SERVER_KEY not configured"**
- Solution: Set FCM_SERVER_KEY in Supabase secrets (Step 1.3)

**"No push tokens found"**
- Solution: User needs to login to register token

**"Delivery status always pending"**
- Solution: Check edge function is deployed and FCM_SERVER_KEY is set

**"Notifications work on Android but not iOS"**
- Solution: Configure APNs in Firebase (Step 5)

### Get Support

1. Check [PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md](./PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md)
2. Review edge function logs
3. Check database logs
4. Verify environment variables

## 🎊 Success!

You now have a complete push notification system that:

✅ Automatically registers device tokens
✅ Sends notifications for all moderation actions
✅ Handles appeals flow
✅ Automatically notifies on ban expiration
✅ Logs everything for monitoring
✅ Supports deep linking
✅ Scales automatically
✅ Never touches livestream logic

## 🚀 Next Steps

1. **Test in production** - Build and test on real devices
2. **Monitor metrics** - Track delivery rates and engagement
3. **Gather feedback** - Ask users about notification experience
4. **Optimize content** - Improve notification titles and bodies
5. **Add features** - Consider rich notifications, actions, etc.

---

**Setup Status:** ⚠️ Requires manual configuration

**Time to Complete:** ~20 minutes

**Difficulty:** Easy

**Support:** Full documentation available
