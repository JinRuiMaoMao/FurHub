import type { ExpoConfig } from 'expo/config';

/**
 * Injects Google Maps API keys for standalone / EAS builds (required by react-native-maps on Android).
 * Set `GOOGLE_MAPS_API_KEY` in Expo: Project → Environment variables (or EAS Secrets), then rebuild.
 */
export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';

  if (!googleMapsApiKey) {
    return config;
  }

  const iosConfig = (config.ios as { config?: Record<string, unknown> } | undefined)?.config ?? {};

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...iosConfig,
        googleMapsApiKey: googleMapsApiKey,
      },
    },
  };
};
