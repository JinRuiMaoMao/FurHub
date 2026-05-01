import { type ReactNode, useMemo } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { useTabAdjacentJump } from '@/lib/useTabAdjacentJump';

export type TabSwipeVariant = 'standard' | 'map-friendly';

/**
 * Horizontal swipe to switch tabs: left / fast left → next tab; right → previous.
 * - `standard`: works across the screen (vertical scroll wins if the gesture is mostly vertical).
 * - `map-friendly`: only starts from the left/right screen edges so map pan/zoom in the center stays usable.
 */
export function TabSwipeShell({
  children,
  variant = 'standard',
}: {
  children: ReactNode;
  variant?: TabSwipeVariant;
}) {
  const jump = useTabAdjacentJump();
  const { width } = useWindowDimensions();

  const gesture = useMemo(() => {
    if (Platform.OS === 'web') return null;

    const edgePx = 36;
    const minDist = 56;
    const minVel = 620;

    if (variant === 'map-friendly') {
      return Gesture.Pan()
        .maxPointers(1)
        .manualActivation(true)
        .onTouchesDown((ev, sm) => {
          const t = ev.allTouches[0];
          if (!t) {
            sm.fail();
            return;
          }
          if (t.absoluteX <= edgePx || t.absoluteX >= width - edgePx) {
            sm.activate();
          } else {
            sm.fail();
          }
        })
        .onEnd((e) => {
          const tx = e.translationX;
          const vx = e.velocityX;
          if (tx <= -minDist || vx <= -minVel) {
            runOnJS(jump)(1);
          } else if (tx >= minDist || vx >= minVel) {
            runOnJS(jump)(-1);
          }
        });
    }

    return Gesture.Pan()
      .maxPointers(1)
      .activeOffsetX([-40, 40])
      .failOffsetY([-28, 28])
      .onEnd((e) => {
        const tx = e.translationX;
        const vx = e.velocityX;
        if (tx <= -minDist || vx <= -minVel) {
          runOnJS(jump)(1);
        } else if (tx >= minDist || vx >= minVel) {
          runOnJS(jump)(-1);
        }
      });
  }, [jump, variant, width]);

  if (Platform.OS === 'web' || !gesture) {
    return <>{children}</>;
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}
