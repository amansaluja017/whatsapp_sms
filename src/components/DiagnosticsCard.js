import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

export default function DiagnosticsCard({
  currentSSID,
  isTriggeredToday,
  lastTriggeredDate,
  lastTriggeredTime,
  isBackgroundActive,
  hasNativeModule,
  ipAddress,
  locationPermission,
  onResetTrigger,
}) {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>SYSTEM DIAGNOSTICS</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wi-Fi Router SSID</Text>
          <Text style={styles.infoValue}>
            {currentSSID || 'Not Connected'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Daily Auto-Trigger</Text>
          <Text style={styles.infoValue}>
            {isTriggeredToday ? `Sent Today (${lastTriggeredTime || lastTriggeredDate})` : 'Ready & Armed'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Background Runner</Text>
          <Text style={[styles.infoValue, { color: isBackgroundActive ? '#10B981' : COLORS.textMuted }]}>
            {isBackgroundActive ? 'Active (Foreground Service)' : 'Stopped'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Native Antenna Module</Text>
          <Text style={styles.infoValue}>
            {hasNativeModule ? 'Linked (Dev Build)' : 'Expo Go'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device IP Address</Text>
          <Text style={styles.infoValue}>{ipAddress || '0.0.0.0'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location Permission</Text>
          <Text style={styles.infoValue}>
            {locationPermission === 'granted' ? 'Granted' : 'Denied / Needed'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>TESTING ACTIONS</Text>
        </View>
        <Text style={styles.helpText}>
          Reset the 1-per-day trigger limit or simulate instant router connection:
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onResetTrigger}
        >
          <Text style={styles.secondaryButtonText}>
            🔄 Reset 1-Per-Day Limit (Allow Retrigger)
          </Text>
        </TouchableOpacity>
      </View>
    </>
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
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    backgroundColor: COLORS.surfaceElevated,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'right',
    flex: 1,
    minWidth: 0,
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 12,
  },
});
