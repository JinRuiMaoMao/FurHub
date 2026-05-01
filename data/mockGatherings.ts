import { FEC_GATHERINGS } from '@/data/fecGatherings.generated';
import type { Gathering } from '@/types/gathering';

export type { Gathering } from '@/types/gathering';

/**
 * FEC 首页列出的展会；坐标与地址来自各详情页（或城市级兜底），见 `fecGatherings.generated.ts` 顶注释。
 * 重新抓取：`node scripts/fetch-fec-gatherings.mjs`
 */
export const MOCK_GATHERINGS: Gathering[] = [...FEC_GATHERINGS];

export function getGatheringById(id: string): Gathering | undefined {
  return MOCK_GATHERINGS.find((g) => g.id === id);
}
