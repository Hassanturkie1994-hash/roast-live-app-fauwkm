
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Platform, BackHandler } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { supabase } from '@/app/integrations/supabase/client';
import { cloudflareService } from '@/app/services/cloudflareService';
import { router } from 'expo-router';
import GiftAnimationOverlay from '@/components/GiftAnimationOverlay';
import LiveStreamControlPanel from '@/components/LiveStreamControlPanel';
import ViewerListModal from '@/components/ViewerListModal';
import CameraFilterSelector, { CameraFilter } from '@/components/CameraFilterSelector';
import EnhancedChatOverlay from '@/components/EnhancedChatOverlay';

interface StreamData {
  id: string;
  live_input_id: string;
  title: string;
  status: string;
  playback_url: string;
}

interface GiftAnimation {
  id: string;
  giftName: string;
  senderUsername: string;
  amount: number;
}

export default function BroadcasterScreen() {
  const { user } = useAuth();
  const { setIsStreaming } = useStreaming();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [showSetup, setShowSetup] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const [showViewerList, setShowViewerList] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<CameraFilter>('none');
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);

  // Handle back button press when streaming
  useEffect(() => {
    if (isLive) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        setShowExitConfirmation(true);
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }
  }, [isLive]);

  useEffect(() => {
    if (isLive) {
      timerIntervalRef.current = setInterval(() => {
        setLiveTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isLive]);

  const subscribeToViewerUpdates = useCallback(() => {
    if (!currentStream?.id) return;

    const channel = supabase
      .channel(`stream:${currentStream.id}:broadcaster`)
      .on('broadcast', { event: 'viewer_count' }, (payload) => {
        console.log('👥 Viewer count update:', payload);
        setViewerCount(payload.payload.count || 0);
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [currentStream?.id]);

  const subscribeToGifts = useCallback(() => {
    if (!currentStream?.id) return;

    const channel = supabase
      .channel(`stream:${currentStream.id}:gifts`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 Gift received:', payload);
        const giftData = payload.payload;
        
        const newAnimation: GiftAnimation = {
          id: `${Date.now()}-${Math.random()}`,
          giftName: giftData.gift_name,
          senderUsername: giftData.sender_username,
          amount: giftData.amount,
        };
        
        setGiftAnimations((prev) => [...prev, newAnimation]);
      })
      .subscribe();

    giftChannelRef.current = channel;
  }, [currentStream?.id]);

  useEffect(() => {
    if (isLive && currentStream?.id) {
      subscribeToViewerUpdates();
      subscribeToGifts();
    }
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (giftChannelRef.current) {
        supabase.removeChannel(giftChannelRef.current);
        giftChannelRef.current = null;
      }
    };
  }, [isLive, currentStream?.id, subscribeToViewerUpdates, subscribeToGifts]);

  const handleAnimationComplete = (animationId: string) => {
    setGiftAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
  };

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

  const toggleFlash = () => {
    setFlashMode((current) => (current === 'off' ? 'on' : 'off'));
  };

  const handleStartLiveSetup = () => {
    if (isLive) {
      setShowExitConfirmation(true);
    } else {
      setShowSetup(true);
    }
  };

  const handleEndStreamConfirm = () => {
    setShowExitConfirmation(false);
    endStream();
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
      console.log('🎬 Starting live stream with title:', streamTitle);
      
      const result = await cloudflareService.startLive({ 
        title: streamTitle, 
        userId: user.id 
      });

      console.log('✅ Stream created successfully:', result);

      setCurrentStream(result.stream);
      setIsLive(true);
      setIsStreaming(true); // Hide navigation tabs
      setViewerCount(0);
      setLiveTime(0);
      setShowSetup(false);
      setStreamTitle('');

      console.log('📺 Stream details:', {
        id: result.stream.id,
        live_input_id: result.stream.live_input_id,
        playback_url: result.stream.playback_url,
        rtmps_url: result.ingest.rtmps_url,
        stream_key: result.ingest.stream_key ? '***' : null,
        webRTC_url: result.ingest.webRTC_url,
      });

      Alert.alert(
        '🔴 You are LIVE!',
        `Your stream is now broadcasting!\n\nStream ID: ${result.stream.id}\n\nViewers can watch you live!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error starting stream:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to start stream. Please try again.';
      
      Alert.alert(
        'Cannot Start Stream',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const endStream = async () => {
    if (!currentStream) {
      Alert.alert('Error', 'No active stream to end');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🛑 Ending stream:', {
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });
      
      await cloudflareService.stopLive({
        liveInputId: currentStream.live_input_id,
        streamId: currentStream.id,
      });

      console.log('✅ Stream ended successfully');

      setIsLive(false);
      setIsStreaming(false); // Show navigation tabs again
      setViewerCount(0);
      setLiveTime(0);
      setCurrentStream(null);
      setGiftAnimations([]);

      Alert.alert('Stream Ended', 'Your live stream has been ended successfully.');
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to end stream. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
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
      {isCameraOn ? (
        <CameraView 
          style={styles.camera} 
          facing={facing}
          flash={flashMode}
        />
      ) : (
        <View style={styles.cameraOffContainer}>
          <IconSymbol
            ios_icon_name="video.slash.fill"
            android_material_icon_name="videocam_off"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.cameraOffText}>Camera Off — Stream Still Active</Text>
        </View>
      )}

      <View style={styles.overlay}>
        {isLive && (
          <>
            {/* Top Bar with LIVE badge, watermark, and stats */}
            <View style={styles.topBar}>
              <View style={styles.topLeft}>
                <LiveBadge size="small" />
                <View style={styles.watermark}>
                  <Text style={styles.watermarkText}>ROAST LIVE</Text>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <TouchableOpacity 
                  style={styles.stat}
                  onPress={() => setShowViewerList(true)}
                >
                  <IconSymbol
                    ios_icon_name="eye.fill"
                    android_material_icon_name="visibility"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.statText}>{viewerCount}</Text>
                </TouchableOpacity>
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

            {/* Filter Toggle Button */}
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <IconSymbol
                ios_icon_name="camera.filters"
                android_material_icon_name="filter"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Filter Selector */}
            <CameraFilterSelector
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              visible={showFilters}
            />

            {/* Enhanced Chat Overlay */}
            {currentStream && (
              <EnhancedChatOverlay streamId={currentStream.id} />
            )}
          </>
        )}

        {!isLive && (
          <View style={styles.centerContent}>
            <RoastLiveLogo size="large" />
            <Text style={styles.welcomeText}>Ready to go live?</Text>
            <GradientButton
              title="GO LIVE"
              onPress={handleStartLiveSetup}
              size="large"
              disabled={isLoading}
            />
          </View>
        )}
      </View>

      {/* Gift Animations */}
      {giftAnimations.map((animation) => (
        <GiftAnimationOverlay
          key={animation.id}
          giftName={animation.giftName}
          senderUsername={animation.senderUsername}
          amount={animation.amount}
          onAnimationComplete={() => handleAnimationComplete(animation.id)}
        />
      ))}

      {/* Sticky Bottom Control Panel (only visible when live) */}
      {isLive && (
        <LiveStreamControlPanel
          isMicOn={isMicOn}
          onToggleMic={() => setIsMicOn(!isMicOn)}
          isCameraOn={isCameraOn}
          onToggleCamera={() => setIsCameraOn(!isCameraOn)}
          facing={facing}
          onFlipCamera={toggleCameraFacing}
          isFlashOn={flashMode === 'on'}
          onToggleFlash={toggleFlash}
          onEndStream={() => setShowExitConfirmation(true)}
          isLoading={isLoading}
        />
      )}

      {/* Viewer List Modal */}
      {currentStream && (
        <ViewerListModal
          visible={showViewerList}
          onClose={() => setShowViewerList(false)}
          streamId={currentStream.id}
          viewerCount={viewerCount}
        />
      )}

      {/* Setup Modal */}
      <Modal
        visible={showSetup}
        transparent
        animationType="slide"
        onRequestClose={() => !isLoading && setShowSetup(false)}
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
                editable={!isLoading}
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
                Your stream will be broadcast live to all viewers. Make sure you have a stable internet connection!
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

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.gradientEnd}
            />
            <Text style={styles.confirmationTitle}>End Livestream?</Text>
            <Text style={styles.confirmationText}>
              You cannot leave the livestream without ending it. Are you sure you want to end your livestream?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={() => setShowExitConfirmation(false)}
              >
                <Text style={styles.confirmationCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.confirmationEndButton}>
                <GradientButton
                  title="Yes, End Stream"
                  onPress={handleEndStreamConfirm}
                  size="medium"
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
  cameraOffContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cameraOffText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watermark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    opacity: 0.5,
    letterSpacing: 1,
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
  filterToggle: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
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
  confirmationModal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  confirmationCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmationCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  confirmationEndButton: {
    flex: 1,
  },
});
