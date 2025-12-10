
# Payout & Leaderboard Quick Reference Guide

## 🚀 Quick Start

### For Creators: Request a Payout

```typescript
import { payoutService } from '@/app/services/payoutService';

// Request a payout
const result = await payoutService.createPayoutRequest(
  userId,
  50000, // 500 SEK in cents
  'John Doe',
  'Sweden',
  'SE1234567890123456', // IBAN (optional)
  '1234-5678' // Bank account (optional)
);

if (result.success) {
  console.log('Payout requested successfully');
}
```

### For Admins: Manage Payouts

```typescript
import { payoutService } from '@/app/services/payoutService';

// Get all pending payouts
const payouts = await payoutService.getAllPayoutRequests('pending');

// Approve a payout
await payoutService.updatePayoutStatus(
  payoutId,
  'paid',
  adminUserId,
  'Processed via bank transfer'
);

// Reject a payout
await payoutService.updatePayoutStatus(
  payoutId,
  'rejected',
  adminUserId,
  'Invalid bank details'
);
```

### Show Leaderboard During Live Stream

```typescript
import { useState } from 'react';
import LeaderboardModal from '@/components/LeaderboardModal';

function LiveStreamScreen() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <>
      {/* Top Supporters Button */}
      <TouchableOpacity onPress={() => setShowLeaderboard(true)}>
        <Text>🏆 Top Supporters</Text>
      </TouchableOpacity>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        streamId={currentStreamId}
        creatorId={creatorId}
      />
    </>
  );
}
```

### Display Global Leaderboards

```typescript
import GlobalLeaderboard from '@/components/GlobalLeaderboard';

function CreatorProfileScreen() {
  return (
    <ScrollView>
      {/* Weekly Leaderboard */}
      <GlobalLeaderboard
        creatorId={creatorId}
        type="weekly"
        limit={10}
      />

      {/* All-Time Leaderboard */}
      <GlobalLeaderboard
        creatorId={creatorId}
        type="alltime"
        limit={10}
      />
    </ScrollView>
  );
}
```

## 📊 Service APIs

### PayoutService

```typescript
// Create payout request
payoutService.createPayoutRequest(
  userId: string,
  amountCents: number,
  fullName: string,
  country: string,
  iban?: string,
  bankAccount?: string
): Promise<{ success: boolean; error?: string; data?: PayoutRequest }>

// Get user's payout requests
payoutService.getUserPayoutRequests(
  userId: string
): Promise<PayoutRequest[]>

// Get all payout requests (admin)
payoutService.getAllPayoutRequests(
  status?: 'pending' | 'processing' | 'paid' | 'rejected'
): Promise<PayoutRequest[]>

// Update payout status (admin)
payoutService.updatePayoutStatus(
  payoutId: string,
  status: 'processing' | 'paid' | 'rejected',
  adminUserId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }>

// Get payout statistics
payoutService.getPayoutStats(
  userId: string
): Promise<{
  totalRequested: number;
  totalPaid: number;
  totalPending: number;
  totalRejected: number;
}>
```

### LeaderboardService

```typescript
// Get per-stream leaderboard
leaderboardService.getStreamLeaderboard(
  streamId: string,
  creatorId: string,
  limit?: number
): Promise<LeaderboardEntry[]>

// Get global leaderboard (all-time)
leaderboardService.getGlobalLeaderboard(
  creatorId: string,
  limit?: number
): Promise<LeaderboardEntry[]>

// Get weekly leaderboard
leaderboardService.getWeeklyLeaderboard(
  creatorId: string,
  limit?: number
): Promise<LeaderboardEntry[]>
```

## 🎨 Component Props

### LeaderboardModal

```typescript
interface LeaderboardModalProps {
  visible: boolean;           // Show/hide modal
  onClose: () => void;        // Close callback
  streamId: string;           // Current stream ID
  creatorId: string;          // Creator user ID
  title?: string;             // Modal title (default: "Top Supporters")
}
```

### GlobalLeaderboard

```typescript
interface GlobalLeaderboardProps {
  creatorId: string;          // Creator user ID
  type: 'weekly' | 'alltime'; // Leaderboard type
  limit?: number;             // Number of entries (default: 10)
}
```

## 🔐 RLS Policies

### Payout Requests

