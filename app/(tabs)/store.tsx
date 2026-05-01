import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLayoutEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
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
  const [paySheetItem, setPaySheetItem] = useState<'vip' | 'coin' | null>(null);

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
    setPaySheetItem(item);
  };

  const channels = [
    { label: t('storePayWechat') },
    { label: t('storePayAlipay') },
    { label: t('storePayApple') },
    { label: t('storePayGoogle') },
  ];

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
      <Modal
        visible={paySheetItem != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPaySheetItem(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPaySheetItem(null)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{t('storeSelectPayMethod')}</Text>
            <Text style={styles.sheetSub}>
              {paySheetItem === 'vip' ? t('storeVipName') : t('storeCoinName')}
            </Text>
            {channels.map((x) => (
              <Pressable
                key={x.label}
                style={styles.sheetOption}
                onPress={() => {
                  const item = paySheetItem;
                  setPaySheetItem(null);
                  if (item) void doPay(item, x.label);
                }}>
                <Text style={styles.sheetOptionText}>{x.label}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.sheetOption, styles.sheetCancel]} onPress={() => setPaySheetItem(null)}>
              <Text style={styles.sheetCancelText}>{t('storePayCancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheetCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(32,32,38,0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    color: '#fff',
  },
  sheetSub: {
    fontSize: 13,
    opacity: 0.8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    color: '#fff',
  },
  sheetOption: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sheetCancel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffb4b4',
  },
});
