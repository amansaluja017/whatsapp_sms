import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function BackgroundMonitoringCard({
  targetSSID,
  isBackgroundActive,
  isTogglingBackground,
  onToggleBackground,
  isTriggeredToday,
  lastTriggeredDate,
  lastTriggeredTime,
  lastTriggeredSSID,
  lastTriggerDetails,
  onResetTrigger,
  onTestTriggerNow,
  isTestingTrigger,
}) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.cardIcon}>📱</Text>
          <Text style={styles.cardLabel} numberOfLines={1}>
            BACKGROUND PHONE MONITOR
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            isBackgroundActive ? styles.badgeActive : styles.badgeMuted,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isBackgroundActive ? '#10B981' : COLORS.textSecondary },
            ]}
          >
            {isBackgroundActive ? '● RUNNING' : '○ STOPPED'}
          </Text>
        </View>
      </View>

      {/* Switch to enable / disable persistent background service */}
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={styles.switchLabel}>Persistent Background Service</Text>
          <Text style={styles.switchSublabel}>
            Keeps an active Android service running so your phone detects Wi-Fi even when locked or minimized.
          </Text>
        </View>
        <View style={styles.switchControl}>
          {isTogglingBackground ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Switch
              value={isBackgroundActive}
              onValueChange={onToggleBackground}
              trackColor={{ false: COLORS.borderDefault, true: COLORS.white }}
              thumbColor={isBackgroundActive ? COLORS.black : COLORS.textMuted}
            />
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Strict 1-Per-Day Guard Status */}
      <View style={styles.dailyGuardContainer}>
        <View style={styles.dailyGuardHeader}>
          <Text style={styles.guardTitle} numberOfLines={1}>
            DAILY TRIGGER GUARD
          </Text>
          <View
            style={[
              styles.statusPill,
              isTriggeredToday ? styles.statusPillTriggered : styles.statusPillArmed,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: isTriggeredToday ? '#10B981' : '#F59E0B' },
              ]}
              numberOfLines={1}
            >
              {isTriggeredToday ? '✓ SENT TODAY' : '⚡ ARMED & READY'}
            </Text>
          </View>
        </View>

        {isTriggeredToday ? (
          <View style={styles.detailsBox}>
            <Text style={styles.detailsRow}>
              🕒 Dispatched:{' '}
              <Text style={styles.detailsHighlight}>
                {lastTriggeredTime ? `${lastTriggeredTime} (${lastTriggeredDate})` : lastTriggeredDate}
              </Text>
            </Text>
            <Text style={styles.detailsRow} numberOfLines={1} ellipsizeMode="tail">
              📶 Router:{' '}
              <Text style={styles.detailsHighlight}>
                "{lastTriggeredSSID || targetSSID}"
              </Text>
            </Text>
            {lastTriggerDetails?.recipient && (
              <Text style={styles.detailsRow} numberOfLines={1} ellipsizeMode="tail">
                👤 Recipient:{' '}
                <Text style={styles.detailsHighlight}>
                  {lastTriggerDetails.recipient}
                </Text>
              </Text>
            )}
            {lastTriggerDetails?.message && (
              <Text style={styles.detailsRow} numberOfLines={2} ellipsizeMode="tail">
                💬 Message:{' '}
                <Text style={styles.detailsHighlight}>
                  "{lastTriggerDetails.message}"
                </Text>
              </Text>
            )}
            <Text style={styles.limitNotice}>
              🔒 Limit locked. Next auto-dispatch resets tomorrow.
            </Text>
          </View>
        ) : (
          <View style={styles.detailsBox}>
            <Text style={styles.detailsRow}>
              Waiting to connect to router:{' '}
              <Text style={styles.detailsHighlight}>"{targetSSID}"</Text>
            </Text>
            <Text style={styles.detailsSubtext}>
              Once connected today, the message will be sent automatically.
            </Text>
          </View>
        )}
      </View>

      {/* Control Actions */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onResetTrigger}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText} numberOfLines={1}>
            🔄 Reset 1-Day Limit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onTestTriggerNow}
          disabled={isTestingTrigger}
          activeOpacity={0.8}
        >
          {isTestingTrigger ? (
            <ActivityIndicator color={COLORS.black} size="small" />
          ) : (
            <Text style={styles.primaryButtonText} numberOfLines={1}>
              ⚡ Test Trigger Now
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 15,
    marginRight: 6,
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  badgeMuted: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderDefault,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  switchTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  switchControl: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  switchSublabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 12,
  },
  dailyGuardContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    marginBottom: 12,
  },
  dailyGuardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  guardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusPillTriggered: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusPillArmed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  detailsBox: {
    marginTop: 2,
  },
  detailsRow: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  detailsHighlight: {
    color: COLORS.white,
    fontWeight: '600',
  },
  detailsSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  limitNotice: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 6,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 6,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 6,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

