import React, { useEffect, useState } from 'react';
import { 
  Sparkles, Heart, FileAudio, Loader2, Play, Music2, ListPlus, Check
} from 'lucide-react';
import { Track, formatTime, formatBytes } from '@melody/core';
import { localMusicService, LocalAudioTrack } from '../services/localMusicService';
import { youtubeDataApi, YouTubeVideoItem } from '../services/youtubeDataApi';
import { searchHistoryService } from '../services/searchHistoryService';
import { usePlayer } from '../context/PlayerContext';

interface SearchPageProps {
  initialQuery?: string;
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
  onOpenYouTubeModal?: () => void;
  onOpenArtist?: (artist: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  favoriteIds,
  onToggleFavorite,
  onOpenYouTubeModal,
  onOpenArtist,
}) => {
  const { playTrack, currentTrack, playNextInQueue } = usePlayer();
  const [addedNextId, setAddedNextId] = useState<string | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [searchTarget, setSearchTarget] = useState<'youtube' | 'local'>('youtube');
  
  // Results
  const [ytResults, setYtResults] = useState<YouTubeVideoItem[]>([]);
  const [localResults, setLocalResults] = useState<LocalAudioTrack[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, searchTarget);
    } else {
      fetchDefault();
    }
  }, [initialQuery]);

  const fetchDefault = async () => {
    setLoading(true);
    try {
      if (searchTarget === 'youtube') {
        const trending = await youtubeDataApi.getTrendingMusic(24);
        setYtResults(trending);
      } else {
        const local = await localMusicService.getAllLocalTracks();
        setLocalResults(local);
      }
    } catch {
      setYtResults([]);
      setLocalResults([]);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (term: string, target = searchTarget) => {
    const trimmed = term.trim();
    if (!trimmed) {
      fetchDefault();
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    searchHistoryService.addQuery(trimmed);

    try {
      if (target === 'youtube') {
        const results = await youtubeDataApi.searchMusic(trimmed, 24);
        setYtResults(results);
      } else {
        const matching = await localMusicService.searchLocalTracks(trimmed);
        setLocalResults(matching);
      }
    } catch {
      if (target === 'youtube') setYtResults([]);
      else setLocalResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (target: 'youtube' | 'local') => {
    setSearchTarget(target);
    performSearch(query, target);
  };

  const createTrackFromItem = (item: YouTubeVideoItem): Track => ({
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
  });

  const handlePlayYouTubeItem = (item: YouTubeVideoItem) => {
    const track = createTrackFromItem(item);
    // Pass all search results as queue so auto-advance works
    const fullQueue = ytResults.map(createTrackFromItem);
    playTrack(track, fullQueue.length > 0 ? fullQueue : undefined);
  };

  const handlePlayNext = (e: React.MouseEvent, item: YouTubeVideoItem) => {
    e.stopPropagation();
    const track = createTrackFromItem(item);
    playNextInQueue(track);
    setAddedNextId(item.id);
    setTimeout(() => {
      setAddedNextId((curr) => (curr === item.id ? null : curr));
    }, 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto anim-fade-up pb-28">


      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-bg-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-light" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            {searchTarget === 'youtube'
              ? hasSearched
                ? `Results for "${query}"`
                : 'Trending Music'
              : hasSearched
              ? `Local Results for "${query}"`
              : 'All Imported Local Files'}
          </h3>
          <span className="text-xs font-mono text-content-tertiary">
            ({searchTarget === 'youtube' ? ytResults.length : localResults.length})
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-bg-card skeleton" />
          ))}
        </div>
      ) : searchTarget === 'youtube' ? (
        ytResults.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl bg-bg-card/50 border border-bg-border">
            <Music2 className="w-12 h-12 text-content-tertiary mx-auto opacity-50" />
            <h4 className="text-base font-bold text-white">No songs found</h4>
            <p className="text-xs text-content-secondary max-w-sm mx-auto">
              Try searching for a different song title or artist name.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ytResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayYouTubeItem(item)}
                className="group relative bg-bg-card hover:bg-bg-hover border border-bg-border hover:border-white/15 rounded-xl p-3 cursor-pointer transition flex flex-col gap-2.5"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                  {item.duration && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-semibold text-content-primary group-hover:text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-content-secondary truncate mt-1 flex items-center gap-1.5">
                      <span
                        onClick={(e) => {
                          if (onOpenArtist) {
                            e.stopPropagation();
                            onOpenArtist(item.channelTitle);
                          }
                        }}
                        className={onOpenArtist ? 'hover:text-white hover:underline cursor-pointer' : ''}
                      >
                        {item.channelTitle}
                      </span>
                      {item.viewCount && (
                        <>
                          <span className="text-content-tertiary">·</span>
                          <span className="text-content-tertiary">{item.viewCount}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Play Next in Queue button */}
                  <button
                    onClick={(e) => handlePlayNext(e, item)}
                    title="Play next in queue"
                    className={`shrink-0 p-1.5 rounded-lg border transition ${
                      addedNextId === item.id
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-content-secondary hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {addedNextId === item.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <ListPlus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : localResults.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-2xl bg-bg-card/50 border border-bg-border">
          <FileAudio className="w-12 h-12 text-content-tertiary mx-auto opacity-50" />
          <h4 className="text-base font-bold text-white">No local audio matches</h4>
          <p className="text-xs text-content-secondary max-w-sm mx-auto">
            Import your physical MP3, FLAC, or WAV files via the My Music tab.
          </p>
        </div>
      ) : (
        <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
          <div className="divide-y divide-bg-border">
            {localResults.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = favoriteIds.has(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, localResults)}
                  className={`flex items-center justify-between p-3 sm:px-4 hover:bg-bg-hover transition cursor-pointer ${
                    isCurrent ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <span className="w-6 text-center text-xs font-mono text-content-tertiary">{idx + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-bg-border">
                      <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-[13px] font-semibold truncate ${isCurrent ? 'text-accent-light' : 'text-content-primary'}`}>
                          {track.title}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-content-secondary">
                          {track.fileFormat}
                        </span>
                      </div>
                      <p className="text-[11px] text-content-secondary truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-content-tertiary font-mono shrink-0">
                    <span>{formatBytes(track.sizeBytes)}</span>
                    <span>{formatTime(track.duration)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track);
                      }}
                      className={`btn-icon w-7 h-7 ${isFav ? 'text-pink-500 !bg-pink-500/10' : ''}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
