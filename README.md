# Melody — Free Cross-Platform Music Player

A modern, Spotify-inspired music streaming application for the **Web**, **Android**, and **iOS**, built with free, open-source development tools and zero-cost cloud tiers.

---

## 1. Project Overview

Melody provides a unified personal music experience that pairs:
1. **Online Discovery & YouTube Music**: Search songs, paste YouTube links, and play through the **official YouTube embedded player** with full branding, advertising support, and terms compliance (no illegal downloading, audio extraction, or scraping).
2. **"My Music" Offline Audio Library**: A completely separate client-side library where users can import their own authorized local audio files (**MP3, M4A, FLAC, WAV, AAC, OGG**) for 100% offline playback powered by browser **IndexedDB**.
3. **Spotify-Inspired Aesthetic**: Sleek dark mode, persistent bottom player bar, synchronized karaoke lyrics via LRCLIB, slide-over queue, favorites, and custom playlists.
4. **Cloud Synchronization**: Optional **Supabase Free Tier** authentication with Row Level Security (RLS) to synchronize playlists and favorites across devices while keeping local audio strictly on the user's device.
5. **Guest Mode Out of the Box**: The app functions completely without requiring an account or cloud credentials.

---

## 2. Technology Stack

- **Web App**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Mobile App**: React Native with Expo (Android & iOS).
- **Shared Core**: Monorepo package `@melody/core` (audio models, formatters, YouTube parsers, lyrics parser).
- **Local Offline Storage**: Client-side IndexedDB (`idb`) for local audio file storage and offline caching.
- **Backend / Database**: Supabase Free Tier (PostgreSQL with Row Level Security and Auth).
- **Online Streaming**: Official YouTube IFrame Player API and Audius Decentralized Network.
- **Lyrics Engine**: Synced LRC karaoke lyrics via LRCLIB.

---

## 3. Architecture & Directory Structure

```text
├── apps/
│   ├── web/                     # Web Application (React + Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── components/      # UI components (PlayerBar, Sidebar, Header, Modals)
│   │   │   ├── context/         # Unified PlayerContext (Dual HTML5 & YouTube engine)
│   │   │   ├── pages/           # Views (Discover, Dual Search, My Music, Playlists)
│   │   │   └── services/        # Local audio storage, offline caching, Supabase client
│   │   └── .env.example         # Environment template for Supabase & YouTube API
│   └── mobile/                  # Mobile Application (React Native + Expo)
│       ├── App.tsx              # Expo mobile app entry point
│       └── app.json             # Expo mobile configuration
└── packages/
    └── core/                    # Shared core business logic
        ├── src/
        │   ├── api/             # Audius & LRCLIB API clients
        │   ├── db/              # schema.sql (Supabase PostgreSQL migrations with RLS)
        │   ├── types/           # TypeScript data interfaces (Track, Playlist, Lyrics)
        │   └── utils/           # YouTube link parser, duration formatters, LRC parser
        └── package.json
```

---

## 4. Key Functional Modules

### A. Online YouTube Playback (Section 3 & 9 of Specs)
- **Compliant Playback**: Uses the official `window.YT.Player` embedded iframe.
- **Modes**:
  - 🎵 **MP3 Audio Mode**: Plays audio continuously in the background while presenting Spotify-style album artwork, title, artist, audio waveform, and synchronized lyrics.
  - 🎬 **Video Mode**: Opens an interactive floating Picture-in-Picture (PiP) window or cinema stage.
- **Policy Adherence**: Zero scraping, zero unauthorized downloading, zero audio conversion.

### B. "My Music" Local Audio Library (Section 5 of Specs)
- **File Import**: Drag & drop or browse `.mp3`, `.m4a`, `.aac`, `.flac`, `.wav`, and `.ogg` files.
- **Automatic Metadata**: Derives clean artist and title from file naming conventions (`Artist - Title.mp3`) and reads exact audio duration before saving.
- **Device Storage**: Saved securely in client-side **IndexedDB**.
- **100% Offline**: Continues playing without an active internet connection.

### C. Dual Search Experience (Section 8 of Specs)
- **Online Tab**: Search online catalog tracks and detect pasted YouTube links.
- **Local Audio Tab**: Search exclusively within imported device files by title, artist, or file name.

### D. Supabase Cloud Sync (Section 7 of Specs)
- Complete database migration script in [`packages/core/src/db/schema.sql`](file:///c:/Users/juzti/OneDrive/Desktop/website/packages/core/src/db/schema.sql).
- Row Level Security (RLS) ensures users only access their own private data.
- Local audio files **never** leave the user's device.

---

## 5. How to Run Locally

### Running the Web Application
```bash
# From repository root
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Building for Production
```bash
npm run build:web
```

### Running the Mobile App (Expo)
```bash
# Start Expo development server
npm run dev:mobile
```
- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.
- Or scan the terminal QR code with **Expo Go** on your physical phone!

---

## 6. Supabase Cloud Setup (Optional)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and paste the contents of [`packages/core/src/db/schema.sql`](file:///c:/Users/juzti/OneDrive/Desktop/website/packages/core/src/db/schema.sql) and run it.
3. In `apps/web/`, copy `.env.example` to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the web app to enjoy cross-device synchronization!
