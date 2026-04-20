import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  CSSProperties,
} from "react";

/* =========================
   TYPES
========================= */

type AnimationType = "fade" | "slide" | "scale" | "type";
type Easing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

interface Layer {
  id: string;
  text: string;

  x: number;
  y: number;
  width: number;
  height: number;

  fontSize: number;
  fontFamily: string;
  color: string;
  gradient?: string;

  letterSpacing: number;
  lineHeight: number;

  visible: boolean;
  locked: boolean;

  strokeWidth: number;
  strokeColor: string;

  shadow: {
    enabled: boolean;
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };

  animation: {
    type: AnimationType;
    duration: number;
    delay: number;
    easing: Easing;
    loop: boolean;
  };
}

interface Overlay {
  id: string;
  type: "shape" | "image";
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
  src?: string;
}

interface ProjectState {
  layers: Layer[];
  overlays: Overlay[];
  selectedLayerId: string | null;
}

/* =========================
   COMPONENT
========================= */

const TextAnimatorPro = () => {
  const [project, setProject] = useState<ProjectState>({
    layers: [],
    overlays: [],
    selectedLayerId: null,
  });

  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [timeline, setTimeline] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  /* =========================
     HELPERS
  ========================= */

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  }, []);

  const addLayer = () => {
    const layer: Layer = {
      id: crypto.randomUUID(),
      text: "New Text",
      x: 120,
      y: 120,
      width: 200,
      height: 80,
      fontSize: 32,
      fontFamily: "sans-serif",
      color: "#ffffff",
      letterSpacing: 0,
      lineHeight: 1.2,
      visible: true,
      locked: false,
      strokeWidth: 0,
      strokeColor: "#000",
      shadow: {
        enabled: false,
        blur: 10,
        color: "#000",
        offsetX: 0,
        offsetY: 0,
      },
      animation: {
        type: "fade",
        duration: 1,
        delay: 0,
        easing: "ease-in-out",
        loop: false,
      },
    };

    setProject((p) => ({
      ...p,
      layers: [...p.layers, layer],
      selectedLayerId: layer.id,
    }));
  };

  const deleteLayer = (id: string) => {
    setProject((p) => ({
      ...p,
      layers: p.layers.filter((l) => l.id !== id),
    }));
  };

  /* =========================
     DRAG
  ========================= */

  const handleMouseDown = (e: React.MouseEvent, layer: Layer) => {
    if (layer.locked) return;

    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      updateLayer(layer.id, {
        x: layer.x + (ev.clientX - startX),
        y: layer.y + (ev.clientY - startY),
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* =========================
     STYLE
  ========================= */

  const getStyle = (layer: Layer): CSSProperties => ({
    position: "absolute",
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    fontSize: layer.fontSize,
    fontFamily: layer.fontFamily,
    letterSpacing: layer.letterSpacing,
    lineHeight: layer.lineHeight,
    color: layer.gradient ? "transparent" : layer.color,
    background: layer.gradient,
    WebkitBackgroundClip: layer.gradient ? "text" : undefined,
    WebkitTextStroke: `${layer.strokeWidth}px ${layer.strokeColor}`,
    textShadow: layer.shadow.enabled
      ? `${layer.shadow.offsetX}px ${layer.shadow.offsetY}px ${layer.shadow.blur}px ${layer.shadow.color}`
      : "none",
  });

  /* =========================
     PLAYBACK
  ========================= */

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeline((t) => t + 0.016);
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying]);

  /* =========================
     EXPORT
  ========================= */

  const exportImage = async () => {
    const html2canvas = (await import("html2canvas")).default;
    if (!canvasRef.current) return;

    const canvas = await html2canvas(canvasRef.current);
    const link = document.createElement("a");
    link.download = "export.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="flex h-screen bg-black text-white">
      {/* SIDEBAR */}
      <div className="w-80 p-4 space-y-3 bg-zinc-900 overflow-y-auto">

        <button onClick={addLayer}>+ Layer</button>
        <button onClick={() => setIsPlaying(true)}>▶ Play</button>
        <button onClick={exportImage}>Export</button>

        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />

        {project.layers.map((l) => (
          <div key={l.id}>
            <input
              value={l.text}
              onChange={(e) =>
                updateLayer(l.id, { text: e.target.value })
              }
            />
            <button onClick={() => deleteLayer(l.id)}>Delete</button>
          </div>
        ))}
      </div>

      {/* CANVAS */}
      <div
        ref={canvasRef}
        className="flex-1 relative bg-zinc-950"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
      >
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-12 opacity-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        )}

        {project.layers.map((layer) =>
          layer.visible ? (
            <div
              key={layer.id}
              onMouseDown={(e) => handleMouseDown(e, layer)}
              style={getStyle(layer)}
            >
              {layer.text}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default TextAnimatorPro;
