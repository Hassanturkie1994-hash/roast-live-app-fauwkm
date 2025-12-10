
# AI Moderation Integration Checklist

## ✅ Completed

- [x] Database migration applied
- [x] `aiModerationService.ts` implemented
- [x] `AdminAIModerationScreen.tsx` created
- [x] RLS policies configured
- [x] Database indexes created
- [x] Documentation written

## ⚠️ Required Next Steps

### 1. Integrate AI API (Critical)

**Option A: OpenAI Moderation API (Recommended)**
```bash
# Get API key from https://platform.openai.com/
# Add to environment variables
OPENAI_API_KEY=sk-...
```

**Update `aiModerationService.ts`:**
```typescript
// Replace the classifyMessage method with:
private async classifyMessage(message: string): Promise<ClassificationScores> {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ input: message })
    });

    const data = await response.json();
    const result = data.results[0];

    return {
      toxicity: result.category_scores.hate,
      harassment: result.category_scores.harassment,
      hateSpeech: result.category_scores['hate/threatening'],
      sexualContent: result.category_scores.sexual,
      threat: result.category_scores.violence,
      spam: this.detectSpam(message), // Keep spam detection
      overall: Math.max(...Object.values(result.category_scores))
    };
  } catch (error) {
    console.error('AI API error:', error);
    // Fallback to keyword detection
    return this.keywordBasedClassification(message);
  }
}
```

### 2. Add Integration Points in UI

#### A. Chat Messages (Livestream)
**File:** `components/EnhancedChatOverlay.tsx` or similar

```typescript
import { aiModerationService } from '@/services/aiModerationService';

// Before sending message
const handleSendMessage = async () => {
  if (!messageText.trim()) return;

  // AI Moderation check
  const moderation = await aiModerationService.moderateMessage(
    user.id,
    messageText,
    streamId
  );

  if (!moderation.allowed) {
    // Message was blocked
    if (moderation.action === 'timeout' || moderation.action === 'block') {
      // User was timed out or blocked, show message
      Alert.alert(
        'Message Blocked',
        'Your message violated community guidelines.'
      );
    }
    return;
  }

  // If hidden from others, mark it
  const isHidden = moderation.hiddenFromOthers || false;

  // Send message
  await sendMessage(messageText, isHidden);
  setMessageText('');
};
```

#### B. Post Comments
**File:** `app/screens/CreatePostScreen.tsx` or comment component

```typescript
import { aiModerationService } from '@/services/aiModerationService';

const handlePostComment = async () => {
  // AI Moderation check
  const moderation = await aiModerationService.moderateMessage(
    user.id,
    commentText,
    undefined,
    postId
  );

  if (!moderation.allowed) {
    Alert.alert(
      'Comment Blocked',
      'Your comment violated community guidelines.'
    );
    return;
  }

  // Post comment
  await postComment(commentText);
};
```

#### C. Story Comments
**File:** `app/screens/StoryViewerScreen.tsx` or similar

```typescript
import { aiModerationService } from '@/services/aiModerationService';

const handleStoryComment = async () => {
  // AI Moderation check
  const moderation = await aiModerationService.moderateMessage(
    user.id,
    commentText,
    undefined,
    undefined,
    storyId
  );

  if (!moderation.allowed) {
    Alert.alert(
      'Comment Blocked',
      'Your comment violated community guidelines.'
    );
    return;
  }

  // Post comment
  await postStoryComment(commentText);
};
```

#### D. Inbox Messages
**File:** `app/screens/ChatScreen.tsx` or similar

```typescript
import { aiModerationService } from '@/services/aiModerationService';

const handleSendInboxMessage = async () => {
  // AI Moderation check
  const moderation = await aiModerationService.moderateMessage(
    user.id,
    messageText
  );

  if (!moderation.allowed) {
    Alert.alert(
      'Message Blocked',
      'Your message violated community guidelines.'
    );
    return;
  }

  // Send message
  await sendInboxMessage(messageText);
};
```

#### E. Profile Updates
**File:** `app/screens/EditProfileScreen.tsx`

```typescript
import { aiModerationService } from '@/services/aiModerationService';

const handleSaveProfile = async () => {
  // Validate username and bio
  const validation = await aiModerationService.validateUsername(
    user.id,
    newUsername,
    newBio
  );

  if (!validation.allowed) {
    Alert.alert(
      'Username Restricted',
      validation.message || 'This name is restricted. Please choose another.'
    );
    return;
  }

  // Save profile
  await updateProfile({ username: newUsername, bio: newBio });
};
```

#### F. Stream Joining
**File:** `app/screens/ViewerScreen.tsx` or stream join logic

```typescript
import { aiModerationService } from '@/services/aiModerationService';

const handleJoinStream = async () => {
  // Check if user is banned from this creator
  const isBanned = await aiModerationService.isUserBannedFromCreator(
    user.id,
    creatorId
  );

  if (isBanned) {
    Alert.alert(
      'Access Denied',
      'You are banned from this creator\'s streams.'
    );
    return;
  }

  // Join stream
  await joinStream();
};
```

### 3. Add Admin Dashboard Link

**File:** `app/screens/AdminDashboardScreen.tsx` or similar

