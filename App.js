import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Linking,
  Alert,
  NativeModules,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';

// Constants & Theme
import {
  DEFAULT_TARGET_SSID,
  TARGET_MESSAGE,
  DEFAULT_BOT_URL,
  DEFAULT_RECIPIENT,
  DEFAULT_MESSAGE_TEMPLATE,
  getTodayDateString,
  resolveMessageTemplate,
} from './src/constants/config';
import { COLORS } from './src/constants/theme';

// Services
import {
  loadStoredSettings,
  saveTargetSSID,
  saveSavedNetworks,
  saveTargetRecipient,
  saveCachedChats,
  saveBotUrl,
  saveMessageTemplate,
  saveTriggerEvent,
  clearDailyTrigger,
} from './src/services/storage';
import {
  fetchBotStatus,
  fetchWhatsAppChatsApi,
  sendWhatsAppMessageApi,
  openBrowserQR,
} from './src/services/botApi';
import { readCurrentSSID, scanWifiNetworks } from './src/services/wifi';

// Modular Components
import Header from './src/components/Header';
import DisconnectedBanner from './src/components/DisconnectedBanner';
import RouterStatusCard from './src/components/RouterStatusCard';
import WifiSelectorCard from './src/components/WifiSelectorCard';
import RecipientSelectorCard from './src/components/RecipientSelectorCard';
import MessageTemplateCard from './src/components/MessageTemplateCard';
import BotSettingsCard from './src/components/BotSettingsCard';
import DiagnosticsCard from './src/components/DiagnosticsCard';

