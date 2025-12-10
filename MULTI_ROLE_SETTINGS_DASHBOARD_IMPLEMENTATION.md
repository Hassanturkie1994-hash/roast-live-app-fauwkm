
# Multi-Role Settings Dashboard Implementation

## Overview
This document describes the implementation of a comprehensive multi-role settings dashboard system integrated into the Settings view of the Roast Live app. The system provides role-based access to different administrative and moderation tools without affecting any livestreaming functionality.

## Features Implemented

### 1. Role-Based Dashboard Access
The system supports five distinct user roles, each with specific permissions and dashboard access:

#### **Head Admin (HEAD_ADMIN)**
- **Access Level**: Highest - Full platform control
- **Dashboard Location**: `HeadAdminDashboardScreen.tsx`
- **Capabilities**:
  - View platform-wide statistics (total users, active users, banned users, timed-out users)
  - Access user reports and stream reports
  - Manage admin and support team assignments
  - Send app-wide announcements to all users
  - Update global rules and community guidelines
  - View and remove warnings system-wide
  - Full access to all admin functions

#### **Admin (ADMIN)**
- **Access Level**: High - Global moderation without highest privileges
- **Dashboard Location**: `AdminDashboardScreen.tsx` (existing)
- **Capabilities**:
  - Manage reported comments and profile reports
  - Suspend users temporarily
  - Issue and remove warnings
  - Send admin messages directly to user inboxes
  - View live stream list in real-time
  - Block/remove stream access for users
  - Cannot assign other admins (Head Admin only)

#### **Support (SUPPORT)**
- **Access Level**: Medium - Appeal and ticket management
- **Dashboard Location**: `SupportDashboardScreen.tsx`
- **Capabilities**:
  - Review and resolve user appeals
  - Approve account unlock requests
  - View user history (warnings, timeouts, bans)
  - Respond to support tickets in inbox
  - **Cannot** suspend or ban users
  - Must escalate serious issues to admins

#### **Moderator (MODERATOR)**
- **Access Level**: Limited - Stream-specific moderation
- **Dashboard Location**: `ModeratorDashboardScreen.tsx`
- **Capabilities**:
  - View assigned creator information
  - Remove own moderator role (when creator revokes)
  - View moderator rules and guidelines
  - See personal moderation history
  - **Scope**: Only for streams belonging to the assigned creator
  - **Cannot** perform global moderation actions

#### **Normal User (USER)**
- **Access Level**: Standard user features
- **Dashboard**: No special dashboard, standard settings only
- **Capabilities**:
  - Account & Security settings
  - Profile customization
  - Balance & Wallet management
  - Subscription & VIP management

### 2. Settings Integration

#### Dashboard & Tools Section
A new section "🎛️ Dashboard & Tools" has been added to the Settings screen that:
- Dynamically appears only for users with admin/support/moderator roles
- Shows role-appropriate dashboard link with description
- Uses role-specific icons and colors
- Provides quick access to role-specific tools

#### Account & Security Enhancements
- **Change Password**: New dedicated screen with current password verification
  - Requires current password input
  - Validates new password (minimum 6 characters)
  - Confirms password match
  - Shows success toast on completion
  - Located at: `ChangePasswordScreen.tsx`

- **Logout Flow**: Enhanced with safety checks
  - Checks if user is currently live streaming
  - Shows modal: "You must end your live session before logging out" if live
  - Clears session locally without affecting streaming tokens
  - Prevents accidental logout during live sessions

### 3. Visible Pages in Settings

The following pages are now accessible from the Settings screen:

1. **Gift Information Page** (`GiftInformationScreen.tsx`)
   - Displays gift catalog with icons and prices
   - Shows gift tiers and descriptions

2. **Terms & Rules Page** (`TermsOfServiceScreen.tsx`)
   - Displays user rules based on content-safety guidelines
   - Requires acceptance for new users

3. **Privacy Policy Page** (`PrivacyPolicyScreen.tsx`)
   - Shows privacy policy and data handling information
   - Tracks user acceptance

4. **Achievements Page** (`AchievementsScreen.tsx`)
   - Displays unlocked achievements and badges
   - Shows progress towards locked achievements

5. **Saved Streams Page** (`SavedStreamsScreen.tsx`)
   - Lists user's saved/bookmarked streams
   - Allows playback of saved content

6. **VIP Members Page** (`VIPClubDashboardScreen.tsx`)
   - Creator-only: Manage VIP subscribers
   - View VIP member list and benefits

7. **Moderator Management Page** (via Stream Dashboard)
   - Creator-only: Assign and remove moderators
   - View moderator list

8. **Appeal History Page** (`AppealsViolationsScreen.tsx`)
   - Support/Admin only: View appeal history
   - Track resolution status

9. **Manage Subscriptions** (`ManageSubscriptionsScreen.tsx`)
   - View active subscriptions
   - Cancel or renew subscriptions

### 4. UI Design

#### Dashboard Cards
All dashboards use consistent card-based design with:
- Shadow styling for depth
- Rounded corners (12px border radius)
- Border width of 1px
- Responsive grid layouts
- Icon-based navigation

