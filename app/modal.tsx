import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';

import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassSurface';
import { Text, View } from '@/components/Themed';
import { useI18n } from '@/lib/useI18n';

export default function ModalScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('modalTitle'),
      headerRight: () => (
        <GlassButton
          compact
          variant="neutral"
          label={t('modalDone')}
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        />
      ),
    });
  }, [navigation, t]);

  return (
    <>
      <View style={styles.container}>
        <GlassCard borderRadius={20} intensity={52} vibe="neutral">
          <Text style={styles.title}>{t('modalHeading')}</Text>
          <Text style={styles.body}>{t('modalBody')}</Text>
          <Text style={styles.meta}>{t('modalMeta')}</Text>
        </GlassCard>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.88,
    marginBottom: 16,
  },
  meta: {
    fontSize: 13,
    opacity: 0.6,
  },
});
