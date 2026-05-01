import { getEmailRelaySecret, getEmailRelayUrl } from '@/lib/prefsStorage';

export type SendRegisterEmailResult =
  | { status: 'sent' }
  | { status: 'demo' }
  | { status: 'error'; message: string };

/**
 * 调用你自建的发信中继（HTTPS POST），将验证码发到用户邮箱。
 *
 * 请求：`POST <relayUrl>`
 * Header：`Content-Type: application/json`；若配置了密钥则带 `Authorization: Bearer <secret>`
 * Body JSON：
 *   `{ "to": string, "subject": string, "text": string, "meta"?: { "code": string, "kind": "register" } }`
 *
 * 成功：HTTP 2xx → `sent`。
 * 未配置 relayUrl（且环境变量也无）→ `demo`（由客户端弹窗展示验证码）。
 */
export async function relaySendRegisterCode(params: {
  to: string;
  code: string;
}): Promise<SendRegisterEmailResult> {
  const url = await getEmailRelayUrl();
  const secret = await getEmailRelaySecret();
  if (!url) {
    return { status: 'demo' };
  }
  const subject = 'FurHub 注册验证码';
  const text = `你的注册验证码是：${params.code}\n10 分钟内有效。如非本人操作请忽略。`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret.trim() ? { Authorization: `Bearer ${secret.trim()}` } : {}),
      },
      body: JSON.stringify({
        to: params.to,
        subject,
        text,
        meta: { code: params.code, kind: 'register' as const },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return {
        status: 'error',
        message: `发信接口返回 ${res.status}${body ? `：${body.slice(0, 200)}` : ''}`,
      };
    }
    return { status: 'sent' };
  } catch (e) {
    return {
      status: 'error',
      message: e instanceof Error ? e.message : '网络错误',
    };
  }
}
