
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { StreamGuestSeat } from '@/app/services/streamGuestService';

interface GuestSeatGridProps {
  hostName: string;
  hostAvatarUrl?: string | null;
  guests: StreamGuestSeat[];
  isHost?: boolean;
  onGuestPress?: (guest: StreamGuestSeat) => void;
}

const { width } = Dimensions.get('window');

export default function GuestSeatGrid({
  hostName,
  hostAvatarUrl,
  guests,
  isHost = false,
  onGuestPress,
}: GuestSeatGridProps) {
  const activeGuests = guests.filter((g) => !g.left_at);
  const totalParticipants = activeGuests.length + 1; // +1 for host

  // Determine grid layout based on number of participants
  const getGridLayout = () => {
    if (totalParticipants === 1) {
      return { columns: 1, rows: 1 }; // Just host
    } else if (totalParticipants === 2) {
      return { columns: 2, rows: 1 }; // Side by side
    } else if (totalParticipants <= 4) {
      return { columns: 2, rows: 2 }; // 2x2 grid
    } else if (totalParticipants <= 6) {
      return { columns: 3, rows: 2 }; // 2x3 grid
    } else {
      return { columns: 3, rows: 3 }; // 3x3 grid
    }
  };

  const layout = getGridLayout();
  const cellWidth = (width - 32) / layout.columns;
  const cellHeight = cellWidth * 1.2;

  const renderParticipant = (
    participant: { name: string; avatarUrl?: string | null; isHost: boolean; guest?: StreamGuestSeat },
    index: number
  ) => {
    const isHostCell = participant.isHost;
    const guest = participant.guest;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          {
            width: cellWidth - 8,
            height: cellHeight,
          },
          isHostCell && styles.hostCell,
        ]}
        onPress={() => guest && onGuestPress && onGuestPress(guest)}
        disabled={!guest || !onGuestPress}
      >
        <View style={styles.cellContent}>
          {/* Avatar placeholder */}
          <View style={styles.avatarPlaceholder}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={32}
              color={colors.textSecondary}
            />
          </View>

          {/* Name */}
          <Text style={styles.participantName} numberOfLines={1}>
            {participant.name}
          </Text>

          {/* Status indicators */}
          <View style={styles.statusRow}>
            {guest && (
              <>
                {/* Mic status */}
                <View
                  style={[
                    styles.statusBadge,
                    !guest.mic_enabled && styles.statusBadgeOff,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={guest.mic_enabled ? 'mic.fill' : 'mic.slash.fill'}
                    android_material_icon_name={guest.mic_enabled ? 'mic' : 'mic_off'}
                    size={12}
                    color={colors.text}
                  />
                </View>

                {/* Camera status */}
                <View
                  style={[
                    styles.statusBadge,
                    !guest.camera_enabled && styles.statusBadgeOff,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={guest.camera_enabled ? 'video.fill' : 'video.slash.fill'}
                    android_material_icon_name={guest.camera_enabled ? 'videocam' : 'videocam_off'}
                    size={12}
                    color={colors.text}
                  />
                </View>

                {/* Moderator badge */}
                {guest.is_moderator && (
                  <View style={styles.moderatorBadge}>
                    <IconSymbol
                      ios_icon_name="shield.fill"
                      android_material_icon_name="shield"
                      size={12}
                      color={colors.text}
                    />
                  </View>
                )}
              </>
            )}
          </View>

          {/* Host badge */}
          {isHostCell && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Build participants array
  const participants = [
    { name: hostName, avatarUrl: hostAvatarUrl, isHost: true },
    ...activeGuests.map((guest) => ({
      name: guest.profiles?.display_name || 'Guest',
      avatarUrl: guest.profiles?.avatar_url,
      isHost: false,
      guest,
    })),
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
        {participants.map((participant, index) => renderParticipant(participant, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    padding: 16,
    gap: 8,
  },
  cell: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    margin: 4,
    overflow: 'hidden',
  },
  hostCell: {
    borderColor: colors.gradientEnd,
    borderWidth: 3,
  },
  cellContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeOff: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  moderatorBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.gradientEnd,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
});
