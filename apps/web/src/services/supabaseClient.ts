import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Track } from '@melody/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SupabaseUserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
}

export const authService = {
  /**
   * Register a new user with email and password.
   */
  async signUp(email: string, password: string, username?: string) {
    if (!supabase) {
      // Local Guest mode fallback
      const mockUser = { id: `local_${Date.now()}`, email, username: username || email.split('@')[0] };
      localStorage.setItem('melody_user', JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    return { user: data.user, error };
  },

  /**
   * Log in an existing user.
   */
  async signIn(email: string, password: string) {
    if (!supabase) {
      // Local Guest mode fallback
      const mockUser = { id: `local_${Date.now()}`, email, username: email.split('@')[0] };
      localStorage.setItem('melody_user', JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, session: data.session, error };
  },

  /**
   * Log in using Google OAuth.
   */
  async signInWithGoogle() {
    if (!supabase) {
      // Local fallback simulation when Supabase credentials aren't set
      const mockUser = {
        id: `google_${Date.now()}`,
        email: 'user@gmail.com',
        username: 'Google User',
      };
      localStorage.setItem('melody_user', JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { data, error };
  },

  /**
   * Log out the current user.
   */
  async signOut() {
    localStorage.removeItem('melody_user');
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Send password reset email.
   */
  async resetPassword(email: string) {
    if (!supabase) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  /**
   * Sync favorites to Supabase cloud if logged in.
   */
  async syncFavorites(userId: string, favorites: Track[]) {
    if (!supabase) return;
    try {
      // Upsert favorite items
      const payload = favorites.map((track) => ({
        user_id: userId,
        track_id: track.id,
        track_metadata: track,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('user_favorites').upsert(payload, { onConflict: 'user_id,track_id' });
    } catch (err) {
      console.warn('Could not sync favorites to Supabase:', err);
    }
  },

  /**
   * Sync playlists to Supabase cloud if logged in.
   */
  async syncPlaylists(userId: string, playlists: Array<{ id: string; name: string; tracks: Track[] }>) {
    if (!supabase) return;
    try {
      for (const pl of playlists) {
        await supabase.from('playlists').upsert({
          id: pl.id,
          user_id: userId,
          name: pl.name,
          tracks_count: pl.tracks.length,
          tracks_data: pl.tracks,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Could not sync playlists to Supabase:', err);
    }
  },
};
