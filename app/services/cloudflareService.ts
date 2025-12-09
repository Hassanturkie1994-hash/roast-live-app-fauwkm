
import { supabase } from '@/app/integrations/supabase/client';

export interface StartLiveResponse {
  success: boolean;
  live_input_id: string;
  ingest_url: string;
  stream_key: string;
  playback_url: string;
  webrtc_url?: string;
  error?: string;
}

export interface StopLiveResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class CloudflareService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = 'https://uaqsjqakhgycfopftzzp.supabase.co';
  }

  async startLive(title: string, userId: string): Promise<StartLiveResponse> {
    try {
      console.log('Starting live stream:', { title, userId });

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/start-live`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title,
            user_id: userId,
          }),
        }
      );

      const data = await response.json();

      console.log("SERVER RESPONSE:", data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to start live stream');
      }

      if (!data.live_input_id) {
        throw new Error('Missing live_input_id in server response');
      }

      if (!data.ingest_url || !data.stream_key || !data.playback_url) {
        throw new Error('Stream setup incomplete from server');
      }

      console.log('Live started. Live Input ID:', data.live_input_id);

      return data;
    } catch (error) {
      console.error('Error in startLive:', error);
      throw error;
    }
  }

  async stopLive(liveInputId: string): Promise<StopLiveResponse> {
    try {
      console.log('Stopping live input:', liveInputId);

      if (!liveInputId) {
        throw new Error('Missing live_input_id');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/stop-live`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            live_input_id: liveInputId,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to stop live stream');
      }

      console.log('Live stream ended successfully:', data);

      return data;

    } catch (error) {
      console.error('Error in stopLive:', error);
      throw error;
    }
  }
}

export const cloudflareService = new CloudflareService();
