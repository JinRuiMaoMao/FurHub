import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { GlassMorphismLayers } from '@/components/GlassSurface';
import { TabBarDragContext } from '@/context/TabBarDragContext';
import { TAB_BAR_ACTIVE_PILL_RADIUS } from '@/constants/floatingTabBar';
import { pillLeftFromFingerBarX } from '@/lib/tabBarPillMath';

/**
 * Drag overlay follows finger (pan lives on each tab button via `TabBarDragContext`).
 * Current tab keeps a static glass pill in `GlassTabBarButton`.
 */
export function SwipingTabBar(props: BottomTabBarProps) {
  const { state, navigation } = props;
  const shellRef = useRef<View>(null);
  const [barWidth, setBarWidth] = useState(0);

  const barLeftSV = useSharedValue(0);
  const pillW = useSharedValue(0);
  const maxPillX = useSharedValue(5);
  const indicatorX = useSharedValue(5);
  const glassOpacity = useSharedValue(0);

  const pushLayoutToWorklets = useCallback(
    (width: number, routeCount: number, activeIndex: number) => {
      const tw = routeCount > 0 ? width / routeCount : 0;
      const pw = Math.max(0, tw);
      const maxX = Math.max(0, width - pw);
      pillW.value = pw;
      maxPillX.value = maxX;
      const snap =
        routeCount > 0 && width > 0 ? Math.max(0, Math.min(maxX, activeIndex * tw)) : 0;
      indicatorX.value = snap;
    },
    [indicatorX, maxPillX, pillW],
  );

  useEffect(() => {
    if (barWidth <= 0) return;
    pushLayoutToWorklets(barWidth, state.routes.length, state.index);
  }, [barWidth, pushLayoutToWorklets, state.index, state.routes.length]);

  const jumpToTab = useCallback(
    (index: number) => {
      if (index === state.index) return;
      const targetRoute = state.routes[index];
      if (!targetRoute) return;
      navigation.navigate(targetRoute.name as never);
    },
    [navigation, state.index, state.routes],
  );

  const endDrag = useCallback(
    (absoluteX: number) => {
      const lx = absoluteX - barLeftSV.value;
      const rc = state.routes.length;
      if (rc <= 0 || barWidth <= 0) return;
      const tw = barWidth / rc;
      const targetIndex = Math.max(0, Math.min(rc - 1, Math.floor(lx / tw)));
      jumpToTab(targetIndex);
    },
    [barLeftSV, barWidth, jumpToTab, state.routes.length],
  );

  const teleportToAbsoluteX = useCallback(
    (pageX: number) => {
      const rc = state.routes.length;
      if (rc <= 0 || barWidth <= 0) return;
      const barFingerX = pageX - barLeftSV.value;
      const tw = barWidth / rc;
      const pw = tw;
      const maxPillLeft = Math.max(0, barWidth - pw);
      indicatorX.value = pillLeftFromFingerBarX(barFingerX, pw, maxPillLeft);
      glassOpacity.value = 1;
    },
    [barLeftSV, barWidth, glassOpacity, indicatorX, state.routes.length],
  );

  const hideOverlay = useCallback(() => {
    glassOpacity.value = 0;
  }, [glassOpacity]);

  const dragApi = useMemo(
    () => ({
      barLeftSV,
      pillW,
      maxPillX,
      indicatorX,
      glassOpacity,
      teleportToAbsoluteX,
      hideOverlay,
      endDrag,
    }),
    [barLeftSV, endDrag, glassOpacity, hideOverlay, indicatorX, maxPillX, pillW, teleportToAbsoluteX],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: glassOpacity.value,
    width: pillW.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  const measureShell = useCallback(() => {
    shellRef.current?.measureInWindow((x, _y, w, _h) => {
      barLeftSV.value = x;
      if (w > 0) setBarWidth(w);
    });
  }, [barLeftSV]);

  useLayoutEffect(() => {
    if (Platform.OS === 'web') return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(measureShell);
    });
    return () => cancelAnimationFrame(id);
  }, [measureShell]);

  if (Platform.OS === 'web') {
    return <BottomTabBar {...props} />;
  }

  return (
    <TabBarDragContext.Provider value={dragApi}>
      <View
        ref={shellRef}
        collapsable={false}
        onLayout={() => {
          requestAnimationFrame(measureShell);
        }}>
        <Animated.View pointerEvents="none" style={[styles.followPill, indicatorStyle]}>
          <View style={[styles.pillClip, { borderRadius: TAB_BAR_ACTIVE_PILL_RADIUS }]}>
            <GlassMorphismLayers
              borderRadius={TAB_BAR_ACTIVE_PILL_RADIUS}
              intensity={52}
              vibe="neutral"
              surfaceContrast="tabBarActive"
            />
          </View>
        </Animated.View>
        <BottomTabBar {...props} />
      </View>
    </TabBarDragContext.Provider>
  );
}

const styles = StyleSheet.create({
  followPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  pillClip: {
    flex: 1,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
});
