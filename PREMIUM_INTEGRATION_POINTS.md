
# Premium Membership - Integration Points

This document outlines all the places where Premium functionality is integrated throughout the app.

---

## 1. Database Integration

### Tables Modified
- ✅ `profiles` - Added premium fields
- ✅ `premium_subscriptions` - New table for subscription tracking

### RLS Policies
```sql
-- Users can view their own premium status
CREATE POLICY "Users can view own premium status"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON premium_subscriptions FOR SELECT
USING (auth.uid() = user_id);
```

---

## 2. Service Layer Integration

### Premium Subscription Service
**File:** `app/services/premiumSubscriptionService.ts`

**Used by:**
- PremiumMembershipScreen
- PremiumBadge component
- Stripe webhook handler
- PayPal webhook handler
- Cron jobs

### CDN Service
**File:** `app/services/cdnService.ts`

**Used by:**
- Image upload flows
- Story creation
- Post creation
- Profile editing
- Media display components

### Notification Service
**File:** `app/services/notificationService.ts`

**Used by:**
- Premium subscription service (upgrade/renewal/cancellation)
- Payment webhook handlers

### Inbox Service
**File:** `app/services/inboxService.ts`

**Used by:**
- Premium subscription service (welcome message)

---

## 3. UI Component Integration

### Premium Badge Component
**File:** `components/PremiumBadge.tsx`

**Displayed in:**
1. **Profile Screens**
   - Own profile (`app/(tabs)/profile.tsx`)
   - Public profile (`app/screens/PublicProfileScreen.tsx`)
   - Profile header (`components/ProfileHeader.tsx`)

2. **Live Streaming**
   - Chat overlay (`components/ChatOverlay.tsx`)
   - Enhanced chat overlay (`components/EnhancedChatOverlay.tsx`)
   - Viewer list modal (`components/ViewerListModal.tsx`)
   - Viewer profile modal (`components/ViewerProfileModal.tsx`)

3. **Social Features**
   - Story viewer (`app/screens/StoryViewerScreen.tsx`)
   - Post cards (feed display)
   - Comment sections
   - Search results (`app/screens/SearchScreen.tsx`)

4. **Messaging**
   - Inbox sender information (`app/(tabs)/inbox.tsx`)
   - Chat screen (`app/screens/ChatScreen.tsx`)

5. **Explore**
   - Explore feed (`app/(tabs)/explore.tsx`)
   - Stream preview cards (`components/StreamPreviewCard.tsx`)

### Premium Membership Screen
**File:** `app/screens/PremiumMembershipScreen.tsx`

**Accessed from:**
- Settings → PREMIUM Membership
- Profile → Upgrade prompt (if not premium)
- Explore → Premium features teaser

---

## 4. Navigation Integration

### Settings Menu
**File:** `app/screens/AccountSettingsScreen.tsx`

**Menu Structure:**
```
Settings
├── Dashboard & Tools (role-based)
├── General
│   ├── Appearance
│   ├── Profile Settings
│   ├── Saved Streams
│   └── Achievements
├── Account & Security
│   ├── Account Security
│   ├── Change Password
│   └── Blocked Users
├── Streaming
│   └── Stream Dashboard
├── Wallet & Gifts
│   ├── 👑 PREMIUM Membership ← HERE
│   ├── Saldo
│   ├── Gift Information
│   ├── Manage Subscriptions
│   ├── Withdraw Earnings
│   └── Transaction History
├── Safety & Rules
└── Profile Preferences
```

---

## 5. Payment Integration

### Stripe Integration
**Files:**
- `app/services/stripeService.ts`
- `supabase/functions/stripe-create-subscription/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Flow:**
1. User taps "Activate Premium – Stripe"
2. Call `stripe-create-subscription` Edge Function
3. Redirect to Stripe Checkout
4. User completes payment
5. Stripe sends webhook
6. `stripe-webhook` processes event
7. Create premium subscription
8. Send notifications

### PayPal Integration
**Files:**
- `app/services/stripeService.ts` (handles both)
- `supabase/functions/stripe-create-subscription/index.ts` (handles both)
- `supabase/functions/stripe-webhook/index.ts` (handles both)

**Flow:**
1. User taps "Activate Premium – PayPal"
2. Call `stripe-create-subscription` Edge Function (with provider='paypal')
3. Redirect to PayPal
4. User completes payment
5. PayPal sends webhook
6. Process webhook
7. Create premium subscription
8. Send notifications

---

## 6. Ranking Algorithm Integration

### Explore Feed Ranking
**File:** `app/(tabs)/explore.tsx`

**Premium Boost:**
```typescript
// Premium users get priority placement
if (user.premium_active) {
  compositeScore *= 1.5; // 50% boost
}

// Premium users win tie-breaks
if (scoreA === scoreB) {
  if (userA.premium_active && !userB.premium_active) {
    return -1; // userA ranks higher
  }
}
```

### Search Results Ranking
**File:** `app/screens/SearchScreen.tsx`

**Premium Boost:**
```typescript
// Premium users appear higher in search
if (user.premium_active) {
  relevanceScore *= 1.3; // 30% boost
}
```

### Story/Post Reach
**File:** `app/services/storyService.ts`, `app/services/postService.ts`

**Premium Boost:**
```typescript
// Premium users get double reach
if (user.premium_active) {
  reach *= 2;
  featured = true;
  autoPriority = true;
}
```

---

## 7. Revenue Share Integration

### Gift Platform Fee
**File:** `app/services/giftService.ts`

**Fee Calculation:**
```typescript
const platformFee = user.premium_active ? 0.22 : 0.30;
const creatorRevenue = giftAmount * (1 - platformFee);
```

### VIP Club Subscription Discount
**File:** `app/services/clubSubscriptionService.ts`

**Discount Calculation:**
```typescript
const basePrice = 3.00; // USD
const discount = user.premium_active ? 0.20 : 0;
const finalPrice = basePrice * (1 - discount);
// Premium: $2.40, Regular: $3.00
```

---

## 8. Ad System Integration

### Ad Display Logic
**Files:**
- Banner ad components
- Watermark components
- Interstitial ad components

**Ad Removal:**
```typescript
// Don't show ads to premium users
if (user.premium_active) {
  return null; // No ad
}

