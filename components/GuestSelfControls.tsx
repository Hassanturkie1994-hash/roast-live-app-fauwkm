
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

interface GuestSelfControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

export default function GuestSelfControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: GuestSelfControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !micEnabled && styles.controlButtonOff]}
          onPress={onToggleMic}
        >
          <IconSymbol
            ios_icon_name={micEnabled ? 'mic.fill' : 'mic.slash.fill'}
            android_material_icon_name={micEnabled ? 'mic' : 'mic_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlLabel}>{micEnabled ? 'Mute' : 'Unmute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !cameraEnabled && styles.controlButtonOff]}
          onPress={onToggleCamera}
        >
          <IconSymbol
            ios_icon_name={cameraEnabled ? 'video.fill' : 'video.slash.fill'}
            android_material_icon_name={cameraEnabled ? 'videocam' : 'videocam_off'}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlLabel}>{cameraEnabled ? 'Camera Off' : 'Camera On'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.leaveButtonContainer}>
        <GradientButton title="LEAVE STREAM" onPress={onLeave} size="medium" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  controlButtonOff: {
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderColor: colors.gradientEnd,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  leaveButtonContainer: {
    width: '100%',
  },
});
