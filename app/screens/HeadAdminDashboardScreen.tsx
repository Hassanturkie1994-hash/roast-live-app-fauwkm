
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, AdminRole } from '@/app/services/adminService';
import GradientButton from '@/components/GradientButton';

export default function HeadAdminDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    timedOutUsers: 0,
    openReports: 0,
    streamReports: 0,
    admins: 0,
    support: 0,
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    
    if (!result.success || result.role !== 'HEAD_ADMIN') {
      Alert.alert('Access Denied', 'You do not have head admin privileges.');
      router.back();
      return;
    }

    await fetchStats();
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [reportsResult, usersResult, rolesResult] = await Promise.all([
        adminService.getReports({ status: 'open', limit: 1000 }),
        adminService.getUsersUnderPenalty(),
        // Fetch admin roles count
      ]);

      setStats({
        totalUsers: 0, // TODO: Implement
        activeUsers: 0, // TODO: Implement
        bannedUsers: usersResult.users?.length || 0,
        timedOutUsers: 0, // TODO: Implement
        openReports: reportsResult.reports?.filter(r => r.type !== 'stream').length || 0,
        streamReports: reportsResult.reports?.filter(r => r.type === 'stream').length || 0,
        admins: 0, // TODO: Implement
        support: 0, // TODO: Implement
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) {
      Alert.alert('Error', 'Please enter an announcement message.');
      return;
    }

    // TODO: Implement announcement sending
    Alert.alert('Success', 'Announcement sent to all users.');
    setShowAnnouncementModal(false);
    setAnnouncementText('');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Head Admin Dashboard</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.roleBadgeText}>HEAD ADMIN</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Platform Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="person.3.fill"
                android_material_icon_name="group"
                size={28}
                color={colors.brandPrimary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={28}
                color="#00C853"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="block"
                size={28}
                color="#DC143C"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.bannedUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Banned</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={28}
                color="#FFA500"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.timedOutUsers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Timed Out</Text>
            </View>
          </View>
        </View>

        {/* Reports Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🚨 Reports</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminReportsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="flag.fill"
                android_material_icon_name="flag"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>User Reports</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  {stats.openReports} open reports
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminLiveStreamsScreen' as any)}
          >
            <View style={styles.actionCardLeft}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={24}
                color="#FF1493"
              />
              <View style={styles.actionCardText}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]}>Stream Reports</Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>
                  {stats.streamReports} stream reports
                </Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Admin Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👥 Admin & Support</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Admins:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stats.admins}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Support Team:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stats.support}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/RoleManagementScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus.fill"
              android_material_icon_name="person_add"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Manage Roles & Users</Text>
          </TouchableOpacity>
        </View>

        {/* Global Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌐 Global Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowAnnouncementModal(true)}
          >
            <IconSymbol
              ios_icon_name="megaphone.fill"
              android_material_icon_name="campaign"
              size={20}
              color={colors.brandPrimary}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Send App-Wide Announcement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/SafetyCommunityRulesScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Update Global Rules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/screens/AdminStrikesScreen' as any)}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color="#FFA500"
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View & Remove Warnings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Announcement Modal */}
      <Modal
        visible={showAnnouncementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>App-Wide Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Announcement Message</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your announcement..."
                placeholderTextColor={colors.textSecondary}
                value={announcementText}
                onChangeText={setAnnouncementText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShowAnnouncementModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.sendButtonContainer}>
                  <GradientButton title="Send Announcement" onPress={handleSendAnnouncement} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionCardText: {
    flex: 1,
    gap: 4,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionCardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonContainer: {
    flex: 1,
  },
});
