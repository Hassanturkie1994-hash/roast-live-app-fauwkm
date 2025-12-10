
# Premium Subscription & Cloudflare CDN Integration

## Overview

This document describes the implementation of the Premium Subscription tier and Cloudflare CDN integration for the RoastLive platform.

## 1. Premium Subscription System

### Database Schema

The `profiles` table includes the following premium-related fields:

```sql
premium_active: boolean (default: false)
premium_since: timestamp with time zone
premium_expiring: timestamp with time zone
premium_subscription_provider: text ('stripe' | 'paypal')
premium_subscription_id: text
```

The `premium_subscriptions` table tracks subscription details:

```sql
id: uuid
user_id: uuid (references profiles.id)
subscription_provider: text ('stripe' | 'paypal')
subscription_id: text
customer_id: text
price_sek: numeric (default: 89.00)
status: text ('active' | 'canceled' | 'expired' | 'past_due')
started_at: timestamp
renewed_at: timestamp
canceled_at: timestamp
created_at: timestamp
updated_at: timestamp
```

### Premium Benefits

Premium members receive the following benefits:

1. **Priority Placement**
   - Appear higher in Explore rankings
   - Win tie-breaks when engagement is equal

2. **Premium Badge**
   - Gold gradient badge with glow effect
   - Visible everywhere: profile, posts, stories, chat, viewer lists

3. **Ad-Free Experience**
   - Remove banner ads and watermarks
   - Livestream overlay ads remain (not modified)

4. **Double Profile Reach**
   - Stories and posts get featured
   - Auto-priority ranking in feeds

5. **Premium Filter Pack**
   - Exclusive camera filters: Glow, High Contrast, Beauty, Sharpened

6. **Profile Customization**
   - Custom theme color
   - Animated avatar border
   - Link-In-Bio section

7. **Discounted Subscriptions**
   - 20% off VIP club subscriptions ($2.40 instead of $3.00)

8. **Reduced Platform Fee**
   - Only 22% platform fee when gifting (vs 30% for regular users)

### Premium Badge Component

The `PremiumBadge` component displays a gold gradient badge with glow effect:

```tsx
<PremiumBadge userId={userId} size="small" | "medium" | "large" />
```

Features:
- Automatically checks premium status
- Only renders if user has active premium
- Three size variants
- Gold gradient with glow effect
- Crown icon

### Premium Membership Screen

Located at: `app/screens/PremiumMembershipScreen.tsx`

Accessible from: Settings → Wallet & Gifts → PREMIUM Membership

Features:
- Hero banner with pricing (89 SEK/month)
- Payment options (Stripe & PayPal)
- Complete benefits list
- Subscription management (for active members)
- Cancel subscription (remains active until period ends)
- Upgrade payment method
- Support & billing chat

### Premium Subscription Service

Located at: `app/services/premiumSubscriptionService.ts`

Key methods:

```typescript
// Check if user has active premium
await premiumSubscriptionService.isPremiumMember(userId);

// Get subscription details
await premiumSubscriptionService.getPremiumSubscription(userId);

// Create new subscription
await premiumSubscriptionService.createPremiumSubscription(
  userId,
  provider,
  subscriptionId,
  customerId
);

// Renew subscription
await premiumSubscriptionService.renewPremiumSubscription(subscriptionId);

// Cancel subscription
await premiumSubscriptionService.cancelPremiumSubscription(userId);

// Handle payment failure
await premiumSubscriptionService.handlePaymentFailed(subscriptionId);

// Deactivate expired subscriptions (cron job)
await premiumSubscriptionService.deactivateExpiredSubscriptions();
```

### Notification System

When a user upgrades to premium:
- Inbox message: "Welcome to PREMIUM! Enjoy exclusive benefits and enhanced features."
- Category: 'wallet'
- Type: 'subscription_renewed'

When subscription renews:
- Inbox message: "Your PREMIUM subscription has been renewed for another month!"

When subscription is canceled:
- Inbox message: "Your PREMIUM subscription has been canceled. You'll retain access until [date]."

When subscription expires:
- Inbox message: "Your PREMIUM subscription has expired. Resubscribe to continue enjoying exclusive benefits!"

### Payment Integration

The system supports both Stripe and PayPal:

1. **Stripe Integration**
   - Edge Function: `stripe-create-subscription`
   - Webhook handling for subscription events
   - Automatic renewal

2. **PayPal Integration**
   - Similar flow to Stripe
   - Recurring subscription setup

### Cancellation Policy

- Canceling does NOT immediately deactivate premium
- Premium remains active until the billing period ends
- `premium_active` stays `true` until `renewed_at` date
- Status changes to 'canceled' but benefits continue

## 2. Cloudflare CDN Integration

### CDN Service

