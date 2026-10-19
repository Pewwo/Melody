import React, { useEffect, useState } from 'react';
import { Compass, Flame, Sparkles, Play, Music2, ListPlus, BookmarkPlus, Check } from 'lucide-react';
import { Track } from '@melody/core';
import { youtubeDataApi, YouTubeVideoItem } from '../services/youtubeDataApi';
import { usePlayer } from '../context/PlayerContext';

interface ExplorePageProps {
  onToggleFavorite: (track: Track) => void;
  favoriteIds: Set<string>;
  onNavigateToSearch?: (query: string) => void;
  onAddToPlaylist?: (track: Track) => void;
  onOpenArtist?: (artist: string) => void;
}

const FEATURED_GENRES = [
  { name: 'Hip-Hop & Trap', color: 'from-orange-500/20 to-red-500/5', border: 'border-orange-500/20', query: 'Hip Hop' },
  { name: 'Lofi & Chillout', color: 'from-cyan-500/20 to-blue-500/5', border: 'border-cyan-500/20', query: 'Lofi' },
  { name: 'EDM & Dance', color: 'from-purple-500/20 to-pink-500/5', border: 'border-purple-500/20', query: 'Electronic' },
  { name: 'Ambient & Sleep', color: 'from-emerald-500/20 to-teal-500/5', border: 'border-emerald-500/20', query: 'Ambient' },
  { name: 'Rock & Alternative', color: 'from-rose-500/20 to-amber-500/5', border: 'border-rose-500/20', query: 'Rock' },
  { name: 'Pop Hits', color: 'from-fuchsia-500/20 to-violet-500/5', border: 'border-fuchsia-500/20', query: 'Pop' },
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onNavigateToSearch,
  onAddToPlaylist,
  onOpenArtist,
}) => {
  const { playTrack, playNextInQueue } = usePlayer();
  const [trendingVideos, setTrendingVideos] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedNextId, setAddedNextId] = useState<string | null>(null);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadExploreData() {
      setLoading(true);
      try {
        const videos = await youtubeDataApi.getTrendingMusic(24);
        if (mounted) {
          setTrendingVideos(videos);
        }
      } catch (err) {
        console.error('Failed to load explore data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadExploreData();
    return () => { mounted = false; };
  }, []);

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

  const handlePlayYouTube = (item: YouTubeVideoItem) => {
    const track = createTrackFromItem(item);
    // Pass all visible songs as queue so auto-advance works
    const fullQueue = trendingVideos.map(createTrackFromItem);
    playTrack(track, fullQueue);
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

  const handleAddToPlaylist = (e: React.MouseEvent, item: YouTubeVideoItem) => {
    e.stopPropagation();
    const track = createTrackFromItem(item);
    onAddToPlaylist?.(track);
    setAddedPlaylistId(item.id);
    setTimeout(() => {
      setAddedPlaylistId((curr) => (curr === item.id ? null : curr));
    }, 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto anim-fade-up pb-28">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3">
          <Compass className="w-7 h-7 text-accent-light" />
          <span>Explore</span>
        </h2>
        <p className="text-xs md:text-sm text-content-secondary mt-1">
          Discover trending music videos, genre collections, and popular artists.
        </p>
      </div>

      {/* Featured Genres Grid */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-light" /> Browse Genres
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FEATURED_GENRES.map((g) => (
            <button
              key={g.name}
              onClick={() => onNavigateToSearch?.(g.query)}
              className={`p-4 rounded-xl bg-gradient-to-b ${g.color} border ${g.border} hover:scale-102 transition text-left group`}
            >
              <Music2 className="w-5 h-5 text-content-primary mb-2 opacity-70 group-hover:opacity-100" />
              <p className="text-[13px] font-semibold text-content-primary group-hover:text-white leading-tight">
                {g.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Trending YouTube Music Videos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" /> Trending Hits
          </h3>
          <span className="text-xs text-content-tertiary">YouTube Official</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-bg-card skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {trendingVideos.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayYouTube(item)}
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
                    <p className="text-[11px] text-content-secondary truncate mt-1">
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

                  {/* Add to Playlist button */}
                  <button
                    onClick={(e) => handleAddToPlaylist(e, item)}
                    title="Add to playlist"
                    className={`shrink-0 p-1.5 rounded-lg border transition ${
                      addedPlaylistId === item.id
                        ? 'bg-accent/20 border-accent/40 text-accent-light'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-content-secondary hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {addedPlaylistId === item.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
