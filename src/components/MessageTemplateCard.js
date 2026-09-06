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
import { resolveMessageTemplate, DEFAULT_MESSAGE_TEMPLATE } from '../constants/config';

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
  // Compute live evaluated preview of the message
  const previewText = resolveMessageTemplate(messageTemplate, {
    name: targetRecipient?.name || 'Aman',
    wifi: targetSSID || '',
  });

  const handleInsertTag = (tag) => {
    const current = messageTemplate || '';
    const needsSpace = current.length > 0 && !current.endsWith(' ');
    onChangeTemplate(current + (needsSpace ? ' ' : '') + tag + ' ');
  };

  const handleInsertEmoji = (emoji) => {
    const current = messageTemplate || '';
    onChangeTemplate(current + (current.endsWith(' ') || current.length === 0 ? '' : ' ') + emoji + ' ');
  };

  const handleResetDefault = () => {
    onChangeTemplate(DEFAULT_MESSAGE_TEMPLATE);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.cardIcon}>✏️</Text>
          <Text style={styles.cardLabel}>WHATSAPP MESSAGE TEMPLATE</Text>
        </View>
        <TouchableOpacity
          style={styles.resetBadge}
          onPress={handleResetDefault}
          activeOpacity={0.7}
        >
          <Text style={styles.resetBadgeText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helpText}>
        Write the message you want to send. Tap any variable tag or emoji below to insert dynamic values.
      </Text>

      {/* Dynamic Variable Chips */}
      <Text style={styles.sectionLabel}>Insert Dynamic Tags:</Text>
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

      {/* Message Text Input */}
      <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Message Content:</Text>
      <TextInput
        style={styles.messageInput}
        multiline
        numberOfLines={3}
        value={messageTemplate}
        onChangeText={onChangeTemplate}
        placeholder="e.g. Aman in time ${time}"
        placeholderTextColor="#52525B"
        textAlignVertical="top"
      />

      {/* Live Preview Box */}
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewLabel}>LIVE PREVIEW (WHAT WILL BE SENT):</Text>
        </View>
        <View style={styles.previewBubble}>
          <Text style={styles.previewText}>{previewText || '(Empty message)'}</Text>
          <Text style={styles.previewMeta}>
            To: {targetRecipient?.name} • Router: {targetSSID}
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
  },
  cardIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  resetBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resetBadgeText: {
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
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
