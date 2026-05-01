const CACHE_TTL_MS = 5 * 60 * 1000;
const detailCache = new Map<string, { text: string; fetchedAt: number }>();
const isWebRuntime = typeof window !== 'undefined';

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function sanitizeText(input: string): string {
  return input
    // remove BOM / zero-width chars that often cause weird rendering
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    // remove control chars (keep newline/tab)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // replacement char from broken decoding
    .replace(/\uFFFD/g, '');
}

function extractFecBodyBlock(input: string): string {
  // Generic "city.暂未公布" style lead-in, not only for Hohhot.
  const unknownVenueMatch = input.match(/[\u3400-\u9FFF]{2,}\s*[·.．]\s*暂未公布/);
  let start = -1;
  let markerLen = 0;
  let matchedMarker = '';
  if (unknownVenueMatch?.index != null) {
    start = unknownVenueMatch.index;
    markerLen = unknownVenueMatch[0].length;
    matchedMarker = unknownVenueMatch[0];
  }

  if (start === -1) {
    const startMarkersByPriority = ['3天', '去高德地图查看', '在高德地图查看'];
    for (const marker of startMarkersByPriority) {
      const idx = input.indexOf(marker);
      if (idx !== -1) {
        start = idx;
        markerLen = marker.length;
        matchedMarker = marker;
        break;
      }
    }
  }
  /** 无定位标记时不退回整页 HTML，避免与整站正文混在一起 */
  if (start === -1) return '';

  // Keep location lead-in line like "xx.暂未公布", but skip helper lines like "去高德地图查看".
  const shouldKeepMarker = matchedMarker.includes('暂未公布');
  const bodyStart = shouldKeepMarker ? start : start + markerLen;
  const tail = input.slice(bodyStart);
  const endMarkers = [
    '\n### 友情链接',
    '\n友情链接',
    '\n展会地图',
    '\n兽展日历',
    '\n!Image',
    '\n![',
    '\n#####',
    '\n### ',
    '\n复制QQ群号',
    '\nBilibili',
    '\n©️ FURRYCONS',
    'FURRYCONS.CN 20',
  ];
  let cut = tail.length;
  for (const marker of endMarkers) {
    const idx = tail.indexOf(marker);
    if (idx !== -1 && idx < cut) cut = idx;
  }
  return tail.slice(0, cut);
}

function shapeParagraphBreaks(input: string): string {
  const protectedTokens: string[] = [];
  const masked = input.replace(
    /(?:https?:\/\/\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g,
    (m) => {
      const token = `__PROTECTED_TOKEN_${protectedTokens.length}__`;
      protectedTokens.push(m);
      return token;
    },
  );

  const shaped = masked
    .replace(/\r\n?/g, '\n')
    // English split: period + space + next English letter
    .replace(/([A-Za-z])\.\s+(?=[A-Za-z])/g, '$1.\n')
    // Chinese split: break after punctuation
    .replace(/([。！？；：，])\s*/g, '$1\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = shaped.split('\n');
  const adjusted: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    adjusted.push(current);
    const next = lines[i + 1] ?? '';
    if (!current || !next) continue;
    const currentHasEnglish = /[A-Za-z]/.test(current);
    const nextStartsChinese = /^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(next);
    if (currentHasEnglish && nextStartsChinese) {
      adjusted.push('');
    }
  }
  const shapedWithBridgeGap = adjusted.join('\n').replace(/\n{3,}/g, '\n\n');

  return shapedWithBridgeGap.replace(
    /__PROTECTED_TOKEN_(\d+)__/g,
    (m, i: string) => protectedTokens[parseInt(i, 10)] ?? m,
  );
}

function normalizeMultilineText(input: string): string {
  const text = shapeParagraphBreaks(
    sanitizeText(decodeHtmlEntities(extractFecBodyBlock(input)))
    // markdown links: keep label, drop URL
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, '$1')
    // markdown reference links: [label][id] -> label
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    // preserve structural line breaks from common block tags
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h1|h2|h3|h4|h5|h6|section|article)\s*>/gi, '\n')
    // strip remaining tags
    .replace(/<[^>]*>/g, '')
    // normalize line endings
    .replace(/\r\n?/g, '\n')
    // trim spaces around each line
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    // drop noisy link/navigation lines from proxy/plaintext sources but keep blank lines for paragraphs
    .map((line) => {
      if (!line) return '';
      if (/^https?:\/\/\S+$/i.test(line)) return '';
      if (/^(?:www\.)?\S+\.\S+\/?\S*$/i.test(line) && !/[ \u4e00-\u9fff]/.test(line)) return '';
      if (/^(?:home|about|contact|login|register|privacy|terms)$/i.test(line)) return '';
      return line;
    })
    .join('\n')
    // collapse very large blank blocks while keeping paragraph breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim(),
  );
  return text;
}

