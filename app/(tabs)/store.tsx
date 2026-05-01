import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/GlassButton';
import { TabSwipeShell } from '@/components/TabSwipeShell';
import { GlassCard } from '@/components/GlassSurface';
import { Text } from '@/components/Themed';
import { purchaseFurCoin, purchaseVipMembership } from '@/lib/profileStorage';
import { useI18n } from '@/lib/useI18n';

export default function StoreScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [busyItem, setBusyItem] = useState<'vip' | 'coin' | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('storeTitle') });
  }, [navigation, t]);

  const doPay = async (item: 'vip' | 'coin', channelLabel: string) => {
    setBusyItem(item);
    try {
      if (item === 'vip') {
        const res = await purchaseVipMembership();
        if (!res.ok) {
          Alert.alert(t('alertTip'), res.error);
          return;
        }
        Alert.alert(t('storePaySuccessTitle'), t('storeVipPaySuccess').replace('{channel}', channelLabel));
        return;
      }
      const res = await purchaseFurCoin(1000);
      if (!res.ok) {
        Alert.alert(t('alertTip'), res.error);
        return;
      }
      Alert.alert(
        t('storePaySuccessTitle'),
        t('storeCoinPaySuccess')
          .replace('{channel}', channelLabel)
          .replace('{balance}', String(res.balance)),
      );
    } finally {
      setBusyItem(null);
    }
  };

  const onBuy = (item: 'vip' | 'coin') => {
    const onWechat = async () => {
      const code = item === 'vip' ? '001' : '002';
      const note = `#付款:金瑞毛毛金尚市轨交(JinRui_MaoMao)/FurHub/${code}`;
      await Clipboard.setStringAsync(note);
      Alert.alert(
        t('storeWechatCopiedTitle'),
        t('storeWechatCopiedBody').replace('{note}', note),
        [
          {
            text: t('storePaidConfirm'),
            onPress: () => {
              void doPay(item, t('storePayWechat'));
            },
          },
          { text: t('storePayCancel'), style: 'cancel' },
        ],
      );
    };

    const channels = [
      { label: t('storePayWechat'), onPress: () => void onWechat() },
      { label: t('storePayAlipay') },
      { label: t('storePayApple') },
      { label: t('storePayGoogle') },
    ];
    Alert.alert(
      t('storeSelectPayMethod'),
      item === 'vip' ? t('storeVipName') : t('storeCoinName'),
      [
        ...channels.map((x) => ({
          text: x.label,
          onPress: x.onPress ?? (() => void doPay(item, x.label)),
        })),
        { text: t('storePayCancel'), style: 'cancel' as const },
      ],
    );
  };

  return (
    <TabSwipeShell variant="standard">
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.headline}>{t('storeHeadline')}</Text>
      <Text style={styles.sub}>{t('storeSub')}</Text>

      <View style={styles.vipWrap}>
        <LinearGradient
          colors={['#fde68a', '#fbbf24', '#f59e0b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.vipGradient}
        />
        <View style={styles.card}>
          <Text style={[styles.title, styles.vipTextStrong]}>{t('storeVipName')}</Text>
          <Text style={[styles.desc, styles.vipText]}>{t('storeVipDesc')}</Text>
          <View style={styles.footer}>
            <Text style={[styles.price, styles.vipTextStrong]}>{t('storeVipPrice')}</Text>
            <GlassButton
              compact
              variant="prominent"
              label={busyItem === 'vip' ? t('profileSaving') : t('storeBuy')}
              onPress={() => onBuy('vip')}
              disabled={busyItem != null}
            />
          </View>
        </View>
      </View>

      <GlassCard borderRadius={18} intensity={52} vibe="neutral" contentStyle={styles.card}>
        <Text style={styles.title}>{t('storeCoinName')}</Text>
        <Text style={styles.desc}>{t('storeCoinDesc')}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{t('storeCoinPrice')}</Text>
          <GlassButton
            compact
            variant="prominent"
            label={busyItem === 'coin' ? t('profileSaving') : t('storeBuy')}
            onPress={() => onBuy('coin')}
            disabled={busyItem != null}
          />
        </View>
      </GlassCard>
      </ScrollView>
    </TabSwipeShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    gap: 12,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
  },
  sub: {
    marginTop: 2,
    marginBottom: 6,
    fontSize: 13,
    opacity: 0.72,
  },
  card: {
    padding: 16,
  },
  vipWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  vipGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.75,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  vipText: {
    color: '#3f2a00',
    opacity: 0.9,
  },
  vipTextStrong: {
    color: '#2b1a00',
  },
});
