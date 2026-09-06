import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';

function getSignalInfo(level) {
  if (typeof level !== 'number') return { bars: '●●●○', text: 'Good', level: -65 };
  if (level >= -55) return { bars: '●●●●', text: 'Strong', level };
  if (level >= -70) return { bars: '●●●○', text: 'Good', level };
  if (level >= -85) return { bars: '●●○○', text: 'Fair', level };
  return { bars: '●○○○', text: 'Weak', level };
}

export default function WifiSelectorCard({
  targetSSID,
  currentSSID,
  nearbyNetworks,
  isScanningWifi,
  lastScannedAt,
  customSSIDInput,
  onScanWifi,
  onSelectSSID,
  onChangeCustomSSID,
  onSubmitCustomSSID,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Defensively ensure safe array
  const safeNetworks = useMemo(() => {
    if (Array.isArray(nearbyNetworks)) return nearbyNetworks;
    if (nearbyNetworks?.networks && Array.isArray(nearbyNetworks.networks)) {
      return nearbyNetworks.networks;
    }
    return [];
  }, [nearbyNetworks]);

  // Filter networks based on search query
  const filteredNetworks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return safeNetworks;
    return safeNetworks.filter((net) =>
      net.ssid && net.ssid.toLowerCase().includes(q)
    );
  }, [safeNetworks, searchQuery]);

  const hasNetworks = safeNetworks.length > 0;
  const isTargetCurrentlyConnected =
    currentSSID && targetSSID && currentSSID.toLowerCase() === targetSSID.toLowerCase();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.cardIcon}>📶</Text>
          <View>
            <Text style={styles.cardLabel}>NEARBY WI-FI NETWORKS</Text>
            <Text style={styles.cardSublabel}>
              {isScanningWifi
                ? 'Scanning nearby frequencies...'
                : lastScannedAt
                ? `Last scan: ${lastScannedAt} • Tap Scan to refresh`
                : hasNetworks
                ? `${safeNetworks.length} network${safeNetworks.length > 1 ? 's' : ''} detected`
                : 'Auto-detect router to trigger WhatsApp'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.outlineBadge, isScanningWifi && { opacity: 0.6 }]}
          onPress={() => onScanWifi && onScanWifi(false)}
          disabled={isScanningWifi}
          activeOpacity={0.7}
        >
          {isScanningWifi ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.outlineBadgeText}>Scanning...</Text>
            </View>
          ) : (
            <Text style={styles.outlineBadgeText}>🔄 Scan Wi-Fi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Trigger Indicator Box */}
      <View style={styles.activeTargetBanner}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.activeTargetLabel}>ACTIVE TRIGGER ROUTER</Text>
          <Text style={styles.activeTargetSSID} numberOfLines={1}>
            {targetSSID || 'None Selected'}
          </Text>
          <Text style={styles.activeTargetDesc}>
            {isTargetCurrentlyConnected
              ? '● Phone is connected to this trigger network now.'
              : 'Messages will auto-send whenever you connect to this Wi-Fi.'}
          </Text>
        </View>
        <View style={isTargetCurrentlyConnected ? styles.connectedPill : styles.targetPill}>
          <Text style={isTargetCurrentlyConnected ? styles.connectedPillText : styles.targetPillText}>
            {isTargetCurrentlyConnected ? 'CONNECTED' : 'TRIGGER'}
          </Text>
        </View>
      </View>

      {/* Quick Set Current Wi-Fi if connected to different router */}
      {currentSSID && currentSSID.toLowerCase() !== targetSSID.toLowerCase() && (
        <TouchableOpacity
          style={styles.quickSetButton}
          onPress={() => onSelectSSID(currentSSID)}
          activeOpacity={0.7}
        >
          <Text style={styles.quickSetIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickSetButtonTitle}>
              Set Connected Network as Trigger
            </Text>
            <Text style={styles.quickSetButtonSSID} numberOfLines={1}>
              "{currentSSID}"
            </Text>
          </View>
          <Text style={styles.quickSetActionText}>Select →</Text>
        </TouchableOpacity>
      )}

      {/* Filter / Search Bar (if > 3 networks) */}
      {safeNetworks.length > 3 && (
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search nearby networks by name..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Section Sublabel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionSublabel}>
          Select Network to Trigger Message ({filteredNetworks.length}):
        </Text>
        {isScanningWifi && (
          <Text style={styles.liveScanningIndicator}>Updating...</Text>
        )}
      </View>

      {/* Networks List */}
      {filteredNetworks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📡</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching networks found' : 'No nearby networks detected yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No Wi-Fi matches "${searchQuery}". Clear your search or enter it manually below.`
              : 'Tap "Scan Wi-Fi" above. (Ensure Location/GPS is turned ON on Android for full scan).'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyScanButton}
              onPress={() => onScanWifi && onScanWifi(false)}
              disabled={isScanningWifi}
            >
              <Text style={styles.emptyScanButtonText}>🔍 Scan Nearby Networks</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.networkScrollContainer}
          contentContainerStyle={styles.networkList}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {filteredNetworks.map((net, idx) => {
            const isCurrentTarget =
              net.ssid && net.ssid.toLowerCase() === targetSSID.toLowerCase();
            const isConnectedNet =
              currentSSID && net.ssid && net.ssid.toLowerCase() === currentSSID.toLowerCase();
            const signal = getSignalInfo(net.level);

            return (
              <TouchableOpacity
                key={`${net.ssid}-${idx}`}
                style={[
                  styles.networkItem,
                  isCurrentTarget && styles.networkItemActive,
                ]}
                onPress={() => onSelectSSID(net.ssid)}
                activeOpacity={0.7}
              >
                {/* Radio selection circle */}
                <View
                  style={[
                    styles.radioOuter,
                    isCurrentTarget && styles.radioOuterActive,
                  ]}
                >
                  {isCurrentTarget && <View style={styles.radioInner} />}
                </View>

                {/* Network Info */}
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text
                      style={[
                        styles.networkSSIDText,
                        isCurrentTarget && { color: COLORS.white, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {net.ssid}
                    </Text>
                    {net.frequency && (
                      <View style={styles.freqBadge}>
                        <Text style={styles.freqBadgeText}>{net.frequency}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                    <Text style={styles.signalBars}>{signal.bars}</Text>
                    <Text style={styles.signalLevelText}>
                      {signal.text} {typeof net.level === 'number' && net.level < 0 ? `(${net.level} dBm)` : ''}
                    </Text>
                    {isConnectedNet && (
                      <Text style={styles.connectedInlineTag}>• Connected</Text>
                    )}
                  </View>
                </View>

                {/* Right Badges / Action */}
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  {isCurrentTarget ? (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>SELECTED</Text>
                    </View>
                  ) : isConnectedNet ? (
                    <View style={styles.connectedOutlinePill}>
                      <Text style={styles.connectedOutlinePillText}>CONNECTED</Text>
                    </View>
                  ) : (
                    <Text style={styles.tapToSelectText}>Select</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Manual Trigger to Rescan Wi-Fi */}
      {hasNetworks && (
        <View style={styles.manualRescanRow}>
          <Text style={styles.manualRescanText}>
            {lastScannedAt ? `Last scan: ${lastScannedAt}` : 'Wi-Fi list ready'}
          </Text>
          <TouchableOpacity
            style={[styles.manualRescanButton, isScanningWifi && { opacity: 0.6 }]}
            onPress={() => onScanWifi && onScanWifi(false)}
            disabled={isScanningWifi}
            activeOpacity={0.7}
          >
            {isScanningWifi ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.manualRescanButtonText}>Scanning...</Text>
              </View>
            ) : (
              <Text style={styles.manualRescanButtonText}>🔄 Re-scan Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Manual / Hidden Wi-Fi SSID Entry */}
      <View style={styles.divider} />
      <Text style={styles.inputLabel}>OR ENTER HIDDEN / CUSTOM WI-FI SSID:</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
          placeholder="e.g. Home_5GHz or Office_Guest"
          placeholderTextColor="#52525B"
          value={customSSIDInput}
          onChangeText={onChangeCustomSSID}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            styles.primaryButtonCompact,
            { opacity: customSSIDInput?.trim() ? 1 : 0.4 },
          ]}
          onPress={onSubmitCustomSSID}
          disabled={!customSSIDInput?.trim()}
        >
          <Text style={styles.primaryButtonCompactText}>Set Trigger</Text>
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
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  cardSublabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  outlineBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outlineBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTargetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  activeTargetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  activeTargetSSID: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  activeTargetDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  targetPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  targetPillText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectedPill: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectedPillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: '#3F3F46',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  quickSetIcon: {
    fontSize: 18,
  },
  quickSetButtonTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  quickSetButtonSSID: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  quickSetActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    paddingLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
    color: COLORS.textMuted,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: COLORS.white,
    fontSize: 13,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSublabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  liveScanningIndicator: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  networkScrollContainer: {
    maxHeight: 280,
  },
  networkList: {
    gap: 8,
    paddingBottom: 4,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  networkItemActive: {
    borderColor: COLORS.white,
    backgroundColor: '#1E1E1E',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#52525B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.white,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  networkSSIDText: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 180,
  },
  freqBadge: {
    backgroundColor: '#27272A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  freqBadgeText: {
    color: '#D4D4D8',
    fontSize: 9,
    fontWeight: '700',
  },
  signalBars: {
    color: COLORS.white,
    fontSize: 9,
    letterSpacing: 1,
  },
  signalLevelText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  connectedInlineTag: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  activePill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '800',
  },
  connectedOutlinePill: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: '#18181B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connectedOutlinePillText: {
    color: '#D4D4D8',
    fontSize: 9,
    fontWeight: '700',
  },
  tapToSelectText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    marginVertical: 4,
  },
  emptyStateIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyScanButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyScanButtonText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '700',
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
  },
  primaryButtonCompact: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonCompactText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 14,
  },
  manualRescanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  manualRescanText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  manualRescanButton: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  manualRescanButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
