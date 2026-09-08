import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function DisclaimerModal({
  visible = false,
  onAccept,
  onCancel,
  canDismissWithoutAccepting = false,
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAccept = () => {
    if (onAccept) onAccept();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Accent Strip */}
          <View style={styles.accentStrip} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Warning Badge */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>⚠️</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>IMPORTANT SAFETY ADVISORY</Text>
              </View>
              <Text style={styles.title}>Unofficial WhatsApp Notice</Text>
              <Text style={styles.subtitle}>
                Please review WhatsApp terms and risks before proceeding
              </Text>
            </View>

            {/* Critical Warning Callout */}
            <View style={styles.warningBox}>
              <Text style={styles.warningHead}>⚠️ RISK OF WHATSAPP BAN</Text>
              <Text style={styles.warningBody}>
                This application utilizes unofficial WhatsApp integration protocols (reverse-engineered Web/Baileys). WhatsApp LLC does <Text style={styles.bold}>not</Text> endorse or officially authorize third-party automation tools.
              </Text>
              <Text style={[styles.warningBody, { marginTop: 6 }]}>
                Misusing this automation for mass messaging, spamming strangers, promotional broadcasts, or aggressive rapid pings creates a <Text style={styles.boldHighlight}>high risk of permanent account ban</Text> by WhatsApp automated spam filters.
              </Text>
            </View>

            {/* Safe Usage Guidelines */}
            <View style={styles.guidelinesBox}>
              <Text style={styles.guidelinesTitle}>Safe Usage Guidelines</Text>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>🟢</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Personal Arrival Notifications Only: </Text>
                  Only send 1 daily check-in message to yourself, family members, or your own group.
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>🟢</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Prior Consent: </Text>
                  Ensure the recipient is expecting this automated Wi-Fi arrival ping.
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>🔴</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Never Spam or Bulk Send: </Text>
                  Do not configure bulk recipient lists or automate high-frequency messages.
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>🔴</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Sole Responsibility: </Text>
                  You assume full responsibility for your WhatsApp account security and compliance with WhatsApp Terms of Service.
                </Text>
              </View>
            </View>

            {/* Checkbox Acknowledgement */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcknowledged(!acknowledged)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acknowledged && styles.checkboxActive]}>
                {acknowledged && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand this app is unofficial and I accept full responsibility for any risk of account ban or restrictions.
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {canDismissWithoutAccepting && onCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  !acknowledged && styles.acceptButtonDisabled,
                ]}
                disabled={!acknowledged}
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.acceptButtonText,
                    !acknowledged && styles.acceptButtonTextDisabled,
                  ]}
                >
                  I Understand & Accept Risks →
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  accentStrip: {
    height: 4,
    backgroundColor: '#F59E0B',
    width: '100%',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  iconText: {
    fontSize: 26,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 8,
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 14,
    marginBottom: 16,
  },
  warningHead: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  warningBody: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.white,
  },
  boldHighlight: {
    fontWeight: '800',
    color: '#F87171',
    textDecorationLine: 'underline',
  },
  guidelinesBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
  },
  guidelinesTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bulletDot: {
    fontSize: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: '#D4D4D8',
    fontSize: 12,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 12,
    marginBottom: 18,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxActive: {
    backgroundColor: '#F59E0B',
  },
  checkmark: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  checkboxLabel: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonDisabled: {
    backgroundColor: '#3F3F46',
    shadowOpacity: 0,
    elevation: 0,
  },
  acceptButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  acceptButtonTextDisabled: {
    color: '#71717A',
  },
});