export default function App() {
  const [networkState, setNetworkState] = useState(null);
  const [ipAddress, setIpAddress] = useState(null);
  const [currentSSID, setCurrentSSID] = useState(null);
  const [targetSSID, setTargetSSID] = useState(DEFAULT_TARGET_SSID);
  const [nearbyNetworks, setNearbyNetworks] = useState([
    { ssid: DEFAULT_TARGET_SSID, level: -55, source: 'default' },
  ]);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [customSSIDInput, setCustomSSIDInput] = useState('');
  const [savedNetworks, setSavedNetworks] = useState([DEFAULT_TARGET_SSID]);

  // Recipient (Contact or Group) state
  const [targetRecipient, setTargetRecipient] = useState(DEFAULT_RECIPIENT);
  const [whatsappChats, setWhatsappChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatFilterType, setChatFilterType] = useState('all');
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  // Custom Message Template state (supports ${name}, ${time}, ${date}, ${day}, ${year}, emojis)
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE_TEMPLATE);

  const [locationPermission, setLocationPermission] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);
  const [useBot, setUseBot] = useState(true);
  const [isSendingBot, setIsSendingBot] = useState(false);
  const [isCheckingBot, setIsCheckingBot] = useState(false);
  const [botUrl, setBotUrl] = useState(DEFAULT_BOT_URL);
  const [botStatusInfo, setBotStatusInfo] = useState(null);
  const [lastTriggeredSSID, setLastTriggeredSSID] = useState(null);
  const [lastTriggeredDate, setLastTriggeredDate] = useState(null);

  // Load saved settings and probe bot status on launch
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        const stored = await loadStoredSettings();
        if (isMounted && stored) {
          if (stored.lastTriggeredDate) setLastTriggeredDate(stored.lastTriggeredDate);
          if (stored.lastTriggeredSSID) setLastTriggeredSSID(stored.lastTriggeredSSID);
          if (stored.botUrl) setBotUrl(stored.botUrl);
          if (stored.targetSSID) setTargetSSID(stored.targetSSID);
          if (stored.savedNetworks) {
            setSavedNetworks(stored.savedNetworks);
            setNearbyNetworks(stored.savedNetworks.map((s) => ({ ssid: s, level: -60, source: 'saved' })));
          }
          if (stored.targetRecipient) setTargetRecipient(stored.targetRecipient);
          if (stored.cachedChats) setWhatsappChats(stored.cachedChats);
          if (stored.messageTemplate) setMessageTemplate(stored.messageTemplate);

          // Probe bot status silently with 3s timeout
          fetchBotStatus(stored.botUrl || DEFAULT_BOT_URL, 3000)
            .then(({ data }) => {
              if (isMounted) setBotStatusInfo(data);
            })
            .catch(() => {
              if (isMounted) setBotStatusInfo({ status: 'offline' });
            });
        }
      } catch (err) {
        console.error('Init app error:', err);
      }
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live evaluated message based on template, recipient, and current router
  const activeMessage = useMemo(() => {
    return (
      resolveMessageTemplate(messageTemplate, {
        name: targetRecipient?.name || 'there',
        wifi: targetSSID || '',
      }) || TARGET_MESSAGE
    );
  }, [messageTemplate, targetRecipient, targetSSID]);

  // Helper to open pairing QR page in browser
  const handleOpenQR = useCallback(() => {
    openBrowserQR(botUrl).catch(() => {
      Alert.alert('Notice', 'Could not open browser. Please ensure your Bot Server URL is correct.');
    });
  }, [botUrl]);

  // Check WhatsApp Bot status
  const handleCheckBotStatus = useCallback(
    async (silent = false) => {
      setIsCheckingBot(true);
      try {
        const { data } = await fetchBotStatus(botUrl);
        setBotStatusInfo(data);

        if (data.status === 'connected') {
          if (!silent) {
            Alert.alert(
              'WhatsApp Bot Online',
              `Bot is connected and ready!\n\nLogged in as: ${data.user || 'Unknown'}\nServer: ${botUrl}`
            );
          }
        } else if (data.status === 'qr_ready') {
          if (!silent) {
            Alert.alert(
              'Bot Pairing Needed',
              'The WhatsApp Bot is running, but you need to scan the QR code to link your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open QR in Browser', onPress: handleOpenQR },
              ]
            );
          }
        } else if (!silent) {
          Alert.alert('Bot Status', `Current status: ${data.status}`);
        }
      } catch (err) {
        setBotStatusInfo({ status: 'offline', error: err.message });
        if (!silent) {
          Alert.alert(
            'WhatsApp Bot Unreachable',
            `Could not connect to bot server.\n\nError: ${err.message}\n\nPlease ensure your PC and phone are on the same Wi-Fi.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open QR in Browser', onPress: handleOpenQR },
            ]
          );
        }
      } finally {
        setIsCheckingBot(false);
      }
    },
    [botUrl, handleOpenQR]
  );

  const [lastScannedAt, setLastScannedAt] = useState(null);

  // Stable references to prevent infinite re-render scan loops and keyboard typing jumps
  const nearbyNetworksRef = useRef(nearbyNetworks);
  nearbyNetworksRef.current = nearbyNetworks;

  const targetSSIDRef = useRef(targetSSID);
  targetSSIDRef.current = targetSSID;

  const currentSSIDRef = useRef(currentSSID);
  currentSSIDRef.current = currentSSID;

  const targetRecipientRef = useRef(targetRecipient);
  targetRecipientRef.current = targetRecipient;

  const activeMessageRef = useRef(activeMessage);
  activeMessageRef.current = activeMessage;

  const autoOpenWhatsAppRef = useRef(autoOpenWhatsApp);
  autoOpenWhatsAppRef.current = autoOpenWhatsApp;

  const lastTriggeredDateRef = useRef(lastTriggeredDate);
  lastTriggeredDateRef.current = lastTriggeredDate;

  const isScanningWifiRef = useRef(false);
  const hasInitialScanRunRef = useRef(false);

  // Debounced storage writers so typing never blocks or lags UI
  const saveTemplateTimeoutRef = useRef(null);
  const handleChangeTemplate = useCallback((val) => {
    setMessageTemplate(val);
    if (saveTemplateTimeoutRef.current) {
      clearTimeout(saveTemplateTimeoutRef.current);
    }
    saveTemplateTimeoutRef.current = setTimeout(() => {
      saveMessageTemplate(val);
    }, 400);
  }, []);

  const saveBotUrlTimeoutRef = useRef(null);
  const handleChangeBotUrl = useCallback((val) => {
    setBotUrl(val);
    if (saveBotUrlTimeoutRef.current) {
      clearTimeout(saveBotUrlTimeoutRef.current);
    }
    saveBotUrlTimeoutRef.current = setTimeout(() => {
      saveBotUrl(val);
    }, 400);
  }, []);

  // Select a new target Wi-Fi connection
  const handleSelectSSID = useCallback(async (newSSID) => {
    if (!newSSID || !newSSID.trim()) return;
    const cleanSSID = newSSID.trim().replace(/^"|"$/g, '');

    setTargetSSID(cleanSSID);
    setCustomSSIDInput('');
    await saveTargetSSID(cleanSSID);

    setSavedNetworks((prev) => {
      const updated = Array.from(new Set([cleanSSID, ...prev]));
      saveSavedNetworks(updated);
      return updated;
    });

    setNearbyNetworks((prev) => {
      if (prev.some((n) => n.ssid.toLowerCase() === cleanSSID.toLowerCase())) {
        return prev;
      }
      return [{ ssid: cleanSSID, level: -50, source: 'user' }, ...prev];
    });

    Alert.alert(
      'Target Wi-Fi Selected',
      `Target router set to:\n"${cleanSSID}"\n\nWhen your phone connects to "${cleanSSID}", the app will auto-send the message.`
    );
  }, []);

  // Safe Wi-Fi scanner (manual trigger + single initial scan on startup, never in an auto-loop)
  const handleScanWifi = useCallback(async (isSilent = false) => {
    if (isScanningWifiRef.current) return;
    isScanningWifiRef.current = true;
    setIsScanningWifi(true);

    try {
      const activeSSID = currentSSIDRef.current || (await readCurrentSSID(targetSSIDRef.current)).ssid;
      const res = await scanWifiNetworks(activeSSID, targetSSIDRef.current, nearbyNetworksRef.current);

      const networks = Array.isArray(res?.networks)
        ? res.networks
        : (Array.isArray(res) ? res : []);

      if (networks.length > 0) {
        setNearbyNetworks(networks);
        saveSavedNetworks(networks.map((n) => n.ssid));
      }

      setLastScannedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      if (!isSilent) {
        if (res?.error === 'LOCATION_DISABLED') {
          Alert.alert(
            'Turn On Location (GPS)',
            'Android requires Location services (GPS) to be turned ON to detect all nearby Wi-Fi networks.\n\nPlease enable Location in your phone quick settings and tap Scan again.'
          );
        } else if (res?.error === 'PERMISSION_DENIED') {
          Alert.alert(
            'Location Permission Required',
            'Please grant Location permission so the app can scan nearby Wi-Fi access points.'
          );
        } else if (res?.error === 'NATIVE_MODULE_MISSING') {
          Alert.alert(
            'Hardware Scan Notice (Expo Go)',
            'Live Wi-Fi scanning requires a native development build (react-native-wifi-reborn is not available in standard Expo Go).\n\nYou can manually enter your router SSID below, or run a development build (npx expo run:android).'
          );
        } else if (res?.scannedCount > 0) {
          Alert.alert(
            'Nearby Wi-Fi Networks',
            `Found ${res.scannedCount} nearby Wi-Fi network${res.scannedCount > 1 ? 's' : ''}!\n\nTap any network in the list to select it as your trigger.`
          );
        } else {
          Alert.alert(
            'Scan Finished',
            'No additional Wi-Fi networks discovered. If your router has a hidden SSID, you can type it manually below.'
          );
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      if (!isSilent) {
        Alert.alert('Scan Notice', 'Could not scan for nearby networks. You can enter the Wi-Fi name manually below.');
      }
    } finally {
      isScanningWifiRef.current = false;
      setIsScanningWifi(false);
    }
  }, []);

  // Select a recipient (contact or group)
  const handleSelectRecipient = useCallback(async (rec) => {
    if (!rec || !rec.id) return;
    setTargetRecipient(rec);
    setCustomPhoneInput('');
    await saveTargetRecipient(rec);
    Alert.alert(
      'Recipient Selected',
      `Target set to:\n"${rec.name}" (${rec.isGroup ? 'Group' : 'Contact'})\n\nMessages will be delivered here upon Wi-Fi connection.`
    );
  }, []);

  // Fetch live WhatsApp contacts & groups from the bot server
  const handleFetchChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const { ok, data } = await fetchWhatsAppChatsApi(botUrl);
      if (ok && Array.isArray(data?.chats)) {
        setWhatsappChats(data.chats);
        await saveCachedChats(data.chats);
        Alert.alert(
          'Chats Loaded',
          `Loaded ${data.chats.length} contacts & groups from your WhatsApp.\n\nTap any contact or group below to select it.`
        );
      } else {
        const errMsg = data?.error || 'Unable to load chats';
        Alert.alert('WhatsApp Bot Notice', `${errMsg}\n\nWould you like to open the QR code page in your browser?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open QR in Browser', onPress: handleOpenQR },
        ]);
      }
    } catch (err) {
      Alert.alert(
        'WhatsApp Chats Load Error',
        `Could not load chats: ${err.message}\n\nWould you like to open the browser to link WhatsApp?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open QR in Browser', onPress: handleOpenQR },
        ]
      );
    } finally {
      setIsLoadingChats(false);
    }
  }, [botUrl, handleOpenQR]);

  // Send WhatsApp message via local bot server
  const handleSendViaBot = useCallback(
    async (recipient = targetRecipientRef.current, message = activeMessageRef.current) => {
      setIsSendingBot(true);
      const targetName = recipient?.name || 'Selected Target';

      try {
        const { ok, data, raw } = await sendWhatsAppMessageApi(botUrl, recipient, message);
        if (ok && data?.success) {
          Alert.alert(
            'Message Delivered',
            `Message delivered successfully!\n\nTarget: ${targetName} (${recipient?.isGroup ? 'Group' : 'Contact'})\nMessage: "${message}"\nID: ${data.messageId}`
          );
        } else {
          const errMsg = data?.error || raw || 'Failed to dispatch message';
          Alert.alert('Delivery Notice', `${errMsg}\n\nIf your WhatsApp is not linked, open the QR page below.`, [
            { text: 'OK', style: 'cancel' },
            { text: 'Open QR in Browser', onPress: handleOpenQR },
          ]);
        }
      } catch (err) {
        Alert.alert('Bot Connection Error', `Could not reach WhatsApp Bot: ${err.message}`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open QR in Browser', onPress: handleOpenQR },
        ]);
      } finally {
        setIsSendingBot(false);
      }
    },
    [botUrl, handleOpenQR]
  );

  // Fallback function: send via bot or direct link
  const handleSendMessage = useCallback(
    async (recipient = targetRecipientRef.current, message = activeMessageRef.current) => {
      if (useBot) {
        return handleSendViaBot(recipient, message);
      }

      if (recipient?.isGroup) {
        Alert.alert(
          'Group Messaging Requires Bot',
          'Direct WhatsApp links only support phone contacts. Enable "WhatsApp Bot" mode to message groups automatically.'
        );
        return;
      }

      const cleanPhone = (recipient?.phone || '').replace(/[^\d]/g, '');
      if (!cleanPhone) {
        Alert.alert('Error', 'Please select a contact with a valid phone number.');
        return;
      }

      const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      try {
        const canOpen = await Linking.canOpenURL(nativeUrl);
        await Linking.openURL(canOpen ? nativeUrl : webUrl);
      } catch (err) {
        Alert.alert('Error', 'Could not open WhatsApp on this device.');
      }
    },
    [useBot, handleSendViaBot]
  );

  // Primary network and router check logic (stable callback, will not re-trigger on keystrokes)
  const checkNetworkAndSSID = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setNetworkState(state);

      const ip = await Network.getIpAddressAsync();
      setIpAddress(ip);

      const { ssid, permission } = await readCurrentSSID(targetSSIDRef.current);
      setLocationPermission(permission);
      setCurrentSSID(ssid);

      const todayStr = getTodayDateString();

      // Check if current SSID matches chosen target router
      if (
        ssid &&
        targetSSIDRef.current &&
        ssid.toLowerCase() === targetSSIDRef.current.toLowerCase()
      ) {
        const alreadySentToday = lastTriggeredDateRef.current === todayStr;

        if (!alreadySentToday && autoOpenWhatsAppRef.current) {
          try {
            await saveTriggerEvent(todayStr, ssid);
          } catch (e) {}
          setLastTriggeredDate(todayStr);
          setLastTriggeredSSID(ssid);
          handleSendMessage(targetRecipientRef.current, activeMessageRef.current);
        }
      }
    } catch (err) {
      console.error('Network check error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [handleSendMessage]);

  // Run Wi-Fi scan ONCE on initial launch, never in an auto-loop
  useEffect(() => {
    if (!hasInitialScanRunRef.current) {
      hasInitialScanRunRef.current = true;
      handleScanWifi(true);
    }
  }, [handleScanWifi]);

  // Network connectivity listener for router arrival (checks current SSID only, does not scan hardware)
  useEffect(() => {
    checkNetworkAndSSID();

    const subscription = Network.addNetworkStateListener(() => {
      checkNetworkAndSSID();
    });

    return () => {
      subscription && subscription.remove();
    };
  }, [checkNetworkAndSSID]);

  const handleResetDailyTrigger = async () => {
    try {
      await clearDailyTrigger();
      setLastTriggeredDate(null);
      setLastTriggeredSSID(null);
      Alert.alert('Reset Complete', 'Daily auto-trigger limit has been cleared for today.');
      checkNetworkAndSSID();
    } catch (e) {
      Alert.alert('Error', 'Failed to reset daily trigger status.');
    }
  };

  const todayStr = getTodayDateString();
  const isTriggeredToday = lastTriggeredDate === todayStr;

  // Filtered WhatsApp contacts & groups for recipient selection
  const filteredChats = useMemo(() => {
    let list = whatsappChats;
    if (chatFilterType === 'contacts') {
      list = list.filter((c) => !c.isGroup);
    } else if (chatFilterType === 'groups') {
      list = list.filter((c) => c.isGroup);
    }

    if (chatSearchQuery && chatSearchQuery.trim()) {
      const q = chatSearchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q))
      );
    }
    return list;
  }, [whatsappChats, chatFilterType, chatSearchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    checkNetworkAndSSID();
    handleCheckBotStatus(true);
    handleScanWifi(false);
  };

  const isMatched = currentSSID && currentSSID.toLowerCase() === targetSSID.toLowerCase();
  const isBotConnected = botStatusInfo?.status === 'connected';
  const hasNativeModule = !!(NativeModules && NativeModules.RNNetworkInfo);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.white}
              colors={[COLORS.white]}
            />
          }
        >
          {/* App Title Header */}
          <Header isBotConnected={isBotConnected} />

          {/* If WhatsApp is NOT Connected: High Visibility Action Banner */}
          {!isBotConnected && (
            <DisconnectedBanner
              onOpenBrowser={handleOpenQR}
              onCheckStatus={() => handleCheckBotStatus(false)}
              isChecking={isCheckingBot}
            />
          )}

          {/* Target Router Status Banner */}
          <RouterStatusCard
            isMatched={isMatched}
            targetSSID={targetSSID}
            currentSSID={currentSSID}
            targetRecipient={targetRecipient}
            useBot={useBot}
            isSendingBot={isSendingBot}
            resolvedMessage={activeMessage}
            onPressAction={() => handleSendMessage(targetRecipient, activeMessage)}
          />

          {/* Choose Wi-Fi Connection Card */}
          <WifiSelectorCard
            targetSSID={targetSSID}
            currentSSID={currentSSID}
            nearbyNetworks={nearbyNetworks}
            isScanningWifi={isScanningWifi}
            lastScannedAt={lastScannedAt}
            customSSIDInput={customSSIDInput}
            onScanWifi={handleScanWifi}
            onSelectSSID={handleSelectSSID}
            onChangeCustomSSID={setCustomSSIDInput}
            onSubmitCustomSSID={() => {
              if (customSSIDInput.trim()) {
                handleSelectSSID(customSSIDInput);
              } else {
                Alert.alert('Notice', 'Please enter a Wi-Fi name (SSID).');
              }
            }}
          />

          {/* WhatsApp Recipient (Contact or Group) */}
          <RecipientSelectorCard
            targetRecipient={targetRecipient}
            whatsappChats={whatsappChats}
            filteredChats={filteredChats}
            isLoadingChats={isLoadingChats}
            chatFilterType={chatFilterType}
            chatSearchQuery={chatSearchQuery}
            customPhoneInput={customPhoneInput}
            isBotConnected={isBotConnected}
            onLoadChats={handleFetchChats}
            onOpenQR={handleOpenQR}
            onSelectFilter={setChatFilterType}
            onChangeSearchQuery={setChatSearchQuery}
            onSelectRecipient={handleSelectRecipient}
            onChangeCustomPhone={setCustomPhoneInput}
            onSubmitCustomPhone={() => {
              const clean = customPhoneInput.trim().replace(/[^\d+]/g, '');
              if (clean) {
                const digits = clean.replace(/[^\d]/g, '');
                handleSelectRecipient({
                  id: `${digits}@c.us`,
                  name: clean,
                  isGroup: false,
                  phone: clean,
                });
              } else {
                Alert.alert('Notice', 'Please enter a valid phone number.');
              }
            }}
          />

          {/* Custom WhatsApp Message Template Card */}
          <MessageTemplateCard
            messageTemplate={messageTemplate}
            targetRecipient={targetRecipient}
            targetSSID={targetSSID}
            onChangeTemplate={handleChangeTemplate}
          />

          {/* Automation & Bot Settings */}
          <BotSettingsCard
            targetSSID={targetSSID}
            autoOpenWhatsApp={autoOpenWhatsApp}
            useBot={useBot}
            botUrl={botUrl}
            botStatusInfo={botStatusInfo}
            isBotConnected={isBotConnected}
            isCheckingBot={isCheckingBot}
            isSendingBot={isSendingBot}
            targetRecipient={targetRecipient}
            onToggleAutoOpen={setAutoOpenWhatsApp}
            onToggleUseBot={setUseBot}
            onChangeBotUrl={handleChangeBotUrl}
            onCheckStatus={() => handleCheckBotStatus(false)}
            onOpenQR={handleOpenQR}
            onSendTestMessage={() => handleSendViaBot(targetRecipient, activeMessage)}
          />

          {/* Network Diagnostic Information */}
          <DiagnosticsCard
            currentSSID={currentSSID}
            isTriggeredToday={isTriggeredToday}
            lastTriggeredDate={lastTriggeredDate}
            hasNativeModule={hasNativeModule}
            ipAddress={ipAddress}
            locationPermission={locationPermission}
            onResetTrigger={handleResetDailyTrigger}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 160,
    backgroundColor: COLORS.background,
  },
});
