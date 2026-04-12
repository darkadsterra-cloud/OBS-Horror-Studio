# Horror Animation Studio — Creepy-Zone AI

## Overview

A full-stack horror-themed animation studio platform for live streamers and content creators. Includes three major tools built as a single dark cinematic web application.

## Features

### 1. AI Motion Character Transformer (`/character-transformer`)
- Real-time webcam capture with HTML5 Canvas rendering
- Face/body tracking overlay with landmark dots via requestAnimationFrame
- Character selection: preset + user-uploaded characters
- Performance modes: Low (face), Medium (face + upper), High (full body)
- Visual effects: Glitch, Fire, Aura
- Face landmark detection on mirrored offscreen canvas — fixes correct character orientation
- MP4 recording (with webm fallback), server-side save to `artifacts/api-server/recordings/`
- 5-minute recording timer with auto-stop
- Recordings panel with list and direct download

### 2. AI Text Overlay Animator (`/text-animator`)
- 100+ pre-made templates in 5 categories (Gaming, Horror, Cinematic, Streaming, Social)
- Live Canvas rendering with requestAnimationFrame-based animation engine
- Template animations: glitch, blood-drip, neon-pulse, zoom-pulse, fire-glow, flicker, shake, cinematic-fade, bounce, spin-reveal
- Search and category filtering
- "Surprise Me" random template selector
- Export to PNG and record MP4 via MediaRecorder

### 3. AI Stream Alert Engine (`/stream-alerts`)
- Alert rule creation with event type triggers (follow, gift, donation, subscription, etc.)
- Real-time WebSocket connection to `/api/stream/ws` for live alerts
- OBS browser source overlay URL generation
- Test event triggers
- Live activity feed
- Full CRUD for alert configs

### 4. Image Editor (`/image-editor`)
- AI-powered background removal via `@imgly/background-removal` (browser-side, no server needed)
- Image adjustments: brightness, contrast, saturation, blur
- Color overlay with blend modes (normal, multiply, screen, overlay, hard-light)
- Horizontal/vertical flip
- Drag-and-drop image upload
- PNG download with transparency preserved

### 5. OBS Overlay (`/overlay/:streamId`)
- Transparent background page for OBS Browser Source
- Receives real-time alerts via WebSocket and renders animated overlays

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS 4, Wouter router, Framer Motion
- **Backend**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **WebSocket**: ws package on `/api/stream/ws`
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/horror-studio run dev` — run frontend locally

## Architecture

- `artifacts/horror-studio/` — React+Vite frontend
- `artifacts/api-server/` — Express API server with WebSocket
- `lib/db/` — Drizzle ORM schema (characters, templates, alerts, presets, stream_events)
- `lib/api-spec/` — OpenAPI spec
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Database Tables

- `characters` — Avatar characters (preset + user-uploaded)
- `templates` — Text overlay templates (100+ preset loaded from frontend data file)
- `alerts` — Stream alert configurations
- `presets` — User-saved presets
- `stream_events` — Historical event log
