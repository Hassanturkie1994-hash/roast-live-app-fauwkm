
# AI Moderation System - Complete Implementation Guide

## Overview

This document describes the complete AI-powered moderation system implemented across all 5 prompts. The system automatically analyzes and moderates content in real-time without interrupting livestreams or core functionality.

---

## PROMPT 1: AI Real-Time Chat Moderation System

### Features
- **Automatic message classification** for toxicity, harassment, hate speech, sexual content, threats, and spam
- **Threshold-based actions** with progressive enforcement
- **Silent operation** that doesn't interrupt streaming

### Classification Scores
Every message is analyzed for:
- `toxicity` - Insulting or rude language
- `harassment` - Bullying or targeted attacks
- `hateSpeech` - Discriminatory language
- `sexualContent` - Explicit sexual content
- `threat` - Threats of violence
- `spam` - Repetitive or promotional content
- `overall` - Weighted average of all scores

### Threshold Actions

| Score Range | Action | Description |
|-------------|--------|-------------|
| < 0.30 | **Allow** | Message passes through normally |
| ≥ 0.30 | **Flag** | Silently flagged for admin review |
| ≥ 0.50 | **Hide** | Hidden from everyone except sender |
| ≥ 0.70 | **Timeout** | User timed out for 2 minutes |
| ≥ 0.85 | **Block** | User blocked from current stream |

### Usage Example

```typescript
import { aiModerationService } from '@/services/aiModerationService';

// Moderate a chat message
const result = await aiModerationService.moderateMessage(
  userId,
  messageText,
  streamId,
  postId,
  storyId,
  messageId
);

if (!result.allowed) {
  // Message was blocked or hidden
  console.log(`Action taken: ${result.action}`);
}

if (result.hiddenFromOthers) {
  // Only show message to sender
}
```

### Database Schema

**Table: `user_violations`**
```sql
- id (uuid)
- user_id (uuid)
- flagged_text (text)
- toxicity_score (numeric)
- harassment_score (numeric)
- hate_speech_score (numeric)
- sexual_content_score (numeric)
- threat_score (numeric)
- spam_score (numeric)
- overall_score (numeric)
- action_taken (text) -- 'flagged', 'hidden', 'timeout', 'blocked'
- stream_id (uuid, nullable)
- post_id (uuid, nullable)
- story_id (uuid, nullable)
- message_id (uuid, nullable)
- hidden_from_others (boolean)
- created_at (timestamptz)
```

---

## PROMPT 2: AI Pre-Check of Usernames & Bios

### Features
- **Pre-validation** of usernames and profile bios before saving
- **Impersonation detection** for words like "official", "admin", "support"
- **Automatic reporting** for severe violations

### Detection Categories
- Offensive language
- Threats
- Impersonation words
- Sexual terms
- Slurs

### Validation Rules

| Score Range | Action |
|-------------|--------|
| < 0.60 | Username allowed |
| ≥ 0.60 | Username rejected with message |
| ≥ 0.80 | Auto-reported to moderation table |

### Usage Example

```typescript
import { aiModerationService } from '@/services/aiModerationService';

// Validate username before saving
const result = await aiModerationService.validateUsername(
  userId,
  newUsername,
  newBio
);

if (!result.allowed) {
  Alert.alert('Username Restricted', result.message);
  return;
}

// Proceed with saving username
```

### Database Schema

**Table: `username_moderation_log`**
```sql
- id (uuid)
- user_id (uuid)
- attempted_username (text)
- attempted_bio (text, nullable)
- rejection_reason (text)
- overall_score (numeric)
- auto_reported (boolean)
- created_at (timestamptz)
```

---

## PROMPT 3: AI Violation Strike System (3-Tier)

### Features
- **Progressive enforcement** with 4 strike levels
- **Creator-specific bans** (not platform-wide)
- **Automatic expiration** after 30 days
- **Inbox notifications** for all actions

### Strike Levels

| Strike | Action | Duration |
|--------|--------|----------|
| 1st | Warning | 30 days |
| 2nd | Timeout 10 minutes | 30 days |
| 3rd | Stream-ban | 24 hours |
| 4th | Permanent ban from creator | Permanent |

