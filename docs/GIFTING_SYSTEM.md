
# TikTok-Style Gifting System

## Overview

The Roast Live app now includes a complete TikTok-style gifting system that allows viewers to send virtual gifts to streamers during live broadcasts. This is a standalone module that does not affect any existing livestream functionality.

## Features

### 1. Gift Catalog
- **30 unique gifts** ranging from 1 kr to 3500 kr
- Three gift tiers based on price:
  - **Cheap (1-20 kr)**: Small floating animations
  - **Medium (21-500 kr)**: Particle effects, sparkle trails, glowing scale bounce
  - **High (500-3500 kr)**: Full-screen animation burst, confetti, flame FX, neon trails, screen shimmer

### 2. Gift Sending Flow
1. Viewer taps "Send Gift" button during livestream
2. Modal opens showing all 30 gifts
3. Viewer selects a gift
4. System checks wallet balance
5. If sufficient balance:
   - Amount deducted from sender's wallet
   - Amount added to streamer's wallet
   - Transaction records created for both users
   - Gift event stored in database
   - Animation broadcast to all viewers
6. If insufficient balance:
   - Prompt shown: "You need to add money to send gifts"
   - Option to navigate to Add Balance screen

### 3. Gift Animations
- Animations overlay the video stream without interrupting playback
- Visible to both streamer and all viewers in real-time
- Auto-disappear after 1-3 seconds
- Overlay text displays: "{sender_username} sent {gift_name} worth {amount} kr!"
- Text fades out after 3 seconds

#### Animation Effects by Tier

**Cheap Gifts (1-20 kr)**
- Small floating icon animation
- Simple fade in/out
- Minimal visual impact

**Medium Gifts (21-500 kr)**
- Particle effects with sparkles
- Glowing scale bounce
- Multiple animated particles
- More prominent visual presence

**High Gifts (500-3500 kr)**
- Full-screen animation burst
- Confetti rain effect (20 particles)
- Screen shimmer overlay
- Golden color scheme
- Maximum visual impact

### 4. Real-time Broadcasting
- Gift events broadcast via Supabase Realtime channels
- All viewers see gift animations simultaneously
- Broadcaster sees gift animations on their stream
- No delay or lag in gift display

### 5. Economy Integration
- Fully integrated with existing wallet system
- Automatic balance updates for sender and receiver
- Transaction history tracking
- Support for multiple payment methods (Stripe, PayPal)

## Complete Gift List

| Gift Name | Price (kr) | Tier | Description |
|-----------|-----------|------|-------------|
| Spicy Roast | 1 | Cheap | A hot take that burns! |
| Clown Hammer | 5 | Cheap | Bonk! Make them look silly |
| Mic Drop | 9 | Cheap | Drop the mic and walk away |
| Smoke Grenade | 12 | Cheap | Disappear in style |
| Cry-Laugh Blast | 16 | Cheap | So funny it hurts! |
| Chili Punch | 25 | Medium | Spicy and painful! |
| Roast Bomb | 39 | Medium | Explosive roast |
| Lightning Roast | 55 | Medium | Strike fast and hard |
| Trash Trophy | 69 | Medium | Award for the worst take |
| Roast Crown | 99 | Medium | Crown the king of roasts |
| Fire Extinguisher | 120 | Medium | Put out weak arguments |
| Diamond Roast Badge | 179 | Medium | Premium roast badge |
| Savage Banner | 249 | Medium | Display savage status |
| Echo Microphone | 299 | Medium | Amplify the roast |
| Roast Rocket | 349 | Medium | Launch into orbit! |
| Viral Spotlight | 499 | Medium | Put them in the spotlight |
| Gold Flame | 699 | High | Burn bright with gold |
| Laser Roast Beam | 899 | High | Precision roasting |
| Premium Golden Mask | 1199 | High | Hide their shame |
| Roast Throne | 1499 | High | Sit on the throne |
| Meteor Slam | 1799 | High | Devastating impact |
| Phoenix Flame | 1999 | High | Rise from the ashes |
| Galactic Crown | 2200 | High | Rule the galaxy |
| Royal Roast Orb | 2400 | High | Channel royal power |
| Platinum Medal | 2600 | High | Highest honor |
| Supernova Roast | 2800 | High | Explode like a star |
| Infinite Spotlight | 2999 | High | Eternal fame |
| Golden Tornado | 3200 | High | Golden whirlwind |
| Supreme Roast Sword | 3400 | High | Ultimate weapon |
| Ultimate Roast Explosion | 3500 | High | The final word |

