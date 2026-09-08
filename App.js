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
  AppState,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';

// Constants & Theme
import {
  DEFAULT_TARGET_SSID,
  DEFAULT_BOT_URL,
  DEFAULT_USER_ID,
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
  saveUserId,
  saveMessageTemplate,
  saveTriggerEvent,
  clearDailyTrigger,
  saveAutoOpenWhatsApp,
  saveDisclaimerAccepted,
  isDisclaimerAccepted,
} from './src/services/storage';
import {
  fetchBotStatus,
  fetchWhatsAppChatsApi,
  sendWhatsAppMessageApi,
  openBrowserQR,
} from './src/services/botApi';
import { readCurrentSSID, scanWifiNetworks } from './src/services/wifi';
import {
  checkAndTriggerWifiMessage,
  startBackgroundMonitoringAsync,
  stopBackgroundMonitoringAsync,
  isBackgroundMonitoringActiveAsync,
  addTriggerListener,
} from './src/services/backgroundTask';

// Modular Components
import Header from './src/components/Header';
import DisconnectedBanner from './src/components/DisconnectedBanner';
import RouterStatusCard from './src/components/RouterStatusCard';
import BackgroundMonitoringCard from './src/components/BackgroundMonitoringCard';
import WifiSelectorCard from './src/components/WifiSelectorCard';
import RecipientSelectorCard from './src/components/RecipientSelectorCard';
import MessageTemplateCard from './src/components/MessageTemplateCard';
import BotSettingsCard from './src/components/BotSettingsCard';
import DiagnosticsCard from './src/components/DiagnosticsCard';
import AlertBox from './src/components/AlertBox';
import DisclaimerModal from './src/components/DisclaimerModal';

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 370;

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
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [botStatusInfo, setBotStatusInfo] = useState(null);
  const [lastTriggeredSSID, setLastTriggeredSSID] = useState(null);
  const [lastTriggeredDate, setLastTriggeredDate] = useState(null);
  const [lastTriggeredTime, setLastTriggeredTime] = useState(null);
  const [lastTriggerDetails, setLastTriggerDetails] = useState(null);

  // Background Runner state
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const [isTogglingBackground, setIsTogglingBackground] = useState(false);
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);

  // Safety Disclaimer state
  const [isDisclaimerModalVisible, setIsDisclaimerModalVisible] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(true); // default true until checked

  // Load saved settings and probe bot status on launch
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        const stored = await loadStoredSettings();
        const accepted = await isDisclaimerAccepted();
        if (isMounted) {
          setHasAcceptedDisclaimer(accepted);
          if (!accepted) {
            setIsDisclaimerModalVisible(true);
          }
        }

        if (isMounted && stored) {
          if (stored.lastTriggeredDate) setLastTriggeredDate(stored.lastTriggeredDate);
          if (stored.lastTriggeredTime) setLastTriggeredTime(stored.lastTriggeredTime);
          if (stored.lastTriggerDetails) setLastTriggerDetails(stored.lastTriggerDetails);
          if (stored.lastTriggeredSSID) setLastTriggeredSSID(stored.lastTriggeredSSID);
          if (stored.botUrl) setBotUrl(stored.botUrl);
          if (stored.userId) setUserId(stored.userId);
          if (stored.targetSSID) setTargetSSID(stored.targetSSID);
          if (stored.savedNetworks) {
            setSavedNetworks(stored.savedNetworks);
            setNearbyNetworks(stored.savedNetworks.map((s) => ({ ssid: s, level: -60, source: 'saved' })));
          }
          if (stored.targetRecipient) setTargetRecipient(stored.targetRecipient);
          if (stored.cachedChats) setWhatsappChats(stored.cachedChats);
          if (stored.messageTemplate) setMessageTemplate(stored.messageTemplate);
          if (stored.autoOpenWhatsApp !== undefined) setAutoOpenWhatsApp(stored.autoOpenWhatsApp);

          // Check if background service is running; if enabled in settings but inactive, start it
          isBackgroundMonitoringActiveAsync().then((isActive) => {
            if (isMounted) setIsBackgroundActive(isActive);
            if (!isActive && stored.backgroundMonitoring) {
              startBackgroundMonitoringAsync(stored.targetSSID || DEFAULT_TARGET_SSID)
                .then((res) => {
                  if (isMounted && res.success) setIsBackgroundActive(true);
                })
                .catch(() => {});
            }
          });

          // Probe bot status silently with 3s timeout
          fetchBotStatus(stored.botUrl || DEFAULT_BOT_URL, 3000, stored.userId || DEFAULT_USER_ID)
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
    return resolveMessageTemplate(messageTemplate, {
      name: targetRecipient?.name || 'there',
      wifi: targetSSID || '',
    });
  }, [messageTemplate, targetRecipient, targetSSID]);

  // Helper to open pairing QR page in browser
  const handleOpenQR = useCallback(() => {
    openBrowserQR(botUrl, userId).catch(() => {
      Alert.alert('Notice', 'Could not open browser. Please ensure your Bot Server URL is correct.');
    });
  }, [botUrl, userId]);

  // Check WhatsApp Bot status
  const handleCheckBotStatus = useCallback(
    async (silent = false) => {
      setIsCheckingBot(true);
      try {
        const { data } = await fetchBotStatus(botUrl, 5000, userId);
        setBotStatusInfo(data);

        if (data.status === 'connected') {
          if (!silent) {
            Alert.alert(
              'WhatsApp Bot Online',
              `Bot is connected and ready!\n\nUser ID: ${userId || 'default'}\nLogged in as: ${data.user || 'Unknown'}\nServer: ${botUrl}`
            );
          }
        } else if (data.status === 'qr_ready') {
          if (!silent) {
            Alert.alert(
              'Bot Pairing Needed',
              `The WhatsApp Bot is running for user "${userId || 'default'}", but you need to scan the QR code to link your account.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open QR in Browser', onPress: handleOpenQR },
              ]
            );
          }
        } else if (!silent) {
          Alert.alert('Bot Status', `Current status for "${userId || 'default'}": ${data.status}`);
        }
      } catch (err) {
        setBotStatusInfo({ status: 'offline', error: err.message });
        if (!silent) {
          Alert.alert(
            'WhatsApp Bot Unreachable',
            `Could not connect to bot server.\n\nError: ${err.message}\n\nPlease ensure your PC/Server is accessible.`,
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
    [botUrl, userId, handleOpenQR]
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

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

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

  const saveUserIdTimeoutRef = useRef(null);
  const handleChangeUserId = useCallback(
    (val) => {
      const sanitized = (val || '').trim();
      setUserId(val);
      if (saveUserIdTimeoutRef.current) {
        clearTimeout(saveUserIdTimeoutRef.current);
      }
      saveUserIdTimeoutRef.current = setTimeout(() => {
        saveUserId(sanitized);
        if (sanitized) {
          fetchBotStatus(botUrl, 3000, sanitized)
            .then(({ data }) => setBotStatusInfo(data))
            .catch(() => setBotStatusInfo({ status: 'offline' }));
        }
      }, 400);
    },
    [botUrl]
  );

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
      `Target router set to:\n"${cleanSSID}"\n\nWhen your phone connects to "${cleanSSID}", the app will auto-send the message (once per day).`
    );

    // Update background monitoring notification with new router SSID
    isBackgroundMonitoringActiveAsync().then((active) => {
      if (active) {
        startBackgroundMonitoringAsync(cleanSSID).catch(() => {});
      }
    });
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
      `Target set to:\n"${rec.name || rec.phone || 'Recipient'}" (${rec.isGroup ? 'Group' : 'Contact'})\n\nMessages will be delivered here upon Wi-Fi connection.`
    );
  }, []);

  // Fetch live WhatsApp contacts & groups from the bot server
  const handleFetchChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const { ok, data } = await fetchWhatsAppChatsApi(botUrl, 12000, userId);
      if (ok && Array.isArray(data?.chats)) {
        setWhatsappChats(data.chats);
        await saveCachedChats(data.chats);
        Alert.alert(
          'Chats Loaded',
          `Loaded ${data.chats.length} contacts & groups for session "${userId || 'default'}".\n\nTap any contact or group below to select it.`
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
  }, [botUrl, userId, handleOpenQR]);

  // Send WhatsApp message via local bot server
  const handleSendViaBot = useCallback(
    async (recipient = targetRecipientRef.current, message = activeMessageRef.current) => {
      if (!recipient || (!recipient.id && !recipient.phone)) {
        Alert.alert(
          'Recipient Required',
          'Please select a WhatsApp contact or enter a phone number in the Recipient card below.'
        );
        return;
      }

      const trimmed = (message || '').trim();
      if (!trimmed) {
        Alert.alert(
          'Message Required',
          'Please enter your message in the "Custom WhatsApp Message" card below before sending.'
        );
        return;
      }

      setIsSendingBot(true);
      const targetName = recipient?.name || 'Selected Target';

      try {
        const { ok, data, raw } = await sendWhatsAppMessageApi(botUrl, recipient, message, 15000, userId);
        if (ok && data?.success) {
          Alert.alert(
            'Message Delivered',
            `Message delivered successfully!\n\nTarget: ${targetName} (${recipient?.isGroup ? 'Group' : 'Contact'})\nSession: ${userId || 'default'}\nMessage: "${message}"\nID: ${data.messageId}`
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
    [botUrl, userId, handleOpenQR]
  );

  // Fallback function: send via bot or direct link
  const handleSendMessage = useCallback(
    async (recipient = targetRecipientRef.current, message = activeMessageRef.current) => {
      if (!recipient || (!recipient.id && !recipient.phone)) {
        Alert.alert(
          'Recipient Required',
          'Please select a WhatsApp contact or enter a phone number in the Recipient card below.'
        );
        return;
      }

      const trimmed = (message || '').trim();
      if (!trimmed) {
        Alert.alert(
          'Message Required',
          'Please enter your message in the "Custom WhatsApp Message" card below before sending.'
        );
        return;
      }

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

      // Trigger message if auto-dispatch is enabled and connected to target router
      if (autoOpenWhatsAppRef.current) {
        const triggerRes = await checkAndTriggerWifiMessage('network_check');
        if (triggerRes?.triggered) {
          setLastTriggeredDate(triggerRes.date);
          setLastTriggeredTime(triggerRes.time);
          setLastTriggeredSSID(triggerRes.ssid);
          setLastTriggerDetails(triggerRes.details);
        }
      }
    } catch (err) {
      console.error('Network check error:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Run Wi-Fi scan ONCE on initial launch, never in an auto-loop
  useEffect(() => {
    if (!hasInitialScanRunRef.current) {
      hasInitialScanRunRef.current = true;
      handleScanWifi(true);
    }
  }, [handleScanWifi]);

  // Network connectivity listener and periodic heartbeat watchdog for background runner
  useEffect(() => {
    checkNetworkAndSSID();

    const netSubscription = Network.addNetworkStateListener(() => {
      checkNetworkAndSSID();
    });

    // Listen to background service events to keep UI in sync
    const removeTriggerListener = addTriggerListener((event) => {
      if (event?.triggered) {
        setLastTriggeredDate(event.date);
        setLastTriggeredTime(event.time);
        setLastTriggeredSSID(event.ssid);
        setLastTriggerDetails(event.details);
      }
    });

    // Check on app resume from background
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkNetworkAndSSID();
        isBackgroundMonitoringActiveAsync().then(setIsBackgroundActive);
      }
    });

    // Periodic heartbeat watchdog (every 15 seconds while alive)
    const watchdogInterval = setInterval(() => {
      checkNetworkAndSSID();
    }, 15000);

    return () => {
      netSubscription && netSubscription.remove();
      removeTriggerListener && removeTriggerListener();
      appStateSubscription && appStateSubscription.remove();
      clearInterval(watchdogInterval);
    };
  }, [checkNetworkAndSSID]);

  // Background service toggle handler
  const handleToggleBackground = useCallback(async (enable) => {
    setIsTogglingBackground(true);
    try {
      if (enable) {
        const res = await startBackgroundMonitoringAsync(targetSSIDRef.current);
        if (res.success) {
          setIsBackgroundActive(true);
          Alert.alert(
            'Background Runner Active',
            `Phone background service is now RUNNING.\n\nThe app will continuously watch for Wi-Fi "${targetSSIDRef.current}" in the background and trigger the message automatically once per day.`
          );
        } else {
          Alert.alert(
            'Background Permission Needed',
            `Could not start background monitoring: ${res.error}\n\nPlease ensure Location permission is set to "Allow all the time" in your Android Settings.`
          );
        }
      } else {
        await stopBackgroundMonitoringAsync();
        setIsBackgroundActive(false);
        Alert.alert('Background Runner Stopped', 'Phone background monitoring has been stopped.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsTogglingBackground(false);
    }
  }, []);
  // Toggle auto-open/send
  const handleToggleAutoOpen = useCallback(async (val) => {
    setAutoOpenWhatsApp(val);
    await saveAutoOpenWhatsApp(val);
  }, []);

  // Remove selected recipient
  const handleRemoveRecipient = useCallback(async () => {
    Alert.alert(
      'Remove Recipient',
      'Are you sure you want to clear the active WhatsApp target? Automated messages will not be sent until a new recipient is chosen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Target',
          style: 'destructive',
          onPress: async () => {
            setTargetRecipient(null);
            await saveTargetRecipient(null);
          },
        },
      ]
    );
  }, []);

  // Remove target Wi-Fi router
  const handleClearTargetSSID = useCallback(async () => {
    Alert.alert(
      'Remove Trigger Router',
      'Are you sure you want to remove the target Wi-Fi? The app will not trigger any messages on Wi-Fi connection until a router is set.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Router',
          style: 'destructive',
          onPress: async () => {
            setTargetSSID('');
            await saveTargetSSID('');
          },
        },
      ]
    );
  }, []);

  // Master remove / disable all automation
  const handleRemoveAutomation = useCallback(async () => {
    const isCurrentlyDisabled = !isBackgroundActive && !autoOpenWhatsApp;

    if (isCurrentlyDisabled) {
      // Re-enable automation
      setIsTogglingBackground(true);
      try {
        setAutoOpenWhatsApp(true);
        await saveAutoOpenWhatsApp(true);
        const res = await startBackgroundMonitoringAsync(targetSSIDRef.current || DEFAULT_TARGET_SSID);
        if (res.success) {
          setIsBackgroundActive(true);
        }
        Alert.alert(
          'Automation Re-armed ✅',
          'Wi-Fi auto-dispatch and background phone monitoring have been turned back on.'
        );
      } catch (e) {
        Alert.alert('Notice', e.message);
      } finally {
        setIsTogglingBackground(false);
      }
      return;
    }

    // Confirm removal / disabling
    Alert.alert(
      'Remove Automation?',
      'This will stop background Wi-Fi monitoring and turn off automated message dispatching upon Wi-Fi connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn Off Automation',
          style: 'destructive',
          onPress: async () => {
            setIsTogglingBackground(true);
            try {
              await stopBackgroundMonitoringAsync();
              setIsBackgroundActive(false);
              setAutoOpenWhatsApp(false);
              await saveAutoOpenWhatsApp(false);
              Alert.alert(
                'Automation Removed / Disabled 🛑',
                'Background phone monitoring has been stopped and automated Wi-Fi triggers have been paused.'
              );
            } catch (e) {
              console.error('Error removing automation:', e);
            } finally {
              setIsTogglingBackground(false);
            }
          },
        },
      ]
    );
  }, [isBackgroundActive, autoOpenWhatsApp]);

  // Reset 1-per-day limit
  const handleResetDailyTrigger = async () => {
    try {
      await clearDailyTrigger();
      setLastTriggeredDate(null);
      setLastTriggeredTime(null);
      setLastTriggeredSSID(null);
      setLastTriggerDetails(null);
      Alert.alert(
        'Limit Reset Complete',
        'Daily trigger lock has been cleared. The app is now ARMED and will trigger again today when your phone connects to the target Wi-Fi.'
      );
      checkNetworkAndSSID();
    } catch (e) {
      Alert.alert('Error', 'Failed to reset daily trigger status.');
    }
  };

  // Test Wi-Fi trigger immediately
  const handleTestTriggerNow = async () => {
    setIsTestingTrigger(true);
    try {
      const res = await checkAndTriggerWifiMessage('manual_test', true);
      if (res.triggered) {
        setLastTriggeredDate(res.date);
        setLastTriggeredTime(res.time);
        setLastTriggeredSSID(res.ssid);
        setLastTriggerDetails(res.details);

        if (res.success) {
          Alert.alert(
            'Trigger Test Successful! ✅',
            `Connected to "${res.ssid}".\n\nDispatched message to ${res.recipient?.name || 'recipient'}:\n"${res.message}"\n\nDaily 1-time limit is now active for today.`
          );
        } else {
          Alert.alert(
            'Wi-Fi Matched, Bot Offline Notice',
            `Connected to "${res.ssid}".\n\nMessage generated: "${res.message}"\n\nBot server did not acknowledge message delivery. Please ensure your WhatsApp Bot server is online.`
          );
        }
      } else {
        Alert.alert(
          'Trigger Did Not Fire',
          `Reason: ${res.reason || res.error || 'Check Wi-Fi'}\n\nCurrent Wi-Fi: "${currentSSID || 'None'}"\nTarget Wi-Fi: "${targetSSID}"`
        );
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsTestingTrigger(false);
    }
  };

  const todayStr = getTodayDateString();
  const isTriggeredToday = lastTriggeredDate === todayStr;

  // Filtered WhatsApp contacts & groups for recipient selection
  const filteredChats = useMemo(() => {
    let list = Array.isArray(whatsappChats) ? whatsappChats.filter(Boolean) : [];
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
          contentContainerStyle={[
            styles.container,
            { paddingHorizontal: isCompact ? 12 : 16 },
          ]}
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

          {/* Unofficial WhatsApp Safety Advisory & Ban Risk Alert Box */}
          <AlertBox
            type="warning"
            title="UNOFFICIAL APP • RISK OF BAN"
            message="This application connects via unofficial WhatsApp Web protocols. WhatsApp does not endorse third-party bots. Misusing this automation (such as spamming, mass messaging, or rapid pings) carries a high risk of permanent WhatsApp account ban."
            details="Only use for 1 personal check-in arrival message per day to yourself, family, or your personal group. Never use for unsolicited marketing or high-frequency broadcasts."
            detailsLabel="SAFE USAGE RULE"
            actionLabel="Review Safety Policy"
            onAction={() => setIsDisclaimerModalVisible(true)}
            collapsible={true}
            defaultExpanded={false}
          />

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

          {/* Background Phone Runner & Daily Trigger Card */}
          <BackgroundMonitoringCard
            targetSSID={targetSSID}
            isBackgroundActive={isBackgroundActive}
            isTogglingBackground={isTogglingBackground}
            onToggleBackground={handleToggleBackground}
            autoOpenWhatsApp={autoOpenWhatsApp}
            isTriggeredToday={isTriggeredToday}
            lastTriggeredDate={lastTriggeredDate}
            lastTriggeredTime={lastTriggeredTime}
            lastTriggeredSSID={lastTriggeredSSID}
            lastTriggerDetails={lastTriggerDetails}
            onResetTrigger={handleResetDailyTrigger}
            onTestTriggerNow={handleTestTriggerNow}
            isTestingTrigger={isTestingTrigger}
            onRemoveAutomation={handleRemoveAutomation}
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
            onClearTargetSSID={handleClearTargetSSID}
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
            onRemoveRecipient={handleRemoveRecipient}
            onChangeCustomPhone={setCustomPhoneInput}
            onSubmitCustomPhone={() => {
              const clean = customPhoneInput.trim().replace(/[^\d+]/g, '');
              if (clean) {
                const digits = clean.replace(/[^\d]/g, '');
                handleSelectRecipient({
                  id: `${digits}@s.whatsapp.net`,
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
            userId={userId}
            botStatusInfo={botStatusInfo}
            isBotConnected={isBotConnected}
            isCheckingBot={isCheckingBot}
            isSendingBot={isSendingBot}
            targetRecipient={targetRecipient}
            onToggleAutoOpen={handleToggleAutoOpen}
            onToggleUseBot={setUseBot}
            onChangeBotUrl={handleChangeBotUrl}
            onChangeUserId={handleChangeUserId}
            onCheckStatus={() => handleCheckBotStatus(false)}
            onOpenQR={handleOpenQR}
            onSendTestMessage={() => handleSendViaBot(targetRecipient, activeMessage)}
          />

          {/* Network Diagnostic Information */}
          <DiagnosticsCard
            currentSSID={currentSSID}
            isTriggeredToday={isTriggeredToday}
            lastTriggeredDate={lastTriggeredDate}
            lastTriggeredTime={lastTriggeredTime}
            isBackgroundActive={isBackgroundActive}
            hasNativeModule={hasNativeModule}
            ipAddress={ipAddress}
            locationPermission={locationPermission}
            onResetTrigger={handleResetDailyTrigger}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* First-Time / On-Demand Unofficial Notice & Ban Risk Disclaimer Modal */}
      <DisclaimerModal
        visible={isDisclaimerModalVisible}
        canDismissWithoutAccepting={hasAcceptedDisclaimer}
        onCancel={() => setIsDisclaimerModalVisible(false)}
        onAccept={async () => {
          await saveDisclaimerAccepted(true);
          setHasAcceptedDisclaimer(true);
          setIsDisclaimerModalVisible(false);
        }}
      />
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
    paddingVertical: 12,
    paddingBottom: 160,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
});
