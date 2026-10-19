import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, RepeatMode, fetchYouTubeTrack, extractYouTubeId } from '@melody/core';
import { localMusicService } from '../services/localMusicService';
import { youtubeStreamService } from '../services/youtubeStreamService';
import { youtubeDataApi } from '../services/youtubeDataApi';
import { searchHistoryService } from '../services/searchHistoryService';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type MediaMode = 'audio' | 'video';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
  playbackSource: 'stream' | 'offline';
  mediaMode: MediaMode;
  isVideoPiPOpen: boolean;
  isScreenOffAudioActive: boolean;
  setIsVideoPiPOpen: (open: boolean) => void;
  setMediaMode: (mode: MediaMode) => void;
  toggleMediaMode: () => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playYouTubeTrack: (urlOrId: string, mode?: MediaMode) => Promise<Track>;
  downloadSongToDevice: (track: Track, onProgress?: (pct: number) => void) => Promise<{ savedInApp: boolean; exportedFile: boolean }>;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playRandomFromHistory: () => Promise<void>;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const pendingYtIdRef = useRef<string | null>(null);
  const isFetchingRandomRef = useRef<boolean>(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('melody_volume');
    const parsed = saved ? parseFloat(saved) : NaN;
    return !isNaN(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackSource, setPlaybackSource] = useState<'stream' | 'offline'>('stream');

  // Active audio engine tracking: when true, native HTML5 <audio> is playing (works with screen off / lock screen)
  const [isScreenOffAudioActive, setIsScreenOffAudioActive] = useState<boolean>(true);

  // Media Mode: 'audio' (Spotify MP3 style with screen-off lockscreen support) vs 'video' (Synced video player)
  const [mediaMode, setMediaModeState] = useState<MediaMode>(() => {
    return (localStorage.getItem('melody_media_mode') as MediaMode) || 'audio';
  });

  const [isVideoPiPOpen, setIsVideoPiPOpen] = useState<boolean>(false);

  // Mirror recovery index for Audius
  const mirrorIndexRef = useRef<number>(0);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef<boolean>(isShuffle);
  isShuffleRef.current = isShuffle;

  const queueRef = useRef<Track[]>(queue);
  queueRef.current = queue;

  const queueIndexRef = useRef<number>(queueIndex);
  queueIndexRef.current = queueIndex;

  const currentTrackRef = useRef<Track | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  const lastPlayedTrackRef = useRef<Track | null>(currentTrack);
  if (currentTrack) {
    lastPlayedTrackRef.current = currentTrack;
  }

  // Ref mirror so that event handlers (YouTube onStateChange, audio onEnded)
  // always read the LATEST value without stale closure issues.
  const isScreenOffAudioActiveRef = useRef<boolean>(isScreenOffAudioActive);
  isScreenOffAudioActiveRef.current = isScreenOffAudioActive;

  const playNextRef = useRef<() => void>(() => {});

  const setMediaMode = (mode: MediaMode) => {
    setMediaModeState(mode);
    localStorage.setItem('melody_media_mode', mode);
    if (mode === 'video' && currentTrack?.source === 'youtube') {
      setIsVideoPiPOpen(true);
    }
  };

  const toggleMediaMode = () => {
    setMediaMode(mediaMode === 'audio' ? 'video' : 'audio');
  };

  // 1. Initialize HTML5 Audio Element for native audio, screen-off & lockscreen playback
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => {
      setIsPlaying(false);
    };
    const onWaiting = () => {
      setIsLoading(true);
    };
    const onPlaying = () => {
      setIsLoading(false);
      setError(null);
    };
    const onTimeUpdate = () => {
      if (audio && isScreenOffAudioActive) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (audio && !isNaN(audio.duration) && audio.duration > 0 && isScreenOffAudioActive) {
        setDuration(audio.duration);
      }
    };
    const onError = () => {
      if (!isScreenOffAudioActive) return;
      setIsLoading(false);
      const track = currentTrackRef.current;
      if (track && track.mirrors && track.mirrors.length > mirrorIndexRef.current) {
        const nextMirror = track.mirrors[mirrorIndexRef.current];
        mirrorIndexRef.current += 1;
        audio.src = nextMirror;
        audio.play().catch(() => {});
      } else {
        setError('Playback interrupted. Trying alternative stream...');
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
    };
  }, [isScreenOffAudioActive]);

  // 2. Initialize YouTube IFrame API (used for Video mode and video fallback)
  const initYouTubePlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) return;
    const mountEl = document.getElementById('youtube-player-mount');
    if (!mountEl || ytPlayerRef.current) return;

    try {
      ytPlayerRef.current = new window.YT.Player('youtube-player-mount', {
        height: '100%',
        width: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          disablekb: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            isYtReadyRef.current = true;
            event.target.setVolume(volume * 100);
            if (isMuted) event.target.mute();

            if (pendingYtIdRef.current) {
              const vidId = pendingYtIdRef.current;
              pendingYtIdRef.current = null;
              event.target.loadVideoById(vidId);
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            // Use ref to always get the latest value (avoids stale closure from initialization)
            if (isScreenOffAudioActiveRef.current) return;
            // 1: PLAYING, 2: PAUSED, 3: BUFFERING, 0: ENDED, -1: UNSTARTED, 5: CUED
            if (event.data === 1) {
              setIsPlaying(true);
              setIsLoading(false);
              setError(null);
              const dur = ytPlayerRef.current?.getDuration?.();
              if (dur && dur > 0) setDuration(dur);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 3) {
              setIsLoading(true);
            } else if (event.data === 0) {
              if (repeatModeRef.current === 'one') {
                ytPlayerRef.current?.seekTo(0, true);
                ytPlayerRef.current?.playVideo();
              } else {
                playNextRef.current();
              }
            }
          },
          onError: (event: any) => {
            if (!isScreenOffAudioActiveRef.current) {
              setIsLoading(false);
              const code = event?.data;
              const blocked = code === 101 || code === 150 || code === 100 || code === 5;

              if (blocked) {
                const track = currentTrackRef.current;
                if (track) {
                  setError('Video unavailable — finding alternative...');
                  setIsLoading(true);
                  const searchQuery = `${track.title} ${track.artist}`;
                  youtubeDataApi.searchMusic(searchQuery, 10)
                    .then((results) => {
                      const alt = results.find(r => r.id !== track.youtubeId);
                      if (alt && ytPlayerRef.current && isYtReadyRef.current) {
                        const altTrack: Track = {
                          ...track,
                          id: `yt_${alt.id}`,
                          youtubeId: alt.id,
                          youtubeUrl: `https://www.youtube.com/watch?v=${alt.id}`,
                          streamUrl: `youtube:${alt.id}`,
                          artworkUrl: alt.thumbnailUrl,
                        };
                        setCurrentTrack(altTrack);
                        ytPlayerRef.current.loadVideoById(alt.id);
                        ytPlayerRef.current.playVideo();
                        setIsLoading(false);
                        setError(null);
                      } else {
                        setIsLoading(false);
                        setError('No playable alternative found. Try a different song.');
                        setIsPlaying(false);
                      }
                    })
                    .catch(() => {
                      setIsLoading(false);
                      setError('Video unavailable and could not find an alternative.');
                      setIsPlaying(false);
                    });
                } else {
                  setError('This video cannot be played.');
                  setIsPlaying(false);
                }
              } else {
                setError('YouTube playback error. Try a different song.');
                setIsPlaying(false);
              }
            }
          },
        },
      });
    } catch {
      // Handle mount errors
    }
  }, [volume, isMuted, isScreenOffAudioActive]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYouTubePlayer();
      };
    }
  }, [initYouTubePlayer]);

  // 3. YouTube Video Time Tracking interval (when video mode is active)
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !isScreenOffAudioActive && ytPlayerRef.current?.getCurrentTime) {
      interval = setInterval(() => {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time)) {
            setCurrentTime(time);
          }
          const dur = ytPlayerRef.current.getDuration();
          if (typeof dur === 'number' && dur > 0 && dur !== duration) {
            setDuration(dur);
          }
        } catch {}
      }, 250);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isScreenOffAudioActive, duration]);

  // 4. Volume Syncing across both engines
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && isYtReadyRef.current) {
      try {
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
        }
      } catch {}
    }
  }, [volume, isMuted]);

  // 5. Track Ended Handler for HTML5 audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      // Use ref to always get latest value (avoids stale closure)
      if (!isScreenOffAudioActiveRef.current) return;
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNextRef.current();
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [isScreenOffAudioActive]);

  // 6. MediaSession Integration (Crucial for Lock Screen / Screen-Off controls & artwork)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.genre || (currentTrack.source === 'youtube' ? 'YouTube Music' : 'Melody Music'),
        artwork: [
          { src: currentTrack.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextRef.current();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      });
    }
  }, [currentTrack]);

  // 7. Core Play Function
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    setError(null);
    setIsLoading(true);
    mirrorIndexRef.current = 0;

    if (newQueue) {
      let targetQueue = newQueue;
      let targetIndex = newQueue.findIndex((t) => t.id === track.id);
      if (targetIndex === -1) {
        targetQueue = [track, ...newQueue];
        targetIndex = 0;
      }
      setQueue(targetQueue);
      setQueueIndex(targetIndex);
    } else {
      const currentQ = queueRef.current;
      const idx = currentQ.findIndex((t) => t.id === track.id);
      if (idx !== -1) {
        setQueueIndex(idx);
      } else {
        const updated = [...currentQ, track];
        setQueue(updated);
        setQueueIndex(updated.length - 1);
      }
    }

    setCurrentTrack(track);
    setDuration(track.duration || 0);
    setCurrentTime(0);

    // Save to recently played history to power personalized suggestions
    searchHistoryService.recordPlay(track);

    const isYT = track.source === 'youtube' || track.streamUrl.startsWith('youtube:');

    if (isYT) {
      // YouTube videos ALWAYS play via the official embedded IFrame player
      setIsScreenOffAudioActive(false);
      audioRef.current?.pause();
      setPlaybackSource('stream');

      const videoId = track.youtubeId || extractYouTubeId(track.streamUrl) || track.id.replace('yt_', '');

      if (ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          setIsLoading(false);
        } catch {
          setIsLoading(false);
          setError('Failed to trigger YouTube video player.');
        }
      } else {
        pendingYtIdRef.current = videoId;
        setTimeout(() => initYouTubePlayer(), 200);
      }
    } else {
      // REGULAR AUDIO PLAYBACK (Local files / Audius / Offline Blobs)
      setIsScreenOffAudioActive(true);
      if (ytPlayerRef.current && isYtReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      setPlaybackSource(track.streamUrl.startsWith('blob:') || track.source === 'offline' ? 'offline' : 'stream');

      if (!audioRef.current) return;
      let playUrl = track.streamUrl;

      // If local track, resolve fresh blob object URL from IndexedDB
      if (track.id.startsWith('local_')) {
        try {
          const freshBlob = await localMusicService.getPlaybackUrl(track.id);
          if (freshBlob) playUrl = freshBlob;
        } catch {}
      }

      audioRef.current.src = playUrl;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          if (err.name !== 'AbortError') {
            setError('Unable to stream track. Trying fallback...');
          }
        });
    }
  };

  // 8. Convenient YouTube play method (supports URLs, video IDs, or song/artist search queries)
  const playYouTubeTrack = async (queryOrUrl: string): Promise<Track> => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmed = queryOrUrl.trim();
      const videoId = extractYouTubeId(trimmed);

      if (videoId) {
        const track = await fetchYouTubeTrack(videoId);
        playTrack(track);
        return track;
      }

      // If not a direct URL/ID, search by song title / artist
      const results = await youtubeDataApi.searchMusic(trimmed, 1);
      if (results.length === 0) {
        throw new Error(`No YouTube tracks found for "${trimmed}".`);
      }

      const match = results[0];
      const track: Track = {
        id: `yt_${match.id}`,
        title: match.title,
        artist: match.channelTitle,
        artistId: match.channelTitle,
        artworkUrl: match.thumbnailUrl,
        duration: 210,
        streamUrl: `youtube:${match.id}`,
        source: 'youtube',
        youtubeId: match.id,
        youtubeUrl: `https://www.youtube.com/watch?v=${match.id}`,
        downloadable: false,
        downloadGated: false,
        isStreamGated: false,
        mirrors: [],
      };
      playTrack(track);
      return track;
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'Could not find or play YouTube track.';
      setError(msg);
      throw err;
    }
  };

  // 9. Download to Device Storage (IndexedDB + Native File Download)
  const downloadSongToDevice = async (
    track: Track,
    onProgress?: (pct: number) => void
  ): Promise<{ savedInApp: boolean; exportedFile: boolean }> => {
    return await youtubeStreamService.downloadToDeviceStorage(track, onProgress);
  };

  // 10. Play Random Song based on the previous track (or listening history)
  const playRandomFromHistory = async (): Promise<void> => {
    if (isFetchingRandomRef.current) return;
    isFetchingRandomRef.current = true;
    try {
      const prevTrack = lastPlayedTrackRef.current || currentTrackRef.current;
      const currentYtId = prevTrack?.youtubeId || (prevTrack?.id.startsWith('yt_') ? prevTrack.id.replace('yt_', '') : '');

      let candidateTopic = '';
      if (prevTrack) {
        const cleanArtist = prevTrack.artist ? prevTrack.artist.replace(/ - Topic|VEVO/gi, '').trim() : '';
        const cleanTitle = prevTrack.title ? prevTrack.title.replace(/\(.*?\)|\[.*?\]/g, '').trim() : '';

        // Randomly search either similar tracks by the same artist or tracks related to the song
        const searchStrategies = [
          cleanArtist ? `${cleanArtist} songs` : '',
          cleanArtist && cleanTitle ? `${cleanArtist} ${cleanTitle}` : '',
          cleanArtist || '',
          cleanTitle || '',
        ].filter(Boolean);

        if (searchStrategies.length > 0) {
          candidateTopic = searchStrategies[Math.floor(Math.random() * searchStrategies.length)];
        }
      }

      // If no candidate topic from previous song, fall back to recent history or trending music
      if (!candidateTopic) {
        const rec = searchHistoryService.getRecommendations();
        if (rec.allTopics && rec.allTopics.length > 0) {
          candidateTopic = rec.allTopics[Math.floor(Math.random() * rec.allTopics.length)];
        } else {
          candidateTopic = 'Trending Music';
        }
      }

      let items = await youtubeDataApi.searchMusic(candidateTopic, 20).catch(() => []);
      if (!items || items.length === 0) {
        items = await youtubeDataApi.getTrendingMusic(20).catch(() => []);
      }

      if (items && items.length > 0) {
        // Exclude the previous/current playing track so we don't repeat the exact same song
        const filtered = items.filter((item) => item.id !== currentYtId);
        const pool = filtered.length > 0 ? filtered : items;
        const randomItem = pool[Math.floor(Math.random() * pool.length)];

        const track: Track = {
          id: `yt_${randomItem.id}`,
          title: randomItem.title,
          artist: randomItem.channelTitle,
          artistId: randomItem.channelTitle,
          artworkUrl: randomItem.thumbnailUrl,
          duration: 210,
          streamUrl: `youtube:${randomItem.id}`,
          source: 'youtube',
          youtubeId: randomItem.id,
          youtubeUrl: `https://www.youtube.com/watch?v=${randomItem.id}`,
          downloadable: false,
          downloadGated: false,
          isStreamGated: false,
          mirrors: [],
        };
        await playTrack(track);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.warn('Failed to autoplay random track based on previous song:', err);
      setIsPlaying(false);
    } finally {
      isFetchingRandomRef.current = false;
    }
  };

  const togglePlay = () => {
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0]);
      return;
    }

    if (!currentTrack && queue.length === 0) {
      playRandomFromHistory();
      return;
    }

    if (!isScreenOffAudioActive && currentTrack?.source === 'youtube') {
      if (!ytPlayerRef.current) return;
      try {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch {}
    } else {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const seek = (time: number) => {
    const clamped = Math.max(0, Math.min(duration || 99999, time));
    setCurrentTime(clamped);

    if (!isScreenOffAudioActive && currentTrack?.source === 'youtube') {
      if (ytPlayerRef.current?.seekTo) {
        try {
          ytPlayerRef.current.seekTo(clamped, true);
        } catch {}
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    localStorage.setItem('melody_volume', String(clamped));
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const playNext = () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const repeat = repeatModeRef.current;
    const shuffle = isShuffleRef.current;

    // If queue is empty, autoplay a random song based on recently played music
    if (q.length === 0) {
      playRandomFromHistory();
      return;
    }

    if (shuffle) {
      // Pick a random index that is different from the current one (if possible)
      let randomIdx = Math.floor(Math.random() * q.length);
      if (q.length > 1 && randomIdx === idx) {
        randomIdx = (randomIdx + 1) % q.length;
      }
      // Pass queue directly so playTrack sets index correctly
      playTrack(q[randomIdx], q);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx < q.length) {
      // Pass queue directly so playTrack sets the index to nextIdx without a secondary lookup
      playTrack(q[nextIdx], q);
    } else if (repeat === 'all') {
      playTrack(q[0], q);
    } else {
      // Reached the end of the queue — autoplay random song based on previous song / history
      playRandomFromHistory();
    }
  };

  playNextRef.current = playNext;

  const playPrevious = () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const repeat = repeatModeRef.current;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (q.length === 0) return;

    const prevIdx = idx - 1;
    if (prevIdx >= 0) {
      playTrack(q[prevIdx], q);
    } else if (repeat === 'all') {
      const lastIdx = q.length - 1;
      playTrack(q[lastIdx], q);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const playNextInQueue = (track: Track) => {
    setQueue((prev) => {
      const nextIdx = queueIndex + 1;
      const copy = [...prev];
      copy.splice(nextIdx, 0, track);
      return copy;
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      if (index === queueIndex) {
        if (copy.length > 0) {
          const nextIdx = Math.min(index, copy.length - 1);
          setQueueIndex(nextIdx);
          playTrack(copy[nextIdx]);
        } else {
          setCurrentTrack(null);
          setIsPlaying(false);
          audioRef.current?.pause();
          ytPlayerRef.current?.pauseVideo?.();
        }
      } else if (index < queueIndex) {
        setQueueIndex(queueIndex - 1);
      }
      return copy;
    });
  };

  const clearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(currentTrack ? 0 : -1);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        isLoading,
        error,
        playbackSource,
        mediaMode,
        isVideoPiPOpen,
        isScreenOffAudioActive,
        setIsVideoPiPOpen,
        setMediaMode,
        toggleMediaMode,
        playTrack,
        playYouTubeTrack,
        downloadSongToDevice,
        playRandomFromHistory,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        playNext,
        playPrevious,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};
