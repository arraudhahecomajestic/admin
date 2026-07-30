import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RENORUMAH — Ubah suai rumah, telus & terjamin',
  description: 'Platform ubah suai rumah AI. Sebut harga pantas, kontraktor tersaring, waranti.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-soft text-ink font-sans">{children}</body>
    </html>
  );
}