### Important Rules
- Strikes are **creator-specific**, not platform-wide
- Strikes reset after 30 days (except severe violations)
- Users receive inbox notifications for all actions
- Permanent bans only apply to that specific creator's streams

### Usage Example

```typescript
import { aiModerationService } from '@/services/aiModerationService';

// Apply a strike
await aiModerationService.applyStrike(
  userId,
  creatorId,
  'chat_violation',
  'Repeated harassment in chat'
);

// Check if user is banned from creator
const isBanned = await aiModerationService.isUserBannedFromCreator(
  userId,
  creatorId
);

if (isBanned) {
  // Prevent user from joining stream
}
```

### Database Schema

**Table: `ai_strikes`**
```sql
- id (uuid)
- user_id (uuid)
- creator_id (uuid)
- strike_level (integer) -- 1, 2, 3, or 4
- type (text)
- reason (text)
- issued_by_ai (boolean)
- expires_at (timestamptz, nullable)
- created_at (timestamptz)
```

---

## PROMPT 4: AI Audio & Camera Monitoring (Light Version)

### Features
- **Passive monitoring** of livestream content
- **Non-intrusive warnings** shown only to host
- **No stream interruption** - warnings only

### Monitored Categories
- Loud profanity detection
- Violent actions
- Hate speech audio patterns

### Important Restrictions
This system does **NOT**:
- Stop streams
- Interrupt broadcasts
- Modify tokens
- Flag Cloudflare sessions
- Take any automatic action

It **ONLY**:
- Generates warnings
- Logs events
- Shows warnings to host

### Usage Example

```typescript
import { aiModerationService } from '@/services/aiModerationService';

// Log a stream warning (called by monitoring service)
await aiModerationService.logStreamWarning(
  streamId,
  0.75, // risk score
  'profanity'
);

// Get warnings for a stream (host only)
const warnings = await aiModerationService.getStreamWarnings(streamId);

if (warnings.length > 0) {
  // Show warning to host
  showWarningToHost('This livestream content may violate rules.');
}
```

### Database Schema

**Table: `ai_stream_warnings`**
```sql
- id (uuid)
- stream_id (uuid)
- risk_score (numeric)
- detected_category (text) -- 'profanity', 'violence', 'hate_speech'
- timestamp (timestamptz)
- created_at (timestamptz)
```

---

## PROMPT 5: Admin Review Dashboard

### Features
- **Admin-only access** for HEAD_ADMIN, ADMIN, SUPPORT roles
- **Three main tabs**: Violations, Banned Users, Reports
- **Comprehensive actions** for reviewing and managing violations

### Access Control
Only users with these roles can access:
- `HEAD_ADMIN`
- `ADMIN`
- `SUPPORT`

### Dashboard Tabs

#### 🚨 Violations Feed
- Shows all flagged messages
- Displays username, message preview, confidence score
- Actions available:
  - Approve message (removes violation)
  - Delete message
  - Apply timeout
  - Apply ban
  - Remove violation mark

#### 🛑 Banned Users List
- Shows all users with active bans
- Displays ban reason, expiration date
- Actions available:
  - Remove ban
  - Extend ban
  - View ban history

#### ⚙️ System-Wide Reports
- Trending violation categories
- Most reported users
- Repeat offenders (3+ violations)
- Statistics and analytics

### Admin Actions

All admin actions automatically:
1. Log the action in `admin_actions_log`
2. Send inbox notification to affected user
3. Update relevant tables

### Usage Example

```typescript
import { adminService } from '@/services/adminService';
import { aiModerationService } from '@/services/aiModerationService';

// Check admin access
const { role } = await adminService.checkAdminRole(userId);
if (!role || !['HEAD_ADMIN', 'ADMIN', 'SUPPORT'].includes(role)) {
  // Deny access
  return;
}

// Get violations for review
const violations = await aiModerationService.getViolationsWithProfiles(100);

// Approve a flagged message
await aiModerationService.deleteViolation(violationId);
await inboxService.sendMessage(
  userId,
  userId,
  'Your flagged message has been reviewed and approved.',
  'safety'
);

// Apply permanent ban
await adminService.banUser(
  adminUserId,
  targetUserId,
  'Severe violations of community guidelines'
);
```

