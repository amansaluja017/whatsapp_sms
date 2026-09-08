import { Linking } from 'react-native';

export function getCleanUrl(url) {
  return (url || '').trim().replace(/\/+$/, '');
}

export function openBrowserQR(botUrl) {
  const clean = getCleanUrl(botUrl);
  if (!clean) return Promise.reject(new Error('Bot URL is empty'));
  return Linking.openURL(`${clean}/qr`);
}

export async function fetchBotStatus(botUrl, timeoutMs = 5000) {
  const clean = getCleanUrl(botUrl);
  if (!clean) throw new Error('Missing Bot Server URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${clean}/status`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError';
    throw new Error(isTimeout ? 'Connection timed out after 5s' : err?.message || 'Error');
  }
}

export async function fetchWhatsAppChatsApi(botUrl, timeoutMs = 12000) {
  const clean = getCleanUrl(botUrl);
  if (!clean) throw new Error('Missing Bot Server URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${clean}/chats`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError';
    throw new Error(isTimeout ? 'Request timed out after 12s' : err?.message || 'Error');
  }
}

export async function sendWhatsAppMessageApi(botUrl, recipient, message, timeoutMs = 15000) {
  const clean = getCleanUrl(botUrl);
  if (!clean) throw new Error('Missing Bot Server URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${clean}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: recipient?.id,
        phone: recipient?.phone,
        message,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const rawText = await res.text();
    let resJson = null;
    try {
      resJson = JSON.parse(rawText);
    } catch (e) {}

    return {
      ok: res.ok,
      status: res.status,
      data: resJson,
      raw: rawText,
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError';
    throw new Error(isTimeout ? 'Delivery timed out after 15s' : err?.message || 'Error');
  }
}
