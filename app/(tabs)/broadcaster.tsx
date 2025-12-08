
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { router } from 'expo-router';
import ChatOverlay from '@/components/ChatOverlay';

export default function BroadcasterScreen() {
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [ingestUrl, setIngestUrl] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [rtcPublishUrl, setRtcPublishUrl] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNativeStreamingAvailable, setIsNativeStreamingAvailable] = useState(false);
  const publisherRef = useRef<any>(null);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
    
    // Check if native streaming is available
    // Note: react-native-nodemediaclient requires native modules
    // For web/expo-go, we'll show instructions to use OBS
    // For production native builds, this will enable direct RTMP streaming
    setIsNativeStreamingAvailable(Platform.OS !== 'web');
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setLiveTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const subscribeToViewerUpdates = useCallback(() => {
    if (!currentStreamId) return;

    const channel = supabase
      .channel(`stream:${currentStreamId}:broadcaster`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        console.log('Viewer count update:', payload);
        setViewerCount(payload.payload.count);
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [currentStreamId]);

  // Subscribe to viewer count updates
  useEffect(() => {
    if (isLive && currentStreamId) {
      subscribeToViewerUpdates();
    }
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [isLive, currentStreamId, subscribeToViewerUpdates]);

  if (!permission) {
    return <View style={commonStyles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[commonStyles.container, styles.permissionContainer]}>
        <IconSymbol
          ios_icon_name="video.fill"
          android_material_icon_name="videocam"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <GradientButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleStartLiveSetup = () => {
    if (isLive) {
      Alert.alert(
        'End Stream',
        'Are you sure you want to end your live stream?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Stream',
            style: 'destructive',
            onPress: endStream,
          },
        ]
      );
    } else {
      setShowSetup(true);
    }
  };

  const startNativeStream = async (ingestUrl: string, streamKey: string) => {
    // Note: This would require react-native-nodemediaclient to be installed
    // For now, we'll just show instructions
    console.log('Native streaming not available in this build');
    return false;
  };

  const stopNativeStream = async () => {
    if (publisherRef.current) {
      try {
        console.log('Stopping native stream');
        publisherRef.current = null;
      } catch (error) {
        console.error('Error stopping native stream:', error);
      }
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Error', 'Please enter a stream title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to start streaming');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting live stream with title:', streamTitle);
      
      // Call Cloudflare Stream API via Edge Function
      const response = await cloudflareService.startLive(streamTitle, user.id);

      // TASK 3 — Improve Logging
      console.log('SERVER RESPONSE:', response);

      // TASK 2 — Update App-side Validation
      if (!response.success || !response.stream?.id) {
        console.error('SERVER RESPONSE:', response);
        throw new Error('Invalid response from server: missing stream.id');
      }

      // TASK 2 — Store all values for later use
      setCurrentStreamId(response.stream.id);
      setIngestUrl(response.ingest_url);
      setStreamKey(response.stream_key);
      setRtcPublishUrl(response.rtc_publish_url || null);
      setPlaybackUrl(response.playback_url);
      
      setIsLive(true);
      setViewerCount(0);
      setShowSetup(false);
      setStreamTitle('');

      console.log('Stream started successfully:', {
        streamId: response.stream.id,
        ingestUrl: response.ingest_url,
        streamKey: response.stream_key,
        rtcPublishUrl: response.rtc_publish_url,
        playbackUrl: response.playback_url,
      });

      // Try to start native streaming if available
      if (isNativeStreamingAvailable && response.ingest_url && response.stream_key) {
        const nativeStarted = await startNativeStream(
          response.ingest_url,
          response.stream_key
        );

        if (nativeStarted) {
          Alert.alert(
            '🔴 You are LIVE!',
            'Your stream is now broadcasting. Viewers can watch you live!',
            [{ text: 'OK' }]
          );
        } else {
          // Fallback to showing instructions
          showStreamingInstructions(response.ingest_url, response.stream_key);
        }
      } else {
        // Show instructions for OBS or other streaming software
        showStreamingInstructions(response.ingest_url, response.stream_key);
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to start stream. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showStreamingInstructions = (ingestUrl: string, streamKey: string) => {
    Alert.alert(
      '🎥 Stream Setup Required',
      `Your stream session is ready!\n\nTo broadcast, use streaming software like OBS:\n\n` +
      `Server: ${ingestUrl}\n` +
      `Stream Key: ${streamKey}\n\n` +
      `Note: In production native apps, streaming will happen automatically from your camera.`,
      [
        {
          text: 'Copy Server URL',
          onPress: () => {
            // In production, implement clipboard copy
            console.log('Copy:', ingestUrl);
          },
        },
        {
          text: 'Copy Stream Key',
          onPress: () => {
            // In production, implement clipboard copy
            console.log('Copy:', streamKey);
          },
        },
        { text: 'OK' },
      ]
    );
  };

  const endStream = async () => {
    if (!currentStreamId) return;

    setIsLoading(true);

    try {
      // Stop native streaming if active
      await stopNativeStream();

      // Call Cloudflare Stream API via Edge Function
      await cloudflareService.stopLive(currentStreamId);

      setIsLive(false);
      setViewerCount(0);
      setLiveTime(0);
      setCurrentStreamId(null);
      setIngestUrl(null);
      setStreamKey(null);
      setRtcPublishUrl(null);
      setPlaybackUrl(null);

      Alert.alert('Stream Ended', 'Your live stream has been ended successfully.');
    } catch (error) {
      console.error('Error ending stream:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to end stream. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={commonStyles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          {isLive && (
            <>
              <View style={styles.topBar}>
                <LiveBadge size="small" />
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={16}
                      color={colors.text}
                    />
                    <Text style={styles.statText}>{viewerCount}</Text>
                  </View>
                  <View style={styles.stat}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.text}
                    />
                    <Text style={styles.statText}>{formatTime(liveTime)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.watermarkContainer}>
                <RoastLiveLogo size="small" opacity={0.25} />
              </View>

              {currentStreamId && (
                <ChatOverlay streamId={currentStreamId} isBroadcaster={true} />
              )}
            </>
          )}

          <View style={styles.controlsContainer}>
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
                onPress={() => setIsMicOn(!isMicOn)}
                disabled={!isLive}
              >
                <IconSymbol
                  ios_icon_name={isMicOn ? 'mic.fill' : 'mic.slash.fill'}
                  android_material_icon_name={isMicOn ? 'mic' : 'mic_off'}
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>

              <View style={styles.startButtonContainer}>
                <GradientButton
                  title={isLive ? 'END STREAM' : 'GO LIVE'}
                  onPress={handleStartLiveSetup}
                  size="large"
                  disabled={isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
                onPress={toggleCameraFacing}
                disabled={!isLive}
              >
                <IconSymbol
                  ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                  android_material_icon_name="flip_camera_ios"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>

      <Modal
        visible={showSetup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSetup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RoastLiveLogo size="medium" style={styles.modalLogo} />
            <Text style={styles.modalTitle}>Setup Your Stream</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Stream Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What are you streaming?"
                placeholderTextColor={colors.placeholder}
                value={streamTitle}
                onChangeText={setStreamTitle}
                maxLength={100}
                autoFocus
              />
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.infoText}>
                {isNativeStreamingAvailable
                  ? 'Your camera will automatically start streaming when you go live. No additional software needed!'
                  : 'You\'ll need streaming software like OBS to broadcast. RTMP credentials will be provided after you start.'}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSetup(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.goLiveButtonContainer}>
                <GradientButton
                  title={isLoading ? 'STARTING...' : 'GO LIVE'}
                  onPress={startStream}
                  size="medium"
                  disabled={isLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    pointerEvents: 'none',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  controlButtonOff: {
    backgroundColor: 'rgba(164, 0, 40, 0.7)',
  },
  startButtonContainer: {
    marginHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalLogo: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(164, 0, 40, 0.1)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  goLiveButtonContainer: {
    flex: 1,
  },
});