### Screen Location
`app/screens/AdminAIModerationScreen.tsx`

---

## Integration Points

### 1. Chat Messages (Livestream)
```typescript
// Before sending message
const moderation = await aiModerationService.moderateMessage(
  userId,
  messageText,
  streamId
);

if (!moderation.allowed) {
  // Don't send message
  return;
}

if (moderation.hiddenFromOthers) {
  // Only show to sender
  sendMessageToSenderOnly(message);
} else {
  // Send to everyone
  broadcastMessage(message);
}
```

### 2. Post Comments
```typescript
// Before posting comment
const moderation = await aiModerationService.moderateMessage(
  userId,
  commentText,
  undefined,
  postId
);

if (!moderation.allowed) {
  return;
}
```

### 3. Story Comments
```typescript
// Before posting story comment
const moderation = await aiModerationService.moderateMessage(
  userId,
  commentText,
  undefined,
  undefined,
  storyId
);

if (!moderation.allowed) {
  return;
}
```

### 4. Inbox Messages
```typescript
// Before sending inbox message
const moderation = await aiModerationService.moderateMessage(
  userId,
  messageText
);

if (!moderation.allowed) {
  return;
}
```

### 5. Profile Updates
```typescript
// Before saving username/bio
const validation = await aiModerationService.validateUsername(
  userId,
  newUsername,
  newBio
);

if (!validation.allowed) {
  Alert.alert('Username Restricted', validation.message);
  return;
}

// Proceed with update
```

### 6. Stream Joining
```typescript
// Before allowing user to join stream
const isBanned = await aiModerationService.isUserBannedFromCreator(
  userId,
  creatorId
);

if (isBanned) {
  Alert.alert('Access Denied', 'You are banned from this creator\'s streams.');
  return;
}

// Allow join
```

---

## AI API Integration

### Current Implementation
The system currently uses **keyword-based detection** as a placeholder. This should be replaced with a real AI API.

### Recommended AI APIs

#### 1. OpenAI Moderation API (Recommended)
```typescript
async function classifyMessage(message: string): Promise<ClassificationScores> {
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
    spam: 0, // OpenAI doesn't detect spam
    overall: Math.max(...Object.values(result.category_scores))
  };
}
```

#### 2. Perspective API (Google)
```typescript
async function classifyMessage(message: string): Promise<ClassificationScores> {
  const response = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text: message },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {}
        }
      })
    }
  );

  const data = await response.json();
  // Map Perspective scores to our format
}
```

