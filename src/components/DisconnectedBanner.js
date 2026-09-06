import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

export default function DisconnectedBanner({
  onOpenBrowser,
  onCheckStatus,
  isChecking,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>WHATSAPP NOT LINKED</Text>
      </View>
      <Text style={styles.title}>Link WhatsApp to Automate</Text>
      <Text style={styles.desc}>
        Your WhatsApp Bot is not connected. Open the pairing QR code in your browser to scan and link your account.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onOpenBrowser}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>🔗 Open Pairing QR in Browser</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onCheckStatus}
        activeOpacity={0.7}
        disabled={isChecking}
      >
        {isChecking ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.secondaryButtonText}>🔄 Check Connection Status</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    padding: 16,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  secondaryButtonText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
  },
});
