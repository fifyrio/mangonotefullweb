import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import {ReactNode} from 'react';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MangoNote - AI-Powered Study App',
  description: 'Transform any source into comprehensive study materials with AI-powered note generation, mind maps, flashcards, and quizzes.',
}

type Props = {
  children: ReactNode;
};

export default function RootLayout({children}: Props) {
  return (
    <html className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}