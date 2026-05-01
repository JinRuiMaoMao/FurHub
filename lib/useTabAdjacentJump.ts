import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { TAB_ROUTE_ORDER, type TabRouteName } from '@/constants/tabRoutes';

/** Navigate to the previous / next tab in `TAB_ROUTE_ORDER`. */
export function useTabAdjacentJump() {
  const navigation = useNavigation();

  return useCallback(
    (delta: -1 | 1) => {
      const state = navigation.getState();
      if (!state?.routes || typeof state.index !== 'number') return;
      const currentName = state.routes[state.index]?.name;
      if (!currentName) return;
      const i = TAB_ROUTE_ORDER.indexOf(currentName as TabRouteName);
      if (i < 0) return;
      const j = i + delta;
      if (j < 0 || j >= TAB_ROUTE_ORDER.length) return;
      navigation.navigate(TAB_ROUTE_ORDER[j] as never);
    },
    [navigation],
  );
}
