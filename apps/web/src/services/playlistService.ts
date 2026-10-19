import { Track } from '@melody/core';
import { supabase } from './supabaseClient';

export interface PlaylistModel {
  id: string;
  name: string;
  ownerId: string;       // user email or user id who created it
  ownerName?: string;    // creator display name
  tracks: Track[];
  sharedWith: string[];  // array of user emails or IDs that have access
  isPublic?: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'melody_playlists_v2';

export const playlistService = {
  /**
   * Get all playlists from storage (raw).
   */
  getAllRawPlaylists(): PlaylistModel[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      // Migrate from old melody_playlists if existing
      const oldSaved = localStorage.getItem('melody_playlists');
      if (oldSaved) {
        const oldParsed = JSON.parse(oldSaved);
        if (Array.isArray(oldParsed)) {
          const migrated: PlaylistModel[] = oldParsed.map((p: any) => ({
            id: p.id || `pl_${Date.now()}`,
            name: p.name || 'Untitled Playlist',
            ownerId: p.ownerId || 'guest',
            ownerName: p.ownerName || 'Guest User',
            tracks: p.tracks || [],
            sharedWith: p.sharedWith || [],
            isPublic: false,
            createdAt: p.createdAt || Date.now(),
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (e) {
      console.warn('Failed to parse playlists:', e);
    }
    return [];
  },

  /**
   * Save playlists array to localStorage.
   */
  saveAllRawPlaylists(playlists: PlaylistModel[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
  },

  /**
   * Get only playlists visible to the given user:
   * 1. Created by this user (ownerId === userId)
   * 2. Shared with this user (sharedWith includes user email/id)
   * 3. If guest / not logged in, show playlists owned by 'guest' or created during this session
   */
  getVisiblePlaylists(userEmailOrId: string | null): PlaylistModel[] {
    const all = this.getAllRawPlaylists();
    const currentId = (userEmailOrId || 'guest').toLowerCase().trim();

    return all.filter((pl) => {
      const owner = (pl.ownerId || 'guest').toLowerCase().trim();
      if (owner === currentId) return true;
      if (Array.isArray(pl.sharedWith)) {
        return pl.sharedWith.some((sharedEmail) => sharedEmail.toLowerCase().trim() === currentId);
      }
      return false;
    });
  },

  /**
   * Create a new playlist.
   */
  createPlaylist(name: string, ownerEmailOrId: string | null, ownerDisplayName?: string): PlaylistModel {
    const all = this.getAllRawPlaylists();
    const ownerId = (ownerEmailOrId || 'guest').trim();
    const newPl: PlaylistModel = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      ownerId,
      ownerName: ownerDisplayName || (ownerId !== 'guest' ? ownerId.split('@')[0] : 'Guest User'),
      tracks: [],
      sharedWith: [],
      isPublic: false,
      createdAt: Date.now(),
    };

    all.push(newPl);
    this.saveAllRawPlaylists(all);
    return newPl;
  },

  /**
   * Add track to playlist.
   */
  addTrack(playlistId: string, track: Track) {
    const all = this.getAllRawPlaylists();
    const updated = all.map((pl) => {
      if (pl.id === playlistId) {
        if (!pl.tracks.some((t) => t.id === track.id)) {
          return { ...pl, tracks: [track, ...pl.tracks] };
        }
      }
      return pl;
    });
    this.saveAllRawPlaylists(updated);
  },

  /**
   * Remove track from playlist.
   */
  removeTrack(playlistId: string, trackId: string) {
    const all = this.getAllRawPlaylists();
    const updated = all.map((pl) => {
      if (pl.id === playlistId) {
        return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
      }
      return pl;
    });
    this.saveAllRawPlaylists(updated);
  },

  /**
   * Delete playlist (only owner can delete).
   */
  deletePlaylist(playlistId: string, userEmailOrId: string | null): boolean {
    const all = this.getAllRawPlaylists();
    const currentId = (userEmailOrId || 'guest').toLowerCase().trim();
    const pl = all.find((p) => p.id === playlistId);
    if (!pl) return false;

    // Verify ownership
    if (pl.ownerId.toLowerCase().trim() !== currentId) {
      return false;
    }

    const filtered = all.filter((p) => p.id !== playlistId);
    this.saveAllRawPlaylists(filtered);
    return true;
  },

  /**
   * Share playlist with a user by email or account identifier.
   */
  sharePlaylist(playlistId: string, targetEmailOrId: string, currentUserId: string | null): { success: boolean; message: string } {
    const all = this.getAllRawPlaylists();
    const target = targetEmailOrId.toLowerCase().trim();
    if (!target) {
      return { success: false, message: 'Please enter a valid email or account username.' };
    }

    const plIndex = all.findIndex((p) => p.id === playlistId);
    if (plIndex === -1) {
      return { success: false, message: 'Playlist not found.' };
    }

    const pl = all[plIndex];
    const currentId = (currentUserId || 'guest').toLowerCase().trim();

    // Only owner can manage sharing
    if (pl.ownerId.toLowerCase().trim() !== currentId) {
      return { success: false, message: 'Only the creator can share this playlist.' };
    }

    if (pl.ownerId.toLowerCase().trim() === target) {
      return { success: false, message: 'You are already the creator of this playlist.' };
    }

    const currentShares = Array.isArray(pl.sharedWith) ? [...pl.sharedWith] : [];
    if (currentShares.some((s) => s.toLowerCase().trim() === target)) {
      return { success: false, message: `Already shared with ${target}.` };
    }

    currentShares.push(target);
    all[plIndex] = { ...pl, sharedWith: currentShares };
    this.saveAllRawPlaylists(all);

    return { success: true, message: `Playlist shared with ${target}!` };
  },

  /**
   * Remove a user from shared access.
   */
  unsharePlaylist(playlistId: string, targetEmailOrId: string, currentUserId: string | null): boolean {
    const all = this.getAllRawPlaylists();
    const plIndex = all.findIndex((p) => p.id === playlistId);
    if (plIndex === -1) return false;

    const pl = all[plIndex];
    const currentId = (currentUserId || 'guest').toLowerCase().trim();
    if (pl.ownerId.toLowerCase().trim() !== currentId) return false;

    const target = targetEmailOrId.toLowerCase().trim();
    all[plIndex] = {
      ...pl,
      sharedWith: (pl.sharedWith || []).filter((s) => s.toLowerCase().trim() !== target),
    };
    this.saveAllRawPlaylists(all);
    return true;
  },
};
