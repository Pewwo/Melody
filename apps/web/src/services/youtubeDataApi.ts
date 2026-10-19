export interface YouTubeVideoItem {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

const SEARCH_FALLBACK_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://cf.piped.video',
  'https://piped.video',
];

// Top trending global artists for fetching individual song releases (no playlists/compilations)
const TRENDING_ARTISTS = [
  'The Weeknd',
  'Taylor Swift',
  'Bruno Mars',
  'Billie Eilish',
  'Drake',
  'Sabrina Carpenter',
  'Post Malone',
  'Dua Lipa',
  'Ed Sheeran',
  'Kendrick Lamar',
  'Ariana Grande',
  'Coldplay',
  'Olivia Rodrigo',
  'Travis Scott',
];

export const youtubeDataApi = {
  isConfigured(): boolean {
    return Boolean(YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your_youtube_api_key_here');
  },

  /**
   * Helper that checks if a video result is a single song (not a playlist, 1-hour mix, or compilation)
   */
  isSingleSong(it: any): boolean {
    if (it.type === 'playlist') return false;
    
    // Check duration in seconds: single tracks are typically 1 min to 10 min
    const dur = it.duration;
    if (dur && typeof dur === 'number') {
      if (dur > 660 || dur < 50) return false; // Filter out >11 minute compilations & shorts
    }

    const titleLower = (it.title || '').toLowerCase();
    const bannedKeywords = [
      'playlist',
      'full album',
      'compilation',
      'top 50',
      'top 100',
      'best songs of',
      'greatest hits album',
      'hour mix',
      '1 hour',
      '2 hour',
      '3 hour',
      'songs playlist',
      'jukebox',
    ];

    if (bannedKeywords.some((w) => titleLower.includes(w))) {
      return false;
    }

    return true;
  },

  async searchMusic(query: string, maxResults = 16): Promise<YouTubeVideoItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Try Google YouTube Data API v3 first
    if (this.isConfigured()) {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('type', 'video');
        url.searchParams.set('videoCategoryId', '10'); // Music category
        url.searchParams.set('maxResults', String(maxResults));
        url.searchParams.set('key', YOUTUBE_API_KEY);

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const items: any[] = data.items || [];
          if (items.length > 0) {
            return this.mapYouTubeApiItems(items);
          }
        }
      } catch (err) {
        console.warn('YouTube Search API fetch failed, falling back:', err);
      }
    }

    // 2. High-reliability fallback (multi-instance search API)
    return await this.searchViaFallback(trimmed, maxResults);
  },

  async searchViaFallback(query: string, maxResults = 16): Promise<YouTubeVideoItem[]> {
    for (const base of SEARCH_FALLBACK_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}&filter=all`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const items: any[] = Array.isArray(data.items) ? data.items : [];

          // Filter strictly for single songs (exclude playlists, mixes, albums)
          const streams = items
            .filter((it: any) => (it.type === 'stream' || it.url?.includes('/watch?v=')) && this.isSingleSong(it))
            .slice(0, maxResults);

          if (streams.length > 0) {
            return streams.map((it: any) => {
              const videoId = it.url ? it.url.replace('/watch?v=', '').split('&')[0] : '';
              return {
                id: videoId,
                title: decodeHtmlEntities(it.title || 'Unknown Title'),
                channelTitle: decodeHtmlEntities(it.uploaderName || it.author || 'Artist'),
                description: it.shortDescription || '',
                thumbnailUrl: videoId
                  ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                  : it.thumbnail || '',
                publishedAt: it.uploadedDate || '',
                duration: formatSecondsDuration(it.duration || 0),
                viewCount: formatViews(String(it.views || 0)),
              };
            });
          }
        }
      } catch {
        // try next instance
      }
    }

    return [];
  },

  async mapYouTubeApiItems(items: any[]): Promise<YouTubeVideoItem[]> {
    const videoIds = items.map(item => item.id?.videoId).filter(Boolean).join(',');
    let durationMap: Record<string, { duration: string; viewCount: string }> = {};

    if (videoIds && this.isConfigured()) {
      try {
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'contentDetails,statistics');
        detailsUrl.searchParams.set('id', videoIds);
        detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const detailsRes = await fetch(detailsUrl.toString());
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          for (const v of detailsData.items || []) {
            durationMap[v.id] = {
              duration: formatIsoDuration(v.contentDetails?.duration || ''),
              viewCount: formatViews(v.statistics?.viewCount || '0'),
            };
          }
        }
      } catch {}
    }

    return items
      .filter((item) => {
        const titleLower = (item.snippet?.title || '').toLowerCase();
        return !titleLower.includes('playlist') && !titleLower.includes('full album');
      })
      .map((item) => {
        const id = item.id?.videoId || '';
        const details = durationMap[id] || {};
        return {
          id,
          title: decodeHtmlEntities(item.snippet?.title || 'Unknown Title'),
          channelTitle: decodeHtmlEntities(item.snippet?.channelTitle || 'Unknown Artist'),
          description: item.snippet?.description || '',
          thumbnailUrl:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.high?.url ||
            `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          publishedAt: item.snippet?.publishedAt || '',
          duration: details.duration || '3:30',
          viewCount: details.viewCount,
        };
      });
  },

  /**
   * Fetches authentic trending songs by leading individual recording artists (NOT playlists or long compilations)
   */
  async getTrendingMusic(maxResults = 14): Promise<YouTubeVideoItem[]> {
    const artistsToFetch = TRENDING_ARTISTS.slice(0, maxResults);

    try {
      // Query individual trending songs per artist concurrently
      const songPromises = artistsToFetch.map(async (artist) => {
        const query = `${artist} official music video`;
        for (const base of SEARCH_FALLBACK_INSTANCES) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}&filter=all`, {
              signal: controller.signal,
              headers: { Accept: 'application/json' },
            });
            clearTimeout(timeout);

            if (res.ok) {
              const data = await res.json();
              const items: any[] = Array.isArray(data.items) ? data.items : [];

              // Find the top genuine single track
              const singleTrack = items.find(
                (it: any) =>
                  (it.type === 'stream' || it.url?.includes('/watch?v=')) &&
                  this.isSingleSong(it)
              );

              if (singleTrack) {
                const videoId = singleTrack.url
                  ? singleTrack.url.replace('/watch?v=', '').split('&')[0]
                  : '';

                return {
                  id: videoId,
                  title: decodeHtmlEntities(singleTrack.title || 'Unknown Title'),
                  channelTitle: decodeHtmlEntities(singleTrack.uploaderName || artist),
                  description: singleTrack.shortDescription || '',
                  thumbnailUrl: videoId
                    ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                    : singleTrack.thumbnail || '',
                  publishedAt: singleTrack.uploadedDate || '',
                  duration: formatSecondsDuration(singleTrack.duration || 210),
                  viewCount: formatViews(String(singleTrack.views || 0)),
                } as YouTubeVideoItem;
              }
            }
          } catch {
            // try next instance
          }
        }
        return null;
      });

      const results = await Promise.all(songPromises);
      const filtered = results.filter((r): r is YouTubeVideoItem => r !== null && Boolean(r.id));
      if (filtered.length > 0) {
        return filtered;
      }
    } catch (e) {
      console.warn('Error fetching artist trending songs:', e);
    }

    // Secondary fallback with strict single-song filter
    return await this.searchViaFallback('Billboard Hot 100 hit official video', maxResults);
  },
};

function formatSecondsDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '3:30';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatIsoDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '3:30';
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  if (hours > 0) {
    const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

function formatViews(viewsStr: string): string {
  const n = parseInt(viewsStr, 10);
  if (isNaN(n) || n === 0) return '';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B views`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function decodeHtmlEntities(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}
