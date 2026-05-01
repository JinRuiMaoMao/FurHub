import { router, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type MapStyleElement } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { GlassSurface } from '@/components/GlassSurface';
import { Text, View as ThemedView } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getScenePaddingBottom } from '@/constants/floatingTabBar';
import { MOCK_GATHERINGS } from '@/data/mockGatherings';
import { monthChipLabel } from '@/lib/i18n';
import { useI18n } from '@/lib/useI18n';

const FILTER_ALL = '__all__';
const FLOAT_BTN_SIZE = 42;
const FLOAT_BTN_GAP = 16;
const PANEL_GAP = 8;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const INITIAL_REGION = {
  latitude: 32.0,
  longitude: 116.5,
  latitudeDelta: 14,
  longitudeDelta: 14,
};

const DARK_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

export default function NearbyNativeMap() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scheme = useColorScheme();
  const { t, lang } = useI18n();
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(FILTER_ALL);
  const [selectedMonth, setSelectedMonth] = useState<number | typeof FILTER_ALL>(FILTER_ALL);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelWidth = Math.min(340, Math.max(220, screenWidth - 24));
  const buttonTop = FLOAT_BTN_GAP;
  const buttonRight = FLOAT_BTN_GAP;

  useFocusEffect(useCallback(() => () => setPanelOpen(false), []));

  const years = useMemo(
    () =>
      Array.from(
        new Set(MOCK_GATHERINGS.map((g) => g.dateLabel.slice(0, 4)).filter((y) => /^\d{4}$/.test(y))),
      ).sort(),
    [],
  );
  const activeYears = selectedYear === FILTER_ALL ? years : [selectedYear];
  const monthsForYear = useMemo(() => {
    const pool = MOCK_GATHERINGS.filter((g) => activeYears.includes(g.dateLabel.slice(0, 4)));
    const result = new Set<number>();
    for (const g of pool) {
      const m = parseInt(g.dateLabel.slice(5, 7), 10);
      if (m >= 1 && m <= 12) result.add(m);
    }
    return MONTHS.filter((m) => result.has(m));
  }, [activeYears]);

  useEffect(() => {
    if (selectedMonth !== FILTER_ALL && !monthsForYear.includes(selectedMonth)) {
      setSelectedMonth(FILTER_ALL);
    }
  }, [monthsForYear, selectedMonth]);

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

  useEffect(() => {
    if (!mapReady) return;
    const coords = filteredGatherings.map((g) => ({ latitude: g.latitude, longitude: g.longitude }));
    const timer = setTimeout(() => {
      if (coords.length === 0) return;
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: {
          top: 120,
          right: 48,
          bottom: getScenePaddingBottom(insets.bottom) + 24,
          left: 48,
        },
        animated: true,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [filteredGatherings, insets.bottom, mapReady]);

  const lastOpen = useRef<{ id: string; at: number }>({ id: '', at: 0 });
  const openDetail = useCallback((id: string) => {
    const now = Date.now();
    if (lastOpen.current.id === id && now - lastOpen.current.at < 700) {
      return;
    }
    lastOpen.current = { id, at: now };
    const href = `/gathering/${id}` as Href;
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        router.push(href);
      });
    });
  }, []);

  return (
    <ThemedView style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.mapStack} collapsable={false}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
          loadingEnabled={Platform.OS === 'android'}
          removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
          onMapReady={() => setMapReady(true)}
          userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
          customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : []}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}>
          {filteredGatherings.map((g) => (
            <Marker
              key={g.id}
              coordinate={{ latitude: g.latitude, longitude: g.longitude }}
              title={g.title}
              description={g.mapAddress}
              tracksViewChanges={false}
              onCalloutPress={() => openDetail(g.id)}
              onPress={() => openDetail(g.id)}
            />
          ))}
        </MapView>
        {/* First paint: MapView is not touch-safe until onMapReady; tapping early crashes on Android. */}
        <View
          style={[StyleSheet.absoluteFill, styles.mapTouchShield]}
          pointerEvents={mapReady ? 'none' : 'auto'}
          collapsable={false}
        />
      </View>

      <View style={[styles.floatingToggleWrap, { right: buttonRight, top: buttonTop }]}>
        <GlassButton mode="icon" variant="neutral" onPress={() => setPanelOpen((v) => !v)} style={styles.panelToggle}>
          <Text style={styles.panelToggleIcon}>{panelOpen ? '×' : '☰'}</Text>
        </GlassButton>
      </View>

      {panelOpen ? (
        <GlassSurface
          borderRadius={20}
          intensity={56}
          padding={12}
          vibe="neutral"
          style={[
            styles.floatingPanel,
            { left: screenWidth - panelWidth - FLOAT_BTN_GAP, top: buttonTop + FLOAT_BTN_SIZE + PANEL_GAP, width: panelWidth },
          ]}>
          <Text style={styles.panelTitle}>{t('mapTitle')}</Text>
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
                <FilterChip key={month} label={monthChipLabel(lang, month)} active={selectedMonth === month} onPress={() => setSelectedMonth(month)} />
              ))}
            </ScrollView>
          </View>
        </GlassSurface>
      ) : null}
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
  mapStack: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  mapTouchShield: { zIndex: 2, backgroundColor: 'transparent' },
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

