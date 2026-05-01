import type { Gathering } from '@/types/gathering';
import type { AppLanguage } from '@/lib/prefsStorage';
import { tr, type I18nKey } from '@/lib/i18n';

const SH_TZ = 'Asia/Shanghai';

function shanghaiYmd(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: SH_TZ });
}

function inclusiveCalendarDays(startYmd: string, endYmd: string): number {
  const [y0, m0, d0] = startYmd.split('-').map(Number);
  const [y1, m1, d1] = endYmd.split('-').map(Number);
  const t0 = Date.UTC(y0, m0 - 1, d0);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  return Math.round((t1 - t0) / 86400000) + 1;
}

function weekdayShort(iso: string, lang: AppLanguage): string {
  const loc =
    lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : 'zh-CN';
  return new Date(iso).toLocaleDateString(loc, { timeZone: SH_TZ, weekday: 'short' });
}

function ymdToSlash(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${y}/${m}/${d}`;
}

/** FEC 头图遮罩内：日期行（含天数与星期），与 FEC 站 Shanghai 日历日一致 */
export function formatGatheringHeroDateLine(
  lang: AppLanguage,
  fecStartAt?: string,
  fecEndAt?: string,
): string | null {
  if (!fecStartAt || !fecEndAt) return null;
  const start = shanghaiYmd(fecStartAt);
  const end = shanghaiYmd(fecEndAt);
  const days = inclusiveCalendarDays(start, end);
  const ws = weekdayShort(fecStartAt, lang);
  const we = weekdayShort(fecEndAt, lang);
  const startSlash = ymdToSlash(start);
  const [y1, m1, d1] = start.split('-');
  const [y2, m2, d2] = end.split('-');
  const endPart =
    y1 === y2 ? `${m2}/${d2}(${we})` : `${ymdToSlash(end)}(${we})`;

  if (lang === 'en') {
    return `${days} days ${startSlash} (${ws}) – ${endPart}`;
  }
  if (lang === 'ja') {
    return `${days}日間 ${startSlash}（${ws}）– ${endPart}`;
  }
  if (lang === 'ko') {
    return `${days}일 ${startSlash}(${ws}) – ${endPart}`;
  }
  return `${days}天 ${startSlash}(${ws}) - ${endPart}`;
}

function fecLocationKey(locationType: string | undefined): I18nKey | null {
  if (locationType === 'hotel') return 'gatheringHeroLocHotel';
  if (locationType === 'venue') return 'gatheringHeroLocVenue';
  return null;
}

function fecEventTypeKey(eventType: string | undefined): I18nKey | null {
  if (eventType === 'all-in-con') return 'gatheringHeroTypeAllInCon';
  if (eventType === 'comic-market') return 'gatheringHeroTypeComicMarket';
  if (eventType === 'fandom-meetup') return 'gatheringHeroTypeFandomMeetup';
  if (eventType === 'travel-con') return 'gatheringHeroTypeTravelCon';
  return null;
}

function fecScaleKey(scale: string | undefined): I18nKey | null {
  if (scale === 'small') return 'gatheringHeroScaleSmall';
  if (scale === 'cosy') return 'gatheringHeroScaleCosy';
  if (scale === 'medium') return 'gatheringHeroScaleMedium';
  if (scale === 'large') return 'gatheringHeroScaleLarge';
  if (scale === 'xlarge') return 'gatheringHeroScaleXlarge';
  return null;
}

export type GatheringHeroOverlay = {
  hostedBy: string | null;
  dateLine: string | null;
  venueKindAndType: string | null;
  scaleLine: string | null;
};

export function buildGatheringHeroOverlay(lang: AppLanguage, g: Gathering): GatheringHeroOverlay {
  const hostedBy = g.organizerName?.trim()
    ? tr(lang, 'gatheringHostedBy').replace('{name}', g.organizerName.trim())
    : null;

  const dateLine = formatGatheringHeroDateLine(lang, g.fecStartAt, g.fecEndAt);

  const locKey = fecLocationKey(g.fecLocationType);
  const typeKey = fecEventTypeKey(g.fecEventType);
  let venueKindAndType: string | null = null;
  if (locKey && typeKey) {
    venueKindAndType = `${tr(lang, locKey)} ${tr(lang, typeKey)}`;
  } else if (locKey) {
    venueKindAndType = tr(lang, locKey);
  } else if (typeKey) {
    venueKindAndType = tr(lang, typeKey);
  }

  const sk = fecScaleKey(g.fecScale);
  const scaleLine = sk ? tr(lang, sk) : null;

  return { hostedBy, dateLine, venueKindAndType, scaleLine };
}
