'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')
  const tAuth = useTranslations('auth.signIn')
  const { user, loading, signOut } = useAuth()
  const isLoggedIn = !!user

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
      <div className="px-6 py-5 border-t border-border-light bg-surface-secondary">
        {loading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-border-medium rounded-2xl"></div>
            <div className="flex-1">
              <div className="h-4 bg-border-medium rounded w-24 mb-2"></div>
              <div className="h-3 bg-border-medium rounded w-32"></div>
            </div>
          </div>
        ) : isLoggedIn ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-mango rounded-2xl flex items-center justify-center shadow-mango">
              <span className="text-text-primary font-semibold text-sm">
                {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-text-primary text-sm font-semibold">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
              </p>
              <p className="text-text-muted text-xs mt-0.5">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={signOut}
                className="text-text-muted hover:text-text-primary transition-colors duration-200 p-2 rounded-xl hover:bg-surface-tertiary"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
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