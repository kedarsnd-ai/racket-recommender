/**
 * Expo Go: set EXPO_PUBLIC_API_URL to your machine's LAN IP + Next port, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.50:3000 npx expo start
 * (Phone and computer must be on the same Wi‑Fi.)
 */
module.exports = {
  expo: {
    name: 'Racket IQ',
    slug: 'racket-iq',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'racket-iq',
    userInterfaceStyle: 'dark',
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.racketiq.app'
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1d4e2a'
      },
      package: 'com.racketiq.app'
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || ''
    }
  }
};
