
# Admin System & UI Animations Implementation

## Overview
This document outlines the implementation of the Admin Roles & Permissions System and UI Animation improvements for the Roast Live app.

## ✅ Implemented Features

### 1. UI Animation Improvements

#### Theme Switching Animation (500ms fade)
- **File**: `contexts/ThemeContext.tsx`
- **Implementation**: Added animated theme transitions using React Native's Animated API
- **Features**:
  - 500ms fade animation when switching between light and dark themes
  - Smooth opacity transitions for all themed components
  - Theme persistence with AsyncStorage
  - `themeOpacity` Animated.Value exposed for child components

#### Bottom Tab Hiding on Livestream
- **File**: `components/TikTokTabBar.tsx`
- **Implementation**: Animated slide-out and fade when user is streaming
- **Features**:
  - 300ms slide down animation when streaming starts
  - 300ms slide up animation when streaming ends
  - Pointer events disabled when hidden
  - Smooth opacity transitions

#### Floating Comment Pinned Effect
- **File**: `components/animations/PinnedCommentTimer.tsx`
- **Implementation**: Enhanced with pulse, glow, and progress animations
- **Features**:
  - Animated progress bar showing time remaining
  - Pulse animation (1s cycle)
  - Glow effect (1.5s cycle)
  - Auto-expires and triggers callback

#### Animated Gift Particles
- **File**: `components/GiftAnimationOverlay.tsx`
- **Implementation**: Already implemented with tier-based particle effects
- **Features**:
  - Tier A: Basic animation
  - Tier B: 6 particles with rotation
  - Tier C: 12 particles + confetti + full-screen glow
  - Sound effects per tier
  - Shake and pulse effects for premium gifts

#### Logo Theme Switching
- **File**: `components/RoastLiveLogo.tsx`
- **Implementation**: Animated logo transitions
- **Features**:
  - Light theme: Black ROAST text logo
  - Dark theme: White ROAST text logo with LIVE badge
  - Smooth fade transitions using themeOpacity

### 2. Admin Roles & Permissions System (RBAC)

#### Database Schema
- **Migration**: `create_admin_system_tables`
- **Tables Created**:
  1. `admin_roles` - Stores admin role assignments
  2. `admin_actions_log` - Logs all admin actions
  3. `user_reports` - Stores user-generated reports
  4. `public_badges` - Manages public badges
  5. `admin_messages` - Admin-to-user messaging

#### Admin Roles
1. **HEAD_ADMIN**
   - Full access to all features
   - Can suspend/delete users
   - Can reset balances
   - Can manage moderators
   - Can issue global warnings
   - Can force stop streams
   - Can assign/remove admin roles

2. **ADMIN**
   - Can ban users platform-wide
   - Can issue warnings
   - Can review reports
   - Can manage public badges
   - Can send message alerts
   - Can edit profile descriptions

3. **SUPPORT**
   - Can reply to user complaints
   - Can see reported comments
   - Can validate bans
   - Can send warnings
   - Can help verify badges

4. **MODERATOR**
   - Stream-level permissions only
   - Can timeout users
   - Can ban users from stream
   - Can remove messages
   - Can pin comments
   - Can review gifts and interactions

#### Admin Service
- **File**: `app/services/adminService.ts`
- **Key Functions**:
  - `checkAdminRole()` - Verify user's admin status
  - `assignAdminRole()` - Assign admin roles
  - `logAction()` - Log all admin actions
  - `getActionLogs()` - Retrieve action history
  - `createReport()` - Create user reports
  - `getReports()` - Fetch reports with filters
  - `updateReportStatus()` - Update report status
  - `banUser()` - Ban users platform-wide
  - `suspendUser()` - Suspend users temporarily
  - `warnUser()` - Issue warnings
  - `forceStopStream()` - Force stop live streams
  - `resetUserBalance()` - Reset wallet balance
  - `sendAdminMessage()` - Send messages to users
  - `getLiveStreams()` - Get currently active streams
  - `getUsersUnderPenalty()` - Get banned/suspended users
  - `getVIPOverview()` - Get VIP statistics
  - `getDailyTransactionVolume()` - Get transaction stats
  - `createPublicBadge()` - Create public badges
  - `deactivatePublicBadge()` - Deactivate badges

### 3. Admin Panel UI

#### Admin Dashboard Screen
- **File**: `app/screens/AdminDashboardScreen.tsx`
- **Features**:
  - Role-based access control
  - Statistics dashboard:
    - Open reports count
    - Live streams count
    - Users under penalty count
    - VIP subscribers count
    - Daily transaction volume
  - Quick action buttons:
    - Manage Reports
    - Live Streams
    - Send Messages
    - Users Under Penalty
  - Role badge display

#### Reports Management Screen
- **File**: `app/screens/AdminReportsScreen.tsx`
- **Features**:
  - Filter by status (open, in_review, closed)
  - Report type indicators with color coding
  - Report details modal
  - Actions:
    - Ban user
    - Mark in review
    - Close report
    - Add resolution notes
  - Pull-to-refresh

#### Live Streams Monitoring Screen
- **File**: `app/screens/AdminLiveStreamsScreen.tsx`
- **Features**:
  - Real-time list of active streams
  - Stream information:
    - Streamer name
    - Stream title
    - Viewer count
    - Report count
  - Force stop stream (HEAD_ADMIN only)
  - Pull-to-refresh

