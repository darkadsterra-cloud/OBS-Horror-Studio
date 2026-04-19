// media-transform.ts — Image/Video Transform Tools
// Place at: artifacts/horror-studio/src/data/media-transform.ts
import { TEXT_TRANSITIONS } from "./transitions";
export interface MediaTransform {
  x: number; // 0-1 (normalized position)
  y: number; // 0-1
  scale: number; // 0.1-5
  rotation: number; // radians
  opacity: number; // 0-1
  flipX: boolean;
  flipY: boolean;
  fitMode: "cover" | "contain" | "fill" | "stretch" | "center";
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const DEFAULT_MEDIA_TRANSFORM: MediaTransform = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  opacity: 1,
  flipX: false,
  flipY: false,
  fitMode: "cover"
};

// Calculate draw parameters based on fit mode
export function calculateMediaDrawParams(
  mediaWidth: number,
  mediaHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  transform: MediaTransform,
  isVideo: boolean
): {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
} {
  let sx = 0, sy = 0, sWidth = mediaWidth, sHeight = mediaHeight;
  let dx = 0, dy = 0, dWidth = canvasWidth, dHeight = canvasHeight;
  
  const mediaAspect = mediaWidth / mediaHeight;
  const canvasAspect = canvasWidth / canvasHeight;
  
  switch (transform.fitMode) {
    case "cover":
      // Fill entire canvas, crop if necessary
      if (mediaAspect > canvasAspect) {
        sHeight = mediaHeight;
        sWidth = mediaHeight * canvasAspect;
        sx = (mediaWidth - sWidth) / 2;
      } else {
        sWidth = mediaWidth;
        sHeight = mediaWidth / canvasAspect;
        sy = (mediaHeight - sHeight) / 2;
      }
      dWidth = canvasWidth;
      dHeight = canvasHeight;
      break;
      
    case "contain":
      // Fit entirely within canvas, letterbox if necessary
      if (mediaAspect > canvasAspect) {
        dWidth = canvasWidth;
        dHeight = canvasWidth / mediaAspect;
        dy = (canvasHeight - dHeight) / 2;
      } else {
        dHeight = canvasHeight;
        dWidth = canvasHeight * mediaAspect;
        dx = (canvasWidth - dWidth) / 2;
      }
      sWidth = mediaWidth;
      sHeight = mediaHeight;
      break;
      
    case "fill":
      // Stretch to fill
      dWidth = canvasWidth;
      dHeight = canvasHeight;
      sWidth = mediaWidth;
      sHeight = mediaHeight;
      break;
      
    case "stretch":
      // Freeform stretch
      dWidth = canvasWidth * transform.scale;
      dHeight = canvasHeight * transform.scale;
      dx = (canvasWidth - dWidth) / 2 + (transform.x - 0.5) * canvasWidth;
      dy = (canvasHeight - dHeight) / 2 + (transform.y - 0.5) * canvasHeight;
      return { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight };
      
    case "center":
      // Original size centered
      dWidth = mediaWidth * transform.scale;
      dHeight = mediaHeight * transform.scale;
      dx = (canvasWidth - dWidth) / 2 + (transform.x - 0.5) * canvasWidth;
      dy = (canvasHeight - dHeight) / 2 + (transform.y - 0.5) * canvasHeight;
      return { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight };
  }
  
  // Apply position offset (for drag)
  const offsetX = (transform.x - 0.5) * canvasWidth * 0.5;
  const offsetY = (transform.y - 0.5) * canvasHeight * 0.5;
  
  // Apply scale from center
  const scale = transform.scale;
  const finalWidth = dWidth * scale;
  const finalHeight = dHeight * scale;
  const finalX = dx + offsetX + (dWidth - finalWidth) / 2;
  const finalY = dy + offsetY + (dHeight - finalHeight) / 2;
  
  return {
    sx, sy, sWidth, sHeight,
    dx: finalX, dy: finalY,
    dWidth: finalWidth, dHeight: finalHeight
  };
}

// Apply transform to canvas before drawing media
export function applyMediaTransform(
  ctx: CanvasRenderingContext2D,
  transform: MediaTransform,
  centerX: number,
  centerY: number
): void {
  ctx.translate(centerX, centerY);
  ctx.rotate(transform.rotation);
  if (transform.flipX) ctx.scale(-1, 1);
  if (transform.flipY) ctx.scale(1, -1);
  ctx.translate(-centerX, -centerY);
  ctx.globalAlpha = transform.opacity;
}

// Media transition types
export const MEDIA_TRANSITIONS = [
  ...TEXT_TRANSITIONS,
  // Additional media-specific transitions
  { id: "ken-burns", label: "Ken Burns", category: "Cinematic", emoji: "📸" },
  { id: "parallax", label: "Parallax", category: "Cinematic", emoji: "🏔️" },
  { id: "dolly-zoom", label: "Dolly Zoom", category: "Cinematic", emoji: "🎥" },
  { id: "rack-focus", label: "Rack Focus", category: "Cinematic", emoji: "🔍" },
  { id: "motion-blur", label: "Motion Blur", category: "Camera", emoji: "💨" },
  { id: "time-remap", label: "Time Remap", category: "Tech", emoji: "⏱️" },
  { id: "speed-ramp", label: "Speed Ramp", category: "Tech", emoji: "⚡" },
  { id: "reverse", label: "Reverse", category: "Tech", emoji: "⏪" },
  { id: "mirror", label: "Mirror", category: "Creative", emoji: "🪞" },
  { id: "kaleidoscope", label: "Kaleidoscope", category: "Creative", emoji: "🔮" },
  { id: "vignette-zoom", label: "Vignette Zoom", category: "Cinematic", emoji: "🎯" },
  { id: "radial-wipe", label: "Radial Wipe", category: "Cinematic", emoji: "🌀" },
  { id: "clock-wipe", label: "Clock Wipe", category: "Cinematic", emoji: "⏰" },
  { id: "heart-wipe", label: "Heart Wipe", category: "Social", emoji: "💝" },
  { id: "star-wipe", label: "Star Wipe", category: "Social", emoji: "⭐" },
  { id: "door-open", label: "Door Open", category: "3D", emoji: "🚪" },
  { id: " Venetian-blind", label: "Venetian Blind", category: "Split", emoji: "🪟" },
  { id: "checkerboard", label: "Checkerboard", category: "Split", emoji: "🏁" },
  { id: "ripple", label: "Ripple", category: "Distortion", emoji: "💧" },
  { id: "wave", label: "Wave", category: "Distortion", emoji: "🌊" },
  { id: "bulge", label: "Bulge", category: "Distortion", emoji: "🔮" },
  { id: "pinch", label: "Pinch", category: "Distortion", emoji: "🤏" },
  { id: "twirl", label: "Twirl", category: "Distortion", emoji: "🌀" },
  { id: "barrel-distort", label: "Barrel Distort", category: "Distortion", emoji: "🛢️" },
  { id: "fish-eye", label: "Fish Eye", category: "Distortion", emoji: "🐟" },
];
