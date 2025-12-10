
# VIP Club System - Quick Reference Guide

## Overview
The VIP Club system allows creators to monetize their content through monthly subscriptions. Creating a club is **FREE** for creators, and members pay **$3/month** with a **70/30 revenue split** (creator/platform).

---

## Key Features

### For Creators
- ✅ **FREE** club creation
- ✅ Earn **$2.10/month** per member (70% of $3)
- ✅ Custom club badge (max 5 characters)
- ✅ Send announcements to all members
- ✅ View member list with join/renewal dates
- ✅ Track monthly and lifetime revenue

### For Members
- ✅ Pay **$3/month** (cancel anytime)
- ✅ Exclusive VIP badge in creator's streams
- ✅ Priority visibility in chat
- ✅ Receive club announcements
- ✅ Support favorite creator

---

## Database Schema

### `club_subscriptions` Table
```sql
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id),
  subscriber_id UUID REFERENCES profiles(id),
  subscription_price_usd NUMERIC DEFAULT 3.00,
  creator_payout_usd NUMERIC DEFAULT 2.10,  -- 70%
  platform_payout_usd NUMERIC DEFAULT 0.90, -- 30%
  started_at TIMESTAMPTZ,
  renewed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'canceled', 'expired')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, subscriber_id)
);
```

---

## Service Functions

### `clubSubscriptionService.ts`

#### Create Subscription
```typescript
await clubSubscriptionService.createClubSubscription(
  creatorId: string,
  subscriberId: string,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
);
```

#### Get Club Members
```typescript
const members = await clubSubscriptionService.getClubMembers(creatorId);
// Returns: ClubMemberDetails[]
```

#### Check Membership
```typescript
const isMember = await clubSubscriptionService.isClubMember(
  creatorId,
  subscriberId
);
// Returns: boolean
```

#### Cancel Subscription
```typescript
await clubSubscriptionService.cancelSubscription(subscriptionId);
```

#### Send Announcement
```typescript
await clubSubscriptionService.sendClubAnnouncement(
  creatorId,
  title: string,
  message: string
);
```

#### Get Revenue Summary
```typescript
const revenue = await clubSubscriptionService.getClubRevenueSummary(creatorId);
// Returns: { totalMembers, monthlyRevenue, lifetimeRevenue }
```

---

## Stripe Integration

### `stripeVIPService.ts`

#### Create Checkout Session
```typescript
const result = await stripeVIPService.createCheckoutSession(
  creatorId,
  subscriberId,
  successUrl,
  cancelUrl
);
// Returns: { success, data: { sessionId, url }, error }
```

#### Handle Webhook Events
```typescript
// Subscription created
await stripeVIPService.handleSubscriptionCreated(
  stripeSubscriptionId,
  stripeCustomerId,
  creatorId,
  subscriberId
);

// Subscription renewed
await stripeVIPService.handleSubscriptionRenewed(stripeSubscriptionId);

// Subscription canceled
await stripeVIPService.handleSubscriptionCanceled(stripeSubscriptionId);

// Payment failed
await stripeVIPService.handlePaymentFailed(stripeSubscriptionId);
```

---

## UI Components

