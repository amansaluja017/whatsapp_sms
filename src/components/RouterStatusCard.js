import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
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
  const displayMsg = resolvedMessage?.trim() || '';
  const truncatedMsg = displayMsg.length > 22 ? displayMsg.slice(0, 20) + '...' : displayMsg;
  const hasRecipient = !!(targetRecipient && (targetRecipient.id || targetRecipient.phone || targetRecipient.name));
  const recipientName = hasRecipient ? targetRecipient.name : 'Recipient';

  return (
    <View
      style={[
        styles.card,
        isMatched ? styles.targetCardMatched : styles.targetCardUnmatched,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.cardLabel}>ROUTER STATUS</Text>
        </View>
        <View style={[styles.badge, isMatched ? styles.badgeActive : styles.badgeMuted]}>
          <Text
            style={[
              styles.badgeText,
              { color: isMatched ? COLORS.white : COLORS.textSecondary },
            ]}
          >
            {isMatched ? '● MATCHED' : '○ SEARCHING'}
          </Text>
        </View>
      </View>

      <Text style={styles.targetSSIDTitle} numberOfLines={1} ellipsizeMode="tail">
        {isMatched ? `Connected to ${targetSSID}` : `Target: ${targetSSID}`}
      </Text>

      <Text style={styles.statusSubtext} numberOfLines={1} ellipsizeMode="tail">
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
          <ActivityIndicator color={isMatched ? COLORS.black : COLORS.white} size="small" />
        ) : (
          <Text
            style={[
              styles.actionButtonText,
              { color: isMatched ? COLORS.black : COLORS.white },
            ]}
            numberOfLines={2}
          >
            {!hasRecipient
              ? `👤 Select a Recipient below to start`
              : useBot
              ? displayMsg
                ? `⚡ Send "${truncatedMsg}" to ${recipientName}`
                : `⚡ Type message below to send to ${recipientName}`
              : displayMsg
              ? `📲 Open WhatsApp for ${recipientName}`
              : `📲 Type message below for ${recipientName}`}
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
    marginBottom: 8,
    gap: 8,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: COLORS.white,
  },
  badgeMuted: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderDefault,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  targetSSIDTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    minHeight: 46,
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
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
});

