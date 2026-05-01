import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'leaflet/dist/leaflet.css';

import { GlassButton } from '@/components/GlassButton';
import { GlassSurface } from '@/components/GlassSurface';
import { Text, View as ThemedView } from '@/components/Themed';
import { getScenePaddingBottom } from '@/constants/floatingTabBar';
import { MOCK_GATHERINGS } from '@/data/mockGatherings';
import { monthChipLabel } from '@/lib/i18n';
import { useI18n } from '@/lib/useI18n';

const FILTER_ALL = '__all__';
const FLOAT_BTN_SIZE = 42;
const FLOAT_BTN_GAP = 16;
const PANEL_GAP = 8;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const WEB_MAP_CENTER: [number, number] = [32.0, 116.5];
const WEB_MAP_ZOOM = 5;
type WebMapDeps = {
  MapContainer: any;
  Marker: any;
  TileLayer: any;
  redMarkerIcon: any;
};

export default function MapScreenWeb() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { t, lang } = useI18n();
  const [selectedYear, setSelectedYear] = useState<string>(FILTER_ALL);
  const [selectedMonth, setSelectedMonth] = useState<number | typeof FILTER_ALL>(FILTER_ALL);
  const [panelOpen, setPanelOpen] = useState(false);
  const [webMapDeps, setWebMapDeps] = useState<WebMapDeps | null>(null);
  const buttonTop = FLOAT_BTN_GAP;
  const buttonRight = FLOAT_BTN_GAP;
  const panelWidth = Math.min(340, Math.max(220, screenWidth - 24));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const load = async () => {
      const leaflet = await import('leaflet');
      const reactLeaflet = await import('react-leaflet');
      const redMarkerIcon = new leaflet.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      if (!cancelled) {
        setWebMapDeps({
          MapContainer: reactLeaflet.MapContainer,
          Marker: reactLeaflet.Marker,
          TileLayer: reactLeaflet.TileLayer,
          redMarkerIcon,
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const years = useMemo(
    () =>
      Array.from(
        new Set(MOCK_GATHERINGS.map((g) => g.dateLabel.slice(0, 4)).filter((y) => /^\d{4}$/.test(y))),
      ).sort(),
    [],
  );
  const gatheringDateParts = useMemo(
    () =>
      MOCK_GATHERINGS.map((g) => ({
        gathering: g,
        year: g.dateLabel.slice(0, 4),
        month: parseInt(g.dateLabel.slice(5, 7), 10),
      })),
    [],
  );
  const monthsForYear = useMemo(() => {
    const result = new Set<number>();
    for (const item of gatheringDateParts) {
      const yearMatches = selectedYear === FILTER_ALL || item.year === selectedYear;
      if (yearMatches && item.month >= 1 && item.month <= 12) {
        result.add(item.month);
      }
    }
    return MONTHS.filter((m) => result.has(m));
  }, [gatheringDateParts, selectedYear]);

  useEffect(() => {
    if (selectedMonth !== FILTER_ALL && !monthsForYear.includes(selectedMonth)) {
      setSelectedMonth(FILTER_ALL);
    }
  }, [monthsForYear, selectedMonth]);

  const filteredGatherings = useMemo(
    () =>
      gatheringDateParts
        .filter((item) => {
          const yearOk = selectedYear === FILTER_ALL || item.year === selectedYear;
          const monthOk = selectedMonth === FILTER_ALL || item.month === selectedMonth;
          return yearOk && monthOk;
        })
        .map((item) => item.gathering),
    [gatheringDateParts, selectedMonth, selectedYear],
  );

  const openDetail = useCallback((id: string) => {
    router.push(`/gathering/${id}` as Href);
  }, []);

  const MapContainer = webMapDeps?.MapContainer;
  const Marker = webMapDeps?.Marker;
  const TileLayer = webMapDeps?.TileLayer;

  return (
    <ThemedView style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.mapWrap}>
        {webMapDeps && MapContainer && Marker && TileLayer ? (
          <MapContainer center={WEB_MAP_CENTER} zoom={WEB_MAP_ZOOM} style={styles.map}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredGatherings.map((g) => (
              <Marker
                key={g.id}
                position={[g.latitude, g.longitude]}
                icon={webMapDeps.redMarkerIcon}
                eventHandlers={{
                  click: () => openDetail(g.id),
                }}
              />
            ))}
          </MapContainer>
        ) : (
          <View style={styles.mapLoading}>
            <Text style={styles.cardHint}>地图加载中…</Text>
          </View>
        )}
      </View>

      <View style={[styles.floatingToggleWrap, { right: buttonRight, top: buttonTop }]}>
        <GlassButton
          mode="icon"
          variant="neutral"
          onPress={() => setPanelOpen((v) => !v)}
          style={styles.panelToggle}>
          <Text style={styles.panelToggleIcon}>{panelOpen ? '×' : '☰'}</Text>
        </GlassButton>
      </View>

      {panelOpen ? (
        <GlassSurface
          borderRadius={20}
          intensity={54}
          padding={12}
          vibe="neutral"
          style={[
            styles.floatingPanel,
            {
              left: screenWidth - panelWidth - FLOAT_BTN_GAP,
              top: buttonTop + FLOAT_BTN_SIZE + PANEL_GAP,
              width: panelWidth,
            },
          ]}>
          <Text style={styles.panelTitle}>{t('mapTitle')}</Text>
          <Text style={styles.panelSub} numberOfLines={3}>
            {t('mapNativeSubtitle')}
          </Text>
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
      ) : null}
      <View style={styles.bottomHintWrap}>
        <Text style={styles.cardHint}>{t('mapNativeSubtitle')}</Text>
      </View>
    </ThemedView>
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
  mapWrap: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,128,0.1)',
  },
  cardHint: { marginTop: 8, fontSize: 12, opacity: 0.55 },
  bottomHintWrap: {
    position: 'absolute',
    left: 16,
    bottom: getScenePaddingBottom(0) + 8,
    zIndex: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  floatingPanel: { position: 'absolute', zIndex: 10 },
  floatingToggleWrap: { position: 'absolute', zIndex: 12 },
  panelTitle: { fontSize: 16, fontWeight: '700' },
  panelSub: { marginTop: 4, fontSize: 12, lineHeight: 16, opacity: 0.72 },
  panelToggle: { width: 42, height: 42 },
  panelToggleIcon: { fontSize: 19, fontWeight: '700', textAlign: 'center', lineHeight: 22 },
  filtersWrap: { marginTop: 2 },
  filterLabel: { fontSize: 12, opacity: 0.68 },
  filterLabelMonth: { marginTop: 6 },
  row: { gap: 8, paddingTop: 6, paddingBottom: 2, paddingRight: 8 },
  chip: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipIdle: { backgroundColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: 'rgba(99,102,241,0.22)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.52)' },
  chipText: { fontSize: 12, opacity: 0.85 },
  chipTextActive: { opacity: 1, fontWeight: '700' },
});
