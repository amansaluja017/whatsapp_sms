export const DEFAULT_TARGET_SSID = process.env.EXPO_PUBLIC_DEFAULT_TARGET_SSID || '';
export const TARGET_MESSAGE = process.env.EXPO_PUBLIC_TARGET_MESSAGE || '';

export const LAST_TRIGGER_DATE_KEY = '@whatsapp_sms:last_trigger_date';
export const LAST_TRIGGER_TIME_KEY = '@whatsapp_sms:last_trigger_time';
export const LAST_TRIGGER_SSID_KEY = '@whatsapp_sms:last_trigger_ssid';
export const LAST_TRIGGER_DETAILS_KEY = '@whatsapp_sms:last_trigger_details';
export const BACKGROUND_MONITORING_KEY = '@whatsapp_sms:background_monitoring_enabled';
export const BOT_SERVER_URL_KEY = '@whatsapp_sms:bot_server_url';
export const TARGET_SSID_KEY = '@whatsapp_sms:target_ssid';
export const SAVED_NETWORKS_KEY = '@whatsapp_sms:saved_networks';
export const TARGET_RECIPIENT_KEY = '@whatsapp_sms:target_recipient';
export const CACHED_CHATS_KEY = '@whatsapp_sms:cached_chats';

export const MESSAGE_TEMPLATE_KEY = '@whatsapp_sms:message_template';

export const DEFAULT_BOT_URL = process.env.EXPO_PUBLIC_BOT_URL || 'http://localhost:3001';
export const DEFAULT_MESSAGE_TEMPLATE = process.env.EXPO_PUBLIC_DEFAULT_MESSAGE_TEMPLATE || '';

export const TEST_PREBUILD_MESSAGES = [
  {
    id: 'test_arrival',
    label: 'Arrival Ping',
    template: 'In at ${time} (${wifi}) ✅',
  },
  {
    id: 'test_greeting',
    label: 'Greeting',
    template: 'Hello ${name}! Connected to Wi-Fi at ${time}.',
  },
  {
    id: 'test_simple',
    label: 'Simple Ping',
    template: 'Test arrival ping: connected to ${wifi}',
  },
];

export const DEFAULT_RECIPIENT = null;

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const resolveMessageTemplate = (template, { name = '', wifi = '' } = {}) => {
  if (!template) return '';
  const now = new Date();

  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const timeFormatted = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = dayNames[now.getDay()];
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const yearFormatted = String(now.getFullYear());

  return template
    .replace(/\$\{(name|recipient)\}/gi, name || 'there')
    .replace(/\{(name|recipient)\}/gi, name || 'there')
    .replace(/\$\{time\}/gi, timeFormatted)
    .replace(/\{time\}/gi, timeFormatted)
    .replace(/\$\{date\}/gi, dateFormatted)
    .replace(/\{date\}/gi, dateFormatted)
    .replace(/\$\{day\}/gi, dayName)
    .replace(/\{day\}/gi, dayName)
    .replace(/\$\{year\}/gi, yearFormatted)
    .replace(/\{year\}/gi, yearFormatted)
    .replace(/\$\{(wifi|ssid)\}/gi, wifi || '')
    .replace(/\{(wifi|ssid)\}/gi, wifi || '');
};
