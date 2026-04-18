// transitions.ts — Professional Transitions Library (CapCut/Filmora Style)
// Place at: artifacts/horror-studio/src/data/transitions.ts

export interface TransitionParams {
  duration: number; // seconds
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce" | "elastic";
  intensity: number; // 0-1
  direction?: "left" | "right" | "up" | "down" | "center" | "random";
}

export const DEFAULT_TRANSITION: TransitionParams = {
  duration: 0.8,
  easing: "ease-in-out",
  intensity: 0.5,
  direction: "center"
};

// CapCut/Filmora Style Transitions
export const TEXT_TRANSITIONS = [
  // Basic
  { id: "fade", label: "Fade", category: "Basic", emoji: "😶" },
  { id: "slide-left", label: "Slide Left", category: "Basic", emoji: "⬅️" },
  { id: "slide-right", label: "Slide Right", category: "Basic", emoji: "➡️" },
  { id: "slide-up", label: "Slide Up", category: "Basic", emoji: "⬆️" },
  { id: "slide-down", label: "Slide Down", category: "Basic", emoji: "⬇️" },
  { id: "zoom-in", label: "Zoom In", category: "Basic", emoji: "🔍" },
  { id: "zoom-out", label: "Zoom Out", category: "Basic", emoji: "🔎" },
  
  // Dynamic/Camera
  { id: "spin", label: "Spin", category: "Camera", emoji: "🔄" },
  { id: "flip-x", label: "Flip X", category: "Camera", emoji: "↔️" },
  { id: "flip-y", label: "Flip Y", category: "Camera", emoji: "↕️" },
  { id: "shake", label: "Camera Shake", category: "Camera", emoji: "📳" },
  { id: "whip-pan-left", label: "Whip Pan Left", category: "Camera", emoji: "🏃" },
  { id: "whip-pan-right", label: "Whip Pan Right", category: "Camera", emoji: "🏃‍♂️" },
  
  // Cinematic
  { id: "dissolve", label: "Dissolve", category: "Cinematic", emoji: "🎬" },
  { id: "cross-fade", label: "Cross Fade", category: "Cinematic", emoji: "🎞️" },
  { id: "wipe-left", label: "Wipe Left", category: "Cinematic", emoji: "🧹" },
  { id: "wipe-right", label: "Wipe Right", category: "Cinematic", emoji: "🧹" },
  { id: "iris-open", label: "Iris Open", category: "Cinematic", emoji: "👁️" },
  { id: "iris-close", label: "Iris Close", category: "Cinematic", emoji: "👁️‍🗨️" },
  { id: "curtain-left", label: "Curtain Left", category: "Cinematic", emoji: "🎭" },
  { id: "curtain-right", label: "Curtain Right", category: "Cinematic", emoji: "🎭" },
  
  // Horror (Special)
  { id: "blood-drip", label: "Blood Drip", category: "Horror", emoji: "🩸" },
  { id: "glitch", label: "Glitch", category: "Horror", emoji: "👾" },
  { id: "static", label: "TV Static", category: "Horror", emoji: "📺" },
  { id: "flicker", label: "Flicker", category: "Horror", emoji: "💡" },
  { id: "possessed", label: "Possessed", category: "Horror", emoji: "👻" },
  { id: "demonic", label: "Demonic", category: "Horror", emoji: "😈" },
  { id: "shadow-pulse", label: "Shadow Pulse", category: "Horror", emoji: "👤" },
  { id: "cursed", label: "Cursed", category: "Horror", emoji: "☠️" },
  { id: "void", label: "Void", category: "Horror", emoji: "🌑" },
  { id: "hellfire", label: "Hell Fire", category: "Horror", emoji: "🔥" },
  { id: "phantom", label: "Phantom", category: "Horror", emoji: "👻" },
  { id: "decay", label: "Decay", category: "Horror", emoji: "🦠" },
  { id: "blood-splatter", label: "Blood Splatter", category: "Horror", emoji: "🩸" },
  { id: "ghost-appear", label: "Ghost Appear", category: "Horror", emoji: "👻" },
  { id: "distortion", label: "Distortion", category: "Horror", emoji: "🌀" },
  
  // Light Effects
  { id: "flash", label: "Flash", category: "Light", emoji: "⚡" },
  { id: "light-leak", label: "Light Leak", category: "Light", emoji: "💡" },
  { id: "lens-flare", label: "Lens Flare", category: "Light", emoji: "✨" },
  { id: "film-burn", label: "Film Burn", category: "Light", emoji: "🎞️" },
  
  // 3D/Motion
  { id: "cube-left", label: "3D Cube Left", category: "3D", emoji: "🧊" },
  { id: "cube-right", label: "3D Cube Right", category: "3D", emoji: "🧊" },
  { id: "page-curl", label: "Page Curl", category: "3D", emoji: "📄" },
  { id: "warp-zoom", label: "Warp Zoom", category: "3D", emoji: "🌌" },
  { id: "wormhole", label: "Wormhole", category: "3D", emoji: "🕳️" },
  
  // Social Media
  { id: "bounce", label: "Bounce", category: "Social", emoji: "🏀" },
  { id: "elastic", label: "Elastic", category: "Social", emoji: "🎸" },
  { id: "tada", label: "Ta-da!", category: "Social", emoji: "🎉" },
  { id: "heartbeat", label: "Heartbeat", category: "Social", emoji: "💓" },
  { id: "rubber-band", label: "Rubber Band", category: "Social", emoji: "🎯" },
  { id: "jello", label: "Jello", category: "Social", emoji: "🍮" },
  { id: "swing", label: "Swing", category: "Social", emoji: "🎪" },
  { id: "wobble", label: "Wobble", category: "Social", emoji: "🍮" },
  
  // Tech/Glitch
  { id: "matrix", label: "Matrix", category: "Tech", emoji: "💻" },
  { id: "digital-glitch", label: "Digital Glitch", category: "Tech", emoji: "💾" },
  { id: "pixelate", label: "Pixelate", category: "Tech", emoji: "👾" },
  { id: "scan-line", label: "Scan Lines", category: "Tech", emoji: "📺" },
  { id: "terminal", label: "Terminal", category: "Tech", emoji: "⌨️" },
  { id: "circuit", label: "Circuit", category: "Tech", emoji: "⚡" },
  { id: "hologram", label: "Hologram", category: "Tech", emoji: "👽" },
  
  // Split/Multi
  { id: "split-horizontal", label: "Split Horizontal", category: "Split", emoji: "✂️" },
  { id: "split-vertical", label: "Split Vertical", category: "Split", emoji: "✂️" },
  { id: "mosaic", label: "Mosaic", category: "Split", emoji: "🧩" },
  { id: "shatter", label: "Shatter", category: "Split", emoji: "💥" },
];

