
# Quick Reference Guide - New Features

## 🎯 Quick Navigation

### Screen Routes
```typescript
// Public Profile
router.push(`/screens/PublicProfileScreen?userId=${userId}`);

// VIP Club Dashboard (Creators Only)
router.push('/screens/VIPClubDashboardScreen');

// Stream Revenue
router.push('/screens/StreamRevenueScreen');

// Wallet
router.push('/screens/WalletScreen');

// Gift Store
router.push('/screens/GiftInformationScreen');
```

## 💰 Wallet & Transactions

### Create Wallet Transaction
```typescript
import { walletTransactionService } from '@/app/services/walletTransactionService';

await walletTransactionService.createWalletTransaction(
  userId,
  amount, // positive for deposit, negative for withdrawal
  'deposit', // 'deposit' | 'withdraw' | 'gift_received' | 'gift_sent'
  'SEK'
);
```

### Get Transaction History
```typescript
const { data, error } = await walletTransactionService.fetchWalletTransactions(
  userId,
  50 // limit
);
```

## 🎁 Gift System

### Send Gift
```typescript
import { giftTransactionService } from '@/app/services/giftTransactionService';

const result = await giftTransactionService.createGiftTransaction(
  senderId,
  receiverId,
  giftId,
  amount,
  streamId // optional
);
```

### Get Gift History
```typescript
const { data, error } = await giftTransactionService.fetchGiftTransactions(
  userId,
  'received', // 'sent' | 'received' | 'all'
  50
);
```

## 👑 VIP Memberships

### Create VIP Membership
```typescript
import { vipMembershipService } from '@/app/services/vipMembershipService';

const result = await vipMembershipService.createVIPMembership(
  ownerId,
  subscriberId,
  'VIP', // badge text (max 5 chars)
  1 // duration in months
);
```

### Check VIP Status
```typescript
const isVIP = await vipMembershipService.isVIPMember(ownerId, subscriberId);
```

### Get VIP Badge
```typescript
const badge = await vipMembershipService.getVIPBadge(ownerId, subscriberId);
// Returns: { badgeText: 'VIP', badgeColor: '#FF1493' } or null
```

## 💬 Inbox & Messages

### Auto-Mark Messages as Read
```typescript
import { inboxService } from '@/app/services/inboxService';

await inboxService.markConversationAsRead(conversationId, userId);
```

### Get Unread Count
```typescript
const unreadCount = await inboxService.getUnreadMessageCount(userId);
```

## 🎬 Livestream Components

### Gift Overlay
```typescript
import EnhancedGiftOverlay from '@/components/EnhancedGiftOverlay';

<EnhancedGiftOverlay
  visible={showGift}
  senderName="John Doe"
  giftName="Fire Rose"
  giftEmoji="🌹🔥"
  amount={50}
  onComplete={() => setShowGift(false)}
/>
```

### Exit Prevention Modal
```typescript
import LivestreamExitModal from '@/components/LivestreamExitModal';

<LivestreamExitModal
  visible={showExitModal}
  onClose={() => setShowExitModal(false)}
/>
```

### Viewer Profile Modal
```typescript
import ViewerProfileModal from '@/components/ViewerProfileModal';

<ViewerProfileModal
  visible={showViewerModal}
  onClose={() => setShowViewerModal(false)}
  userId={selectedViewerId}
  streamerId={currentUser.id}
  onAction={() => refreshViewerList()}
/>
```

## 🔔 Edge Function Triggers

### Gift Sent Trigger
**Automatically fires when:** Gift event is created
**Actions:** Updates wallets, creates transactions, sends notifications, broadcasts to stream

### VIP Subscription Trigger
**Automatically fires when:** VIP membership is created
**Actions:** Creates badge, sends notifications, updates profile

### Moderator Ban Trigger
**Automatically fires when:** Moderation action is logged
**Actions:** Creates ban record, prevents re-entry, sends notifications

## 📊 Database Tables

### wallet_transactions
```sql
SELECT * FROM wallet_transactions WHERE user_id = 'user-uuid';
```

### gift_transactions
```sql
SELECT * FROM gift_transactions WHERE receiver_id = 'user-uuid';
```

### vip_memberships
```sql
SELECT * FROM vip_memberships WHERE vip_owner_id = 'user-uuid' AND is_active = true;
```

## 🎨 Theme Usage

```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { colors, theme, toggleTheme } = useTheme();

// Use colors
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

## 🔐 RLS Policies

All tables have Row Level Security enabled:
- Users can view their own data
- VIP owners can manage their memberships
- Secure wallet operations
- Proper moderation permissions

## 📱 Common Patterns

### Check if user can create VIP club
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('total_streaming_hours')
  .eq('id', userId)
  .single();

const canCreate = profile.total_streaming_hours >= 10;
```

### Get wallet balance
```typescript
const { data: wallet } = await supabase
  .from('wallet')
  .select('balance')
  .eq('user_id', userId)
  .single();

const balance = parseFloat(wallet.balance);
```

### Check if user is banned
```typescript
const { data: ban } = await supabase
  .from('banned_users')
  .select('id')
  .eq('streamer_id', streamerId)
  .eq('user_id', userId)
  .single();

const isBanned = !!ban;
```

## 🚨 Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await someService.someFunction();
  if (result.success) {
    // Success
  } else {
    Alert.alert('Error', result.error || 'Something went wrong');
  }
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', 'An unexpected error occurred');
}
```

## 🎯 Best Practices

1. **Always check user authentication** before accessing services
2. **Use theme colors** for consistent styling
3. **Handle loading states** with ActivityIndicator
4. **Show confirmation dialogs** for destructive actions
5. **Log errors** for debugging
6. **Use proper TypeScript types** from services
7. **Test on both light and dark themes**
8. **Validate user input** before API calls
9. **Show success/error messages** to users
10. **Keep components under 500 lines** - split if needed

## 📞 Support

For issues or questions:
1. Check console logs for errors
2. Verify database tables exist
3. Check RLS policies
4. Ensure Edge Functions are deployed
5. Test with different user roles

---

**All features are production-ready and fully integrated!** 🚀
