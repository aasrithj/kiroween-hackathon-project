import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Upside Down Escape | Kiroween 2026',
  description: 'A dual-dimension Halloween experience. Sign up for the event... if you dare to find the hidden door.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Creepster&family=Inter:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
