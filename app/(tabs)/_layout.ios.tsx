
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.text}
      iconColor={colors.textSecondary}
    >
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger key="explore" name="explore">
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass.circle.fill' }} />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger key="broadcaster" name="broadcaster">
        <Icon sf="plus.circle.fill" />
        <Label>Go Live</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger key="inbox" name="inbox">
        <Icon sf={{ default: 'bell', selected: 'bell.fill' }} />
        <Label>Inbox</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
