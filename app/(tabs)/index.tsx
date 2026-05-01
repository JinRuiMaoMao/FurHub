import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { TabSwipeShell } from '@/components/TabSwipeShell';
import { getScenePaddingBottom } from '@/constants/floatingTabBar';
import { GlassCard, GlassSurface } from '@/components/GlassSurface';
import { Text } from '@/components/Themed';
import type { MayKnowPerson } from '@/data/mockMayKnow';
import { MOCK_GATHERINGS } from '@/data/mockGatherings';
import { getUpcomingGatherings } from '@/lib/discoverGatherings';
import {
  appendMayKnowPickHistory,
  clearMayKnowPickHistory,
  getMayKnowLastShown,
  getMayKnowPickHistory,
  setMayKnowLastShown,
  setMayKnowPickHistory,
} from '@/lib/discoverMayKnowHistory';
import { getMayKnowAvatarUrl, pickMayKnowSuggestionsExcluding } from '@/lib/mayKnow';
import {
  bumpDiscoverMayKnowRotation,
  getDiscoverMayKnowRotation,
  getSessionEmail,
} from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

const UPCOMING_LIMIT = 8;
const MAY_KNOW_LIMIT = 5;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bottomPad = getScenePaddingBottom(insets.bottom);
  const [mayKnow, setMayKnow] = useState<MayKnowPerson[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const upcoming = useMemo(
    () => getUpcomingGatherings(MOCK_GATHERINGS, UPCOMING_LIMIT),
    [],
  );

  const fetchMayKnow = useCallback(async (bumpRotation: boolean) => {
    if (bumpRotation) await bumpDiscoverMayKnowRotation();
    const [email, rot, historyStart, lastShown] = await Promise.all([
      getSessionEmail(),
      getDiscoverMayKnowRotation(),
      getMayKnowPickHistory(),
      getMayKnowLastShown(),
    ]);
    let history = historyStart;
    let picks = pickMayKnowSuggestionsExcluding(email, rot, MAY_KNOW_LIMIT, history, lastShown);
    // 演示池很小：严格排除最近 5 轮后可能无人可选，依次丢掉最旧一轮直至能选出人
    while (picks.length === 0 && history.length > 0) {
      history = history.slice(0, -1);
      await setMayKnowPickHistory(history);
      picks = pickMayKnowSuggestionsExcluding(email, rot, MAY_KNOW_LIMIT, history, lastShown);
    }
    if (picks.length === 0) {
      await clearMayKnowPickHistory();
      picks = pickMayKnowSuggestionsExcluding(email, rot, MAY_KNOW_LIMIT, [], []);
    }
    if (picks.length > 0) {
      await setMayKnowLastShown(picks.map((p) => p.email));
    }
    if (bumpRotation && picks.length > 0) {
      await appendMayKnowPickHistory(picks.map((p) => p.email));
    }
    return picks;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const picks = await fetchMayKnow(false);
        if (!cancelled) setMayKnow(picks);
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchMayKnow]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const picks = await fetchMayKnow(true);
      setMayKnow(picks);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMayKnow]);

  return (
    <TabSwipeShell variant="standard">
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} title={t('discoverMayKnowPullRefresh')} />
        }>
      <GlassSurface
        borderRadius={22}
        intensity={56}
        padding={16}
        vibe="neutral"
        style={styles.heroGlass}>
        <Text style={styles.heroTitle}>FurHub</Text>
        <Text style={styles.heroSubtitle}>{t('discoverHeroSubtitle')}</Text>
      </GlassSurface>

      <Text style={[styles.sectionTitle, styles.mayKnowTitle]}>{t('discoverMayKnowTitle')}</Text>
      <GlassCard borderRadius={18} intensity={50} vibe="neutral" style={styles.mayKnowCard}>
        {mayKnow.length === 0 ? (
          <Text style={styles.mayKnowEmpty}>{t('discoverMayKnowEmpty')}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mayKnowRow}>
            {mayKnow.map((p) => (
              <Pressable
                key={p.email}
                style={styles.mayKnowCell}
                onPress={() => router.push({ pathname: '/user-profile', params: { email: p.email } })}>
                <Image source={{ uri: getMayKnowAvatarUrl(p) }} style={styles.mayKnowAvatar} />
                <Text numberOfLines={2} style={styles.mayKnowName}>
                  {p.name}
                </Text>
                <Text style={styles.mayKnowMeta} numberOfLines={1}>
                  {t('discoverMayKnowBilibili')} ·{' '}
                  {p.tag === 'furryZh' ? t('discoverMayKnowTagFurryZh') : t('discoverMayKnowTagFurry')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </GlassCard>

      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>{t('discoverUpcomingTitle')}</Text>
      {upcoming.length === 0 ? (
        <GlassCard borderRadius={18} intensity={50} vibe="neutral" contentStyle={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('discoverUpcomingEmpty')}</Text>
          <GlassButton
            label={t('discoverMapCta')}
            variant="prominent"
            onPress={() => router.push('/nearby')}
            style={styles.emptyCta}
          />
        </GlassCard>
      ) : (
        <GlassCard borderRadius={18} intensity={50} vibe="neutral" contentStyle={styles.listCard}>
          {upcoming.map((g) => (
            <Pressable key={g.id} onPress={() => router.push(`/gathering/${g.id}`)}>
              <View style={styles.item}>
                <Text style={styles.itemTitle}>{g.title}</Text>
                <Text style={styles.itemSub}>
                  {g.city} · {g.dateLabel}
                </Text>
              </View>
            </Pressable>
          ))}
        </GlassCard>
      )}
      </ScrollView>
    </TabSwipeShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  heroGlass: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    opacity: 0.75,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionTitleSpaced: {
    marginTop: 18,
  },
  mayKnowTitle: {
    marginBottom: 10,
  },
  mayKnowCard: {
    marginBottom: 4,
    overflow: 'hidden',
  },
  mayKnowEmpty: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    opacity: 0.72,
    textAlign: 'center',
    lineHeight: 20,
  },
  mayKnowRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  mayKnowCell: {
    width: 108,
    alignItems: 'center',
    marginRight: 14,
  },
  mayKnowAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(120,120,128,0.12)',
  },
  mayKnowName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  mayKnowMeta: {
    marginTop: 4,
    fontSize: 11,
    opacity: 0.68,
    textAlign: 'center',
    width: '100%',
  },
  listCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyCard: {
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 16,
    alignSelf: 'center',
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.3)',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSub: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.68,
  },
});
