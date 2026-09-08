import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';

const MODAL_TYPE_CONFIG = {
  warning: {
    accent: '#F59E0B',
    accentText: '#FBBF24',
    icon: '⚠️',
    badgeText: 'WARNING',
    glowBg: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    buttonBg: '#F59E0B',
    buttonText: '#000000',
  },
  error: {
    accent: '#EF4444',
    accentText: '#F87171',
    icon: '⛔',
    badgeText: 'ERROR',
    glowBg: 'rgba(239, 68, 68, 0.16)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    buttonBg: '#EF4444',
    buttonText: '#FFFFFF',
  },
  success: {
    accent: '#10B981',
    accentText: '#34D399',
    icon: '✅',
    badgeText: 'SUCCESS',
    glowBg: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    buttonBg: '#10B981',
    buttonText: '#000000',
  },
  info: {
    accent: '#3B82F6',
    accentText: '#60A5FA',
    icon: 'ℹ️',
    badgeText: 'NOTICE',
    glowBg: 'rgba(59, 130, 246, 0.16)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    buttonBg: '#3B82F6',
    buttonText: '#FFFFFF',
  },
  neutral: {
    accent: '#FFFFFF',
    accentText: '#E4E4E7',
    icon: '💬',
    badgeText: 'ALERT',
    glowBg: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    buttonBg: '#FFFFFF',
    buttonText: '#000000',
  },
};

export default function AlertModal({
  visible = false,
  type = 'warning',
  title = 'Alert',
  message,
  details,
  confirmText = 'Got It',
  cancelText,
  onConfirm,
  onCancel,
  dismissOnBackdrop = true,
  isLoading = false,
  isDestructive = false,
}) {
  if (!visible) return null;

  const cfg = MODAL_TYPE_CONFIG[type] || MODAL_TYPE_CONFIG.warning;
  const showCancel = Boolean(cancelText && onCancel);

  const handleBackdropPress = () => {
    if (dismissOnBackdrop && !isLoading) {
      if (onCancel) onCancel();
      else if (onConfirm) onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialogCard, { borderColor: cfg.borderColor }]}>
              {/* Top Glow Aura & Icon */}
              <View style={[styles.iconContainer, { backgroundColor: cfg.glowBg, borderColor: cfg.accent }]}>
                <Text style={styles.iconText}>{cfg.icon}</Text>
              </View>

              {/* Tag Badge */}
              <View style={[styles.badge, { borderColor: cfg.accent, backgroundColor: cfg.glowBg }]}>
                <Text style={[styles.badgeText, { color: cfg.accentText }]}>
                  {cfg.badgeText}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Optional Details Callout */}
              {details ? (
                <View style={[styles.detailsBox, { borderLeftColor: cfg.accent }]}>
                  <Text style={styles.detailsText}>{details}</Text>
                </View>
              ) : null}

              {/* Buttons Row */}
              <View style={styles.actionsRow}>
                {showCancel && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                    disabled={isLoading}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: isDestructive ? '#EF4444' : cfg.buttonBg,
                    },
                    !showCancel && styles.fullWidthButton,
                  ]}
                  onPress={onConfirm}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isDestructive ? '#FFFFFF' : cfg.buttonText}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.confirmButtonText,
                        { color: isDestructive ? '#FFFFFF' : cfg.buttonText },
                      ]}
                    >
                      {confirmText}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F0F12',
    borderRadius: 22,
    borderWidth: 1.2,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: '#D4D4D8',
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3,
  },
  detailsText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#A1A1AA',
    textAlign: 'left',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1.5,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidthButton: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
