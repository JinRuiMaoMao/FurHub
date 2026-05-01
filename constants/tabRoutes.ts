/** Bottom tab route names in left-to-right order (must match `app/(tabs)` screens). */
export const TAB_ROUTE_ORDER = ['index', 'nearby', 'store', 'profile'] as const;
export type TabRouteName = (typeof TAB_ROUTE_ORDER)[number];
