import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as BackgroundTask from 'expo-background-task';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LAST_TRIGGER_DATE_KEY,
  getTodayDateString,
  resolveMessageTemplate,
  DEFAULT_TARGET_SSID,
} from '../constants/config';
import {
  loadStoredSettings,
  saveTriggerEvent,
  saveBackgroundMonitoring,
} from './storage';
import { readCurrentSSID } from './wifi';
import { sendWhatsAppMessageApi } from './botApi';

export const BACKGROUND_WIFI_TASK = 'background-wifi-monitor-task';
export const BACKGROUND_FETCH_TASK = 'background-wifi-fetch-task';

// In-memory concurrency guard to prevent simultaneous duplicate dispatches
let isTriggeringNow = false;

// Event listeners for UI updates when background task fires
const triggerListeners = new Set();

export function addTriggerListener(callback) {
  triggerListeners.add(callback);
  return () => triggerListeners.delete(callback);
}

function notifyTriggerListeners(event) {
  triggerListeners.forEach((cb) => {
    try {
      cb(event);
    } catch (e) {
      console.warn('Error in trigger listener:', e);
    }
  });
}

/**
 * Primary Wi-Fi verification and message dispatch logic.
 * Enforces the strict ONCE-A-DAY limit.
 * Can be invoked from:
 *  - Background Location Foreground Service update
 *  - Background Fetch periodic task
 *  - AppState resume (coming to foreground)
 *  - Network state change listener
 *  - Manual test button in UI
 */
export async function checkAndTriggerWifiMessage(triggerSource = 'auto', forceOverrideLimit = false) {
  const todayStr = getTodayDateString();

  try {
    const stored = await loadStoredSettings();
    if (!stored) {
      return { triggered: false, reason: 'Failed to load app settings' };
    }

    const targetSSID = stored.targetSSID || DEFAULT_TARGET_SSID;

    // 1. Check Once-A-Day Limit (unless forcefully overridden for manual testing)
    if (!forceOverrideLimit && stored.lastTriggeredDate === todayStr) {
      return {
        triggered: false,
        reason: 'Already triggered today',
        alreadyTriggered: true,
        date: todayStr,
        time: stored.lastTriggeredTime,
        ssid: stored.lastTriggeredSSID,
      };
    }

    // 2. Read current Wi-Fi SSID
    const { ssid, isFallback } = await readCurrentSSID(targetSSID);
    if (!ssid) {
      return {
        triggered: false,
        reason: 'Not connected to any Wi-Fi network',
      };
    }

    // 3. Match against target SSID (case-insensitive & trimmed)
    const targetClean = targetSSID.trim().toLowerCase();
    const currentClean = ssid.trim().toLowerCase();

    if (currentClean !== targetClean) {
      return {
        triggered: false,
        reason: `Connected to "${ssid}", but waiting for "${targetSSID}"`,
        currentSSID: ssid,
        targetSSID,
      };
    }

    // 4. Validate that user has written a message
    const rawTemplate = (stored.messageTemplate || '').trim();
    if (!rawTemplate) {
      return {
        triggered: false,
        reason: 'No message configured. Please enter your custom message in the app.',
        emptyMessage: true,
      };
    }

    // 5. Validate that a recipient is selected
    if (!stored.targetRecipient || (!stored.targetRecipient.id && !stored.targetRecipient.phone)) {
      return {
        triggered: false,
        reason: 'No recipient selected. Please select a WhatsApp contact or phone number in the app.',
        emptyRecipient: true,
      };
    }

    // 6. ATOMIC GUARD: Check in-memory lock & fresh storage check
    if (isTriggeringNow) {
      return { triggered: false, reason: 'Dispatch already in progress' };
    }
    isTriggeringNow = true;

    // Re-verify from storage to prevent race condition across multiple workers
    if (!forceOverrideLimit) {
      const freshStoredDate = await AsyncStorage.getItem(LAST_TRIGGER_DATE_KEY);
      if (freshStoredDate === todayStr) {
        isTriggeringNow = false;
        return { triggered: false, reason: 'Already triggered today (concurrent check)' };
      }
    }

    // Record trigger date & time immediately to guarantee once-a-day enforcement
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const message = resolveMessageTemplate(stored.messageTemplate, {
      name: stored.targetRecipient?.name || 'there',
      wifi: ssid,
    });

    const triggerDetails = {
      timestamp: Date.now(),
      dateStr: todayStr,
      timeStr,
      ssid,
      recipient: stored.targetRecipient?.name || stored.targetRecipient?.phone,
      recipientId: stored.targetRecipient?.id,
      userId: stored.userId || 'default',
      message,
      triggerSource,
      isFallback,
    };

    // Save event to storage immediately
    await saveTriggerEvent(todayStr, ssid, timeStr, triggerDetails);

    // 5. Send WhatsApp message via Bot Server
    let sendResult = null;
    let sendError = null;

    if (stored.botUrl) {
      try {
        sendResult = await sendWhatsAppMessageApi(
          stored.botUrl,
          stored.targetRecipient,
          message,
          20000,
          stored.userId || 'default'
        );
      } catch (err) {
        sendError = err.message;
      }
    } else {
      sendError = 'No bot server URL configured';
    }

    const isSuccess = sendResult?.ok && sendResult?.data?.success;

    // Update details with delivery outcome
    const finalDetails = {
      ...triggerDetails,
      success: !!isSuccess,
      error: sendError || (sendResult?.ok ? null : (sendResult?.data?.error || sendResult?.raw || 'Failed')),
    };

    await saveTriggerEvent(todayStr, ssid, timeStr, finalDetails);

    const eventResult = {
      triggered: true,
      success: !!isSuccess,
      date: todayStr,
      time: timeStr,
      ssid,
      message,
      recipient: stored.targetRecipient,
      details: finalDetails,
    };

    notifyTriggerListeners(eventResult);
    return eventResult;
  } catch (err) {
    console.error('Error in checkAndTriggerWifiMessage:', err);
    return { triggered: false, error: err.message };
  } finally {
    isTriggeringNow = false;
  }
}

