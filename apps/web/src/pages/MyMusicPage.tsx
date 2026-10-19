import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderDown, 
  HardDrive, 
  Play, 
  Trash2, 
  Search, 
  Filter, 
  Music, 
  Heart, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Shuffle, 
  Clock, 
  FileAudio,
  ListPlus,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { localMusicService, LocalAudioTrack } from '../services/localMusicService';
import { usePlayer } from '../context/PlayerContext';
import { Track, formatTime, formatBytes } from '@melody/core';

interface MyMusicPageProps {
  favoriteIds: Set<string>;
  onToggleFavorite: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

export const MyMusicPage: React.FC<MyMusicPageProps> = ({
  favoriteIds,
  onToggleFavorite,
  onAddToPlaylist,
}) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [tracks, setTracks] = useState<LocalAudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'duration' | 'size'>('recent');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState<{ completed: number; total: number } | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<{ usedBytes: number; quotaBytes: number; percentage: number }>({
    usedBytes: 0,
    quotaBytes: 0,
    percentage: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTracks, estimate] = await Promise.all([
        localMusicService.getAllLocalTracks(),
        localMusicService.getStorageEstimate(),
      ]);
      setTracks(allTracks);
      setStorageEstimate(estimate);
    } catch (err) {
      console.error('Failed to load local tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setImportProgress({ completed: 0, total: files.length });
    setImportNotice(null);

    try {
      const newTracks = await localMusicService.importMultipleFiles(files, (completed, total) => {
        setImportProgress({ completed, total });
      });

      setImportNotice(`Successfully imported ${newTracks.length} local audio track${newTracks.length === 1 ? '' : 's'}.`);
      await loadData();
    } catch (err: any) {
      setImportNotice(err.message || 'Import failed');
    } finally {
      setImportProgress(null);
      setTimeout(() => setImportNotice(null), 4000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (confirm('Delete this track from your local offline storage?')) {
      await localMusicService.deleteLocalTrack(trackId);
      await loadData();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all imported local audio files?')) {
      await localMusicService.clearAllLocalTracks();
      await loadData();
    }
  };

  // Filter and Sort
  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = selectedFormat === 'ALL' || t.fileFormat.toUpperCase() === selectedFormat;
    return matchesSearch && matchesFormat;
  });

  filteredTracks.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'duration') return b.duration - a.duration;
    if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
    return new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime();
  });

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalBytes = tracks.reduce((sum, t) => sum + (t.sizeBytes || 0), 0);

  const availableFormats = ['ALL', ...Array.from(new Set(tracks.map((t) => t.fileFormat.toUpperCase())))];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300 pb-28">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-melody-border/60 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                My Music
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                  Offline Library
                </span>
              </h2>
              <p className="text-xs md:text-sm text-melody-muted">
                Import and play your authorized local MP3, M4A, FLAC, WAV, and AAC files directly on your device.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats & Storage Meter */}
        <div className="flex items-center gap-4 bg-melody-card/80 border border-melody-border rounded-2xl p-3 text-xs">
          <div>
            <span className="text-melody-muted block text-[10px] uppercase font-semibold">Tracks</span>
            <span className="font-bold text-white text-base">{tracks.length}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-melody-muted block text-[10px] uppercase font-semibold">Total Size</span>
            <span className="font-bold text-white text-base">{formatBytes(totalBytes)}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-melody-muted block text-[10px] uppercase font-semibold">Length</span>
            <span className="font-bold text-white text-base">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Import Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-melody-accent bg-melody-accent/15 scale-101 shadow-glow-accent'
            : 'border-white/15 bg-melody-card/40 hover:bg-melody-card/70 hover:border-white/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".mp3,.m4a,.aac,.flac,.wav,.ogg,.webm,audio/*"
          className="hidden"
        />

        <div className="w-14 h-14 rounded-full bg-melody-accent/20 flex items-center justify-center text-melody-accentLight shadow-inner">
          <Upload className="w-6 h-6 animate-bounce" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            {isDragging ? 'Drop audio files here to import' : 'Drag & drop your local audio files or browse'}
          </h3>
          <p className="text-xs text-melody-muted mt-1">
            Supports MP3, M4A, AAC, FLAC, WAV, and OGG files • Stored 100% offline in browser storage
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition hover:scale-105"
        >
          Select Files from Device
        </button>
      </div>

      {/* Import Status Feedback */}
      {importProgress && (
        <div className="p-4 rounded-2xl bg-melody-card border border-melody-accent/40 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-melody-accent animate-spin" />
            <span className="text-sm font-semibold text-white">
              Importing audio files ({importProgress.completed} of {importProgress.total})...
            </span>
          </div>
          <span className="text-xs font-mono text-melody-muted">
            {Math.round((importProgress.completed / Math.max(1, importProgress.total)) * 100)}%
          </span>
        </div>
      )}

      {importNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Legal & Policy Compliance Assurance */}
      <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-melody-muted flex items-center gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Zero Cloud Uploads:</strong> Local audio files remain strictly on your device. Offline audio playback is kept 100% separate from online YouTube streaming in strict compliance with developer policies.
        </span>
      </div>

      {/* Search, Filter & Actions Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-melody-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search local songs, artists, or filenames..."
            className="w-full bg-melody-card border border-melody-border focus:border-melody-accent focus:ring-1 focus:ring-melody-accent rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-melody-muted/60 outline-none transition"
          />
        </div>

        {/* Format Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {availableFormats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                selectedFormat === fmt
                  ? 'bg-melody-accent text-white border-melody-accent shadow-sm'
                  : 'bg-white/5 border-white/5 text-melody-muted hover:text-white hover:bg-white/10'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Sort & Action Controls */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-melody-card border border-melody-border rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
          >
            <option value="recent">Recently Imported</option>
            <option value="title">Title (A-Z)</option>
            <option value="artist">Artist (A-Z)</option>
            <option value="duration">Longest Duration</option>
            <option value="size">Largest File Size</option>
          </select>

          {tracks.length > 0 && (
            <>
              <button
                onClick={() => playTrack(filteredTracks[0], filteredTracks)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-melody-accent hover:bg-melody-accentLight text-white text-xs font-bold transition shadow-glow-accent"
                title="Play All Local Songs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleClearAll}
                className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                title="Clear all imported files"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Local Track List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-melody-card/30 border border-white/5">
          <FileAudio className="w-14 h-14 text-melody-muted mx-auto opacity-40" />
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">
              {tracks.length === 0 ? 'No local audio files yet' : 'No matching tracks found'}
            </h4>
            <p className="text-xs text-melody-muted max-w-sm mx-auto">
              {tracks.length === 0
                ? 'Drop your favorite MP3 or FLAC songs above to build your 100% offline personal listening library.'
                : 'Try adjusting your search query or format filter.'}
            </p>
          </div>
          {tracks.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-full bg-melody-accent hover:bg-melody-accentLight text-white text-xs font-bold transition shadow-glow-accent"
            >
              Browse Audio Files
            </button>
          )}
        </div>
      ) : (
        <div className="bg-melody-card/60 border border-melody-border/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-melody-border/40">
            {filteredTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = favoriteIds.has(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, filteredTracks)}
                  className={`flex items-center justify-between p-3.5 sm:px-6 hover:bg-white/5 transition cursor-pointer group ${
                    isCurrent ? 'bg-melody-accent/15' : ''
                  }`}
                >
                  {/* Left Column: Number, Thumbnail & Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                    <span className="w-6 text-center text-xs font-mono text-melody-muted">
                      {isCurrent && isPlaying ? (
                        <span className="w-3 h-3 block mx-auto rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        idx + 1
                      )}
                    </span>

                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-melody-accentLight' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-slate-300">
                          {track.fileFormat}
                        </span>
                      </div>
                      <p className="text-xs text-melody-muted truncate mt-0.5">
                        {track.artist} • <span className="opacity-70">{track.fileName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Metadata */}
                  <div className="hidden sm:flex items-center gap-6 text-xs text-melody-muted font-mono shrink-0">
                    <span>{formatBytes(track.sizeBytes)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(track.duration)}
                    </span>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track);
                      }}
                      className={`p-2 rounded-full transition ${
                        isFav ? 'text-pink-500 hover:text-pink-400' : 'text-melody-muted hover:text-white'
                      }`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, track.id)}
                      className="p-2 rounded-full text-melody-muted hover:text-red-400 hover:bg-white/5 transition"
                      title="Delete from local storage"
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
