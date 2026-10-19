export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artworkUrl: string;
  streamUrl: string;
  duration: number; // in seconds
  genre?: string;
  playCount?: number;
  downloadable: boolean;
  downloadGated: boolean;
  isStreamGated: boolean;
  mirrors: string[];
  permalink?: string;
  user?: {
    id: string;
    name: string;
    handle: string;
    profilePicture?: string;
  };
  source?: 'audius' | 'youtube' | 'offline';
  youtubeId?: string;
  youtubeUrl?: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LrcLine {
  time: number; // in seconds
  text: string;
}

export interface Lyrics {
  trackId: string;
  trackTitle?: string;
  artistName?: string;
  plainLyrics?: string;
  syncedLyrics?: string;
  lines: LrcLine[];
  source: 'lrclib' | 'user' | 'none';
  synced: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  preferredBitrate: 'auto' | 'high' | 'standard';
  createdAt: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  playbackSource: 'stream' | 'offline';
  mediaMode: 'audio' | 'video';
  isLoading: boolean;
  error: string | null;
}

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error' | 'unauthorized';

export interface DownloadItem {
  trackId: string;
  track: Track;
  status: DownloadStatus;
  progress: number; // 0 to 100
  blob?: Blob;
  sizeBytes?: number;
  downloadedAt?: string;
  error?: string;
}
