
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface LiveStreamControlPanelProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  isCameraOn: boolean;
  onToggleCamera: () => void;
  facing: 'front' | 'back';
  onFlipCamera: () => void;
  isFlashOn: boolean;
  onToggleFlash: () => void;
  onEndStream: () => void;
  isLoading?: boolean;
}

export default function LiveStreamControlPanel({
  isMicOn,
  onToggleMic,
  isCameraOn,
  onToggleCamera,
  facing,
  onFlipCamera,
  isFlashOn,
  onToggleFlash,
  onEndStream,
  isLoading = false,
}: LiveStreamControlPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        {/* Microphone Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
          onPress={onToggleMic}
          disabled={isLoading}
        >
          <IconSymbol
            ios_icon_name={isMicOn ? 'mic.fill' : 'mic.slash.fill'}
            android_material_icon_name={isMicOn ? 'mic' : 'mic_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlLabel}>{isMicOn ? 'Mic' : 'Muted'}</Text>
        </TouchableOpacity>

        {/* Camera Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
          onPress={onToggleCamera}
          disabled={isLoading}
        >
          <IconSymbol
            ios_icon_name={isCameraOn ? 'video.fill' : 'video.slash.fill'}
            android_material_icon_name={isCameraOn ? 'videocam' : 'videocam_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlLabel}>{isCameraOn ? 'Camera' : 'Off'}</Text>
        </TouchableOpacity>

        {/* Flip Camera */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onFlipCamera}
          disabled={isLoading || !isCameraOn}
        >
          <IconSymbol
            ios_icon_name="arrow.triangle.2.circlepath.camera.fill"
            android_material_icon_name="flip_camera_ios"
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlLabel}>{facing === 'front' ? 'Front' : 'Back'}</Text>
        </TouchableOpacity>

        {/* Flash Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, isFlashOn && styles.controlButtonActive]}
          onPress={onToggleFlash}
          disabled={isLoading || !isCameraOn}
        >
          <IconSymbol
            ios_icon_name={isFlashOn ? 'bolt.fill' : 'bolt.slash.fill'}
            android_material_icon_name={isFlashOn ? 'flash_on' : 'flash_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlLabel}>{isFlashOn ? 'Flash' : 'Off'}</Text>
        </TouchableOpacity>

        {/* End Stream Button */}
        <View style={styles.endStreamButton}>
          <GradientButton
            title="END"
            onPress={onEndStream}
            size="small"
            disabled={isLoading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlButtonOff: {
    backgroundColor: 'rgba(164, 0, 40, 0.3)',
    borderColor: colors.gradientStart,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(227, 0, 82, 0.3)',
    borderColor: colors.gradientEnd,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  endStreamButton: {
    minWidth: 70,
  },
});
