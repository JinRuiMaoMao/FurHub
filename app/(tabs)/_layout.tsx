import React from 'react';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, type Href } from 'expo-router';
import { Animated, Dimensions, Easing, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import {
  getTabBarFloatHeight,
  getTabBarFloatSideInset,
  TAB_FLOAT_RADIUS,
  getTabBarBottomOffset,
} from '@/constants/floatingTabBar';
import { GlassButton } from '@/components/GlassButton';
import { GlassTabBarButton } from '@/components/GlassTabBarButton';
import { SwipingTabBar } from '@/components/SwipingTabBar';
import { TabBarGlassBackground } from '@/components/TabBarGlassBackground';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useI18n } from '@/lib/useI18n';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -1 }} {...props} />;
}

/** Horizontal slide + cross-fade when switching bottom tabs (stronger than built-in `shift`). */
const forTabHorizontalSlide: NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']> = ({
  current,
}) => {
  const w = Dimensions.get('window').width;
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-w, 0, w],
          }),
        },
      ],
    },
  };
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { t } = useI18n();

  const tabBarBottom = getTabBarBottomOffset(insets.bottom);
  const tabBarSideInset = getTabBarFloatSideInset(windowWidth);
  const tabBarHeight = getTabBarFloatHeight(windowWidth);
  const tabBarLeft = Math.max(insets.left, tabBarSideInset);
  const tabBarRight = Math.max(insets.right, tabBarSideInset);

  return (
    <Tabs
      detachInactiveScreens={false}
      tabBar={(props) => <SwipingTabBar {...props} />}
      screenOptions={{
        tabBarButton: (props) => <GlassTabBarButton {...props} />,
        tabBarActiveTintColor: Colors[scheme].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarShowLabel: true,
        sceneStyleInterpolator: forTabHorizontalSlide,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: Platform.OS === 'web' ? 220 : 280,
            easing: Easing.out(Easing.cubic),
          },
        },
        tabBarStyle: {
          position: 'absolute',
          left: tabBarLeft,
          right: tabBarRight,
          bottom: tabBarBottom,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: TAB_FLOAT_RADIUS,
          borderCurve: 'continuous',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.22,
              shadowRadius: 28,
            },
            android: {
              elevation: 16,
            },
            default: {},
          }),
        },
        tabBarItemStyle: {
          borderRadius: TAB_FLOAT_RADIUS,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <TabBarGlassBackground borderRadius={TAB_FLOAT_RADIUS} />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabDiscover'),
          tabBarLabel: t('tabDiscover'),
          tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
          headerRight: () => (
            <Link href="/search" asChild>
              <GlassButton mode="icon" variant="neutral" style={{ marginRight: 12 }}>
                <FontAwesome name="search" size={20} color={Colors[scheme].text} />
              </GlassButton>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: t('tabMap'),
          tabBarLabel: t('tabMap'),
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: t('tabStore'),
          tabBarLabel: t('tabStore'),
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabLogin'),
          tabBarLabel: t('tabLogin'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerRight: () => (
            <Link href={'/settings' as Href} asChild>
              <GlassButton mode="icon" variant="neutral" style={{ marginRight: 12 }}>
                <FontAwesome name="cog" size={20} color={Colors[scheme].text} />
              </GlassButton>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}
