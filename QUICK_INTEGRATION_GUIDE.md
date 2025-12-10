
# Quick Integration Guide
## Achievements, Replays & Leaderboards

This guide shows you exactly where and how to integrate the three new systems into your existing Roast Live app.

---

## 1. Achievements Integration

### A. Track User Actions

Add achievement checks after key user actions:

**After viewing a stream:**
```typescript
// In ViewerScreen.tsx or wherever stream viewing is tracked
import { achievementService } from '@/app/services/achievementService';

useEffect(() => {
  if (user && streamId) {
    achievementService.checkAndUnlockAchievements(user.id, 'view');
  }
}, [user, streamId]);
```

**After posting a comment:**
```typescript
// In chat/comment submission handler
const handleSendComment = async (message: string) => {
  // ... existing comment logic ...
  
  if (user) {
    await achievementService.checkAndUnlockAchievements(user.id, 'comment');
  }
};
```

**After liking content:**
```typescript
// In like button handler
const handleLike = async () => {
  // ... existing like logic ...
  
  if (user) {
    await achievementService.checkAndUnlockAchievements(user.id, 'like');
  }
};
```

**After sending a gift:**
```typescript
// In gift sending handler
const handleSendGift = async (giftId: string) => {
  // ... existing gift logic ...
  
  if (user) {
    await achievementService.checkAndUnlockAchievements(user.id, 'gift_sent');
  }
};
```

**After following someone:**
```typescript
// In follow button handler
const handleFollow = async (targetUserId: string) => {
  // ... existing follow logic ...
  
  if (user) {
    await achievementService.checkAndUnlockAchievements(user.id, 'follow');
  }
};
```

**After stream ends (for creator):**
```typescript
// In BroadcasterScreen.tsx when stopping stream
const handleStopStream = async () => {
  // ... existing stop stream logic ...
  
  if (user) {
    await achievementService.checkAndUnlockAchievements(user.id, 'stream_completed');
  }
};
```

### B. Display Badges in Chat

**In ChatBubble.tsx or chat message component:**
```typescript
import { achievementService } from '@/app/services/achievementService';
import { AchievementBadge } from '@/components/AchievementBadge';

// Inside your chat message component
const [userBadges, setUserBadges] = useState<string[]>([]);

useEffect(() => {
  loadUserBadges();
}, [message.user_id]);

const loadUserBadges = async () => {
  const badges = await achievementService.getSelectedBadges(message.user_id);
  if (badges) {
    const badgeKeys = [badges.badge_1, badges.badge_2, badges.badge_3].filter(Boolean);
    setUserBadges(badgeKeys);
  }
};

// In your render:
<View style={styles.messageHeader}>
  <Text style={styles.username}>{message.username}</Text>
  <View style={styles.badgesContainer}>
    {userBadges.map((badgeKey) => {
      const achievement = allAchievements.find(a => a.achievement_key === badgeKey);
      return achievement ? (
        <AchievementBadge
          key={badgeKey}
          emoji={achievement.emoji}
          name={achievement.name}
          size="small"
        />
      ) : null;
    })}
  </View>
</View>
```

### C. Add Achievements Screen to Navigation

**In your profile or settings navigation:**
```typescript
// Add a button/link to navigate to achievements
<TouchableOpacity onPress={() => router.push('/achievements')}>
  <Text>🏆 Achievements</Text>
</TouchableOpacity>
```

---

## 2. Replay System Integration

### A. Show Save Replay Modal After Stream Ends

**In BroadcasterScreen.tsx:**
```typescript
import { SaveReplayModal } from '@/components/SaveReplayModal';
import { replayService } from '@/app/services/replayService';

const [showSaveReplayModal, setShowSaveReplayModal] = useState(false);
const [streamData, setStreamData] = useState<any>(null);

const handleStopStream = async () => {
  // ... existing stop stream logic ...
  
  // Store stream data for replay
  setStreamData({
    streamId: currentStreamId,
    title: streamTitle,
    startedAt: streamStartTime,
    endedAt: new Date().toISOString(),
    cloudflareUrl: cloudflareStreamUrl, // Get from your Cloudflare integration
    thumbnailUrl: thumbnailUrl, // Optional
  });
  
  // Show save replay modal
  setShowSaveReplayModal(true);
};

// In your render:
<SaveReplayModal
  visible={showSaveReplayModal}
  onSave={async () => {
    if (user && streamData) {
      await replayService.createReplay(
        streamData.streamId,
        user.id,
        streamData.cloudflareUrl,
        streamData.title,
        streamData.startedAt,
        streamData.endedAt,
        streamData.thumbnailUrl
      );
    }
  }}
  onDelete={async () => {
    // Just close, don't save
    console.log('Replay not saved');
  }}
  onClose={() => setShowSaveReplayModal(false)}
/>
```

### B. Add Replays Tab to Profile

**In your profile screen (e.g., app/(tabs)/profile.tsx):**
```typescript
import ReplaysTabScreen from '@/app/screens/ReplaysTabScreen';

// Add a tab for replays
const [activeTab, setActiveTab] = useState<'posts' | 'streams' | 'replays'>('posts');

// In your render:
<View style={styles.tabs}>
  <TouchableOpacity onPress={() => setActiveTab('posts')}>
    <Text>Posts</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => setActiveTab('streams')}>
    <Text>Streams</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => setActiveTab('replays')}>
    <Text>🎥 Replays</Text>
  </TouchableOpacity>
</View>

{activeTab === 'replays' && (
  <ReplaysTabScreen creatorId={profileUserId} />
)}
```

### C. Navigate to Replay Player

