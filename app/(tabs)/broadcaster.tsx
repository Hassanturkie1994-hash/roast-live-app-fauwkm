
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { colors, commonStyles } from '@/styles/commonStyles';
import GradientButton from '@/components/GradientButton';
import LiveBadge from '@/components/LiveBadge';
import { IconSymbol } from '@/components/IconSymbol';

export default function BroadcasterScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setLiveTime((prev) => prev + 1);
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

  const handleStartLive = () => {
    if (isLive) {
      Alert.alert(
        'End Stream',
        'Are you sure you want to end your live stream?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Stream',
            style: 'destructive',
            onPress: () => {
              setIsLive(false);
              setViewerCount(0);
              setLiveTime(0);
            },
          },
        ]
      );
    } else {
      setIsLive(true);
      setViewerCount(1);
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
                  onPress={handleStartLive}
                  size="large"
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
});
