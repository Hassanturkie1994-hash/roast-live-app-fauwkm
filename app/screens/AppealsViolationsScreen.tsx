
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { appealsService, Strike, Violation, Appeal } from '@/app/services/appealsService';
import GradientButton from '@/components/GradientButton';

export default function AppealsViolationsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    const [strikesData, violationsData, appealsData] = await Promise.all([
      appealsService.getUserStrikes(user.id),
      appealsService.getUserViolations(user.id),
      appealsService.getUserAppeals(user.id),
    ]);

    setStrikes(strikesData);
    setViolations(violationsData);
    setAppeals(appealsData);
    setLoading(false);
  };

  const handleSubmitAppeal = async () => {
    if (!user) return;
    if (!appealReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your appeal.');
      return;
    }

    const result = await appealsService.submitAppeal(
      user.id,
      selectedViolation?.id,
      selectedStrike?.id,
      appealReason,
      evidenceUrl || undefined
    );

    if (result.success) {
      Alert.alert('Success', 'Your appeal has been submitted and is under review.');
      setShowAppealModal(false);
      setAppealReason('');
      setEvidenceUrl('');
      setSelectedViolation(null);
      setSelectedStrike(null);
      await loadData();
    } else {
      Alert.alert('Error', result.error || 'Failed to submit appeal.');
    }
  };

  const openAppealModal = (violation?: Violation, strike?: Strike) => {
    setSelectedViolation(violation || null);
    setSelectedStrike(strike || null);
    setShowAppealModal(true);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'approved':
        return '#00C853';
      case 'denied':
        return colors.brandPrimary;
      default:
        return colors.textSecondary;
    }
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Appeals & Violations</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Strikes Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📌 Strike History</Text>
          {strikes.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No strikes on your account</Text>
            </View>
          ) : (
            strikes.map((strike) => (
              <View key={strike.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: colors.brandPrimary }]}>
                    <Text style={styles.levelBadgeText}>Level {strike.strike_level}</Text>
                  </View>
                  {strike.active && (
                    <Text style={[styles.timeRemaining, { color: colors.brandPrimary }]}>
                      {getTimeRemaining(strike.expires_at)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{strike.strike_type}</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>{strike.strike_message}</Text>
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                  {new Date(strike.created_at).toLocaleDateString()}
                </Text>
                {strike.active && (
                  <TouchableOpacity
                    style={[styles.appealButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    onPress={() => openAppealModal(undefined, strike)}
                  >
                    <Text style={[styles.appealButtonText, { color: colors.text }]}>Submit Appeal</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Violations Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Violations</Text>
          {violations.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No violations reported</Text>
            </View>
          ) : (
            violations.map((violation) => (
              <View key={violation.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.severityBadge, { backgroundColor: colors.brandPrimary }]}>
                    <Text style={styles.severityBadgeText}>Severity {violation.severity_level}</Text>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {violation.violation_reason.replace(/_/g, ' ').toUpperCase()}
                </Text>
                {violation.notes && (
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>{violation.notes}</Text>
                )}
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                  {new Date(violation.created_at).toLocaleDateString()}
                </Text>
                {!violation.resolved && (
                  <TouchableOpacity
                    style={[styles.appealButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    onPress={() => openAppealModal(violation, undefined)}
                  >
                    <Text style={[styles.appealButtonText, { color: colors.text }]}>Submit Appeal</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Appeals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Your Appeals</Text>
          {appeals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No appeals submitted</Text>
            </View>
          ) : (
            appeals.map((appeal) => (
              <View key={appeal.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appeal.status) }]}>
                    <Text style={styles.statusBadgeText}>{appeal.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.cardText, { color: colors.text }]}>{appeal.appeal_reason}</Text>
                {appeal.admin_decision && (
                  <View style={[styles.decisionBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                    <Text style={[styles.decisionLabel, { color: colors.textSecondary }]}>Admin Decision:</Text>
                    <Text style={[styles.decisionText, { color: colors.text }]}>{appeal.admin_decision}</Text>
                  </View>
                )}
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                  Submitted: {new Date(appeal.created_at).toLocaleDateString()}
                </Text>
                {appeal.reviewed_at && (
                  <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    Reviewed: {new Date(appeal.reviewed_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Appeal Modal */}
      <Modal
        visible={showAppealModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Submit Appeal</Text>
              <TouchableOpacity onPress={() => setShowAppealModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>Explanation *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="Explain why you believe this decision should be reconsidered..."
                placeholderTextColor={colors.textSecondary}
                value={appealReason}
                onChangeText={setAppealReason}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Text style={[styles.label, { color: colors.text }]}>Evidence URL (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={evidenceUrl}
                onChangeText={setEvidenceUrl}
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                  onPress={() => setShowAppealModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.submitButtonContainer}>
                  <GradientButton title="Submit Appeal" onPress={handleSubmitAppeal} />
                </View>
              </View>
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  appealButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  appealButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  decisionBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  decisionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  decisionText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  submitButtonContainer: {
    flex: 1,
  },
});
