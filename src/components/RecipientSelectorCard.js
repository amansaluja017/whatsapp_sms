import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function RecipientSelectorCard({
  targetRecipient,
  whatsappChats,
  filteredChats,
  isLoadingChats,
  chatFilterType,
  chatSearchQuery,
  customPhoneInput,
  isBotConnected,
  onLoadChats,
  onOpenQR,
  onSelectFilter,
  onChangeSearchQuery,
  onSelectRecipient,
  onChangeCustomPhone,
  onSubmitCustomPhone,
  onRemoveRecipient,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.cardIcon}>👥</Text>
          <Text style={styles.cardLabel} numberOfLines={1}>
            WHATSAPP RECIPIENT
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.outlineBadge, isLoadingChats && { opacity: 0.5 }]}
          onPress={onLoadChats}
          disabled={isLoadingChats}
        >
          {isLoadingChats ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.outlineBadgeText}>🔄 Load Chats</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.helpText}>
        Select which WhatsApp contact or group receives your automated message when your Wi-Fi connects.
      </Text>

      {/* Active Target Banner */}
      <View style={styles.selectedRecipientBanner}>
        {targetRecipient ? (
          <>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.selectedRecipientLabel}>CURRENT TARGET:</Text>
              <Text style={styles.selectedRecipientName} numberOfLines={1}>
                {targetRecipient.isGroup ? '👥 ' : '👤 '}
                {targetRecipient?.name || targetRecipient?.phone || 'Selected Contact'}
              </Text>
              <Text style={styles.selectedRecipientSubtext} numberOfLines={1}>
                {targetRecipient.isGroup
                  ? 'Group Conversation'
                  : targetRecipient?.phone || targetRecipient?.id || ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {onRemoveRecipient && (
                <TouchableOpacity
                  style={styles.removeTargetButton}
                  onPress={onRemoveRecipient}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeTargetButtonText}>✕ Remove</Text>
                </TouchableOpacity>
              )}
              <View style={styles.solidPill}>
                <Text style={styles.solidPillText}>
                  {targetRecipient.isGroup ? 'GROUP' : 'CONTACT'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedRecipientLabel}>CURRENT TARGET:</Text>
            <Text style={[styles.selectedRecipientName, { color: COLORS.textMuted }]}>
              👤 None Selected
            </Text>
            <Text style={styles.selectedRecipientSubtext}>
              Select a WhatsApp contact/group below, or type a custom phone number.
            </Text>
          </View>
        )}
      </View>

      {/* Filter Tabs: All, Contacts, Groups */}
      <View style={styles.tabFilterRow}>
        <TouchableOpacity
          style={[styles.tabButton, chatFilterType === 'all' && styles.tabButtonActive]}
          onPress={() => onSelectFilter('all')}
        >
          <Text
            style={[styles.tabButtonText, chatFilterType === 'all' && styles.tabButtonTextActive]}
            numberOfLines={1}
          >
            All ({whatsappChats.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, chatFilterType === 'contacts' && styles.tabButtonActive]}
          onPress={() => onSelectFilter('contacts')}
        >
          <Text
            style={[styles.tabButtonText, chatFilterType === 'contacts' && styles.tabButtonTextActive]}
            numberOfLines={1}
          >
            Contacts ({whatsappChats.filter((c) => !c.isGroup).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, chatFilterType === 'groups' && styles.tabButtonActive]}
          onPress={() => onSelectFilter('groups')}
        >
          <Text
            style={[styles.tabButtonText, chatFilterType === 'groups' && styles.tabButtonTextActive]}
            numberOfLines={1}
          >
            Groups ({whatsappChats.filter((c) => c.isGroup).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TextInput
        style={[styles.textInput, { marginTop: 8, marginBottom: 8 }]}
        placeholder="🔍 Search contacts or groups..."
        placeholderTextColor="#52525B"
        value={chatSearchQuery}
        onChangeText={onChangeSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Filtered WhatsApp Chats List */}
      <View style={styles.chatListContainer}>
        {isLoadingChats ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.loadingSubtext}>
              Syncing contacts & groups from WhatsApp...
            </Text>
          </View>
        ) : whatsappChats.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              No contacts or groups loaded yet.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={styles.primaryButtonCompact}
                onPress={onLoadChats}
              >
                <Text style={styles.primaryButtonCompactText}>🔄 Load Chats</Text>
              </TouchableOpacity>
              {!isBotConnected && (
                <TouchableOpacity
                  style={styles.secondaryButtonCompact}
                  onPress={onOpenQR}
                >
                  <Text style={styles.secondaryButtonCompactText}>🔗 Open QR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              No contacts or groups matched "{chatSearchQuery}".
            </Text>
          </View>
        ) : (
          <ScrollView
            nestedScrollEnabled={true}
            style={{ maxHeight: 240 }}
            showsVerticalScrollIndicator={true}
          >
            {(filteredChats || []).filter(Boolean).slice(0, 60).map((chat) => {
              const isSelected = targetRecipient?.id === chat.id;
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={[
                    styles.chatItem,
                    isSelected && styles.chatItemActive,
                  ]}
                  onPress={() => onSelectRecipient(chat)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <Text style={styles.itemIcon}>
                      {isSelected ? '✓' : chat.isGroup ? '👥' : '👤'}
                    </Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          styles.chatItemName,
                          isSelected && { color: COLORS.white, fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {chat.name || chat.phone || 'Unnamed'}
                      </Text>
                      <Text style={styles.chatItemSubtext} numberOfLines={1} ellipsizeMode="tail">
                        {chat.isGroup ? 'Group Conversation' : (chat.phone || 'Contact')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isSelected && (
                      <View style={[styles.solidPill, { marginRight: 4 }]}>
                        <Text style={styles.solidPillText}>TARGET</Text>
                      </View>
                    )}
                    <View style={styles.outlinePill}>
                      <Text style={styles.outlinePillText}>
                        {chat.isGroup ? 'GROUP' : 'CONTACT'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Custom Manual Phone Input */}
      <View style={styles.divider} />
      <Text style={styles.inputLabel}>Or Enter Any Custom Phone Number:</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
          placeholder="e.g. +1234567890"
          placeholderTextColor="#52525B"
          value={customPhoneInput}
          onChangeText={onChangeCustomPhone}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={[
            styles.primaryButtonCompact,
            { opacity: customPhoneInput.trim() ? 1 : 0.4 },
          ]}
          onPress={onSubmitCustomPhone}
          disabled={!customPhoneInput.trim()}
        >
          <Text style={styles.primaryButtonCompactText}>Set</Text>
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
    letterSpacing: 1,
    flex: 1,
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
  selectedRecipientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  selectedRecipientLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  selectedRecipientName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  selectedRecipientSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  solidPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  solidPillText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '800',
  },
  outlinePill: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  outlinePillText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  outlineBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outlineBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  tabFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  tabButtonText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: COLORS.black,
    fontWeight: '800',
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
  },
  chatListContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  chatItemActive: {
    backgroundColor: '#1F1F1F',
  },
  itemIcon: {
    fontSize: 15,
    marginRight: 10,
    color: COLORS.white,
  },
  chatItemName: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '600',
  },
  chatItemSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  centerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  loadingSubtext: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  primaryButtonCompact: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonCompactText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButtonCompact: {
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonCompactText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 12,
  },
  removeTargetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTargetButtonText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
});
