import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  resolveMessageTemplate,
  TEST_PREBUILD_MESSAGES,
} from '../constants/config';

const VARIABLE_TAGS = [
  { label: '${name}', desc: 'Recipient Name' },
  { label: '${time}', desc: 'Current Time' },
  { label: '${date}', desc: 'Date' },
  { label: '${day}', desc: 'Day of Week' },
  { label: '${year}', desc: 'Year' },
  { label: '${wifi}', desc: 'Wi-Fi Name' },
];

const EMOJIS = ['👋', '🎉', '✨', '💬', '📍', '🕒', '✅', '🔥', '❤️', '🚀', '👍', '🤖'];

export default function MessageTemplateCard({
  messageTemplate,
  targetRecipient,
  targetSSID,
  onChangeTemplate,
}) {
  const hasMessage = !!(messageTemplate && messageTemplate.trim());

  // Compute live evaluated preview of the message
  const previewText = hasMessage
    ? resolveMessageTemplate(messageTemplate, {
        name: targetRecipient?.name || 'there',
        wifi: targetSSID || '',
      })
    : '';

  const handleInsertTag = (tag) => {
    const current = messageTemplate || '';
    const needsSpace = current.length > 0 && !current.endsWith(' ');
    onChangeTemplate(current + (needsSpace ? ' ' : '') + tag + ' ');
  };

  const handleInsertEmoji = (emoji) => {
    const current = messageTemplate || '';
    onChangeTemplate(current + (current.endsWith(' ') || current.length === 0 ? '' : ' ') + emoji + ' ');
  };

  const handleClear = () => {
    onChangeTemplate('');
  };

  const handleLoadTestTemplate = (tpl) => {
    onChangeTemplate(tpl);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.cardIcon}>✏️</Text>
          <Text style={styles.cardLabel} numberOfLines={1}>
            CUSTOM WHATSAPP MESSAGE
          </Text>
        </View>
        {hasMessage && (
          <TouchableOpacity
            style={styles.clearBadge}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearBadgeText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.helpText}>
        Type your custom message below. The app will automatically evaluate and send this message when your phone connects to {targetSSID || 'your Wi-Fi'}.
      </Text>

      {/* Message Text Input (Takes message from the user) */}
      <View style={styles.inputHeaderRow}>
        <Text style={styles.sectionLabel}>Your Message:</Text>
        <Text style={styles.charCount}>{messageTemplate ? `${messageTemplate.length} chars` : 'Required'}</Text>
      </View>

      <TextInput
        style={[
          styles.messageInput,
          !hasMessage && styles.messageInputEmpty,
        ]}
        multiline
        numberOfLines={3}
        value={messageTemplate}
        onChangeText={onChangeTemplate}
        placeholder="Type your message here (e.g. In at office ${time}, will call you soon)..."
        placeholderTextColor="#52525B"
        textAlignVertical="top"
      />

      {!hasMessage && (
        <View style={styles.emptyWarningBox}>
          <Text style={styles.emptyWarningText}>
            ⚠️ Enter your message above, or tap a Test Template below to test.
          </Text>
        </View>
      )}

      {/* Dynamic Variable Chips */}
      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Insert Dynamic Tags:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {VARIABLE_TAGS.map((v) => (
          <TouchableOpacity
            key={v.label}
            style={styles.chipButton}
            onPress={() => handleInsertTag(v.label)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipButtonTag}>+ {v.label}</Text>
            <Text style={styles.chipButtonDesc}>{v.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Emoji Bar */}
      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Quick Emojis:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emojiScroll}
      >
        {EMOJIS.map((em) => (
          <TouchableOpacity
            key={em}
            style={styles.emojiButton}
            onPress={() => handleInsertEmoji(em)}
            activeOpacity={0.75}
          >
            <Text style={styles.emojiText}>{em}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Prebuilt Messages for Testing Only */}
      <View style={styles.testPresetsContainer}>
        <View style={styles.testPresetsHeader}>
          <Text style={styles.testPresetsTitle}>🧪 TEST TEMPLATES (FOR TESTING ONLY)</Text>
        </View>
        <Text style={styles.testPresetsDesc}>
          Tap any prebuilt template below to quickly test Wi-Fi dispatch:
        </Text>
        <View style={styles.testPresetsList}>
          {TEST_PREBUILD_MESSAGES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.testPresetItem}
              onPress={() => handleLoadTestTemplate(t.template)}
              activeOpacity={0.75}
            >
              <Text style={styles.testPresetLabel}>{t.label}</Text>
              <Text style={styles.testPresetTemplate} numberOfLines={1}>
                "{t.template}"
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Live Preview Box */}
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewLabel}>LIVE PREVIEW (WHAT WILL BE SENT):</Text>
        </View>
        <View style={styles.previewBubble}>
          <Text style={[styles.previewText, !hasMessage && { color: COLORS.textMuted, fontStyle: 'italic' }]}>
            {previewText || '(Empty — please type your message above)'}
          </Text>
          <Text style={styles.previewMeta}>
            To: {targetRecipient?.name || 'None selected'} • Router: {targetSSID || 'None'}
          </Text>
        </View>
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
  clearBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  clearBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
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
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    padding: 12,
    color: COLORS.white,
    fontSize: 14,
    minHeight: 75,
    lineHeight: 20,
  },
  messageInputEmpty: {
    borderColor: '#3F3F46',
  },
  emptyWarningBox: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  emptyWarningText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chipButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  chipButtonTag: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  chipButtonDesc: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  emojiScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  emojiButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 18,
  },
  testPresetsContainer: {
    marginTop: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 10,
  },
  testPresetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testPresetsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.8,
  },
  testPresetsDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  testPresetsList: {
    gap: 6,
  },
  testPresetItem: {
    backgroundColor: '#181818',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  testPresetLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  testPresetTemplate: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  previewContainer: {
    marginTop: 12,
    backgroundColor: '#0F0F0F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    padding: 12,
  },
  previewHeader: {
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  previewBubble: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.white,
  },
  previewText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  previewMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
});

