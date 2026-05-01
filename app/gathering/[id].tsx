import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GatheringFecImage } from '@/components/GatheringFecImage';
import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassSurface';
import { Text, View as ThemedView } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getScenePaddingBottom } from '@/constants/floatingTabBar';
import { getGatheringById } from '@/data/mockGatherings';
import { fetchFecLiveDescription } from '@/lib/fecDetail';
import { buildGatheringHeroOverlay } from '@/lib/gatheringHeroMeta';
import { useI18n } from '@/lib/useI18n';

const HERO_MIN_HEIGHT = 256;

function isFecBoilerplateDescription(text: string): boolean {
  return /时间与票务以 FEC 及主办方为准/.test(text);
}

/** 无正文、或实为整站页脚/备案等抓取噪声时，视为「没有简介」 */
function isWorthlessFetchedIntro(text: string): boolean {
  const s = text.trim();
  if (!s) return true;
  if (/FURRYCONS\.CN|友情链接|兽展日历|沪公网安备|渝ICP备/.test(s)) return true;
  return false;
}

export default function GatheringDetailScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { t, lang } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gathering = getGatheringById(String(id));
  const headerTitle = gathering?.title ?? t('gatheringNotFoundTitle');
  const [liveDescription, setLiveDescription] = useState<string | null>(null);
  const [aboutFetchDone, setAboutFetchDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const g = getGatheringById(String(id));
    setLiveDescription(null);
    if (!g?.sourceUrl) {
      setAboutFetchDone(true);
      return;
    }
    if (g.fecDetail?.trim()) {
      setAboutFetchDone(true);
      return;
    }
    setAboutFetchDone(false);
    void (async () => {
      const next = await fetchFecLiveDescription(g.sourceUrl);
      if (!cancelled) {
        setLiveDescription(next);
        setAboutFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!gathering) {
    return (
      <>
        <Stack.Screen options={{ title: t('gatheringNotFoundTitle') }} />
        <ThemedView style={styles.center}>
          <Text style={styles.muted}>{t('gatheringNotFoundBody')}</Text>
        </ThemedView>
      </>
    );
  }

  const normalizeAddress = (value: string): string => {
    const raw = value.trim();
    if (!raw) return raw;
    if (raw.includes('暂未公布')) {
      return raw.replace(/[·•,，\s]/g, '');
    }
    return raw;
  };

  const composedAddress = `${gathering.city} · ${gathering.venue}`.trim();
  const addressCandidates = [normalizeAddress(gathering.mapAddress), normalizeAddress(composedAddress)]
    .filter((x) => x.length > 0)
    .filter((x, i, arr) => arr.findIndex((y) => y.replace(/\s+/g, '') === x.replace(/\s+/g, '')) === i)
    .sort((a, b) => b.length - a.length);
  const primaryAddress = addressCandidates[0] ?? composedAddress;
  const secondaryAddress = addressCandidates.find((x) => x !== primaryAddress) ?? '';

  const screenW = Dimensions.get('window').width;
  const paddedInnerW = screenW - 40 - 32;
  const detailImageMaxW = Math.min(paddedInnerW, 688);

  const detailUrls = gathering.detailImageUrls ?? [];
  const heroBgUri = gathering.coverImageUrl ?? detailUrls[0];
  const restDetailUrls =
    gathering.coverImageUrl != null ? detailUrls : detailUrls.slice(1);

  const veilColor = isDark ? 'rgba(49, 46, 129, 0.58)' : 'rgba(67, 56, 202, 0.46)';

  const heroOverlay = buildGatheringHeroOverlay(lang, gathering);
  const heroDateLine = heroOverlay.dateLine ?? gathering.dateLabel;

  const bundledDetail = gathering.fecDetail?.trim() ?? '';
  const liveRaw = (liveDescription ?? '').trim();
  const liveEffective = isWorthlessFetchedIntro(liveRaw) ? '' : liveRaw;
  const descTrim = gathering.description.trim();
  const aboutIsLoading =
    Boolean(gathering.sourceUrl) && !bundledDetail && !aboutFetchDone;
  const noRealIntro =
    !bundledDetail &&
    !liveEffective &&
    (!descTrim || isFecBoilerplateDescription(descTrim));
  /** FEC 无 `fecDetail`、在线也无有效正文时，活动说明只显示占位句 */
  const showEmptyIntroPlaceholder = aboutFetchDone && !aboutIsLoading && noRealIntro;

  let aboutBodyText: string;
  if (aboutIsLoading) {
    aboutBodyText = t('gatheringDescriptionLoading');
  } else if (showEmptyIntroPlaceholder) {
    aboutBodyText = t('gatheringNoIntroYet');
  } else if (bundledDetail) {
    aboutBodyText = bundledDetail;
  } else {
    aboutBodyText = liveEffective || gathering.description;
  }

  const showIntroInCard =
    Boolean(bundledDetail) || aboutIsLoading || !gathering.sourceUrl || aboutFetchDone;

  const heroSoloBottomRounded =
    restDetailUrls.length === 0 && !showIntroInCard;

  return (
    <>
      <Stack.Screen options={{ title: headerTitle }} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: getScenePaddingBottom(insets.bottom) },
        ]}>
        <GlassCard borderRadius={18} intensity={54} vibe="prominent" style={styles.card} padding={0}>
          <View
            style={[
              styles.heroStack,
              { minHeight: HERO_MIN_HEIGHT },
              heroSoloBottomRounded ? styles.heroStackSolo : null,
            ]}>
            {heroBgUri ? (
              <Image
                source={{ uri: heroBgUri }}
                style={styles.heroImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]} />
            )}
            <View style={[styles.heroVeil, { backgroundColor: veilColor }]} />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{gathering.title}</Text>
              {heroOverlay.hostedBy ? (
                <Text style={styles.heroHostedBy}>{heroOverlay.hostedBy}</Text>
              ) : null}
              <Text style={styles.heroMeta}>{primaryAddress}</Text>
              {secondaryAddress ? <Text style={styles.heroMeta}>{secondaryAddress}</Text> : null}
              <Text style={styles.heroMeta}>{heroDateLine}</Text>
              {heroOverlay.venueKindAndType ? (
                <Text style={styles.heroMeta}>{heroOverlay.venueKindAndType}</Text>
              ) : null}
              {heroOverlay.scaleLine ? (
                <Text style={styles.heroScaleHint}>{heroOverlay.scaleLine}</Text>
              ) : null}
              <GlassButton
                compact
                variant="neutral"
                label={t('gatheringCopyAddr')}
                onPress={async () => {
                  await Clipboard.setStringAsync(primaryAddress);
                  Alert.alert(t('gatheringCopiedTitle'), t('gatheringCopiedBody'));
                }}
                style={styles.copyBtn}
              />
              <View style={styles.tags}>
                {gathering.tags.map((tag) => (
                  <View key={tag} style={styles.tagOnHero}>
                    <Text style={styles.tagTextOnHero}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {showIntroInCard ? (
            <View
              style={[
                styles.introInCard,
                restDetailUrls.length === 0 ? styles.introInCardLast : null,
              ]}>
              <Text style={styles.sectionTitle}>{t('gatheringSectionAbout')}</Text>
              <Text
                style={[
                  styles.body,
                  aboutIsLoading ? styles.bodyLoading : null,
                  showEmptyIntroPlaceholder ? styles.bodyPlaceholder : null,
                ]}>
                {aboutBodyText}
              </Text>
            </View>
          ) : null}

          {restDetailUrls.length > 0 ? (
            <View style={styles.detailBlock}>
              {restDetailUrls.map((uri) => (
                <GatheringFecImage key={uri} uri={uri} maxWidth={detailImageMaxW} resizeMode="contain" />
              ))}
            </View>
          ) : null}
        </GlassCard>

        <GlassButton variant="prominent" label={t('gatheringSignup')} onPress={() => {}} style={styles.cta} />
        <Text style={styles.ctaHint}>{t('gatheringSignupHint')}</Text>
      </ScrollView>
    </>
  );
}

const textShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  muted: {
    fontSize: 15,
    opacity: 0.75,
  },
  scroll: {
    padding: 20,
  },
  card: {
    marginBottom: 14,
  },
  heroStack: {
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  heroStackSolo: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroPlaceholder: {
    backgroundColor: 'rgba(79, 70, 229, 0.35)',
  },
  heroVeil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  heroText: {
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    ...textShadow,
  },
  heroHostedBy: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 8,
    ...textShadow,
  },
  heroMeta: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.94)',
    marginBottom: 4,
    ...textShadow,
  },
  heroScaleHint: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
    marginBottom: 6,
    ...textShadow,
  },
  copyBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tagOnHero: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  tagTextOnHero: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  introInCard: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120, 120, 128, 0.22)',
  },
  introInCardLast: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 16,
  },
  detailBlock: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
  bodyLoading: {
    opacity: 0.72,
  },
  bodyPlaceholder: {
    opacity: 0.78,
    fontStyle: 'italic',
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  ctaHint: {
    marginTop: 10,
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
});
