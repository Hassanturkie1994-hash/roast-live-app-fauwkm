
# 🚀 Escalation & Appeals System - Quick Reference

## 📋 Quick Start Guide

### For Developers

#### 1. AI Flags Content (Automatic)
```typescript
import { aiModerationService } from '@/services/aiModerationService';

// Moderate a message
const result = await aiModerationService.moderateMessage(
  userId,
  messageText,
  streamId, // optional
  postId,   // optional
  storyId,  // optional
  messageId // optional
);

// If score >= 0.60 and < 0.85, automatically escalates to moderator
```

#### 2. Moderator Reviews Content
```typescript
import { escalationService } from '@/services/escalationService';

// Get review queue (only shows moderator's streams)
const items = await escalationService.getModeratorReviewQueue(
  moderatorId,
  'pending' // optional status filter
);

// Approve message
await escalationService.moderatorApprove(
  reviewId,
  moderatorId,
  moderatorName,
  'Reason for approval'
);

// Reject message
await escalationService.moderatorReject(
  reviewId,
  moderatorId,
  moderatorName,
  'Reason for rejection'
);

// Apply timeout (5-60 minutes)
await escalationService.moderatorTimeout(
  reviewId,
  moderatorId,
  moderatorName,
  30, // duration in minutes
  'Reason for timeout'
);

// Escalate to admin
await escalationService.escalateToAdmin(
  reviewId,
  moderatorId,
  'Hate speech detected',
  'Additional notes...'
);
```

#### 3. Admin Reviews Escalations
```typescript
// Get escalated items
const escalations = await escalationService.getAdminEscalationQueue();

// Get user history
const history = await escalationService.getUserHistory(userId);
// Returns: { messages, strikes, timeouts, bans, penalties }

// Apply penalty
await escalationService.adminApplyPenalty(
  userId,
  adminId,
  'temporary', // or 'permanent'
  'Reason for ban',
  24, // duration in hours (optional for temporary)
  'https://evidence.link', // optional
  'Section 3.2 of ToS' // optional
);
```

#### 4. User Submits Appeal
```typescript
import { appealsService } from '@/services/appealsService';

// Get user's penalties
const penalties = await appealsService.getUserPenalties(userId);

// Submit appeal
await appealsService.submitAppeal(
  userId,
  penaltyId,
  'Appeal reason (min 10 characters)',
  'https://screenshot.url' // optional
);

// Get user's appeals
const appeals = await appealsService.getUserAppeals(userId);
```

#### 5. Admin Reviews Appeals
```typescript
// Get pending appeals
const appeals = await appealsService.getPendingAppeals();

// Get appeal with full context
const fullAppeal = await appealsService.getAppealWithContext(appealId);
// Returns: appeal + user_history (violations, strikes, penalties)

// Accept appeal
await appealsService.acceptAppeal(
  appealId,
  adminId,
  'Resolution message'
);
// Automatically removes penalty, strike, and violation

// Deny appeal
await appealsService.denyAppeal(
  appealId,
  adminId,
  'Resolution message'
);
```

---

## 🎯 Key Thresholds

### AI Moderation Scores
- **< 0.30**: Allow message
- **≥ 0.30**: Flag silently
- **≥ 0.50**: Hide from others
- **≥ 0.60 and < 0.85**: **ESCALATE TO MODERATOR**
- **≥ 0.70**: Auto-timeout 2 minutes
- **≥ 0.85**: Block from stream

### Moderator Actions
- **Approve**: Restore message
- **Reject**: Permanently hide
- **Timeout**: 5-60 minutes (manually selectable)
- **Escalate**: Send to admin

### Admin Penalties
- **Temporary**: 24 hrs, 7 days, or 30 days
- **Permanent**: No expiration

---

## 🚫 Unappeallable Cases

These permanent bans CANNOT be appealed:
- Sexual content involving minors
- Terror-related content
- Fraud attempt

**Check in code**:
```typescript
const unappeableReasons = [
  'sexual content involving minors',
  'terror-related content',
  'fraud attempt',
];

const isUnappeallable = unappeableReasons.some(reason => 
  penalty.reason.toLowerCase().includes(reason)
);
```

---

## 📊 Database Tables

### moderator_review_queue
```sql
SELECT * FROM moderator_review_queue 
WHERE resolution_status = 'pending'
AND (
  assigned_moderator_id = 'moderator_id'
  OR stream_id IN (
    SELECT stream_id FROM moderators WHERE user_id = 'moderator_id'
  )
);
```

### admin_penalties
```sql
SELECT * FROM admin_penalties 
WHERE user_id = 'user_id'
AND is_active = true
AND (expires_at IS NULL OR expires_at > NOW());
```

### appeals
```sql
SELECT * FROM appeals 
WHERE status = 'pending'
ORDER BY created_at ASC;
```

