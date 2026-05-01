/**
 * Fetches https://www.furrycons.cn/ event list + each detail page for lat/lon,
 * cover (`thumbnail`) and `media.images` absolute URLs on images.furrycons.cn.
 * Run: node scripts/fetch-fec-gatherings.mjs
 * Writes UTF-8:
 *   - data/fec-gatherings.cache.json
 *   - data/fecGatherings.generated.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.furrycons.cn';
const FEC_IMAGES_ORIGIN = 'https://images.furrycons.cn';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function fecImageAbs(pathOrUrl) {
  const s = String(pathOrUrl ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `${FEC_IMAGES_ORIGIN}/${s.replace(/^\//, '')}`;
}

function extractNextData(html) {
  const re = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;
  const m = html.match(re);
  if (!m) throw new Error('__NEXT_DATA__ not found');
  return JSON.parse(m[1]);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'FurHub-data-sync/1.0 (+https://github.com/)' },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function eventPageUrl(orgSlug, eventSlug) {
  return `${ORIGIN}/${orgSlug}/${eventSlug}`;
}

/** FEC often returns lat/lon as strings in JSON. */
function toNum(x) {
  if (x == null || x === '') return NaN;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  const n = parseFloat(String(x).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

const nominatimCache = new Map();

/** Fallback when FEC has no coordinates (e.g. 暂未公布). Uses OSM Nominatim; keep volume low. */
async function geocodeCityHint(hint) {
  const q = String(hint || '').trim();
  if (!q) return null;
  if (nominatimCache.has(q)) return nominatimCache.get(q);
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', q);
  const res = await fetch(url.toString(), {
    headers: {
      'user-agent': 'FurHub-data-sync/1.0 (contact: local dev; city fallback only)',
      'accept-language': 'zh-CN,en',
    },
  });
  if (!res.ok) {
    nominatimCache.set(q, null);
    return null;
  }
  const arr = await res.json();
  const hit = arr?.[0];
  const out =
    hit && hit.lat != null && hit.lon != null
      ? { latitude: parseFloat(hit.lat), longitude: parseFloat(hit.lon) }
      : null;
  nominatimCache.set(q, out);
  await new Promise((r) => setTimeout(r, 1100));
  return out;
}

function shanghaiYMD(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

/** 与站内原先格式一致：首日完整，同年段用 MM-DD，例如 2026-05-01 — 05-04 */
function dateLabelCN(startAt, endAt) {
  const a = shanghaiYMD(startAt);
  const b = shanghaiYMD(endAt);
  if (a === b) return a;
  const [y1, m1, d1] = a.split('-');
  const [y2, m2, d2] = b.split('-');
  if (y1 === y2) return `${y1}-${m1}-${d1} — ${m2}-${d2}`;
  return `${a} — ${b}`;
}

function normalizeLatLon(lat, lon) {
  let la = lat;
  let lo = lon;
  if (Math.abs(la) > 90 && Math.abs(lo) <= 90) {
    const t = la;
    la = lo;
    lo = t;
  }
  return { latitude: la, longitude: lo };
}

function locationTag(locationType) {
  if (locationType === 'hotel') return '酒店展';
  if (locationType === 'venue') return '场馆';
  if (locationType === 'comic-market') return '贩售展会';
  return '展会';
}

function buildTags(row) {
  const tags = [];
  if (row.organizationName) tags.push(row.organizationName);
  tags.push(locationTag(row.locationType));
  return tags;
}

function buildDescription(row) {
  const org = row.organizationName || '主办方';
  let t = `${org} 主办；时间与票务以 FEC 及主办方为准。`;
  if (row.coordSource === 'nominatim-city') {
    t += ' 地图点位为城市级参考（FEC 未提供经纬度）。';
  }
  return t;
}

function j(s) {
  return JSON.stringify(s ?? '');
}

function emitTs(rows, fetchedAt) {
  const items = rows.map((row) => {
    const id = `fec-${row.orgSlug}-${row.eventSlug}`;
    const mapAddress =
      row.mapAddress ||
      [row.city, row.venue].filter(Boolean).join(' · ') ||
      row.city ||
      '';
    const venue = row.venue ?? '';
    const dateLabel = dateLabelCN(row.startAt, row.endAt);
    const tags = buildTags(row);
    const desc = buildDescription(row);
    const cover = row.coverImageUrl ? `,\n    coverImageUrl: ${j(row.coverImageUrl)}` : '';
    const detailUrls = row.detailImageUrls?.length
      ? `,\n    detailImageUrls: ${JSON.stringify(row.detailImageUrls)}`
      : '';
    const fecDetail = row.fecDetail ? `,\n    fecDetail: ${j(row.fecDetail)}` : '';
    const orgName = row.organizationName?.trim()
      ? `,\n    organizerName: ${j(row.organizationName)}`
      : '';
    const fecTimes =
      row.startAt && row.endAt
        ? `,\n    fecStartAt: ${j(row.startAt)},\n    fecEndAt: ${j(row.endAt)}`
        : '';
    const fecMeta =
      row.scale != null || row.type != null || row.locationType != null
        ? [
            row.scale != null ? `,\n    fecScale: ${j(row.scale)}` : '',
            row.type != null ? `,\n    fecEventType: ${j(row.type)}` : '',
            row.locationType != null ? `,\n    fecLocationType: ${j(row.locationType)}` : '',
          ].join('')
        : '';
    return `  {
    id: ${j(id)},
    title: ${j(row.title)},
    city: ${j(row.city)},
    venue: ${j(venue)},
    mapAddress: ${j(mapAddress)},
    latitude: ${row.latitude},
    longitude: ${row.longitude},
    dateLabel: ${j(dateLabel)},
    tags: ${JSON.stringify(tags)},
    description: ${j(desc)},
    sourceUrl: ${j(row.sourceUrl)}${cover}${detailUrls}${fecDetail}${orgName}${fecTimes}${fecMeta}
  }`;
  });
  return `import type { Gathering } from '@/types/gathering';

/**
 * 由 scripts/fetch-fec-gatherings.mjs 从 https://www.furrycons.cn/ 生成。
 * 抓取时间（UTC）：${fetchedAt}
 * 坐标优先取 FEC 详情页 addressLat / addressLon；缺失时用城市级地理编码兜底。
 * 封面与详情图：event.thumbnail、event.media.images → https://images.furrycons.cn/…
 * 活动正文：event.detail（与 FEC 页内展示一致，优先于客户端 HTML 抓取）。
 * 头图文案：organization.name、startAt/endAt、scale、type、locationType。
 */
export const FEC_GATHERINGS: Gathering[] = [
${items.join(',\n')},
];
`;
}

async function main() {
  const homeHtml = await fetchText(`${ORIGIN}/`);
  const home = extractNextData(homeHtml);
  const list = home.props?.pageProps?.events;
  if (!Array.isArray(list)) throw new Error('events array missing');

  const results = [];
  const errors = [];

  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const orgSlug = e.organization?.slug;
    const slug = e.slug;
    if (!orgSlug || !slug) {
      errors.push({ reason: 'missing slug', raw: e });
      continue;
    }
    const url = eventPageUrl(orgSlug, slug);
    try {
      const html = await fetchText(url);
      const data = extractNextData(html);
      const ev = data.props?.pageProps?.event;
      if (!ev) {
        errors.push({ url, reason: 'no pageProps.event' });
        continue;
      }
      let lat = toNum(ev.addressLat);
      let lon = toNum(ev.addressLon);
      let coordSource = 'fec';
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        const city = ev.region?.localName ?? e.region?.localName ?? '';
        const geo = await geocodeCityHint(`${city}`.trim() || ev.address);
        if (geo) {
          ({ latitude: lat, longitude: lon } = normalizeLatLon(geo.latitude, geo.longitude));
          coordSource = 'nominatim-city';
        } else {
          errors.push({
            url,
            reason: 'no coordinates and geocode failed',
            addressLat: ev.addressLat,
            addressLon: ev.addressLon,
            city,
          });
          continue;
        }
      }
      ({ latitude: lat, longitude: lon } = normalizeLatLon(lat, lon));

      const thumbPath = ev.thumbnail ?? e.thumbnail ?? '';
      const coverFromThumb = fecImageAbs(thumbPath);
      const rawDetail = Array.isArray(ev.media?.images) ? ev.media.images : [];
      const detailAbs = rawDetail
        .map((im) => fecImageAbs(im?.url))
        .filter((u) => u.length > 0);
      const coverImageUrl =
        coverFromThumb ||
        detailAbs[0] ||
        '';
      const detailImageUrls = detailAbs.filter((u) => u !== coverImageUrl);

      const fecDetailRaw = ev.detail;
      const fecDetail =
        typeof fecDetailRaw === 'string' && fecDetailRaw.trim().length > 0
          ? fecDetailRaw.trim()
          : undefined;

      results.push({
        fecId: ev.id ?? e.id,
        orgSlug,
        eventSlug: slug,
        sourceUrl: url,
        title: ev.name ?? e.name,
        city: ev.region?.localName ?? e.region?.localName ?? '',
        venue: ev.address ?? e.address,
        mapAddress: [ev.region?.localName, ev.address].filter(Boolean).join(' · ') || ev.address,
        latitude: lat,
        longitude: lon,
        startAt: ev.startAt ?? e.startAt,
        endAt: ev.endAt ?? e.endAt,
        scale: ev.scale ?? e.scale,
        type: ev.type ?? e.type,
        locationType: ev.locationType ?? e.locationType,
        organizationName: ev.organization?.name ?? e.organization?.name,
        coordSource,
        coverImageUrl: coverImageUrl || undefined,
        detailImageUrls: detailImageUrls.length ? detailImageUrls : undefined,
        fecDetail,
      });
    } catch (err) {
      errors.push({ url, reason: String(err?.message ?? err) });
    }
    // polite delay
    await new Promise((r) => setTimeout(r, 120));
    if ((i + 1) % 10 === 0) process.stderr.write(`progress ${i + 1}/${list.length}\n`);
  }

  results.sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));

  const fetchedAt = new Date().toISOString();
  const payload = JSON.stringify({ fetchedAt, ok: results, errors }, null, 2);
  writeFileSync(join(ROOT, 'data', 'fec-gatherings.cache.json'), payload, 'utf8');
  writeFileSync(join(ROOT, 'data', 'fecGatherings.generated.ts'), emitTs(results, fetchedAt), 'utf8');
  process.stderr.write(
    `wrote data/fec-gatherings.cache.json + data/fecGatherings.generated.ts (${results.length} ok, ${errors.length} errors)\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
