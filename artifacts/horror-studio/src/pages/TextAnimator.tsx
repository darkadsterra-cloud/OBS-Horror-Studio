import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates, useCreateTemplate, useDeleteTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";
import { OVERLAY_DEFS, OVERLAY_CATEGORIES, OVERLAY_BY_ID, tickParticles, type OverlayDef, type OverlayParticle } from "@/data/overlays";

// ─── Canvas Sizes ───────────────────────────────────────────────────────────
const CANVAS_PRESETS = [
  { label: "[Standard] 1920×1080 — Full HD",      w: 1920, h: 1080, group: "Standard" },
  { label: "[2K] 2560×1440 — 2K QHD",             w: 2560, h: 1440, group: "Standard" },
  { label: "[4K] 3840×2160 — 4K UHD",             w: 3840, h: 2160, group: "Standard" },
  { label: "[HD] 1280×720 — HD 720p",              w: 1280, h: 720,  group: "Standard" },
  { label: "[Twitch] 1920×1080",                   w: 1920, h: 1080, group: "Streaming" },
  { label: "[OBS] 1920×1080 — OBS Canvas",         w: 1920, h: 1080, group: "Streaming" },
  { label: "[OBS 4K] 3840×2160 — OBS 4K Canvas",  w: 3840, h: 2160, group: "Streaming" },
  { label: "[TikTok] 1080×1920 — TikTok Vertical", w: 1080, h: 1920, group: "Social" },
  { label: "[TikTok] 1920×1080 — TikTok Landscape",w: 1920, h: 1080, group: "Social" },
  { label: "[4:3] 1440×1080 — 4:3 Legacy",         w: 1440, h: 1080, group: "Legacy" },
  { label: "[Ultra] 2560×1080 — Ultrawide",         w: 2560, h: 1080, group: "Standard" },
  { label: "[Ultra] 3440×1440 — UW QHD",            w: 3440, h: 1440, group: "Standard" },
  { label: "[Square] 1080×1080 — Square",           w: 1080, h: 1080, group: "Social" },
  { label: "[Vertical] 1080×1920 — Vertical 9:16",  w: 1080, h: 1920, group: "Social" },
  { label: "[Shorts] 1080×1920 — YouTube Shorts",   w: 1080, h: 1920, group: "Social" },
  { label: "[Reel] 1080×1920 — Instagram Reel",     w: 1080, h: 1920, group: "Social" },
];

const ANIMATION_CLASSES: Record<string, string> = {
  "glitch":         "anim-glitch",
  "blood-drip":     "anim-blood-drip",
  "neon-pulse":     "anim-neon-pulse",
  "zoom-pulse":     "anim-zoom-pulse",
  "fire-glow":      "anim-fire-glow",
  "flicker":        "anim-flicker",
  "shake":          "anim-shake",
  "cinematic-fade": "anim-cinematic-fade",
  "bounce":         "anim-bounce",
  "spin-reveal":    "anim-spin-reveal",
  "slide-left":     "anim-slide-left",
  "float":          "anim-float",
  "fade":           "anim-fade",
};

const ALL_ANIMATIONS = Object.keys(ANIMATION_CLASSES);

// ─── 100+ Fonts ─────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  // Horror / Gothic
  "Creepster", "Nosifer", "Eater", "Butcherman", "Pirata One", "Metal Mania",
  "UnifrakturMaguntia", "MedievalSharp", "Uncial Antiqua", "Ewert", "Sancreek",
  "Rye", "Griffy", "Henny Penny", "Fontdiner Swanky",
  // Cinematic / Serif
  "Cinzel", "Cinzel Decorative", "IM Fell English", "Alfa Slab One", "Abril Fatface",
  "Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Lora", "Merriweather",
  "PT Serif", "Cardo", "Spectral", "Crimson Text",
  // Sci-Fi / Tech
  "Orbitron", "Michroma", "Exo 2", "Rajdhani", "Russo One", "Share Tech Mono",
  "VT323", "Press Start 2P", "Black Ops One", "Audiowide", "Electrolize",
  "Nova Square", "Quantico", "Syncopate", "Unica One",
  // Bold / Impact
  "Bebas Neue", "Anton", "Black Han Sans", "Oswald", "Teko", "Barlow Condensed",
  "Squada One", "Fugaz One", "Righteous", "Boogaloo", "Bangers", "Bungee",
  "Bungee Shade", "Bungee Inline", "Lilita One", "Rubik Mono One",
  // Decorative
  "Pacifico", "Lobster", "Permanent Marker", "Caveat", "Sacramento",
  "Satisfy", "Dancing Script", "Great Vibes", "Pinyon Script", "Allura",
  "Kaushan Script", "Cookie", "Courgette",
  // Clean / Modern
  "Inter", "Poppins", "Nunito", "Montserrat", "Raleway", "Ubuntu",
  "Source Sans Pro", "Lato", "Open Sans", "Roboto Condensed",
  "Barlow", "Karla", "DM Sans", "Manrope", "Plus Jakarta Sans",
  // Monospace / Code
  "Courier New", "IBM Plex Mono", "Fira Code", "Space Mono", "Roboto Mono",
  "Source Code Pro", "Inconsolata", "JetBrains Mono",
  // Classic system
  "Impact", "Arial Black", "Georgia", "Verdana", "Tahoma", "Trebuchet MS",
];

// ─── Text Layer type ─────────────────────────────────────────────────────────
interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: CanvasTextAlign;
  opacity: number;
  rotation: number;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  glowEnabled: boolean;
  glowColor: string;
  letterSpacing: number;
  animation: string;
  _w: number;
  _h: number;
}

