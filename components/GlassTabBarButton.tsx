import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo } from 'react';
import { Platform, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { Gesture, GestureDetector, Pressable as GHPressable } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GlassMorphismLayers } from '@/components/GlassSurface';
import { TAB_BAR_ACTIVE_PILL_RADIUS } from '@/constants/floatingTabBar';
import { useTabBarDrag } from '@/context/TabBarDragContext';
import { clampPillX } from '@/lib/tabBarPillMath';

const PRESS_SCALE = 1.22;

export function GlassTabBarButton(props: BottomTabBarButtonProps) {
  const { children, style, onPressIn, onPressOut, ...rest } = props;
  const navigation = useNavigation();
  const route = useRoute();
  const drag = useTabBarDrag();
  const navState = navigation.getState();
  const activeIndex = navState?.index ?? 0;
  const activeName = navState?.routes?.[activeIndex]?.name;
  const focused = Boolean(route?.name && activeName === route.name);

  const pressScale = useSharedValue(1);
  const pillScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const panGesture = useMemo(() => {
    if (!drag || Platform.OS === 'web') return null;
    const { barLeftSV, pillW, maxPillX, indicatorX, glassOpacity, endDrag } = drag;

    return Gesture.Pan()
      .maxPointers(1)
      .activeOffsetX([-6, 6])
      .failOffsetY([-80, 80])
      .onStart((e) => {
        glassOpacity.value = 1;
        const lx = e.absoluteX - barLeftSV.value;
        indicatorX.value = clampPillX(lx, pillW.value, maxPillX.value);
      })
      .onUpdate((e) => {
        const lx = e.absoluteX - barLeftSV.value;
        indicatorX.value = clampPillX(lx, pillW.value, maxPillX.value);
      })
      .onEnd((e) => {
        glassOpacity.value = 0;
        runOnJS(endDrag)(e.absoluteX);
      })
      .onFinalize(() => {
        glassOpacity.value = 0;
      });
  }, [drag]);

  const bumpPressIn = () => {
    pressScale.value = withSpring(PRESS_SCALE, { damping: 14, stiffness: 220 });
  };
  const bumpPressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };

  const pageXFromPress = (e: { nativeEvent: { pageX?: number } }) =>
    typeof e.nativeEvent.pageX === 'number' ? e.nativeEvent.pageX : 0;

  const inner = (
    <>
      {focused ? (
        <Animated.View style={[styles.pillClip, pillScaleStyle]} pointerEvents="none">
          <GlassMorphismLayers
            borderRadius={TAB_BAR_ACTIVE_PILL_RADIUS}
            intensity={52}
            vibe="neutral"
            surfaceContrast="tabBarActive"
          />
        </Animated.View>
      ) : null}
      <View style={styles.foreground}>{children}</View>
    </>
  );

  if (panGesture) {
    const { onHoverIn: _hi, onHoverOut: _ho, ...ghRest } = rest;

    return (
      <GestureDetector gesture={panGesture}>
        <GHPressable
          simultaneousWithExternalGesture={panGesture}
          // `PlatformPressable` 与 RNGH `Pressable` 事件类型略不同；运行时兼容。
          {...(ghRest as object)}
          onPressIn={(e) => {
            drag?.teleportToAbsoluteX(pageXFromPress(e));
            if (focused) bumpPressIn();
            onPressIn?.(e as never);
          }}
          onPressOut={(e) => {
            drag?.hideOverlay();
            if (focused) bumpPressOut();
            onPressOut?.(e as never);
          }}
          android_ripple={{ borderless: true, color: 'rgba(255,255,255,0.12)' }}
          style={[style, styles.pressable, { backgroundColor: 'transparent' }]}>
          {inner}
        </GHPressable>
      </GestureDetector>
    );
  }

  return (
    <PlatformPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        drag?.teleportToAbsoluteX(e.nativeEvent.pageX);
        if (focused) bumpPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        drag?.hideOverlay();
        if (focused) bumpPressOut();
        onPressOut?.(e);
      }}
      android_ripple={{ borderless: true, color: 'rgba(255,255,255,0.12)' }}
      style={[style, styles.pressable, { backgroundColor: 'transparent' }]}>
      {inner}
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    overflow: 'hidden',
  },
  pillClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  foreground: {
    flex: 1,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
