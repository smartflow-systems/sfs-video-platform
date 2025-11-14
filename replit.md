# Screen Recorder Pro

## Overview
A professional screen and webcam recording application built with Next.js, featuring cloud storage integration and analytics tracking. This application allows users to record their screen, webcam, or both simultaneously with picture-in-picture layout.

## Current State
- **Status**: Fully functional MVP
- **Last Updated**: November 14, 2025
- **Version**: 1.0.0

## Features

### Recording Capabilities
1. **Screen Recording**
   - Multiple quality options (High: 1920x1080, Medium: 1280x720, Low: 640x480)
   - Audio capture support
   - Real-time recording timer
   - Preview playback before upload

2. **Webcam Recording**
   - Camera selection from available devices
   - Live preview during recording
   - Audio capture support
   - Real-time recording timer

3. **Combined Recording**
   - Simultaneous screen and webcam capture
   - Picture-in-picture layout with webcam overlay
   - Canvas-based composition
   - High-quality output

### Video Management
- Upload to Replit Object Storage
- Download recordings locally
- Video gallery with thumbnails
- Video playback
- Delete recordings
- View count tracking

### Analytics Dashboard
- Total recordings count
- Total views across all videos
- Total recording duration
- Breakdown by recording type (screen/webcam/combined)
- Quality distribution analysis

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **MediaRecorder API** - Browser recording API
- **Canvas API** - Video composition for combined mode

### Backend
- **Next.js API Routes** - Server-side endpoints
- **Replit Object Storage** - Video file hosting
- **Google Cloud Storage SDK** - Object storage integration
- **File-based JSON storage** - Metadata persistence

### Key Libraries
- `@google-cloud/storage` - Cloud storage client
- `lucide-react` - Icon library
- `@radix-ui/*` - Headless UI components
- `clsx` & `tailwind-merge` - CSS utilities

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analytics/route.ts          # Analytics endpoint
│   │   ├── objects/[...path]/route.ts  # Object storage proxy
│   │   └── videos/
│   │       ├── [id]/
│   │       │   ├── route.ts            # Delete video
│   │       │   └── view/route.ts       # Track views
│   │       ├── route.ts                # List/create videos
│   │       └── upload/route.ts         # Generate upload URLs
│   ├── globals.css                     # Global styles
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Home page
├── components/
│   ├── analytics.tsx                   # Analytics dashboard
│   ├── combined-recorder.tsx           # Screen + webcam recorder
│   ├── recorder-tabs.tsx               # Recording mode tabs
│   ├── screen-recorder.tsx             # Screen-only recorder
│   ├── video-gallery.tsx               # Video list and player
│   ├── webcam-recorder.tsx             # Webcam-only recorder
│   └── ui/                             # Reusable UI components
│       ├── button.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       └── toaster.tsx
├── hooks/
│   └── use-toast.ts                    # Toast notification hook
├── lib/
│   └── utils.ts                        # Utility functions
├── data/
│   └── videos.json                     # Video metadata storage
└── package.json
```

## Environment Variables

Required environment variables (set by Replit Object Storage integration):
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` - Default bucket identifier
- `PRIVATE_OBJECT_DIR` - Private object directory path
- `PUBLIC_OBJECT_SEARCH_PATHS` - Public object search paths
- `SESSION_SECRET` - Session secret for security

## How It Works

### Recording Flow
1. User selects recording mode (screen/webcam/combined)
2. User chooses quality settings
3. Browser requests media permissions
4. MediaRecorder API captures stream
5. Recording data stored in memory as chunks
6. On stop, chunks combined into Blob
7. Preview shown to user
8. User can download or upload

### Upload Flow
1. Request signed upload URL from `/api/videos/upload`
2. Upload video directly to object storage
3. Save metadata to `/api/videos`
4. Video path normalized and stored in `data/videos.json`
5. Gallery refreshed to show new video

### Playback Flow
1. Video clicked in gallery
2. View count incremented via `/api/videos/[id]/view`
3. Video loaded from object storage via `/api/objects/[...path]`
4. Video streamed to HTML5 video player

### Analytics Flow
1. Analytics dashboard requests `/api/analytics`
2. Server reads all videos from `data/videos.json`
3. Aggregates statistics (counts, totals, breakdowns)
4. Returns analytics data to frontend
5. Dashboard visualizes data with charts and metrics

## Development

### Running the Application
```bash
npm install
npm run dev
```

The application runs on port 5000 and is accessible via the Replit webview.

### Browser Requirements
- Modern browser with MediaRecorder API support
- Chrome, Edge, or Firefox recommended
- Safari has limited support

### Permissions Required
- Display capture (for screen recording)
- Camera access (for webcam recording)
- Microphone access (for audio)

## User Preferences
None specified yet.

## Recent Changes
- November 14, 2025: Initial MVP implementation
  - Created all recording components
  - Implemented object storage integration
  - Built video gallery and playback
  - Added analytics dashboard
  - Configured responsive UI with Tailwind CSS