export const TRANSITION_CATEGORIES = ["All", "Basic", "Camera", "Cinematic", "Horror", "Light", "3D", "Social", "Tech", "Split"];

// Easing functions
export const EASINGS = {
  linear: (t: number) => t,
  "ease-in": (t: number) => t * t,
  "ease-out": (t: number) => 1 - (1 - t) * (1 - t),
  "ease-in-out": (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bounce: (t: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }
};

// Apply transition to canvas context
export function applyTransition(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  progress: number, // 0 to 1
  transitionId: string,
  params: TransitionParams,
  isEntering: boolean // true = enter, false = exit
): boolean {
  const t = isEntering ? progress : 1 - progress;
  const eased = EASINGS[params.easing](t);
  const inv = 1 - eased;
  
  ctx.save();
  
  switch (transitionId) {
    // Basic
    case "fade":
      ctx.globalAlpha = eased;
      break;
      
    case "slide-left":
      ctx.translate(-W * inv, 0);
      ctx.globalAlpha = eased;
      break;
    case "slide-right":
      ctx.translate(W * inv, 0);
      ctx.globalAlpha = eased;
      break;
    case "slide-up":
      ctx.translate(0, -H * inv);
      ctx.globalAlpha = eased;
      break;
    case "slide-down":
      ctx.translate(0, H * inv);
      ctx.globalAlpha = eased;
      break;
      
    case "zoom-in":
      ctx.translate(W/2, H/2);
      ctx.scale(0.5 + 0.5 * eased, 0.5 + 0.5 * eased);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
    case "zoom-out":
      ctx.translate(W/2, H/2);
      ctx.scale(1.5 - 0.5 * eased, 1.5 - 0.5 * eased);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    // Camera
    case "spin":
      ctx.translate(W/2, H/2);
      ctx.rotate((isEntering ? 1 : -1) * Math.PI * 2 * inv);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    case "flip-x":
      ctx.translate(W/2, H/2);
      ctx.scale(eased > 0.5 ? 1 : -1, 1);
      ctx.translate(-W/2, -H/2);
      break;
      
    case "flip-y":
      ctx.translate(W/2, H/2);
      ctx.scale(1, eased > 0.5 ? 1 : -1);
      ctx.translate(-W/2, -H/2);
      break;
      
    case "shake":
      const shake = Math.sin(t * 20) * 10 * inv;
      ctx.translate(shake, shake * 0.5);
      ctx.globalAlpha = eased;
      break;
      
    case "whip-pan-left":
    case "whip-pan-right":
      const dir = transitionId === "whip-pan-left" ? -1 : 1;
      const blur = ctx.filter || "";
      ctx.filter = `blur(${inv * 20}px)`;
      ctx.translate(dir * W * inv * 2, 0);
      ctx.globalAlpha = eased;
      break;
      
    // Cinematic
    case "dissolve":
    case "cross-fade":
      ctx.globalAlpha = eased;
      // Add slight blur during transition
      if (inv > 0.1 && inv < 0.9) {
        ctx.filter = `blur(${Math.sin(t * Math.PI) * 3}px)`;
      }
      break;
      
    case "wipe-left":
      ctx.beginPath();
      ctx.rect(0, 0, W * eased, H);
      ctx.clip();
      break;
    case "wipe-right":
      ctx.beginPath();
      ctx.rect(W * inv, 0, W * eased, H);
      ctx.clip();
      break;
      
    case "iris-open":
      const rOpen = Math.max(W, H) * eased;
      ctx.beginPath();
      ctx.arc(W/2, H/2, rOpen, 0, Math.PI * 2);
      ctx.clip();
      break;
    case "iris-close":
      const rClose = Math.max(W, H) * inv;
      ctx.beginPath();
      ctx.arc(W/2, H/2, rClose, 0, Math.PI * 2);
      ctx.clip();
      break;
      
    case "curtain-left":
      ctx.translate(-W * 0.3 * inv, 0);
      ctx.globalAlpha = eased;
      break;
    case "curtain-right":
      ctx.translate(W * 0.3 * inv, 0);
      ctx.globalAlpha = eased;
      break;
      
    // Horror Effects
    case "blood-drip":
      ctx.globalAlpha = eased;
      // Simulate blood dripping with gradient
      const dripH = H * 0.3 * inv;
      const g = ctx.createLinearGradient(0, 0, 0, dripH);
      g.addColorStop(0, "rgba(139, 0, 0, 0)");
      g.addColorStop(0.5, "rgba(139, 0, 0, 0.3)");
      g.addColorStop(1, "rgba(139, 0, 0, 0.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, dripH);
      break;
      
    case "glitch":
    case "digital-glitch":
      if (Math.random() > 0.7) {
        ctx.translate((Math.random() - 0.5) * 20 * inv, 0);
      }
      ctx.globalAlpha = eased;
      break;
      
    case "static":
      // TV static noise effect
      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.9) {
          const noise = Math.random() * 255;
          data[i] = noise;
          data[i+1] = noise;
          data[i+2] = noise;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      ctx.globalAlpha = eased;
      break;
      
    case "flicker":
      ctx.globalAlpha = eased * (0.7 + Math.random() * 0.3);
      break;
      
    case "possessed":
      const shakeX = Math.sin(t * 30) * 5 * inv;
      const shakeY = Math.cos(t * 25) * 3 * inv;
      ctx.translate(shakeX, shakeY);
      ctx.globalAlpha = eased;
      ctx.filter = `hue-rotate(${Math.sin(t * 10) * 30}deg) saturate(2)`;
      break;
      
    case "demonic":
      ctx.filter = `contrast(1.5) brightness(0.8) sepia(0.3) hue-rotate(-20deg)`;
      ctx.globalAlpha = eased;
      break;
      
    case "shadow-pulse":
      const pulse = 1 + Math.sin(t * 10) * 0.1 * inv;
      ctx.translate(W/2, H/2);
      ctx.scale(pulse, pulse);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      ctx.filter = `brightness(0.5) contrast(1.2)`;
      break;
      
    case "cursed":
      ctx.filter = `invert(${inv * 0.3}) contrast(1.3) blur(${inv * 2}px)`;
      ctx.globalAlpha = eased;
      break;
      
    case "void":
      const voidScale = 1 - inv * 0.1;
      ctx.translate(W/2, H/2);
      ctx.scale(voidScale, voidScale);
      ctx.translate(-W/2, -H/2);
      ctx.filter = `brightness(0.3) contrast(2) saturate(0)`;
      ctx.globalAlpha = eased;
      break;
      
    case "hellfire":
      ctx.filter = `contrast(1.5) brightness(1.2) sepia(0.5) hue-rotate(-30deg)`;
      ctx.globalAlpha = eased;
      break;
      
    case "phantom":
      ctx.filter = `blur(${inv * 5}px) brightness(1.5)`;
      ctx.globalAlpha = eased * 0.8;
      break;
      
    case "decay":
      ctx.filter = `sepia(0.6) contrast(0.8) brightness(0.9)`;
      ctx.globalAlpha = eased;
      break;
      
    case "blood-splatter":
      ctx.globalAlpha = eased;
      // Draw blood splatter pattern
      ctx.fillStyle = `rgba(139, 0, 0, ${inv * 0.4})`;
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H * 0.5;
        const r = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    case "ghost-appear":
      ctx.filter = `blur(${inv * 3}px) brightness(1.3)`;
      ctx.globalAlpha = eased * 0.9;
      break;
      
    case "distortion":
      ctx.translate(W/2, H/2);
      ctx.scale(1 + Math.sin(t * 5) * 0.05 * inv, 1);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    // Light Effects
    case "flash":
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(t * Math.PI) * 0.3})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = eased;
      break;
      
    case "light-leak":
      const leakX = W * 0.7 + Math.sin(t * 3) * W * 0.1;
      const gLeak = ctx.createRadialGradient(leakX, H/2, 0, leakX, H/2, W * 0.4);
      gLeak.addColorStop(0, `rgba(255, 200, 100, ${inv * 0.3})`);
      gLeak.addColorStop(1, "transparent");
      ctx.fillStyle = gLeak;
      ctx.globalCompositeOperation = "screen";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = eased;
      break;
      
    case "lens-flare":
      ctx.globalAlpha = eased;
      break;
      
    case "film-burn":
      ctx.filter = `saturate(1.5) contrast(1.1) brightness(${1 + inv * 0.2})`;
      ctx.globalAlpha = eased;
      break;
      
    // 3D
    case "cube-left":
    case "cube-right":
      const cubeDir = transitionId === "cube-left" ? -1 : 1;
      ctx.translate(W/2, H/2);
      ctx.rotateY = ctx.rotateY || 0;
      ctx.rotateY = cubeDir * Math.PI / 2 * inv;
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    case "page-curl":
      ctx.translate(W, 0);
      ctx.rotate(Math.PI / 4 * inv);
      ctx.translate(-W, 0);
      ctx.globalAlpha = eased;
      break;
      
    case "warp-zoom":
      const warpScale = 1 + Math.sin(t * Math.PI) * 0.5 * inv;
      ctx.translate(W/2, H/2);
      ctx.scale(warpScale, warpScale);
      ctx.translate(-W/2, -H/2);
      ctx.filter = `blur(${inv * 10}px)`;
      ctx.globalAlpha = eased;
      break;
      
    case "wormhole":
      const wormScale = 1 - inv * 0.3;
      ctx.translate(W/2, H/2);
      ctx.scale(wormScale, wormScale);
      ctx.rotate(t * 2 * inv);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    // Social
    case "bounce":
      const bounceT = EASINGS.bounce(t);
      ctx.translate(0, -H * 0.2 * (1 - bounceT));
      ctx.globalAlpha = eased;
      break;
      
    case "elastic":
      const elasticT = EASINGS.elastic(t);
      ctx.scale(elasticT, elasticT);
      ctx.globalAlpha = eased;
      break;
      
    case "tada":
      const tadaScale = 1 + Math.sin(t * Math.PI * 4) * 0.1 * inv;
      ctx.translate(W/2, H/2);
      ctx.scale(tadaScale, tadaScale);
      ctx.rotate(Math.sin(t * Math.PI * 4) * 0.05 * inv);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    case "heartbeat":
      const beat = 1 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.15 * inv;
      ctx.translate(W/2, H/2);
      ctx.scale(beat, beat);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    case "rubber-band":
      ctx.translate(W/2, H/2);
      ctx.scale(1 + Math.sin(t * Math.PI * 3) * 0.1 * inv, 1);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    case "jello":
    case "wobble":
      ctx.translate(W/2, H/2);
      ctx.scale(1 + Math.sin(t * 10) * 0.05 * inv, 1 + Math.cos(t * 10) * 0.05 * inv);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    case "swing":
      ctx.translate(W/2, H/2);
      ctx.rotate(Math.sin(t * Math.PI * 2) * 0.1 * inv);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    // Tech
    case "matrix":
      ctx.filter = `hue-rotate(90deg) saturate(2)`;
      ctx.globalAlpha = eased;
      break;
      
    case "pixelate":
      ctx.filter = `blur(${inv * 5}px)`;
      ctx.globalAlpha = eased;
      break;
      
    case "scan-line":
      ctx.fillStyle = `rgba(0, 255, 0, ${inv * 0.1})`;
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 2);
      }
      ctx.globalAlpha = eased;
      break;
      
    case "terminal":
      ctx.filter = `contrast(1.2) brightness(0.9)`;
      ctx.globalAlpha = eased;
      break;
      
    case "circuit":
      ctx.strokeStyle = `rgba(0, 255, 255, ${inv * 0.3})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 50, y);
        ctx.lineTo(x + 50, y + 30);
        ctx.stroke();
      }
      ctx.globalAlpha = eased;
      break;
      
    case "hologram":
      ctx.filter = `hue-rotate(180deg) saturate(0) brightness(1.2)`;
      ctx.globalAlpha = eased * 0.8;
      break;
      
    // Split
    case "split-horizontal":
      ctx.beginPath();
      ctx.rect(0, H * 0.25 * inv, W, H * 0.5 + H * 0.5 * eased);
      ctx.clip();
      break;
      
    case "split-vertical":
      ctx.beginPath();
      ctx.rect(W * 0.25 * inv, 0, W * 0.5 + W * 0.5 * eased, H);
      ctx.clip();
      break;
      
    case "mosaic":
      const tileSize = 50 * inv;
      ctx.filter = `blur(${tileSize}px)`;
      ctx.globalAlpha = eased;
      break;
      
    case "shatter":
      ctx.translate(W/2, H/2);
      ctx.rotate(inv * 0.1);
      ctx.scale(1 + inv * 0.05, 1 + inv * 0.05);
      ctx.translate(-W/2, -H/2);
      ctx.globalAlpha = eased;
      break;
      
    default:
      ctx.globalAlpha = eased;
  }
  
  return true; // Continue rendering
}

// Cleanup after transition
export function cleanupTransition(ctx: CanvasRenderingContext2D) {
  ctx.restore();
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
