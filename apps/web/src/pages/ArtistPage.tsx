import React, { useEffect, useState } from 'react';
import { 
  Play, Pause, Heart, Sparkles, Music2, ArrowLeft, 
  ExternalLink, ListPlus, Check, Shuffle, Disc3
} from 'lucide-react';
import { Track } from '@melody/core';
import { youtubeDataApi, YouTubeVideoItem } from '../services/youtubeDataApi';
import { usePlayer } from '../context/PlayerContext';

interface ArtistPageProps {
  artistName: string;
  onBack: () => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
}

export const ArtistPage: React.FC<ArtistPageProps> = ({
  artistName,
  onBack,
  favoriteIds,
  onToggleFavorite,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, playNextInQueue } = usePlayer();
  const [tracks, setTracks] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedNextId, setAddedNextId] = useState<string | null>(null);

  const cleanName = artistName ? artistName.replace(/ - Topic|VEVO/gi, '').trim() : 'Artist';

  useEffect(() => {
    let mounted = true;
    async function loadArtistSongs() {
      setLoading(true);
      try {
        // Query top hits by the artist
        const results = await youtubeDataApi.searchMusic(`${cleanName} official music video songs`, 28);
        if (mounted) {
          setTracks(results);
        }
      } catch (err) {
        console.error('Failed to load artist tracks:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArtistSongs();
    return () => {
      mounted = false;
    };
  }, [cleanName]);

  const createTrackFromItem = (item: YouTubeVideoItem): Track => ({
    id: `yt_${item.id}`,
    title: item.title,
    artist: cleanName,
    artistId: cleanName,
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

  const handlePlayItem = (item: YouTubeVideoItem) => {
    const track = createTrackFromItem(item);
    const contextQueue = tracks.map(createTrackFromItem);
    playTrack(track, contextQueue);
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

  const handlePlayAll = (shuffle = false) => {
    if (tracks.length === 0) return;
    const allTracks = tracks.map(createTrackFromItem);
    if (shuffle) {
      const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    } else {
      playTrack(allTracks[0], allTracks);
    }
  };

  const headerArtwork = tracks[0]?.thumbnailUrl;

  return (
    <div className="min-h-full pb-28 anim-fade-up">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden hero-gradient border-b border-bg-border">
        {/* Ambient background glow */}
        {headerArtwork && (
          <div
            className="absolute inset-0 scale-125 blur-3xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url(${headerArtwork})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        )}

        <div className="relative z-10 px-6 md:px-10 pt-6 pb-12 max-w-7xl mx-auto space-y-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-content-secondary hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex flex-col md:flex-row md:items-end gap-6 pt-4">
            {/* Artist Avatar */}
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 bg-bg-card">
              {headerArtwork ? (
                <img
                  src={headerArtwork}
                  alt={cleanName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-accent text-white font-bold text-4xl">
                  {cleanName[0]?.toUpperCase() || 'A'}
                </div>
              )}
            </div>

            {/* Artist Details */}
            <div className="space-y-3 min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent-light text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" /> Verified Artist
              </span>
              <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white tracking-tight truncate">
                {cleanName}
              </h1>
              <p className="text-xs md:text-sm text-content-secondary">
                {loading ? 'Loading catalog…' : `${tracks.length} popular releases and official music videos`}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handlePlayAll(false)}
                  disabled={tracks.length === 0}
                  className="flex items-center gap-2 h-11 px-7 rounded-xl bg-accent hover:bg-accent-light text-white font-bold text-xs transition shadow-glow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" /> Play Top Tracks
                </button>

                <button
                  onClick={() => handlePlayAll(true)}
                  disabled={tracks.length === 0}
                  className="flex items-center gap-2 h-11 px-5 rounded-xl bg-bg-card border border-bg-border hover:border-white/15 text-content-secondary hover:text-white font-semibold text-xs transition"
                >
                  <Shuffle className="w-4 h-4" /> Shuffle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Track List & Grid ─── */}
      <div className="px-6 md:px-10 mt-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-accent-light" /> Songs & Music Videos
          </h3>
          <span className="text-xs font-mono text-content-tertiary">
            YouTube Music Official
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-bg-card skeleton" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-bg-card rounded-2xl border border-bg-border">
            <Music2 className="w-10 h-10 mx-auto text-content-tertiary opacity-40" />
            <p className="text-sm font-semibold text-white">No releases found for this artist</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tracks.map((item, idx) => {
              const trackId = `yt_${item.id}`;
              const isCurrent = currentTrack?.id === trackId;
              const isFav = favoriteIds.has(trackId);

              return (
                <div
                  key={item.id}
                  onClick={() => handlePlayItem(item)}
                  className={`group relative bg-bg-card hover:bg-bg-hover border rounded-xl p-3 cursor-pointer transition flex flex-col gap-2.5 ${
                    isCurrent ? 'border-accent/40 bg-accent/5' : 'border-bg-border hover:border-white/15'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center shadow-lg">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-white text-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                        )}
                      </div>
                    </div>
                    {item.duration && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-[13px] font-semibold line-clamp-2 leading-snug ${isCurrent ? 'text-accent-light' : 'text-content-primary group-hover:text-white'}`}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-content-secondary truncate mt-1">
                        {item.viewCount || `${idx + 1} Popular Track`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Play Next in Queue button */}
                      <button
                        onClick={(e) => handlePlayNext(e, item)}
                        title="Play next in queue"
                        className={`p-1.5 rounded-lg border transition ${
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

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(createTrackFromItem(item));
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          isFav ? 'text-pink-500' : 'text-content-tertiary hover:text-white opacity-0 group-hover:opacity-100'
                        }`}
                        title={isFav ? 'Unlike' : 'Like'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