```typescript
// Add navigation button
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push('/screens/AdminAIModerationScreen')}
>
  <IconSymbol
    ios_icon_name="shield.checkmark"
    android_material_icon_name="security"
    size={24}
    color={colors.primary}
  />
  <Text style={styles.menuText}>AI Moderation</Text>
</TouchableOpacity>
```

### 4. Test Integration

#### Test Cases
- [ ] Send toxic message in chat → Should be flagged/hidden
- [ ] Send severe violation → Should timeout user
- [ ] Try username "official_admin" → Should be rejected
- [ ] Apply 3 strikes to user → Should ban from creator
- [ ] View violations in admin dashboard → Should display correctly
- [ ] Approve violation as admin → Should remove from list
- [ ] Check banned user can't join stream → Should show error

#### Load Testing
- [ ] Send 100+ messages rapidly → Should handle gracefully
- [ ] Test with AI API rate limits → Should queue or fail open
- [ ] Test with AI API down → Should allow messages (fail open)

### 5. Configure Monitoring

#### Set Up Alerts
```typescript
// Add to monitoring service
if (moderationRate > 0.10) {
  sendAlert('High moderation rate: ' + moderationRate);
}

if (aiApiErrors > 10) {
  sendAlert('AI API experiencing errors');
}

if (repeatOffenders.length > 5) {
  sendAlert('Multiple repeat offenders detected');
}
```

#### Track Metrics
- Moderation rate (% of messages flagged)
- False positive rate (admin-approved violations)
- AI API response time
- Action distribution (flag/hide/timeout/block)
- Repeat offenders count

### 6. Adjust Thresholds (After Testing)

**File:** `app/services/aiModerationService.ts`

```typescript
// Adjust these based on real-world results
const THRESHOLDS = {
  FLAG: 0.30,    // Adjust if too many false positives
  HIDE: 0.50,    // Adjust if too strict/lenient
  TIMEOUT: 0.70, // Adjust based on user feedback
  BLOCK: 0.85,   // Keep high to avoid false bans
};
```

### 7. Add Caching (Optional but Recommended)

```typescript
// Add to aiModerationService.ts
private messageCache = new Map<string, { result: any; timestamp: number }>();
private CACHE_TTL = 3600000; // 1 hour

private async classifyMessage(message: string): Promise<ClassificationScores> {
  // Check cache
  const cached = this.messageCache.get(message);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return cached.result;
  }

  // Call AI API
  const result = await this.callAIAPI(message);

  // Cache result
  this.messageCache.set(message, { result, timestamp: Date.now() });

  return result;
}
```

### 8. Add Rate Limiting (Optional but Recommended)

```typescript
// Add to aiModerationService.ts
private apiCallQueue: Array<() => Promise<any>> = [];
private isProcessingQueue = false;
private MAX_CALLS_PER_MINUTE = 60;

private async queueAPICall<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    this.apiCallQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    this.processQueue();
  });
}

private async processQueue() {
  if (this.isProcessingQueue) return;
  this.isProcessingQueue = true;

  while (this.apiCallQueue.length > 0) {
    const fn = this.apiCallQueue.shift();
    if (fn) await fn();
    await new Promise(resolve => setTimeout(resolve, 1000 / this.MAX_CALLS_PER_MINUTE));
  }

  this.isProcessingQueue = false;
}
```

---

## 📋 Final Checklist

### Critical (Must Do)
- [ ] Integrate AI API (OpenAI recommended)
- [ ] Add moderation to chat messages
- [ ] Add moderation to post comments
- [ ] Add moderation to story comments
- [ ] Add validation to profile updates
- [ ] Add ban check to stream joining
- [ ] Test all integration points
- [ ] Add admin dashboard link

### Important (Should Do)
- [ ] Add caching layer
- [ ] Add rate limiting
- [ ] Set up monitoring/alerts
- [ ] Test with real users
- [ ] Adjust thresholds based on results
- [ ] Document any custom changes

### Optional (Nice to Have)
- [ ] Add multi-language support
- [ ] Implement custom AI models
- [ ] Add sentiment analysis
- [ ] Create user reputation scores
- [ ] Add image/video moderation

---

## 🎯 Success Criteria

The integration is complete when:
1. ✅ AI API is integrated and working
2. ✅ All 6 integration points are implemented
3. ✅ Admin dashboard is accessible
4. ✅ Test cases pass
5. ✅ Monitoring is set up
6. ✅ Thresholds are adjusted
7. ✅ Documentation is updated

---

## 🚀 Deployment

### Pre-Deployment
1. Test thoroughly in development
2. Review all thresholds
3. Set up monitoring
4. Prepare rollback plan

### Deployment Steps
1. Deploy database migration (already done)
2. Deploy code changes
3. Configure AI API key
4. Enable monitoring
5. Monitor closely for first 24 hours

### Post-Deployment
1. Monitor moderation rate
2. Review flagged content
3. Adjust thresholds if needed
4. Gather user feedback
5. Iterate and improve

---

## 📞 Need Help?

- Review `AI_MODERATION_IMPLEMENTATION.md` for detailed guide
- Check `AI_MODERATION_QUICK_REFERENCE.md` for quick examples
- See `AI_MODERATION_SYSTEM_SUMMARY.md` for overview

Good luck with the integration! 🎉
