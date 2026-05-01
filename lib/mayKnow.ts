import type { LocalAccountRecord } from '@/lib/profileStorage';

import { MAY_KNOW_POOL, type MayKnowPerson } from '@/data/mockMayKnow';

/** B 站「可能认识」：粉丝须 **大于** 该数（即 ≥1001，对应「粉丝大于1000」） */
export const BILIBILI_MAY_KNOW_MIN_FANS_EXCLUSIVE = 1000;

export function getMayKnowAvatarUrl(p: MayKnowPerson): string {
  return p.avatar;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isEligibleMayKnowEntry(p: MayKnowPerson): boolean {
  if (p.bilibiliHasFurryTaggedVideo !== true) return false;
  return (p.bilibiliFans ?? 0) > BILIBILI_MAY_KNOW_MIN_FANS_EXCLUSIVE;
}

/**
 * 从池中取至多 `limit` 人（排除当前登录邮箱、资格不符、以及 `excludeEmails` 中的邮箱）。
 */
export function pickMayKnowSuggestions(
  sessionEmail: string | null | undefined,
  rotation: number,
  limit = 5,
  excludeEmails: ReadonlySet<string> = new Set(),
): MayKnowPerson[] {
  const self = sessionEmail?.toLowerCase().trim() ?? '';
  const exclude = new Set(excludeEmails);
  const pool = MAY_KNOW_POOL.filter((p) => p.email.toLowerCase() !== self)
    .filter(isEligibleMayKnowEntry)
    .filter((p) => !exclude.has(p.email.toLowerCase()));
  // 排除集不同则打乱序列不同，避免切回发现页在相同 rotation 下反复同一顺序
  const seed = (hashString(self) + rotation * 1000003 + exclude.size * 0x9e37_79b9) >>> 0;
  const rng = mulberry32(seed);
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }
  const seen = new Set<string>();
  const out: MayKnowPerson[] = [];
  for (const i of idx) {
    const p = pool[i];
    const k = p.email.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 不推荐「最近若干次下拉刷新」里已出现过的用户：`recentPickEmailSets` 新→旧，最多 5 组并集排除；
 * `lastShownEmails` 为上一屏实际展示过的邮箱（与刷新历史叠加），避免切 tab 重复同一批。
 */
export function pickMayKnowSuggestionsExcluding(
  sessionEmail: string | null | undefined,
  rotation: number,
  limit: number,
  recentPickEmailSets: string[][],
  lastShownEmails: readonly string[] = [],
): MayKnowPerson[] {
  const exclude = new Set<string>();
  for (const row of recentPickEmailSets.slice(0, 5)) {
    for (const e of row ?? []) {
      const x = typeof e === 'string' ? e.toLowerCase().trim() : '';
      if (x) exclude.add(x);
    }
  }
  for (const e of lastShownEmails) {
    const x = typeof e === 'string' ? e.toLowerCase().trim() : '';
    if (x) exclude.add(x);
  }
  return pickMayKnowSuggestions(sessionEmail, rotation, limit, exclude);
}

export function getMayKnowStubByEmail(emailInput: string): LocalAccountRecord | null {
  const email = emailInput.toLowerCase().trim();
  const p = MAY_KNOW_POOL.find((x) => x.email.toLowerCase() === email);
  if (!p) return null;
  return {
    email: p.email,
    name: p.name,
    passwordHash: '',
    avatar: getMayKnowAvatarUrl(p),
    isVip: false,
    furCoin: 0,
    bilibili: p.bilibili,
  };
}
