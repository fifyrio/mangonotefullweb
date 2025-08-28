'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface SidebarProps {
  className?: string
  isLoggedIn?: boolean
}

export default function Sidebar({ className = '', isLoggedIn = false }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')
  const tAuth = useTranslations('auth.signIn')

  const navigationItems = [
    {
      name: t('allNotes'),
      href: '/dashboard',
      icon: '📄',
      active: pathname === '/dashboard'
    },
    {
      name: 'Review Flashcards',
      href: '/flashcards',
      icon: '🎴',
      active: pathname === '/flashcards'
    },
    {
      name: t('createNewFolder'),
      href: '/dashboard/folders/new',
      icon: '📁',
      active: false
    },
    {
      name: t('quizzes'),
      href: '/dashboard/quizzes',
      icon: '❓',
      active: pathname === '/dashboard/quizzes'
    },
    {
      name: t('calendar'),
      href: '/dashboard/calendar',
      icon: '📅',
      active: pathname === '/dashboard/calendar'
    }
  ]

  return (
    <aside className={`glass-effect h-full flex flex-col ${className} shadow-2xl`}>
      {/* Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-mango-500 to-mango-400 rounded-2xl flex items-center justify-center shadow-lg shadow-mango-500/30">
            <span className="text-black font-bold text-lg">🥭</span>
          </div>
          <h1 className="ml-4 text-2xl font-bold text-gradient">Mango AI</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-3">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`sidebar-item ${item.active ? 'active' : ''}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600/20 to-gray-700/20">
                  <span className="text-lg">{item.icon}</span>
                </div>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Support */}
      <div className="px-6 py-4 border-t border-white/5">
        <Link href="/support" className="sidebar-item">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600/20 to-gray-700/20">
            <span className="text-lg">❓</span>
          </div>
          <span className="text-sm font-medium">{t('support')}</span>
        </Link>
      </div>

      {/* Usage meter and upgrade - only show when logged in */}
      {isLoggedIn && (
        <div className="px-6 py-5 border-t border-white/5">
          <div className="mb-5">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span className="font-medium">{t('usageMeter')}</span>
              <span className="text-mango-400 font-semibold">3 / 5</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-mango-500 to-mango-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-mango-500/30" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <span>🔓</span>
{t('upgradePlan')}
          </button>
        </div>
      )}

      {/* User profile or Sign In */}
      <div className="px-6 py-5 border-t border-white/5">
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600/80 to-gray-700/80 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-sm">SC</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Sophia Carter</p>
              <p className="text-gray-400 text-xs mt-0.5">sophia.carter@email.com</p>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-xl hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        ) : (
          <Link href="/auth/signin" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <span>🔑</span>
            {tAuth('signIn')}
          </Link>
        )}
      </div>
    </aside>
  )
}