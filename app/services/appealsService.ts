
import { supabase } from '@/app/integrations/supabase/client';

export interface Appeal {
  id: string;
  user_id: string;
  violation_id?: string;
  strike_id?: string;
  appeal_reason: string;
  evidence_url?: string;
  status: 'pending' | 'approved' | 'denied';
  admin_decision?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Strike {
  id: string;
  user_id: string;
  strike_type: string;
  strike_message: string;
  strike_level: number;
  expires_at: string;
  created_at: string;
  active: boolean;
}

export interface Violation {
  id: string;
  reported_user_id: string;
  reporter_user_id?: string;
  stream_id?: string;
  violation_reason: string;
  notes?: string;
  severity_level: number;
  created_at: string;
  resolved: boolean;
}

export const appealsService = {
  // Get user's strikes
  async getUserStrikes(userId: string): Promise<Strike[]> {
    try {
      const { data, error } = await supabase
        .from('content_safety_strikes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strikes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching strikes:', error);
      return [];
    }
  },

  // Get user's violations
  async getUserViolations(userId: string): Promise<Violation[]> {
    try {
      const { data, error } = await supabase
        .from('content_safety_violations')
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching violations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching violations:', error);
      return [];
    }
  },

  // Get user's appeals
  async getUserAppeals(userId: string): Promise<Appeal[]> {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appeals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching appeals:', error);
      return [];
    }
  },

  // Submit an appeal
  async submitAppeal(
    userId: string,
    violationId: string | undefined,
    strikeId: string | undefined,
    appealReason: string,
    evidenceUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appeals')
        .insert({
          user_id: userId,
          violation_id: violationId,
          strike_id: strikeId,
          appeal_reason: appealReason,
          evidence_url: evidenceUrl,
          status: 'pending',
        });

      if (error) {
        console.error('Error submitting appeal:', error);
        return { success: false, error: error.message };
      }

      // Send notification to user
      await supabase.from('notifications').insert({
        type: 'message',
        receiver_id: userId,
        message: 'Your appeal has been submitted and is under review.',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting appeal:', error);
      return { success: false, error: error.message };
    }
  },

  // Get appeal by ID
  async getAppeal(appealId: string): Promise<Appeal | null> {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .eq('id', appealId)
        .single();

      if (error) {
        console.error('Error fetching appeal:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching appeal:', error);
      return null;
    }
  },
};
