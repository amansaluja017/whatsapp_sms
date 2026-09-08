import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LAST_TRIGGER_DATE_KEY,
  LAST_TRIGGER_TIME_KEY,
  LAST_TRIGGER_SSID_KEY,
  LAST_TRIGGER_DETAILS_KEY,
  BACKGROUND_MONITORING_KEY,
  BOT_SERVER_URL_KEY,
  TARGET_SSID_KEY,
  SAVED_NETWORKS_KEY,
  TARGET_RECIPIENT_KEY,
  CACHED_CHATS_KEY,
  MESSAGE_TEMPLATE_KEY,
  AUTO_OPEN_KEY,
  DISCLAIMER_ACCEPTED_KEY,
  USER_ID_KEY,
  DEFAULT_MESSAGE_TEMPLATE,
  DEFAULT_TARGET_SSID,
  DEFAULT_BOT_URL,
  DEFAULT_USER_ID,
  DEFAULT_RECIPIENT,
} from '../constants/config';

export async function loadStoredSettings() {
  try {
    const [
      savedDate,
      savedTriggerTime,
      savedTriggerSSID,
      savedDetails,
      savedBgMonitoring,
      savedBotUrl,
      savedTarget,
      savedNets,
      savedRecipient,
      cachedChats,
      savedTemplate,
      savedAutoOpen,
      savedUserId,
    ] = await Promise.all([
      AsyncStorage.getItem(LAST_TRIGGER_DATE_KEY),
      AsyncStorage.getItem(LAST_TRIGGER_TIME_KEY),
      AsyncStorage.getItem(LAST_TRIGGER_SSID_KEY),
      AsyncStorage.getItem(LAST_TRIGGER_DETAILS_KEY),
      AsyncStorage.getItem(BACKGROUND_MONITORING_KEY),
      AsyncStorage.getItem(BOT_SERVER_URL_KEY),
      AsyncStorage.getItem(TARGET_SSID_KEY),
      AsyncStorage.getItem(SAVED_NETWORKS_KEY),
      AsyncStorage.getItem(TARGET_RECIPIENT_KEY),
      AsyncStorage.getItem(CACHED_CHATS_KEY),
      AsyncStorage.getItem(MESSAGE_TEMPLATE_KEY),
      AsyncStorage.getItem(AUTO_OPEN_KEY),
      AsyncStorage.getItem(USER_ID_KEY),
    ]);

    let parsedNets = [DEFAULT_TARGET_SSID];
    if (savedNets) {
      try {
        const parsed = JSON.parse(savedNets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedNets = parsed;
        }
      } catch (e) {}
    }

    let parsedRecipient = DEFAULT_RECIPIENT;
    if (savedRecipient) {
      try {
        parsedRecipient = JSON.parse(savedRecipient);
      } catch (e) {}
    }

    let parsedChats = [];
    if (cachedChats) {
      try {
        parsedChats = JSON.parse(cachedChats);
      } catch (e) {}
    }

    let parsedDetails = null;
    if (savedDetails) {
      try {
        parsedDetails = JSON.parse(savedDetails);
      } catch (e) {}
    }

    // Default background monitoring to enabled (true)
    const backgroundMonitoring = savedBgMonitoring !== null ? savedBgMonitoring === 'true' : true;
    const autoOpenWhatsApp = savedAutoOpen !== null ? savedAutoOpen === 'true' : true;

    return {
      lastTriggeredDate: savedDate || null,
      lastTriggeredTime: savedTriggerTime || null,
      lastTriggeredSSID: savedTriggerSSID || null,
      lastTriggerDetails: parsedDetails,
      backgroundMonitoring,
      autoOpenWhatsApp,
      botUrl: savedBotUrl || DEFAULT_BOT_URL,
      userId: (savedUserId && savedUserId.trim()) || DEFAULT_USER_ID,
      targetSSID: savedTarget || DEFAULT_TARGET_SSID,
      savedNetworks: parsedNets,
      targetRecipient: parsedRecipient,
      cachedChats: parsedChats,
      messageTemplate: savedTemplate || DEFAULT_MESSAGE_TEMPLATE,
    };
  } catch (err) {
    console.error('Failed loading storage data:', err);
    return null;
  }
}

export async function saveUserId(userId) {
  if (!userId || !userId.trim()) {
    return AsyncStorage.removeItem(USER_ID_KEY);
  }
  return AsyncStorage.setItem(USER_ID_KEY, userId.trim());
}

export async function saveMessageTemplate(template) {
  return AsyncStorage.setItem(MESSAGE_TEMPLATE_KEY, template);
}

export async function saveTargetSSID(ssid) {
  if (!ssid) {
    return AsyncStorage.removeItem(TARGET_SSID_KEY);
  }
  return AsyncStorage.setItem(TARGET_SSID_KEY, ssid);
}

export async function saveSavedNetworks(networks) {
  return AsyncStorage.setItem(SAVED_NETWORKS_KEY, JSON.stringify(networks));
}

export async function saveTargetRecipient(recipient) {
  if (!recipient) {
    return AsyncStorage.removeItem(TARGET_RECIPIENT_KEY);
  }
  return AsyncStorage.setItem(TARGET_RECIPIENT_KEY, JSON.stringify(recipient));
}

export async function saveAutoOpenWhatsApp(enabled) {
  return AsyncStorage.setItem(AUTO_OPEN_KEY, enabled ? 'true' : 'false');
}

export async function saveCachedChats(chats) {
  return AsyncStorage.setItem(CACHED_CHATS_KEY, JSON.stringify(chats));
}

export async function saveBotUrl(url) {
  return AsyncStorage.setItem(BOT_SERVER_URL_KEY, url);
}

export async function saveBackgroundMonitoring(enabled) {
  return AsyncStorage.setItem(BACKGROUND_MONITORING_KEY, enabled ? 'true' : 'false');
}

export async function saveTriggerEvent(dateStr, ssid, timeStr = null, details = null) {
  const tasks = [
    AsyncStorage.setItem(LAST_TRIGGER_DATE_KEY, dateStr),
    AsyncStorage.setItem(LAST_TRIGGER_SSID_KEY, ssid || ''),
  ];

  if (timeStr) {
    tasks.push(AsyncStorage.setItem(LAST_TRIGGER_TIME_KEY, timeStr));
  }

  if (details) {
    tasks.push(AsyncStorage.setItem(LAST_TRIGGER_DETAILS_KEY, JSON.stringify(details)));
  }

  await Promise.all(tasks);
}

export async function saveDisclaimerAccepted(accepted = true) {
  return AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, accepted ? 'true' : 'false');
}

export async function isDisclaimerAccepted() {
  const val = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
  return val === 'true';
}

export async function clearDailyTrigger() {
  await Promise.all([
    AsyncStorage.removeItem(LAST_TRIGGER_DATE_KEY),
    AsyncStorage.removeItem(LAST_TRIGGER_TIME_KEY),
    AsyncStorage.removeItem(LAST_TRIGGER_SSID_KEY),
    AsyncStorage.removeItem(LAST_TRIGGER_DETAILS_KEY),
  ]);
}

