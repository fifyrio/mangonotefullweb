'use client'

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{locale: string}>;
};

export default function LandingPage({params}: Props) {
  // Enable static rendering
  // setRequestLocale(params.locale);
  
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen bg-dark-primary text-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-8">
            <span className="text-gradient">Mango</span>
            <span className="text-white">Note</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Transform any source into comprehensive study materials with AI-powered note generation, mind maps, flashcards, and quizzes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/dashboard"
              className="btn-primary text-lg px-8 py-4 hover:scale-105 transition-transform duration-300"
            >
              Get Started
            </Link>
            
            <Link 
              href="/auth/signin"
              className="btn-secondary text-lg px-8 py-4 hover:scale-105 transition-transform duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gradient">
            AI-Powered Study Tools
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className="text-xl font-bold mb-4 text-white">Mind Maps</h3>
              <p className="text-gray-400">Visualize complex concepts with AI-generated mind maps</p>
            </div>
            
            <div className="card p-8 text-center group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🎴</div>
              <h3 className="text-xl font-bold mb-4 text-white">Flashcards</h3>
              <p className="text-gray-400">Smart flashcards for effective memorization</p>
            </div>
            
            <div className="card p-8 text-center group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">❓</div>
              <h3 className="text-xl font-bold mb-4 text-white">Quizzes</h3>
              <p className="text-gray-400">Test your knowledge with adaptive quizzes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}