**From anywhere in your app:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// When user clicks on a replay
const handleReplayClick = (replayId: string) => {
  router.push(`/replay-player?replayId=${replayId}`);
};
```

---

## 3. Leaderboards Integration

### A. Add Leaderboards to Explore Screen

**In app/(tabs)/explore.tsx:**
```typescript
import { GlobalLeaderboardTabs } from '@/components/GlobalLeaderboardTabs';

// Add at the top of your Explore screen
<ScrollView>
  <View style={styles.leaderboardSection}>
    <Text style={styles.sectionTitle}>🏆 Leaderboards</Text>
    <GlobalLeaderboardTabs />
  </View>
  
  {/* Rest of your explore content */}
</ScrollView>
```

### B. Show User Rank on Profile

**In profile screen:**
```typescript
import { globalLeaderboardService } from '@/app/services/globalLeaderboardService';

const [userRank, setUserRank] = useState<number | null>(null);

useEffect(() => {
  loadUserRank();
}, [userId]);

const loadUserRank = async () => {
  const rank = await globalLeaderboardService.getUserRank(userId, 'top_creators');
  setUserRank(rank);
};

// In your render:
{userRank && (
  <View style={styles.rankBadge}>
    <Text style={styles.rankText}>#{userRank} Top Creator</Text>
  </View>
)}
```

### C. Show Rank in Stream Dashboard

**In StreamDashboardScreen.tsx:**
```typescript
import { globalLeaderboardService } from '@/app/services/globalLeaderboardService';

const [leaderboardData, setLeaderboardData] = useState<any>(null);

useEffect(() => {
  loadLeaderboardData();
}, [user]);

const loadLeaderboardData = async () => {
  if (!user) return;
  
  const [rank, history] = await Promise.all([
    globalLeaderboardService.getUserRank(user.id, 'top_creators'),
    globalLeaderboardService.getUserHistory(user.id, 'top_creators', 5),
  ]);
  
  setLeaderboardData({ rank, history });
};

// In your render:
<View style={styles.leaderboardSection}>
  <Text style={styles.sectionTitle}>Your Ranking</Text>
  {leaderboardData?.rank ? (
    <>
      <Text style={styles.currentRank}>Current Rank: #{leaderboardData.rank}</Text>
      <Text style={styles.historyTitle}>Recent History:</Text>
      {leaderboardData.history.map((entry: any) => (
        <Text key={entry.id}>
          Week of {entry.week_start_date}: #{entry.rank}
        </Text>
      ))}
    </>
  ) : (
    <Text style={styles.noRank}>Not ranked yet this week</Text>
  )}
</View>
```

### D. Setup Weekly Calculation (Cron Job)

**Option 1: Supabase Cron (Recommended)**

Add to your `supabase/config.toml`:
```toml
[functions.calculate-leaderboards]
verify_jwt = false

[functions.calculate-leaderboards.cron]
schedule = "0 0 * * 0" # Every Sunday at midnight
```

**Option 2: Manual Trigger**

Create an admin panel button:
```typescript
const handleCalculateLeaderboards = async () => {
  const { data, error } = await supabase.functions.invoke('calculate-leaderboards');
  if (error) {
    Alert.alert('Error', 'Failed to calculate leaderboards');
  } else {
    Alert.alert('Success', 'Leaderboards calculated successfully');
  }
};
```

---

## 4. Periodic Background Tasks

### Check Watch Time & Spending Achievements

Run these periodically (e.g., every hour or when user opens app):

```typescript
// In your app initialization or periodic task
useEffect(() => {
  const checkPeriodicAchievements = async () => {
    if (!user) return;
    
    // Check watch time achievements
    await achievementService.checkAndUnlockAchievements(user.id, 'watch_time');
    
    // Check spending achievements
    await achievementService.checkAndUnlockAchievements(user.id, 'spending');
  };
  
  checkPeriodicAchievements();
  
  // Run every hour
  const interval = setInterval(checkPeriodicAchievements, 60 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [user]);
```

---

## 5. Testing Checklist

### Achievements
- [ ] View a stream → First View unlocked
- [ ] Post a comment → First Comment unlocked
- [ ] Like content → First Like unlocked
- [ ] Send a gift → First Gift Sent unlocked
- [ ] Follow someone → First Follow unlocked
- [ ] Complete a stream → First Live Stream unlocked
- [ ] Select 3 display badges
- [ ] Verify badges show in chat
- [ ] Receive push notification on unlock

### Replays
- [ ] End a stream → Save Replay modal appears
- [ ] Save replay → Appears in profile Replays tab
- [ ] Delete replay → Doesn't save
- [ ] Play replay → Video plays correctly
- [ ] Add comment → Comment appears
- [ ] Like replay → Like count increases
- [ ] View analytics → Stats are accurate

### Leaderboards
- [ ] View Top Creators leaderboard
- [ ] View Top Fans leaderboard
- [ ] View Trending Creators leaderboard
- [ ] Check user rank on profile
- [ ] View leaderboard history
- [ ] Run weekly calculation
- [ ] Verify data persists to history

---

## 6. Important Notes

1. **No Livestream API Changes**: All systems work independently of livestream start/stop logic
2. **Cloudflare URLs**: Make sure you're getting the correct replay URL from Cloudflare after stream ends
3. **Push Notifications**: Ensure push notification service is configured for achievement unlocks
4. **Weekly Reset**: Leaderboards reset every Sunday at midnight (configure cron job)
5. **Performance**: All queries are optimized with proper indexes
6. **RLS**: All tables have Row Level Security enabled

---

## 7. Support

If you encounter any issues:
1. Check the console logs for errors
2. Verify database tables were created correctly
3. Ensure RLS policies are in place
4. Check that services are imported correctly
5. Verify user authentication is working

For detailed implementation, see `ACHIEVEMENTS_REPLAY_LEADERBOARDS_IMPLEMENTATION.md`
