
# SQL Setup Instructions

## Prerequisites

- Supabase project: `uaqsjqakhgycfopftzzp`
- Database access via Supabase SQL Editor

---

## Step 1: Configure Database Settings for Cron Job

**IMPORTANT:** These settings are required for the cron job to work.

```sql
-- Set Supabase URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://uaqsjqakhgycfopftzzp.supabase.co';

-- Set Service Role Key (replace with your actual key from Supabase Dashboard)
ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**To get your Service Role Key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (⚠️ Keep this secret!)

---

## Step 2: Verify Tables Exist

```sql
-- Check push_device_tokens table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'push_device_tokens'
ORDER BY ordinal_position;

-- Check push_notifications_log table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'push_notifications_log'
ORDER BY ordinal_position;
```

**Expected Output:**
- `push_device_tokens`: id, user_id, platform, device_token, created_at, last_used_at, updated_at, is_active
- `push_notifications_log`: id, user_id, type, title, body, payload_json, sent_at, delivery_status

---

## Step 3: Verify RLS Policies

```sql
-- Check RLS policies for push_device_tokens
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'push_device_tokens';

-- Check RLS policies for push_notifications_log
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'push_notifications_log';
```

**Expected Policies:**

**push_device_tokens:**
- Users can view their own device tokens (SELECT)
- Users can insert their own device tokens (INSERT)
- Users can update their own device tokens (UPDATE)
- Users can delete their own device tokens (DELETE)

**push_notifications_log:**
- Users can view their own push notifications (SELECT)
- Admins can view all push notifications (SELECT)

---

## Step 4: Verify Indexes

```sql
-- Check indexes on push_device_tokens
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'push_device_tokens';

-- Check indexes on push_notifications_log
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'push_notifications_log';
```

**Expected Indexes:**
- `idx_push_device_tokens_user_active` - For faster active token lookups
- `idx_push_notifications_log_user_sent` - For faster user notification queries
- `idx_push_notifications_log_type_sent` - For faster type-based queries

---

## Step 5: Verify Cron Job

```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- View all cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job;

-- View cron job run history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

**Expected Cron Job:**
- Name: `check-ban-expirations-every-5-min`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Active: `true`

---

## Step 6: Test Manual Trigger

```sql
-- Manually trigger ban expiration check
SELECT public.trigger_ban_expiration_check();
```

**Expected Output:**
```json
{
  "success": true,
  "expiredPenalties": 0,
  "expiredStrikes": 0,
  "expiredTimeouts": 0,
  "notificationsSent": 0
}
```

---

## Step 7: Test Queries

### Insert Test Device Token

```sql
-- Insert a test device token (replace with your user_id)
INSERT INTO push_device_tokens (user_id, platform, device_token, is_active)
VALUES (
  'your-user-id-here',
  'android',
  'ExponentPushToken[test-token-12345]',
  true
);

-- Verify insertion
SELECT * FROM push_device_tokens WHERE user_id = 'your-user-id-here';
```

### Query Active Tokens

```sql
-- Get all active tokens for a user
SELECT 
  id,
  platform,
  device_token,
  created_at,
  last_used_at,
  is_active
FROM push_device_tokens
WHERE user_id = 'your-user-id-here'
  AND is_active = true;
```

### Query Notification Logs

```sql
-- Get recent notifications for a user
SELECT 
  id,
  type,
  title,
  body,
  delivery_status,
  sent_at
FROM push_notifications_log
WHERE user_id = 'your-user-id-here'
ORDER BY sent_at DESC
LIMIT 10;
```

---

## Step 8: Monitoring Queries

### Push Notification Statistics

```sql
-- Notification stats by type (last 7 days)
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') as sent,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE delivery_status = 'sent') / COUNT(*), 2) as success_rate
FROM push_notifications_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY total DESC;
```

### Active Device Tokens by Platform

```sql
-- Count active tokens by platform
SELECT 
  platform,
  COUNT(*) as active_tokens,
  COUNT(DISTINCT user_id) as unique_users
FROM push_device_tokens
WHERE is_active = true
GROUP BY platform
ORDER BY active_tokens DESC;
```

### Failed Notifications

```sql
-- Recent failed notifications
SELECT 
  pnl.user_id,
  p.username,
  pnl.type,
  pnl.title,
  pnl.delivery_status,
  pnl.sent_at
FROM push_notifications_log pnl
LEFT JOIN profiles p ON p.id = pnl.user_id
WHERE pnl.delivery_status = 'failed'
ORDER BY pnl.sent_at DESC
LIMIT 20;
```

### Cron Job Performance

```sql
-- Cron job execution stats (last 24 hours)
SELECT 
  DATE_TRUNC('hour', start_time) as hour,
  COUNT(*) as executions,
  COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
  AND jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-ban-expirations-every-5-min')
GROUP BY DATE_TRUNC('hour', start_time)
ORDER BY hour DESC;
```

---

## Step 9: Cleanup (Optional)

### Remove Test Data

```sql
-- Delete test device tokens
DELETE FROM push_device_tokens WHERE device_token LIKE '%test%';

-- Delete old notification logs (older than 30 days)
DELETE FROM push_notifications_log WHERE sent_at < NOW() - INTERVAL '30 days';
```

### Disable Cron Job (if needed)

```sql
-- Disable the cron job
UPDATE cron.job 
SET active = false 
WHERE jobname = 'check-ban-expirations-every-5-min';

-- Re-enable the cron job
UPDATE cron.job 
SET active = true 
WHERE jobname = 'check-ban-expirations-every-5-min';
```

---

## Troubleshooting

### Issue: Cron job not running

**Check database settings:**
```sql
SHOW app.settings.supabase_url;
SHOW app.settings.service_role_key;
```

**If settings are not set:**
```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://uaqsjqakhgycfopftzzp.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

**Reload configuration:**
```sql
SELECT pg_reload_conf();
```

---

### Issue: RLS blocking queries

**Check if RLS is enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('push_device_tokens', 'push_notifications_log');
```

**Check current user:**
```sql
SELECT current_user, current_role;
```

**Test with service role (in Supabase SQL Editor):**
- Use "Service role" mode in SQL Editor dropdown

---

### Issue: Indexes not being used

**Check query plan:**
```sql
EXPLAIN ANALYZE
SELECT * FROM push_device_tokens 
WHERE user_id = 'your-user-id' AND is_active = true;
```

**Rebuild indexes if needed:**
```sql
REINDEX TABLE push_device_tokens;
REINDEX TABLE push_notifications_log;
```

---

## Summary

✅ **Completed Steps:**
1. Configure database settings for cron job
2. Verify tables exist with correct structure
3. Verify RLS policies are in place
4. Verify indexes are created
5. Verify cron job is scheduled
6. Test manual trigger function
7. Run test queries
8. Set up monitoring queries

✅ **Next Steps:**
1. Set Supabase Secrets (FCM_SERVER_KEY, etc.)
2. Test push notifications from client
3. Monitor cron job execution
4. Review notification logs regularly

---

**For detailed implementation guide, see:** `PUSH_NOTIFICATIONS_R2_IMPLEMENTATION_COMPLETE.md`
