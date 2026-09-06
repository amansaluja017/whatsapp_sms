import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Header({ isBotConnected }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💬</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Wi-Fi Trigger</Text>
          <Text style={styles.subtitle}>WhatsApp Message Automation</Text>
        </View>
        <View style={[styles.statusBadge, isBotConnected ? styles.badgeActive : styles.badgeMuted]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isBotConnected ? COLORS.white : COLORS.textMuted },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isBotConnected ? COLORS.white : COLORS.textMuted },
            ]}
          >
            {isBotConnected ? 'BOT READY' : 'BOT DISCONNECTED'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
