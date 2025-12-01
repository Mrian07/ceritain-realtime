'use client';

import { Phone, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';

interface HeaderBarProps {
  onCallClick: () => void;
}

export function HeaderBar({ onCallClick }: HeaderBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--header-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Avatar & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-md">
            AI
          </div>
          <div>
            <h1 className="font-semibold text-base">AI Assistant</h1>
            <p className="text-xs opacity-60">Online</p>
          </div>
        </div>

        {/* Right: Call & Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCallClick}
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Call"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
