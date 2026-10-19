import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Play, Pause, Sparkles, Disc3, 
  ArrowRight, Heart, ListPlus, BookmarkPlus, Check, Flame
} from 'lucide-react';
import { Track } from '@melody/core';
import { youtubeDataApi, YouTubeVideoItem } from '../services/youtubeDataApi';
import { usePlayer } from '../context/PlayerContext';

interface ArtistsPageProps {
  onOpenArtist: (artistName: string) => void;
  onToggleFavorite: (track: Track) => void;
  favoriteIds: Set<string>;
  onAddToPlaylist?: (track: Track) => void;
}

const POPULAR_ARTISTS = [
  { name: 'The Weeknd', genre: 'R&B / Pop', query: 'The Weeknd' },
  { name: 'Taylor Swift', genre: 'Pop / Country', query: 'Taylor Swift' },
  { name: 'Bruno Mars', genre: 'Pop / Funk', query: 'Bruno Mars' },
  { name: 'Billie Eilish', genre: 'Alt Pop', query: 'Billie Eilish' },
  { name: 'Drake', genre: 'Hip-Hop / Rap', query: 'Drake' },
  { name: 'Sabrina Carpenter', genre: 'Pop', query: 'Sabrina Carpenter' },
  { name: 'Post Malone', genre: 'Pop / Hip-Hop', query: 'Post Malone' },
  { name: 'Dua Lipa', genre: 'Dance Pop', query: 'Dua Lipa' },
  { name: 'Ed Sheeran', genre: 'Pop / Acoustic', query: 'Ed Sheeran' },
  { name: 'Kendrick Lamar', genre: 'Hip-Hop', query: 'Kendrick Lamar' },
  { name: 'Ariana Grande', genre: 'Pop / R&B', query: 'Ariana Grande' },
  { name: 'Coldplay', genre: 'Alternative / Rock', query: 'Coldplay' },
  { name: 'Olivia Rodrigo', genre: 'Pop Rock', query: 'Olivia Rodrigo' },
  { name: 'Travis Scott', genre: 'Trap / Hip-Hop', query: 'Travis Scott' },
  { name: 'SZA', genre: 'R&B / Neo-Soul', query: 'SZA' },
  { name: 'Justin Bieber', genre: 'Pop', query: 'Justin Bieber' },
];

