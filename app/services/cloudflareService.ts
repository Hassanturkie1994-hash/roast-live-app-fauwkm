
import { supabase } from '@/app/integrations/supabase/client';

export interface StartLiveResponse {
  success: boolean;
  live_input_id?: string;
  ingest_url?: string | null;
  stream_key?: string | null;
  playback_url?: string;
  webrtc_url?: string | null;
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
      console.log('🎥 Starting live stream:', { title, userId });

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ Not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('📡 Calling start-live Edge Function...');

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

      console.log('📥 Response status:', response.status);

      const responseText = await response.text();
      console.log('📥 Response text:', responseText);

      let data: StartLiveResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
      }

      console.log('📥 Parsed response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        console.error('❌ Server returned error:', data.error);
        throw new Error(data.error || 'Failed to start live stream');
      }

      if (!data.live_input_id) {
        console.error('❌ Missing live_input_id in response:', data);
        throw new Error('Missing live_input_id in server response. This usually means Cloudflare credentials are not configured or the Cloudflare API returned an error.');
      }

      if (!data.ingest_url || !data.stream_key || !data.playback_url) {
        console.warn('⚠️ Some stream URLs are missing:', {
          hasIngestUrl: !!data.ingest_url,
          hasStreamKey: !!data.stream_key,
          hasPlaybackUrl: !!data.playback_url,
        });
      }

      console.log('✅ Live stream started successfully:', {
        live_input_id: data.live_input_id,
        hasIngestUrl: !!data.ingest_url,
        hasStreamKey: !!data.stream_key,
        hasPlaybackUrl: !!data.playback_url,
        hasWebrtcUrl: !!data.webrtc_url,
      });

      return data;
    } catch (error) {
      console.error('❌ Error in startLive:', error);
      throw error;
    }
  }

  async stopLive(liveInputId: string): Promise<StopLiveResponse> {
    try {
      console.log('🛑 Stopping live stream:', liveInputId);

      if (!liveInputId) {
        console.error('❌ Missing live_input_id');
        throw new Error('Missing live_input_id');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('📡 Calling stop-live Edge Function...');

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

      console.log('📥 Response status:', response.status);

      const responseText = await response.text();
      console.log('📥 Response text:', responseText);

      let data: StopLiveResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
      }

      console.log('📥 Parsed response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        console.error('❌ Server returned error:', data.error);
        throw new Error(data.error || 'Failed to stop live stream');
      }

      console.log('✅ Live stream stopped successfully');

      return data;

    } catch (error) {
      console.error('❌ Error in stopLive:', error);
      throw error;
    }
  }
}

export const cloudflareService = new CloudflareService();