## Technical Implementation

### Database Schema

**gifts table**
- `id` (uuid, primary key)
- `name` (text)
- `description` (text)
- `price_sek` (integer)
- `icon_url` (text, nullable)
- `animation_url` (text, nullable)
- `created_at` (timestamp)

**gift_events table**
- `id` (uuid, primary key)
- `sender_user_id` (uuid, foreign key → profiles.id)
- `receiver_user_id` (uuid, foreign key → profiles.id)
- `gift_id` (uuid, foreign key → gifts.id)
- `price_sek` (integer)
- `livestream_id` (uuid, foreign key → streams.id, nullable)
- `created_at` (timestamp)

### Key Components

1. **GiftSelector** (`components/GiftSelector.tsx`)
   - Modal component for gift selection
   - Displays all 30 gifts in a grid
   - Shows wallet balance
   - Handles gift purchase flow
   - Color-coded by tier

2. **GiftAnimationOverlay** (`components/GiftAnimationOverlay.tsx`)
   - Renders gift animations
   - Handles animation lifecycle
   - Tier-specific effects
   - Particle systems for medium/high tiers
   - Confetti and shimmer effects for high tier

3. **giftService** (`app/services/giftService.ts`)
   - `fetchGifts()`: Get all available gifts
   - `purchaseGift()`: Handle gift purchase transaction
   - `fetchGiftEvents()`: Get gift history
   - `getGiftTier()`: Determine gift tier by price

### Real-time Channels

**Viewer Channel**: `stream:{streamId}:gifts`
- Broadcasts gift events to all viewers
- Event: `gift_sent`
- Payload: `{ gift_name, sender_username, amount }`

**Broadcaster Channel**: `stream:{streamId}:gifts`
- Same channel as viewers
- Broadcaster receives all gift events
- Displays animations on broadcaster's screen

## Usage

### For Viewers

1. Watch a live stream
2. Tap "Send Gift" button (right side action buttons)
3. Browse and select a gift
4. Confirm purchase
5. Watch the animation appear on screen
6. Animation visible to everyone watching

### For Broadcasters

1. Start a live stream
2. Receive gift notifications automatically
3. See gift animations overlay on camera view
4. Earnings automatically added to wallet
5. View gift history in transaction records

### For Developers

```typescript
// Send a gift
import { purchaseGift } from '@/app/services/giftService';

const result = await purchaseGift(
  giftId,
  senderId,
  receiverId,
  livestreamId
);

if (result.success) {
  // Broadcast to all viewers
  channel.send({
    type: 'broadcast',
    event: 'gift_sent',
    payload: result.giftEvent
  });
}
```

## Important Notes

- ✅ Does NOT modify streaming logic
- ✅ Does NOT affect RTC or Cloudflare integration
- ✅ Purely additive UI layer
- ✅ Fully integrated with existing wallet system
- ✅ Real-time synchronization across all viewers
- ✅ Automatic balance management
- ✅ Transaction history tracking
- ✅ RLS policies enforced on all tables

## Future Enhancements

Potential improvements for future versions:

1. Custom gift animations (Lottie files)
2. Gift combos (send multiple gifts at once)
3. Gift leaderboards
4. Special effects for gift streaks
5. Seasonal/limited edition gifts
6. Gift reactions from broadcaster
7. Gift sound effects
8. Gift statistics and analytics
