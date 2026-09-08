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
  DEFAULT_MESSAGE_TEMPLATE,
  DEFAULT_TARGET_SSID,
  DEFAULT_BOT_URL,
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

    return {
      lastTriggeredDate: savedDate || null,
      lastTriggeredTime: savedTriggerTime || null,
      lastTriggeredSSID: savedTriggerSSID || null,
      lastTriggerDetails: parsedDetails,
      backgroundMonitoring,
      botUrl: savedBotUrl || DEFAULT_BOT_URL,
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

export async function saveMessageTemplate(template) {
  return AsyncStorage.setItem(MESSAGE_TEMPLATE_KEY, template);
}

export async function saveTargetSSID(ssid) {
  return AsyncStorage.setItem(TARGET_SSID_KEY, ssid);
}

export async function saveSavedNetworks(networks) {
  return AsyncStorage.setItem(SAVED_NETWORKS_KEY, JSON.stringify(networks));
}

export async function saveTargetRecipient(recipient) {
  return AsyncStorage.setItem(TARGET_RECIPIENT_KEY, JSON.stringify(recipient));
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

export async function clearDailyTrigger() {
  await Promise.all([
    AsyncStorage.removeItem(LAST_TRIGGER_DATE_KEY),
    AsyncStorage.removeItem(LAST_TRIGGER_TIME_KEY),
    AsyncStorage.removeItem(LAST_TRIGGER_SSID_KEY),
    AsyncStorage.removeItem(LAST_TRIGGER_DETAILS_KEY),
  ]);
}
