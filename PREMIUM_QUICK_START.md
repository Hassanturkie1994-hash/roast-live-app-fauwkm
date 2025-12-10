
# Premium Subscription & CDN - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
# Cloudflare CDN
EXPO_PUBLIC_CDN_DOMAIN=cdn.roastlive.com

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

### 2. Test Premium Subscription

```typescript
// In your app
import { premiumSubscriptionService } from '@/app/services/premiumSubscriptionService';

// Check if user is premium
const isPremium = await premiumSubscriptionService.isPremiumMember(userId);

// Get subscription details
const subscription = await premiumSubscriptionService.getPremiumSubscription(userId);
```

### 3. Use Premium Badge

```tsx
import PremiumBadge from '@/components/PremiumBadge';

// In your component
<PremiumBadge userId={userId} size="medium" />
```

### 4. Use CDN Service

```typescript
import { cdnService } from '@/app/services/cdnService';

// Upload image
const result = await cdnService.uploadProfileImage(userId, imageFile);

// Get optimized URL
const optimizedUrl = cdnService.getOptimizedImageUrl(originalUrl, 'profile');

// Convert to CDN URL
const cdnUrl = cdnService.convertToCDNUrl(supabaseUrl);
```

## 📱 User Flow

### Activating Premium

1. User opens Settings
2. Taps "PREMIUM Membership"
3. Views benefits and pricing
4. Taps "Activate Premium – 89 SEK/mo"
5. Chooses Stripe or PayPal
6. Completes payment
7. Receives welcome notification
8. Premium badge appears everywhere

### Canceling Premium

1. User opens Settings → PREMIUM Membership
2. Taps "Cancel Subscription"
3. Confirms cancellation
4. Premium remains active until period ends
5. Receives cancellation notification
6. Badge disappears after expiration

## 🎨 Premium Badge Sizes

```tsx
// Small - for chat, lists
<PremiumBadge userId={userId} size="small" />

// Medium - for profiles, cards
<PremiumBadge userId={userId} size="medium" />

// Large - for headers, featured content
<PremiumBadge userId={userId} size="large" />
```

## 🖼️ CDN Image Optimization

```typescript
// Profile images (200x200, 90% quality, WebP)
cdnService.getOptimizedImageUrl(url, 'profile');

// Story thumbnails (512px width, 85% quality, WebP)
cdnService.getOptimizedImageUrl(url, 'story');

// Feed images (640px width, 85% quality, WebP)
cdnService.getOptimizedImageUrl(url, 'feed');

// Thumbnails (320px width, 80% quality, WebP)
cdnService.getOptimizedImageUrl(url, 'thumbnail');

// Explore grid (400x400, 85% quality, WebP, cover)
cdnService.getOptimizedImageUrl(url, 'explore');
```

## 🔐 Signed URLs for Private Content

```typescript
const signedUrl = await cdnService.generateSignedUrl(url, {
  expiresIn: 21600, // 6 hours
  sessionId: deviceSessionId,
  watermark: 'RoastLive Premium',
});
```

## 💰 Premium Benefits

| Benefit | Description | Status |
|---------|-------------|--------|
| Priority Placement | Higher in Explore rankings | ✅ Ready |
| Premium Badge | Gold badge everywhere | ✅ Active |
| Ad-Free | No banner ads | ✅ Ready |
| Double Reach | Featured in feeds | ✅ Ready |
| Filter Pack | Exclusive camera filters | ⏳ Coming |
| Customization | Theme, avatar, link-in-bio | ⏳ Coming |
| Discounts | 20% off VIP clubs | ✅ Ready |
| Reduced Fee | 22% vs 30% on gifts | ✅ Ready |

## 🔔 Notification Messages

### On Upgrade
```
"Welcome to PREMIUM! Enjoy exclusive benefits and enhanced features."
```

### On Renewal
```
"Your PREMIUM subscription has been renewed for another month!"
```

### On Cancellation
```
"Your PREMIUM subscription has been canceled. You'll retain access until [date]."
```

### On Expiration
```
"Your PREMIUM subscription has expired. Resubscribe to continue enjoying exclusive benefits!"
```

## 🛠️ Common Tasks

### Check Premium Status

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('premium_active, premium_since, premium_expiring')
  .eq('id', userId)
  .single();

if (profile?.premium_active) {
  console.log('User is premium!');
}
```

### Upload with CDN

```typescript
// Upload profile image
const result = await cdnService.uploadProfileImage(userId, imageFile);
if (result.success) {
  console.log('CDN URL:', result.cdnUrl);
  console.log('Supabase URL:', result.supabaseUrl);
}

// Upload story
const storyResult = await cdnService.uploadStoryMedia(userId, mediaFile, false);

// Upload post
const postResult = await cdnService.uploadPostMedia(userId, imageFile);
```

### Custom Image Transformations

```typescript
const transformedUrl = cdnService.getCDNUrl(originalUrl, {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp',
  fit: 'cover',
});
```

## 🐛 Troubleshooting

### Premium Badge Not Showing

1. Check if user has `premium_active: true` in database
2. Verify `PremiumBadge` component is imported
3. Check console for errors
4. Ensure `userId` prop is correct

### CDN URLs Not Working

1. Verify CDN domain is configured
2. Check CORS settings in Cloudflare
3. Test fallback to Supabase URL
4. Check network tab for errors

### Payment Not Processing

1. Verify Stripe/PayPal keys are correct
2. Check webhook endpoint is configured
3. Test in Stripe/PayPal dashboard
4. Check Edge Function logs

## 📊 Monitoring

### Check Active Subscriptions

```sql
SELECT COUNT(*) 
FROM premium_subscriptions 
WHERE status = 'active';
```

### Check Premium Users

```sql
SELECT COUNT(*) 
FROM profiles 
WHERE premium_active = true;
```

### Check Expiring Soon

```sql
SELECT * 
FROM premium_subscriptions 
WHERE status = 'active' 
AND renewed_at < NOW() + INTERVAL '7 days';
```

## 🔄 Cron Jobs

Set up daily cron job:

```typescript
// Run once per day
await premiumSubscriptionService.deactivateExpiredSubscriptions();
```

## 📞 Support

### For Users
- Settings → PREMIUM Membership → Support & Billing Chat

### For Developers
- Check `PREMIUM_CDN_IMPLEMENTATION.md` for detailed docs
- Review service files for implementation details
- Check Edge Function logs for payment issues

## ✅ Checklist

Before going live:

- [ ] Configure Cloudflare CDN domain
- [ ] Set up Stripe product and pricing
- [ ] Configure webhook endpoints
- [ ] Test payment flows (Stripe & PayPal)
- [ ] Test premium badge rendering
- [ ] Test CDN image uploads
- [ ] Test subscription cancellation
- [ ] Set up cron job for expiration
- [ ] Configure monitoring alerts
- [ ] Test notification system

## 🎯 Key Points

1. **No Live Streaming Changes** - All streaming logic untouched
2. **CDN for Static Only** - Only static assets use CDN
3. **Badge Everywhere** - Premium badge in all major UI
4. **Graceful Degradation** - Works without CDN
5. **User-Friendly Cancellation** - Premium stays active until period ends

---

**Need Help?** Check `PREMIUM_CDN_IMPLEMENTATION.md` for complete documentation.
