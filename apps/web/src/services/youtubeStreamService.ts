import { Track } from '@melody/core';
import { localMusicService } from './localMusicService';
import { offlineStorage } from './offlineStorage';

// Public Piped + Invidious instances for stream extraction (no API key needed)
const STREAM_INSTANCES = [
  { base: 'https://api.piped.private.coffee', type: 'piped' },
  { base: 'https://cf.piped.video', type: 'piped' },
  { base: 'https://piped.video', type: 'piped' },
  { base: 'https://invidious.snopyta.org', type: 'invidious' },
  { base: 'https://invidious.kavin.rocks', type: 'invidious' },
  { base: 'https://vid.puffyan.us', type: 'invidious' },
];

export const youtubeStreamService = {
  /**
   * Extract a direct audio stream URL for a YouTube video ID via Piped/Invidious.
   * These public instances serve streams without embed restrictions or age-gating.
   * Returns null if all instances fail.
   */
  async getAudioStreamUrl(videoId: string): Promise<string | null> {
    for (const { base, type } of STREAM_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        let audioUrl: string | null = null;

        if (type === 'piped') {
          // Piped API: /streams/{videoId}
          const res = await fetch(`${base}/streams/${videoId}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          clearTimeout(timeout);
          if (!res.ok) continue;
          const data = await res.json();
          // audioStreams is sorted best-quality first; pick opus or m4a
          const streams: any[] = data.audioStreams || [];
          const preferred = streams.find((s: any) =>
            s.mimeType?.includes('opus') || s.mimeType?.includes('audio')
          ) || streams[0];
          audioUrl = preferred?.url || null;

        } else if (type === 'invidious') {
          // Invidious API: /api/v1/videos/{videoId}
          const res = await fetch(`${base}/api/v1/videos/${videoId}?fields=adaptiveFormats`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          clearTimeout(timeout);
          if (!res.ok) continue;
          const data = await res.json();
          const formats: any[] = data.adaptiveFormats || [];
          const audioFormats = formats.filter((f: any) => f.type?.startsWith('audio'));
          // Pick highest quality
          audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
          audioUrl = audioFormats[0]?.url || null;
        }

        if (audioUrl) {
          return audioUrl;
        }
      } catch {
        // try next instance
      }
    }
    return null;
  },

  /**
   * Save a local or Audius track to offline device storage.
   * YouTube tracks cannot and must not be downloaded (compliance with Terms of Service).
   */
  async downloadToDeviceStorage(
    track: Track,
    onProgress?: (pct: number) => void
  ): Promise<{ savedInApp: boolean; exportedFile: boolean }> {
    if (track.source === 'youtube') {
      throw new Error('YouTube audio downloads are not supported to adhere to YouTube Terms of Service.');
    }

    onProgress?.(10);
    try {
      if (track.streamUrl.startsWith('blob:') || track.id.startsWith('local_')) {
        onProgress?.(100);
        return { savedInApp: true, exportedFile: true };
      }

      // Handle stream downloading for authorized tracks (Audius)
      onProgress?.(30);
      const res = await fetch(track.streamUrl);
      if (!res.ok) throw new Error('Failed to fetch track audio data.');

      const blob = await res.blob();
      onProgress?.(70);

      // Save to IndexedDB
      await offlineStorage.saveTrackBlob(track, blob);

      // Prompt browser download
      const safeName = `${track.artist} - ${track.title}`.replace(/[/\\?%*:|"<>]/g, '_');
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${safeName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      onProgress?.(100);
      return { savedInApp: true, exportedFile: true };
    } catch (err) {
      console.error('Download to device storage error:', err);
      throw err;
    }
  },
};
