/**
 * 用户资料、个性签名与 B 站稿件标签共用的「福瑞向」关键词（子串匹配）。
 * QQ「可能认识」：可检测个性签名（或其它一段文案）是否命中以下任一词；B 站演示池维护说明可引用同一列表。
 */
export const FURRY_INTEREST_TAG_SUBSTRINGS = [
  'furry',
  'fursuit',
  '福瑞',
  '兽装',
  '獸裝',
  '兽人',
  '獸人',
  '萌宠',
  '毛毛',
  '兽圈',
  '兽设',
  '幻想生物',
  'kemono',
] as const;

const ASCII_KEYWORD = /^[a-z0-9_-]+$/i;

function tagMatchesKeyword(tagTrimmed: string, keyword: string): boolean {
  const t = tagTrimmed;
  const lower = t.toLowerCase();
  if (ASCII_KEYWORD.test(keyword)) {
    return lower.includes(keyword.toLowerCase());
  }
  return t.includes(keyword);
}

/** 用户填写的标签列表中是否至少有一项命中福瑞向关键词（大小写不敏感仅作用于纯英文关键词） */
export function tagListMatchesFurryInterest(tags: string[] | undefined | null): boolean {
  if (!tags?.length) return false;
  for (const raw of tags) {
    const t = raw.trim();
    if (!t) continue;
    for (const kw of FURRY_INTEREST_TAG_SUBSTRINGS) {
      if (tagMatchesKeyword(t, kw)) return true;
    }
  }
  return false;
}

/** 个性签名、简介等整段文字中是否包含福瑞向关键词（与 {@link tagListMatchesFurryInterest} 同一词表） */
export function textContainsFurryInterest(text: string | undefined | null): boolean {
  const t = text?.trim();
  if (!t) return false;
  for (const kw of FURRY_INTEREST_TAG_SUBSTRINGS) {
    if (tagMatchesKeyword(t, kw)) return true;
  }
  return false;
}
