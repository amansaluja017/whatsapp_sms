import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import { TARGET_MESSAGE } from '../constants/config';

export default function RouterStatusCard({
  isMatched,
  targetSSID,
  currentSSID,
  targetRecipient,
  useBot,
  isSendingBot,
  resolvedMessage,
  onPressAction,
}) {
  const displayMsg = resolvedMessage || TARGET_MESSAGE;
  const truncatedMsg = displayMsg.length > 25 ? displayMsg.slice(0, 22) + '...' : displayMsg;

  return (
    <View
      style={[
        styles.card,
        isMatched ? styles.targetCardMatched : styles.targetCardUnmatched,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>ROUTER STATUS</Text>
        <View style={[styles.badge, isMatched ? styles.badgeActive : styles.badgeMuted]}>
          <Text style={[styles.badgeText, { color: isMatched ? COLORS.white : COLORS.textSecondary }]}>
            {isMatched ? '● MATCHED' : '○ SEARCHING'}
          </Text>
        </View>
      </View>

      <Text style={styles.targetSSIDTitle}>
        {isMatched ? `Connected to ${targetSSID}` : `Target: ${targetSSID}`}
      </Text>

      <Text style={styles.statusSubtext}>
        Current SSID: {currentSSID ? `"${currentSSID}"` : 'Unknown / Simulating'}
      </Text>

      {/* Main Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          isMatched ? styles.actionButtonActive : styles.actionButtonDisabled,
        ]}
        onPress={onPressAction}
        activeOpacity={0.85}
        disabled={isSendingBot}
      >
        {isSendingBot ? (
          <ActivityIndicator color={isMatched ? COLORS.black : COLORS.white} />
        ) : (
          <Text style={[styles.actionButtonText, { color: isMatched ? COLORS.black : COLORS.white }]}>
            {useBot
              ? `⚡ Send "${truncatedMsg}" to ${targetRecipient.name}`
              : `📲 Open WhatsApp for ${targetRecipient.name}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 14,
  },
  targetCardMatched: {
    borderColor: COLORS.white,
    borderWidth: 1.5,
  },
  targetCardUnmatched: {
    borderColor: COLORS.borderDefault,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.white,
  },
  badgeMuted: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderDefault,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetSSIDTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: COLORS.white,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
