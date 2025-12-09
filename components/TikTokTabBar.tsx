
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/app/services/notificationService';

const { width: screenWidth } = Dimensions.get('window');

export default function TikTokTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Poll for unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const result = await notificationService.getUnreadCount(user.id);
    if (result.success) {
      setUnreadCount(result.count);
    }
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/' || route === '/(tabs)/(home)') {
      return pathname === '/(tabs)/(home)/' || pathname === '/(tabs)/(home)' || pathname === '/';
    }
    return pathname.includes(route);
  };

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('/(tabs)/(home)/')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name={isActive('/(tabs)/(home)') ? 'house.fill' : 'house'}
              android_material_icon_name="home"
              size={28}
              color={isActive('/(tabs)/(home)') ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: isActive('/(tabs)/(home)') ? colors.text : colors.textSecondary }]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('/(tabs)/explore')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name={isActive('/explore') ? 'magnifyingglass.circle.fill' : 'magnifyingglass'}
              android_material_icon_name="search"
              size={28}
              color={isActive('/explore') ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: isActive('/explore') ? colors.text : colors.textSecondary }]}>
              Explore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.centerButton}
            onPress={() => handleTabPress('/(tabs)/broadcaster')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.centerButtonGradient}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color={colors.text}
              />
              <Text style={styles.centerButtonText}>GO LIVE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('/(tabs)/inbox')}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name={isActive('/inbox') ? 'bell.fill' : 'bell'}
                android_material_icon_name="notifications"
                size={28}
                color={isActive('/inbox') ? colors.text : colors.textSecondary}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: isActive('/inbox') ? colors.text : colors.textSecondary }]}>
              Inbox
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name={isActive('/profile') ? 'person.fill' : 'person'}
              android_material_icon_name="person"
              size={28}
              color={isActive('/profile') ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: isActive('/profile') ? colors.text : colors.textSecondary }]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  container: {
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.gradientEnd,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  centerButton: {
    marginHorizontal: 8,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.gradientEnd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
  },
  centerButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
