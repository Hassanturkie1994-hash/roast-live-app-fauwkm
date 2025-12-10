
# Premium Membership - Quick Reference Guide

## For Users

### How to Subscribe
1. Go to **Settings** → **PREMIUM Membership**
2. Review benefits and pricing (89 SEK/month)
3. Choose payment method (Stripe or PayPal)
4. Complete payment
5. Receive welcome notification
6. Premium badge appears immediately

### Premium Benefits
- 🌟 **Priority Placement** - Higher ranking in Explore
- 👑 **Premium Badge** - Gold badge everywhere
- 🚫 **Ad-Free** - No banner ads or watermarks
- 📈 **Double Reach** - Featured stories and posts
- 🎨 **Premium Filters** - Exclusive camera filters
- 🎨 **Customization** - Custom theme and avatar border
- 💰 **20% Off VIP Clubs** - Discounted creator subscriptions
- 💸 **Lower Fees** - 22% platform fee vs 30%

### How to Cancel
1. Go to **Settings** → **PREMIUM Membership**
2. Tap **Cancel Subscription**
3. Confirm cancellation
4. Premium remains active until billing period ends

---

## For Developers

### Check Premium Status
```typescript
import { premiumSubscriptionService } from '@/app/services/premiumSubscriptionService';

const isPremium = await premiumSubscriptionService.isPremiumMember(userId);
```

### Display Premium Badge
```typescript
import PremiumBadge from '@/components/PremiumBadge';

<PremiumBadge userId={userId} size="medium" showAnimation={true} />
```

### Create Premium Subscription
```typescript
const result = await premiumSubscriptionService.createPremiumSubscription(
  userId,
  'stripe', // or 'paypal'
  subscriptionId,
  customerId
);
```

### Get Premium Benefits
```typescript
const benefits = premiumSubscriptionService.getPremiumBenefits();
// Returns array of 8 benefits with icon, title, description
```

---

## For Admins

### Database Queries

**Check Premium Users:**
```sql
SELECT id, username, premium_active, premium_since, premium_expiring
FROM profiles
WHERE premium_active = true;
```

**Check Active Subscriptions:**
```sql
SELECT *
FROM premium_subscriptions
WHERE status = 'active'
ORDER BY started_at DESC;
```

**Check Expired Subscriptions:**
```sql
SELECT *
FROM premium_subscriptions
WHERE status = 'expired'
ORDER BY canceled_at DESC;
```

**Revenue Report:**
```sql
SELECT 
  COUNT(*) as total_subscriptions,
  SUM(price_sek) as total_revenue,
  subscription_provider
FROM premium_subscriptions
WHERE status = 'active'
GROUP BY subscription_provider;
```

### Maintenance Tasks

**Deactivate Expired Subscriptions:**
```typescript
await premiumSubscriptionService.deactivateExpiredSubscriptions();
```

**Handle Failed Payment:**
```typescript
await premiumSubscriptionService.handlePaymentFailed(subscriptionId);
```

---

## CDN Integration

### Upload with CDN
```typescript
import { cdnService } from '@/app/services/cdnService';

// Upload profile image
const result = await cdnService.uploadProfileImage(userId, file);
console.log(result.cdnUrl); // CDN URL

// Upload story media
const result = await cdnService.uploadStoryMedia(userId, file, isVideo);

// Upload post media
const result = await cdnService.uploadPostMedia(userId, file);
```

### Get Optimized Image
```typescript
// Get optimized URL for specific use case
const optimizedUrl = cdnService.getOptimizedImageUrl(
  originalUrl,
  'profile' // or 'story', 'feed', 'thumbnail', 'explore'
);
```

### Generate Signed URL
```typescript
// For private/premium content
const signedUrl = await cdnService.generateSignedUrl(url, {
  expiresIn: 21600, // 6 hours
  sessionId: 'user-session-id',
  watermark: 'RoastLive Premium',
});
```

---

## Notification Messages

### Upgrade
```
Title: 🎉 Welcome to PREMIUM!
Message: You are now Premium! Your benefits are active.
```

### Renewal
```
Your PREMIUM subscription has been renewed for another month!
```

### Cancellation
```
Your PREMIUM subscription has been canceled. You'll retain access until [date].
```

### Expiration
```
Your PREMIUM subscription has expired. Resubscribe to continue enjoying exclusive benefits!
```

### Payment Failed
```
Your PREMIUM subscription payment failed. Please update your payment method to continue.
```

---

## Pricing

- **Monthly:** 89 SEK
- **Platform Fee:** 30% (Stripe/PayPal fees)
- **Creator Revenue:** 70%

---

## Support

### Common Issues

**Badge not showing:**
- Check `premium_active` in profiles table
- Verify subscription status is 'active'
- Clear app cache

**Payment failed:**
- Check payment method
- Verify card/account has funds
- Contact payment provider

**Subscription not canceling:**
- Verify cancellation request
- Check subscription status
- Contact support

---

## Testing

### Test Accounts
- Create test user
- Use Stripe test cards
- Use PayPal sandbox

### Test Scenarios
1. Subscribe with Stripe
2. Subscribe with PayPal
3. Cancel subscription
4. Let subscription expire
5. Renew subscription
6. Handle failed payment

---

## Monitoring

### Key Metrics
- Active subscriptions
- Conversion rate
- Churn rate
- Revenue per month
- Badge visibility
- CDN performance

### Alerts
- Failed payments
- Expired subscriptions
- High churn rate
- CDN errors

---

## Contact

For support or questions:
- Email: support@roastlive.com
- Discord: RoastLive Community
- Twitter: @RoastLive
