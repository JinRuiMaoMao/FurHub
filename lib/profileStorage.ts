import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { getMayKnowStubByEmail } from '@/lib/mayKnow';
import { relaySendRegisterCode } from '@/lib/relayEmail';

const ACCOUNTS_KEY = 'furhub.localAccounts';
const SESSION_EMAIL_KEY = 'furhub.sessionEmail';
const DISCOVER_MAY_KNOW_ROT_KEY = 'furhub.discoverMayKnowRotation';
const LEGACY_DISPLAY_NAME_KEY = 'furhub.displayName';
const LEGACY_HAS_LOCAL_ACCOUNT_KEY = 'furhub.hasLocalAccount';

const REG_OTP_KEY = (email: string) => `furhub.registerOtp.${email.toLowerCase().trim()}`;
const REG_OTP_SENT_AT_KEY = (email: string) =>
  `furhub.registerOtpSentAt.${email.toLowerCase().trim()}`;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const VIP_TESTER_NAME = 'JinRui_MaoMao';
const TEST_ACCOUNT_NAME = '1';
const TEST_ACCOUNT_EMAIL = 'test-1@furhub.local';
const TEST_ACCOUNT_PASSWORD = '111111';
const TEST_ACCOUNT_BILIBILI = 'https://space.bilibili.com/1095955088?spm_id_from=333.1007.0.0';
const TEST_ACCOUNT_QQ = '3934295769';

type OtpPayload = {
  code: string;
  expiresAt: number;
};

