
import { supabase } from '@/app/integrations/supabase/client';

export interface StreamGuestSeat {
  id: string;
  stream_id: string;
  user_id: string | null;
  seat_index: number;
  joined_at: string | null;
  left_at: string | null;
  is_moderator: boolean;
  mic_enabled: boolean;
  camera_enabled: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface StreamGuestInvitation {
  id: string;
  stream_id: string;
  inviter_id: string;
  invitee_id: string;
  seat_index: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export interface GuestEvent {
  id: string;
  stream_id: string;
  user_id: string | null;
  event_type: string;
  display_name: string;
  metadata: any;
  created_at: string;
}

class StreamGuestService {
  /**
   * Get all guest seats for a stream
   */
  async getGuestSeats(streamId: string): Promise<StreamGuestSeat[]> {
    const { data, error } = await supabase
      .from('stream_guest_seats')
      .select('*, profiles(id, display_name, avatar_url)')
      .eq('stream_id', streamId)
      .order('seat_index', { ascending: true });

    if (error) {
      console.error('Error fetching guest seats:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get active guest seats (not left)
   */
  async getActiveGuestSeats(streamId: string): Promise<StreamGuestSeat[]> {
    const { data, error } = await supabase
      .from('stream_guest_seats')
      .select('*, profiles(id, display_name, avatar_url)')
      .eq('stream_id', streamId)
      .is('left_at', null)
      .order('seat_index', { ascending: true });

    if (error) {
      console.error('Error fetching active guest seats:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Find the first available seat index
   */
  async findAvailableSeatIndex(streamId: string): Promise<number | null> {
    const activeSeats = await this.getActiveGuestSeats(streamId);
    const occupiedIndices = activeSeats.map((seat) => seat.seat_index);

    for (let i = 0; i <= 8; i++) {
      if (!occupiedIndices.includes(i)) {
        return i;
      }
    }

    return null; // All seats are full
  }

  /**
   * Invite a user to join as a guest
   */
  async inviteGuest(
    streamId: string,
    inviterId: string,
    inviteeId: string
  ): Promise<{ success: boolean; invitation?: StreamGuestInvitation; error?: string }> {
    try {
      // Check if seats are locked
      const { data: stream } = await supabase
        .from('streams')
        .select('seats_locked')
        .eq('id', streamId)
        .single();

      if (stream?.seats_locked) {
        return { success: false, error: 'Seats are currently locked' };
      }

      // Find available seat
      const seatIndex = await this.findAvailableSeatIndex(streamId);
      if (seatIndex === null) {
        return { success: false, error: 'All guest seats are currently full' };
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('stream_guest_invitations')
        .select('*')
        .eq('stream_id', streamId)
        .eq('invitee_id', inviteeId)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        return { success: false, error: 'User already has a pending invitation' };
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('stream_guest_invitations')
        .insert({
          stream_id: streamId,
          inviter_id: inviterId,
          invitee_id: inviteeId,
          seat_index: seatIndex,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        return { success: false, error: error.message };
      }

      // Send notification to invitee
      await supabase.from('notifications').insert({
        type: 'stream_started',
        sender_id: inviterId,
        receiver_id: inviteeId,
        ref_stream_id: streamId,
        message: 'invited you to join their live stream',
        category: 'social',
      });

      return { success: true, invitation };
    } catch (error) {
      console.error('Error in inviteGuest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Accept an invitation and join as a guest
   */
  async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ success: boolean; seat?: StreamGuestSeat; error?: string }> {
    try {
      // Get invitation
      const { data: invitation, error: invError } = await supabase
        .from('stream_guest_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .single();

      if (invError || !invitation) {
        return { success: false, error: 'Invitation not found or expired' };
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('stream_guest_invitations')
          .update({ status: 'expired' })
          .eq('id', invitationId);
        return { success: false, error: 'Invitation has expired' };
      }

      // Create guest seat
      const { data: seat, error: seatError } = await supabase
        .from('stream_guest_seats')
        .insert({
          stream_id: invitation.stream_id,
          user_id: userId,
          seat_index: invitation.seat_index,
          joined_at: new Date().toISOString(),
          is_moderator: false,
          mic_enabled: true,
          camera_enabled: true,
        })
        .select('*, profiles(id, display_name, avatar_url)')
        .single();

      if (seatError) {
        console.error('Error creating guest seat:', seatError);
        return { success: false, error: seatError.message };
      }

      // Update invitation status
      await supabase
        .from('stream_guest_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      // Log guest event
      await this.logGuestEvent(
        invitation.stream_id,
        userId,
        'joined_live',
        seat.profiles?.display_name || 'Guest'
      );

      return { success: true, seat };
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stream_guest_invitations')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invitee_id', userId);

      if (error) {
        console.error('Error declining invitation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in declineInvitation:', error);
      return false;
    }
  }

  /**
   * Leave a guest seat
   */
  async leaveGuestSeat(streamId: string, userId: string): Promise<boolean> {
    try {
      // Get the seat
      const { data: seat } = await supabase
        .from('stream_guest_seats')
        .select('*, profiles(display_name)')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!seat) {
        return false;
      }

      // Update seat to mark as left
      const { error } = await supabase
        .from('stream_guest_seats')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) {
        console.error('Error leaving guest seat:', error);
        return false;
      }

      // Log guest event
      await this.logGuestEvent(
        streamId,
        userId,
        'left_live',
        seat.profiles?.display_name || 'Guest'
      );

      return true;
    } catch (error) {
      console.error('Error in leaveGuestSeat:', error);
      return false;
    }
  }

  /**
   * Remove a guest from their seat (host action)
   */
  async removeGuest(streamId: string, userId: string, hostId: string): Promise<boolean> {
    try {
      // Verify host owns the stream
      const { data: stream } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', streamId)
        .single();

      if (!stream || stream.broadcaster_id !== hostId) {
        console.error('Unauthorized: User is not the stream host');
        return false;
      }

      // Get the seat
      const { data: seat } = await supabase
        .from('stream_guest_seats')
        .select('*, profiles(display_name)')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!seat) {
        return false;
      }

      // Update seat to mark as left
      const { error } = await supabase
        .from('stream_guest_seats')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) {
        console.error('Error removing guest:', error);
        return false;
      }

      // Log guest event
      await this.logGuestEvent(
        streamId,
        userId,
        'host_removed',
        seat.profiles?.display_name || 'Guest'
      );

      return true;
    } catch (error) {
      console.error('Error in removeGuest:', error);
      return false;
    }
  }

  /**
   * Update guest mic status
   */
  async updateMicStatus(
    streamId: string,
    userId: string,
    micEnabled: boolean
  ): Promise<boolean> {
    try {
      const { data: seat } = await supabase
        .from('stream_guest_seats')
        .select('*, profiles(display_name)')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!seat) {
        return false;
      }

      const { error } = await supabase
        .from('stream_guest_seats')
        .update({ mic_enabled: micEnabled })
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) {
        console.error('Error updating mic status:', error);
        return false;
      }

      // Log guest event
      await this.logGuestEvent(
        streamId,
        userId,
        micEnabled ? 'unmuted_mic' : 'muted_mic',
        seat.profiles?.display_name || 'Guest'
      );

      return true;
    } catch (error) {
      console.error('Error in updateMicStatus:', error);
      return false;
    }
  }

  /**
   * Update guest camera status
   */
  async updateCameraStatus(
    streamId: string,
    userId: string,
    cameraEnabled: boolean
  ): Promise<boolean> {
    try {
      const { data: seat } = await supabase
        .from('stream_guest_seats')
        .select('*, profiles(display_name)')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!seat) {
        return false;
      }

      const { error } = await supabase
        .from('stream_guest_seats')
        .update({ camera_enabled: cameraEnabled })
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) {
        console.error('Error updating camera status:', error);
        return false;
      }

      // Log guest event
      await this.logGuestEvent(
        streamId,
        userId,
        cameraEnabled ? 'enabled_camera' : 'disabled_camera',
        seat.profiles?.display_name || 'Guest'
      );

      return true;
    } catch (error) {
      console.error('Error in updateCameraStatus:', error);
      return false;
    }
  }

  /**
   * Toggle moderator status for a guest
   */
  async toggleModeratorStatus(
    streamId: string,
    userId: string,
    hostId: string,
    isModerator: boolean
  ): Promise<boolean> {
    try {
      // Verify host owns the stream
      const { data: stream } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', streamId)
        .single();

      if (!stream || stream.broadcaster_id !== hostId) {
        console.error('Unauthorized: User is not the stream host');
        return false;
      }

      const { data: seat } = await supabase
        .from('stream_guest_seats')
        .select('*, profiles(display_name)')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!seat) {
        return false;
      }

      const { error } = await supabase
        .from('stream_guest_seats')
        .update({ is_moderator: isModerator })
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) {
        console.error('Error toggling moderator status:', error);
        return false;
      }

      // Log guest event
      await this.logGuestEvent(
        streamId,
        userId,
        isModerator ? 'became_moderator' : 'removed_moderator',
        seat.profiles?.display_name || 'Guest'
      );

      return true;
    } catch (error) {
      console.error('Error in toggleModeratorStatus:', error);
      return false;
    }
  }

  /**
   * Lock/unlock guest seats
   */
  async toggleSeatsLock(streamId: string, hostId: string, locked: boolean): Promise<boolean> {
    try {
      // Verify host owns the stream
      const { data: stream } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', streamId)
        .single();

      if (!stream || stream.broadcaster_id !== hostId) {
        console.error('Unauthorized: User is not the stream host');
        return false;
      }

      const { error } = await supabase
        .from('streams')
        .update({ seats_locked: locked })
        .eq('id', streamId);

      if (error) {
        console.error('Error toggling seats lock:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleSeatsLock:', error);
      return false;
    }
  }

  /**
   * Swap two guest seats
   */
  async swapSeats(
    streamId: string,
    hostId: string,
    seatIndex1: number,
    seatIndex2: number
  ): Promise<boolean> {
    try {
      // Verify host owns the stream
      const { data: stream } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', streamId)
        .single();

      if (!stream || stream.broadcaster_id !== hostId) {
        console.error('Unauthorized: User is not the stream host');
        return false;
      }

      // Get both seats
      const { data: seats } = await supabase
        .from('stream_guest_seats')
        .select('*')
        .eq('stream_id', streamId)
        .in('seat_index', [seatIndex1, seatIndex2])
        .is('left_at', null);

      if (!seats || seats.length !== 2) {
        console.error('Could not find both seats');
        return false;
      }

      const seat1 = seats.find((s) => s.seat_index === seatIndex1);
      const seat2 = seats.find((s) => s.seat_index === seatIndex2);

      if (!seat1 || !seat2) {
        return false;
      }

      // Swap seat indices
      await supabase
        .from('stream_guest_seats')
        .update({ seat_index: seatIndex2 })
        .eq('id', seat1.id);

      await supabase
        .from('stream_guest_seats')
        .update({ seat_index: seatIndex1 })
        .eq('id', seat2.id);

      return true;
    } catch (error) {
      console.error('Error in swapSeats:', error);
      return false;
    }
  }

  /**
   * End all guest sessions when stream ends
   */
  async endAllGuestSessions(streamId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stream_guest_seats')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .is('left_at', null);

      if (error) {
        console.error('Error ending guest sessions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in endAllGuestSessions:', error);
      return false;
    }
  }

  /**
   * Log a guest event for chat integration
   */
  async logGuestEvent(
    streamId: string,
    userId: string | null,
    eventType: string,
    displayName: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.from('stream_guest_events').insert({
        stream_id: streamId,
        user_id: userId,
        event_type: eventType,
        display_name: displayName,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error logging guest event:', error);
    }
  }

  /**
   * Get recent guest events for a stream
   */
  async getGuestEvents(streamId: string, limit: number = 50): Promise<GuestEvent[]> {
    const { data, error } = await supabase
      .from('stream_guest_events')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching guest events:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Subscribe to guest seat changes
   */
  subscribeToGuestSeats(streamId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`stream:${streamId}:guest_seats`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_guest_seats',
          filter: `stream_id=eq.${streamId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to guest events
   */
  subscribeToGuestEvents(streamId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`stream:${streamId}:guest_events`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_guest_events',
          filter: `stream_id=eq.${streamId}`,
        },
        callback
      )
      .subscribe();

    return channel;
  }
}

export const streamGuestService = new StreamGuestService();
