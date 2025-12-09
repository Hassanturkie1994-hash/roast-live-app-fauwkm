
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { creatorClubService } from '@/app/services/creatorClubService';

interface ClubBadgeProps {
  creatorId: string;
  userId: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ClubBadge({ creatorId, userId, size = 'small' }: ClubBadgeProps) {
  const [badgeData, setBadgeData] = useState<{ tag: string; clubName: string } | null>(null);

  useEffect(() => {
    loadBadge();
  }, [creatorId, userId]);

  const loadBadge = async () => {
    const result = await creatorClubService.getClubBadge(creatorId, userId);
    if (result.isMember && result.tag) {
      setBadgeData({ tag: result.tag, clubName: result.clubName || '' });
    }
  };

  if (!badgeData) return null;

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 9 },
    medium: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10 },
    large: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 11 },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: sizeStyles[size].fontSize }]}>
        {badgeData.tag}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#A40028',
    borderRadius: 4,
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
