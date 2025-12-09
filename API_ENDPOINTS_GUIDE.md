
# API Endpoints Guide - Moderator, Ban, and Timeout System

## Base URL
All endpoints are Supabase Edge Functions accessible at:
```
https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/{endpoint-name}
```

## Authentication
All endpoints require authentication. Include the user's JWT token in the Authorization header:
```
Authorization: Bearer {user_jwt_token}
```

---

## Moderator Endpoints

### 1. Add Moderator
**Endpoint:** `POST /moderators-add`

**Description:** Adds a user as a moderator for a specific creator. Maximum 30 moderators per creator.

**Request Body:**
```json
{
  "creator_id": "uuid-of-creator",
  "moderator_id": "uuid-of-user-to-add"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "moderators": [
    {
      "id": "uuid",
      "streamer_id": "uuid",
      "user_id": "uuid",
      "created_at": "2024-01-15T10:00:00Z",
      "profiles": {
        "id": "uuid",
        "username": "john_doe",
        "display_name": "John Doe",
        "avatar_url": "https://..."
      }
    }
  ]
}
```

**Error Responses:**
- `400` - User is already a moderator
- `400` - Maximum of 30 moderators reached
- `400` - Missing required fields
- `500` - Server error

**Example Usage (JavaScript):**
```javascript
import { supabase } from '@/app/integrations/supabase/client';

const addModerator = async (creatorId, moderatorId) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/moderators-add',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId,
        moderator_id: moderatorId,
      }),
    }
  );
  
  return await response.json();
};
```

---

### 2. Remove Moderator
**Endpoint:** `POST /moderators-remove`

**Description:** Removes a user from the moderator list for a specific creator.

**Request Body:**
```json
{
  "creator_id": "uuid-of-creator",
  "moderator_id": "uuid-of-user-to-remove"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "moderators": [
    // Updated list of moderators
  ]
}
```

**Error Responses:**
- `400` - Missing required fields
- `500` - Server error

---

## Ban Endpoints

### 3. Ban User
**Endpoint:** `POST /ban-add`

**Description:** Permanently bans a user from all streams by a specific creator. Banned users cannot join future streams.

**Request Body:**
```json
{
  "creator_id": "uuid-of-creator",
  "banned_user_id": "uuid-of-user-to-ban",
  "reason": "Optional reason for ban"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User banned successfully"
}
```

**Error Responses:**
- `400` - User is already banned
- `400` - Missing required fields
- `500` - Server error

**Example Usage (JavaScript):**
```javascript
const banUser = async (creatorId, userId, reason) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/ban-add',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId,
        banned_user_id: userId,
        reason: reason || null,
      }),
    }
  );
  
  return await response.json();
};
```

---

### 4. Unban User
**Endpoint:** `POST /ban-remove`

**Description:** Removes a ban, allowing the user to join streams again.

**Request Body:**
```json
{
  "creator_id": "uuid-of-creator",
  "banned_user_id": "uuid-of-user-to-unban"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User unbanned successfully"
}
```

**Error Responses:**
- `400` - Missing required fields
- `500` - Server error

---

## Timeout Endpoint

### 5. Timeout User
**Endpoint:** `POST /timeout-add`

**Description:** Temporarily prevents a user from commenting in a specific stream. Duration: 1-60 minutes.

**Request Body:**
```json
{
  "creator_id": "uuid-of-creator",
  "user_id": "uuid-of-user-to-timeout",
  "stream_id": "uuid-of-current-stream",
  "minutes": 5
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User timed out for 5 minutes",
  "timeout_until": "2024-01-15T10:35:00Z"
}
```

**Error Responses:**
- `400` - Timeout duration must be between 1 and 60 minutes
- `400` - Missing required fields
- `500` - Server error

**Example Usage (JavaScript):**
```javascript
const timeoutUser = async (creatorId, userId, streamId, minutes) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/timeout-add',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId,
        user_id: userId,
        stream_id: streamId,
        minutes: minutes,
      }),
    }
  );
  
  return await response.json();
};
```

---

## Start Live Integration

The `start-live` endpoint has been updated to include moderators in the response:

**Endpoint:** `POST /start-live`

**Request Body:**
```json
{
  "title": "My Awesome Stream",
  "user_id": "uuid-of-broadcaster"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "stream": {
    "id": "stream-uuid",
    "live_input_id": "input-uuid",
    "title": "My Awesome Stream",
    "status": "live",
    "playback_url": "https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8",
    "moderators": [
      {
        "user_id": "uuid",
        "username": "john_doe",
        "display_name": "John Doe",
        "avatar_url": "https://..."
      }
    ]
  },
  "ingest": {
    "webRTC_url": "https://...",
    "rtmps_url": "rtmps://...",
    "stream_key": "***"
  }
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error, missing fields, etc.)
- `405` - Method Not Allowed (only POST is allowed)
- `500` - Internal Server Error

---

## Rate Limiting

Supabase Edge Functions have built-in rate limiting. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

---

## Testing

You can test these endpoints using:

1. **Postman/Insomnia:**
   - Set method to POST
   - Add Authorization header with Bearer token
   - Add Content-Type: application/json header
   - Add request body as JSON

2. **cURL:**
```bash
curl -X POST \
  https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/moderators-add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "uuid",
    "moderator_id": "uuid"
  }'
```

3. **JavaScript Fetch:**
```javascript
const response = await fetch(
  'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/moderators-add',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      creator_id: 'uuid',
      moderator_id: 'uuid',
    }),
  }
);
const data = await response.json();
```

---

## Security Notes

1. **Authentication Required:** All endpoints require a valid JWT token from Supabase Auth.

2. **Authorization:** The Edge Functions use the service role key internally, but RLS policies ensure users can only modify their own data.

3. **Validation:** All inputs are validated server-side. Client-side validation is recommended but not sufficient.

4. **Rate Limiting:** Implement client-side debouncing for user actions to avoid hitting rate limits.

5. **Error Handling:** Always handle errors gracefully and provide user-friendly messages.

---

## Integration with Frontend Services

The frontend services (`moderationService.ts`, `fanClubService.ts`) already implement these API calls. You can use them directly:

```javascript
import { moderationService } from '@/app/services/moderationService';

// Add moderator
const result = await moderationService.addModerator(creatorId, userId);

// Ban user
const result = await moderationService.banUser(creatorId, userId, reason);

// Timeout user
const result = await moderationService.timeoutUser(streamId, userId, minutes);
```

These services handle authentication, error handling, and response parsing automatically.