function makeLayer(partial: Partial<TextLayer> = {}): TextLayer {
  return {
    id: Math.random().toString(36).slice(2),
    text: "STARTING SOON",
    x: 0.5,
    y: 0.5,
    fontSize: 120,
    fontFamily: "Creepster",
    color: "#cc0000",
    bold: false,
    italic: false,
    underline: false,
    align: "center",
    opacity: 1,
    rotation: 0,
    strokeColor: "#000000",
    strokeWidth: 4,
    shadowEnabled: true,
    shadowColor: "#000000",
    shadowBlur: 20,
    glowEnabled: false,
    glowColor: "#ff0000",
    letterSpacing: 0,
    animation: "none",
    _w: 0,
    _h: 0,
    ...partial,
  };
}

function TemplatePreview({ template, text }: { template: TemplateData; text: string }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKey(k => k + 1), 3000);
    return () => clearInterval(t);
  }, []);
  const animClass = ANIMATION_CLASSES[template.animation] ?? "";
  const bg = template.backgroundStyle === "dark-gradient"
    ? "linear-gradient(135deg, #0a0808 0%, #150a1a 100%)"
    : "#080810";
  return (
    <div className="h-full flex items-center justify-center overflow-hidden" style={{ background: bg }}>
      <span
        key={key}
        className={`${animClass} text-sm font-bold block text-center px-2 leading-tight`}
        style={{
          fontFamily: `'${template.font}', sans-serif`,
          color: template.colors[0],
          textShadow: template.glow
            ? `0 0 10px ${template.colors[0]}, 0 0 20px ${template.colors[0]}88`
            : template.shadowEffect
              ? "2px 2px 8px rgba(0,0,0,0.8)"
              : "none",
        }}
      >
        {text || template.name.toUpperCase()}
      </span>
    </div>
  );
}

