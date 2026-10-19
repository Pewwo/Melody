import { LrcLine } from '../types';

/**
 * Parses raw LRC timestamped text into structured LrcLine objects.
 * Format: [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
 */
export function parseLrc(lrcText: string): LrcLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split('\n');
  const result: LrcLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ar:Artist], [ti:Title], [al:Album]
    if (/^\[(ti|ar|al|au|by|offset|re|ve):/i.test(trimmed)) {
      continue;
    }

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      // The text is whatever is left after stripping all time tags
      const text = trimmed.replace(timeRegex, '').trim();

      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msRaw = match[3] || '0';
        // Normalize ms: if 2 digits (e.g. 50 -> 0.5s), if 3 digits (e.g. 500 -> 0.5s)
        const ms = parseInt(msRaw.padEnd(3, '0').slice(0, 3), 10) / 1000;
        const totalSeconds = minutes * 60 + seconds + ms;

        result.push({
          time: totalSeconds,
          text: text || '♪',
        });
      }
    }
  }

  // Sort by timestamp ascending
  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Finds the index of the currently active lyrics line for a given playback time.
 */
export function getActiveLrcIndex(lines: LrcLine[], currentTime: number): number {
  if (!lines || lines.length === 0) return -1;
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}
