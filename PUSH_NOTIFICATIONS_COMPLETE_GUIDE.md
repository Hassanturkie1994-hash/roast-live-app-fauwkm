
# Push Notifications - Complete Implementation Guide

## 🎯 What Was Built

A complete push notification system for Roast Live that:

- ✅ Stores device tokens for iOS, Android, and Web
- ✅ Sends push notifications via Firebase Cloud Messaging (FCM)
- ✅ Logs all notifications with delivery status
- ✅ Creates in-app notifications for every push notification
- ✅ Integrates with AI moderation system
- ✅ Integrates with moderator actions
- ✅ Integrates with appeals flow
- ✅ Automatically notifies users when bans expire
- ✅ Supports deep linking to specific screens
- ✅ Handles token lifecycle automatically
- ✅ **Does NOT modify any livestream logic**

## 📋 Implementation Checklist

### ✅ Completed (Automatic)

- [x] Database tables created (`push_device_tokens`, `push_notifications_log`)
- [x] RLS policies configured
- [x] Services updated (AI moderation, appeals, escalation)
- [x] Edge functions deployed (`send-push-notification`, `check-ban-expirations`)
- [x] Client hook created (`usePushNotifications`)
- [x] AuthContext integration
- [x] expo-notifications installed
- [x] Documentation created

### ⚙️ Manual Setup Required

- [ ] **Firebase Setup** (5 minutes)
  - Create Firebase project
  - Enable Cloud Messaging
  - Get FCM Server Key
  - Set in Supabase secrets

- [ ] **Expo Configuration** (2 minutes)
  - Get Expo project ID
  - Update `hooks/usePushNotifications.ts`

- [ ] **Cron Job Setup** (5 minutes)
  - Set up ban expiration checks
  - Run every 5 minutes

- [ ] **iOS Setup** (if targeting iOS)
  - Apple Developer account
  - APNs certificates
  - Upload to Firebase

- [ ] **Testing** (10 minutes)
  - Test notification sending
  - Verify deep linking
  - Check delivery rates

## 🚀 Quick Start (5 Steps)

### Step 1: Firebase Setup (5 min)

1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Go to Project Settings → Cloud Messaging
4. Copy your **Server Key**
5. Set in Supabase:
   ```bash
   supabase secrets set FCM_SERVER_KEY=your_key_here
   ```

### Step 2: Expo Project ID (2 min)

1. Go to https://expo.dev/
2. Find your project ID
3. Update `hooks/usePushNotifications.ts`:
   ```typescript
   projectId: 'your-actual-expo-project-id'
   ```

### Step 3: Test Notifications (2 min)

```typescript
import { pushNotificationTestService } from '@/app/services/pushNotificationTestService';

// Send a test notification
await pushNotificationTestService.testModerationWarning(userId);

// Check if it worked
await pushNotificationTestService.printNotificationStats(userId);
```

### Step 4: Set Up Cron Job (5 min)

Run this SQL in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'check-ban-expirations',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/check-ban-expirations',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

### Step 5: Verify Everything Works (5 min)

1. Login to the app → Token should register automatically
2. Trigger a test notification
3. Check notification logs
4. Verify in-app notification created
5. Test deep linking

## 📱 How It Works

### User Login Flow
```
User logs in
  ↓
usePushNotifications hook activates
  ↓
Request notification permissions
  ↓
Get device push token
  ↓
Register token with backend
  ↓
Mark old tokens as inactive
  ↓
✅ Ready to receive notifications
```

### Notification Sending Flow
```
Event occurs (AI moderation, appeal, etc.)
  ↓
Service calls sendPushNotification()
  ↓
Get user's active device tokens
  ↓
Log notification in push_notifications_log
  ↓
Create in-app notification
  ↓
Call send-push-notification edge function
  ↓
Edge function sends to FCM
  ↓
FCM delivers to device
  ↓
Update delivery status
  ↓
✅ User receives notification
```

