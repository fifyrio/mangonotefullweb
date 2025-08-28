import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MangoNote - AI-Powered Study Dashboard',
  description: 'Transform any source into comprehensive study materials with AI-powered note generation, mind maps, flashcards, and quizzes.',
  keywords: ['AI notes', 'study tools', 'flashcards', 'mind maps', 'quiz generator', 'learning'],
  openGraph: {
    title: 'MangoNote Dashboard',
    description: 'AI-powered study materials generator',
    type: 'website',
    images: ['/og-dashboard.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangoNote Dashboard',
    description: 'AI-powered study materials generator'
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}