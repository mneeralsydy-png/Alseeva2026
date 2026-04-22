import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alshifa.quran.center',
  appName: 'مركز الشفاء',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0d3d2e',
      showSpinner: true,
      spinnerColor: '#d4af37',
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