/** 6 位随机字母数字（易混淆字符已排除） */
function randomRegisterCode6(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export type LocalAccountRecord = {
  email: string;
  name: string;
  passwordHash: string;
  avatar: string;
  isVip?: boolean;
  furCoin?: number;
  /** 资料展示用兴趣标签（可选，本地账号扩展用） */
  interestTags?: string[];
  /** 个性签名等（本地账号扩展；「可能认识」演示 B 站 stub 一般不使用） */
  personalSignature?: string;
  qq?: string;
  wechat?: string;
  bilibili?: string;
  lastQqChangeAt?: number;
  lastWechatChangeAt?: number;
  lastBilibiliChangeAt?: number;
  lastNameChangeAt?: number;
  lastEmailChangeAt?: number;
  lastAvatarChangeAt?: number;
};

export type SearchUserRecord = {
  email: string;
  name: string;
  isVip: boolean;
  avatar: string;
};

export type AccountContactKey = 'qq' | 'wechat' | 'bilibili';

const PEPPER = 'furhub-local-account-v1';

export async function hashPassword(email: string, password: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const payload = `${PEPPER}|${normalized}|${password}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

async function migrateLegacyStorage(): Promise<void> {
  try {
    const hasAccounts = (await AsyncStorage.getItem(ACCOUNTS_KEY)) != null;
    if (hasAccounts) {
      await AsyncStorage.multiRemove([
        LEGACY_DISPLAY_NAME_KEY,
        LEGACY_HAS_LOCAL_ACCOUNT_KEY,
      ]);
      return;
    }
    await AsyncStorage.multiRemove([
      LEGACY_DISPLAY_NAME_KEY,
      LEGACY_HAS_LOCAL_ACCOUNT_KEY,
    ]);
  } catch {
    /* ignore */
  }
}

async function readAccounts(): Promise<LocalAccountRecord[]> {
  await migrateLegacyStorage();
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LocalAccountRecord =>
        x != null &&
        typeof x === 'object' &&
        typeof (x as LocalAccountRecord).email === 'string' &&
        typeof (x as LocalAccountRecord).name === 'string' &&
        typeof (x as LocalAccountRecord).passwordHash === 'string',
    );
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: LocalAccountRecord[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function isVipAccount(account: LocalAccountRecord): boolean {
  return account.isVip === true || account.name.trim() === VIP_TESTER_NAME;
}

export async function getSessionEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_EMAIL_KEY);
  } catch {
    return null;
  }
}

/** 登录成功后调用：发现页「可能认识」换一批 */
export async function bumpDiscoverMayKnowRotation(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DISCOVER_MAY_KNOW_ROT_KEY);
    const v = parseInt(raw ?? '0', 10);
    const next = Number.isFinite(v) ? v + 1 : 1;
    await AsyncStorage.setItem(DISCOVER_MAY_KNOW_ROT_KEY, String(next));
  } catch {
    /* ignore */
  }
}

export async function getDiscoverMayKnowRotation(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(DISCOVER_MAY_KNOW_ROT_KEY);
    const v = parseInt(raw ?? '0', 10);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

async function setSessionEmail(email: string | null): Promise<void> {
  if (!email) {
    await AsyncStorage.removeItem(SESSION_EMAIL_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_EMAIL_KEY, email.toLowerCase().trim());
}

export async function getActiveAccount(): Promise<LocalAccountRecord | null> {
  const email = await getSessionEmail();
  if (!email) return null;
  const accounts = await readAccounts();
  return accounts.find((a) => a.email === email) ?? null;
}

export async function getAccountByEmail(emailInput: string): Promise<LocalAccountRecord | null> {
  const email = emailInput.toLowerCase().trim();
  if (!email) return null;
  const accounts = await readAccounts();
  const fromDb = accounts.find((a) => a.email === email);
  if (fromDb) return fromDb;
  return getMayKnowStubByEmail(email);
}

/** 注册时发送邮箱验证码：已配置发信中继则走真实发信，否则弹窗演示验证码。 */
export async function sendRegisterVerificationCode(
  email: string,
): Promise<{ ok: true; demoCode?: string } | { ok: false; error: string }> {
  const normalized = email.toLowerCase().trim();
  if (!looksLikeEmail(normalized)) {
    return { ok: false, error: '邮箱格式不正确。' };
  }
  const accounts = await readAccounts();
  if (accounts.some((a) => a.email === normalized)) {
    return { ok: false, error: '该邮箱已注册，请返回登录。' };
  }
  const sentRaw = await AsyncStorage.getItem(REG_OTP_SENT_AT_KEY(normalized));
  if (sentRaw) {
    const sentAt = parseInt(sentRaw, 10);
    if (!Number.isNaN(sentAt)) {
      const elapsed = Date.now() - sentAt;
      if (elapsed >= 0 && elapsed < OTP_RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return { ok: false, error: `请 ${wait} 秒后再获取验证码。` };
      }
    }
  }
  const code = randomRegisterCode6();
  const payload: OtpPayload = {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
  };
  await AsyncStorage.setItem(REG_OTP_KEY(normalized), JSON.stringify(payload));
  await AsyncStorage.setItem(REG_OTP_SENT_AT_KEY(normalized), String(Date.now()));

  const mail = await relaySendRegisterCode({ to: normalized, code });
  if (mail.status === 'demo') {
    return { ok: true, demoCode: code };
  }
  if (mail.status === 'error') {
    await AsyncStorage.removeItem(REG_OTP_KEY(normalized));
    await AsyncStorage.removeItem(REG_OTP_SENT_AT_KEY(normalized));
    return { ok: false, error: mail.message };
  }
  return { ok: true };
}

export async function registerLocalAccount(input: {
  email: string;
  password: string;
  name: string;
  verificationCode: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const entered = input.verificationCode.trim();
  if (!email || !name) return { ok: false, error: '请填写邮箱与名称。' };
  if (email.endsWith('@furhub.demo')) {
    return { ok: false, error: '该邮箱为演示保留，请换一个。' };
  }
  if (input.password.length < 6) return { ok: false, error: '密码至少 6 位。' };
  if (!/^[A-Za-z0-9]{6}$/.test(entered)) {
    return { ok: false, error: '请输入 6 位验证码（字母与数字）。' };
  }
  const raw = await AsyncStorage.getItem(REG_OTP_KEY(email));
  if (!raw) {
    return { ok: false, error: '请先获取验证码，或验证码已过期。' };
  }
  let parsed: OtpPayload;
  try {
    parsed = JSON.parse(raw) as OtpPayload;
  } catch {
    return { ok: false, error: '验证码无效。' };
  }
  if (typeof parsed.code !== 'string' || typeof parsed.expiresAt !== 'number') {
    return { ok: false, error: '验证码无效。' };
  }
  if (Date.now() > parsed.expiresAt) {
    await AsyncStorage.removeItem(REG_OTP_KEY(email));
    return { ok: false, error: '验证码已过期，请重新获取。' };
  }
  if (parsed.code !== entered) {
    return { ok: false, error: '验证码不正确。' };
  }

  const accounts = await readAccounts();
  if (accounts.some((a) => a.email === email)) {
    return { ok: false, error: '该邮箱已注册。' };
  }
  const normalizedName = normalizeName(name);
  if (accounts.some((a) => normalizeName(a.name) === normalizedName)) {
    return { ok: false, error: '该名称已被使用，请换一个。' };
  }
  const passwordHash = await hashPassword(email, input.password);
  await writeAccounts([
    ...accounts,
    {
      email,
      name,
      passwordHash,
      avatar: '',
      isVip: name.trim() === VIP_TESTER_NAME,
      furCoin: 0,
    },
  ]);
  await AsyncStorage.removeItem(REG_OTP_KEY(email));
  return { ok: true };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !password) return { ok: false, error: '请填写邮箱与密码。' };
  const accounts = await readAccounts();
  const acc = accounts.find((a) => a.email === normalized);
  if (!acc) return { ok: false, error: '邮箱或密码不正确。' };
  const h = await hashPassword(normalized, password);
  if (h !== acc.passwordHash) return { ok: false, error: '邮箱或密码不正确。' };
  await setSessionEmail(normalized);
  await bumpDiscoverMayKnowRotation();
  return { ok: true };
}

export async function loginWithName(
  name: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedName = name.trim();
  if (!trimmedName || !password) return { ok: false, error: '请填写名称与密码。' };
  const accounts = await readAccounts();
  const normalizedName = normalizeName(trimmedName);
  const matches = accounts.filter((a) => normalizeName(a.name) === normalizedName);
  if (matches.length === 0) return { ok: false, error: '名称或密码不正确。' };
  if (matches.length > 1) return { ok: false, error: '存在重名账号，请使用邮箱登录。' };
  const acc = matches[0];
  const h = await hashPassword(acc.email, password);
  if (h !== acc.passwordHash) return { ok: false, error: '名称或密码不正确。' };
  await setSessionEmail(acc.email);
  await bumpDiscoverMayKnowRotation();
  return { ok: true };
}

export async function logoutLocalSession(): Promise<void> {
  await setSessionEmail(null);
}

export async function updateActiveAccountDisplayName(
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: '名称不能为空。' };
  const email = await getSessionEmail();
  if (!email) return { ok: false, error: '未登录。' };
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx === -1) return { ok: false, error: '账号不存在。' };
  if (normalizeName(accounts[idx].name) === normalizeName(trimmed)) {
    return { ok: false, error: '新名称不能与当前名称相同。' };
  }
  const now = Date.now();
  const lastNameChangeAt = accounts[idx].lastNameChangeAt;
  if (!isVipAccount(accounts[idx]) && lastNameChangeAt != null && inSameMonth(lastNameChangeAt, now)) {
    return { ok: false, error: '昵称本月已修改过一次，继续修改需付费。' };
  }
  const normalizedName = normalizeName(trimmed);
  const dup = accounts.some((a, i) => i !== idx && normalizeName(a.name) === normalizedName);
  if (dup) return { ok: false, error: '该名称已被使用。' };
  const next = accounts.map((a, i) =>
    i === idx ? { ...a, name: trimmed, isVip: isVipAccount(a), lastNameChangeAt: now } : a,
  );
  await writeAccounts(next);
  return { ok: true };
}

function inSameMonth(timestamp: number, now: number): boolean {
  const d1 = new Date(timestamp);
  const d2 = new Date(now);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export async function updateActiveAccountEmail(
  nextEmailInput: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const nextEmail = nextEmailInput.toLowerCase().trim();
  if (!looksLikeEmail(nextEmail)) return { ok: false, error: '邮箱格式不正确。' };
  const currentEmail = await getSessionEmail();
  if (!currentEmail) return { ok: false, error: '未登录。' };
  if (currentEmail === nextEmail) return { ok: false, error: '新邮箱不能与当前邮箱相同。' };
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.email === currentEmail);
  if (idx === -1) return { ok: false, error: '账号不存在。' };
  if (accounts.some((a) => a.email === nextEmail)) {
    return { ok: false, error: '该邮箱已被注册。' };
  }
  const now = Date.now();
  const lastEmailChangeAt = accounts[idx].lastEmailChangeAt;
  if (!isVipAccount(accounts[idx]) && lastEmailChangeAt != null && inSameMonth(lastEmailChangeAt, now)) {
    return { ok: false, error: '邮箱本月已修改过一次，继续修改需付费。' };
  }
  const next = accounts.map((a, i) =>
    i === idx ? { ...a, email: nextEmail, isVip: isVipAccount(a), lastEmailChangeAt: now } : a,
  );
  await writeAccounts(next);
  await setSessionEmail(nextEmail);
  return { ok: true };
}

export async function updateActiveAccountAvatar(
  avatarInput: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const avatar = avatarInput.trim();
  if (!avatar) return { ok: false, error: '头像不能为空。' };
  const email = await getSessionEmail();
  if (!email) return { ok: false, error: '未登录。' };
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx === -1) return { ok: false, error: '账号不存在。' };
  const now = Date.now();
  const lastAvatarChangeAt = accounts[idx].lastAvatarChangeAt;
  if (!isVipAccount(accounts[idx]) && lastAvatarChangeAt != null && inSameMonth(lastAvatarChangeAt, now)) {
    return { ok: false, error: '头像本月已修改过一次，继续修改需付费。' };
  }
  const nextAvatar = isAvatarUri(avatar) ? avatar : avatar.slice(0, 2);
  const next = accounts.map((a, i) =>
    i === idx ? { ...a, avatar: nextAvatar, isVip: isVipAccount(a), lastAvatarChangeAt: now } : a,
  );
  await writeAccounts(next);
  return { ok: true };
}

function isAvatarUri(value: string): boolean {
  return (
    value.startsWith('file://') ||
    value.startsWith('content://') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}

export async function purchaseVipMembership(): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = await getSessionEmail();
  if (!email) return { ok: false, error: '请先登录后再购买。' };
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx === -1) return { ok: false, error: '账号不存在。' };
  const next = accounts.map((a, i) =>
    i === idx ? { ...a, isVip: true } : a,
  );
  await writeAccounts(next);
  return { ok: true };
}

export async function purchaseFurCoin(
  amount: number,
): Promise<{ ok: true; balance: number } | { ok: false; error: string }> {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: '充值数量无效。' };
  const email = await getSessionEmail();
  if (!email) return { ok: false, error: '请先登录后再购买。' };
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx === -1) return { ok: false, error: '账号不存在。' };
  const current = accounts[idx].furCoin ?? 0;
  const balance = current + Math.floor(amount);
  const next = accounts.map((a, i) =>
    i === idx ? { ...a, furCoin: balance } : a,
  );
  await writeAccounts(next);
  return { ok: true, balance };
}

export async function updateActiveAccountContact(
  key: AccountContactKey,
  valueInput: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const value = valueInput.trim();
  const email = await getSessionEmail();
  if (!email) return { ok: false, error: '未登录。' };
  const accounts = await readAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx === -1) return { ok: false, error: '账号不存在。' };
  const now = Date.now();
  const lastChangeKeyByContact: Record<AccountContactKey, keyof LocalAccountRecord> = {
    qq: 'lastQqChangeAt',
    wechat: 'lastWechatChangeAt',
    bilibili: 'lastBilibiliChangeAt',
  };
  const lastChangeKey = lastChangeKeyByContact[key];
  const lastChangeAt = accounts[idx][lastChangeKey];
  if (!isVipAccount(accounts[idx]) && typeof lastChangeAt === 'number' && inSameMonth(lastChangeAt, now)) {
    return { ok: false, error: '该联系方式本月已修改过一次，继续修改需付费。' };
  }

  const next = accounts.map((a, i) =>
    i === idx
      ? {
          ...a,
          [key]: value,
          [lastChangeKey]: now,
        }
      : a,
  );
  await writeAccounts(next);
  return { ok: true };
}

export async function ensureTestAccount(): Promise<void> {
  const accounts = await readAccounts();
  const idx = accounts.findIndex(
    (a) => a.email === TEST_ACCOUNT_EMAIL || normalizeName(a.name) === normalizeName(TEST_ACCOUNT_NAME),
  );
  if (idx !== -1) {
    if (accounts[idx].bilibili === TEST_ACCOUNT_BILIBILI && accounts[idx].qq === TEST_ACCOUNT_QQ) return;
    const next = accounts.map((a, i) =>
      i === idx
        ? {
            ...a,
            bilibili: TEST_ACCOUNT_BILIBILI,
            qq: TEST_ACCOUNT_QQ,
          }
        : a,
    );
    await writeAccounts(next);
    return;
  }

  const passwordHash = await hashPassword(TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD);
  await writeAccounts([
    ...accounts,
    {
      email: TEST_ACCOUNT_EMAIL,
      name: TEST_ACCOUNT_NAME,
      passwordHash,
      avatar: '',
      furCoin: 0,
      bilibili: TEST_ACCOUNT_BILIBILI,
      qq: TEST_ACCOUNT_QQ,
    },
  ]);
}

export async function searchLocalUsersByName(
  keyword: string,
  options?: { includeCurrentUser?: boolean },
): Promise<SearchUserRecord[]> {
  const q = normalizeName(keyword);
  if (!q) return [];
  const currentEmail = await getSessionEmail();
  const includeCurrentUser = options?.includeCurrentUser === true;
  const accounts = await readAccounts();
  return accounts
    .filter((a) => includeCurrentUser || a.email !== currentEmail)
    .filter((a) => normalizeName(a.name).includes(q))
    .slice(0, 30)
    .map((a) => ({
      email: a.email,
      name: a.name,
      isVip: isVipAccount(a),
      avatar: a.avatar,
    }));
}
