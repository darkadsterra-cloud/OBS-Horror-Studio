// performance-optimizer.ts — Performance & Memory Management
// Place at: artifacts/horror-studio/src/data/performance-optimizer.ts

interface PerformanceConfig {
  maxFPS: number;
  enableFrameSkipping: boolean;
  maxParticles: number;
  enableWebWorker: boolean;
  lowPowerMode: boolean;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  maxFPS: 60,
  enableFrameSkipping: false,
  maxParticles: 1000,
  enableWebWorker: false,
  lowPowerMode: false
};

// Frame rate controller
export class FrameRateController {
  private targetFPS: number;
  private frameInterval: number;
  private lastFrameTime: number = 0;
  private accumulator: number = 0;
  
  constructor(fps: number = 60) {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
  
  shouldRender(currentTime: number): boolean {
    const delta = currentTime - this.lastFrameTime;
    
    if (delta >= this.frameInterval) {
      this.lastFrameTime = currentTime - (delta % this.frameInterval);
      return true;
    }
    return false;
  }
  
  setTargetFPS(fps: number) {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}

// Object pool for particles
export class ParticlePool<T> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private reset: (item: T) => void;
  
  constructor(factory: () => T, reset: (item: T) => void, initialSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }
  
  acquire(): T {
    let item = this.pool.pop();
    if (!item) {
      item = this.factory();
    }
    this.active.add(item);
    this.reset(item);
    return item;
  }
  
  release(item: T): void {
    if (this.active.has(item)) {
      this.active.delete(item);
      this.reset(item);
      this.pool.push(item);
    }
  }
  
  releaseAll(): void {
    this.active.forEach(item => {
      this.reset(item);
      this.pool.push(item);
    });
    this.active.clear();
  }
  
  getActiveCount(): number {
    return this.active.size;
  }
}

// Memory monitor
export class MemoryMonitor {
  private checkInterval: number = 5000;
  private warningThreshold: number = 0.8; // 80% of max
  private criticalThreshold: number = 0.9; // 90% of max
  private onWarning: () => void;
  private onCritical: () => void;
  private intervalId?: NodeJS.Timeout;
  
  constructor(
    onWarning: () => void,
    onCritical: () => void,
    checkInterval?: number
  ) {
    this.onWarning = onWarning;
    this.onCritical = onCritical;
    if (checkInterval) this.checkInterval = checkInterval;
  }
  
  start() {
    if (typeof window === "undefined" || !("performance" in window)) return;
    
    this.intervalId = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const used = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (used > this.criticalThreshold) {
          this.onCritical();
        } else if (used > this.warningThreshold) {
          this.onWarning();
        }
      }
    }, this.checkInterval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Video buffer manager
export class VideoBufferManager {
  private buffers: Map<string, HTMLVideoElement> = new Map();
  private maxBuffers: number = 3;
  private currentPlaying: string | null = null;
  
  constructor(maxBuffers: number = 3) {
    this.maxBuffers = maxBuffers;
  }
  
  getVideo(url: string): HTMLVideoElement {
    if (this.buffers.has(url)) {
      return this.buffers.get(url)!;
    }
    
    // Clean up old buffers if at limit
    if (this.buffers.size >= this.maxBuffers) {
      const firstKey = this.buffers.keys().next().value;
      this.removeVideo(firstKey);
    }
    
    const video = document.createElement("video");
    video.src = url;
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    
    // Limit buffer size
    video.addEventListener("loadedmetadata", () => {
      // Reduce quality if video is too large
      if (video.videoWidth > 1920 || video.videoHeight > 1080) {
        // In real implementation, use video compression
        console.warn("Large video detected, consider compression");
      }
    });
    
    this.buffers.set(url, video);
    return video;
  }
  
  play(url: string): HTMLVideoElement {
    // Pause current
    if (this.currentPlaying && this.currentPlaying !== url) {
      const current = this.buffers.get(this.currentPlaying);
      if (current) {
        current.pause();
        current.currentTime = 0;
      }
    }
    
    const video = this.getVideo(url);
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      video.play();
    });
    this.currentPlaying = url;
    return video;
  }
  
  pause(url?: string) {
    const target = url || this.currentPlaying;
    if (target) {
      const video = this.buffers.get(target);
      if (video) video.pause();
    }
  }
  
  removeVideo(url: string) {
    const video = this.buffers.get(url);
    if (video) {
      video.pause();
      video.src = "";
      video.load(); // Clear buffer
      this.buffers.delete(url);
    }
    if (this.currentPlaying === url) {
      this.currentPlaying = null;
    }
  }
  
  clear() {
    this.buffers.forEach(video => {
      video.pause();
      video.src = "";
      video.load();
    });
    this.buffers.clear();
    this.currentPlaying = null;
  }
}

// Canvas optimization
export function optimizeCanvas(canvas: HTMLCanvasElement): void {
  // Use willReadFrequently only when necessary
  const ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true, // Reduce latency
    willReadFrequently: false
  });
  
  if (!ctx) return;
  
  // Disable image smoothing for pixel art, enable for videos
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";
}

// RAF throttler
export function throttleRAF(callback: () => void, fps: number = 60): () => void {
  let rafId: number;
  let lastTime = 0;
  const interval = 1000 / fps;
  
  const loop = (currentTime: number) => {
    rafId = requestAnimationFrame(loop);
    
    const delta = currentTime - lastTime;
    if (delta >= interval) {
      lastTime = currentTime - (delta % interval);
      callback();
    }
  };
  
  rafId = requestAnimationFrame(loop);
  
  return () => cancelAnimationFrame(rafId);
}

// Detect low power mode
export function detectLowPowerMode(): boolean {
  // Check for battery API
  if ("getBattery" in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      return battery.level < 0.2 || battery.charging === false;
    });
  }
  
  // Check for reduced motion preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  
  return false;
}

// Cleanup function for unmounting
export function cleanupResources(
  videoManager: VideoBufferManager,
  particlePools: ParticlePool<any>[],
  canvases: HTMLCanvasElement[]
): void {
  // Stop all videos
  videoManager.clear();
  
  // Release all particles
  particlePools.forEach(pool => pool.releaseAll());
  
  // Clear canvases
  canvases.forEach(canvas => {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
  
  // Force garbage collection hint
  if (window.gc) {
    window.gc();
  }
}
