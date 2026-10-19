import React, { useState } from 'react';
import { Library, Heart, ListPlus, Plus, Play, Music } from 'lucide-react';
import { Track } from '@melody/core';
import { TrackTable } from '../components/TrackTable';
import { usePlayer } from '../context/PlayerContext';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
}

interface LibraryPageProps {
  favoriteTracks: Track[];
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
  playlists: Playlist[];
  onCreatePlaylist: (name: string) => void;
  onRemoveFromPlaylist: (playlistId: string, track: Track) => void;
  onNavigateToDiscover: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  favoriteTracks,
  favoriteIds,
  onToggleFavorite,
  playlists,
  onCreatePlaylist,
  onRemoveFromPlaylist,
  onNavigateToDiscover,
}) => {
  const { playTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-6 anim-fade">
      {/* ── Header ── */}
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-bg-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Your Library</h2>
          <p className="text-[13px] text-content-secondary mt-0.5">Liked songs and your playlists</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-accent hover:bg-accent-light text-white text-[13px] font-semibold transition shadow-glow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      <div className="px-6 md:px-10 pt-5 space-y-6">
        {/* ── Tabs ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('favorites'); setSelectedPlaylistId(null); }}
            className={`flex items-center gap-2 h-8 px-4 rounded-lg text-[13px] font-medium transition ${
              activeTab === 'favorites' && !selectedPlaylistId
                ? 'bg-accent/15 text-white border border-accent/25'
                : 'text-content-secondary hover:text-content-primary hover:bg-bg-card border border-transparent'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-current" />
            Liked Songs <span className="text-content-tertiary text-[11px]">({favoriteTracks.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('playlists'); setSelectedPlaylistId(null); }}
            className={`flex items-center gap-2 h-8 px-4 rounded-lg text-[13px] font-medium transition ${
              activeTab === 'playlists' && !selectedPlaylistId
                ? 'bg-accent/15 text-white border border-accent/25'
                : 'text-content-secondary hover:text-content-primary hover:bg-bg-card border border-transparent'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5" />
            Playlists <span className="text-content-tertiary text-[11px]">({playlists.length})</span>
          </button>
        </div>

        {/* ── Content ── */}
        {selectedPlaylist ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedPlaylistId(null)}
                  className="text-[12px] text-accent-light hover:underline mb-2 block"
                >
                  ← All playlists
                </button>
                <h3 className="font-display font-bold text-xl text-white">{selectedPlaylist.name}</h3>
                <p className="text-[12px] text-content-secondary mt-0.5">
                  {selectedPlaylist.tracks.length} track{selectedPlaylist.tracks.length !== 1 ? 's' : ''}
                </p>
              </div>
              {selectedPlaylist.tracks.length > 0 && (
                <button
                  onClick={() => playTrack(selectedPlaylist.tracks[0], selectedPlaylist.tracks)}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl bg-white text-black font-semibold text-[13px] hover:scale-105 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-black" /> Play All
                </button>
              )}
            </div>
            <div className="rounded-xl bg-bg-surface border border-bg-border p-2">
              <TrackTable
                tracks={selectedPlaylist.tracks}
                favoriteIds={favoriteIds}
                onToggleFavorite={onToggleFavorite}
                onRemoveTrack={(track) => onRemoveFromPlaylist(selectedPlaylist.id, track)}
              />
            </div>
          </div>

        ) : activeTab === 'favorites' ? (
          favoriteTracks.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Heart className="w-12 h-12 text-content-tertiary mx-auto" />
              <h4 className="text-base font-semibold text-white">No liked songs yet</h4>
              <p className="text-[13px] text-content-secondary max-w-xs mx-auto">
                Click the heart on any track to save it here permanently.
              </p>
              <button
                onClick={onNavigateToDiscover}
                className="h-9 px-5 rounded-xl bg-accent/15 border border-accent/25 text-accent-light text-[13px] font-semibold hover:bg-accent/20 transition"
              >
                Discover Music
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-bg-surface border border-bg-border p-2">
              <TrackTable tracks={favoriteTracks} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} />
            </div>
          )

        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                className="glass-card p-4 rounded-xl text-left group hover:border-accent/30 transition-all"
              >
                <div className="aspect-square rounded-lg bg-bg-card border border-bg-border flex items-center justify-center mb-3 group-hover:scale-[1.02] transition-transform">
                  <Music className="w-8 h-8 text-content-tertiary group-hover:text-accent-light transition-colors" />
                </div>
                <h4 className="text-[13px] font-semibold text-content-primary truncate">{pl.name}</h4>
                <p className="text-[11px] text-content-secondary mt-0.5">{pl.tracks.length} tracks</p>
              </button>
            ))}

            <button
              onClick={() => setShowCreateModal(true)}
              className="aspect-[4/5] rounded-xl border-2 border-dashed border-bg-border hover:border-accent/35 flex flex-col items-center justify-center gap-2 text-content-tertiary hover:text-content-primary transition-all"
            >
              <Plus className="w-8 h-8" />
              <span className="text-[12px] font-medium">New Playlist</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 anim-fade">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-4 shadow-card-lg"
          >
            <h3 className="font-display font-semibold text-white text-[15px]">New Playlist</h3>
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g. Late Night Vibes"
              className="w-full h-10 bg-bg-card border border-bg-border focus:border-white/20 rounded-xl px-4 text-[13px] text-content-primary placeholder-content-tertiary outline-none transition"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="h-9 px-4 rounded-xl text-[13px] text-content-secondary hover:text-content-primary hover:bg-bg-hover transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-xl bg-accent hover:bg-accent-light text-[13px] font-semibold text-white transition shadow-glow-sm"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
