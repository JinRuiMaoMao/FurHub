import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassSurface';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useI18n } from '@/lib/useI18n';

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('searchTitle') });
  }, [navigation, t]);

  useEffect(() => {
    setExpanded(true);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const inputStyle = [
    styles.input,
    scheme === 'dark'
      ? { backgroundColor: 'rgba(28,28,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }
      : { backgroundColor: 'rgba(255,255,255,0.45)', borderColor: 'rgba(60,60,67,0.12)', color: '#000' },
  ];
  const placeholder = '#8e8e93';
  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push({ pathname: '/search-results', params: { q } });
  };
  const onExpand = () => {
    if (!expanded) setExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <GlassCard borderRadius={18} intensity={52} vibe="neutral" contentStyle={styles.card}>
        <Text style={styles.title}>{t('searchTitle')}</Text>
        <Text style={styles.sub}>{t('searchHint')}</Text>
        {expanded ? (
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchInputPlaceholder')}
            placeholderTextColor={placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            autoFocus
            style={inputStyle}
          />
        ) : (
          <Pressable onPress={onExpand} style={styles.searchCollapsed}>
            <Text style={styles.searchCollapsedText}>{t('searchTapToExpand')}</Text>
          </Pressable>
        )}
      </GlassCard>
      <Text style={styles.empty}>{t('searchSubmitHint')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  card: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    opacity: 0.72,
    lineHeight: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchCollapsed: {
    borderWidth: 1,
    borderColor: 'rgba(120,120,128,0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchCollapsedText: {
    fontSize: 15,
    opacity: 0.75,
  },
  empty: {
    fontSize: 13,
    opacity: 0.72,
    lineHeight: 19,
    marginTop: 6,
  },
});
