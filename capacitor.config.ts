import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xandeflix.prebuilt',
  appName: 'Xandeflix Prebuilt',
  webDir: 'dist',
  // Disable verbose bridge payload logs during large catalog imports.
  // Keep plugin calls and application-level error notices unchanged.
  loggingBehavior: 'none',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
