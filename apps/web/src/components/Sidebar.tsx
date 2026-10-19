import React from 'react';
import { 
  Home, 
  Users, 
  Library, 
  Music, 
  Settings, 
  User,
  FolderDown,
  ChevronRight,
  Compass
} from 'lucide-react';
import { formatBytes } from '@melody/core';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  storageUsed: number;
  onOpenYouTubeModal?: () => void;
  userEmail?: string | null;
  userAvatar?: string | null;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  storageUsed,
  onOpenYouTubeModal,
  userEmail,
  userAvatar,
  onOpenAuth,
}) => {
  const navItems = [
    { id: 'home',     label: 'Home',        icon: Home },
    { id: 'explore',  label: 'Explore',     icon: Compass },
    { id: 'artists',  label: 'Artists',     icon: Users },
    { id: 'library',  label: 'Library',     icon: Library },
  ];

  const storagePercent = Math.min(100, Math.max(2, (storageUsed / (500 * 1024 * 1024)) * 100));

  return (
    <aside className="w-56 bg-bg-surface flex flex-col h-full shrink-0 select-none border-r border-bg-border">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-glow-sm shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="font-display font-bold text-sm text-white tracking-tight">Melody</span>
            <span className="block text-[10px] text-content-secondary font-medium mt-0.5">Music Streaming</span>
          </div>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-accent/15 text-white'
                  : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-accent-light' : 'text-current'}`} />
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-light" />}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-4 border-t border-bg-border" />

      {/* Downloads button (always visible) */}
      <div className="px-3 mt-4">
        <button
          onClick={() => onNavigate('offline')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
            currentView === 'offline'
              ? 'bg-accent/15 text-white'
              : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.04]'
          }`}
        >
          <FolderDown className="w-4 h-4 shrink-0 text-cyan-400/70" />
          <span>Downloads</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Storage Footer */}
      <div className="p-4 border-t border-bg-border space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-content-secondary font-medium">Device Storage</span>
            <span className="text-content-primary font-mono">{formatBytes(storageUsed)}</span>
          </div>
          <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-cyan-DEFAULT rounded-full transition-all duration-700"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        {/* Sign-in / Profile */}
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 text-content-secondary hover:text-content-primary hover:bg-white/[0.04] mb-1"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userEmail || 'Profile'}
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {userEmail ? userEmail[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
            )}
            <span className="truncate max-w-[110px]">
              {userEmail ? userEmail.split('@')[0] : 'Sign in'}
            </span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
          </button>
        )}

        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
            currentView === 'settings'
              ? 'text-white bg-white/[0.06]'
              : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.04]'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