```sql
-- Creators can view their own requests
SELECT * FROM payout_requests WHERE user_id = auth.uid();

-- Creators can create their own requests
INSERT INTO payout_requests WHERE user_id = auth.uid();

-- Admins can view all requests
SELECT * FROM payout_requests WHERE EXISTS (
  SELECT 1 FROM admin_roles
  WHERE admin_roles.user_id = auth.uid()
  AND admin_roles.role IN ('HEAD_ADMIN', 'ADMIN')
);

-- Admins can update requests
UPDATE payout_requests WHERE EXISTS (
  SELECT 1 FROM admin_roles
  WHERE admin_roles.user_id = auth.uid()
  AND admin_roles.role IN ('HEAD_ADMIN', 'ADMIN')
);
```

## 📱 Navigation

### Navigate to Creator Earnings

```typescript
import { router } from 'expo-router';

router.push('/screens/CreatorEarningsScreen');
```

### Navigate to Admin Payout Panel

```typescript
import { router } from 'expo-router';

router.push('/screens/AdminPayoutPanelScreen');
```

## 🎯 Common Use Cases

### 1. Check if User Can Request Payout

```typescript
import { walletService } from '@/app/services/walletService';

const wallet = await walletService.getOrCreateWallet(userId);
const canRequestPayout = wallet.balance_cents >= 10000; // 100 SEK minimum

if (canRequestPayout) {
  // Show payout request button
}
```

### 2. Display Creator Revenue Stats

```typescript
import { creatorRevenueService } from '@/app/services/creatorRevenueService';

const stats = await creatorRevenueService.getRevenueStats(creatorId);

console.log('Total Earned:', stats.totalEarned);
console.log('From Gifts:', stats.totalFromGifts);
console.log('From Subscriptions:', stats.totalFromSubscriptions);
console.log('Available Balance:', stats.availableBalance);
```

### 3. Show Top Supporter Badge

```typescript
import { leaderboardService } from '@/app/services/leaderboardService';

const leaderboard = await leaderboardService.getStreamLeaderboard(
  streamId,
  creatorId,
  1 // Get only #1 supporter
);

if (leaderboard.length > 0) {
  const topSupporter = leaderboard[0];
  console.log('Top Supporter:', topSupporter.username);
  console.log('Total Value:', topSupporter.total_value);
}
```

### 4. Filter Payout Requests by Status

```typescript
import { payoutService } from '@/app/services/payoutService';

// Get only pending requests
const pendingPayouts = await payoutService.getAllPayoutRequests('pending');

// Get only paid requests
const paidPayouts = await payoutService.getAllPayoutRequests('paid');

// Get all requests
const allPayouts = await payoutService.getAllPayoutRequests();
```

## ⚠️ Important Notes

### Payout System
- Minimum payout amount: **100 SEK** (10,000 cents)
- Either IBAN or bank account must be provided
- Payouts are processed manually by admins
- Wallet balance is checked before request creation
- Wallet is automatically deducted when payout is marked as "paid"

### Leaderboards
- Auto-refresh every 15-20 seconds
- Based on gifts + subscription payments
- VIP and moderator badges are automatically detected
- Lightweight queries that don't impact streaming
- Top 3 get medal emojis (🥇🥈🥉)

### Security
- RLS policies enforce access control
- Only creators can view their own payout requests
- Only admins can approve/reject payouts
- Payment details are private

## 🐛 Troubleshooting

### Payout Request Fails

```typescript
// Check wallet balance
const wallet = await walletService.getOrCreateWallet(userId);
console.log('Balance:', wallet.balance_cents / 100, 'SEK');

// Check minimum amount
if (amountCents < 10000) {
  console.error('Amount below minimum (100 SEK)');
}

// Check if user has sufficient balance
if (wallet.balance_cents < amountCents) {
  console.error('Insufficient balance');
}
```

### Leaderboard Not Updating

```typescript
// Check if data exists
const gifts = await supabase
  .from('gift_transactions')
  .select('*')
  .eq('receiver_id', creatorId);

console.log('Gift transactions:', gifts.data?.length);

// Check if stream ID is correct
const stream = await supabase
  .from('streams')
  .select('*')
  .eq('id', streamId)
  .single();

console.log('Stream:', stream.data);
```

### Admin Can't See Payout Requests

```typescript
// Check admin role
const { data: adminRole } = await supabase
  .from('admin_roles')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log('Admin role:', adminRole?.role);

// Must be HEAD_ADMIN or ADMIN
if (!adminRole || !['HEAD_ADMIN', 'ADMIN'].includes(adminRole.role)) {
  console.error('User is not an admin');
}
```

## 📞 Support

For issues or questions:
1. Check the main implementation document: `PAYOUT_LEADERBOARD_IMPLEMENTATION.md`
2. Review the service code for detailed implementation
3. Check RLS policies in Supabase dashboard
4. Verify user roles and permissions

---

**Last Updated**: January 2025
**Version**: 1.0