export const ArtistsPage: React.FC<ArtistsPageProps> = ({
  onOpenArtist,
  onToggleFavorite,
  favoriteIds,
  onAddToPlaylist,
}) => {
  const { playTrack, playNextInQueue, currentTrack, isPlaying } = usePlayer();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideoItem[]>([]);
  const [artistPreviewMap, setArtistPreviewMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedNextId, setAddedNextId] = useState<string | null>(null);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  // Fetch artist avatars/thumbnails on mount
  useEffect(() => {
    let mounted = true;
    async function fetchAvatars() {
      const map: Record<string, string> = {};
      // Fetch previews for the top 8 artists
      const topArtists = POPULAR_ARTISTS.slice(0, 8);
      await Promise.all(
        topArtists.map(async (art) => {
          try {
            const res = await youtubeDataApi.searchMusic(`${art.name} official`, 1);
            if (res.length > 0) {
              map[art.name] = res[0].thumbnailUrl;
            }
          } catch {}
        })
      );
      if (mounted) {
        setArtistPreviewMap(map);
      }
    }
    fetchAvatars();
    return () => { mounted = false; };
  }, []);

  const handleSearch = async (termToSearch: string) => {
    const trimmed = termToSearch.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      // Search songs and official releases by the artist
      const results = await youtubeDataApi.searchMusic(`${trimmed} official songs`, 24);
      setSearchResults(results);
    } catch (err) {
      console.warn('Artist search failed:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
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

  const handlePlayItem = (item: YouTubeVideoItem) => {
    const track = createTrackFromItem(item);
    const queue = searchResults.map(createTrackFromItem);
    playTrack(track, queue);
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

  // Filtered list of popular artists for quick browsing
  const filteredPopular = POPULAR_ARTISTS.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto anim-fade-up pb-28">
      {/* Header & Artist Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-accent/15 border border-accent/25 text-accent-light text-[11px] font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              Artist Catalog
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight">
              Artists & Song Releases
            </h2>
            <p className="text-xs md:text-sm text-content-secondary mt-1">
              Search any musical artist to explore their discography, albums, and songs.
            </p>
          </div>
        </div>

        {/* Large Dedicated Artist Search Box */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-content-tertiary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim().length > 1) {
                handleSearch(e.target.value);
              } else if (!e.target.value.trim()) {
                setSearchResults([]);
                setHasSearched(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(searchTerm);
            }}
            placeholder="Search an artist (e.g. Taylor Swift, The Weeknd, Drake)…"
            className="w-full h-11 bg-bg-card/90 border border-bg-border focus:border-accent/40 focus:bg-bg-card focus:ring-2 focus:ring-accent/15 rounded-xl pl-11 pr-24 text-[13px] text-content-primary placeholder-content-tertiary outline-none transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch(searchTerm)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-light transition"
            >
              Search
            </button>
          )}
        </div>
      </div>

      {/* Featured / Popular Artists Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-bg-border pb-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-light" /> Popular Artists
          </h3>
          <span className="text-xs text-content-tertiary">Select to view complete catalog</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredPopular.map((artist) => {
            const previewImg = artistPreviewMap[artist.name];
            return (
              <button
                key={artist.name}
                onClick={() => onOpenArtist(artist.name)}
                className="group flex flex-col items-center p-3 rounded-xl bg-bg-card hover:bg-bg-hover border border-bg-border hover:border-white/15 transition text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-2.5 shadow-md border-2 border-white/10 group-hover:scale-105 group-hover:border-accent/50 transition-all duration-200 bg-black shrink-0 relative">
                  {previewImg ? (
                    <img src={previewImg} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/40 to-accent text-white font-bold text-lg">
                      {artist.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-content-primary group-hover:text-white truncate w-full">
                  {artist.name}
                </p>
                <span className="text-[10px] text-content-tertiary truncate w-full mt-0.5">
                  {artist.genre}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Search Results / Discography Section */}
      {hasSearched && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-bg-border pb-3">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-accent-light" />
              <h3 className="text-sm font-bold text-white">
                Songs by "{searchTerm}"
              </h3>
              <span className="text-xs font-mono text-content-tertiary">
                ({searchResults.length} tracks found)
              </span>
            </div>

            <button
              onClick={() => onOpenArtist(searchTerm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/25 text-accent-light text-xs font-semibold transition"
            >
              <span>View Full Artist Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-xl bg-bg-card skeleton" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-bg-card rounded-2xl border border-bg-border">
              <Users className="w-10 h-10 mx-auto text-content-tertiary opacity-40" />
              <p className="text-sm font-semibold text-white">No songs found for "{searchTerm}"</p>
              <p className="text-xs text-content-secondary">Try searching with a different spelling or artist name</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map((item) => {
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

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-[13px] font-semibold line-clamp-2 leading-snug ${isCurrent ? 'text-accent-light' : 'text-content-primary group-hover:text-white'}`}>
                          {item.title}
                        </h4>
                        <p 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenArtist(item.channelTitle);
                          }}
                          className="text-[11px] text-content-secondary hover:text-white hover:underline truncate mt-1 cursor-pointer"
                        >
                          {item.channelTitle}
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

                        {/* Add to Playlist button */}
                        <button
                          onClick={(e) => handleAddToPlaylist(e, item)}
                          title="Add to playlist"
                          className={`p-1.5 rounded-lg border transition ${
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

                        {/* Favorite button */}
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
        </section>
      )}
    </div>
  );
};
