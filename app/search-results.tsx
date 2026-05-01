import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassSurface';
import { Text } from '@/components/Themed';
import { MOCK_GATHERINGS } from '@/data/mockGatherings';
import { getSessionEmail, searchLocalUsersByName, type SearchUserRecord } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function SearchResultsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ q?: string }>();
  const q = (params.q ?? '').trim().toLowerCase();
  const [users, setUsers] = useState<SearchUserRecord[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('searchResultTitle') });
  }, [navigation, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const email = (await getSessionEmail()) ?? '';
      if (!cancelled) setCurrentEmail(email);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!q) {
        if (!cancelled) setUsers([]);
        return;
      }
      const next = await searchLocalUsersByName(q, { includeCurrentUser: true });
      if (!cancelled) setUsers(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const openUserProfile = (email: string) => {
    if (email === currentEmail) {
      const nav = router as unknown as { dismissAll?: () => void; replace: (href: string) => void };
      nav.dismissAll?.();
      nav.replace('/(tabs)/profile');
      return;
    }
    router.push({ pathname: '/user-profile', params: { email } });
  };

  const gatherings = useMemo(() => {
    if (!q) return [];
    return MOCK_GATHERINGS.filter((g) => g.title.toLowerCase().includes(q)).slice(0, 30);
  }, [q]);

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.keyword}>
        {t('searchKeywordPrefix')}
        {params.q ?? ''}
      </Text>

      <GlassCard borderRadius={18} intensity={50} vibe="neutral" contentStyle={styles.card}>
        <Text style={styles.section}>{t('searchGatheringSection')}</Text>
        {gatherings.length === 0 ? (
          <Text style={styles.empty}>{t('searchGatheringEmpty')}</Text>
        ) : (
          gatherings.map((g) => (
            <Pressable key={g.id} onPress={() => router.push(`/gathering/${g.id}`)}>
              <View style={styles.item}>
                <Text style={styles.itemTitle}>{g.title}</Text>
                <Text style={styles.itemSub}>{g.city}</Text>
              </View>
            </Pressable>
          ))
        )}
      </GlassCard>

      <GlassCard borderRadius={18} intensity={50} vibe="neutral" contentStyle={styles.card}>
        <Text style={styles.section}>{t('searchUserSection')}</Text>
        {users.length === 0 ? (
          <Text style={styles.empty}>{t('searchUserEmpty')}</Text>
        ) : (
          users.map((u) => (
            <Pressable key={u.email} onPress={() => openUserProfile(u.email)}>
              <View style={styles.item}>
                <Text style={styles.itemTitle}>
                  {u.name}
                  {u.isVip ? ` · ${t('searchVipTag')}` : ''}
                </Text>
                <Text style={styles.itemSub}>{u.email}</Text>
              </View>
            </Pressable>
          ))
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  keyword: {
    fontSize: 14,
    opacity: 0.75,
    marginBottom: 10,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 8,
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
  empty: {
    fontSize: 13,
    opacity: 0.72,
    lineHeight: 19,
    marginTop: 6,
  },
});
