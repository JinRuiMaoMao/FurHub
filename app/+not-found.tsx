import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassSurface';
import { Text, View } from '@/components/Themed';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '未找到' }} />
      <View style={styles.container}>
        <GlassCard borderRadius={20} intensity={52} vibe="neutral" style={styles.card}>
          <Text style={styles.title}>这个页面不存在。</Text>
          <Link href="/" asChild>
            <GlassButton compact variant="prominent" label="返回首页" style={styles.link} />
          </Link>
        </GlassCard>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignSelf: 'stretch',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 4,
    alignSelf: 'center',
  },
});