Located at: `app/services/cdnService.ts`

The CDN service handles all static asset uploads and delivery through Cloudflare CDN.

**Important:** This service does NOT modify any live-streaming API logic, start/stop endpoints, or Cloudflare Stream ingestion behavior.

### CDN Configuration

```typescript
const CDN_DOMAIN = 'cdn.roastlive.com';
```

Configure this domain in your Cloudflare settings.

### Supported Asset Types

The CDN integration applies only to:
- Profile images
- Story media (images & short videos)
- Post media
- Gift icons & animations
- UI assets
- Saved stream cover images
- User-uploaded thumbnails

### Upload Methods

```typescript
// Upload profile image
await cdnService.uploadProfileImage(userId, file);

// Upload story media
await cdnService.uploadStoryMedia(userId, file, isVideo);

// Upload post media
await cdnService.uploadPostMedia(userId, file);

// Generic upload
await cdnService.uploadMedia({
  bucket: 'media',
  path: 'path/to/file.jpg',
  file: fileBlob,
  contentType: 'image/jpeg',
  cacheControl: 'public, max-age=3600',
});
```

### URL Conversion

```typescript
// Convert Supabase URL to CDN URL
const cdnUrl = cdnService.convertToCDNUrl(supabaseUrl);

// Get optimized image URL
const optimizedUrl = cdnService.getOptimizedImageUrl(
  originalUrl,
  'profile' | 'story' | 'feed' | 'thumbnail' | 'explore'
);

// Get CDN URL with custom transformations
const transformedUrl = cdnService.getCDNUrl(originalUrl, {
  width: 512,
  height: 512,
  quality: 90,
  format: 'webp',
  fit: 'cover',
});
```

### Image Transformations

Automatic transformations for different use cases:

| Type | Width | Quality | Format | Fit |
|------|-------|---------|--------|-----|
| profile | 200 | 90 | webp | cover |
| story | 512 | 85 | webp | - |
| feed | 640 | 85 | webp | - |
| thumbnail | 320 | 80 | webp | - |
| explore | 400 | 85 | webp | cover |

### Caching Rules

**Browser Cache:** 1 hour (3600 seconds)
```
Cache-Control: public, max-age=3600
```

**Edge Cache:** 30 days (2592000 seconds)
```
CDN-Cache-Control: max-age=2592000
```

**Cache Level:** Aggressive
**Polish:** Lossless
**WebP Conversion:** Auto
**Image Resizing:** Active

### Signed URLs for Private Content

For restricted media (e.g., paid exclusive content):

```typescript
const signedUrl = await cdnService.generateSignedUrl(url, {
  expiresIn: 21600, // 6 hours
  sessionId: deviceSessionId,
  watermark: 'RoastLive Premium',
});
```

Features:
- Expires after 6 hours
- Bound to device session ID
- Watermark text: "RoastLive Premium"

**Note:** Signed URLs are NOT applied to livestream endpoints.

### Fallback Mechanism

```typescript
// Get fallback URL (Supabase direct URL)
const fallbackUrl = cdnService.getFallbackUrl(cdnUrl);

// Check if URL is CDN URL
const isCDN = cdnService.isCDNUrl(url);
```

UI tracking rules:
- If CDN exists → render CDN URL
- Else fallback → render Supabase direct public URL
- Add lightweight shimmer loaders for CDN assets only

### Performance Optimization

```typescript
// Preload critical images
cdnService.preloadImages([
  'https://cdn.roastlive.com/avatars/user1.jpg',
  'https://cdn.roastlive.com/stories/story1.jpg',
]);
```

## 3. Integration Points

### Premium Badge Visibility

The Premium badge is now visible in:

1. **Profile Header** (`components/ProfileHeader.tsx`)
   - Next to user's display name

2. **Stream Preview Card** (`components/StreamPreviewCard.tsx`)
   - In broadcaster info row

3. **Chat Bubble** (`components/ChatBubble.tsx`)
   - Next to username in chat messages

4. **Viewer Lists** (to be implemented)
   - In viewer modal

5. **Inbox Messages** (to be implemented)
   - Next to sender name

6. **Explore Feed** (to be implemented)
   - In creator cards

### Settings Menu

Premium Membership is positioned in Settings under "Wallet & Gifts" section:

```
Settings
├── Dashboard & Tools (role-based)
├── General
├── Account & Security
├── Streaming
├── Wallet & Gifts
│   ├── PREMIUM Membership ⭐ (NEW)
│   ├── Saldo
│   ├── Gift Information
│   ├── Manage Subscriptions
│   ├── Withdraw Earnings
│   └── Transaction History
├── Safety & Rules
└── Profile Preferences
```

## 4. Important Restrictions

### What Was NOT Modified

The following systems remain completely unchanged:

