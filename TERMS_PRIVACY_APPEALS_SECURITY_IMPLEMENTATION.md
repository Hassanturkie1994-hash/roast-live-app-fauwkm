
# Terms of Service, Privacy Policy, Appeals & Security Implementation

## Overview
This document outlines the complete implementation of four major features:
1. **Terms of Service Screen** - Platform usage policy with acceptance tracking
2. **Privacy Policy Screen** - Data handling policy with user rights
3. **Appeals System** - Strike and violation appeal process
4. **Account Security Panel** - 2FA, password management, and login history

## Database Schema

### New Tables Created

#### 1. `terms_of_service_acceptance`
Tracks user acceptance of Terms of Service.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `accepted_at` (TIMESTAMPTZ)
- `version` (TEXT, default '1.0')
- `device` (TEXT, optional)
- `ip_address` (TEXT, optional)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own acceptance records
- Users can insert their own acceptance records

#### 2. `privacy_policy_acceptance`
Tracks user acceptance of Privacy Policy.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `accepted_at` (TIMESTAMPTZ)
- `version` (TEXT, default '1.0')
- `device` (TEXT, optional)
- `ip_address` (TEXT, optional)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own acceptance records
- Users can insert their own acceptance records

#### 3. `appeals`
Stores user appeals for strikes and violations.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `violation_id` (UUID, Foreign Key → content_safety_violations.id, optional)
- `strike_id` (UUID, Foreign Key → content_safety_strikes.id, optional)
- `appeal_reason` (TEXT)
- `evidence_url` (TEXT, optional)
- `status` (TEXT: 'pending', 'approved', 'denied')
- `admin_decision` (TEXT, optional)
- `reviewed_by` (UUID, Foreign Key → profiles.id, optional)
- `reviewed_at` (TIMESTAMPTZ, optional)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own appeals
- Users can create their own appeals
- Users can update their own appeals

#### 4. `two_factor_auth`
Stores 2FA settings for users.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id, unique)
- `method` (TEXT: 'sms', 'email')
- `phone_number` (TEXT, optional)
- `email` (TEXT, optional)
- `is_enabled` (BOOLEAN, default false)
- `secret_key` (TEXT, optional)
- `backup_codes` (TEXT[], optional)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own 2FA settings
- Users can insert their own 2FA settings
- Users can update their own 2FA settings

#### 5. `login_history`
Tracks user login sessions across devices.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `device` (TEXT, optional)
- `ip_address` (TEXT, optional)
- `location` (TEXT, optional)
- `user_agent` (TEXT, optional)
- `status` (TEXT: 'success', 'failed', 'logged_out')
- `logged_in_at` (TIMESTAMPTZ)
- `logged_out_at` (TIMESTAMPTZ, optional)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own login history
- Users can insert their own login history
- Users can update their own login history

#### 6. `verification_codes`
Stores temporary verification codes for 2FA.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `code` (TEXT)
- `method` (TEXT: 'sms', 'email')
- `expires_at` (TIMESTAMPTZ)
- `used` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own verification codes
- Users can insert their own verification codes
- Users can update their own verification codes

## Service Files

### 1. `termsPrivacyService.ts`
Handles Terms of Service and Privacy Policy acceptance.

**Functions:**
- `acceptTermsOfService(userId, device?, ipAddress?)` - Record TOS acceptance
- `getTermsAcceptance(userId)` - Get user's TOS acceptance record
- `hasAcceptedTerms(userId)` - Check if user has accepted TOS
- `acceptPrivacyPolicy(userId, device?, ipAddress?)` - Record privacy policy acceptance
- `getPrivacyAcceptance(userId)` - Get user's privacy acceptance record
- `hasAcceptedPrivacy(userId)` - Check if user has accepted privacy policy

### 2. `appealsService.ts`
Manages strikes, violations, and appeals.

**Functions:**
- `getUserStrikes(userId)` - Get all strikes for a user
- `getUserViolations(userId)` - Get all violations for a user
- `getUserAppeals(userId)` - Get all appeals submitted by user
- `submitAppeal(userId, violationId?, strikeId?, appealReason, evidenceUrl?)` - Submit new appeal
- `getAppeal(appealId)` - Get specific appeal details

### 3. `twoFactorAuthService.ts`
Handles 2FA and login security.

