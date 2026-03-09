import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';

export const metadata: Metadata = {
  title: 'AutoIndex',
  description: 'AI Autonomous Cross-Chain Index Fund Manager',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang='en'>
      <body className='antialiased'>
        <Navbar />
        <MaxWidthWrapper>
          {children}
        </MaxWidthWrapper>
      </body>
    </html>
  );
}