#### Icons Used
- **Users**: `person.3.fill` / `group`
- **Reports**: `flag.fill` / `flag`
- **Wallet**: `wallet.pass.fill` / `account_balance_wallet`
- **Security**: `shield.fill` / `security`
- **Inbox**: `envelope.fill` / `mail`
- **Dashboard**: `chart.bar.fill` / `dashboard`
- **Lock**: `lock.fill` / `lock`
- **Logout**: `rectangle.portrait.and.arrow.right` / `logout`

#### Color Coding
- **Head Admin Badge**: Gold (#FFD700)
- **Admin Badge**: Gradient End Color
- **Support Badge**: Teal (#4ECDC4)
- **Moderator Badge**: Purple (#9B59B6)

### 5. Database Integration

#### Tables Used
- `admin_roles`: Stores user role assignments
- `profiles`: Contains user role field
- `admin_actions_log`: Logs all admin actions
- `user_reports`: Stores user and content reports
- `admin_messages`: Admin-to-user messaging
- `moderators`: Stream-specific moderator assignments
- `moderation_history`: Tracks moderation actions

#### Role Checking
The `adminService.checkAdminRole(userId)` method:
- Queries the `admin_roles` table
- Returns the user's role or null
- Used throughout the app for access control

### 6. Security Considerations

#### Access Control
- All dashboard screens check user role on mount
- Unauthorized users are redirected back
- Alert shown for access denial
- Role checks happen server-side via Supabase

#### Streaming Protection
- Logout flow checks for active live sessions
- Password change does NOT affect streaming tokens
- Admin actions do NOT modify Cloudflare configurations
- Stream start/stop logic remains untouched

#### Action Logging
- All admin actions are logged to `admin_actions_log`
- Includes: admin user ID, target user ID, action type, reason, timestamp
- Provides audit trail for accountability

## Files Created/Modified

### New Files
1. `app/screens/HeadAdminDashboardScreen.tsx` - Head admin dashboard
2. `app/screens/SupportDashboardScreen.tsx` - Support team dashboard
3. `app/screens/ModeratorDashboardScreen.tsx` - Moderator dashboard
4. `app/screens/ChangePasswordScreen.tsx` - Password change screen

### Modified Files
1. `app/screens/AccountSettingsScreen.tsx` - Added Dashboard & Tools section, enhanced logout/password change

### Existing Files Used
1. `app/screens/AdminDashboardScreen.tsx` - Admin dashboard (already existed)
2. `app/services/adminService.ts` - Admin service methods (already existed)
3. `contexts/AuthContext.tsx` - Authentication context (already existed)

## Usage

### For Developers

#### Assigning Roles
Roles can be assigned via the database or through the Head Admin dashboard:

```typescript
await adminService.assignAdminRole(userId, 'ADMIN', assignedByUserId);
```

#### Checking User Role
```typescript
const result = await adminService.checkAdminRole(userId);
if (result.role === 'HEAD_ADMIN') {
  // Grant head admin access
}
```

#### Logging Admin Actions
```typescript
await adminService.logAction(
  adminUserId,
  targetUserId,
  'BAN',
  'Violated community guidelines',
  expiresAt,
  { reason: 'spam' }
);
```

### For Users

#### Accessing Dashboard
1. Navigate to Profile tab
2. Tap Settings icon (gear)
3. Look for "Dashboard & Tools" section (if you have a role)
4. Tap your role-specific dashboard

#### Changing Password
1. Go to Settings
2. Tap "Security" section
3. Tap "Change Password"
4. Enter current password
5. Enter and confirm new password
6. Tap "Update Password"

#### Logging Out
1. Go to Settings
2. Tap "Security" section
3. Tap "Logout"
4. Confirm logout (if not live)

## Important Notes

### What Was NOT Modified
As per requirements, the following were NOT touched:
- ✅ `startLive()` function
- ✅ `stopLive()` function
- ✅ Stream tokens and authentication
- ✅ Cloudflare publish logic
- ✅ Viewer & chat channels
- ✅ Any livestreaming API endpoints

### Future Enhancements
Potential improvements for future iterations:
1. Real-time statistics updates using Supabase Realtime
2. Advanced filtering and search in dashboards
3. Bulk action capabilities for admins
4. Detailed analytics and reporting
5. Role permission customization
6. Multi-language support for dashboards
7. Export functionality for reports and logs

## Testing Checklist

- [ ] Head Admin can access Head Admin Dashboard
- [ ] Admin can access Admin Dashboard
- [ ] Support can access Support Dashboard
- [ ] Moderator can access Moderator Dashboard
- [ ] Normal users do NOT see Dashboard & Tools section
- [ ] Password change requires current password
- [ ] Password change validates new password
- [ ] Logout is blocked when user is live
- [ ] Logout clears session successfully
- [ ] All settings pages are accessible
- [ ] Role badges display correct colors
- [ ] Dashboard cards have proper styling
- [ ] Navigation works correctly
- [ ] Access denial alerts work
- [ ] Streaming functionality unaffected

## Conclusion

The multi-role settings dashboard has been successfully integrated into the Roast Live app. The implementation provides a comprehensive, role-based administrative system while maintaining complete separation from the livestreaming infrastructure. All modifications are UI-only and local DB integrations, ensuring that core streaming functionality remains untouched and stable.