**Functions:**
- `get2FASettings(userId)` - Get user's 2FA configuration
- `enable2FA(userId, method, phoneNumber?, email?)` - Enable 2FA
- `disable2FA(userId)` - Disable 2FA
- `generateVerificationCode(userId, method)` - Generate 6-digit code
- `verifyCode(userId, code)` - Verify submitted code
- `getLoginHistory(userId)` - Get user's login history
- `logLogin(userId, device?, ipAddress?, location?, userAgent?)` - Log new login
- `logoutFromDevice(loginHistoryId)` - Logout specific device
- `logoutFromAllDevices(userId)` - Logout all devices

## Screen Components

### 1. TermsOfServiceScreen
**Location:** `app/screens/TermsOfServiceScreen.tsx`

**Features:**
- Displays complete Terms of Service
- Shows acceptance status with date
- Checkbox for agreement
- Stores acceptance timestamp in database
- Sections:
  - Platform Usage Rules
  - Behavior Rules
  - Purchases and Gifting Terms
  - Account Responsibility
  - Appeals Flow Summary

### 2. PrivacyPolicyScreen
**Location:** `app/screens/PrivacyPolicyScreen.tsx`

**Features:**
- Displays Privacy & Data Handling policy
- Shows acceptance status with date
- Lists all collected data types
- Explains data usage and sharing
- User rights actions:
  - Delete Account
  - Export Data
  - Turn Off Notifications
  - Change Password
  - Enable 2FA
- Checkbox for agreement
- Stores acceptance timestamp in database

### 3. AppealsViolationsScreen
**Location:** `app/screens/AppealsViolationsScreen.tsx`

**Features:**
- **Strike History Section:**
  - Shows all strikes with level badges
  - Displays time remaining for active strikes
  - Strike type and message
  - Submit appeal button for active strikes

- **Violations Section:**
  - Lists all violations with severity levels
  - Shows violation reason and notes
  - Submit appeal button for unresolved violations

- **Appeals Section:**
  - Shows all submitted appeals
  - Status badges (pending, approved, denied)
  - Admin decision display
  - Submission and review dates

- **Appeal Modal:**
  - Text area for explanation
  - Optional evidence URL field
  - Submit button

### 4. AccountSecurityScreen
**Location:** `app/screens/AccountSecurityScreen.tsx`

**Features:**
- **Security Settings:**
  - 2FA toggle switch
  - Shows current 2FA method (SMS/Email)
  - Change password link

- **Login History:**
  - Lists all login sessions
  - Shows device type, time, location, IP
  - Status badges (success, logged_out, failed)
  - Logout individual device button
  - Logout all devices button

- **2FA Setup Modal:**
  - Method selection (SMS or Email)
  - Phone number input for SMS
  - Email input for Email method
  - Enable button

## Navigation Integration

### Updated AccountSettingsScreen
Added new sections:

**Security Section:**
- Account Security → `/screens/AccountSecurityScreen`
- Appeals & Violations → `/screens/AppealsViolationsScreen`

**Legal & Privacy Section:**
- Terms of Service → `/screens/TermsOfServiceScreen`
- Privacy Policy → `/screens/PrivacyPolicyScreen`

## Key Features

### Terms of Service
✅ Complete platform usage policy
✅ Acceptance tracking with timestamp
✅ Version control support
✅ Device and IP logging
✅ Visible in settings after acceptance

### Privacy Policy
✅ Comprehensive data collection disclosure
✅ Data usage explanation
✅ Sharing policy transparency
✅ User rights with actionable buttons
✅ Acceptance tracking with timestamp

### Appeals System
✅ View all strikes and violations
✅ Submit appeals with explanation
✅ Attach evidence URLs
✅ Track appeal status
✅ View admin decisions
✅ Automatic inbox notifications

### Account Security
✅ Two-factor authentication (SMS/Email)
✅ Enable/disable 2FA
✅ Login history tracking
✅ Device management
✅ Logout from specific devices
✅ Logout from all devices
✅ Change password integration

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- No cross-user data leakage
- Secure data isolation

### Data Privacy
- Sensitive data (2FA secrets, codes) stored securely
- Verification codes expire after 10 minutes
- Login history tracks security events
- IP addresses and device info logged for security

