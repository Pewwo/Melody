import { Track } from '@melody/core';

// Manages playback history and search history to power personalized recommendations
const RECENTLY_PLAYED_KEY = 'melody_recently_played_tracks';
const SEARCH_HISTORY_KEY = 'melody_search_history';
const MAX_RECENT_ITEMS = 30;

export interface PlayedTrackRecord {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  youtubeId?: string;
  playedAt: number;
}

export const searchHistoryService = {
  /**
   * Save a track when the user plays it.
   */
  recordPlay(track: Track) {
    if (!track || !track.title) return;
    try {
      const records = this.getRecentlyPlayed();
      const cleanArtist = track.artist ? track.artist.replace(/ - Topic|VEVO/gi, '').trim() : '';

      const record: PlayedTrackRecord = {
        id: track.id,
        title: track.title,
        artist: cleanArtist || track.artist || 'Unknown Artist',
        artworkUrl: track.artworkUrl,
        youtubeId: track.youtubeId,
        playedAt: Date.now(),
      };

      // Filter out existing occurrence of this track and push to front
      const filtered = records.filter(
        (r) => r.id !== track.id && !(r.title.toLowerCase() === track.title.toLowerCase() && r.artist.toLowerCase() === record.artist.toLowerCase())
      );
      const updated = [record, ...filtered].slice(0, MAX_RECENT_ITEMS);
      localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));

      // Also record the artist as a search topic
      if (cleanArtist && cleanArtist.length > 2) {
        this.addQuery(cleanArtist);
      }
    } catch (err) {
      console.warn('Failed to record played track:', err);
    }
  },

  /**
   * Get all recently played tracks, latest first.
   */
  getRecentlyPlayed(): PlayedTrackRecord[] {
    try {
      const data = localStorage.getItem(RECENTLY_PLAYED_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Get all recorded search queries.
   */
  getHistory(): string[] {
    try {
      const data = localStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Add a search query to the history.
   */
  addQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    try {
      const history = this.getHistory();
      const filtered = history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save search history:', err);
    }
  },

  /**
   * Clear all playback and search history.
   */
  clearHistory() {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      localStorage.removeItem(RECENTLY_PLAYED_KEY);
    } catch {}
  },

  /**
   * Generate recommendations prioritizing recently played artists and songs,
   * falling back to search history queries.
   */
  getRecommendations(): { primaryTopic: string | null; allTopics: string[]; sourceTrack?: PlayedTrackRecord } {
    const played = this.getRecentlyPlayed();
    if (played.length > 0) {
      const latestTrack = played[0];
      // Pick artist if valid and informative, or title
      const primaryTopic = latestTrack.artist && latestTrack.artist !== 'Unknown Artist'
        ? latestTrack.artist
        : latestTrack.title;

      // Extract unique artists/titles from recent played
      const topicsSet = new Set<string>();
      for (const t of played) {
        if (t.artist && t.artist !== 'Unknown Artist' && t.artist.length > 2) {
          topicsSet.add(t.artist);
        } else if (t.title) {
          topicsSet.add(t.title);
        }
        if (topicsSet.size >= 6) break;
      }

      return {
        primaryTopic,
        allTopics: Array.from(topicsSet),
        sourceTrack: latestTrack,
      };
    }

    // Fallback to search history if nothing has been played yet
    const searchHistory = this.getHistory();
    if (searchHistory.length > 0) {
      return {
        primaryTopic: searchHistory[0],
        allTopics: searchHistory.slice(0, 5),
      };
    }

    return { primaryTopic: null, allTopics: [] };
  },
};
