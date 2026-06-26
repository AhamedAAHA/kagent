import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KAgent — Sri Lanka\'s AI Life Shopping Concierge',
  description: 'Tell KAgent what\'s happening in your life. Our AI agents build your complete shopping plan with real Sri Lankan products, festivals, and local vendors.',
  keywords: ['Sri Lanka', 'shopping', 'AI', 'Kapruka', 'agent', 'concierge', 'Sinhala'],
  openGraph: {
    title: 'KAgent',
    description: 'Sri Lanka\'s AI Life Shopping Concierge',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
