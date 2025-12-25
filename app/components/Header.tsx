'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return null; // Don't show header on home page
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🏠</span>
          <span className="hidden sm:inline">Home</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/writing"
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/writing'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Writing
          </Link>
          <Link
            href="/goals"
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/goals'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Goals
          </Link>
          <Link
            href="/history"
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/history'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            History
          </Link>
          <Link
            href="/flashcards"
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/flashcards'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Flashcards
          </Link>
        </nav>
      </div>
    </header>
  );
}
