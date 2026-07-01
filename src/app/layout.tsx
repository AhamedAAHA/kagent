import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "KAgent — Sri Lanka's AI Life Shopping Concierge",
  description: "Tell KAgent what's happening in your life. 7 AI agents build your complete shopping plan with real Sri Lankan products, instant bundles, and local vendors.",
  keywords: ['Sri Lanka', 'shopping', 'AI', 'agent', 'concierge', 'Sinhala', 'Colombo'],
  manifest: '/manifest.json',
  themeColor: '#7C3AED',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KAgent',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: '#04020C' }}>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Syncopate:wght@400;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KAgent" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#7C3AED" />
      </head>
      <body>{children}</body>
    </html>
  );
}
