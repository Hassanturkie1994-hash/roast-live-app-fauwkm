
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { StreamGuestSeat } from '@/app/services/streamGuestService';

interface GuestActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  guest: StreamGuestSeat | null;
  onRemoveGuest: () => void;
  onToggleModerator: () => void;
  onMoveSeat: () => void;
  onViewProfile: () => void;
}

export default function GuestActionMenuModal({
  visible,
  onClose,
  guest,
  onRemoveGuest,
  onToggleModerator,
  onMoveSeat,
  onViewProfile,
}: GuestActionMenuModalProps) {
  if (!guest) return null;

  const menuItems = [
    {
      icon: 'person.fill',
      androidIcon: 'person',
      label: 'View Profile',
      onPress: onViewProfile,
      color: colors.text,
    },
    {
      icon: guest.is_moderator ? 'shield.slash.fill' : 'shield.fill',
      androidIcon: 'shield',
      label: guest.is_moderator ? 'Remove Moderator' : 'Make Moderator',
      onPress: onToggleModerator,
      color: guest.is_moderator ? colors.gradientEnd : colors.text,
    },
    {
      icon: 'arrow.up.arrow.down',
      androidIcon: 'swap_vert',
      label: 'Move Seat',
      onPress: onMoveSeat,
      color: colors.text,
    },
    {
      icon: 'xmark.circle.fill',
      androidIcon: 'cancel',
      label: 'Remove Guest',
      onPress: onRemoveGuest,
      color: colors.gradientEnd,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modal}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Guest Actions</Text>
            <Text style={styles.subtitle}>
              {guest.profiles?.display_name || 'Guest'}
            </Text>
          </View>

          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
              >
                <IconSymbol
                  ios_icon_name={item.icon}
                  android_material_icon_name={item.androidIcon}
                  size={24}
                  color={item.color}
                />
                <Text style={[styles.menuItemText, { color: item.color }]}>
                  {item.label}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  menuList: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
