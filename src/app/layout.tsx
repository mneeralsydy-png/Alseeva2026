import type { Metadata, Viewport } from "next";
import { Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700", "800"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  themeColor: "#1a5f4a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "مركز الشفاء | تحفيظ القرآن الكريم",
  description: "نظام إدارة مراكز تحفيظ القرآن الكريم - مركز الشفاء لتحفيظ القرآن الكريم",
  manifest: "/manifest.json",
  icons: {
    icon: "/center-logo.png",
    apple: "/center-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "مركز الشفاء",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "مركز الشفاء لتحفيظ القرآن الكريم",
    description: "نظام إدارة مراكز تحفيظ القرآن الكريم",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/center-logo.png" />
        <link rel="apple-touch-icon" href="/center-logo.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${cairo.variable} ${amiri.variable} antialiased font-[family-name:var(--font-cairo)]`}
        style={{ backgroundColor: '#f8f9fa' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
