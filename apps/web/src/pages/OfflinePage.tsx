import React, { useEffect, useState } from 'react';
import { DownloadCloud, Trash2, HardDrive, Play, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Track, formatBytes } from '@melody/core';
import { offlineStorage } from '../services/offlineStorage';
import { usePlayer } from '../context/PlayerContext';

interface OfflinePageProps {
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
  onRefreshStorage: () => void;
}

export const OfflinePage: React.FC<OfflinePageProps> = ({
  favoriteIds,
  onToggleFavorite,
  onRefreshStorage,
}) => {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [offlineTracks, setOfflineTracks] = useState<(Track & { downloadedAt: string; sizeBytes: number })[]>([]);
  const [storage, setStorage] = useState<{ usedBytes: number; quotaBytes: number; percentage: number }>({
    usedBytes: 0,
    quotaBytes: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadOfflineData = async () => {
    setLoading(true);
    try {
      const [tracks, estimate] = await Promise.all([
        offlineStorage.getOfflineTracks(),
        offlineStorage.getStorageEstimate(),
      ]);
      setOfflineTracks(tracks);
      setStorage(estimate);
      onRefreshStorage();
    } catch {
      setOfflineTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineData();
  }, []);

  const handlePlayOffline = async (item: Track) => {
    try {
      const blobUrl = await offlineStorage.getOfflinePlaybackUrl(item.id);
      if (blobUrl) {
        const offlineReadyTrack: Track = {
          ...item,
          streamUrl: blobUrl,
        };
        playTrack(offlineReadyTrack, offlineTracks);
      }
    } catch (err) {
      console.error('Failed to play offline track:', err);
    }
  };

  const handleRemove = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await offlineStorage.removeOfflineTrack(trackId);
    await loadOfflineData();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300 pb-24">
      {/* Header and Storage Monitor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-melody-border/60 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <DownloadCloud className="w-8 h-8 text-melody-secondary" />
            <span>Authorized Offline Music</span>
          </h2>
          <p className="text-xs md:text-sm text-melody-muted mt-1 max-w-xl">
            Songs cached directly in your local IndexedDB storage. Plays without internet connectivity for tracks permitted by artist licenses.
          </p>
        </div>

        {/* Local Storage Indicator Card */}
        <div className="glass-card rounded-2xl p-4 border border-melody-border/80 min-w-[280px]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 text-melody-muted font-medium">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              IndexedDB Storage
            </span>
            <span className="font-mono text-white font-semibold">
              {formatBytes(storage.usedBytes)}
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(2, storage.percentage))}%` }}
            />
          </div>

          <p className="text-[10px] text-melody-muted flex justify-between">
            <span>{offlineTracks.length} saved songs</span>
            <span>$0 Hosting Cost</span>
          </p>
        </div>
      </div>

      {/* Compliance / Permissions Info Alert */}
      <div className="p-4 rounded-2xl bg-melody-surface/60 border border-melody-border/80 flex items-start gap-3.5 text-xs text-melody-muted">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Artist Rights & Permissions Compliance</p>
          <p className="mt-0.5 leading-relaxed">
            Offline caching is only permitted for tracks where the creator explicitly enabled download access (<span className="font-mono text-emerald-300">access.download: true</span>). Tracks marked as stream-only by the artist cannot be downloaded, adhering strictly to intellectual property rights.
          </p>
        </div>
      </div>

      {/* Offline Track List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-melody-muted gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-melody-secondary" />
          <span>Loading offline library...</span>
        </div>
      ) : offlineTracks.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <DownloadCloud className="w-12 h-12 text-melody-muted/30 mx-auto" />
          <h4 className="text-base font-semibold text-white">No tracks downloaded yet</h4>
          <p className="text-xs text-melody-muted max-w-sm mx-auto">
            When browsing songs with authorized download permission, click the download icon to save them for zero-bandwidth offline listening.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-2 border border-melody-border/60">
          <div className="divide-y divide-melody-border/30">
            {offlineTracks.map((item, index) => {
              const isCurrent = currentTrack?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handlePlayOffline(item)}
                  className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition ${
                    isCurrent ? 'bg-melody-accent/15' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-xs text-melody-muted w-6 text-center">
                      {index + 1}
                    </span>
                    <img
                      src={item.artworkUrl}
                      alt={item.title}
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-melody-accentLight' : 'text-white'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-melody-muted truncate mt-0.5">
                        {item.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-melody-muted shrink-0">
                    <span className="hidden sm:inline">
                      {formatBytes(item.sizeBytes || 0)}
                    </span>
                    <button
                      onClick={(e) => handleRemove(item.id, e)}
                      className="p-2 rounded-lg text-melody-muted hover:text-red-400 hover:bg-white/5 transition"
                      title="Remove from offline storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
