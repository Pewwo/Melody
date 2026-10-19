import React, { useState } from 'react';
import { ListMusic, Check, X, Music2, FolderPlus, Users } from 'lucide-react';
import { Track } from '@melody/core';
import { PlaylistModel } from '../services/playlistService';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: PlaylistModel[];
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onCreatePlaylist: (name: string) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onAddToPlaylist,
  onCreatePlaylist,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const handleAdd = (playlistId: string) => {
    onAddToPlaylist(playlistId, track);
    setJustAdded(playlistId);
    setTimeout(() => {
      setJustAdded(null);
      onClose();
    }, 900);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreatePlaylist(name);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm rounded-2xl bg-bg-surface border border-bg-border shadow-2xl overflow-hidden anim-fade">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-accent-light" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-content-primary">Add to Playlist</h2>
              <p className="text-[11px] text-content-tertiary truncate max-w-[180px]">{track.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Track mini preview */}
        <div className="flex items-center gap-3 px-5 py-3 bg-bg-card/50 border-b border-bg-border">
          <img
            src={track.artworkUrl}
            alt={track.title}
            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-bg-border"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-content-primary truncate">{track.title}</p>
            <p className="text-[11px] text-content-secondary truncate">{track.artist}</p>
          </div>
        </div>

        {/* Playlists list */}
        <div className="max-h-[260px] overflow-y-auto py-2">
          {playlists.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-content-tertiary">
              <Music2 className="w-8 h-8 opacity-40" />
              <p className="text-[12px]">No playlists yet — create one below</p>
            </div>
          )}
          {playlists.map((pl) => {
            const alreadyAdded = pl.tracks.some((t) => t.id === track.id);
            const isJustAdded = justAdded === pl.id;
            return (
              <button
                key={pl.id}
                onClick={() => !alreadyAdded && handleAdd(pl.id)}
                disabled={alreadyAdded}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors
                  ${alreadyAdded
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-bg-card/70 cursor-pointer'
                  }`}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/25 to-accent-light/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <ListMusic className="w-4 h-4 text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content-primary truncate">{pl.name}</p>
                  <p className="text-[11px] text-content-tertiary">
                    {pl.tracks.length} tracks {pl.ownerName ? `· ${pl.ownerName}` : ''}
                  </p>
                </div>
                {(alreadyAdded || isJustAdded) && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Create new playlist */}
        <div className="border-t border-bg-border px-5 py-4">
          {isCreating ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Playlist name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
                }}
                className="flex-1 bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-[13px] text-content-primary placeholder:text-content-tertiary outline-none focus:border-accent/50 transition-colors"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="h-8 px-3 rounded-lg bg-accent text-white text-[12px] font-semibold disabled:opacity-40 hover:bg-accent-light transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewName(''); }}
                className="btn-icon"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2.5 text-[13px] font-medium text-accent-light hover:text-white transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg border border-dashed border-accent/40 group-hover:border-accent flex items-center justify-center transition-colors shrink-0">
                <FolderPlus className="w-4 h-4" />
              </div>
              New Playlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
