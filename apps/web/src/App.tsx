import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { QueuePanel } from './components/QueuePanel';
import { LyricsModal } from './components/LyricsModal';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { AuthModal } from './components/AuthModal';
import { YouTubePlayerHost } from './components/YouTubePlayerHost';
import { YouTubeImportModal } from './components/YouTubeImportModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { OfflinePage } from './pages/OfflinePage';
import { SettingsPage } from './pages/SettingsPage';
import { MyMusicPage } from './pages/MyMusicPage';
import { ArtistPage } from './pages/ArtistPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { usePlayer } from './context/PlayerContext';
import { Track } from '@melody/core';
import { offlineStorage } from './services/offlineStorage';
import { supabase } from './services/supabaseClient';
import { Home, Users, Library, Youtube, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const { currentTrack, isPlaying, playRandomFromHistory } = usePlayer();
  const [currentView, setCurrentView] = useState<'home' | 'explore' | 'artists' | 'search' | 'my-music' | 'library' | 'offline' | 'settings' | 'artist'>('home');
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [playlistTargetTrack, setPlaylistTargetTrack] = useState<Track | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('melody_sidebar_collapsed') === 'true';
  });

  const handleOpenArtist = (name: string) => {
    setSelectedArtist(name);
    setCurrentView('artist');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('melody_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  // Storage usage
  const [storageUsed, setStorageUsed] = useState(0);

  // User auth state
  const [currentUser, setCurrentUser] = useState<{ email: string; username: string; avatarUrl?: string } | null>(() => {
    const saved = localStorage.getItem('melody_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Favorites state
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('melody_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const favoriteIds = new Set(favoriteTracks.map((t) => t.id));

  // Playlists state
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string; tracks: Track[] }>>(() => {
    const saved = localStorage.getItem('melody_playlists');
    return saved ? JSON.parse(saved) : [
      { id: 'fav_mix', name: 'My Chill Mix', tracks: [] },
    ];
  });

  // Update browser document title on track changes
  useEffect(() => {
    if (currentTrack) {
      document.title = `${isPlaying ? '▶' : '⏸'} ${currentTrack.title} • ${currentTrack.artist} | Melody`;
    } else {
      document.title = 'Melody — Free Personal Music Streaming';
    }
  }, [currentTrack, isPlaying]);

  // Refresh storage
  const refreshStorage = async () => {
    const est = await offlineStorage.getStorageEstimate();
    setStorageUsed(est.usedBytes);
  };

  useEffect(() => {
    refreshStorage();

    if (supabase) {
      // Listen for OAuth redirects (such as Google Sign-in)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata;
          const user = {
            email: session.user.email || '',
            username: userMeta?.full_name || userMeta?.name || userMeta?.username || session.user.email?.split('@')[0] || 'User',
          };
          setCurrentUser(user);
          localStorage.setItem('melody_user', JSON.stringify(user));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Save favorites & playlists to localStorage
  useEffect(() => {
    localStorage.setItem('melody_favorites', JSON.stringify(favoriteTracks));
  }, [favoriteTracks]);

  useEffect(() => {
    localStorage.setItem('melody_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const toggleFavorite = (track: Track) => {
    setFavoriteTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const handleCreatePlaylist = (name: string) => {
    const newPl = {
      id: `pl_${Date.now()}`,
      name,
      tracks: [],
    };
    setPlaylists((prev) => [...prev, newPl]);
  };

  const handleAddTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId && !pl.tracks.some((t) => t.id === track.id)
          ? { ...pl, tracks: [track, ...pl.tracks] }
          : pl
      )
    );
  };

  const handleRemoveFromPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId
          ? { ...pl, tracks: pl.tracks.filter((t) => t.id !== track.id) }
          : pl
      )
    );
  };

  const handleLogin = (email: string, username?: string, avatarUrl?: string) => {
    const user = { email, username: username || email.split('@')[0], avatarUrl };
    setCurrentUser(user);
    localStorage.setItem('melody_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('melody_user');
  };

  const isCurrentFavorite = currentTrack ? favoriteIds.has(currentTrack.id) : false;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-base text-content-primary font-sans flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div
          className={`hidden md:block h-full overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${
            sidebarCollapsed ? 'w-0' : 'w-56'
          }`}
        >
          <Sidebar
            currentView={currentView}
            onNavigate={(v: any) => setCurrentView(v)}
            storageUsed={storageUsed}
            userEmail={currentUser?.email}
            userAvatar={currentUser?.avatarUrl}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </div>

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg-base relative">
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => setCurrentView('search')}
            activeView={currentView}
            onNavigate={(v: any) => setCurrentView(v)}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            onPlayRandomFromHistory={playRandomFromHistory}
          />

          <div className="flex-1 overflow-y-auto">
            {currentView === 'home' && (
              <HomePage
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onNavigateToSearch={(genre) => {
                  if (genre) setSearchQuery(genre);
                  setCurrentView('search');
                }}
                onOpenYouTubeModal={() => setIsYouTubeModalOpen(true)}
                onAddToPlaylist={(track) => {
                  setPlaylistTargetTrack(track);
                  setIsAddToPlaylistOpen(true);
                }}
                onOpenArtist={handleOpenArtist}
              />
            )}

            {currentView === 'explore' && (
              <ExplorePage
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onNavigateToSearch={(q) => {
                  setSearchQuery(q);
                  setCurrentView('search');
                }}
                onAddToPlaylist={(track) => {
                  setPlaylistTargetTrack(track);
                  setIsAddToPlaylistOpen(true);
                }}
                onOpenArtist={handleOpenArtist}
              />
            )}

            {currentView === 'artist' && (
              <ArtistPage
                artistName={selectedArtist}
                onBack={() => setCurrentView('artists')}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {currentView === 'artists' && (
              <ArtistsPage
                onOpenArtist={handleOpenArtist}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onAddToPlaylist={(track) => {
                  setPlaylistTargetTrack(track);
                  setIsAddToPlaylistOpen(true);
                }}
              />
            )}

            {currentView === 'search' && (
              <SearchPage
                initialQuery={searchQuery}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onOpenYouTubeModal={() => setIsYouTubeModalOpen(true)}
                onOpenArtist={handleOpenArtist}
              />
            )}

            {currentView === 'my-music' && (
              <MyMusicPage
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {currentView === 'library' && (
              <LibraryPage
                favoriteTracks={favoriteTracks}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                playlists={playlists}
                onCreatePlaylist={handleCreatePlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                onNavigateToDiscover={() => setCurrentView('home')}
              />
            )}

            {currentView === 'offline' && (
              <OfflinePage
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onRefreshStorage={refreshStorage}
              />
            )}

            {currentView === 'settings' && <SettingsPage />}
          </div>
        </main>

        {/* Slide-over Queue Panel */}
        <QueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex items-center justify-around bg-bg-surface border-t border-bg-border py-2 px-2 z-20 safe-area-bottom">
        {[
          { id: 'home',     label: 'Home',    icon: Home },
          { id: 'explore',  label: 'Explore', icon: Compass },
          { id: 'artists',  label: 'Artists', icon: Users },
          { id: 'library',  label: 'Library', icon: Library },
        ].map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                active ? 'text-white bg-accent/15' : 'text-content-secondary'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-accent-light' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsYouTubeModalOpen(true)}
          className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-[11px] font-medium text-content-secondary"
        >
          <Youtube className="w-5 h-5 text-[#ff0000]" />
          <span>YouTube</span>
        </button>
      </nav>

      {/* Persistent Bottom Player Bar */}
      <PlayerBar
        onToggleLyrics={() => setIsLyricsOpen(!isLyricsOpen)}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        onToggleFullscreen={() => setIsFullscreenOpen(true)}
        onOpenYouTubeModal={() => setIsYouTubeModalOpen(true)}
        onOpenAddToPlaylist={() => {
          setPlaylistTargetTrack(currentTrack);
          setIsAddToPlaylistOpen(true);
        }}
        isLyricsOpen={isLyricsOpen}
        isQueueOpen={isQueueOpen}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack)}
      />

      {/* Persistent YouTube Player Host (Floating PiP & Audio Engine) */}
      <YouTubePlayerHost 
        onExpandFullscreen={() => setIsFullscreenOpen(true)} 
        isFullscreenOpen={isFullscreenOpen}
      />

      {/* YouTube Importer Modal */}
      <YouTubeImportModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onAddToFavorites={toggleFavorite}
        isFavorite={(id) => favoriteIds.has(id)}
      />

      {/* Synchronized Karaoke Lyrics Modal */}
      <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />

      {/* Fullscreen Now Playing Modal */}
      <FullscreenPlayer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack)}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => { setIsAddToPlaylistOpen(false); setPlaylistTargetTrack(null); }}
        track={playlistTargetTrack ?? currentTrack}
        playlists={playlists}
        onAddToPlaylist={handleAddTrackToPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Supabase / Session Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
};
