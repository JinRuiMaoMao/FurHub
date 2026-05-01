import type { Gathering } from '@/types/gathering';

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 从 FEC `dateLabel` 中取首个 YYYY-MM-DD（支持 "2026-05-01 — 05-03"） */
export function parseGatheringStartMs(dateLabel: string): number | null {
  const m = dateLabel.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const t = new Date(y, mo, day).getTime();
  return Number.isNaN(t) ? null : t;
}

/** 今日及之后的兽聚，按开始日期升序，供发现页展示 */
export function getUpcomingGatherings(gatherings: Gathering[], limit: number): Gathering[] {
  const todayStart = startOfLocalDay(new Date());
  return [...gatherings]
    .map((g) => ({ g, t: parseGatheringStartMs(g.dateLabel) }))
    .filter((x): x is { g: Gathering; t: number } => x.t !== null && x.t >= todayStart)
    .sort((a, b) => a.t - b.t)
    .slice(0, limit)
    .map((x) => x.g);
}
