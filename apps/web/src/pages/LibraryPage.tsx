import React, { useState } from 'react';
import { 
  Library, Heart, ListPlus, Plus, Play, Music, 
  Share2, Users, Trash2, Lock, Check, AlertCircle, X, Shield 
} from 'lucide-react';
import { Track } from '@melody/core';
import { TrackTable } from '../components/TrackTable';
import { usePlayer } from '../context/PlayerContext';
import { PlaylistModel, playlistService } from '../services/playlistService';

interface LibraryPageProps {
  favoriteTracks: Track[];
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
  playlists: PlaylistModel[];
  currentUser: { email: string; username: string; avatarUrl?: string } | null;
  onCreatePlaylist: (name: string) => void;
  onRemoveFromPlaylist: (playlistId: string, track: Track) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onSharePlaylist: (playlistId: string, targetEmail: string) => { success: boolean; message: string };
  onUnsharePlaylist: (playlistId: string, targetEmail: string) => void;
  onNavigateToDiscover: () => void;
  onOpenAuth: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  favoriteTracks,
  favoriteIds,
  onToggleFavorite,
  playlists,
  currentUser,
  onCreatePlaylist,
  onRemoveFromPlaylist,
  onDeletePlaylist,
  onSharePlaylist,
  onUnsharePlaylist,
  onNavigateToDiscover,
  onOpenAuth,
}) => {
  const { playTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sharing Modal State
  const [sharingPlaylist, setSharingPlaylist] = useState<PlaylistModel | null>(null);
  const [shareInputEmail, setShareInputEmail] = useState('');
  const [shareMessage, setShareMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const userIdentifier = currentUser?.email || 'guest';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingPlaylist || !shareInputEmail.trim()) return;
    const res = onSharePlaylist(sharingPlaylist.id, shareInputEmail.trim());
    setShareMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setShareInputEmail('');
      setTimeout(() => setShareMessage(null), 3000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-6 anim-fade">
      {/* ── Header ── */}
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-bg-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Your Library</h2>
          <p className="text-[13px] text-content-secondary mt-0.5 flex items-center gap-2">
            <span>Liked songs and personal playlists</span>
            {currentUser ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent-light font-mono">
                {currentUser.email}
              </span>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-300 font-medium hover:underline"
              >
                Sign in to sync your playlists across devices
              </button>
            )}
          </p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setSelectedPlaylistId(null)}
                  className="text-[12px] text-accent-light hover:underline mb-2 block"
                >
                  ← All playlists
                </button>
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-bold text-xl text-white">{selectedPlaylist.name}</h3>
                  {selectedPlaylist.ownerId.toLowerCase() === userIdentifier.toLowerCase() ? (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Created by you
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Shared with you by {selectedPlaylist.ownerName || selectedPlaylist.ownerId}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-content-secondary mt-1">
                  {selectedPlaylist.tracks.length} track{selectedPlaylist.tracks.length !== 1 ? 's' : ''}
                  {selectedPlaylist.sharedWith?.length > 0 && (
                    <span className="ml-2 text-content-tertiary">
                      · Shared with {selectedPlaylist.sharedWith.length} account{selectedPlaylist.sharedWith.length > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedPlaylist.tracks.length > 0 && (
                  <button
                    onClick={() => playTrack(selectedPlaylist.tracks[0], selectedPlaylist.tracks)}
                    className="flex items-center gap-2 h-10 px-6 rounded-xl bg-white text-black font-semibold text-[13px] hover:scale-105 active:scale-95 transition"
                  >
                    <Play className="w-4 h-4 fill-black" /> Play All
                  </button>
                )}

                {/* Share Button (Only Owner can share) */}
                {selectedPlaylist.ownerId.toLowerCase() === userIdentifier.toLowerCase() && (
                  <button
                    onClick={() => {
                      setSharingPlaylist(selectedPlaylist);
                      setShareMessage(null);
                    }}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-bg-card border border-bg-border hover:border-white/20 text-content-secondary hover:text-white text-[13px] font-medium transition"
                    title="Share playlist with another account"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                )}

                {/* Delete Button (Only Owner can delete) */}
                {selectedPlaylist.ownerId.toLowerCase() === userIdentifier.toLowerCase() && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${selectedPlaylist.name}"?`)) {
                        onDeletePlaylist(selectedPlaylist.id);
                        setSelectedPlaylistId(null);
                      }
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-card border border-bg-border hover:border-rose-500/40 text-content-tertiary hover:text-rose-400 transition"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
          <div>
            {playlists.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <Music className="w-12 h-12 text-content-tertiary mx-auto" />
                <h4 className="text-base font-semibold text-white">No playlists found for this account</h4>
                <p className="text-[13px] text-content-secondary max-w-sm mx-auto">
                  Playlists you create or that are shared to your account ({currentUser?.email || 'Guest'}) will appear here.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="h-9 px-5 rounded-xl bg-accent hover:bg-accent-light text-white text-[13px] font-semibold transition shadow-glow-sm"
                >
                  Create Your First Playlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {playlists.map((pl) => {
                  const isOwner = pl.ownerId.toLowerCase() === userIdentifier.toLowerCase();
                  return (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylistId(pl.id)}
                      className="glass-card p-4 rounded-xl text-left group hover:border-accent/30 transition-all cursor-pointer relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-square rounded-lg bg-bg-card border border-bg-border flex items-center justify-center mb-3 group-hover:scale-[1.02] transition-transform relative overflow-hidden">
                          <Music className="w-8 h-8 text-content-tertiary group-hover:text-accent-light transition-colors" />
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            {isOwner ? (
                              <span className="p-1 rounded-md bg-black/60 backdrop-blur-md text-content-tertiary" title="Created by you">
                                <Lock className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-300" title={`Shared by ${pl.ownerName || pl.ownerId}`}>
                                <Users className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-[13px] font-semibold text-content-primary truncate">{pl.name}</h4>
                        <p className="text-[11px] text-content-secondary mt-0.5">
                          {pl.tracks.length} track{pl.tracks.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-content-tertiary">
                        <span className="truncate">
                          {isOwner ? 'Created by you' : `Shared by ${pl.ownerName || pl.ownerId.split('@')[0]}`}
                        </span>
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingPlaylist(pl);
                              setShareMessage(null);
                            }}
                            className="p-1 rounded-md hover:bg-white/10 text-content-secondary hover:text-white transition"
                            title="Share with an account"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-bg-border hover:border-accent/35 flex flex-col items-center justify-center gap-2 text-content-tertiary hover:text-content-primary transition-all"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-[12px] font-medium">New Playlist</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create Playlist Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 anim-fade">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-4 shadow-card-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white text-[15px]">New Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-content-secondary">
              This playlist will be saved to your account ({currentUser?.email || 'Guest Mode'}). Only you can see it unless you share it with others.
            </p>

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
                disabled={!newPlaylistName.trim()}
                className="h-9 px-5 rounded-xl bg-accent hover:bg-accent-light disabled:opacity-40 text-[13px] font-semibold text-white transition shadow-glow-sm"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Share Playlist Modal ── */}
      {sharingPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 anim-fade">
          <div className="w-full max-w-md bg-bg-surface border border-bg-border rounded-2xl p-6 space-y-5 shadow-card-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent-light">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white text-[15px]">Share Playlist</h3>
                  <p className="text-[12px] text-content-secondary truncate max-w-[250px]">{sharingPlaylist.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSharingPlaylist(null)}
                className="btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-content-secondary leading-relaxed">
              Playlists are private to your account. Enter another user's email or username below to allow them to view and listen to this playlist from their library.
            </p>

            <form onSubmit={handleShareSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="friend@email.com or username"
                  value={shareInputEmail}
                  onChange={(e) => setShareInputEmail(e.target.value)}
                  className="flex-1 h-10 bg-bg-card border border-bg-border focus:border-white/20 rounded-xl px-4 text-[13px] text-content-primary placeholder-content-tertiary outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!shareInputEmail.trim()}
                  className="h-10 px-4 rounded-xl bg-accent hover:bg-accent-light disabled:opacity-40 text-[13px] font-semibold text-white transition shrink-0"
                >
                  Grant Access
                </button>
              </div>

              {shareMessage && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] ${
                    shareMessage.isError
                      ? 'bg-rose-500/15 border border-rose-500/25 text-rose-300'
                      : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
                  }`}
                >
                  {shareMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                  <span>{shareMessage.text}</span>
                </div>
              )}
            </form>

            {/* Currently Shared List */}
            <div className="space-y-2 pt-2 border-t border-bg-border">
              <h4 className="text-[12px] font-semibold text-content-secondary uppercase tracking-wider">
                Accounts with Access
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-card/40 border border-bg-border/60 text-[12px]">
                  <span className="text-content-primary font-medium flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-accent-light" />
                    {sharingPlaylist.ownerId} (You / Owner)
                  </span>
                  <span className="text-[10px] text-content-tertiary">Creator</span>
                </div>

                {sharingPlaylist.sharedWith && sharingPlaylist.sharedWith.length > 0 ? (
                  sharingPlaylist.sharedWith.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-card/40 border border-bg-border/60 text-[12px]"
                    >
                      <span className="text-content-secondary flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {email}
                      </span>
                      <button
                        onClick={() => {
                          onUnsharePlaylist(sharingPlaylist.id, email);
                          setSharingPlaylist((prev) =>
                            prev ? { ...prev, sharedWith: prev.sharedWith.filter((e) => e !== email) } : null
                          );
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-content-tertiary py-2 text-center">
                    Not shared with any other accounts yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSharingPlaylist(null)}
                className="h-9 px-5 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border text-[13px] font-medium text-white transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
