import AsyncStorage from '@react-native-async-storage/async-storage';

const MAY_KNOW_PICK_HISTORY_KEY = 'furhub.discoverMayKnowRecentPickEmails';
const MAY_KNOW_LAST_SHOWN_KEY = 'furhub.discoverMayKnowLastShownEmails';
const MAX_HISTORY_SETS = 5;

/** 最近若干次下拉刷新的「可能认识」邮箱列表，新→旧；每组为一次刷新结果 */
export async function getMayKnowPickHistory(): Promise<string[][]> {
  try {
    const raw = await AsyncStorage.getItem(MAY_KNOW_PICK_HISTORY_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is unknown[] => Array.isArray(x))
      .map((x) =>
        x.filter((e): e is string => typeof e === 'string').map((e) => e.toLowerCase().trim()),
      )
      .filter((row) => row.length > 0);
  } catch {
    return [];
  }
}

/** 记录一次刷新结果；只保留最近 {@link MAX_HISTORY_SETS} 次 */
export async function appendMayKnowPickHistory(emails: string[]): Promise<void> {
  const row = emails.map((e) => e.toLowerCase().trim()).filter(Boolean);
  if (row.length === 0) return;
  try {
    const prev = await getMayKnowPickHistory();
    const next = [row, ...prev].slice(0, MAX_HISTORY_SETS);
    await AsyncStorage.setItem(MAY_KNOW_PICK_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** 覆盖写入历史（用于丢弃最旧批次后仍可推荐） */
export async function setMayKnowPickHistory(sets: string[][]): Promise<void> {
  try {
    const cleaned = sets
      .filter((row) => Array.isArray(row) && row.length > 0)
      .map((row) => row.map((e) => String(e).toLowerCase().trim()).filter(Boolean))
      .slice(0, MAX_HISTORY_SETS);
    await AsyncStorage.setItem(MAY_KNOW_PICK_HISTORY_KEY, JSON.stringify(cleaned));
  } catch {
    /* ignore */
  }
}

export async function clearMayKnowPickHistory(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([MAY_KNOW_PICK_HISTORY_KEY, MAY_KNOW_LAST_SHOWN_KEY]);
  } catch {
    /* ignore */
  }
}

/** 上一次在发现页实际展示过的邮箱（含仅切 tab、未下拉刷新的那一批），避免重复出现同一批人 */
export async function getMayKnowLastShown(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(MAY_KNOW_LAST_SHOWN_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((e): e is string => typeof e === 'string').map((e) => e.toLowerCase().trim());
  } catch {
    return [];
  }
}

export async function setMayKnowLastShown(emails: string[]): Promise<void> {
  const row = emails.map((e) => e.toLowerCase().trim()).filter(Boolean);
  try {
    await AsyncStorage.setItem(MAY_KNOW_LAST_SHOWN_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
}