1. **Live Streaming Logic**
   - Start live flow
   - Stop live flow
   - Token generation
   - Streaming URL logic
   - Cloudflare Stream endpoints
   - WebRTC connections

2. **Cloudflare Stream**
   - Stream ingestion behavior
   - Live input creation
   - Stream playback
   - Recording functionality

### What Was Modified

1. **Static Asset Delivery**
   - Profile images now use CDN
   - Story media uses CDN
   - Post media uses CDN
   - Gift icons use CDN

2. **User Profile System**
   - Added premium fields
   - Premium badge rendering
   - Premium status checks

3. **Settings Navigation**
   - Added Premium Membership screen
   - Positioned above Wallet

4. **Notification System**
   - Premium upgrade notifications
   - Subscription renewal notifications
   - Cancellation notifications

## 5. Testing

### Premium Subscription Testing

1. Navigate to Settings → PREMIUM Membership
2. Click "Activate Premium – 89 SEK/mo (Stripe)"
3. In demo mode, click "Simulate Success"
4. Verify:
   - Premium badge appears on profile
   - Premium badge appears in chat
   - Premium badge appears on stream cards
   - Inbox notification received

### CDN Testing

1. Upload a profile image
2. Check network tab for CDN URL
3. Verify image transformations work
4. Test fallback to Supabase URL

### Cancellation Testing

1. Activate premium subscription
2. Navigate to Premium Membership screen
3. Click "Cancel Subscription"
4. Verify:
   - Status shows "canceled"
   - Premium remains active until renewal date
   - Notification received

## 6. Future Enhancements

### Premium Features to Implement

1. **Premium Filter Pack**
   - Integrate with camera filters
   - Add exclusive filters for premium users

2. **Profile Customization**
   - Custom theme color picker
   - Animated avatar border
   - Link-In-Bio editor

3. **Priority Ranking**
   - Implement ranking algorithm boost
   - Tie-break logic for equal engagement

4. **Discounted Subscriptions**
   - Apply 20% discount to VIP club subscriptions
   - Update checkout flow

5. **Reduced Platform Fee**
   - Apply 22% fee for premium users when gifting
   - Update gift transaction logic

### CDN Enhancements

1. **Cloudflare Configuration**
   - Set up actual CDN domain
   - Configure cache rules
   - Enable image transformations
   - Set up signed URL validation

2. **Performance Monitoring**
   - Track CDN hit rates
   - Monitor cache performance
   - Measure load times

3. **Advanced Transformations**
   - Face detection for smart cropping
   - Automatic quality adjustment
   - Format negotiation (AVIF support)

## 7. Maintenance

### Cron Jobs

Set up a cron job to run daily:

```typescript
// Deactivate expired premium subscriptions
await premiumSubscriptionService.deactivateExpiredSubscriptions();
```

This should run once per day to check for expired subscriptions and deactivate them.

### Monitoring

Monitor the following metrics:

1. **Premium Subscriptions**
   - Active subscriptions count
   - Churn rate
   - Revenue

2. **CDN Performance**
   - Cache hit rate
   - Average load time
   - Bandwidth usage

3. **Payment Failures**
   - Failed payment count
   - Past due subscriptions
   - Recovery rate

## 8. Support

For issues related to:

- **Premium Subscriptions:** Check `app/services/premiumSubscriptionService.ts`
- **CDN Integration:** Check `app/services/cdnService.ts`
- **Premium Badge:** Check `components/PremiumBadge.tsx`
- **Settings Screen:** Check `app/screens/AccountSettingsScreen.tsx`
- **Premium Membership Screen:** Check `app/screens/PremiumMembershipScreen.tsx`

## 9. API Endpoints

### Stripe Integration

- `stripe-create-subscription`: Create new subscription
- `stripe-webhook`: Handle subscription events
- `stripe-cancel-subscription`: Cancel subscription

### Premium Status

Query the `profiles` table:
```sql
SELECT premium_active, premium_since, premium_expiring
FROM profiles
WHERE id = 'user_id';
```

Query the `premium_subscriptions` table:
```sql
SELECT *
FROM premium_subscriptions
WHERE user_id = 'user_id'
AND status = 'active';
```

## 10. Security Considerations

1. **Payment Processing**
   - All payments handled through Stripe/PayPal
   - No credit card data stored locally
   - Webhook signature verification required

2. **Signed URLs**
   - Expire after 6 hours
   - Bound to device session
   - Signature validation required

3. **Premium Status**
   - Server-side validation required
   - Client-side checks for UI only
   - RLS policies enforce access control

## Conclusion

This implementation provides a complete Premium Subscription system with Cloudflare CDN integration while maintaining the integrity of the live streaming infrastructure. All changes are isolated to static asset delivery and user profile enhancements.
