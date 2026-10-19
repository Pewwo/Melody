import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track } from '@melody/core';

interface MelodyDB extends DBSchema {
  tracks: {
    key: string;
    value: Track & { downloadedAt: string; sizeBytes: number };
  };
  audio_blobs: {
    key: string;
    value: { trackId: string; blob: Blob; mimeType: string };
  };
}

const DB_NAME = 'melody-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MelodyDB>> | null = null;

function getDb(): Promise<IDBPDatabase<MelodyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MelodyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audio_blobs')) {
          db.createObjectStore('audio_blobs', { keyPath: 'trackId' });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineStorage = {
  /**
   * Verifies if a track is authorized for download according to artist and provider permissions.
   */
  canDownload(track: Track): boolean {
    return Boolean(track.downloadable && !track.downloadGated && !track.isStreamGated);
  },

  /**
   * Downloads authorized track audio with progress tracking and stores in IndexedDB.
   */
  async downloadTrack(
    track: Track,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<void> {
    if (!this.canDownload(track)) {
      throw new Error('This track is not authorized for offline caching by the artist or network.');
    }

    const response = await fetch(track.streamUrl, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch audio stream: HTTP ${response.status}`);
    }

    const contentLength = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();

    if (!reader) {
      const blob = await response.blob();
      await this.saveTrackBlob(track, blob);
      if (onProgress) onProgress(100);
      return;
    }

    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        receivedBytes += value.length;

        if (contentLength > 0 && onProgress) {
          const percent = Math.min(99, Math.round((receivedBytes / contentLength) * 100));
          onProgress(percent);
        }
      }
    }

    const blob = new Blob(chunks as any[], { type: 'audio/mpeg' });
    await this.saveTrackBlob(track, blob);
    if (onProgress) onProgress(100);
  },

  async saveTrackBlob(track: Track, blob: Blob): Promise<void> {
    const db = await getDb();
    const sizeBytes = blob.size;

    await db.put('audio_blobs', {
      trackId: track.id,
      blob,
      mimeType: blob.type || 'audio/mpeg',
    });

    await db.put('tracks', {
      ...track,
      downloadedAt: new Date().toISOString(),
      sizeBytes,
    });
  },

  /**
   * Retrieves all saved offline tracks.
   */
  async getOfflineTracks(): Promise<(Track & { downloadedAt: string; sizeBytes: number })[]> {
    const db = await getDb();
    return await db.getAll('tracks');
  },

  /**
   * Checks if a track exists in local offline storage.
   */
  async isTrackOffline(trackId: string): Promise<boolean> {
    const db = await getDb();
    const item = await db.get('tracks', trackId);
    return Boolean(item);
  },

  /**
   * Generates a local Blob URL for offline playback.
   */
  async getOfflinePlaybackUrl(trackId: string): Promise<string | null> {
    const db = await getDb();
    const record = await db.get('audio_blobs', trackId);
    if (!record || !record.blob) return null;
    return URL.createObjectURL(record.blob);
  },

  /**
   * Deletes a track from offline storage.
   */
  async removeOfflineTrack(trackId: string): Promise<void> {
    const db = await getDb();
    await db.delete('audio_blobs', trackId);
    await db.delete('tracks', trackId);
  },

  /**
   * Estimates browser storage usage and quota.
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
