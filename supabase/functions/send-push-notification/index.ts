
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId: string;
  tokens: { token: string; platform: 'ios' | 'android' | 'web' }[];
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, tokens, notification }: PushNotificationRequest = await req.json();

    if (!userId || !tokens || tokens.length === 0 || !notification) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get FCM server key from environment
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Push notification service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Send push notifications to each device
    for (const { token, platform } of tokens) {
      try {
        if (platform === 'ios' || platform === 'android') {
          // Send via FCM (works for both iOS and Android)
          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`,
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title: notification.title,
                body: notification.body,
                sound: 'default',
              },
              data: notification.data || {},
              priority: 'high',
            }),
          });

          const fcmResult = await fcmResponse.json();
          
          if (fcmResponse.ok && fcmResult.success === 1) {
            results.push({ token, platform, status: 'sent' });
            console.log(`✅ Push notification sent to ${platform} device`);
          } else {
            results.push({ token, platform, status: 'failed', error: fcmResult });
            console.error(`❌ Failed to send push notification to ${platform} device:`, fcmResult);
            
            // If token is invalid, deactivate it
            if (fcmResult.results?.[0]?.error === 'InvalidRegistration' || 
                fcmResult.results?.[0]?.error === 'NotRegistered') {
              await supabase
                .from('push_device_tokens')
                .update({ is_active: false })
                .eq('device_token', token);
              console.log(`🗑️ Deactivated invalid token for ${platform} device`);
            }
          }
        } else if (platform === 'web') {
          // For web push notifications, you would use Web Push API
          // This is a placeholder - implement based on your web push setup
          console.log('Web push notifications not yet implemented');
          results.push({ token, platform, status: 'skipped', reason: 'Web push not implemented' });
        }
      } catch (error) {
        console.error(`Error sending push notification to ${platform} device:`, error);
        results.push({ token, platform, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
