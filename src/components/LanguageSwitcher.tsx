'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const SUPPORTED_LOCALES = languages.map(lang => lang.code);

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLanguageChange = (newLocale: string) => {
    // Remove current locale from pathname
    const segments = pathname.split('/').filter(Boolean);
    const pathWithoutLocale = segments.filter(segment => !SUPPORTED_LOCALES.includes(segment));
    
    // Create new path with new locale - handle 'as-needed' prefix correctly
    const newPath = `/${newLocale}${pathWithoutLocale.length > 0 ? `/${pathWithoutLocale.join('/')}` : ''}`;
    
    router.push(newPath);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-tertiary hover:bg-dark-surface transition-colors focus:outline-none focus:ring-2 focus:ring-mango-500 focus:ring-offset-2 focus:ring-offset-dark-primary"
        aria-label={`Current language: ${currentLanguage?.name}. Click to change language`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-lg" role="img" aria-label={`${currentLanguage?.name} flag`}>
          {currentLanguage?.flag}
        </span>
        <span className="text-sm font-medium">{currentLanguage?.code.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-dark-tertiary rounded-lg shadow-lg border border-dark-surface z-50"
          role="listbox"
          aria-label="Select language"
          onKeyDown={handleKeyDown}
        >
          <div className="py-1">
            {languages.map((language, index) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-dark-surface transition-colors focus:outline-none focus:bg-dark-surface ${
                  locale === language.code ? 'text-mango-500 bg-dark-surface' : 'text-gray-300'
                }`}
                role="option"
                aria-selected={locale === language.code}
                tabIndex={isOpen ? 0 : -1}
              >
                <span className="text-lg" role="img" aria-label={`${language.name} flag`}>
                  {language.flag}
                </span>
                <span className="flex-1 text-left">{language.name}</span>
                {locale === language.code && (
                  <svg 
                    className="w-4 h-4 ml-auto" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}