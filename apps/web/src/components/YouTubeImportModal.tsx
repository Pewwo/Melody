import React, { useState, useEffect } from 'react';
import { 
  X, Youtube, Tv, Play, Loader2, 
  AlertCircle, Heart, ClipboardPaste, Flame, Search
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { extractYouTubeId, fetchYouTubeTrack, POPULAR_YOUTUBE_TRACKS, Track } from '@melody/core';
import { youtubeDataApi, YouTubeVideoItem } from '../services/youtubeDataApi';

interface YouTubeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToFavorites?: (track: Track) => void;
  isFavorite?: (trackId: string) => boolean;
}

export const YouTubeImportModal: React.FC<YouTubeImportModalProps> = ({
  isOpen,
  onClose,
  onAddToFavorites,
  isFavorite,
}) => {
  const { playTrack } = usePlayer();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<YouTubeVideoItem[]>([]);
  const [previewTrack, setPreviewTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Handle both URL and search queries with debounce
  useEffect(() => {
    const trimmed = inputQuery.trim();
    if (!trimmed) {
      setPreviewTrack(null);
      setSearchResults([]);
      setError(null);
      return;
    }

    const videoId = extractYouTubeId(trimmed);

    let mounted = true;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        if (videoId) {
          // Direct video URL/ID
          const track = await fetchYouTubeTrack(videoId);
          if (mounted) {
            setPreviewTrack(track);
            setSearchResults([]);
          }
        } else {
          // Search by Title or Artist
          const results = await youtubeDataApi.searchMusic(trimmed, 6);
          if (mounted) {
            setSearchResults(results);
            setPreviewTrack(null);
            if (results.length === 0) {
              setError(`No songs found matching "${trimmed}".`);
            }
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Could not fetch YouTube results.');
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [inputQuery]);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputQuery(text);
    } catch {}
  };

  const handlePlayItem = (item: YouTubeVideoItem) => {
    const track: Track = {
      id: `yt_${item.id}`,
      title: item.title,
      artist: item.channelTitle,
      artistId: item.channelTitle,
      artworkUrl: item.thumbnailUrl,
      duration: 210,
      streamUrl: `youtube:${item.id}`,
      source: 'youtube',
      youtubeId: item.id,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
      downloadable: false,
      downloadGated: false,
      isStreamGated: false,
      mirrors: [],
    };
    playTrack(track);
    onClose();
  };

  const handlePlayDirect = async () => {
    if (previewTrack) {
      playTrack(previewTrack);
      onClose();
      return;
    }

    if (searchResults.length > 0) {
      handlePlayItem(searchResults[0]);
      return;
    }

    const trimmed = inputQuery.trim();
    if (!trimmed) {
      setError('Enter a song title or artist name.');
      return;
    }

    setLoading(true);
    try {
      const results = await youtubeDataApi.searchMusic(trimmed, 1);
      if (results.length > 0) {
        handlePlayItem(results[0]);
      } else {
        setError(`No songs found for "${trimmed}".`);
      }
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: Track) => {
    setInputQuery(preset.title);
    setPreviewTrack(preset);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl anim-fade"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-bg-surface border border-bg-border rounded-2xl shadow-card-lg flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-bg-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ff0000] flex items-center justify-center shrink-0">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-[15px]">Search & Play YouTube</h3>
              <p className="text-[11px] text-content-secondary mt-0.5">Search by song title, artist, or paste a link</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon w-8 h-8 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Search/URL input */}
          <div>
            <label className="block text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-1.5">
              Song Title, Artist, or Link
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-content-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayDirect()}
                placeholder="Type song title or artist (e.g. Blinding Lights, Drake)..."
                autoFocus
                className="w-full h-10 bg-bg-card border border-bg-border focus:border-white/20 rounded-xl pl-10 pr-24 text-[13px] text-content-primary placeholder-content-tertiary outline-none transition"
              />
              <div className="absolute right-2">
                {inputQuery ? (
                  <button onClick={() => { setInputQuery(''); setPreviewTrack(null); setSearchResults([]); }} className="btn-icon w-7 h-7">
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button 
                    onClick={handlePaste}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-bg-hover text-content-secondary hover:text-content-primary text-[11px] font-medium transition"
                  >
                    <ClipboardPaste className="w-3 h-3" /> Paste
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-accent-light">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching YouTube…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-950/60 border border-red-500/25 text-red-300 text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* URL Direct Preview Card */}
          {previewTrack && !loading && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-bg-border">
              <img 
                src={previewTrack.artworkUrl} 
                alt={previewTrack.title}
                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-bg-border"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase font-bold text-accent-light tracking-wider">
                  Direct Link Match
                </span>
                <p className="text-[13px] font-semibold text-white truncate mt-0.5">{previewTrack.title}</p>
                <p className="text-[11px] text-content-secondary truncate">{previewTrack.artist}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => { playTrack(previewTrack); onClose(); }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#ff0000] hover:bg-red-600 text-white text-[12px] font-semibold transition"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Play
                </button>
              </div>
            </div>
          )}

          {/* Multi-result list when searching by Title or Artist */}
          {searchResults.length > 0 && !loading && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
                Matching Songs & Artists
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handlePlayItem(item)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border hover:border-white/15 cursor-pointer transition group"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-content-primary group-hover:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-content-secondary truncate mt-0.5">
                        {item.channelTitle} {item.duration ? `· ${item.duration}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayItem(item);
                      }}
                      className="btn-icon w-8 h-8 opacity-80 group-hover:opacity-100 group-hover:bg-[#ff0000] group-hover:text-white transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular presets */}
          <div className="border-t border-bg-border pt-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Popular Music Videos
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_YOUTUBE_TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectPreset(track)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-bg-border hover:border-white/15 bg-bg-card text-left transition hover:bg-bg-hover text-content-secondary hover:text-content-primary"
                >
                  <img src={track.artworkUrl} alt={track.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold truncate text-content-primary">{track.title}</p>
                    <p className="text-[10px] text-content-tertiary truncate">{track.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-bg-border shrink-0 flex items-center justify-between">
          <p className="text-[11px] text-content-tertiary flex items-center gap-1">
            <Tv className="w-3 h-3 text-[#ff0000]" /> Official YouTube Player
          </p>
          <button
            onClick={handlePlayDirect}
            disabled={loading || (!inputQuery && !previewTrack && searchResults.length === 0)}
            className="flex items-center gap-2 h-9 px-5 rounded-xl bg-[#ff0000] hover:bg-red-600 disabled:opacity-40 text-white text-[13px] font-semibold transition"
          >
            <Play className="w-4 h-4 fill-white" />
            Play
          </button>
        </div>
      </div>
    </div>
  );
};
