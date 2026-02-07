import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import '@/index.css';

export const metadata: Metadata = {
  title: 'LlarJove — Habitatge, sense perdre\'t',
  description:
    'Te guiamos paso a paso para encontrar vivienda en Cataluña y entender ayudas y derechos, con información verificable y con fuentes.',
  openGraph: {
    title: 'LlarJove — Habitatge, sense perdre\'t',
    description:
      'Te guiamos paso a paso para encontrar vivienda en Cataluña y entender ayudas y derechos, con información verificable y con fuentes.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body className={`min-h-screen antialiased ${GeistSans.className}`}>{children}</body>
    </html>
  );
}
