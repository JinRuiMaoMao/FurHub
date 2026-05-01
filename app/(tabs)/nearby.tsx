import { Platform } from 'react-native';
import type { ComponentType } from 'react';

import { TabSwipeShell } from '@/components/TabSwipeShell';

export default function NearbyRouteScreen() {
  if (Platform.OS === 'web') {
    const NearbyWeb = require('./nearby.web').default as ComponentType;
    return (
      <TabSwipeShell variant="standard">
        <NearbyWeb />
      </TabSwipeShell>
    );
  }
  if (Platform.OS === 'android') {
    const NearbyAndroidMap = require('@/components/NearbyAndroidMap').default as ComponentType;
    return (
      <TabSwipeShell variant="map-friendly">
        <NearbyAndroidMap />
      </TabSwipeShell>
    );
  }
  const NearbyNativeMap = require('@/components/NearbyNativeMap').default as ComponentType;
  return (
    <TabSwipeShell variant="map-friendly">
      <NearbyNativeMap />
    </TabSwipeShell>
  );
}

