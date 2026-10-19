import React from 'react';
import { Search, PanelLeftClose, PanelLeftOpen, Dices, Sparkles } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onPlayRandomFromHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeView,
  onNavigate,
  sidebarCollapsed,
  onToggleSidebar,
  onPlayRandomFromHistory,
}) => {
  return (
    <header className="h-14 px-4 border-b border-bg-border bg-bg-surface/80 backdrop-blur-xl flex items-center sticky top-0 z-20 shrink-0 relative">
      {/* Left — sidebar toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-content-tertiary hover:text-content-primary hover:bg-white/[0.06] transition-all duration-200"
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Center — search bar (absolutely centered) */}
      <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-content-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (activeView !== 'search') onNavigate('search');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
            }}
            placeholder="Search songs, artists…"
            className="w-full h-9 bg-bg-card/80 border border-bg-border focus:border-white/15 focus:bg-bg-card focus:ring-1 focus:ring-white/10 rounded-xl pl-9 pr-4 text-[13px] text-content-primary placeholder-content-tertiary outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Right — Random Song based on listening history */}
      {onPlayRandomFromHistory && (
        <div className="ml-auto relative z-10 flex items-center">
          <button
            onClick={onPlayRandomFromHistory}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-accent/15 hover:bg-accent/25 border border-accent/25 text-accent-light text-[11px] font-semibold transition hover:scale-105 active:scale-95 shadow-glow-sm"
            title="Play a random surprise track based on your recently played music"
          >
            <Dices className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="hidden sm:inline">Surprise Mix</span>
          </button>
        </div>
      )}
    </header>
  );
};
