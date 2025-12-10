
# Push Notifications Quick Start Guide

## 🚀 For Users

### Enable/Disable Notifications
1. Go to **Settings** (Profile tab → Settings icon)
2. Tap **Notifications**
3. Toggle individual notification types:
   - Creators I follow go LIVE
   - New Followers
   - Messages
   - Gift Received
   - Safety & Moderation Alerts
   - Admin Announcements

### Set Quiet Hours
1. Go to **Settings → Notifications**
2. Enable **Quiet Hours**
3. Set **Start Time** (e.g., 22:00)
4. Set **End Time** (e.g., 08:00)
5. Tap **Save Preferences**

**Note**: Critical safety notifications (bans, timeouts, appeals) will still be sent during quiet hours.

## 👨‍💼 For Admins

### Send Push Announcement
1. Go to **Head Admin Dashboard**
2. Tap **Send Push Announcement**
3. Enter **Title** and **Message**
4. Select **Target Audience**:
   - All Users
   - Creators Only
   - Premium Members
   - Recently Banned
   - Heavy Gifters
   - New Users
5. Review **Push Notification Preview**
6. Tap **Send Announcement**

### View Notification Logs
1. Go to **Admin Dashboard**
2. Tap **Push Notifications**
3. View delivery status and statistics

## 🔧 For Developers

### Send a Push Notification
```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

await pushNotificationService.sendPushNotification(
  userId,
  'STREAM_STARTED',
  'Creator is LIVE!',
  'Join the stream now!',
  {
    route: 'LiveStream',
    streamId: 'stream-123',
  }
);
```

### Register Device Token
```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

await pushNotificationService.registerDeviceToken(
  userId,
  deviceToken,
  'ios' // or 'android' or 'web'
);
```

### Check User Preferences
```typescript
const prefs = await pushNotificationService.getPreferences(userId);
if (prefs.notify_when_followed_goes_live) {
  // Send notification
}
```

### Update User Preferences
```typescript
await pushNotificationService.updatePreferences(userId, {
  notify_when_followed_goes_live: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
});
```

## 📊 Notification Types

### Social
- `STREAM_STARTED` - Followed creator goes live
- `NEW_FOLLOWER` - Someone follows you
- `FOLLOWERS_BATCH` - Multiple followers (3+)
- `new_message` - New direct message

### Gifts & Earnings
- `GIFT_RECEIVED` - High-value gift received (50 kr+)

### Safety & Moderation
- `MODERATION_WARNING` - Message hidden by AI
- `TIMEOUT_APPLIED` - Temporary timeout
- `BAN_APPLIED` - Banned from stream
- `BAN_EXPIRED` - Ban lifted
- `SAFETY_REMINDER` - Safety guidelines reminder

### Appeals
- `APPEAL_RECEIVED` - Appeal submitted
- `APPEAL_APPROVED` - Appeal approved
- `APPEAL_DENIED` - Appeal denied

### Admin
- `ADMIN_ANNOUNCEMENT` - Platform announcement
- `SYSTEM_WARNING` - System-wide alert

## 🎯 Rate Limiting

### Moderation Notifications
- **Limit**: 5 per 30 minutes
- **Behavior**: If exceeded, batched into one notification
- **Batched Title**: "Multiple account updates"
- **Batched Body**: "Several moderation events occurred. Check your Notifications."

### Other Notifications
- No rate limiting applied
- Respects quiet hours (except critical)

## 🌙 Quiet Hours

### Suppressed During Quiet Hours
- Live stream notifications
- Follower notifications
- Gift notifications
- Admin announcements

### Always Sent (Critical)
- BAN_APPLIED
- TIMEOUT_APPLIED
- APPEAL_APPROVED
- APPEAL_DENIED

## 📱 Deep Linking

### Supported Routes
- `LiveStream` - Opens live stream player
- `Profile` - Opens user profile
- `GiftActivity` - Opens gift details
- `Notifications` - Opens notifications inbox
- `AppealDetails` - Opens appeal details

### Example Payload
```typescript
{
  route: 'LiveStream',
  streamId: 'stream-123',
  sender_id: 'user-456',
}
```

## 🔐 Security

### RLS Policies
- Users can only view their own notification preferences
- Users can only view their own rate limits
- Admins can view all announcements
- Service role can manage all tables

### Privacy
- Device tokens are encrypted
- Notification content is not stored in device tokens
- Users can disable any notification type
- Users can delete their notification history

## 🐛 Troubleshooting

### Not Receiving Notifications
1. Check notification preferences (Settings → Notifications)
2. Verify device token is registered
3. Check if in quiet hours
4. Check rate limiting status
5. Verify app has notification permissions

### Notifications Delayed
1. Check network connection
2. Verify FCM/APNs configuration
3. Check edge function logs
4. Verify device token is active

### Wrong Notifications Received
1. Check notification preferences
2. Verify user segment (for admin announcements)
3. Check notification type mapping

## 📞 Support

For issues or questions:
1. Check logs in `push_notifications_log` table
2. Review edge function logs
3. Contact platform admin
4. Submit bug report with:
   - User ID
   - Notification type
   - Timestamp
   - Expected vs actual behavior

## 🎉 Best Practices

### For Users
- ✅ Enable notifications for important events
- ✅ Set quiet hours for better sleep
- ✅ Disable notifications you don't need
- ✅ Check in-app notifications regularly

### For Admins
- ✅ Use targeted announcements when possible
- ✅ Keep announcement messages concise (80 chars for push)
- ✅ Test announcements with small segments first
- ✅ Monitor delivery rates and user feedback

### For Developers
- ✅ Always check user preferences before sending
- ✅ Use appropriate notification types
- ✅ Include deep link payloads
- ✅ Log all notification attempts
- ✅ Handle errors gracefully
- ✅ Test on multiple platforms (iOS, Android, Web)
