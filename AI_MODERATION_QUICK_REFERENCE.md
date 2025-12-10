
# AI Moderation System - Quick Reference

## 🚀 Quick Start

### 1. Moderate a Chat Message
```typescript
import { aiModerationService } from '@/services/aiModerationService';

const result = await aiModerationService.moderateMessage(
  userId,
  messageText,
  streamId
);

if (!result.allowed) {
  // Message blocked
  return;
}
```

### 2. Validate Username
```typescript
const validation = await aiModerationService.validateUsername(
  userId,
  newUsername,
  newBio
);

if (!validation.allowed) {
  Alert.alert('Error', validation.message);
  return;
}
```

### 3. Check if User is Banned
```typescript
const isBanned = await aiModerationService.isUserBannedFromCreator(
  userId,
  creatorId
);

if (isBanned) {
  // Prevent access
}
```

### 4. Apply Strike
```typescript
await aiModerationService.applyStrike(
  userId,
  creatorId,
  'chat_violation',
  'Repeated harassment'
);
```

### 5. Log Stream Warning
```typescript
await aiModerationService.logStreamWarning(
  streamId,
  0.75,
  'profanity'
);
```

---

## 📊 Threshold Actions

| Score | Action | Description |
|-------|--------|-------------|
| < 0.30 | Allow | Message passes |
| ≥ 0.30 | Flag | Silent flag |
| ≥ 0.50 | Hide | Hidden from others |
| ≥ 0.70 | Timeout | 2 min timeout |
| ≥ 0.85 | Block | Blocked from stream |

---

## 🎯 Strike System

| Strike | Action | Duration |
|--------|--------|----------|
| 1st | Warning | 30 days |
| 2nd | Timeout 10 min | 30 days |
| 3rd | Stream-ban | 24 hours |
| 4th | Permanent ban | Forever |

---

## 🗄️ Database Tables

- `user_violations` - All moderation actions
- `username_moderation_log` - Rejected usernames
- `ai_strikes` - Strike history
- `ai_stream_warnings` - Stream content warnings
- `timed_out_users_v2` - Active timeouts

---

## 👮 Admin Access

**Roles:** HEAD_ADMIN, ADMIN, SUPPORT

**Screen:** `app/screens/AdminAIModerationScreen.tsx`

**Actions:**
- Approve/delete violations
- Apply/remove bans
- Extend timeouts
- View reports

---

## 🔧 Integration Points

1. **Chat messages** - Before sending
2. **Post comments** - Before posting
3. **Story comments** - Before posting
4. **Inbox messages** - Before sending
5. **Profile updates** - Before saving
6. **Stream joining** - Before allowing

---

## 🤖 AI API Setup

### OpenAI (Recommended)
```typescript
const response = await fetch('https://api.openai.com/v1/moderations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({ input: message })
});
```

### Environment Variable
```
OPENAI_API_KEY=sk-...
```

---

## 📈 Key Metrics

- Moderation rate
- False positive rate
- Response time
- Action distribution
- Repeat offenders
- Category trends

---

## 🔒 Privacy

- **Retention:** 90 days for violations
- **User rights:** View own violations, appeal strikes
- **GDPR:** Encrypted, exportable, deletable

---

## ⚠️ Important Notes

1. **No stream interruption** - Moderation never stops streams
2. **Creator-specific bans** - Not platform-wide
3. **Fail open** - Allow message if AI fails
4. **Async processing** - Don't block on AI response
5. **Cache responses** - For identical messages

---

## 🐛 Troubleshooting

### Messages not moderated
- Check AI API key
- Verify service is called
- Check database permissions

### False positives
- Adjust thresholds
- Add whitelist
- Improve AI prompts

### Performance issues
- Enable caching
- Use async processing
- Scale AI API tier

---

## 📚 Full Documentation

See `AI_MODERATION_IMPLEMENTATION.md` for complete details.
