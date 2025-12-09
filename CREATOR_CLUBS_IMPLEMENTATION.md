
# Creator Clubs & Revenue System Implementation

## Overview
This document describes the implementation of the creator subscription and revenue system for Roast Live, including VIP clubs, badges, and subscription management.

## Database Schema

### Tables Created

1. **creator_clubs**
   - Stores creator club information
   - Fields: id, creator_id, name, tag, monthly_price_cents, currency, description, is_active, created_at
   - One club per creator (unique constraint on creator_id)

2. **creator_club_memberships**
   - Tracks user subscriptions to creator clubs
   - Fields: id, club_id, member_id, started_at, renews_at, is_active, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, created_at
   - Unique constraint on (club_id, member_id)

3. **wallets**
   - Enhanced wallet system for users
   - Fields: id, user_id, balance_cents, lifetime_earned_cents, lifetime_spent_cents, updated_at, created_at
   - Unique constraint on user_id

4. **wallet_transactions_v2**
   - Detailed transaction records
   - Fields: id, user_id, type, amount_cents, currency, related_user_id, stream_id, club_id, metadata, created_at
   - Types: deposit, withdraw, gift_sent, gift_received, subscription_payment, platform_fee, adjustment

5. **creator_revenue_summary**
   - Aggregated revenue data for creators
   - Fields: id, creator_id, total_from_gifts_cents, total_from_subscriptions_cents, total_withdrawn_cents, updated_at, created_at
   - Unique constraint on creator_id

### Indices
- creator_club_memberships: (member_id, club_id, is_active)
- wallets: (user_id)
- wallet_transactions_v2: (user_id, created_at)

### RLS Policies
All tables have Row Level Security enabled with appropriate policies:
- Users can view and manage their own data
- Creators can view their club members
- Public can view active clubs

## Services

### creatorClubService.ts
Handles all creator club operations:
- `createClub()` - Create a new creator club
- `updateClub()` - Update club settings
- `getClubByCreator()` - Get club by creator ID
- `joinClub()` - Subscribe to a club
- `cancelMembership()` - Cancel subscription
- `isMember()` - Check membership status
- `getClubMembers()` - Get all club members
- `getUserMemberships()` - Get user's subscriptions
- `getClubBadge()` - Get badge info for display
- `getClubStats()` - Get club statistics

### walletService.ts
Manages wallet and transactions:
- `getOrCreateWallet()` - Get or create user wallet
- `getBalance()` - Get wallet balance
- `addFunds()` - Add funds to wallet
- `withdrawFunds()` - Withdraw funds
- `processSubscriptionPayment()` - Process subscription payment (70% to creator, 30% platform fee)
- `createTransaction()` - Create transaction record
- `getTransactions()` - Get transaction history
- `getTransactionStats()` - Get transaction statistics

### creatorRevenueService.ts
Tracks creator revenue:
- `getOrCreateRevenueSummary()` - Get or create revenue summary
- `updateGiftRevenue()` - Update gift revenue
- `updateSubscriptionRevenue()` - Update subscription revenue
- `updateWithdrawnAmount()` - Update withdrawn amount
- `getRevenueStats()` - Get formatted revenue stats

## UI Components

### Screens

1. **CreatorClubSetupScreen** (`app/screens/CreatorClubSetupScreen.tsx`)
   - Creator dashboard for club setup
   - Fields: Club Name, Club Tag (5 chars), Monthly Price, Description
   - Toggle to activate/deactivate club
   - Shows benefits list
   - Create or update club

2. **ManageSubscriptionsScreen** (`app/screens/ManageSubscriptionsScreen.tsx`)
   - User's subscription management
   - Shows active subscriptions
   - Renewal dates
   - Cancel subscription button
   - Payment history

### Components

1. **JoinClubModal** (`components/JoinClubModal.tsx`)
   - Modal for joining a creator's club
   - Shows club info, price, benefits
   - Displays wallet balance
   - Handles subscription payment
   - Validates sufficient balance

2. **ClubBadge** (`components/ClubBadge.tsx`)
   - Displays club badge next to username
   - Only shows in creator's content (streams, comments)
   - Configurable size (small, medium, large)
   - Brand color (#A40028)

## Features

### For Creators
- Create one VIP club with custom name and tag
- Set monthly price (default 3 SEK, earn 70%)
- Add description and benefits
- Activate/deactivate club
- View member list
- Track revenue from subscriptions

### For Members
- Join creator clubs
- Get custom badge in creator's streams
- Priority in chat
- View all subscriptions
- Cancel subscriptions (active until period end)
- View payment history

### Badge Display Logic
- Badge ONLY appears in the creator's content
- Shows in:
  - Livestream chat
  - Viewer list
  - Comments on creator's posts
- Does NOT show globally across all creators

### Payment Flow
1. User joins club
2. Monthly price deducted from wallet
3. 70% goes to creator's wallet
4. 30% platform fee
5. Transaction records created for both parties
6. Membership activated with renewal date

## Integration Points

### Existing Systems
- Uses existing `profiles` table for user data
- Integrates with existing `streams` table
- Compatible with existing wallet system
- Works with existing notification system

### Chat Integration
To display badges in chat, update chat components to include:
```tsx
import ClubBadge from '@/components/ClubBadge';

// In chat message component:
<View style={styles.messageHeader}>
  <Text style={styles.username}>{username}</Text>
  <ClubBadge 
    creatorId={streamCreatorId} 
    userId={messageUserId} 
    size="small" 
  />
</View>
```

### Profile Integration
Add "Join Club" button on creator profiles:
```tsx
import JoinClubModal from '@/components/JoinClubModal';

const [showJoinModal, setShowJoinModal] = useState(false);

// In profile screen:
<TouchableOpacity onPress={() => setShowJoinModal(true)}>
  <Text>Join VIP Club</Text>
</TouchableOpacity>

<JoinClubModal
  visible={showJoinModal}
  onClose={() => setShowJoinModal(false)}
  creatorId={profileUserId}
  userId={currentUserId}
  onJoinSuccess={() => {
    // Refresh profile data
  }}
/>
```

## Navigation Routes

Add these routes to your navigation:
- `/creator-club-setup` - Creator club setup screen
- `/manage-subscriptions` - User subscription management

## Styling

All components use the Roast Live theme:
- Brand color: #A40028 (for badges and highlights)
- Dark background with high contrast
- Gradient buttons for CTAs
- Consistent with existing design system

## Testing Checklist

- [ ] Create creator club
- [ ] Update club settings
- [ ] Activate/deactivate club
- [ ] Join club as member
- [ ] Verify badge appears in creator's stream
- [ ] Verify badge does NOT appear in other streams
- [ ] Cancel subscription
- [ ] View payment history
- [ ] Check wallet balance updates
- [ ] Verify 70/30 revenue split
- [ ] Test insufficient balance scenario

## Future Enhancements

1. Stripe integration for real payments
2. Multiple subscription tiers
3. Exclusive content for members
4. Member-only streams
5. Custom emotes per club
6. Analytics dashboard for creators
7. Bulk member management
8. Subscription gifting

## Notes

- All prices are stored in cents to avoid floating-point issues
- Default currency is SEK but system supports multiple currencies
- Platform takes 30% fee on all subscriptions
- Subscriptions auto-renew monthly
- Canceled subscriptions remain active until period end
- Badge display is context-aware (only in creator's content)