### Ban Expiration Flow
```
Cron job triggers every 5 minutes
  ↓
check-ban-expirations edge function runs
  ↓
Query expired penalties and strikes
  ↓
Deactivate expired bans
  ↓
Send BAN_EXPIRED notifications
  ↓
Create in-app notifications
  ↓
Log in push_notifications_log
  ↓
✅ Users notified automatically
```

## 🎨 Notification Examples

### AI Moderation
```typescript
// When AI hides a message (score ≥ 0.50)
Title: "Your message was moderated"
Body: "One of your messages was hidden for breaking the rules."
Type: MODERATION_WARNING
Payload: { stream_id: "abc123" }
```

### Moderator Timeout
```typescript
// When moderator times out a user
Title: "You've been timed out"
Body: "You cannot participate in chat for 10 minutes due to rule violations."
Type: TIMEOUT_APPLIED
Payload: { stream_id: "abc123", duration_minutes: 10 }
```

### Appeal Approved
```typescript
// When admin approves an appeal
Title: "Your appeal was approved"
Body: "A penalty on your account has been removed. Check details in your Notifications."
Type: APPEAL_APPROVED
Payload: { route: "AppealDetails", appealId: "xyz789" }
```

### Ban Expired
```typescript
// When a ban expires (automatic)
Title: "Your restriction has ended"
Body: "You can now interact again. Please follow the community rules."
Type: BAN_EXPIRED
Payload: { penalty_id: "def456" }
```

## 🔍 Testing & Debugging

### Test Notification Sending

```typescript
import { pushNotificationTestService } from '@/app/services/pushNotificationTestService';

// Send all test notifications
await pushNotificationTestService.sendAllTestNotifications(userId);

// Send specific test
await pushNotificationTestService.testModerationWarning(userId);
await pushNotificationTestService.testTimeoutNotification(userId, 10);
await pushNotificationTestService.testBanNotification(userId);
await pushNotificationTestService.testAppealApprovedNotification(userId);
```

### Check Statistics

```typescript
// Print notification stats
await pushNotificationTestService.printNotificationStats(userId);

// Output:
// 📊 Push Notification Statistics
// ================================
// Total: 25
// Sent: 23
// Failed: 2
// Pending: 0
// Success Rate: 92.00%
// 
// By Type:
//   MODERATION_WARNING: 10
//   TIMEOUT_APPLIED: 5
//   APPEAL_RECEIVED: 5
//   ...
```

### Verify Token Registration

```typescript
// Print token info
await pushNotificationTestService.printTokenInfo(userId);

// Output:
// 📱 Device Token Information
// ===========================
// Registered: Yes
// Token Count: 2
// Platforms: ios, android
```

### Check Edge Function Logs

```bash
# View send-push-notification logs
supabase functions logs send-push-notification --tail

# View check-ban-expirations logs
supabase functions logs check-ban-expirations --tail
```

### Query Database Logs

```sql
-- Recent notifications
SELECT * FROM push_notifications_log
WHERE user_id = 'your-user-id'
ORDER BY sent_at DESC
LIMIT 20;

-- Failed deliveries
SELECT * FROM push_notifications_log
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC;

-- Active device tokens
SELECT * FROM push_device_tokens
WHERE user_id = 'your-user-id'
AND is_active = true;
```

## 🎯 Integration Examples

### Example 1: AI Moderation

```typescript
// In aiModerationService.ts
const result = await aiModerationService.moderateMessage(
  userId,
  'This is a test message',
  streamId
);

// If message is hidden (score ≥ 0.50):
// → Push notification sent automatically
// → In-app notification created
// → Logged in push_notifications_log
```

### Example 2: Moderator Timeout

```typescript
// In escalationService.ts
await escalationService.moderatorTimeout(
  reviewId,
  moderatorId,
  'ModeratorName',
  10, // minutes
  'Repeated spam'
);

// → Timeout applied
// → Push notification sent automatically
// → In-app notification created
// → Logged in push_notifications_log
```

### Example 3: User Submits Appeal

```typescript
// In appealsService.ts
await appealsService.submitAppeal(
  userId,
  penaltyId,
  'I believe this was a mistake because...',
  screenshotUrl
);

// → Appeal recorded
// → Push notification sent automatically
// → In-app notification created
// → Logged in push_notifications_log
```