// ---------------------------------------------------------
// Global Task Registrations (must execute at top level)
// ---------------------------------------------------------

TaskManager.defineTask(BACKGROUND_WIFI_TASK, async ({ data, error }) => {
  if (error) {
    console.warn(`[TaskManager] Background WiFi task error:`, error.message);
    return;
  }

  try {
    await checkAndTriggerWifiMessage('foreground_service');
  } catch (e) {
    console.warn('[TaskManager] Exception in background WiFi task:', e);
  }
});

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await checkAndTriggerWifiMessage('background_fetch');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// ---------------------------------------------------------
// Background Monitoring Lifecycle Controls
// ---------------------------------------------------------

/**
 * Check if the background location/foreground service is currently registered
 */
export async function isBackgroundMonitoringActiveAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WIFI_TASK);
    return isRegistered;
  } catch (e) {
    return false;
  }
}

/**
 * Start persistent phone background monitoring:
 * - Requests foreground + background location permissions
 * - Starts Location updates with Android Foreground Service notification
 * - Registers periodic BackgroundFetch
 */
export async function startBackgroundMonitoringAsync(targetSSID = DEFAULT_TARGET_SSID) {
  try {
    // 1. Request Foreground Permissions
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      return { success: false, error: 'Foreground location permission denied' };
    }

    // 2. Request Background Permissions
    try {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted' && Platform.OS === 'android') {
        console.warn('Background location permission not granted, will attempt service with foreground permission');
      }
    } catch (e) {
      console.warn('Background permission request notice:', e?.message);
    }

    // 3. Register Location updates with persistent Android Foreground Service
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WIFI_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_WIFI_TASK).catch(() => {});
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_WIFI_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000,
      distanceInterval: 0,
      deferredUpdatesInterval: 15000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'WhatsApp Wi-Fi Automation Active',
        notificationBody: `Monitoring for "${targetSSID}" (Triggers 1x daily)`,
        notificationColor: '#00A884',
        killServiceOnDestroy: false,
      },
      pausesUpdatesAutomatically: false,
    });

    // 4. Register BackgroundTask as backup runner
    try {
      const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (!isFetchRegistered) {
        await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15, // 15 minutes
        });
      }
    } catch (e) {
      console.warn('Background task registration notice:', e?.message);
    }

    await saveBackgroundMonitoring(true);
    return { success: true };
  } catch (err) {
    console.error('Failed to start background monitoring:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Stop background monitoring and cancel foreground service
 */
export async function stopBackgroundMonitoringAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WIFI_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_WIFI_TASK);
    }

    const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isFetchRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_FETCH_TASK).catch(() => {});
    }

    await saveBackgroundMonitoring(false);
    return { success: true };
  } catch (err) {
    console.error('Failed to stop background monitoring:', err);
    return { success: false, error: err.message };
  }
}
