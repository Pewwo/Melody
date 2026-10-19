import React, { useEffect, useRef, useState } from 'react';
import { X, Mic2, Edit3, Check, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { lrcLibClient, parseLrc, getActiveLrcIndex, Lyrics, LrcLine } from '@melody/core';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack, currentTime, seek } = usePlayer();
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics when track changes or modal opens
  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    let isMounted = true;
    setLoading(true);
    setIsEditing(false);

    // Check localStorage cache first
    const cached = localStorage.getItem(`lyrics_${currentTrack.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLyrics(parsed);
        setEditedText(parsed.syncedLyrics || parsed.plainLyrics || '');
        setLoading(false);
        return;
      } catch {}
    }

    lrcLibClient
      .getLyrics(currentTrack.id, currentTrack.title, currentTrack.artist, currentTrack.duration)
      .then((data) => {
        if (!isMounted) return;
        setLyrics(data);
        if (data) {
          const raw = data.syncedLyrics || data.plainLyrics || '';
          setEditedText(raw);
          localStorage.setItem(`lyrics_${currentTrack.id}`, JSON.stringify(data));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentTrack]);

  // Active line index for timestamped lyrics
  const activeIndex = lyrics?.lines ? getActiveLrcIndex(lyrics.lines, currentTime) : -1;

  // Auto-scroll active line into view smoothly
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isOpen || !currentTrack) return null;

  const handleSaveCustomLyrics = () => {
    const isLrc = /\[\d{1,2}:\d{2}/.test(editedText);
    const parsedLines: LrcLine[] = isLrc ? parseLrc(editedText) : [];

    const updatedLyrics: Lyrics = {
      trackId: currentTrack.id,
      trackTitle: currentTrack.title,
      artistName: currentTrack.artist,
      plainLyrics: !isLrc ? editedText : undefined,
      syncedLyrics: isLrc ? editedText : undefined,
      lines: parsedLines,
      source: 'user',
      synced: parsedLines.length > 0,
    };

    setLyrics(updatedLyrics);
    localStorage.setItem(`lyrics_${currentTrack.id}`, JSON.stringify(updatedLyrics));
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex flex-col select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="p-4 md:p-6 flex items-center justify-between border-b border-white/10 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={currentTrack.artworkUrl}
            alt={currentTrack.title}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shadow-lg shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-bold text-white truncate">{currentTrack.title}</h3>
              {lyrics?.synced && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-melody-accent/30 text-melody-accentLight border border-melody-accent/40 font-mono shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  Synced LRC
                </span>
              )}
            </div>
            <p className="text-xs text-melody-muted truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition"
          >
            {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit / Import'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Lyrics Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-12 flex justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-melody-muted m-auto">
            <RefreshCw className="w-8 h-8 animate-spin text-melody-accent" />
            <p className="text-sm">Fetching synchronized lyrics...</p>
          </div>
        ) : isEditing ? (
          <div className="w-full max-w-2xl bg-melody-card/90 border border-melody-border rounded-2xl p-6 flex flex-col gap-4 m-auto">
            <div>
              <h4 className="text-base font-semibold text-white">Import or Edit Lyrics</h4>
              <p className="text-xs text-melody-muted mt-1">
                Paste synchronized LRC lyrics (e.g. <span className="font-mono text-melody-accentLight">[00:15.30] Song line</span>) or plain text lyrics.
              </p>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={12}
              className="w-full bg-melody-dark/80 border border-melody-border rounded-xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-melody-accent resize-none"
              placeholder="[00:00.00] Intro line..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomLyrics}
                className="px-4 py-2 rounded-xl bg-melody-accent hover:bg-melody-accentLight text-xs text-white font-medium transition shadow-glow-accent"
              >
                Save Lyrics
              </button>
            </div>
          </div>
        ) : lyrics && lyrics.lines.length > 0 ? (
          <div className="w-full max-w-3xl space-y-6 text-center py-10">
            {lyrics.lines.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <div
                  key={index}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    isActive
                      ? 'text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-melody-accentLight to-melody-secondary scale-105 shadow-glow-accent drop-shadow-md py-2'
                      : isPast
                      ? 'text-lg md:text-xl font-medium text-white/35 hover:text-white/60'
                      : 'text-lg md:text-xl font-medium text-white/45 hover:text-white/70'
                  }`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        ) : lyrics?.plainLyrics ? (
          <div className="w-full max-w-2xl text-center whitespace-pre-line text-lg leading-relaxed text-slate-300 py-8 m-auto">
            {lyrics.plainLyrics}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-melody-muted m-auto max-w-md">
            <Mic2 className="w-12 h-12 text-melody-muted/40" />
            <h4 className="text-lg font-semibold text-white">No Lyrics Available</h4>
            <p className="text-xs text-melody-muted">
              Synchronized lyrics were not automatically found for this song. You can manually import or write LRC lyrics using the button above.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 px-4 py-2 rounded-full bg-melody-accent/20 hover:bg-melody-accent/30 text-melody-accentLight border border-melody-accent/40 text-xs font-semibold transition"
            >
              Add Lyrics Manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
