import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function BotSettingsCard({
  targetSSID,
  autoOpenWhatsApp,
  useBot,
  botUrl,
  botStatusInfo,
  isBotConnected,
  isCheckingBot,
  isSendingBot,
  targetRecipient,
  onToggleAutoOpen,
  onToggleUseBot,
  onChangeBotUrl,
  onCheckStatus,
  onOpenQR,
  onSendTestMessage,
}) {
  return (
    <>
      {/* Automation Switches */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>Auto-send on Wi-Fi Connection</Text>
            <Text style={styles.switchSublabel}>
              Automatically triggers message when connected to {targetSSID} (1st time a day)
            </Text>
          </View>
          <View style={styles.switchControl}>
            <Switch
              value={autoOpenWhatsApp}
              onValueChange={onToggleAutoOpen}
              trackColor={{ false: COLORS.borderDefault, true: COLORS.white }}
              thumbColor={autoOpenWhatsApp ? COLORS.black : COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>WhatsApp Bot (Background Dispatch)</Text>
            <Text style={styles.switchSublabel}>
              Dispatches directly via local WhatsApp Bot without redirecting to WhatsApp
            </Text>
          </View>
          <View style={styles.switchControl}>
            <Switch
              value={useBot}
              onValueChange={onToggleUseBot}
              trackColor={{ false: COLORS.borderDefault, true: COLORS.white }}
              thumbColor={useBot ? COLORS.black : COLORS.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Bot Server Controls */}
      {useBot && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.cardIcon}>🤖</Text>
              <Text style={styles.cardLabel} numberOfLines={1}>
                WHATSAPP BOT SERVICE
              </Text>
            </View>
            <View style={[styles.badge, isBotConnected ? styles.badgeActive : styles.badgeMuted]}>
              <Text
                style={[
                  styles.badgeText,
                  { color: isBotConnected ? COLORS.white : COLORS.textSecondary },
                ]}
                numberOfLines={1}
              >
                {isBotConnected
                  ? `● ONLINE (${botStatusInfo?.user || 'LINKED'})`
                  : botStatusInfo?.status === 'qr_ready'
                  ? '○ SCAN QR'
                  : botStatusInfo?.status === 'offline'
                  ? '✕ OFFLINE'
                  : '○ READY'}
              </Text>
            </View>
          </View>

          <Text style={styles.helpText}>
            Direct WhatsApp dispatch runs locally on your PC via headless Chrome and sends messages without Meta APIs or business accounts.
          </Text>

          <Text style={styles.inputLabel}>Bot Server URL (Computer Local IP):</Text>
          <TextInput
            style={[
              styles.textInput,
              !botUrl && { borderColor: COLORS.white, borderWidth: 1 },
            ]}
            placeholder="e.g. http://192.168.1.100:3001"
            placeholderTextColor="#52525B"
            value={botUrl}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onChangeBotUrl}
          />

          <View style={{ gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onCheckStatus}
              disabled={isCheckingBot}
              activeOpacity={0.8}
            >
              {isCheckingBot ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.secondaryButtonText} numberOfLines={1}>
                  🔍 Check Bot Connection Status
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onOpenQR}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText} numberOfLines={1}>
                🔗 Open Pairing QR Page in Browser (/qr)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onSendTestMessage}
              disabled={isSendingBot}
              activeOpacity={0.8}
            >
              {isSendingBot ? (
                <ActivityIndicator color={COLORS.black} size="small" />
              ) : (
                <Text style={styles.primaryButtonText} numberOfLines={1}>
                  ⚡ Send Message to {targetRecipient.name} Now
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.white,
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
  inputLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
});

