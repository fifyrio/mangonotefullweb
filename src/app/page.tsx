'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-mango-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-2xl">🥭</span>
          </div>
          <h1 className="ml-4 text-4xl font-bold text-white">MangoNote</h1>
        </div>
        
        <p className="text-gray-400 mb-8 max-w-md">
          Transform any source into a comprehensive study set with AI-powered note generation, mind maps, flashcards, and quizzes.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup" className="btn-primary">
            Get Started
          </Link>
          <Link href="/auth/signin" className="btn-secondary">
            Sign In
          </Link>
        </div>
        
        <div className="mt-8">
          <Link href="/dashboard" className="text-mango-500 hover:text-mango-400 text-sm">
            Skip to Dashboard (Demo)
          </Link>
        </div>
      </div>
    </div>
  )
}