function pickBestText(candidates: string[]): string | null {
  const cleaned = candidates
    .map((x) => normalizeMultilineText(x))
    .filter((x) => x.length >= 20)
    .filter((x) => !(x.includes('FURRYCONS.CN') && x.includes('友情链接')));
  if (cleaned.length === 0) return null;
  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0];
}

/** FEC 详情页内嵌 JSON，detail 有值时最可信 */
function extractNextDataEventDetail(html: string): string | null {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1]) as {
      props?: { pageProps?: { event?: { detail?: unknown } } };
    };
    const d = j.props?.pageProps?.event?.detail;
    if (typeof d === 'string' && d.trim().length > 0) return d.trim();
  } catch {
    // ignore
  }
  return null;
}

function trimFecSiteChromeTail(text: string): string {
  let t = text;
  const markers = [
    '\n友情链接',
    '\n关于我们',
    '\n兽展日历',
    '©️ FURRYCONS',
    'FURRYCONS.CN 20',
    '\n沪公网安备',
    '\n渝ICP备',
    '\n展会地图\n',
  ];
  for (const mk of markers) {
    const i = t.indexOf(mk);
    if (i > 40) t = t.slice(0, i);
  }
  return t.trim();
}

export async function fetchFecLiveDescription(sourceUrl?: string): Promise<string | null> {
  if (!sourceUrl) return null;
  const cached = detailCache.get(sourceUrl);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.text;

  try {
    const sourceNoScheme = sourceUrl.replace(/^https?:\/\//i, '');
    const fetchCandidates = isWebRuntime
      ? [
          sourceUrl,
          `https://r.jina.ai/http://${sourceNoScheme}`,
          `https://r.jina.ai/https://${sourceNoScheme}`,
        ]
      : [sourceUrl];

    let html = '';
    let fromProxy = false;
    for (const url of fetchCandidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        html = await res.text();
        fromProxy = url !== sourceUrl;
        if (html.trim().length > 0) break;
      } catch {
        // try next source
      }
    }
    if (!html) return null;

    const fromNext = extractNextDataEventDetail(html);
    if (fromNext) {
      const trimmed = trimFecSiteChromeTail(fromNext);
      if (trimmed.length >= 10) {
        detailCache.set(sourceUrl, { text: trimmed, fetchedAt: Date.now() });
        return trimmed;
      }
    }

    const candidates: string[] = [];
    const focusedBody = extractFecBodyBlock(html);
    if (focusedBody.trim().length > 20) candidates.push(focusedBody);
    const looksLikeFullHtmlDoc = /<\s*html[\s>]/i.test(html) || /<!DOCTYPE\s+html/i.test(html);
    if (!looksLikeFullHtmlDoc) {
      candidates.push(html);
    }

    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    if (ogDesc?.[1]) candidates.push(ogDesc[1]);

    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (metaDesc?.[1]) candidates.push(metaDesc[1]);

    const scriptMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );
    if (scriptMatches) {
      for (const script of scriptMatches) {
        const jsonText = script
          .replace(/^<script[^>]*>/i, '')
          .replace(/<\/script>$/i, '')
          .trim();
        try {
          const parsed = JSON.parse(jsonText) as unknown;
          const queue = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of queue) {
            if (item && typeof item === 'object') {
              const description = (item as { description?: unknown }).description;
              if (typeof description === 'string') candidates.push(description);
            }
          }
        } catch {
          // ignore malformed JSON-LD blocks
        }
      }
    }

    const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
    if (articleMatch?.[0]) candidates.push(articleMatch[0]);

    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
    if (mainMatch?.[0]) candidates.push(mainMatch[0]);

    // proxy text is often plain content instead of HTML; keep it as fallback candidate.
    if (fromProxy) candidates.push(html);

    let best = pickBestText(candidates);
    if (best) {
      best = trimFecSiteChromeTail(best);
      if (best.length < 15) best = null;
    }
    if (best) {
      detailCache.set(sourceUrl, { text: best, fetchedAt: Date.now() });
    }
    return best;
  } catch {
    return null;
  }
}
