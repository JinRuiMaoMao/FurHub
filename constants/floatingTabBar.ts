import { Dimensions, Platform } from 'react-native';

/** 设计基准：较宽屏下的默认高度 */
export const TAB_BAR_FLOAT_HEIGHT = 58;

/** 浮空 Tab 条与屏幕左右边缘的目标间距（pt） */
export const TAB_BAR_FLOAT_SIDE_INSET = 16;

/** 历史命名：与 `TAB_BAR_FLOAT_SIDE_INSET` 对齐 */
export const TAB_FLOAT_SIDE = TAB_BAR_FLOAT_SIDE_INSET;
export const TAB_FLOAT_RADIUS = 30;

/** 与整条导航栏同形制的圆角缩小版（比例略小于 `TAB_FLOAT_RADIUS`） */
export const TAB_BAR_PILL_RADIUS_SCALE = 0.7;
export const TAB_BAR_ACTIVE_PILL_RADIUS = Math.max(
  10,
  Math.round(TAB_FLOAT_RADIUS * TAB_BAR_PILL_RADIUS_SCALE),
);

/**
 * 浮空 Tab 条左右与屏幕边缘的距离。
 * 当前固定 **16pt**；`screenWidth` 保留供以后按屏宽微调。
 */
export function getTabBarFloatSideInset(screenWidth: number): number {
  void screenWidth;
  return TAB_BAR_FLOAT_SIDE_INSET;
}

/** 窄屏略压低栏高，整体更「收」一点。 */
export function getTabBarFloatHeight(screenWidth: number): number {
  const w = Number.isFinite(screenWidth) && screenWidth > 0 ? screenWidth : Dimensions.get('window').width;
  if (w < 340) return 52;
  if (w < 400) return 54;
  return TAB_BAR_FLOAT_HEIGHT;
}

export function getTabBarBottomOffset(insetsBottom: number): number {
  return Math.max(insetsBottom, 10) + 6;
}

/** 有底部滚动的页面在 `contentContainerStyle` / `paddingBottom` 上使用，避免被浮空栏挡住 */
export function getScenePaddingBottom(insetsBottom: number): number {
  const sw = Dimensions.get('window').width;
  const tabBarBottom = getTabBarBottomOffset(insetsBottom);
  const h = getTabBarFloatHeight(sw);
  const side = getTabBarFloatSideInset(sw);
  return h + tabBarBottom + side + (Platform.OS === 'ios' ? 6 : 10);
}
