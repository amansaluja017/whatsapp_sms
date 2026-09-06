import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { NetworkInfo } from 'react-native-network-info';
import WifiManager from 'react-native-wifi-reborn';

export async function requestLocationPermission() {
  try {
    if (Platform.OS === 'android') {
      let hasFine = false;
      try {
        hasFine = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      } catch (e) {}

      // On Android 13+ (API 33+), check NEARBY_WIFI_DEVICES as well
      if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS?.NEARBY_WIFI_DEVICES) {
        let hasNearby = false;
        try {
          hasNearby = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
          );
        } catch (e) {}

        if (!hasFine || !hasNearby) {
          const toRequest = [];
          if (!hasFine) {
            toRequest.push(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
            );
          }
          if (!hasNearby) {
            toRequest.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
          }
          const results = await PermissionsAndroid.requestMultiple(toRequest);
          const fineGranted =
            hasFine ||
            results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
              PermissionsAndroid.RESULTS.GRANTED;
          if (fineGranted) return 'granted';
          return 'denied';
        }
        return 'granted';
      }

      if (hasFine) {
        return 'granted';
      }

      // Android 12 and below
      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
      const fineStatus = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

      if (fineStatus === PermissionsAndroid.RESULTS.GRANTED) {
        return 'granted';
      }
      if (fineStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return 'never_ask_again';
      }
      if (fineStatus === PermissionsAndroid.RESULTS.DENIED) {
        return 'denied';
      }
    }

    // Expo Location fallback (or iOS)
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch (err) {
    console.error('Error requesting location permission:', err);
    return null;
  }
}

export async function isLocationEnabled() {
  try {
    if (Platform.OS === 'android') {
      const providerPromise = Location.getProviderStatusAsync();
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ locationServicesEnabled: true }), 2500)
      );
      const status = await Promise.race([providerPromise, timeoutPromise]);
      return status?.locationServicesEnabled ?? true;
    }
    return true;
  } catch (e) {
    console.warn('Location status check notice:', e?.message);
    return true;
  }
}

export async function promptEnableLocation() {
  try {
    if (Platform.OS === 'android' && typeof Location.enableNetworkProviderAsync === 'function') {
      await Location.enableNetworkProviderAsync();
      return true;
    }
  } catch (e) {
    // User declined or prompt not supported
  }
  return false;
}

export async function readCurrentSSID(targetSSID) {
  try {
    const status = await requestLocationPermission();
    if (status !== 'granted') {
      return { ssid: null, permission: status };
    }

    const wifiModule =
      (WifiManager && typeof WifiManager.getCurrentWifiSSID === 'function' && WifiManager) ||
      (NativeModules?.WifiManager && typeof NativeModules.WifiManager.getCurrentWifiSSID === 'function' && NativeModules.WifiManager) ||
      null;

    // Method 1: Try WifiManager.getCurrentWifiSSID()
    if (wifiModule) {
      try {
        const ssid = await wifiModule.getCurrentWifiSSID();
        if (ssid && ssid !== '<unknown ssid>' && ssid !== 'unknown' && ssid !== '0x') {
          const cleanSSID = ssid.replace(/^"|"$/g, '').trim();
          if (cleanSSID) {
            return { ssid: cleanSSID, permission: status, isFallback: false };
          }
        }
      } catch (e) {
        // Continue to NetworkInfo fallback
      }
    }

    // Method 2: Try NetworkInfo.getSSID()
    const hasNetworkInfo = !!(NativeModules && NativeModules.RNNetworkInfo);
    if (hasNetworkInfo) {
      const result = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve(null);
        }, 1500);

        try {
          NetworkInfo.getSSID((ssid) => {
            clearTimeout(timer);
            if (ssid && ssid !== '<unknown ssid>' && ssid !== 'unknown' && ssid !== '0x') {
              const cleanSSID = ssid.replace(/^"|"$/g, '').trim();
              resolve(cleanSSID || null);
            } else {
              resolve(null);
            }
          });
        } catch (e) {
          clearTimeout(timer);
          resolve(null);
        }
      });

      if (result) {
        return { ssid: result, permission: status, isFallback: false };
      }
    }

    // Fallback if running in Expo Go without native modules AND connected to Wi-Fi
    if (!wifiModule && !hasNetworkInfo) {
      try {
        const netState = await Network.getNetworkStateAsync();
        if (netState?.isConnected && netState?.type === Network.NetworkStateType.WIFI) {
          return { ssid: targetSSID, permission: status, isFallback: true };
        }
      } catch (_) {}
      return { ssid: null, permission: status, isFallback: false };
    }

    return { ssid: null, permission: status, isFallback: false };
  } catch (err) {
    console.error('Error reading SSID:', err);
    return { ssid: null, permission: null, error: err.message };
  }
}