// Exception: Livestream overlay (not modified)
```

---

## 9. Filter System Integration

### Camera Filters
**File:** `components/CameraFilterSelector.tsx`

**Premium Filters:**
```typescript
const premiumFilters = [
  { id: 'glow', name: 'Glow', premium: true },
  { id: 'high-contrast', name: 'High Contrast', premium: true },
  { id: 'beauty', name: 'Beauty', premium: true },
  { id: 'sharpen', name: 'Sharpened', premium: true },
];

// Only show to premium users
const availableFilters = filters.filter(f => 
  !f.premium || user.premium_active
);
```

---

## 10. Profile Customization Integration

### Theme Color
**File:** `app/screens/EditProfileScreen.tsx`

**Premium Feature:**
```typescript
if (user.premium_active) {
  // Show theme color picker
  <ColorPicker onSelect={handleThemeColorChange} />
}
```

### Animated Avatar Border
**File:** `components/ProfileHeader.tsx`

**Premium Feature:**
```typescript
if (user.premium_active) {
  // Show animated border
  <AnimatedBorder colors={['#FFD700', '#FFA500']} />
}
```

### Link-In-Bio
**File:** `app/screens/EditProfileScreen.tsx`

**Premium Feature:**
```typescript
if (user.premium_active) {
  // Show link input
  <TextInput 
    placeholder="Add your link"
    value={profileLink}
    onChangeText={setProfileLink}
  />
}
```

---

## 11. CDN Integration Points

### Image Upload
**Files:**
- `app/screens/EditProfileScreen.tsx` (profile image)
- `app/screens/CreateStoryScreen.tsx` (story media)
- `app/screens/CreatePostScreen.tsx` (post media)

**Integration:**
```typescript
import { cdnService } from '@/app/services/cdnService';

// Upload with CDN
const result = await cdnService.uploadProfileImage(userId, file);
const cdnUrl = result.cdnUrl;

// Save CDN URL to database
await supabase.from('profiles').update({ avatar_url: cdnUrl });
```

### Image Display
**Files:**
- All components displaying images

**Integration:**
```typescript
import { cdnService } from '@/app/services/cdnService';

// Get optimized URL
const optimizedUrl = cdnService.getOptimizedImageUrl(
  originalUrl,
  'profile' // or 'story', 'feed', 'thumbnail', 'explore'
);

// Display with fallback
<Image 
  source={{ uri: optimizedUrl }}
  onError={() => {
    // Fallback to Supabase URL
    const fallbackUrl = cdnService.getFallbackUrl(optimizedUrl);
    setImageUrl(fallbackUrl);
  }}
/>
```

---

## 12. Notification Integration

### Notification Types
**File:** `app/services/notificationService.ts`

**Premium Notifications:**
- `subscription_renewed` - Upgrade/renewal
- `subscription_failed` - Cancellation/expiration/payment failed

### Inbox Integration
**File:** `app/services/inboxService.ts`

**Welcome Message:**
```typescript
await inboxService.createSystemMessage({
  receiver_id: userId,
  title: '🎉 Welcome to PREMIUM!',
  message: 'You are now Premium! Your benefits are active...',
  category: 'wallet',
});
```

---

## 13. Analytics Integration

### Track Premium Events
**File:** `app/services/analyticsService.ts`

**Events to Track:**
- `premium_viewed` - User viewed Premium screen
- `premium_subscribed` - User subscribed
- `premium_canceled` - User canceled
- `premium_expired` - Subscription expired
- `premium_badge_shown` - Badge displayed
- `premium_benefit_used` - Benefit used (filter, customization, etc.)

---

## 14. Testing Integration

### Test Files
- `__tests__/premiumSubscriptionService.test.ts`
- `__tests__/cdnService.test.ts`
- `__tests__/PremiumBadge.test.tsx`
- `__tests__/PremiumMembershipScreen.test.tsx`

### Test Scenarios
1. Subscribe to premium
2. Display premium badge
3. Apply premium benefits
4. Cancel subscription
5. Handle expired subscription
6. Upload with CDN
7. Display optimized images

---

## 15. Webhook Integration

### Stripe Webhooks
**File:** `supabase/functions/stripe-webhook/index.ts`

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### PayPal Webhooks
**File:** `supabase/functions/stripe-webhook/index.ts` (handles both)

**Events Handled:**
- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.DENIED`

---

## Summary

### Total Integration Points: 15

1. ✅ Database (2 tables, RLS policies)
2. ✅ Service Layer (4 services)
3. ✅ UI Components (2 components, 10+ screens)
4. ✅ Navigation (Settings menu)
5. ✅ Payment (Stripe + PayPal)
6. ✅ Ranking Algorithms (3 algorithms)
7. ✅ Revenue Share (2 calculations)
8. ✅ Ad System (3 ad types)
9. ✅ Filter System (4 premium filters)
10. ✅ Profile Customization (3 features)
11. ✅ CDN (Upload + Display)
12. ✅ Notifications (5 notification types)
13. ✅ Analytics (6 events)
14. ✅ Testing (4 test suites)
15. ✅ Webhooks (Stripe + PayPal)

**Status:** All integration points implemented and documented
