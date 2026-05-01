import type { ExpoConfig } from 'expo/config';

/**
 * Inject map API keys for standalone / EAS builds.
 *
 * Supported env vars (priority high -> low):
 * - Android: ANDROID_GOOGLE_MAPS_API_KEY -> GOOGLE_MAPS_API_KEY
 * - iOS: IOS_GOOGLE_MAPS_API_KEY -> GOOGLE_MAPS_API_KEY
 *
 * Notes:
 * - iOS can use Apple Map without any key (default provider).
 * - Android Google provider needs a valid Google Maps key in release/dev builds.
 */
export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const androidGoogleMapsApiKey =
    process.env.ANDROID_GOOGLE_MAPS_API_KEY?.trim() ?? process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const iosGoogleMapsApiKey =
    process.env.IOS_GOOGLE_MAPS_API_KEY?.trim() ?? process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const plugins = Array.isArray(config.plugins) ? [...config.plugins] : [];

  if (!plugins.includes('expo-font')) {
    plugins.push('expo-font');
  }
  if (!plugins.includes('expo-web-browser')) {
    plugins.push('expo-web-browser');
  }

  if (!androidGoogleMapsApiKey && !iosGoogleMapsApiKey) {
    return {
      ...config,
      plugins,
    };
  }

  const iosConfig = (config.ios as { config?: Record<string, unknown> } | undefined)?.config ?? {};

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(androidGoogleMapsApiKey
          ? {
              googleMaps: {
                apiKey: androidGoogleMapsApiKey,
              },
            }
          : {}),
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...iosConfig,
        ...(iosGoogleMapsApiKey ? { googleMapsApiKey: iosGoogleMapsApiKey } : {}),
      },
    },
  };
};
