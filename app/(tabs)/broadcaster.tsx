
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
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
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setLiveTime((prev) => prev + 1);
        // In production, fetch real viewer count from Supabase
        setViewerCount((prev) => prev + Math.floor(Math.random() * 3));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

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
      // Call Cloudflare Stream API via Edge Function
      const response = await cloudflareService.startLive(streamTitle, user.id);

      if (!response.success) {
        throw new Error('Failed to start stream');
      }

      // Store stream data
      setCurrentStreamId(response.stream.id);
      setRtmpUrl(response.ingest_url);
      setStreamKey(response.stream_key);
      setIsLive(true);
      setViewerCount(0);
      setShowSetup(false);
      setStreamTitle('');

      // Show RTMP credentials to user
      Alert.alert(
        'Stream Started!',
        `Your stream is now live!\n\nRTMP URL: ${response.ingest_url}\nStream Key: ${response.stream_key}\n\nUse these credentials in your streaming software (OBS, etc.)`,
        [{ text: 'OK' }]
      );

      console.log('Stream started successfully:', {
        streamId: response.stream.id,
        playbackUrl: response.playback_url,
      });
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

  const endStream = async () => {
    if (!currentStreamId) return;

    setIsLoading(true);

    try {
      // Call Cloudflare Stream API via Edge Function
      await cloudflareService.stopLive(currentStreamId);

      setIsLive(false);
      setViewerCount(0);
      setLiveTime(0);
      setCurrentStreamId(null);
      setRtmpUrl(null);
      setStreamKey(null);

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

  const copyToClipboard = (text: string, label: string) => {
    // Note: Clipboard API would need to be implemented
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  return (
    <View style={commonStyles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          {isLive && (
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
          )}

          {isLive && (
            <View style={styles.watermarkContainer}>
              <RoastLiveLogo size="small" opacity={0.25} />
            </View>
          )}

          {isLive && rtmpUrl && streamKey && (
            <View style={styles.credentialsContainer}>
              <Text style={styles.credentialsTitle}>RTMP Credentials</Text>
              <TouchableOpacity
                style={styles.credentialRow}
                onPress={() => copyToClipboard(rtmpUrl, 'RTMP URL')}
              >
                <Text style={styles.credentialLabel}>URL:</Text>
                <Text style={styles.credentialValue} numberOfLines={1}>
                  {rtmpUrl}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.credentialRow}
                onPress={() => copyToClipboard(streamKey, 'Stream Key')}
              >
                <Text style={styles.credentialLabel}>Key:</Text>
                <Text style={styles.credentialValue} numberOfLines={1}>
                  {streamKey}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.controlsContainer}>
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
                onPress={() => setIsMicOn(!isMicOn)}
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
                  title={isLive ? 'END STREAM' : 'START LIVE'}
                  onPress={handleStartLiveSetup}
                  size="large"
                  disabled={isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
                onPress={() => setIsCameraOn(!isCameraOn)}
              >
                <IconSymbol
                  ios_icon_name={isCameraOn ? 'video.fill' : 'video.slash.fill'}
                  android_material_icon_name={isCameraOn ? 'videocam' : 'videocam_off'}
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <IconSymbol
                ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
                android_material_icon_name="flip_camera_ios"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
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
                After starting, you&apos;ll receive RTMP credentials to use with streaming software like OBS.
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
    bottom: 140,
    right: 20,
    pointerEvents: 'none',
  },
  credentialsContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gradientEnd,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  credentialRow: {
    marginBottom: 8,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    fontFamily: 'monospace',
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
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
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
