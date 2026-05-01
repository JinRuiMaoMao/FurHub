import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

export type GlassVibe = 'neutral' | 'prominent';

export type GlassMorphismLayersProps = {
  borderRadius: number;
  /** 另一套方案建议 40–70，默认取中间偏强 */
  intensity?: number;
  vibe?: GlassVibe;
  /**
   * `tabBarActive`: 相对底层 Tab 玻璃条略提亮 / 略压暗（浅色模式略暗、深色模式略亮），便于看出选中格。
   */
  surfaceContrast?: 'tabBarActive';
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Glassmorphism 核心叠层：Blur + 半透明 + 高光描边 + 对角渐变（模拟液态反光）。
 * 父级需 `position: 'relative'`、`overflow: 'hidden'`，并由子内容撑开高度。
 */
export function GlassMorphismLayers({
  borderRadius,
  intensity = 56,
  vibe = 'neutral',
  surfaceContrast,
  showBorder = true,
  style,
}: GlassMorphismLayersProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const tint = isDark ? 'dark' : 'light';

  const baseOverlay = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.05)';

  const contrastWash =
    surfaceContrast === 'tabBarActive'
      ? isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.08)'
      : null;

  const prominentWash =
    vibe === 'prominent'
      ? isDark
        ? 'rgba(99, 102, 241, 0.16)'
        : 'rgba(99, 102, 241, 0.14)'
      : 'transparent';

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(255, 255, 255, 0.55)';

  const gradColors = isDark
    ? (['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const)
    : (['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)'] as const);

  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius }, style]} pointerEvents="none">
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            backgroundColor: baseOverlay,
            borderWidth: showBorder ? StyleSheet.hairlineWidth * 2 : 0,
            borderColor: showBorder ? borderColor : 'transparent',
          },
        ]}
      />
      {contrastWash ? (
        <View style={[StyleSheet.absoluteFill, { borderRadius, backgroundColor: contrastWash }]} />
      ) : null}
      {vibe === 'prominent' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius, backgroundColor: prominentWash },
          ]}
        />
      ) : null}
      <LinearGradient
        colors={[...gradColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
    </View>
  );
}

export type GlassSurfaceProps = {
  children: React.ReactNode;
  borderRadius?: number;
  intensity?: number;
  padding?: number;
  vibe?: GlassVibe;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/** 通用玻璃容器：阴影 + 圆角裁剪 + 叠层 + 内边距 */
export function GlassSurface({
  children,
  borderRadius = 20,
  intensity = 54,
  padding = 16,
  vibe = 'neutral',
  style,
  contentStyle,
}: GlassSurfaceProps) {
  return (
    <View style={[styles.shell, { borderRadius }, style]}>
      <GlassMorphismLayers borderRadius={borderRadius} intensity={intensity} vibe={vibe} />
      <View style={[{ padding, zIndex: 2 }, contentStyle]}>{children}</View>
    </View>
  );
}

/** 卡片默认：圆角 20 + 内边距 16 */
export function GlassCard(
  props: Omit<GlassSurfaceProps, 'padding' | 'borderRadius'> & {
    padding?: number;
    borderRadius?: number;
  },
) {
  const { padding = 16, borderRadius = 20, ...rest } = props;
  return <GlassSurface borderRadius={borderRadius} padding={padding} {...rest} />;
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'stretch',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
});