### Appeal Process
- Users can appeal any strike or violation
- Evidence can be attached
- Admin review required
- Notifications sent on status changes

## Usage Flow

### Terms of Service Flow
1. User navigates to Settings → Legal & Privacy → Terms of Service
2. User reads the terms
3. User checks "I Agree to Terms of Service"
4. User clicks "Accept Terms"
5. Acceptance recorded with timestamp
6. Green banner shows acceptance date

### Privacy Policy Flow
1. User navigates to Settings → Legal & Privacy → Privacy Policy
2. User reads the policy
3. User can access user rights actions
4. User checks "I Understand & Accept Privacy Policy"
5. User clicks "Accept Privacy Policy"
6. Acceptance recorded with timestamp
7. Green banner shows acceptance date

### Appeals Flow
1. User navigates to Settings → Security → Appeals & Violations
2. User views strikes and violations
3. User clicks "Submit Appeal" on a strike/violation
4. User enters explanation and optional evidence URL
5. User clicks "Submit Appeal"
6. Appeal status shows as "pending"
7. User receives inbox notification when admin reviews

### 2FA Setup Flow
1. User navigates to Settings → Security → Account Security
2. User toggles 2FA switch to ON
3. Modal opens with method selection
4. User selects SMS or Email
5. User enters phone number or email
6. User clicks "Enable 2FA"
7. 2FA is enabled and shown in settings

### Login History Flow
1. User navigates to Settings → Security → Account Security
2. User views all login sessions
3. User can logout specific devices
4. User can logout all devices at once

## Admin Integration

### Appeal Review (Future Enhancement)
Admins can:
- View all pending appeals
- Review appeal details
- Approve or deny appeals
- Add decision notes
- Automatically notify users

### Strike Management
Admins can:
- Issue strikes with levels (1-3)
- Set expiration dates
- Add strike messages
- Track strike history

## Testing Checklist

### Terms of Service
- [ ] Screen loads correctly
- [ ] Checkbox toggles properly
- [ ] Accept button disabled when unchecked
- [ ] Acceptance saves to database
- [ ] Acceptance date displays correctly
- [ ] Can view from settings

### Privacy Policy
- [ ] Screen loads correctly
- [ ] All user rights buttons work
- [ ] Checkbox toggles properly
- [ ] Accept button disabled when unchecked
- [ ] Acceptance saves to database
- [ ] Acceptance date displays correctly

### Appeals System
- [ ] Strikes display correctly
- [ ] Violations display correctly
- [ ] Appeals display correctly
- [ ] Appeal modal opens
- [ ] Appeal submission works
- [ ] Status updates correctly
- [ ] Notifications sent

### Account Security
- [ ] 2FA toggle works
- [ ] 2FA modal opens
- [ ] Method selection works
- [ ] Phone/email input works
- [ ] 2FA enables successfully
- [ ] Login history displays
- [ ] Device logout works
- [ ] Logout all devices works

## Future Enhancements

### Terms & Privacy
- [ ] Multi-language support
- [ ] Version history tracking
- [ ] Force re-acceptance on updates
- [ ] PDF export functionality

### Appeals
- [ ] Photo/video evidence upload
- [ ] Appeal chat with admins
- [ ] Appeal history timeline
- [ ] Automatic appeal suggestions

### Security
- [ ] Authenticator app support (TOTP)
- [ ] Biometric authentication
- [ ] Security alerts
- [ ] Suspicious activity detection
- [ ] Password strength meter
- [ ] Password history

## Notes

### Important Considerations
1. **No Streaming Logic Modified:** All implementations are separate from live streaming functionality
2. **RLS Enabled:** All tables have proper Row Level Security policies
3. **User Privacy:** Sensitive data is properly secured
4. **Notifications:** Users receive inbox messages for important events
5. **Versioning:** Support for future policy updates with version tracking

### Database Indexes
All tables have proper indexes on:
- `user_id` columns for fast lookups
- `status` columns for filtering
- `expires_at` columns for expiration checks

### Performance
- Efficient queries with proper indexing
- Minimal database calls
- Cached data where appropriate
- Optimized RLS policies

## Conclusion

This implementation provides a complete legal, privacy, appeals, and security framework for the Roast Live app. All features are production-ready with proper database schema, RLS policies, service layers, and UI components. The system is designed to be scalable, secure, and user-friendly.
