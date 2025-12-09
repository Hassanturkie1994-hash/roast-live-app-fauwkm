
# Gift System Usage Guide

## For Users

### Adding Balance to Your Wallet

1. **Navigate to Wallet**:
   - Go to your Profile
   - Tap on your balance card, OR
   - Tap Settings > ALLMÄNT > Saldo

2. **Add Balance**:
   - Tap "Add Balance" button
   - Enter amount (1-1000 SEK) or use quick select
   - Choose payment method (Stripe or PayPal)
   - Tap "ADD BALANCE"
   - Wait for confirmation

3. **View Transactions**:
   - See recent transactions on Wallet screen
   - Tap "View All" for complete history

### Viewing Available Gifts

1. **Navigate to Gift Information**:
   - Go to Profile > Settings
   - Tap ALLMÄNT > Gift Information

2. **Browse Gifts**:
   - Scroll through gift grid
   - Tap any gift to see details
   - View price, description, and usage

### Sending Gifts During Live Streams

1. **Open Gift Selector**:
   - While watching a live stream
   - Tap the gift icon (🎁)

2. **Select Gift**:
   - Browse available gifts
   - Check your balance at the top
   - Grayed-out gifts = insufficient balance
   - Tap to select a gift

3. **Confirm Purchase**:
   - Review selected gift and price
   - Tap "SEND GIFT"
   - Wait for confirmation
   - Gift animation will play (future feature)

### Gift Tiers

**Budget Roasts** (1-25 SEK)
- Perfect for friendly banter
- Light-hearted roasts

**Mid-Tier Burns** (50-300 SEK)
- Serious roasting territory
- Show you mean business

**Premium Flames** (400-1000 SEK)
- Elite roaster status
- Legendary burns

**Ultimate Destruction** (1200-3000 SEK)
- God-tier roasting
- Maximum impact

---

## For Developers

### Integrating Gift Selector

```typescript
import GiftSelector from '@/components/GiftSelector';
import { useState } from 'react';

function LiveStreamScreen() {
  const [showGifts, setShowGifts] = useState(false);
  const streamerId = 'broadcaster-user-id';
  const streamerName = 'StreamerUsername';

  return (
    <>
      {/* Your live stream UI */}
      <TouchableOpacity onPress={() => setShowGifts(true)}>
        <IconSymbol ios_icon_name="gift.fill" />
      </TouchableOpacity>

      {/* Gift Selector Modal */}
      <GiftSelector
        visible={showGifts}
        onClose={() => setShowGifts(false)}
        receiverId={streamerId}
        receiverName={streamerName}
      />
    </>
  );
}
```

### Using Gift Service

```typescript
import { fetchGifts, purchaseGift } from '@/app/services/giftService';

// Fetch all gifts
const { data: gifts, error } = await fetchGifts();

// Purchase a gift
const result = await purchaseGift(
  giftId,
  senderId,
  receiverId
);

if (result.success) {
  console.log('Gift sent successfully!');
} else {
  console.error('Error:', result.error);
}
```

### Checking Wallet Balance

```typescript
import { supabase } from '@/app/integrations/supabase/client';

const { data, error } = await supabase
  .from('wallet')
  .select('balance')
  .eq('user_id', userId)
  .single();

const balance = parseFloat(data.balance);
```

### Listening to Gift Events (Future)

```typescript
// Subscribe to gift events for a stream
const channel = supabase
  .channel('gift-events')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'gift_events',
      filter: `receiver_user_id=eq.${streamerId}`,
    },
    (payload) => {
      console.log('New gift received!', payload);
      // Trigger animation
      playGiftAnimation(payload.new.gift_id);
    }
  )
  .subscribe();
```

---

## Gift Animation Integration (Future)

### Recommended Approach

1. **Use Lottie Animations**:
   ```bash
   npm install lottie-react-native
   ```

2. **Create Animation Component**:
   ```typescript
   import LottieView from 'lottie-react-native';

   function GiftAnimation({ giftId, onComplete }) {
     const gift = gifts.find(g => g.id === giftId);
     
     return (
       <LottieView
         source={{ uri: gift.animation_url }}
         autoPlay
         loop={false}
         onAnimationFinish={onComplete}
         style={styles.animation}
       />
     );
   }
   ```

3. **Overlay on Stream**:
   ```typescript
   {showAnimation && (
     <View style={styles.animationOverlay}>
       <GiftAnimation
         giftId={currentGift.id}
         onComplete={() => setShowAnimation(false)}
       />
     </View>
   )}
   ```

---

## Troubleshooting

### "Insufficient Balance" Error
- Check wallet balance
- Add funds via Add Balance screen
- Minimum: 1 SEK, Maximum: 1000 SEK per transaction

### Gift Purchase Failed
- Check internet connection
- Verify wallet has sufficient balance
- Try again or contact support

### Balance Not Updating
- Pull to refresh on Wallet screen
- Check transaction history
- Verify payment was successful

### Can't See Gifts
- Ensure you're on latest app version
- Check internet connection
- Try restarting the app

---

## Best Practices

### For Users
1. Keep some balance for spontaneous gifts
2. Check gift descriptions before sending
3. Send appropriate gifts for the context
4. Don't spam gifts (be respectful)

### For Developers
1. Always validate balance before purchase
2. Handle errors gracefully
3. Show loading states during transactions
4. Implement retry logic for network failures
5. Log all transactions for debugging
6. Test edge cases (concurrent purchases, etc.)

---

## Support

For issues or questions:
1. Check transaction history
2. Verify wallet balance
3. Review gift event logs
4. Contact support with transaction ID
