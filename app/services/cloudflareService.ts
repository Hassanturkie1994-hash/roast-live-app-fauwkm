
import { supabase } from '@/app/integrations/supabase/client';

export interface StartLiveResponse {
  success: boolean;
  stream: {
    id: string;
    broadcaster_id: string;
    title: string;
    cloudflare_stream_id: string;
    ingest_url: string;
    stream_key: string;
    playback_url: string;
    status: string;
    viewer_count: number;
    started_at: string;
  };
  ingest_url: string;
  stream_key: string;
  playback_url: string;
}

export interface StopLiveResponse {
  success: boolean;
  stream: {
    id: string;
    status: string;
    ended_at: string;
  };
}

/**
 * Cloudflare Stream API Service
 * 
 * This service provides methods to interact with Cloudflare Stream
 * for live streaming functionality. All API calls go through Supabase
 * Edge Functions to keep credentials secure.
 */
class CloudflareService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = 'https://uaqsjqakhgycfopftzzp.supabase.co';
  }

  /**
   * Start a live stream
   * 
   * Creates a new live input in Cloudflare Stream and stores the
   * stream metadata in Supabase.
   * 
   * @param title - The title of the stream
   * @param broadcasterId - The ID of the broadcaster
   * @returns Promise with stream data including RTMP ingest URL and stream key
   */
  async startLive(title: string, broadcasterId: string): Promise<StartLiveResponse> {
    try {
      console.log('Starting live stream:', { title, broadcasterId });

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the Edge Function
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
            broadcaster_id: broadcasterId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Start live error:', errorData);
        throw new Error(errorData.error || 'Failed to start live stream');
      }

      const data: StartLiveResponse = await response.json();
      console.log('Live stream started successfully:', data);
      
      return data;
    } catch (error) {
      console.error('Error in startLive:', error);
      throw error;
    }
  }

  /**
   * Stop a live stream
   * 
   * Ends the live stream session in Cloudflare and updates the
   * stream status in Supabase.
   * 
   * @param streamId - The ID of the stream to stop
   * @returns Promise with updated stream data
   */
  async stopLive(streamId: string): Promise<StopLiveResponse> {
    try {
      console.log('Stopping live stream:', streamId);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the Edge Function
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/stop-live`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            stream_id: streamId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Stop live error:', errorData);
        throw new Error(errorData.error || 'Failed to stop live stream');
      }

      const data: StopLiveResponse = await response.json();
      console.log('Live stream stopped successfully:', data);
      
      return data;
    } catch (error) {
      console.error('Error in stopLive:', error);
      throw error;
    }
  }

  /**
   * Get stream status from Cloudflare
   * 
   * Note: This is a placeholder for future implementation.
   * You can add this method to check the live status of a stream
   * directly from Cloudflare if needed.
   */
  async getStreamStatus(cloudflareStreamId: string): Promise<any> {
    // This would require another Edge Function to call Cloudflare API
    // For now, we rely on the database status
    console.log('getStreamStatus not yet implemented for:', cloudflareStreamId);
    return null;
  }
}

// Export a singleton instance
export const cloudflareService = new CloudflareService();