---

## 🔔 Notification Messages

### Moderator Actions
```typescript
// Approve
"You have received a moderation decision from {moderatorName}. Your message has been approved. Reason: {reason}. If you want to appeal, open Appeals Center."

// Reject
"You have received a moderation decision from {moderatorName}. Your message has been permanently hidden. Reason: {reason}. If you want to appeal, open Appeals Center."

// Timeout
"You have received a moderation decision from {moderatorName}. You have been timed out for {duration} minutes. Reason: {reason}. If you want to appeal, open Appeals Center."
```

### Admin Actions
```typescript
// Penalty
"Your account has received an administrative action{durationText}. Reason: {reason}. Decision is final unless appealed. You can appeal this decision in Settings > Account > Appeals Center."
```

### Appeal Actions
```typescript
// Submitted
"Your appeal has been submitted and is under review by administrators."

// Accepted
"Your appeal was reviewed and accepted. Reason: {resolutionText}."

// Denied
"Your appeal was reviewed and denied. Reason: {resolutionText}."
```

---

## 🎨 UI Navigation

### Moderator
```
Settings > Moderation > Review Queue
→ ModeratorReviewQueueScreen
```

### Admin
```
Settings > Admin > Escalation Queue
→ AdminEscalationQueueScreen

Settings > Admin > Appeals Review
→ AdminAppealsReviewScreen
```

### User
```
Settings > Account > Appeals Center
→ AppealsCenterScreen
```

---

## ⚡ Common Patterns

### Check if User Can Appeal
```typescript
const { data: existingAppeal } = await supabase
  .from('appeals')
  .select('id')
  .eq('user_id', userId)
  .eq('penalty_id', penaltyId)
  .eq('status', 'pending')
  .single();

if (existingAppeal) {
  // User already has pending appeal
}
```

### Check if Penalty is Active
```typescript
const isActive = penalty.is_active && 
  (!penalty.expires_at || new Date(penalty.expires_at) > new Date());
```

### Get Moderator's Streams
```typescript
const { data: moderatorStreams } = await supabase
  .from('moderators')
  .select('stream_id')
  .eq('user_id', moderatorId);
```

---

## 🐛 Debugging

### Check AI Moderation
```typescript
// Enable logging in aiModerationService.ts
console.log(`🤖 AI Moderation: ${action} - Score: ${scores.overall.toFixed(2)}`);
```

### Check Escalation
```typescript
// Enable logging in escalationService.ts
console.log(`🚨 Escalated to moderator review: ${violationId}`);
console.log(`🚨 Escalated to admin by moderator ${moderatorId}: ${reason}`);
```

### Check Appeals
```typescript
// Enable logging in appealsService.ts
console.log(`📝 Appeal submitted by user ${userId}`);
console.log(`✅ Appeal accepted: ${appealId}`);
console.log(`❌ Appeal denied: ${appealId}`);
```

---

## 📝 Testing Scenarios

### Test AI Escalation
1. Send message with score 0.60-0.85
2. Check `moderator_review_queue` table
3. Verify user received notification
4. Verify moderator can see item

### Test Moderator Actions
1. Moderator approves/rejects/timeouts
2. Check `resolution_status` updated
3. Verify user received notification
4. Verify timeout applied (if applicable)

### Test Admin Penalty
1. Admin applies temporary/permanent ban
2. Check `admin_penalties` table
3. Verify user received notification
4. Verify penalty is active

### Test Appeal Flow
1. User submits appeal
2. Check `appeals` table
3. Admin accepts/denies appeal
4. Verify penalty deactivated (if accepted)
5. Verify user received notification

---

## 🔒 Security Notes

### RLS Policies Required
```sql
-- Moderators can only see their streams
CREATE POLICY "Moderators see own streams" ON moderator_review_queue
FOR SELECT USING (
  assigned_moderator_id = auth.uid()
  OR stream_id IN (
    SELECT stream_id FROM moderators WHERE user_id = auth.uid()
  )
);

-- Users can only see their own appeals
CREATE POLICY "Users see own appeals" ON appeals
FOR SELECT USING (user_id = auth.uid());

-- Only admins can modify penalties
CREATE POLICY "Admins modify penalties" ON admin_penalties
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('HEAD_ADMIN', 'ADMIN')
  )
);
```

---

## 📚 Related Documentation

- **Full Implementation**: `ESCALATION_APPEALS_IMPLEMENTATION_COMPLETE.md`
- **AI Moderation**: `AI_MODERATION_IMPLEMENTATION.md`
- **Moderator System**: `MODERATOR_SYSTEM_IMPLEMENTATION.md`
- **Admin System**: `ADMIN_SYSTEM_IMPLEMENTATION.md`

---

**Last Updated**: December 2024
**Version**: 1.0.0
