import { Track } from '../types';

/**
 * Extracts a YouTube Video ID from any standard or shortened YouTube URL or raw ID.
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard URL formats
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /music\.youtube\.com\/watch\?v=([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Cleans YouTube video titles into clean { artist, title } format like Spotify.
 * Removes common music video noise like "(Official Music Video)", "[Audio]", etc.
 */
export function cleanYouTubeMetadata(rawTitle: string, authorName?: string): { title: string; artist: string } {
  if (!rawTitle) {
    return { title: 'Unknown Title', artist: authorName || 'YouTube Artist' };
  }

  // Remove common video noise tags
  let cleaned = rawTitle
    .replace(/\s*[([{\u3010](official\s*(music\s*)?video|official\s*audio|visualizer|lyric\s*video|lyrics|audio|mv|hd|4k|hq|remastered)[)\]}\u3011]/gi, '')
    .replace(/\s*\|.*$/, '')
    .trim();

  // If "Artist - Title" format exists
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (artist && title) {
      return {
        artist: artist.replace(/^["']|["']$/g, ''),
        title: title.replace(/^["']|["']$/g, ''),
      };
    }
  }

  // Clean author name if it ends with " - Topic" or "VEVO"
  let fallbackArtist = authorName || 'YouTube Music';
  fallbackArtist = fallbackArtist.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();

  return {
    title: cleaned.replace(/^["']|["']$/g, '') || rawTitle,
    artist: fallbackArtist,
  };
}

/**
 * Fetches YouTube video metadata via public oEmbed endpoints with zero API keys required.
 */
export async function fetchYouTubeTrack(urlOrId: string): Promise<Track> {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) {
    throw new Error('Invalid YouTube URL or Video ID. Please enter a valid YouTube link.');
  }

  const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let rawTitle = `YouTube Track (${videoId})`;
  let authorName = 'YouTube';
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // 1. Try noembed.com (CORS-friendly public proxy for oEmbed)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(standardUrl)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.title) rawTitle = data.title;
      if (data.author_name) authorName = data.author_name;
      if (data.thumbnail_url) thumbnail = data.thumbnail_url;
    }
  } catch {
    // 2. Try YouTube's direct oEmbed endpoint as fallback
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) rawTitle = data.title;
        if (data.author_name) authorName = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch {
      // Fallback silently to videoId defaults
    }
  }

  const { title, artist } = cleanYouTubeMetadata(rawTitle, authorName);

  return {
    id: `yt_${videoId}`,
    title,
    artist,
    artistId: `yt_author_${videoId}`,
    artistHandle: authorName,
    artworkUrl: thumbnail,
    streamUrl: `youtube:${videoId}`,
    duration: 0, // Injected dynamically when YT player loads
    genre: 'YouTube Music',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: [standardUrl],
    permalink: standardUrl,
    source: 'youtube',
    youtubeId: videoId,
    youtubeUrl: standardUrl,
    user: {
      id: `yt_user_${videoId}`,
      name: authorName,
      handle: authorName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      profilePicture: thumbnail,
    },
  };
}

/**
 * Curated preset YouTube songs for 1-click testing & discovery.
 */
export const POPULAR_YOUTUBE_TRACKS: Track[] = [
  {
    id: 'yt_jfKfPfyJRdk',
    title: 'beats to relax/study to',
    artist: 'Lofi Girl',
    artistId: 'yt_lofigirl',
    artistHandle: 'Lofi Girl',
    artworkUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    streamUrl: 'youtube:jfKfPfyJRdk',
    duration: 215,
    genre: 'Lofi Hip Hop',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: ['https://www.youtube.com/watch?v=jfKfPfyJRdk'],
    permalink: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    source: 'youtube',
    youtubeId: 'jfKfPfyJRdk',
    youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  },
  {
    id: 'yt_4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill synth / retro beats',
    artist: 'Lofi Girl Synthwave',
    artistId: 'yt_synthwave',
    artistHandle: 'Lofi Girl',
    artworkUrl: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    streamUrl: 'youtube:4xDzrJKXOOY',
    duration: 180,
    genre: 'Synthwave / Chill',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: ['https://www.youtube.com/watch?v=4xDzrJKXOOY'],
    permalink: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    source: 'youtube',
    youtubeId: '4xDzrJKXOOY',
    youtubeUrl: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
  },
  {
    id: 'yt_fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    artistId: 'yt_queen',
    artistHandle: 'Queen Official',
    artworkUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    streamUrl: 'youtube:fJ9rUzIMcZQ',
    duration: 359,
    genre: 'Classic Rock',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: ['https://www.youtube.com/watch?v=fJ9rUzIMcZQ'],
    permalink: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    source: 'youtube',
    youtubeId: 'fJ9rUzIMcZQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
  },
  {
    id: 'yt_5NV6Rdv1a3I',
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell Williams',
    artistId: 'yt_daftpunk',
    artistHandle: 'Daft Punk',
    artworkUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    streamUrl: 'youtube:5NV6Rdv1a3I',
    duration: 248,
    genre: 'Funk / Dance',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: ['https://www.youtube.com/watch?v=5NV6Rdv1a3I'],
    permalink: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I',
    source: 'youtube',
    youtubeId: '5NV6Rdv1a3I',
    youtubeUrl: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I',
  },
  {
    id: 'yt_4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    artistId: 'yt_theweeknd',
    artistHandle: 'The Weeknd',
    artworkUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    streamUrl: 'youtube:4NRXx6U8ABQ',
    duration: 200,
    genre: 'Pop / Synth-Pop',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: ['https://www.youtube.com/watch?v=4NRXx6U8ABQ'],
    permalink: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    source: 'youtube',
    youtubeId: '4NRXx6U8ABQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
  },
  {
    id: 'yt_dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    artistId: 'yt_rickastley',
    artistHandle: 'Rick Astley',
    artworkUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    streamUrl: 'youtube:dQw4w9WgXcQ',
    duration: 213,
    genre: '80s Pop / Dance',
    downloadable: false,
    downloadGated: false,
    isStreamGated: false,
    mirrors: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    permalink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    source: 'youtube',
    youtubeId: 'dQw4w9WgXcQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];
