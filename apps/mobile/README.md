# Melody Mobile (React Native + Expo)

Cross-platform mobile application for Android and iOS, built with React Native and Expo, sharing business logic, types, and streaming utilities with `@melody/core`.

## Prerequisites
1. Install [Node.js](https://nodejs.org/) (v18+).
2. Install [Expo Go](https://expo.dev/client) on your iOS or Android device.

## Running the Mobile App
From the root repository directory:
```bash
# Start the Expo development server
npm run dev:mobile
```
Or directly from `apps/mobile`:
```bash
npm start
```

### Options:
- Press `a` in the terminal to open the **Android Emulator**.
- Press `i` to open the **iOS Simulator** (macOS only).
- Scan the printed QR code with the **Expo Go** camera on Android or iPhone to run immediately on a physical device at $0 cost!

## Features
- **Online Music**: Embedded YouTube playback and Audius decentralized streaming.
- **My Music (Local)**: Plays device-stored audio files (`.mp3`, `.wav`, `.m4a`).
- **Playlists & Favorites**: Synced across web and mobile via Supabase.
