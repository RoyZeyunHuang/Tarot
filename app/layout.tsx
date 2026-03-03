import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '塔罗解读',
  description: 'AI 驱动的塔罗牌解读应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