#### Users Under Penalty Screen
- **File**: `app/screens/AdminPenaltiesScreen.tsx`
- **Features**:
  - List of banned/suspended/timed-out users
  - Penalty details:
    - Action type (BAN, SUSPEND, TIMEOUT)
    - User information
    - Reason
    - Date issued
    - Expiration date
  - Active/Expired status indicators
  - Color-coded action types

#### Admin Messaging Screen
- **File**: `app/screens/AdminMessagingScreen.tsx`
- **Features**:
  - Message type selector:
    - Warning (with duration)
    - Notice
    - Verification
  - Target user ID input
  - Subject and message fields
  - Duration field for warnings
  - Send message functionality

### 4. Row Level Security (RLS) Policies

All admin tables have comprehensive RLS policies:

- **admin_roles**: Only admins can view, only HEAD_ADMIN can manage
- **admin_actions_log**: Admins can view and insert
- **user_reports**: Anyone can create, users can view their own, admins can view all
- **public_badges**: Everyone can view active badges, admins can manage
- **admin_messages**: Users can view their messages, admins can send and view all

### 5. Database Indexes

Performance indexes created for:
- `admin_roles.user_id`
- `admin_roles.role`
- `admin_actions_log.admin_user_id`
- `admin_actions_log.target_user_id`
- `admin_actions_log.created_at`
- `user_reports.status`
- `user_reports.type`
- `user_reports.created_at`
- `public_badges.user_id`
- `admin_messages.target_user_id`
- `admin_messages.read`

## 🎨 Theme System

### Light Theme
- Background: #FFFFFF
- Text: #000000 (black)
- Logo: Black ROAST text logo
- Tab icons: Black with red active state

### Dark Theme
- Background: #000000
- Text: #FFFFFF (white)
- Logo: White ROAST text logo with LIVE badge
- Tab icons: White with red active state

### Animation Timing
- Theme switch: 500ms (250ms fade out + 250ms fade in)
- Tab bar hide/show: 300ms
- Pinned comment pulse: 1000ms cycle
- Pinned comment glow: 1500ms cycle

## 📱 Navigation Routes

Admin screens are accessible via:
- `/screens/AdminDashboardScreen` - Main dashboard
- `/screens/AdminReportsScreen` - Reports management
- `/screens/AdminLiveStreamsScreen` - Live streams monitoring
- `/screens/AdminMessagingScreen` - Send admin messages
- `/screens/AdminPenaltiesScreen` - Users under penalty

## 🔒 Security Features

1. **Role-based access control** - All admin functions check user role
2. **Action logging** - All admin actions are logged with timestamp, reason, and metadata
3. **RLS policies** - Database-level security for all admin tables
4. **Audit trail** - Complete history of all admin actions
5. **Expiration tracking** - Automatic expiration for temporary penalties

## 🚀 Usage

### Accessing Admin Dashboard
1. User must have an admin role assigned in `admin_roles` table
2. Navigate to Admin Dashboard screen
3. System automatically checks role and displays appropriate features
4. Moderators are restricted to stream-level actions only

### Assigning Admin Roles
```typescript
await adminService.assignAdminRole(
  userId,
  'ADMIN', // or 'HEAD_ADMIN', 'SUPPORT', 'MODERATOR'
  assignedByUserId
);
```

### Creating Reports
```typescript
await adminService.createReport(
  reporterUserId,
  reportedUserId,
  'stream', // or 'profile', 'comment', 'message', 'post'
  'Description of the issue'
);
```

### Banning Users
```typescript
await adminService.banUser(
  adminUserId,
  targetUserId,
  'Reason for ban',
  expiresAt // optional, undefined for permanent
);
```

## 📊 Dashboard Statistics

The admin dashboard displays:
- **Open Reports**: Count of unresolved reports
- **Live Streams**: Number of currently active streams
- **Users Under Penalty**: Count of banned/suspended users
- **VIP Subscribers**: Number of active VIP members
- **Daily Volume**: Total transaction volume for the day (in SEK)

## 🎯 Key Design Decisions

1. **Non-intrusive animations**: All animations are smooth and don't impact livestream operations
2. **Modular admin system**: Each admin function is independent and can be extended
3. **Comprehensive logging**: Every admin action is logged for accountability
4. **Flexible permissions**: Role-based system allows for easy permission management
5. **Theme-aware UI**: All admin screens support light and dark themes
6. **Performance optimized**: Database indexes ensure fast queries even with large datasets

## 🔄 Future Enhancements

Potential improvements:
- Real-time notifications for admins
- Advanced analytics dashboard
- Bulk user management
- Automated moderation rules
- Appeal system for banned users
- Admin activity reports
- Custom badge designer UI
- Multi-language support for admin messages

## ✅ Testing Checklist

- [x] Theme switching animation works smoothly
- [x] Bottom tab hides when streaming
- [x] Pinned comment timer animates correctly
- [x] Gift particles display per tier
- [x] Admin role checking works
- [x] Reports can be created and managed
- [x] Live streams can be monitored
- [x] Admin messages can be sent
- [x] Penalties are tracked correctly
- [x] RLS policies enforce security
- [x] Action logging works
- [x] Dashboard statistics display correctly

## 📝 Notes

- **DO NOT** modify livestream start/stop logic
- **DO NOT** touch Cloudflare API key handling
- **DO NOT** interrupt streaming operations with admin actions
- All admin actions are logged for accountability
- Theme transitions do not impact livestream performance
- Bottom tab animations are GPU-accelerated for smooth performance
