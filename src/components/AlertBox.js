import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import { COLORS } from '../constants/theme';

const TYPE_CONFIG = {
  warning: {
    borderColor: '#F59E0B',
    borderGlow: 'rgba(245, 158, 11, 0.25)',
    cardBg: '#0F0D08',
    iconBg: 'rgba(245, 158, 11, 0.14)',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    accentColor: '#FBBF24',
    icon: '⚠️',
    badgeText: 'CAUTION',
    actionBg: 'rgba(245, 158, 11, 0.12)',
    actionBorder: 'rgba(245, 158, 11, 0.35)',
  },
  error: {
    borderColor: '#EF4444',
    borderGlow: 'rgba(239, 68, 68, 0.25)',
    cardBg: '#110909',
    iconBg: 'rgba(239, 68, 68, 0.14)',
    badgeBg: 'rgba(239, 68, 68, 0.16)',
    accentColor: '#F87171',
    icon: '⛔',
    badgeText: 'CRITICAL',
    actionBg: 'rgba(239, 68, 68, 0.12)',
    actionBorder: 'rgba(239, 68, 68, 0.35)',
  },
  success: {
    borderColor: '#10B981',
    borderGlow: 'rgba(16, 185, 129, 0.25)',
    cardBg: '#08110D',
    iconBg: 'rgba(16, 185, 129, 0.14)',
    badgeBg: 'rgba(16, 185, 129, 0.16)',
    accentColor: '#34D399',
    icon: '✅',
    badgeText: 'SUCCESS',
    actionBg: 'rgba(16, 185, 129, 0.12)',
    actionBorder: 'rgba(16, 185, 129, 0.35)',
  },
  info: {
    borderColor: '#3B82F6',
    borderGlow: 'rgba(59, 130, 246, 0.25)',
    cardBg: '#090D14',
    iconBg: 'rgba(59, 130, 246, 0.14)',
    badgeBg: 'rgba(59, 130, 246, 0.16)',
    accentColor: '#60A5FA',
    icon: 'ℹ️',
    badgeText: 'NOTICE',
    actionBg: 'rgba(59, 130, 246, 0.12)',
    actionBorder: 'rgba(59, 130, 246, 0.35)',
  },
  neutral: {
    borderColor: '#52525B',
    borderGlow: 'rgba(82, 82, 91, 0.25)',
    cardBg: '#0D0D0E',
    iconBg: 'rgba(255, 255, 255, 0.08)',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    accentColor: '#E4E4E7',
    icon: '🔒',
    badgeText: 'ADVISORY',
    actionBg: 'rgba(255, 255, 255, 0.08)',
    actionBorder: 'rgba(255, 255, 255, 0.18)',
  },
};

export default function AlertBox({
  type = 'warning',
  title = 'Application Notice',
  message,
  details,
  detailsLabel = 'SAFE USAGE GUIDELINE',
  actionLabel,
  onAction,
  onDismiss,
  dismissible = false,
  collapsible = true,
  defaultExpanded = true,
  style,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.warning;

  const toggleExpand = () => {
    if (!collapsible) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleDismiss = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cfg.cardBg,
          borderColor: cfg.borderGlow,
          borderLeftColor: cfg.borderColor,
        },
        style,
      ]}
    >
      {/* Header bar */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={toggleExpand}
        activeOpacity={collapsible ? 0.75 : 1}
      >
        <View style={styles.headerLeft}>
          {/* Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: cfg.iconBg, borderColor: cfg.borderGlow },
            ]}
          >
            <Text style={styles.icon}>{cfg.icon}</Text>
          </View>

          {/* Title & Tag */}
          <View style={styles.titleColumn}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: cfg.badgeBg, borderColor: cfg.borderColor },
                ]}
              >
                <Text style={[styles.badgeText, { color: cfg.accentColor }]}>
                  {cfg.badgeText}
                </Text>
              </View>
            </View>

            <Text
              style={styles.title}
              numberOfLines={expanded ? 2 : 1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Header Right Actions */}
        <View style={styles.headerRight}>
          {collapsible && (
            <View
              style={[
                styles.togglePill,
                { backgroundColor: cfg.badgeBg, borderColor: cfg.borderGlow },
              ]}
            >
              <Text style={[styles.togglePillText, { color: cfg.accentColor }]}>
                {expanded ? 'HIDE ▲' : 'DETAILS ▼'}
              </Text>
            </View>
          )}

          {dismissible && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Body Content */}
      {expanded && (
        <View style={styles.body}>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Message Text */}
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          {/* Details Callout Box */}
          {details ? (
            <View
              style={[
                styles.detailsBox,
                { borderLeftColor: cfg.borderColor },
              ]}
            >
              <View style={styles.detailsHeader}>
                <Text style={[styles.detailsLabel, { color: cfg.accentColor }]}>
                  {detailsLabel}
                </Text>
              </View>
              <Text style={styles.detailsText}>{details}</Text>
            </View>
          ) : null}

          {/* Action Button */}
          {actionLabel && onAction ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: cfg.actionBg,
                  borderColor: cfg.actionBorder,
                },
              ]}
              onPress={onAction}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: cfg.accentColor }]}>
                {actionLabel}
              </Text>
              <Text style={[styles.actionArrow, { color: cfg.accentColor }]}>
                →
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 16,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 0.8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.8,
  },
  togglePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dismissButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 12,
    marginTop: -2,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  messageText: {
    color: '#D4D4D8',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  detailsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 11,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3,
  },
  detailsHeader: {
    marginBottom: 4,
  },
  detailsLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailsText: {
    color: '#A1A1AA',
    fontSize: 11.5,
    lineHeight: 17,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionArrow: {
    fontSize: 13,
    fontWeight: '800',
  },
});
