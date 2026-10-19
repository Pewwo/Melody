import { Track } from '../types';

export interface AudiusConfig {
  appName?: string;
  cacheTtlMs?: number;
}

export class AudiusClient {
  private appName: string;
  private discoveryNodes: string[] = [
    'https://api.audius.co',
    'https://discoveryprovider.audius.co',
    'https://audius-discovery-1.altego.net',
    'https://dn2.monophonic.digital',
  ];
  private currentNodeIndex = 0;
  private lastHostResolution = 0;
  private cache = new Map<string, { timestamp: number; data: any }>();
  private cacheTtlMs: number;

  constructor(config: AudiusConfig = {}) {
    this.appName = config.appName || 'MelodyMusic';
    this.cacheTtlMs = config.cacheTtlMs ?? 3 * 60 * 1000; // 3 minutes cache
  }

  /**
   * Resolves the fastest or active Audius discovery node.
   */
  public async getBaseUrl(): Promise<string> {
    const now = Date.now();
    if (this.discoveryNodes.length > 1 && now - this.lastHostResolution < 15 * 60 * 1000) {
      return this.discoveryNodes[this.currentNodeIndex];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://api.audius.co', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          this.discoveryNodes = json.data;
          this.currentNodeIndex = 0;
          this.lastHostResolution = now;
          return this.discoveryNodes[0];
        }
      }
    } catch {
      // Fallback silently to pre-configured host
    }

    return this.discoveryNodes[this.currentNodeIndex];
  }

  private rotateNode() {
    this.currentNodeIndex = (this.currentNodeIndex + 1) % this.discoveryNodes.length;
  }

  /**
   * Request wrapper with automatic node rotation on failure and caching.
   */
  private async request<T>(path: string, params: Record<string, string | number | undefined> = {}, useCache = true): Promise<T> {
    const searchParams = new URLSearchParams();
    searchParams.set('app_name', this.appName);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }

    const queryStr = searchParams.toString();
    const cacheKey = `${path}?${queryStr}`;

    if (useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < this.cacheTtlMs) {
        return entry.data as T;
      }
    }

    let attempts = 0;
    const maxAttempts = Math.min(3, this.discoveryNodes.length);

    while (attempts < maxAttempts) {
      const base = await this.getBaseUrl();
      const fullUrl = `${base}/v1${path}?${queryStr}`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Audius API returned HTTP ${response.status}`);
        }

        const json = await response.json();
        const data = json.data as T;

        if (useCache) {
          this.cache.set(cacheKey, { timestamp: Date.now(), data });
        }

        return data;
      } catch (err) {
        attempts++;
        this.rotateNode();
        if (attempts >= maxAttempts) {
          throw err;
        }
      }
    }

    throw new Error('All Audius discovery nodes failed to respond.');
  }

  /**
   * Normalizes raw Audius Track API response into unified Melody Track entity.
   */
  public normalizeTrack(raw: any, baseUrl: string): Track {
    const artworkObj = raw.artwork || {};
    const artworkUrl =
      artworkObj['480x480'] ||
      artworkObj['1000x1000'] ||
      artworkObj['150x150'] ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';

    const mirrors: string[] = [];
    if (typeof raw.stream?.mirrors === 'string') {
      mirrors.push(...raw.stream.mirrors.split(' ').filter(Boolean));
    } else if (Array.isArray(raw.stream?.mirrors)) {
      mirrors.push(...raw.stream.mirrors);
    }

    // Direct stream redirect endpoint on discovery node
    const streamEndpoint = `${baseUrl}/v1/tracks/${raw.id}/stream?app_name=${encodeURIComponent(this.appName)}`;
    const streamUrl = raw.stream?.url || streamEndpoint;

    // Strict verification of download authorization
    const canDownload =
      Boolean(raw.access?.download) &&
      !raw.is_download_gated &&
      !raw.download_conditions;

    return {
      id: String(raw.id),
      title: raw.title || 'Untitled Track',
      artist: raw.user?.name || raw.user?.handle || 'Unknown Artist',
      artistId: String(raw.user?.id || raw.user_id || ''),
      artistHandle: raw.user?.handle,
      artworkUrl,
      streamUrl,
      duration: Number(raw.duration) || 0,
      genre: raw.genre || 'Music',
      playCount: Number(raw.play_count) || 0,
      downloadable: canDownload,
      downloadGated: Boolean(raw.is_download_gated),
      isStreamGated: Boolean(raw.is_stream_gated),
      mirrors,
      permalink: raw.permalink,
      user: raw.user
        ? {
            id: String(raw.user.id),
            name: raw.user.name,
            handle: raw.user.handle,
            profilePicture: raw.user.profile_picture?.['150x150'] || raw.user.profile_picture?.['480x480'],
          }
        : undefined,
    };
  }

  /**
   * Fetches trending tracks.
   */
  public async getTrending(limit: number = 20, genre?: string): Promise<Track[]> {
    const base = await this.getBaseUrl();
    const rawList = await this.request<any[]>('/tracks/trending', {
      limit,
      genre,
    });

    if (!Array.isArray(rawList)) return [];
    return rawList.map((t) => this.normalizeTrack(t, base));
  }

  /**
   * Fetches underground trending tracks.
   */
  public async getUndergroundTrending(limit: number = 20): Promise<Track[]> {
    const base = await this.getBaseUrl();
    const rawList = await this.request<any[]>('/tracks/trending/underground', {
      limit,
    });

    if (!Array.isArray(rawList)) return [];
    return rawList.map((t) => this.normalizeTrack(t, base));
  }

  /**
   * Search tracks by query string.
   */
  public async searchTracks(query: string, limit: number = 25): Promise<Track[]> {
    if (!query || !query.trim()) return [];
    const base = await this.getBaseUrl();
    const rawList = await this.request<any[]>('/tracks/search', {
      query: query.trim(),
      limit,
    });

    if (!Array.isArray(rawList)) return [];
    return rawList.map((t) => this.normalizeTrack(t, base));
  }

  /**
   * Get single track metadata by track ID.
   */
  public async getTrack(id: string): Promise<Track | null> {
    const base = await this.getBaseUrl();
    try {
      const raw = await this.request<any>(`/tracks/${id}`, {});
      if (!raw) return null;
      return this.normalizeTrack(raw, base);
    } catch {
      return null;
    }
  }

  /**
   * Returns standard stream redirect URL for an audio player.
   */
  public async getStreamUrl(trackId: string): Promise<string> {
    const base = await this.getBaseUrl();
    return `${base}/v1/tracks/${trackId}/stream?app_name=${encodeURIComponent(this.appName)}`;
  }
}

// Singleton export
export const audiusClient = new AudiusClient();