function parseRawWifiList(rawList) {
  let list = rawList;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) {
    return [];
  }

  const items = [];
  list.forEach((item) => {
    if (
      item?.SSID &&
      typeof item.SSID === 'string' &&
      item.SSID.trim() &&
      item.SSID !== '<unknown ssid>' &&
      item.SSID !== '(hidden SSID)' &&
      item.SSID !== '0x'
    ) {
      const clean = item.SSID.trim().replace(/^"|"$/g, '');
      if (!clean) return;
      const freq = item.frequency ? (item.frequency > 4900 ? '5 GHz' : '2.4 GHz') : null;
      items.push({
        ssid: clean,
        level: typeof item.level === 'number' ? item.level : -70,
        frequency: freq,
        bssid: item.BSSID || '',
        capabilities: item.capabilities || '',
        source: 'scanned',
      });
    }
  });
  return items;
}

export async function scanWifiNetworks(activeSSID, targetSSID, existingNetworks = []) {
  const perm = await requestLocationPermission();
  let locationOn = await isLocationEnabled();

  // If location toggle is off, attempt to prompt the user to enable it via Android system dialog
  if (!locationOn && Platform.OS === 'android') {
    const prompted = await promptEnableLocation();
    if (prompted) {
      locationOn = await isLocationEnabled();
    }
  }

  const detectedList = [];
  let scanError = null;

  if (!locationOn) {
    scanError = 'LOCATION_DISABLED';
  } else if (perm !== 'granted') {
    scanError = 'PERMISSION_DENIED';
  } else {
    const wifiModule =
      (WifiManager && typeof WifiManager.loadWifiList === 'function' && WifiManager) ||
      (NativeModules?.WifiManager && typeof NativeModules.WifiManager.loadWifiList === 'function' && NativeModules.WifiManager) ||
      null;

    if (!wifiModule) {
      scanError = 'NATIVE_MODULE_MISSING';
    } else {
      let rawList = null;

      // Step 1: Read existing/cached scan results first (fast, reliable, not throttled)
      try {
        rawList = await wifiModule.loadWifiList();
      } catch (e) {
        const errMsg = e?.message || '';
        if (errMsg.includes('Location service is turned off') || e?.code === 'locationServicesOff') {
          scanError = 'LOCATION_DISABLED';
        } else if (errMsg.includes('Location permission') || e?.code === 'locationPermissionMissing') {
          scanError = 'PERMISSION_DENIED';
        } else {
          console.warn('loadWifiList error:', errMsg);
        }
      }

      // Step 2: Try active rescan if no permission/location error
      if (!scanError && typeof wifiModule.reScanAndLoadWifiList === 'function') {
        try {
          // Wrap active scan in a 4.5-second timeout to prevent hanging if the OS broadcast is delayed
          const rescanPromise = wifiModule.reScanAndLoadWifiList();
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve('SCAN_TIMEOUT'), 4500)
          );
          const rescanResult = await Promise.race([rescanPromise, timeoutPromise]);

          if (Array.isArray(rescanResult) && rescanResult.length > 0) {
            rawList = rescanResult;
          } else if (typeof rescanResult === 'string' && rescanResult.includes('only allowed to scan')) {
            // Throttled by Android foreground policy: reload from cache if needed
            if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
              try {
                const cached = await wifiModule.loadWifiList();
                if (cached && Array.isArray(cached) && cached.length > 0) rawList = cached;
              } catch (_) {}
            }
          } else if (rescanResult === 'SCAN_TIMEOUT') {
            // Broadcast delayed, reload from cache if needed
            if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
              try {
                const cached = await wifiModule.loadWifiList();
                if (cached && Array.isArray(cached) && cached.length > 0) rawList = cached;
              } catch (_) {}
            }
          }
        } catch (rescanErr) {
          const rescanMsg = rescanErr?.message || '';
          if (rescanMsg.includes('Location service is turned off') || rescanErr?.code === 'locationServicesOff') {
            scanError = 'LOCATION_DISABLED';
          } else if (rescanMsg.includes('Location permission') || rescanErr?.code === 'locationPermissionMissing') {
            scanError = 'PERMISSION_DENIED';
          } else {
            console.warn('reScanAndLoadWifiList exception:', rescanMsg);
          }
        }
      }

      const parsedItems = parseRawWifiList(rawList);
      detectedList.push(...parsedItems);
    }
  }

  const combined = new Map();

  // First prioritize scanned networks
  detectedList.forEach((item) => {
    if (item.ssid) combined.set(item.ssid.toLowerCase(), item);
  });

  // Add currently connected SSID
  if (activeSSID && !combined.has(activeSSID.toLowerCase())) {
    combined.set(activeSSID.toLowerCase(), {
      ssid: activeSSID,
      level: -45,
      frequency: null,
      source: 'current',
    });
  }

  // Add target SSID
  if (targetSSID && !combined.has(targetSSID.toLowerCase())) {
    combined.set(targetSSID.toLowerCase(), {
      ssid: targetSSID,
      level: -55,
      frequency: null,
      source: 'target',
    });
  }

  // Add previously saved networks
  (existingNetworks || []).forEach((item) => {
    if (item?.ssid && !combined.has(item.ssid.toLowerCase())) {
      combined.set(item.ssid.toLowerCase(), item);
    }
  });

  const sorted = Array.from(combined.values()).sort(
    (a, b) => (b.level || -100) - (a.level || -100)
  );

  return {
    networks: sorted,
    scannedCount: detectedList.length,
    error: scanError,
  };
}
