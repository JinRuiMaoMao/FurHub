import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_THEME = 'furhub.pref.theme';
const KEY_LANG = 'furhub.pref.lang';
const KEY_RELAY_URL = 'furhub.pref.emailRelayUrl';
const KEY_RELAY_SECRET = 'furhub.pref.emailRelaySecret';

export type ThemePreference = 'system' | 'light' | 'dark';
export type AppLanguage = 'zh' | 'en' | 'zht' | 'ja' | 'ko';

/** 设置页可选语言顺序；新语言 UI 文案在 `lib/i18n` 中回退到 zh/en */
export const APP_LANGUAGE_OPTIONS: AppLanguage[] = ['zh', 'zht', 'en', 'ja', 'ko'];

export type AppPrefs = {
  theme: ThemePreference;
  language: AppLanguage;
  emailRelayUrl: string;
  emailRelaySecret: string;
};

const DEFAULTS: AppPrefs = {
  theme: 'system',
  language: 'zh',
  emailRelayUrl: '',
  emailRelaySecret: '',
};

function parseTheme(v: string | null): ThemePreference {
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

function parseLang(v: string | null): AppLanguage {
  if (v === 'zh' || v === 'en' || v === 'zht' || v === 'ja' || v === 'ko') return v;
  return 'zh';
}

export async function loadAppPrefs(): Promise<AppPrefs> {
  try {
    const [theme, language, emailRelayUrl, emailRelaySecret] = await AsyncStorage.multiGet([
      KEY_THEME,
      KEY_LANG,
      KEY_RELAY_URL,
      KEY_RELAY_SECRET,
    ]);
    return {
      theme: parseTheme(theme[1]),
      language: parseLang(language[1]),
      emailRelayUrl: emailRelayUrl[1]?.trim() ?? '',
      emailRelaySecret: emailRelaySecret[1] ?? '',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveThemePreference(value: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(KEY_THEME, value);
}

export async function saveLanguage(value: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(KEY_LANG, value);
}

export async function saveEmailRelay(url: string, secret: string): Promise<void> {
  const u = url.trim();
  if (u) await AsyncStorage.setItem(KEY_RELAY_URL, u);
  else await AsyncStorage.removeItem(KEY_RELAY_URL);
  const s = secret.trim();
  if (s) await AsyncStorage.setItem(KEY_RELAY_SECRET, s);
  else await AsyncStorage.removeItem(KEY_RELAY_SECRET);
}

export async function getEmailRelayUrl(): Promise<string> {
  try {
    const v = (await AsyncStorage.getItem(KEY_RELAY_URL))?.trim() ?? '';
    if (v) return v;
  } catch {
    /* ignore */
  }
  const env =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_EMAIL_RELAY_URL
      ? String(process.env.EXPO_PUBLIC_EMAIL_RELAY_URL).trim()
      : '';
  return env;
}

export async function getEmailRelaySecret(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(KEY_RELAY_SECRET);
    if (v) return v;
  } catch {
    /* ignore */
  }
  const env =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_EMAIL_RELAY_SECRET
      ? String(process.env.EXPO_PUBLIC_EMAIL_RELAY_SECRET)
      : '';
  return env ?? '';
}