### Example 4: Admin Reviews Appeal

```typescript
// Admin approves
await appealsService.acceptAppeal(
  appealId,
  adminId,
  'After review, we found the penalty was applied in error.'
);

// → Penalty deactivated
// → Push notification sent with deep link
// → In-app notification created
// → User can tap to view details
```

## 🔔 Notification Behavior

### When User Receives Notification

**App in Foreground:**
- Notification appears as banner
- Can be tapped to navigate
- Also appears in in-app inbox

**App in Background:**
- Notification appears in system tray
- Badge count updated
- Tapping opens app and navigates

**App Closed:**
- Notification appears in system tray
- Tapping launches app and navigates
- Notification saved in inbox

### Deep Linking

Notifications with `route` in payload automatically navigate:

```typescript
// Notification payload
{
  route: 'AppealDetails',
  appealId: 'abc-123'
}

// Handled by usePushNotifications hook
// → Navigates to AppealDetails screen with appealId parameter
```

## 📊 Monitoring Dashboard (Future)

Planned admin dashboard features:

- Total notifications sent (by type)
- Delivery success rate
- Failed delivery reasons
- Active device tokens (by platform)
- Notification volume over time
- User engagement metrics

## 🔒 Security & Privacy

### Data Protection
- Device tokens encrypted in transit
- RLS policies protect user data
- Service role key never exposed
- Payload data validated

### User Control
- Users can disable notifications (future)
- Users can view their notification history
- Users can deactivate specific devices
- Admins have separate monitoring view

## 🚨 Important Notes

### What Was NOT Modified

✅ **Zero changes to:**
- Livestream API endpoints
- Cloudflare integration
- Start/stop live logic
- WebRTC publishing
- RTMPS ingestion
- Stream tokens
- Playback URLs

### What WAS Added

✅ **New functionality:**
- Push notification infrastructure
- Device token management
- Notification logging
- AI moderation notifications
- Moderator action notifications
- Appeals flow notifications
- Ban expiration automation
- Edge functions for delivery
- Client-side registration

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` | Technical implementation details |
| `PUSH_NOTIFICATIONS_QUICK_REFERENCE.md` | Quick reference for developers |
| `PUSH_NOTIFICATIONS_SETUP_GUIDE.md` | Step-by-step setup instructions |
| `PUSH_NOTIFICATIONS_INTEGRATION_CHECKLIST.md` | Integration checklist |
| `PUSH_NOTIFICATIONS_FINAL_SUMMARY.md` | Final summary |
| `PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md` | This file - complete guide |

## 🎓 Learning Resources

### Expo Notifications
- [Official Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)

### Firebase Cloud Messaging
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/http-server-ref)

### Supabase Edge Functions
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Invoking Functions](https://supabase.com/docs/guides/functions/invoke)

## 🆘 Troubleshooting

### Problem: No notifications received

**Solution:**
1. Check device token is registered:
   ```typescript
   await pushNotificationTestService.printTokenInfo(userId);
   ```

2. Check notification was logged:
   ```typescript
   const logs = await pushNotificationService.getPushNotificationLogs(userId);
   console.log('Last notification:', logs[0]);
   ```

3. Verify FCM_SERVER_KEY is set:
   ```bash
   supabase secrets list
   ```

4. Check edge function logs:
   ```bash
   supabase functions logs send-push-notification
   ```

### Problem: Notifications work on Android but not iOS

**Solution:**
1. Verify APNs certificates in Firebase
2. Check app is built with proper provisioning
3. Ensure Push Notifications capability is enabled
4. Test with a production build (not Expo Go)

### Problem: Delivery status always 'pending'

**Solution:**
1. Check edge function is deployed:
   ```bash
   supabase functions list
   ```

2. Verify FCM_SERVER_KEY is set correctly

3. Check edge function logs for errors:
   ```bash
   supabase functions logs send-push-notification --tail
   ```

### Problem: Invalid token errors

**Solution:**
- Tokens are automatically deactivated when invalid
- User needs to re-login to register new token
- This is normal behavior when app is uninstalled/reinstalled

## 🎉 Success Criteria

Your push notification system is working when:

1. ✅ Users receive notifications on their devices
2. ✅ Notifications appear in in-app inbox
3. ✅ Deep links navigate to correct screens
4. ✅ Expired bans trigger automatic notifications
5. ✅ Invalid tokens are auto-deactivated
6. ✅ Delivery status is tracked
7. ✅ No livestream logic is affected

## 🔄 Maintenance

### Regular Tasks

**Daily:**
- Monitor failed deliveries
- Check edge function logs
- Review notification volume

**Weekly:**
- Review delivery success rate
- Check for invalid token patterns
- Analyze notification engagement

**Monthly:**
- Review notification types usage
- Optimize notification content
- Update documentation

### Database Cleanup

```sql
-- Clean up old notification logs (older than 90 days)
DELETE FROM push_notifications_log
WHERE sent_at < NOW() - INTERVAL '90 days';

