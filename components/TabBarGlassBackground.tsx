import { StyleSheet, View } from 'react-native';

import { GlassMorphismLayers } from '@/components/GlassSurface';

type Props = {
  /** 浮空 Tab 栏圆角；0 表示直角铺满 */
  borderRadius?: number;
};

export function TabBarGlassBackground({ borderRadius = 0 }: Props) {
  return (
    <View
      style={[StyleSheet.absoluteFill, borderRadius ? { borderRadius, overflow: 'hidden' } : null]}
      pointerEvents="none">
      <GlassMorphismLayers borderRadius={borderRadius} intensity={46} vibe="neutral" />
    </View>
  );
}