function TemplateCard({ template, selected, onClick, text }: {
  template: TemplateData; selected: boolean; onClick: () => void; text: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded border cursor-pointer transition-all overflow-hidden ${selected
        ? "border-red-600/60 ring-1 ring-red-500/30"
        : "border-zinc-800/40 hover:border-zinc-600/40"}`}
      style={selected ? { boxShadow: "0 0 12px rgba(220,20,60,0.25)" } : {}}
    >
      <div className="h-16 bg-[#08080f]">
        <TemplatePreview template={template} text={text} />
      </div>
      <div className="px-2 py-1 bg-[#0a0a14] border-t border-zinc-800/30">
        <div className="text-[9px] font-medium text-zinc-400 truncate">{template.name}</div>
        <div className="text-[8px] text-zinc-600">{template.animation}</div>
      </div>
    </div>
  );
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function hitTestLayer(layer: TextLayer, cx: number, cy: number, canvasW: number, canvasH: number): boolean {
  const lx = layer.x * canvasW;
  const ly = layer.y * canvasH;
  const hw = layer._w / 2 + 10;
  const hh = layer._h / 2 + 10;
  const dx = cx - lx;
  const dy = cy - ly;
  const cos = Math.cos(-layer.rotation);
  const sin = Math.sin(-layer.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TextAnimator() {
  // ── Template state ───────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Canvas size ──────────────────────────────────────────────────────────
  const [canvasPreset, setCanvasPreset] = useState(CANVAS_PRESETS[0]);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  // ── Background media ─────────────────────────────────────────────────────
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgVideo, setBgVideo] = useState<HTMLVideoElement | null>(null);
  const [bgObjectFit, setBgObjectFit] = useState<"cover" | "contain" | "fill">("cover");
  const bgFileRef  = useRef<HTMLInputElement>(null);
  const bgVidRef   = useRef<HTMLInputElement>(null);

  // ── Text layers ──────────────────────────────────────────────────────────
  const [layers, setLayers]           = useState<TextLayer[]>([makeLayer()]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(layers[0].id);
  const [newText, setNewText]         = useState("STARTING SOON");

  const selectedLayer = layers.find(l => l.id === selectedLayerId) ?? null;

  const updateLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  // ── Edit panel ───────────────────────────────────────────────────────────
  const [showEditPanel, setShowEditPanel] = useState(true);

  // ── Recording ────────────────────────────────────────────────────────────
  const [recording, setRecording]         = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings]       = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [showRecordings, setShowRecordings] = useState(false);

  // ── Overlays ─────────────────────────────────────────────────────────────
  const [showOverlays, setShowOverlays]           = useState(false);
  const [activeOverlayId, setActiveOverlayId]     = useState<string | null>(null);
  const [activeOverlayCategory, setActiveOverlayCategory] = useState("All");

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Canvas refs ──────────────────────────────────────────────────────────
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const layersRef    = useRef<TextLayer[]>(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  const selectedIdRef = useRef<string | null>(selectedLayerId);
  useEffect(() => { selectedIdRef.current = selectedLayerId; }, [selectedLayerId]);

  // ── Overlay refs ─────────────────────────────────────────────────────────
  const activeOverlayIdRef    = useRef<string | null>(null);
  const overlayParticlesRef   = useRef<Record<string, any[]>>({});
  useEffect(() => { activeOverlayIdRef.current = activeOverlayId; }, [activeOverlayId]);

  // ── Drag / resize / rotate refs ──────────────────────────────────────────
  const dragging       = useRef(false);
  const dragLayerId    = useRef<string | null>(null);
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartPos   = useRef({ x: 0, y: 0 });
  const resizing       = useRef(false);
  const resizeStartY   = useRef(0);
  const resizeStartSize= useRef(0);
  const rotating       = useRef(false);
  const rotateStartAngle = useRef(0);
  const rotateStartRot   = useRef(0);
  const rotateCenter     = useRef({ x: 0, y: 0 });

  // ── DB templates ─────────────────────────────────────────────────────────
  const { data: dbTemplates = [] } = useListTemplates();
  const allTemplates: TemplateData[] = [
    ...PRESET_TEMPLATES,
    ...dbTemplates.map(t => ({
      id: t.id, name: t.name, category: t.category, font: t.font,
      animation: t.animation, colors: t.colors as string[], glow: t.glow,
      shadowEffect: t.shadowEffect, backgroundStyle: t.backgroundStyle,
      motionBehavior: t.motionBehavior, isPreset: t.isPreset,
    })),
  ];

  const filtered = allTemplates.filter(t => {
    const catMatch    = activeCategory === "All" || t.category === activeCategory;
    const searchMatch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  const selectTemplate = (tpl: TemplateData) => {
    setSelectedTemplate(tpl);
    if (selectedLayerId) {
      updateLayer(selectedLayerId, {
        fontFamily: tpl.font,
        color: tpl.colors[0],
        animation: tpl.animation,
        glowEnabled: tpl.glow,
        shadowEnabled: tpl.shadowEffect,
      });
    }
  };

  // ─── Background upload handlers ──────────────────────────────────────────
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => { setBgImage(img); setBgVideo(null); };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = url;
    vid.loop = true;
    vid.muted = false;
    vid.playsInline = true;
    vid.play();
    setBgVideo(vid);
    setBgImage(null);
  };

  const clearBg = () => {
    setBgImage(null);
    if (bgVideo) { bgVideo.pause(); setBgVideo(null); }
    if (bgFileRef.current)  bgFileRef.current.value  = "";
    if (bgVidRef.current)   bgVidRef.current.value   = "";
  };

  // ─── Stable refs for render loop ────────────────────────────────────────
  const bgImageRef  = useRef(bgImage);
  const bgVideoRef  = useRef(bgVideo);
  const bgFitRef    = useRef(bgObjectFit);
  const presetRef   = useRef(canvasPreset);
  const templateRef = useRef(selectedTemplate);
  useEffect(() => { bgImageRef.current  = bgImage;        }, [bgImage]);
  useEffect(() => { bgVideoRef.current  = bgVideo;        }, [bgVideo]);
  useEffect(() => { bgFitRef.current    = bgObjectFit;    }, [bgObjectFit]);
  useEffect(() => { presetRef.current   = canvasPreset;   }, [canvasPreset]);
  useEffect(() => { templateRef.current = selectedTemplate; }, [selectedTemplate]);

  // ─── Canvas render loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let running = true;
    let frameCount = 0;

    const drawBg = (W: number, H: number) => {
      const fit = bgFitRef.current;
      const img = bgImageRef.current;
      const vid = bgVideoRef.current;
      const tpl = templateRef.current;
      ctx.clearRect(0, 0, W, H);
      const media: CanvasImageSource | null = vid && vid.readyState >= 2 ? vid : img;
      if (media) {
        const sw = media instanceof HTMLVideoElement ? media.videoWidth  : (media as HTMLImageElement).naturalWidth;
        const sh = media instanceof HTMLVideoElement ? media.videoHeight : (media as HTMLImageElement).naturalHeight;
        let dx = 0, dy = 0, dw = W, dh = H;
        if (fit === "contain") {
          const s = Math.min(W / sw, H / sh);
          dw = sw * s; dh = sh * s;
          dx = (W - dw) / 2; dy = (H - dh) / 2;
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        } else if (fit === "cover") {
          const s = Math.max(W / sw, H / sh);
          dw = sw * s; dh = sh * s;
          dx = (W - dw) / 2; dy = (H - dh) / 2;
        }
        ctx.drawImage(media, dx, dy, dw, dh);
      } else if (tpl.backgroundStyle === "dark-gradient") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#0a0808"); grad.addColorStop(1, "#150a1a");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, W, H);
      }
    };

    const drawLayer = (layer: TextLayer, W: number, H: number, t: number) => {
      const cx = layer.x * W;
      const cy = layer.y * H;
      const anim = layer.animation;

      let ox = 0, oy = 0, oscale = 1, oalpha = 1;
      if (anim === "float")   { oy = Math.sin(t * 1.5) * (H * 0.03); }
      if (anim === "bounce")  { oy = -Math.abs(Math.sin(t * 3)) * (H * 0.06); }
      if (anim === "shake")   { ox = (Math.random() - 0.5) * 12; oy = (Math.random() - 0.5) * 6; }
      if (anim === "flicker") { oalpha = Math.random() > 0.1 ? 1 : (Math.random() > 0.5 ? 0.3 : 0); }
      if (anim === "zoom-pulse") { oscale = 1 + Math.sin(t * 3) * 0.1; }
      if (anim === "cinematic-fade") {
        const cycle = (t % 4) / 4;
        oalpha = cycle < 0.25 ? cycle * 4 : cycle < 0.75 ? 1 : (1 - cycle) * 4;
      }
      if (anim === "slide-left") {
        const cycle = (t * 0.5) % 2;
        ox = cycle < 1 ? W * (1 - cycle) : 0;
      }
      if (anim === "spin-reveal") {
        const cycle = (t * 0.5) % Math.PI;
        oscale = Math.abs(Math.cos(cycle));
        oalpha = 0.3 + oscale * 0.7;
      }

      const weight = layer.bold ? "bold" : "normal";
      const style  = layer.italic ? "italic" : "normal";
      ctx.save();
      ctx.translate(cx + ox, cy + oy);
      ctx.rotate(layer.rotation);
      ctx.scale(oscale, oscale);
      ctx.globalAlpha = layer.opacity * oalpha;
      ctx.textAlign    = layer.align;
      ctx.textBaseline = "middle";

      const fs = Math.max(8, layer.fontSize);
      ctx.font = `${style} ${weight} ${fs}px '${layer.fontFamily}', Impact, sans-serif`;

      const drawStyledText = (txt: string, x: number, y: number) => {
        if (layer.letterSpacing === 0) {
          if (layer.strokeWidth > 0) {
            ctx.strokeStyle   = layer.strokeColor;
            ctx.lineWidth     = layer.strokeWidth;
            ctx.lineJoin      = "round";
            ctx.strokeText(txt, x, y);
          }
          ctx.fillStyle = layer.color;
          ctx.fillText(txt, x, y);
          if (layer.underline) {
            const m = ctx.measureText(txt);
            const w = m.width;
            let ux = x;
            if (layer.align === "center") ux = x - w / 2;
            if (layer.align === "right")  ux = x - w;
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = Math.max(1, fs * 0.05);
            ctx.beginPath();
            ctx.moveTo(ux, y + fs * 0.15);
            ctx.lineTo(ux + w, y + fs * 0.15);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          const chars = txt.split("");
          let totalW = 0;
          const widths = chars.map(c => { const m = ctx.measureText(c); totalW += m.width + layer.letterSpacing; return m.width; });
          totalW -= layer.letterSpacing;
          let startX = x;
          if (layer.align === "center") startX = x - totalW / 2;
          if (layer.align === "right")  startX = x - totalW;
          let curX = startX;
          chars.forEach((c, i) => {
            if (layer.strokeWidth > 0) {
              ctx.strokeStyle = layer.strokeColor;
              ctx.lineWidth   = layer.strokeWidth;
              ctx.lineJoin    = "round";
              ctx.strokeText(c, curX, y);
            }
            ctx.fillStyle = layer.color;
            ctx.fillText(c, curX, y);
            curX += widths[i] + layer.letterSpacing;
          });
        }
      };

      if (layer.glowEnabled) {
        ctx.shadowColor = layer.glowColor;
        ctx.shadowBlur  = 30 + Math.sin(t * 2) * 10;
      } else if (layer.shadowEnabled) {
        ctx.shadowColor   = layer.shadowColor;
        ctx.shadowBlur    = layer.shadowBlur;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }

      if (anim === "glitch") {
        ctx.fillStyle = layer.color;
        ctx.shadowColor = layer.color; ctx.shadowBlur = 10;
        drawStyledText(layer.text, 0, 0);
        if (Math.random() > 0.6) {
          const sliceY  = (Math.random() * H * 0.6) + H * 0.2 - cy;
          const sliceH2 = 4 + Math.random() * 20;
          const ofX     = (Math.random() - 0.5) * 60;
          try { const s = ctx.getImageData(0 - cx, sliceY, W, sliceH2); ctx.putImageData(s, ofX, sliceY); } catch {}
        }
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = Math.random() > 0.5 ? "#ff0066" : "#00ffff";
        drawStyledText(layer.text, (Math.random() - 0.5) * 8, 0);
        ctx.fillStyle = Math.random() > 0.5 ? "#00ffff" : "#ff0066";
        drawStyledText(layer.text, -(Math.random() - 0.5) * 8, 2);
        ctx.restore();
        return;
      }

      if (anim === "blood-drip") {
        drawStyledText(layer.text, 0, 0);
        const approxW = fs * layer.text.length * 0.55;
        for (let i = 0; i < 5; i++) {
          const dropX   = -approxW * 0.5 + i * (approxW / 4);
          const dropOff = ((t * 80 + i * 37) % (H * 0.55));
          ctx.fillStyle = `rgba(180,0,0,${0.6 + Math.sin(t + i) * 0.3})`;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.ellipse(dropX, fs * 0.6 + dropOff, 3, 10 + Math.sin(t + i) * 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      if (anim === "fire-glow") {
        ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 20 + Math.sin(t * 2) * 20;
        drawStyledText(layer.text, 0, 0);
        ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 5 + Math.sin(t * 5) * 5;
        ctx.globalAlpha *= 0.4 + Math.random() * 0.2;
        ctx.fillStyle = "#ffcc00";
        ctx.fillText(layer.text, Math.sin(t * 8) * 3, 2);
        ctx.restore();
        return;
      }

      if (anim === "neon-pulse") {
        const intensity = (Math.sin(t * 4) + 1) / 2;
        ctx.shadowColor = layer.color; ctx.shadowBlur = 10 + intensity * 60;
        ctx.globalAlpha *= 0.7 + intensity * 0.3;
        drawStyledText(layer.text, 0, 0);
        ctx.shadowBlur = 40 + intensity * 40; ctx.globalAlpha *= intensity * 0.6;
        drawStyledText(layer.text, 0, 0);
        ctx.restore();
        return;
      }

      drawStyledText(layer.text, 0, 0);

      const measured = ctx.measureText(layer.text);
      const tw = measured.width + Math.max(0, layer.letterSpacing) * layer.text.length;
      const th = fs * 1.4;
      ctx.restore();

      layer._w = tw;
      layer._h = th;

      if (layer.id === selectedIdRef.current) {
        const hw = tw / 2 + 10;
        const hh = th / 2 + 10;
        ctx.save();
        ctx.translate(cx + ox, cy + oy);
        ctx.rotate(layer.rotation);
        ctx.strokeStyle = "rgba(255,60,60,0.85)";
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
        ctx.setLineDash([]);
        const corners = [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]];
        corners.forEach(([hx, hy]) => {
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#cc0000";
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        ctx.strokeStyle = "rgba(255,60,60,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, -hh - 25); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#cc0000"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -hh - 25, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    };

    const render = () => {
      if (!running) return;
      frameCount++;
      const t  = frameCount / 60;
      const W  = presetRef.current.w;
      const H  = presetRef.current.h;
      const cv = canvasRef.current;
      if (!cv) return;
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }

      drawBg(W, H);

      // ── Draw active overlay ──────────────────────────────────────────────
      if (activeOverlayIdRef.current) {
        const def = OVERLAY_BY_ID[activeOverlayIdRef.current];
        if (def) {
          if (!overlayParticlesRef.current[activeOverlayIdRef.current]) {
            overlayParticlesRef.current[activeOverlayIdRef.current] = def.initParticles(W, H);
          }
          def.draw(ctx, W, H, t, overlayParticlesRef.current[activeOverlayIdRef.current]);
        }
      }

      layersRef.current.forEach(layer => drawLayer(layer, W, H, t));
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [canvasPreset]);

  // ─── Canvas mouse interactions ───────────────────────────────────────────
  const toCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "clientX" in e ? e.clientX : 0;
    const clientY = "clientY" in e ? e.clientY : 0;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvasCoords(e);
    const W = canvasPreset.w;
    const H = canvasPreset.h;

    if (selectedLayerId) {
      const sel = layersRef.current.find(l => l.id === selectedLayerId);
      if (sel) {
        const cx = sel.x * W;
        const cy = sel.y * H;
        const hh = sel._h / 2 + 10;
        const rotHandleX = cx + Math.cos(sel.rotation - Math.PI / 2) * (hh + 25);
        const rotHandleY = cy + Math.sin(sel.rotation - Math.PI / 2) * (hh + 25);
        if (Math.hypot(x - rotHandleX, y - rotHandleY) < 12) {
          rotating.current = true;
          rotateCenter.current  = { x: cx, y: cy };
          rotateStartAngle.current = Math.atan2(y - cy, x - cx);
          rotateStartRot.current   = sel.rotation;
          return;
        }
        const hw = sel._w / 2 + 10;
        const cos = Math.cos(sel.rotation);
        const sin = Math.sin(sel.rotation);
        const brX = cx + (hw  * cos - hh  * sin);
        const brY = cy + (hw  * sin + hh  * cos);
        if (Math.hypot(x - brX, y - brY) < 14) {
          resizing.current      = true;
          resizeStartY.current  = y;
          resizeStartSize.current = sel.fontSize;
          dragLayerId.current   = sel.id;
          return;
        }
      }
    }

    const hit = [...layersRef.current].reverse().find(l => hitTestLayer(l, x, y, W, H));
    if (hit) {
      setSelectedLayerId(hit.id);
      dragging.current      = true;
      dragLayerId.current   = hit.id;
      dragStartMouse.current = { x, y };
      dragStartPos.current   = { x: hit.x, y: hit.y };
    } else {
      setSelectedLayerId(null);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const { x, y } = toCanvasCoords(e);
      const W = canvasPreset.w;
      const H = canvasPreset.h;

      if (dragging.current && dragLayerId.current) {
        const dx = x - dragStartMouse.current.x;
        const dy = y - dragStartMouse.current.y;
        updateLayer(dragLayerId.current, {
          x: Math.max(0, Math.min(1, dragStartPos.current.x + dx / W)),
          y: Math.max(0, Math.min(1, dragStartPos.current.y + dy / H)),
        });
      } else if (resizing.current && dragLayerId.current) {
        const dy = y - resizeStartY.current;
        const newSize = Math.max(8, Math.min(600, resizeStartSize.current + dy * 0.5));
        updateLayer(dragLayerId.current, { fontSize: Math.round(newSize) });
        setLayers(prev => prev.map(l => l.id === dragLayerId.current ? { ...l, fontSize: Math.round(newSize) } : l));
      } else if (rotating.current && selectedIdRef.current) {
        const angle = Math.atan2(y - rotateCenter.current.y, x - rotateCenter.current.x);
        const delta = angle - rotateStartAngle.current;
        updateLayer(selectedIdRef.current, { rotation: rotateStartRot.current + delta });
      }
    };
    const onMouseUp = () => {
      dragging.current = false;
      resizing.current = false;
      rotating.current = false;
      dragLayerId.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [canvasPreset, updateLayer]);

  // ─── Add / delete layer ──────────────────────────────────────────────────
  const addLayer = () => {
    const layer = makeLayer({
      text: newText || "TEXT",
      fontFamily: FONT_OPTIONS[0],
      color: selectedTemplate.colors[0],
      x: 0.5,
      y: 0.5,
    });
    setLayers(prev => [...prev, layer]);
    setSelectedLayerId(layer.id);
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // ─── Export PNG ──────────────────────────────────────────────────────────
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href     = canvas.toDataURL("image/png");
    a.download = `horror-overlay-${canvasPreset.w}x${canvasPreset.h}.png`;
    a.click();
  };

  // ─── Recording ───────────────────────────────────────────────────────────
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chunksRef.current = [];
    setRecordingTime(0);

    const stream   = canvas.captureStream(30);
    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" :
      MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" :
      "video/webm";

    const mr = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url  = URL.createObjectURL(blob);
      const name = `rec-${Date.now()}.webm`;
      setRecordings(prev => [{ name, url, size: blob.size }, ...prev]);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
    };

    setTimeout(() => {
      mr.start(250);
      mediaRecorderRef.current = mr;
      setRecording(true);
      let elapsed = 0;
      recordingTimerRef.current = setInterval(() => {
        elapsed++;
        setRecordingTime(elapsed);
        if (elapsed >= 5 * 60) stopRecording();
      }, 1000);
    }, 400);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.requestData?.();
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      }, 200);
    }
    setRecording(false);
  };

  const handleSurpriseMe = () => selectTemplate(allTemplates[Math.floor(Math.random() * allTemplates.length)]);
  const categories = ["All", ...TEMPLATE_CATEGORIES];
  const previewAspectRatio = `${canvasPreset.w} / ${canvasPreset.h}`;
  const sl = selectedLayer;

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">

        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>
            Text Input
          </h2>
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40 resize-none"
            placeholder="Enter text..."
          />
          <button
            onClick={addLayer}
            className="w-full mt-2 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors"
          >
            + Add Text Layer
          </button>
          <button
            onClick={handleSurpriseMe}
            className="w-full mt-1.5 py-1.5 rounded bg-purple-900/20 border border-purple-700/30 text-purple-300 text-xs font-bold hover:bg-purple-900/40 transition-colors"
          >
            Surprise Me
          </button>
        </div>

        {/* Layers list */}
        <div className="p-2 border-b border-red-900/20">
          <h2 className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Layers</h2>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {layers.map(l => (
              <div
                key={l.id}
                onClick={() => setSelectedLayerId(l.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs border transition-all ${
                  l.id === selectedLayerId
                    ? "bg-red-900/30 border-red-700/40 text-red-200"
                    : "bg-zinc-800/40 border-zinc-800/30 text-zinc-400 hover:border-zinc-600/40"
                }`}
              >
                <span className="flex-1 truncate">{l.text || "(empty)"}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteLayer(l.id); }}
                  className="text-zinc-600 hover:text-red-400 text-sm leading-none px-0.5"
                >×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Template Categories */}
        <div className="p-2 border-b border-red-900/20">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${activeCategory === cat
                  ? "bg-red-900/30 border-red-700/40 text-red-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-zinc-800/30">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/30"
          />
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wider">{filtered.length} templates</div>
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                selected={selectedTemplate.id === tpl.id}
                onClick={() => selectTemplate(tpl)}
                text={newText}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── Center: Canvas + Controls ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h1 className="text-lg font-black text-purple-400" style={{ fontFamily: "Cinzel" }}>
            TEXT OVERLAY ANIMATOR
          </h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600">Template:</span>
            <span className="text-zinc-300 font-medium">{selectedTemplate.name}</span>
          </div>
        </div>

        {/* Canvas Size Dropdown */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowSizeMenu(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:border-purple-700/40 transition-colors w-full max-w-sm"
          >
            <span className="text-zinc-500 text-[10px]">📐</span>
            <span className="flex-1 text-left truncate">{canvasPreset.label}</span>
            <span className="text-zinc-500 text-[10px] font-mono">{canvasPreset.w}×{canvasPreset.h}</span>
            <span className="text-zinc-600 ml-1">▾</span>
          </button>
          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 w-80 rounded border border-zinc-700/40 bg-[#0c0c16] shadow-xl max-h-72 overflow-y-auto">
              {CANVAS_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setCanvasPreset(p); setShowSizeMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between gap-2 ${
                    canvasPreset.label === p.label
                      ? "bg-blue-900/40 text-blue-300"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  <span className="text-zinc-600 text-[10px] font-mono flex-shrink-0">{p.w}×{p.h}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <div
            className="relative rounded border border-purple-900/30 overflow-hidden bg-[#05050a]"
            style={{
              aspectRatio: previewAspectRatio,
              maxWidth:  "100%",
              maxHeight: "100%",
              boxShadow: "0 0 30px rgba(100,0,200,0.15)",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
              onMouseDown={handleCanvasMouseDown}
            />
            {recording && (
              <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/50 border border-red-700/60">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-300 font-mono font-bold">REC {formatTime(recordingTime)}</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 border border-zinc-700/30 text-[9px] text-zinc-500 font-mono">
              {canvasPreset.w}×{canvasPreset.h}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center gap-2 mt-2 flex-wrap flex-shrink-0">
          <button onClick={handleExportPng}
            className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-purple-700/30 transition-colors">
            📷 Export PNG
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-1.5 rounded text-xs font-bold border transition-all ${recording
              ? "bg-red-600/30 border-red-500/50 text-red-300 animate-pulse"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"}`}>
            {recording ? `◼ Stop  ${formatTime(recordingTime)}` : "● Record"}
          </button>

          <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          <button onClick={() => bgFileRef.current?.click()}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgImage
              ? "bg-green-900/20 border-green-700/40 text-green-300"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-green-700/30"}`}>
            🖼 {bgImage ? "BG: Image" : "Upload Image"}
          </button>

          <input ref={bgVidRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          <button onClick={() => bgVidRef.current?.click()}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgVideo
              ? "bg-blue-900/20 border-blue-700/40 text-blue-300"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-blue-700/30"}`}>
            🎬 {bgVideo ? "BG: Video" : "Upload Video"}
          </button>

          {(bgImage || bgVideo) && (
            <>
              <select value={bgObjectFit} onChange={e => setBgObjectFit(e.target.value as any)}
                className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none">
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
              <button onClick={clearBg}
                className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-red-400 hover:border-red-700/40 transition-colors">
                ✕ Clear BG
              </button>
            </>
          )}

          <button onClick={() => setShowRecordings(v => !v)}
            className="ml-auto px-3 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            📁 Recordings ({recordings.length})
          </button>
          <button onClick={() => setShowOverlays(v => !v)}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${showOverlays
              ? "bg-purple-900/20 border-purple-700/40 text-purple-300"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-purple-700/30"}`}>
            🎭 Overlays
          </button>
        </div>

        {/* Recordings Panel */}
        {showRecordings && (
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#06060c] max-h-36 overflow-y-auto flex-shrink-0">
            {recordings.length === 0 ? (
              <p className="text-xs text-zinc-600 p-3 text-center">No recordings yet</p>
            ) : (
              recordings.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/30 hover:bg-zinc-800/20">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate">{rec.name}</div>
                    <div className="text-[9px] text-zinc-600">{(rec.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <a href={rec.url} download={rec.name}
                    className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-400 hover:text-white flex-shrink-0">
                    ↓ Download
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Overlays Panel ────────────────────────────────────────────────
             FIXED: syntax error removed, category filter works,
             overlay selection toggles activeOverlayId
        ──────────────────────────────────────────────────────────────────── */}
        {showOverlays && (
          <div className="mt-2 rounded border border-purple-900/40 bg-[#06060c]/95 p-3 max-h-64 overflow-y-auto flex-shrink-0">
            {/* Category pills */}
            <div className="flex gap-1 flex-wrap mb-3">
              {OVERLAY_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveOverlayCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[9px] border transition-all ${
                    activeOverlayCategory === cat
                      ? "bg-purple-900/40 border-purple-700/40 text-purple-300"
                      : "border-zinc-700/30 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Overlay grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {OVERLAY_DEFS
                .filter(o => activeOverlayCategory === "All" || o.category === activeOverlayCategory)
                .map(o => (
                  <button
                    key={o.id}
                    onClick={() => setActiveOverlayId(prev => prev === o.id ? null : o.id)}
                    className={`px-2 py-2 rounded text-xs border transition-all ${
                      activeOverlayId === o.id
                        ? "bg-purple-900/40 border-purple-700/40 text-purple-200"
                        : "border-zinc-800/40 text-zinc-400 hover:border-zinc-600/60 hover:text-zinc-200"
                    }`}
                  >
                    {o.emoji} {o.label}
                  </button>
                ))
              }
            </div>
            {activeOverlayId && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => setActiveOverlayId(null)}
                  className="px-3 py-1 rounded bg-red-900/20 border border-red-800/40 text-xs text-red-400 hover:bg-red-900/40 transition-colors"
                >
                  ✕ Remove Overlay
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Layer Editor ──────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="p-3">
          <button
            onClick={() => setShowEditPanel(v => !v)}
            className={`w-full mb-3 py-1.5 rounded text-xs font-bold border transition-all ${showEditPanel
              ? "bg-red-900/30 border-red-700/40 text-red-300"
              : "bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-red-700/30 hover:text-zinc-200"}`}>
            {showEditPanel ? "✎ Editing Mode ON" : "✎ Edit Layer"}
          </button>

          {showEditPanel && sl && (
            <div className="space-y-3 pb-3 border-b border-zinc-800/40">
              <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold" style={{ fontFamily: "Cinzel" }}>
                Edit Override
              </h2>

              {/* Text content */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text</label>
                <input type="text" value={sl.text}
                  onChange={e => updateLayer(sl.id, { text: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40" />
              </div>

              {/* Animation */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Animation</label>
                <select value={sl.animation} onChange={e => updateLayer(sl.id, { animation: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40">
                  <option value="none">None</option>
                  {ALL_ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Font */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Font ({FONT_OPTIONS.length} fonts)</label>
                <select value={sl.fontFamily} onChange={e => updateLayer(sl.id, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40">
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Font Size: <span className="text-zinc-300">{sl.fontSize}px</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={8} max={600} value={sl.fontSize}
                    onChange={e => updateLayer(sl.id, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-red-600"
                  />
                  <input
                    type="number" min={8} max={600} value={sl.fontSize}
                    onChange={e => {
                      const v = Math.max(8, Math.min(600, Number(e.target.value) || 8));
                      updateLayer(sl.id, { fontSize: v });
                    }}
                    className="w-14 px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Bold / Italic / Underline */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Style</label>
                <div className="flex gap-1.5">
                  {([
                    { key: "bold",      label: "B",  cls: "font-bold" },
                    { key: "italic",    label: "I",  cls: "italic" },
                    { key: "underline", label: "U",  cls: "underline" },
                  ] as const).map(({ key, label, cls }) => (
                    <button
                      key={key}
                      onClick={() => updateLayer(sl.id, { [key]: !sl[key] })}
                      className={`flex-1 py-1 rounded text-xs border transition-all ${cls} ${
                        sl[key]
                          ? "bg-red-900/40 border-red-700/50 text-red-200"
                          : "bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-zinc-500"
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Text Align */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Align</label>
                <div className="flex gap-1.5">
                  {(["left","center","right"] as CanvasTextAlign[]).map(a => (
                    <button key={a}
                      onClick={() => updateLayer(sl.id, { align: a })}
                      className={`flex-1 py-1 rounded text-xs border transition-all ${
                        sl.align === a
                          ? "bg-red-900/40 border-red-700/50 text-red-200"
                          : "bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-zinc-500"
                      }`}>{a === "left" ? "☰" : a === "center" ? "≡" : "☷"}</button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={sl.color} onChange={e => updateLayer(sl.id, { color: e.target.value })}
                    className="w-8 h-7 rounded cursor-pointer bg-transparent border-0 p-0" />
                  <span className="text-[10px] font-mono text-zinc-400">{sl.color}</span>
                </div>
              </div>

              {/* Stroke */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Stroke Width: <span className="text-zinc-300">{sl.strokeWidth}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={20} value={sl.strokeWidth}
                    onChange={e => updateLayer(sl.id, { strokeWidth: Number(e.target.value) })}
                    className="flex-1 accent-red-600" />
                  <input type="color" value={sl.strokeColor} onChange={e => updateLayer(sl.id, { strokeColor: e.target.value })}
                    className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Opacity: <span className="text-zinc-300">{Math.round(sl.opacity * 100)}%</span>
                </label>
                <input type="range" min={0} max={100} value={Math.round(sl.opacity * 100)}
                  onChange={e => updateLayer(sl.id, { opacity: Number(e.target.value) / 100 })}
                  className="w-full accent-red-600" />
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Letter Spacing: <span className="text-zinc-300">{sl.letterSpacing}px</span>
                </label>
                <input type="range" min={-10} max={80} value={sl.letterSpacing}
                  onChange={e => updateLayer(sl.id, { letterSpacing: Number(e.target.value) })}
                  className="w-full accent-red-600" />
              </div>

              {/* Position Y */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Position Y: <span className="text-zinc-300">{Math.round(sl.y * 100)}%</span>
                </label>
                <input type="range" min={0} max={100} value={Math.round(sl.y * 100)}
                  onChange={e => updateLayer(sl.id, { y: Number(e.target.value) / 100 })}
                  className="w-full accent-red-600" />
              </div>

              {/* Rotation */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Rotation: <span className="text-zinc-300">{Math.round(sl.rotation * 180 / Math.PI)}°</span>
                </label>
                <input type="range" min={-180} max={180} value={Math.round(sl.rotation * 180 / Math.PI)}
                  onChange={e => updateLayer(sl.id, { rotation: Number(e.target.value) * Math.PI / 180 })}
                  className="w-full accent-red-600" />
              </div>

              {/* Shadow */}
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider">Shadow</label>
                <button onClick={() => updateLayer(sl.id, { shadowEnabled: !sl.shadowEnabled })}
                  className={`px-3 py-0.5 rounded text-xs border font-bold transition-colors ${sl.shadowEnabled
                    ? "bg-green-900/30 border-green-700/40 text-green-300"
                    : "bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>
                  {sl.shadowEnabled ? "On" : "Off"}
                </button>
              </div>
              {sl.shadowEnabled && (
                <div className="flex items-center gap-2">
                  <input type="color" value={sl.shadowColor} onChange={e => updateLayer(sl.id, { shadowColor: e.target.value })}
                    className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                  <input type="range" min={0} max={60} value={sl.shadowBlur}
                    onChange={e => updateLayer(sl.id, { shadowBlur: Number(e.target.value) })}
                    className="flex-1 accent-red-600" />
                  <span className="text-[10px] text-zinc-500 w-6">{sl.shadowBlur}</span>
                </div>
              )}

              {/* Glow */}
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider">Glow</label>
                <button onClick={() => updateLayer(sl.id, { glowEnabled: !sl.glowEnabled })}
                  className={`px-3 py-0.5 rounded text-xs border font-bold transition-colors ${sl.glowEnabled
                    ? "bg-green-900/30 border-green-700/40 text-green-300"
                    : "bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}>
                  {sl.glowEnabled ? "On" : "Off"}
                </button>
              </div>
              {sl.glowEnabled && (
                <div className="flex items-center gap-2">
                  <input type="color" value={sl.glowColor} onChange={e => updateLayer(sl.id, { glowColor: e.target.value })}
                    className="w-7 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                  <span className="text-[9px] text-zinc-500">{sl.glowColor}</span>
                </div>
              )}

              {/* Reset layer */}
              <button
                onClick={() => {
                  const fresh = makeLayer({ id: sl.id, text: sl.text, x: sl.x, y: sl.y });
                  setLayers(prev => prev.map(l => l.id === sl.id ? fresh : l));
                }}
                className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                ↺ Reset Layer
              </button>
            </div>
          )}

          {!sl && showEditPanel && (
            <p className="text-[10px] text-zinc-600 text-center py-4">Select a layer to edit it</p>
          )}

          {/* Template Info */}
          <div className="mt-3">
            <h2 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Template Info</h2>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-zinc-600">Name</span><div className="text-zinc-200 font-medium mt-0.5">{selectedTemplate.name}</div></div>
              <div><span className="text-zinc-600">Category</span><div className="text-zinc-300 mt-0.5">{selectedTemplate.category}</div></div>
              <div>
                <span className="text-zinc-600">Colors</span>
                <div className="flex gap-1 mt-1">
                  {selectedTemplate.colors.map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded border border-zinc-700/30" style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div><span className="text-zinc-600">Canvas</span><div className="text-zinc-300 font-mono text-[10px] mt-0.5">{canvasPreset.w}×{canvasPreset.h}</div></div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/40">
            <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5">OBS Usage</h3>
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Export PNG for static overlays. Record → Download .webm → Add as OBS Media Source for animated overlays.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

