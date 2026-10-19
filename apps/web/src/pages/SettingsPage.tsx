import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  HardDrive, 
  Trash2, 
  ShieldCheck, 
  Radio, 
  Volume2, 
  Check, 
  Info,
  Youtube
} from 'lucide-react';
import { formatBytes } from '@melody/core';
import { offlineStorage } from '../services/offlineStorage';
import { localMusicService } from '../services/localMusicService';
import { usePlayer } from '../context/PlayerContext';

export const SettingsPage: React.FC = () => {
  const { volume, setVolume } = usePlayer();
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [storageEstimate, setStorageEstimate] = useState<{ usedBytes: number; quotaBytes: number; percentage: number }>({ usedBytes: 0, quotaBytes: 0, percentage: 0 });
  const [clearing, setClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const tracks = await offlineStorage.getOfflineTracks();
      setOfflineCount(tracks.length);
      const est = await offlineStorage.getStorageEstimate();
      setStorageEstimate(est);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to delete all offline audio downloads? Local files in My Music will be preserved.')) {
      return;
    }

    setClearing(true);
    try {
      const tracks = await offlineStorage.getOfflineTracks();
      for (const track of tracks) {
        await offlineStorage.removeOfflineTrack(track.id);
      }
      await loadStorageInfo();
      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to clear storage:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto anim-fade-up pb-28">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-accent-light" />
          <span>Settings</span>
        </h2>
        <p className="text-xs md:text-sm text-content-secondary mt-1">
          App configuration, storage management, and streaming settings.
        </p>
      </div>

      {/* Free Stack Notice */}
      <div className="rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/20 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>YouTube Music & Local Audio Player</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Stream music videos using the official YouTube Data API v3 and embedded player, and import local audio files (.mp3, .m4a, .flac, .wav) for physical offline playback with screen-off audio support.
        </p>
      </div>

      {/* Audio Playback Settings */}
      <section className="rounded-2xl p-6 border border-bg-border bg-bg-card space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-accent-light" /> Master Volume
          </h4>
          <p className="text-xs text-content-secondary mt-0.5">Adjust default playback output level</p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full max-w-xs accent-accent"
          />
          <span className="font-mono text-xs text-content-primary">{Math.round(volume * 100)}%</span>
        </div>
      </section>

      {/* Local Storage & Cache */}
      <section className="rounded-2xl p-6 border border-bg-border bg-bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-accent-light" />
            <div>
              <h4 className="text-sm font-semibold text-white">Device Storage & Offline Cache</h4>
              <p className="text-xs text-content-secondary">Manage downloaded songs in browser IndexedDB</p>
            </div>
          </div>
          <button
            onClick={handleClearCache}
            disabled={clearing || offlineCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              clearedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {clearedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Cleared!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-bg-surface border border-bg-border">
            <span className="text-[11px] text-content-secondary">Offline Songs</span>
            <p className="text-lg font-bold text-white mt-0.5">{offlineCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-bg-surface border border-bg-border">
            <span className="text-[11px] text-content-secondary">Storage Used</span>
            <p className="text-lg font-bold text-accent-light mt-0.5">{formatBytes(storageEstimate.usedBytes)}</p>
          </div>
          <div className="p-3 rounded-xl bg-bg-surface border border-bg-border">
            <span className="text-[11px] text-content-secondary">Storage Available</span>
            <p className="text-lg font-bold text-content-primary mt-0.5">{formatBytes(storageEstimate.quotaBytes)}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="rounded-2xl p-6 border border-bg-border bg-bg-card space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Info className="w-4 h-4 text-accent-light" />
          <span>About Melody Pure Tuber</span>
        </div>
        <p className="text-xs text-content-secondary leading-relaxed">
          Version 2.0.0 · Powered by official YouTube Data API v3, HTML5 Audio Engine with Screen-Off background playback for physical device files, and local IndexedDB offline storage.
        </p>
      </section>
    </div>
  );
};
