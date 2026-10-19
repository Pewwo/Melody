import React, { useEffect, useState } from 'react';
import { 
  Play, TrendingUp, Sparkles, AlertCircle, RefreshCw, 
  ArrowRight, Youtube, Loader2, History, Compass, ListPlus, BookmarkPlus, Check
} from 'lucide-react';
import { Track } from '@melody/core';
import { TrackCard } from '../components/TrackCard';
import { youtubeDataApi, YouTubeVideoItem } from '../services/youtubeDataApi';
import { searchHistoryService } from '../services/searchHistoryService';
import { usePlayer } from '../context/PlayerContext';

interface HomePageProps {
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
  onNavigateToSearch: (genre?: string) => void;
  onOpenYouTubeModal?: () => void;
  onAddToPlaylist?: (track: Track) => void;
  onOpenArtist?: (artist: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  favoriteIds,
  onToggleFavorite,
  onNavigateToSearch,
  onOpenYouTubeModal,
  onAddToPlaylist,
  onOpenArtist,
}) => {
  const { playTrack, playYouTubeTrack, playNextInQueue } = usePlayer();
  const [trendingVideos, setTrendingVideos] = useState<YouTubeVideoItem[]>([]);
  const [suggestedTopic, setSuggestedTopic] = useState<string | null>(null);
  const [historyTopics, setHistoryTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedNextId, setAddedNextId] = useState<string | null>(null);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  const fetchData = async (topicOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const rec = searchHistoryService.getRecommendations();
      setHistoryTopics(rec.allTopics);
      const activeTopic = topicOverride !== undefined ? topicOverride : rec.primaryTopic;
      setSuggestedTopic(activeTopic);

      let videos: YouTubeVideoItem[] = [];
      if (activeTopic) {
        videos = await youtubeDataApi.searchMusic(activeTopic, 16);
      }
      if (videos.length === 0) {
        videos = await youtubeDataApi.getTrendingMusic(16);
      }
      setTrendingVideos(videos);
    } catch {
      setError('Could not fetch music recommendations. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    // Pass the full list of visible songs as the queue so auto-advance works
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

  const heroItem = trendingVideos[0];

  return (
    <div className="min-h-full pb-24 md:pb-28">
      {/* ─── Hero Spotlight ─── */}
      <div className="relative overflow-hidden hero-gradient border-b border-bg-border">
        {heroItem && !loading && (
          <div className="px-6 md:px-10 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 max-w-7xl mx-auto anim-fade">
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-accent/15 border border-accent/25 text-accent-light text-[11px] font-semibold mb-4">
                <Sparkles className="w-3 h-3" />
                Trending Music
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight mb-2">
                {heroItem.title}
              </h2>
              <p className="text-content-secondary text-sm mb-6">
                {heroItem.channelTitle}
                {heroItem.viewCount && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-bg-card text-[11px] text-content-tertiary font-mono">
                    {heroItem.viewCount}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayYouTube(heroItem)}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-[13px] transition-all shadow-glow-sm hover:shadow-glow-accent hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" /> Play Now
                </button>
                <button
                  onClick={() => {
                    if (onOpenArtist) {
                      onOpenArtist(heroItem.channelTitle);
                    } else {
                      onNavigateToSearch(heroItem.channelTitle);
                    }
                  }}
                  className="h-10 px-5 rounded-xl bg-bg-card border border-bg-border hover:border-white/15 text-content-secondary hover:text-content-primary font-semibold text-[13px] transition-all"
                >
                  More by Artist
                </button>
              </div>
            </div>

            <div className="relative z-10 w-44 md:w-56 aspect-video rounded-2xl overflow-hidden shadow-card-lg border border-white/10 shrink-0">
              <img src={heroItem.thumbnailUrl} alt={heroItem.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {loading && (
          <div className="px-6 md:px-10 py-14 flex items-center gap-4">
            <div className="w-44 h-28 rounded-2xl skeleton" />
            <div className="space-y-3">
              <div className="h-8 w-64 skeleton" />
              <div className="h-4 w-40 skeleton" />
              <div className="h-10 w-36 mt-4 skeleton" />
            </div>
          </div>
        )}
      </div>

      <div className="px-6 md:px-10 space-y-10 mt-8 max-w-7xl mx-auto">
        {/* ─── Music Suggestions (Based on Recently Played Videos or Trending) ─── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              {suggestedTopic ? (
                <>
                  <Sparkles className="w-4 h-4 text-accent-light" />
                  <div>
                    <h3 className="font-display font-semibold text-white text-[15px] flex items-center gap-2">
                      Suggested for You
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-accent-light">
                        based on your listening & "{suggestedTopic}"
                      </span>
                    </h3>
                  </div>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-accent-light" />
                  <h3 className="font-display font-semibold text-white text-[15px]">Trending Songs</h3>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData()}
                className="btn-icon"
                title="Refresh suggestions"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => onNavigateToSearch(suggestedTopic || undefined)}
                className="text-[12px] text-content-secondary hover:text-content-primary font-medium transition flex items-center gap-1"
              >
                See all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick topic pills from recent search history */}
          {historyTopics.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              <span className="text-[11px] text-content-tertiary flex items-center gap-1 shrink-0 mr-1">
                <History className="w-3 h-3" /> Recent:
              </span>
              {historyTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => fetchData(topic)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                    suggestedTopic === topic
                      ? 'bg-accent text-white shadow-glow-sm'
                      : 'bg-bg-card hover:bg-bg-hover text-content-secondary hover:text-white border border-bg-border'
                  }`}
                >
                  {topic}
                </button>
              ))}
              <button
                onClick={() => fetchData('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                  !suggestedTopic
                    ? 'bg-accent text-white shadow-glow-sm'
                    : 'bg-bg-card hover:bg-bg-hover text-content-secondary hover:text-white border border-bg-border'
                }`}
              >
                Global Trending
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-xl bg-bg-card skeleton" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-12 text-content-tertiary">
              <AlertCircle className="w-8 h-8" />
              <p className="text-[13px]">{error}</p>
              <button onClick={() => fetchData()} className="text-accent-light text-[12px] font-medium hover:underline">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    </div>
  );
};
