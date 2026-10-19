import { Lyrics } from '../types';
import { parseLrc } from '../utils/lrcParser';

export class LrcLibClient {
  private baseUrl = 'https://lrclib.net/api';

  /**
   * Fetches lyrics for a track using title, artist, and duration.
   */
  public async getLyrics(trackId: string, trackTitle: string, artistName: string, duration?: number): Promise<Lyrics | null> {
    try {
      const params = new URLSearchParams();
      params.set('track_name', trackTitle);
      params.set('artist_name', artistName);
      if (duration && duration > 0) {
        params.set('duration', Math.round(duration).toString());
      }

      const res = await fetch(`${this.baseUrl}/get?${params.toString()}`, {
        headers: {
          'Lrclib-Client': 'MelodyMusicApp (v1.0.0; https://github.com/melody-music)',
        },
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const syncedLyrics = data.syncedLyrics || undefined;
      const plainLyrics = data.plainLyrics || undefined;

      const lines = syncedLyrics ? parseLrc(syncedLyrics) : [];

      return {
        trackId,
        trackTitle,
        artistName,
        plainLyrics,
        syncedLyrics,
        lines,
        source: 'lrclib',
        synced: lines.length > 0,
      };
    } catch {
      return null;
    }
  }
}

export const lrcLibClient = new LrcLibClient();
