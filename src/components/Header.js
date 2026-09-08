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

        <View style={styles.titleTextContainer}>
          <Text style={styles.title} numberOfLines={1}>
            Wi-Fi Trigger
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            WhatsApp Message Automation
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isBotConnected ? styles.badgeActive : styles.badgeMuted,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isBotConnected ? '#10B981' : COLORS.textMuted },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isBotConnected ? COLORS.white : COLORS.textSecondary },
            ]}
            numberOfLines={1}
          >
            {isBotConnected ? 'BOT ONLINE' : 'BOT OFFLINE'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 14,
    paddingVertical: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  titleTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.4,
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
    paddingHorizontal: 9,
    paddingVertical: 5,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

