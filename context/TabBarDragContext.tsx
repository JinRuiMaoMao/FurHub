import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export type TabBarDragContextValue = {
  barLeftSV: SharedValue<number>;
  pillW: SharedValue<number>;
  maxPillX: SharedValue<number>;
  indicatorX: SharedValue<number>;
  glassOpacity: SharedValue<number>;
  /** 手指按下：玻璃瞬移到该屏幕坐标（`pageX`）对应位置。 */
  teleportToAbsoluteX: (pageX: number) => void;
  /** 抬起手指：隐藏跟手玻璃层（当前 tab 常驻玻璃仍在）。 */
  hideOverlay: () => void;
  endDrag: (absoluteX: number) => void;
};

export const TabBarDragContext = createContext<TabBarDragContextValue | null>(null);

export function useTabBarDrag(): TabBarDragContextValue | null {
  return useContext(TabBarDragContext);
}
