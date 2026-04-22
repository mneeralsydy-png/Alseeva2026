import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-3b9fa81c-f2bc-47b7-bb2a-f19de35f64c3.space.z.ai',
  ],
  // When BUILD_TYPE=apk, use static export for Capacitor (offline-capable APK)
  // Otherwise, use standalone for server deployment
  ...(process.env.BUILD_TYPE === 'apk' ? { output: "export" as const } : { output: "standalone" as const }),
};

export default nextConfig;
