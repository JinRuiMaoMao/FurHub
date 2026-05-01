import { Link, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { GlassButton } from '@/components/GlassButton';

export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string },
) {
  const { href, children, style } = props;
  return (
    <Link
      asChild
      href={href as Href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          void WebBrowser.openBrowserAsync(href);
        }
      }}>
      <GlassButton compact variant="neutral" style={style as StyleProp<ViewStyle>}>
        {children}
      </GlassButton>
    </Link>
  );
}