-- Clean up inactive tokens (older than 30 days)
DELETE FROM push_device_tokens
WHERE is_active = false
AND last_used_at < NOW() - INTERVAL '30 days';
```

## 📈 Scaling Considerations

### Current Capacity
- Edge functions auto-scale
- Database indexed for performance
- Efficient token lookup
- Batch processing support

### Future Scaling
- Consider notification queuing for high volume
- Implement rate limiting per user
- Add notification batching
- Consider dedicated notification service

## 🎨 Customization Guide

### Add New Notification Type

1. **Update database constraint:**
   ```sql
   ALTER TABLE push_notifications_log
   DROP CONSTRAINT push_notifications_log_type_check;
   
   ALTER TABLE push_notifications_log
   ADD CONSTRAINT push_notifications_log_type_check
   CHECK (type IN (...existing types..., 'NEW_TYPE'));
   ```

2. **Update TypeScript type:**
   ```typescript
   // In pushNotificationService.ts
   export type PushNotificationType =
     | ...existing types...
     | 'NEW_TYPE';
   ```

3. **Send notification:**
   ```typescript
   await pushNotificationService.sendPushNotification(
     userId,
     'NEW_TYPE',
     'Title',
     'Body',
     { custom: 'data' }
   );
   ```

### Customize Notification Content

```typescript
// In your service
await pushNotificationService.sendPushNotification(
  userId,
  'MODERATION_WARNING',
  'Custom Title',
  'Custom body with dynamic content: ${variable}',
  { 
    custom_field: 'value',
    deep_link_route: 'CustomScreen'
  }
);
```

## 🏁 Final Checklist

Before going to production:

- [ ] Firebase FCM configured
- [ ] Expo project ID set
- [ ] Cron job running
- [ ] iOS APNs configured (if targeting iOS)
- [ ] Notification icons added
- [ ] All notification types tested
- [ ] Deep linking tested
- [ ] Delivery rates monitored
- [ ] RLS policies verified
- [ ] Edge functions deployed
- [ ] Documentation reviewed
- [ ] Team trained on system

## 🎊 Congratulations!

You now have a complete, production-ready push notification system that:

- ✅ Automatically registers device tokens
- ✅ Sends notifications for all moderation actions
- ✅ Handles appeals flow notifications
- ✅ Automatically notifies on ban expiration
- ✅ Logs everything for monitoring
- ✅ Supports deep linking
- ✅ Scales automatically
- ✅ Protects user privacy
- ✅ **Never touches livestream logic**

## 📞 Need Help?

1. Check the troubleshooting section
2. Review the documentation files
3. Check edge function logs
4. Verify environment variables
5. Test with the test service

## 🚀 Next Steps

1. Complete manual setup (Firebase, Expo, Cron)
2. Test all notification types
3. Monitor delivery rates
4. Gather user feedback
5. Iterate and improve

---

**Implementation Status:** ✅ COMPLETE

**Prompts Completed:** 3/3

**Production Ready:** ⚠️ Requires manual setup (Firebase, Expo, Cron)

**Livestream Logic Modified:** ❌ NO (as required)
