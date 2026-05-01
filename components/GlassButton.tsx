import * as React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { GlassMorphismLayers } from '@/components/GlassSurface';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type PressableRef = React.ComponentRef<typeof Pressable>;

export type GlassButtonVariant = 'prominent' | 'neutral';

export type GlassButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  variant?: GlassButtonVariant;
  mode?: 'default' | 'icon';
  compact?: boolean;
  label?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

function buttonIntensity(
  compact: boolean,
  mode: 'default' | 'icon',
  scheme: 'light' | 'dark',
): number {
  if (mode === 'icon') {
    return scheme === 'light' ? 52 : 58;
  }
  if (compact) {
    return scheme === 'light' ? 46 : 52;
  }
  return scheme === 'light' ? 50 : 56;
}

export const GlassButton = React.forwardRef<PressableRef, GlassButtonProps>(function GlassButton(
  {
    onPress,
    disabled,
    variant = 'prominent',
    mode = 'default',
    compact = false,
    label,
    children,
    style,
    textStyle,
  },
  ref,
) {
  const colorScheme = useColorScheme() ?? 'light';
  const schemeColors = Colors[colorScheme];
  const labelColor =
    variant === 'prominent' ? schemeColors.tint : schemeColors.text;

  const corner = mode === 'icon' ? 20 : 14;
  const vibe = variant === 'prominent' ? 'prominent' : 'neutral';
  const useAndroidLightFallback = Platform.OS === 'android' && colorScheme === 'light';

  const contentStyle =
    mode === 'icon'
      ? styles.contentIcon
      : compact
        ? styles.contentCompact
        : styles.contentDefault;

  const labelFont = compact || mode === 'icon' ? styles.labelCompact : styles.labelDefault;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.shadowWrap,
        { borderRadius: corner },
        mode === 'icon' && styles.iconWrap,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={[styles.clip, { borderRadius: corner }]}>
        {useAndroidLightFallback ? (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: corner,
                backgroundColor:
                  variant === 'prominent' ? 'rgba(99,102,241,0.22)' : 'rgba(60,60,67,0.12)',
              },
            ]}
          />
        ) : (
          <>
            <GlassMorphismLayers
              borderRadius={corner}
              intensity={buttonIntensity(compact, mode, colorScheme)}
              vibe={vibe}
              showBorder={false}
            />
          </>
        )}
        <View style={contentStyle}>
          {children ??
            (label != null ? (
              <Text style={[labelFont, { color: labelColor }, textStyle]}>{label}</Text>
            ) : null)}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  shadowWrap: {
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: { elevation: 0 },
      default: {},
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
  clip: {
    position: 'relative',
    overflow: 'hidden',
  },
  contentDefault: {
    position: 'relative',
    zIndex: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
  },
  contentCompact: {
    position: 'relative',
    zIndex: 2,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
  },
  contentIcon: {
    position: 'relative',
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelDefault: {
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
    textShadowOffset: { width: 0, height: 0 },
  },
  labelCompact: {
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
    textShadowOffset: { width: 0, height: 0 },
  },
});
