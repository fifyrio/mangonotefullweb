'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-mango-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-mango-400/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="text-center relative z-10 max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-mango-500 to-mango-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-mango-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-black font-bold text-3xl">🥭</span>
          </div>
          <h1 className="ml-6 text-6xl font-bold text-gradient">MangoNote</h1>
        </div>
        
        <p className="text-gray-300 mb-12 text-xl leading-relaxed max-w-lg mx-auto">
          Transform any source into a comprehensive study set with AI-powered note generation, mind maps, flashcards, and quizzes.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
          <Link href="/auth/signup" className="btn-primary text-lg px-10 py-4">
            Get Started
          </Link>
          <Link href="/auth/signin" className="btn-secondary text-lg px-10 py-4">
            Sign In
          </Link>
        </div>
        
        <div className="mt-12">
          <Link href="/dashboard" className="text-mango-400 hover:text-mango-300 font-medium transition-colors duration-300">
            Skip to Dashboard (Demo) →
          </Link>
        </div>
      </div>
    </div>
  )
}
