import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alshifa.hifz.app',
  appName: 'مركز الشفاء',
  webDir: 'out',
  server: {
    // Allow navigation to external URLs (needed for media, OAuth, etc.)
    allowNavigation: [
      'https://ntshduvxdehefxmchusw.supabase.co',
      'https://api.telegram.org',
      'https://abualzahracom.online',
    ],
    // Use Android's cleartext (HTTP) support for the local server
    androidScheme: 'https',
  },
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
