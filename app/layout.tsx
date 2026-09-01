import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const title = '胡佳仪 · 2027 秋招投递台';
const description =
  'B端产品、能源电力、AI+能源与知识图谱方向的校园招聘机会和私人投递进度看板。';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = (forwardedHost || requestHeaders.get('host') || 'localhost:3000')
    .split(',')[0]
    .trim();
  const hostname = host.split(':')[0].toLowerCase();
  const trustedHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.sites.openai.com') ||
    hostname.endsWith('.chatgpt.site');
  const forwardedProto = requestHeaders
    .get('x-forwarded-proto')
    ?.split(',')[0]
    .trim();
  const protocol =
    hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'http'
      : forwardedProto === 'http'
        ? 'http'
        : 'https';
  const origin = trustedHost
    ? `${protocol}://${host}`
    : 'https://hu-jiayi-2027-job-tracker.atkaescalitfee.chatgpt.site';
  const image = `${origin}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        { url: image, width: 1200, height: 630, alt: '2027 秋招投递台' },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
