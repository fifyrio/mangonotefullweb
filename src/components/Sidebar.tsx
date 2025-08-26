'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      name: 'All notes',
      href: '/dashboard',
      icon: '📄',
      active: pathname === '/dashboard'
    },
    {
      name: 'Create new folder',
      href: '/dashboard/folders/new',
      icon: '📁',
      active: false
    },
    {
      name: 'Quizzes',
      href: '/dashboard/quizzes',
      icon: '❓',
      active: pathname === '/dashboard/quizzes'
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: '📅',
      active: pathname === '/dashboard/calendar'
    }
  ]

  return (
    <aside className={`bg-dark-secondary h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-mango-500 rounded flex items-center justify-center">
            <span className="text-black font-bold text-sm">🥭</span>
          </div>
          <h1 className="ml-3 text-xl font-bold text-white">Mango AI</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`sidebar-item ${item.active ? 'active' : ''}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Support */}
      <div className="p-4 border-t border-gray-700">
        <Link href="/support" className="sidebar-item">
          <span className="text-lg">❓</span>
          <span className="text-sm font-medium">Support</span>
        </Link>
      </div>

      {/* Usage meter and upgrade */}
      <div className="p-4 border-t border-gray-700">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Usage Meter</span>
            <span>3 / 5</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-mango-500 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <span>🔓</span>
          Upgrade plan
        </button>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">SC</span>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Sophia Carter</p>
            <p className="text-gray-400 text-xs">sophia.carter@email.com</p>
          </div>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}