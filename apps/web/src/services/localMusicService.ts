import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track } from '@melody/core';

export interface LocalAudioTrack extends Track {
  fileName: string;
  fileFormat: string;
  sizeBytes: number;
  importedAt: string;
  source: 'offline';
}

interface LocalMusicDB extends DBSchema {
  local_tracks: {
    key: string;
    value: LocalAudioTrack;
  };
  local_blobs: {
    key: string;
    value: { trackId: string; blob: Blob; mimeType: string };
  };
}

const DB_NAME = 'melody-local-music-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LocalMusicDB>> | null = null;

function getDb(): Promise<IDBPDatabase<LocalMusicDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LocalMusicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('local_tracks')) {
          db.createObjectStore('local_tracks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('local_blobs')) {
          db.createObjectStore('local_blobs', { keyPath: 'trackId' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Extracts real audio duration from a local audio file Blob using browser Audio API.
 */
function extractAudioDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      const duration = audio.duration;
      cleanUp();
      resolve(isNaN(duration) || !isFinite(duration) ? 0 : Math.round(duration));
    };

    const onError = () => {
      cleanUp();
      resolve(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = objectUrl;
  });
}

/**
 * Generates an SVG album cover thumbnail with unique gradient based on track title.
 */
function generateGradientArtwork(title: string, artist: string, format: string): string {
  const hash = (title + artist).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    ['#8B5CF6', '#EC4899'],
    ['#3B82F6', '#10B981'],
    ['#F59E0B', '#EF4444'],
    ['#06B6D4', '#3B82F6'],
    ['#6366F1', '#A855F7'],
    ['#14B8A6', '#0EA5E9'],
  ];
  const [c1, c2] = colors[hash % colors.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" rx="30" fill="url(#grad)" />
      <circle cx="150" cy="150" r="60" fill="rgba(0,0,0,0.3)" />
      <circle cx="150" cy="150" r="20" fill="rgba(255,255,255,0.8)" />
      <text x="150" y="245" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="white" text-anchor="middle" letter-spacing="2">
        ${format.toUpperCase()}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Parses artist and title from file name (e.g., "The Weeknd - Blinding Lights.mp3").
 */
function parseFileInfo(fileName: string): { title: string; artist: string; format: string } {
  const lastDot = fileName.lastIndexOf('.');
  const baseName = lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
  const ext = lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : 'mp3';

  if (baseName.includes(' - ')) {
    const parts = baseName.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return { title: title || baseName, artist: artist || 'Local Artist', format: ext };
  }

  return { title: baseName, artist: 'My Music Library', format: ext };
}

export const localMusicService = {
  /**
   * Imports an authorized local audio file, extracts metadata, and saves to IndexedDB.
   */
  async importAudioFile(file: File): Promise<LocalAudioTrack> {
    const validFormats = ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'webm'];
    const { title, artist, format } = parseFileInfo(file.name);

    if (!validFormats.includes(format)) {
      throw new Error(`Unsupported audio format: .${format}. Please select an MP3, M4A, AAC, FLAC, WAV, or OGG file.`);
    }

    const duration = await extractAudioDuration(file);
    const trackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const artworkUrl = generateGradientArtwork(title, artist, format);

    const localTrack: LocalAudioTrack = {
      id: trackId,
      title,
      artist,
      artistId: 'local_user',
      artistHandle: 'local',
      artworkUrl,
      streamUrl: `blob:${trackId}`, // Dynamic lookup via getPlaybackUrl
      duration,
      genre: 'Local Audio',
      downloadable: false,
      downloadGated: false,
      isStreamGated: false,
      mirrors: [],
      source: 'offline',
      fileName: file.name,
      fileFormat: format.toUpperCase(),
      sizeBytes: file.size,
      importedAt: new Date().toISOString(),
    };

    const db = await getDb();

    // Store raw audio blob
    await db.put('local_blobs', {
      trackId,
      blob: file,
      mimeType: file.type || `audio/${format}`,
    });

    // Store track metadata
    await db.put('local_tracks', localTrack);

    return localTrack;
  },

  /**
   * Imports multiple local audio files with progress callback.
   */
  async importMultipleFiles(
    files: FileList | File[],
    onProgress?: (completed: number, total: number, lastTrack?: LocalAudioTrack) => void
  ): Promise<LocalAudioTrack[]> {
    const importedTracks: LocalAudioTrack[] = [];
    const fileArray = Array.from(files);
    let count = 0;

    for (const file of fileArray) {
      try {
        const track = await this.importAudioFile(file);
        importedTracks.push(track);
        count++;
        if (onProgress) onProgress(count, fileArray.length, track);
      } catch (err) {
        console.warn(`Skipping invalid or unsupported file ${file.name}:`, err);
      }
    }

    return importedTracks;
  },

  /**
   * Retrieves all imported local audio tracks sorted by importedAt descending.
   */
  async getAllLocalTracks(): Promise<LocalAudioTrack[]> {
    const db = await getDb();
    const tracks = await db.getAll('local_tracks');
    return tracks.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  },

  /**
   * Generates a temporary blob URL for offline playback in HTML5 Audio.
   */
  async getPlaybackUrl(trackId: string): Promise<string | null> {
    const db = await getDb();
    const record = await db.get('local_blobs', trackId);
    if (!record || !record.blob) return null;
    return URL.createObjectURL(record.blob);
  },

  /**
   * Deletes a local track and its audio blob from device storage.
   */
  async deleteLocalTrack(trackId: string): Promise<void> {
    const db = await getDb();
    await db.delete('local_blobs', trackId);
    await db.delete('local_tracks', trackId);
  },

  /**
   * Clear all imported local audio.
   */
  async clearAllLocalTracks(): Promise<void> {
    const db = await getDb();
    await db.clear('local_blobs');
    await db.clear('local_tracks');
  },

  /**
   * Search within imported local tracks.
   */
  async searchLocalTracks(query: string): Promise<LocalAudioTrack[]> {
    const all = await this.getAllLocalTracks();
    if (!query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.fileName.toLowerCase().includes(q) ||
        t.fileFormat.toLowerCase().includes(q)
    );
  },

  /**
   * Estimates device storage quota and usage.
   */
  async getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;
      const percentage = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
      return { usedBytes, quotaBytes, percentage };
    }
    return { usedBytes: 0, quotaBytes: 0, percentage: 0 };
  },
};