### `VIPClubBadge.tsx`
Displays VIP badge in streams (only visible in creator's streams).

```typescript
<VIPClubBadge
  creatorId={streamCreatorId}
  viewerId={currentUserId}
  size="medium" // 'small' | 'medium' | 'large'
/>
```

### `JoinVIPClubModal.tsx`
Modal for joining a VIP club.

```typescript
<JoinVIPClubModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  creatorId={creatorId}
  creatorName={creatorName}
  clubName={clubName}
  badgeColor={badgeColor}
/>
```

---

## Screens

### `VIPClubDashboardScreen.tsx`
Creator dashboard for managing VIP club.

**Features:**
- Revenue overview (monthly & lifetime)
- Member list with details
- Badge editor
- Moderator list
- Announcement tool

**Navigation:**
```typescript
router.push('/screens/VIPClubDashboardScreen');
```

### `StreamDashboardScreen.tsx`
Consolidated streaming dashboard with VIP club access.

**Menu Structure:**
1. Club Management (VIP Club)
2. Moderators List
3. Streaming Analytics
4. Ban / Timeout Management
5. Gifts Earnings Summary
6. Viewer Engagement Statistics

---

## Revenue Calculation

### Monthly Revenue
```typescript
const activeMembers = subscriptions.filter(s => s.status === 'active').length;
const monthlyRevenue = activeMembers * 2.10; // $2.10 per member
```

### Lifetime Revenue
```typescript
const lifetimeRevenue = subscriptions.reduce((sum, sub) => {
  const monthsActive = Math.floor(
    (Date.now() - new Date(sub.started_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  return sum + (sub.creator_payout_usd * Math.max(1, monthsActive));
}, 0);
```

---

## Badge Display Rules

### Visibility
- ✅ Badge shows **ONLY** in streams belonging to the creator
- ❌ Badge does **NOT** show in other creators' streams
- ✅ Badge visible to all viewers in the stream

### Design
- **Text:** Club name (max 5 characters, uppercase)
- **Icon:** Heart icon
- **Colors:** Adapts to theme
  - Light mode: Dark text
  - Dark mode: Light/silver text
- **Sizes:** Small (9px), Medium (11px), Large (13px)

### Example
```
[❤️ KINGZ] - Dark mode
[❤️ ROAST] - Light mode
```

---

## Notifications

### Subscription Created
```typescript
{
  type: 'subscription_renewed',
  sender_id: creatorId,
  receiver_id: subscriberId,
  message: 'Welcome to the VIP Club! You now have exclusive access and a special badge.',
  category: 'social'
}
```

### Club Announcement
```typescript
{
  type: 'admin_announcement',
  sender_id: creatorId,
  receiver_id: memberId,
  message: `${title}: ${message}`,
  category: 'social'
}
```

### Payment Failed
```typescript
{
  type: 'subscription_failed',
  sender_id: creatorId,
  receiver_id: subscriberId,
  message: 'Your VIP club subscription payment failed. Please update your payment method.',
  category: 'wallet'
}
```

---

## Testing Checklist

### Creator Flow
- [ ] Create VIP club (FREE)
- [ ] Customize badge name and color
- [ ] View member list
- [ ] Send announcement to all members
- [ ] View revenue summary
- [ ] Remove member from club

### Member Flow
- [ ] View "Join VIP Club" button on creator profile
- [ ] See "$3 / month — cancel anytime" text
- [ ] Complete Stripe checkout
- [ ] Receive welcome notification
- [ ] See VIP badge in creator's streams
- [ ] Receive club announcements
- [ ] Cancel subscription

### Badge Display
- [ ] Badge shows in creator's streams
- [ ] Badge does NOT show in other streams
- [ ] Badge colors adapt to theme
- [ ] Badge text is uppercase
- [ ] Badge has heart icon

### Revenue
- [ ] Creator receives $2.10 per member
- [ ] Platform receives $0.90 per member
- [ ] Monthly revenue calculates correctly
- [ ] Lifetime revenue calculates correctly
- [ ] Revenue updates on subscription changes

---

## Common Issues & Solutions

### Issue: Badge not showing
**Solution:** Check that:
1. User is an active club member
2. Viewing creator's stream (not another creator)
3. Badge data is cached correctly

### Issue: Revenue not updating
**Solution:** Check that:
1. Stripe webhook is configured
2. Subscription status is 'active'
3. Database triggers are working

### Issue: Announcement not received
**Solution:** Check that:
1. User is an active member
2. Notification preferences allow announcements
3. Notification service is working

---

## Environment Variables

```env
# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_VIP_CLUB_PRICE_ID=price_vip_club_3usd

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## API Endpoints

### Create Subscription
```
POST /api/club/subscribe
Body: { creator_id, subscriber_id }
Response: { success, data: { subscription }, error }
```

### Get Members
```
GET /api/club/:creatorId/members
Response: { success, data: ClubMemberDetails[], error }
```

### Send Announcement
```
POST /api/club/:creatorId/announce
Body: { title, message }
Response: { success, error }
```

### Cancel Subscription
```
DELETE /api/club/subscription/:id
Response: { success, error }
```

---

## Best Practices

### For Creators
1. Choose a short, memorable club name (max 5 chars)
2. Send regular announcements to keep members engaged
3. Acknowledge VIP members in streams
4. Offer exclusive content or perks
5. Monitor revenue and member retention

### For Developers
1. Always check membership status before displaying badge
2. Cache badge data per stream session
3. Handle Stripe webhooks asynchronously
4. Validate revenue calculations
5. Test subscription lifecycle thoroughly

---

## Support Resources

### Documentation
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native Stripe SDK](https://github.com/stripe/stripe-react-native)

### Help Center
- Creator VIP Club Setup Guide
- Member Subscription FAQ
- Troubleshooting Badge Display
- Revenue & Payouts Explained

---

## Conclusion

The VIP Club system provides a sustainable revenue stream for creators while offering exclusive benefits to members. The 70/30 split ensures fair compensation, and the FREE club creation removes barriers for creators to start monetizing their content.

**Key Takeaways:**
- ✅ Club creation is FREE for creators
- ✅ Members pay $3/month
- ✅ Creators earn $2.10 (70%)
- ✅ Platform receives $0.90 (30%)
- ✅ Badges only show in creator's streams
- ✅ Announcements reach all members
- ✅ Cancel anytime, no commitments