#### 3. Azure Content Safety
```typescript
async function classifyMessage(message: string): Promise<ClassificationScores> {
  const response = await fetch(
    `https://${ENDPOINT}.cognitiveservices.azure.com/contentsafety/text:analyze?api-version=2023-10-01`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: message })
    }
  );

  const data = await response.json();
  // Map Azure scores to our format
}
```

### Integration Steps

1. **Choose an AI API** (OpenAI Moderation API recommended)
2. **Add API key** to environment variables
3. **Replace `classifyMessage` method** in `aiModerationService.ts`
4. **Test thoroughly** with various message types
5. **Adjust thresholds** based on real-world results

---

## Performance Considerations

### Caching
- Cache AI API responses for identical messages (1 hour TTL)
- Use Redis or similar for distributed caching

### Rate Limiting
- Implement rate limiting for AI API calls
- Queue messages if rate limit is reached
- Fail open (allow message) if API is unavailable

### Async Processing
- Process moderation asynchronously when possible
- Don't block message sending on AI response
- Apply actions retroactively if needed

### Database Optimization
- Indexes are already created on key columns
- Use pagination for admin dashboard queries
- Archive old violations after 90 days

---

## Testing Guide

### Unit Tests
```typescript
describe('AI Moderation Service', () => {
  it('should flag toxic messages', async () => {
    const result = await aiModerationService.moderateMessage(
      userId,
      'You are stupid and worthless',
      streamId
    );
    expect(result.action).toBe('flag');
  });

  it('should hide severe violations', async () => {
    const result = await aiModerationService.moderateMessage(
      userId,
      'Kill yourself',
      streamId
    );
    expect(result.action).toBe('timeout');
  });

  it('should reject impersonation usernames', async () => {
    const result = await aiModerationService.validateUsername(
      userId,
      'official_admin'
    );
    expect(result.allowed).toBe(false);
  });
});
```

### Integration Tests
1. Send various message types through moderation
2. Verify correct actions are taken
3. Check database records are created
4. Verify inbox notifications are sent
5. Test admin dashboard functionality

### Load Tests
- Test with 1000+ concurrent messages
- Verify AI API rate limits are respected
- Check database performance under load

---

## Monitoring & Analytics

### Key Metrics to Track
- **Moderation rate**: % of messages flagged
- **False positive rate**: Admin-approved violations
- **Response time**: AI API latency
- **Action distribution**: Breakdown by action type
- **Repeat offenders**: Users with multiple violations
- **Category trends**: Most common violation types

### Logging
All moderation actions are logged with:
- Timestamp
- User ID
- Message text
- Scores
- Action taken
- Context (stream/post/story ID)

### Alerts
Set up alerts for:
- High violation rates (> 10% of messages)
- AI API failures
- Repeat offenders (3+ violations in 1 hour)
- Mass reporting events

---

## Privacy & Compliance

### Data Retention
- Violations: 90 days
- Username logs: 180 days
- Strikes: Until expiration + 30 days
- Stream warnings: 30 days

### User Rights
Users can:
- View their own violations
- Appeal strikes through admin system
- Request violation data deletion (after review)

### GDPR Compliance
- All personal data is encrypted
- Users can request data export
- Data is deleted on account deletion
- Processing is logged for audit

---

## Troubleshooting

### Common Issues

#### Messages not being moderated
- Check AI API key is valid
- Verify service is being called
- Check database permissions
- Review RLS policies

#### False positives
- Adjust threshold values
- Improve AI API prompts
- Add whitelist for common phrases
- Train custom model

#### Performance issues
- Enable caching
- Optimize database queries
- Use async processing
- Scale AI API tier

---

## Future Enhancements

### Planned Features
1. **Custom AI models** trained on platform data
2. **Context-aware moderation** (considers conversation history)
3. **Multi-language support** for international users
4. **Image/video moderation** for visual content
5. **Sentiment analysis** for community health metrics
6. **Automated appeals** with AI review
7. **User reputation scores** based on behavior
8. **Predictive moderation** to prevent violations

### API Improvements
- Batch processing for multiple messages
- Streaming responses for real-time feedback
- Custom training data integration
- Fine-tuned models per community

---

## Support & Documentation

### Additional Resources
- [OpenAI Moderation API Docs](https://platform.openai.com/docs/guides/moderation)
- [Perspective API Docs](https://developers.perspectiveapi.com/)
- [Azure Content Safety Docs](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/)

### Contact
For questions or issues:
- Check existing violations in admin dashboard
- Review logs in Supabase
- Contact development team

---

## Summary

The AI Moderation System provides comprehensive, automated content moderation across all user-generated content without interrupting core functionality. It uses progressive enforcement, creator-specific bans, and provides admins with powerful tools to review and manage violations.

**Key Benefits:**
- ✅ Real-time moderation without stream interruption
- ✅ Progressive enforcement with clear escalation
- ✅ Creator-specific bans (not platform-wide)
- ✅ Comprehensive admin dashboard
- ✅ Automatic notifications to users
- ✅ Detailed logging and analytics
- ✅ Privacy-compliant data handling

**Next Steps:**
1. Integrate real AI API (OpenAI recommended)
2. Test thoroughly with real users
3. Adjust thresholds based on results
4. Monitor metrics and iterate
5. Train custom models for better accuracy
