import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/GlassSurface';
import { Text } from '@/components/Themed';
import { getScenePaddingBottom } from '@/constants/floatingTabBar';
import { MOCK_GATHERINGS } from '@/data/mockGatherings';
import { monthChipLabel } from '@/lib/i18n';
import { useI18n } from '@/lib/useI18n';

const FILTER_ALL = '__all__';
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function buildMapHtml(pointsJson: string, title: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin=""
    />
    <style>
      html, body, #map { height: 100%; margin: 0; background: #111; }
      .leaflet-control-attribution { font-size: 10px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      (function () {
        const points = ${pointsJson};
        const map = L.map('map', { zoomControl: true }).setView([32.0, 116.5], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const bounds = [];
        points.forEach((p) => {
          const marker = L.marker([p.latitude, p.longitude]).addTo(map);
          marker.bindPopup('<b>' + (p.title || '') + '</b><br/>' + (p.mapAddress || '') + '<br/><small>${title}</small>');
          marker.on('click', function () {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('open:' + p.id);
            }
          });
          bounds.push([p.latitude, p.longitude]);
        });
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [28, 28] });
        }
      })();
    </script>
  </body>
</html>`;
}

export default function NearbyAndroidMap() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { t, lang } = useI18n();
  const [selectedYear, setSelectedYear] = useState<string>(FILTER_ALL);
  const [selectedMonth, setSelectedMonth] = useState<number | typeof FILTER_ALL>(FILTER_ALL);
  const [panelOpen, setPanelOpen] = useState(true);
  const panelWidth = Math.min(380, Math.max(220, screenWidth - 24));

  const years = useMemo(
    () =>
      Array.from(
        new Set(MOCK_GATHERINGS.map((g) => g.dateLabel.slice(0, 4)).filter((y) => /^\d{4}$/.test(y))),
      ).sort(),
    [],
  );
  const monthsForYear = useMemo(() => {
    const result = new Set<number>();
    for (const g of MOCK_GATHERINGS) {
      const year = g.dateLabel.slice(0, 4);
      if (selectedYear !== FILTER_ALL && year !== selectedYear) continue;
      const month = parseInt(g.dateLabel.slice(5, 7), 10);
      if (month >= 1 && month <= 12) result.add(month);
    }
    return MONTHS.filter((m) => result.has(m));
  }, [selectedYear]);

  const filteredGatherings = useMemo(
    () =>
      MOCK_GATHERINGS.filter((g) => {
        const year = g.dateLabel.slice(0, 4);
        const month = parseInt(g.dateLabel.slice(5, 7), 10);
        const yearOk = selectedYear === FILTER_ALL || year === selectedYear;
        const monthOk = selectedMonth === FILTER_ALL || month === selectedMonth;
        return yearOk && monthOk;
      }),
    [selectedMonth, selectedYear],
  );

  const html = useMemo(() => {
    const points = filteredGatherings.map((g) => ({
      id: g.id,
      title: g.title,
      mapAddress: g.mapAddress,
      latitude: g.latitude,
      longitude: g.longitude,
    }));
    return buildMapHtml(JSON.stringify(points), t('mapNativeSubtitle'));
  }, [filteredGatherings, t]);

  return (
    <View style={styles.root}>
      {panelOpen ? (
        <View style={styles.panelInlineWrap}>
          <GlassSurface
            borderRadius={20}
            intensity={56}
            padding={12}
            vibe="neutral"
            style={[styles.panelInline, { width: panelWidth }]}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>{t('mapTitle')}</Text>
              <Pressable onPress={() => setPanelOpen(false)} style={styles.hideBtn}>
                <Text style={styles.hideBtnText}>{t('mapFilterHide')}</Text>
              </Pressable>
            </View>
            <Text style={styles.panelSub}>{t('mapNativeSubtitle')}</Text>
            <View style={styles.filtersWrap}>
              <Text style={styles.filterLabel}>{t('mapYear')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                <FilterChip label={t('mapAll')} active={selectedYear === FILTER_ALL} onPress={() => setSelectedYear(FILTER_ALL)} />
                {years.map((year) => (
                  <FilterChip key={year} label={year} active={selectedYear === year} onPress={() => setSelectedYear(year)} />
                ))}
              </ScrollView>
              <Text style={[styles.filterLabel, styles.filterLabelMonth]}>{t('mapMonth')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                <FilterChip label={t('mapAll')} active={selectedMonth === FILTER_ALL} onPress={() => setSelectedMonth(FILTER_ALL)} />
                {monthsForYear.map((month) => (
                  <FilterChip
                    key={month}
                    label={monthChipLabel(lang, month)}
                    active={selectedMonth === month}
                    onPress={() => setSelectedMonth(month)}
                  />
                ))}
              </ScrollView>
            </View>
          </GlassSurface>
        </View>
      ) : (
        <View style={styles.showBtnWrap}>
          <Pressable onPress={() => setPanelOpen(true)} style={styles.showBtn}>
            <Text style={styles.showBtnText}>{t('mapFilterShow')}</Text>
          </Pressable>
        </View>
      )}
      <WebView
        style={styles.webview}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType="software"
        onMessage={(event) => {
          const msg = event.nativeEvent.data ?? '';
          if (!msg.startsWith('open:')) return;
          const id = msg.slice('open:'.length);
          if (!id) return;
          router.push((`/gathering/${id}` as Href));
        }}
      />
      <View style={[styles.tip, { bottom: getScenePaddingBottom(insets.bottom) + 8 }]}>
        <Text style={styles.tipText}>{t('mapNativeSubtitle')}</Text>
      </View>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]} hitSlop={6}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webview: { flex: 1 },
  panelInlineWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 30,
    elevation: 30,
  },
  panelInline: { maxHeight: 190 },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  panelTitle: { fontSize: 16, fontWeight: '700' },
  panelSub: { marginTop: 4, fontSize: 12, lineHeight: 16, opacity: 0.72 },
  hideBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  hideBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  showBtnWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 30,
    elevation: 30,
  },
  showBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(32,32,38,0.8)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  showBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  filtersWrap: { marginTop: 2 },
  filterLabel: { fontSize: 12, opacity: 0.68 },
  filterLabelMonth: { marginTop: 6 },
  row: { gap: 8, paddingTop: 6, paddingBottom: 2, paddingRight: 8 },
  chip: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipIdle: { backgroundColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: 'rgba(99,102,241,0.22)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.52)' },
  chipText: { fontSize: 12, opacity: 0.85 },
  chipTextActive: { opacity: 1, fontWeight: '700' },
  tip: {
    position: 'absolute',
    left: 12,
    zIndex: 9,
    elevation: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tipText: {
    fontSize: 12,
    opacity: 0.85,
    color: '#fff',
  },
});
