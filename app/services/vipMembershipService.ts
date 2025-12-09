
import { supabase } from '@/app/integrations/supabase/client';
import { notificationService } from './notificationService';

export interface VIPMembership {
  id: string;
  vip_owner_id: string;
  subscriber_id: string;
  activated_at: string;
  expires_at: string;
  badge_text: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Create a VIP membership
 */
export async function createVIPMembership(
  ownerId: string,
  subscriberId: string,
  badgeText: string,
  durationMonths: number = 1
): Promise<{ success: boolean; error?: string; data?: VIPMembership }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const { data, error } = await supabase
      .from('vip_memberships')
      .insert({
        vip_owner_id: ownerId,
        subscriber_id: subscriberId,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        badge_text: badgeText,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating VIP membership:', error);
      return { success: false, error: error.message };
    }

    // Send notification to subscriber
    await notificationService.createNotification({
      type: 'vip_subscription',
      sender_id: ownerId,
      receiver_id: subscriberId,
      message: `You are now a VIP member! Your ${badgeText} badge is active.`,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in createVIPMembership:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get VIP memberships for an owner
 */
export async function getVIPMemberships(
  ownerId: string,
  activeOnly: boolean = true
): Promise<VIPMembership[]> {
  try {
    let query = supabase
      .from('vip_memberships')
      .select(`
        *,
        profiles:subscriber_id(username, display_name, avatar_url)
      `)
      .eq('vip_owner_id', ownerId)
      .order('activated_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching VIP memberships:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVIPMemberships:', error);
    return [];
  }
}

/**
 * Check if a user is a VIP member of another user
 */
export async function isVIPMember(
  ownerId: string,
  subscriberId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('vip_memberships')
      .select('id')
      .eq('vip_owner_id', ownerId)
      .eq('subscriber_id', subscriberId)
      .eq('is_active', true)
      .single();

    return !!data && !error;
  } catch (error) {
    console.error('Error checking VIP membership:', error);
    return false;
  }
}

/**
 * Deactivate a VIP membership
 */
export async function deactivateVIPMembership(
  membershipId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('vip_memberships')
      .update({ is_active: false })
      .eq('id', membershipId);

    if (error) {
      console.error('Error deactivating VIP membership:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deactivateVIPMembership:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Renew a VIP membership
 */
export async function renewVIPMembership(
  membershipId: string,
  durationMonths: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: membership, error: fetchError } = await supabase
      .from('vip_memberships')
      .select('expires_at')
      .eq('id', membershipId)
      .single();

    if (fetchError || !membership) {
      return { success: false, error: 'Membership not found' };
    }

    const currentExpiry = new Date(membership.expires_at);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    const { error } = await supabase
      .from('vip_memberships')
      .update({
        expires_at: newExpiry.toISOString(),
        is_active: true,
      })
      .eq('id', membershipId);

    if (error) {
      console.error('Error renewing VIP membership:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in renewVIPMembership:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get VIP badge for a user in a specific context
 */
export async function getVIPBadge(
  ownerId: string,
  subscriberId: string
): Promise<{ badgeText: string; badgeColor: string } | null> {
  try {
    const { data, error } = await supabase
      .from('vip_memberships')
      .select(`
        badge_text,
        vip_owner:vip_owner_id(
          fan_clubs(badge_color)
        )
      `)
      .eq('vip_owner_id', ownerId)
      .eq('subscriber_id', subscriberId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    const badgeColor = (data as any).vip_owner?.fan_clubs?.badge_color || '#FF1493';

    return {
      badgeText: data.badge_text,
      badgeColor,
    };
  } catch (error) {
    console.error('Error getting VIP badge:', error);
    return null;
  }
}

export const vipMembershipService = {
  createVIPMembership,
  getVIPMemberships,
  isVIPMember,
  deactivateVIPMembership,
  renewVIPMembership,
  getVIPBadge,
};
