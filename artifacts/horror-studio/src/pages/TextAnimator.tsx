import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates, useCreateTemplate, useDeleteTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";

// ─── Canvas Sizes ───────────────────────────────────────────────────────────
const CANVAS_PRESETS = [
  { label: "[Standard] 1920×1080 — Full HD",     w: 1920, h: 1080, group: "Standard" },
  { label: "[2K] 2560×1440 — 2K QHD",            w: 2560, h: 1440, group: "Standard" },
  { label: "[4K] 3840×2160 — 4K UHD",            w: 3840, h: 2160, group: "Standard" },
  { label: "[HD] 1280×720 — HD 720p",             w: 1280, h: 720,  group: "Standard" },
  { label: "[Twitch] 1920×1080",                  w: 1920, h: 1080, group: "Streaming" },
  { label: "[OBS] 1920×1080 — OBS Canvas",        w: 1920, h: 1080, group: "Streaming" },
  { label: "[OBS 4K] 3840×2160 — OBS 4K Canvas", w: 3840, h: 2160, group: "Streaming" },
  { label: "[TikTok] 1080×1920 — TikTok Vertical",w: 1080, h: 1920, group: "Social" },
  { label: "[TikTok] 1920×1080 — TikTok Landscape",w: 1920, h: 1080, group: "Social" },
  { label: "[4:3] 1440×1080 — 4:3 Legacy",        w: 1440, h: 1080, group: "Legacy" },
  { label: "[Ultra] 2560×1080 — Ultrawide",        w: 2560, h: 1080, group: "Standard" },
  { label: "[Ultra] 3440×1440 — UW QHD",           w: 3440, h: 1440, group: "Standard" },
  { label: "[Square] 1080×1080 — Square",          w: 1080, h: 1080, group: "Social" },
  { label: "[Vertical] 1080×1920 — Vertical 9:16", w: 1080, h: 1920, group: "Social" },
  { label: "[Shorts] 1080×1920 — YouTube Shorts",  w: 1080, h: 1920, group: "Social" },
  { label: "[Reel] 1080×1920 — Instagram Reel",    w: 1080, h: 1920, group: "Social" },
];

const ANIMATION_CLASSES: Record<string, string> = {
  "glitch": "anim-glitch",
  "blood-drip": "anim-blood-drip",
  "neon-pulse": "anim-neon-pulse",
  "zoom-pulse": "anim-zoom-pulse",
  "fire-glow": "anim-fire-glow",
  "flicker": "anim-flicker",
  "shake": "anim-shake",
  "cinematic-fade": "anim-cinematic-fade",
  "bounce": "anim-bounce",
  "spin-reveal": "anim-spin-reveal",
  "slide-left": "anim-slide-left",
  "float": "anim-float",
  "fade": "anim-fade",
};

const ALL_ANIMATIONS = Object.keys(ANIMATION_CLASSES);

const FONT_OPTIONS = [
  "Creepster", "Cinzel", "Orbitron", "Rajdhani", "Bebas Neue",
  "UnifrakturMaguntia", "Exo 2", "Impact", "Arial Black",
];

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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TextAnimator() {
  // Text & Template
  const [text, setText] = useState("STARTING SOON");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Canvas size
  const [canvasPreset, setCanvasPreset] = useState(CANVAS_PRESETS[0]);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  // Background image
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgObjectFit, setBgObjectFit] = useState<"cover" | "contain" | "fill">("cover");
  const bgFileRef = useRef<HTMLInputElement>(null);

  // Template editing (overrides)
  const [editFont, setEditFont] = useState<string>("");
  const [editColor, setEditColor] = useState<string>("");
  const [editAnimation, setEditAnimation] = useState<string>("");
  const [editFontSize, setEditFontSize] = useState<number>(0); // 0 = auto
  const [editGlow, setEditGlow] = useState<boolean | null>(null);
  const [editShadow, setEditShadow] = useState<boolean | null>(null);
  const [editTextY, setEditTextY] = useState<number>(50); // % from top, default center
  const [showEditPanel, setShowEditPanel] = useState(false);

  // Recording
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [showRecordings, setShowRecordings] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

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
    const catMatch = activeCategory === "All" || t.category === activeCategory;
    const searchMatch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Effective values (edit overrides template)
  const effFont      = editFont      || selectedTemplate.font;
  const effColor     = editColor     || selectedTemplate.colors[0];
  const effAnimation = editAnimation || selectedTemplate.animation;
  const effGlow      = editGlow      !== null ? editGlow      : selectedTemplate.glow;
  const effShadow    = editShadow    !== null ? editShadow    : selectedTemplate.shadowEffect;

  // Reset edit overrides when template changes
  const selectTemplate = (tpl: TemplateData) => {
    setSelectedTemplate(tpl);
    setEditFont(""); setEditColor(""); setEditAnimation("");
    setEditFontSize(0); setEditGlow(null); setEditShadow(null); setEditTextY(50);
  };

  // ─── Background Image Upload ─────────────────────────────────────────────
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ─── Canvas Render Loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution to selected preset
    canvas.width  = canvasPreset.w;
    canvas.height = canvasPreset.h;

    let frameCount = 0;
    let running = true;

    const render = () => {
      if (!running) return;
      frameCount++;

      const W = canvasPreset.w;
      const H = canvasPreset.h;
      const t = frameCount / 60;
      const primaryColor   = effColor;
      const secondaryColor = selectedTemplate.colors[1] ?? primaryColor;
      const anim           = effAnimation;

      // ── Background ──────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);

      if (bgImage) {
        ctx.save();
        const iw = bgImage.naturalWidth, ih = bgImage.naturalHeight;
        let dx = 0, dy = 0, dw = W, dh = H;
        if (bgObjectFit === "contain") {
          const scale = Math.min(W / iw, H / ih);
          dw = iw * scale; dh = ih * scale;
          dx = (W - dw) / 2; dy = (H - dh) / 2;
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        } else if (bgObjectFit === "cover") {
          const scale = Math.max(W / iw, H / ih);
          dw = iw * scale; dh = ih * scale;
          dx = (W - dw) / 2; dy = (H - dh) / 2;
        }
        ctx.drawImage(bgImage, dx, dy, dw, dh);
        ctx.restore();
      } else if (selectedTemplate.backgroundStyle === "dark-gradient") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#0a0808"); grad.addColorStop(1, "#150a1a");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, W, H);
      }

      // ── Text settings ────────────────────────────────────────────────────
      const autoSize  = Math.min(W * 0.08, H * 0.3);
      const fontSize  = editFontSize > 0 ? editFontSize * (W / 1920) : autoSize;
      const displayText = text || "HORROR STUDIO";
      const textYFrac = editTextY / 100;

      ctx.save();
      ctx.font = `bold ${fontSize}px '${effFont}', Impact, sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      let x = W / 2;
      let y = H * textYFrac;
      let alpha = 1;
      let scale = 1;

      // ── Per-animation logic ─────────────────────────────────────────────
      if (anim === "zoom-pulse") {
        scale = 1 + Math.sin(t * 3) * 0.12;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 20 + Math.sin(t * 3) * 15;

      } else if (anim === "neon-pulse") {
        const intensity = (Math.sin(t * 4) + 1) / 2;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 10 + intensity * 60;
        ctx.fillStyle = primaryColor; ctx.globalAlpha = 0.7 + intensity * 0.3;
        ctx.fillText(displayText, x, y);
        ctx.shadowBlur = 40 + intensity * 40; ctx.globalAlpha = intensity * 0.6;
        ctx.fillText(displayText, x, y);
        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render); return;

      } else if (anim === "fire-glow") {
        ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 20 + Math.sin(t * 2) * 20;
        ctx.fillStyle = primaryColor; ctx.fillText(displayText, x, y);
        ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 5 + Math.sin(t * 5) * 5;
        ctx.fillStyle = "#ffcc00"; ctx.globalAlpha = 0.4 + Math.random() * 0.2;
        ctx.fillText(displayText, x, y + Math.sin(t * 8) * 3);
        if (!bgImage) {
          const fireGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
          fireGrad.addColorStop(0, "transparent"); fireGrad.addColorStop(1, "rgba(255,80,0,0.5)");
          ctx.fillStyle = fireGrad; ctx.globalAlpha = 1; ctx.fillRect(0, H * 0.7, W, H * 0.3);
        }
        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render); return;

      } else if (anim === "flicker") {
        const flick = Math.random();
        alpha = flick > 0.1 ? (flick > 0.05 ? 1 : 0.15) : 0;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 15;

      } else if (anim === "shake") {
        x += (Math.random() - 0.5) * 12; y += (Math.random() - 0.5) * 6;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 8;

      } else if (anim === "glitch") {
        ctx.fillStyle = primaryColor; ctx.shadowColor = primaryColor; ctx.shadowBlur = 10;
        ctx.fillText(displayText, x, y);
        if (Math.random() > 0.6) {
          const sliceY = (Math.random() * H * 0.6) + H * 0.2;
          const sliceH2 = 4 + Math.random() * 20;
          const offsetX = (Math.random() - 0.5) * 60;
          try { const slice = ctx.getImageData(0, sliceY, W, sliceH2); ctx.putImageData(slice, offsetX, sliceY); } catch {}
        }
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = Math.random() > 0.5 ? "#ff0066" : "#00ffff";
        ctx.fillText(displayText, x + (Math.random() - 0.5) * 8, y);
        ctx.fillStyle = Math.random() > 0.5 ? "#00ffff" : "#ff0066";
        ctx.fillText(displayText, x - (Math.random() - 0.5) * 8, y + 2);
        ctx.restore(); animFrameRef.current = requestAnimationFrame(render); return;

      } else if (anim === "blood-drip") {
        ctx.shadowColor = "#cc0000"; ctx.shadowBlur = 20;
        ctx.fillStyle = primaryColor; ctx.fillText(displayText, x, y);
        for (let i = 0; i < 5; i++) {
          const dropX = x - fontSize * 1.5 + i * (fontSize * 3 / 4);
          const dropOffset = ((t * 80 + i * 37) % (H * 0.55));
          ctx.fillStyle = `rgba(180,0,0,${0.6 + Math.sin(t + i) * 0.3})`;
          ctx.beginPath();
          ctx.ellipse(dropX, y + fontSize * 0.6 + dropOffset, 3, 10 + Math.sin(t + i) * 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore(); animFrameRef.current = requestAnimationFrame(render); return;

      } else if (anim === "float") {
        y = H * textYFrac + Math.sin(t * 1.5) * (H * 0.04);
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 15 + Math.sin(t * 2) * 10;

      } else if (anim === "bounce") {
        const bounceAmt = Math.abs(Math.sin(t * 3)) * (H * 0.08);
        y = H * textYFrac - bounceAmt;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 10 + bounceAmt * 0.3;

      } else if (anim === "cinematic-fade") {
        const cycle = (t % 4) / 4;
        alpha = cycle < 0.25 ? cycle * 4 : cycle < 0.75 ? 1 : (1 - cycle) * 4;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 20;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, H * 0.1, W, H * 0.08); ctx.fillRect(0, H * 0.82, W, H * 0.08);

      } else if (anim === "slide-left") {
        const cycle = (t * 0.5) % 2;
        x = cycle < 1 ? W + (W / 2) * (1 - cycle * 2) : W / 2;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 15;

      } else if (anim === "spin-reveal") {
        const cycle = (t * 0.5) % Math.PI;
        scale = Math.abs(Math.cos(cycle)); alpha = 0.3 + scale * 0.7;
        ctx.shadowColor = primaryColor; ctx.shadowBlur = 20;
      }

      // ── Glow / Shadow override ────────────────────────────────────────────
      if (effShadow && anim !== "glitch") {
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 12; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
      } else if (effGlow) {
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 25 + Math.sin(t * 2) * 10;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle   = primaryColor;

      if (scale !== 1) {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillText(displayText, 0, 0);
        if (selectedTemplate.colors.length > 1) {
          ctx.strokeStyle = secondaryColor; ctx.lineWidth = Math.max(1, fontSize * 0.03);
          ctx.shadowBlur = 0; ctx.strokeText(displayText, 0, 0);
        }
        ctx.restore();
      } else {
        ctx.fillText(displayText, x, y);
        if (selectedTemplate.colors.length > 1) {
          ctx.strokeStyle = secondaryColor; ctx.lineWidth = Math.max(1, fontSize * 0.03);
          ctx.shadowBlur = 0; ctx.strokeText(displayText, x, y);
        }
      }
      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [text, selectedTemplate, canvasPreset, bgImage, bgObjectFit,
      effFont, effColor, effAnimation, effGlow, effShadow, editFontSize, editTextY]);

  // ─── Export PNG ──────────────────────────────────────────────────────────
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `horror-overlay-${canvasPreset.w}x${canvasPreset.h}.png`;
    a.click();
  };

  // ─── Recording (client-side, saves to browser download) ─────────────────
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chunksRef.current = [];

    const stream = canvas.captureStream(30);
    const mimeType =
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" :
      MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" :
      "video/webm";

    const mr = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob  = new Blob(chunksRef.current, { type: mimeType });
      const url   = URL.createObjectURL(blob);
      const name  = `rec-${Date.now()}.webm`;
      setRecordings(prev => [{ name, url, size: blob.size }, ...prev]);
      // Auto-download
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
    };
    mr.start(250);
    mediaRecorderRef.current = mr;
    setRecording(true); setRecordingTime(0);

    let elapsed = 0;
    recordingTimerRef.current = setInterval(() => {
      elapsed++;
      setRecordingTime(elapsed);
      if (elapsed >= 5 * 60) stopRecording();
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    mediaRecorderRef.current?.requestData?.();
    setTimeout(() => mediaRecorderRef.current?.stop(), 150);
    setRecording(false);
  };

  const handleSurpriseMe = () => {
    selectTemplate(allTemplates[Math.floor(Math.random() * allTemplates.length)]);
  };

  const categories = ["All", ...TEMPLATE_CATEGORIES];

  // Canvas display aspect ratio for preview box
  const previewAspect = canvasPreset.w / canvasPreset.h;

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">

        {/* Text Input */}
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>
            Text Input
          </h2>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            className="w-full px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40 resize-none"
            placeholder="Enter your text..."
          />
          <button
            onClick={handleSurpriseMe}
            className="w-full mt-2 py-1.5 rounded bg-purple-900/20 border border-purple-700/30 text-purple-300 text-xs font-bold hover:bg-purple-900/40 transition-colors"
          >
            Surprise Me
          </button>
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
                text={text}
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
            <span className="text-zinc-700">·</span>
            <span className="text-purple-400 font-mono text-[10px]">{effAnimation}</span>
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

        {/* Canvas Preview — maintains aspect ratio */}
        <div
          className="relative rounded border border-purple-900/30 overflow-hidden bg-[#05050a] flex-shrink-0"
          style={{
            aspectRatio: `${canvasPreset.w} / ${canvasPreset.h}`,
            maxHeight: "calc(100vh - 280px)",
            width: "100%",
            boxShadow: "0 0 30px rgba(100,0,200,0.15)",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          {recording && (
            <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/50 border border-red-700/60">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-300 font-mono font-bold">REC {formatTime(recordingTime)}</span>
            </div>
          )}
          {/* Canvas size badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 border border-zinc-700/30 text-[9px] text-zinc-500 font-mono">
            {canvasPreset.w}×{canvasPreset.h}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <button
            onClick={handleExportPng}
            className="px-3 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-purple-700/30 transition-colors"
          >
            📷 Export PNG
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-1.5 rounded text-xs font-bold border transition-all ${recording
              ? "bg-red-600/30 border-red-500/50 text-red-300 animate-pulse"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"}`}
          >
            {recording ? `◼ Stop  ${formatTime(recordingTime)}` : "● Record"}
          </button>

          {/* Background Upload */}
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          <button
            onClick={() => bgFileRef.current?.click()}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${bgImage
              ? "bg-green-900/20 border-green-700/40 text-green-300 hover:border-green-500/60"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-green-700/30"}`}
          >
            🖼 {bgImage ? "BG: Loaded" : "Upload BG"}
          </button>
          {bgImage && (
            <>
              <select
                value={bgObjectFit}
                onChange={e => setBgObjectFit(e.target.value as any)}
                className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
              <button
                onClick={() => { setBgImage(null); if (bgFileRef.current) bgFileRef.current.value = ""; }}
                className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-red-400 hover:border-red-700/40 transition-colors"
              >✕ Clear BG</button>
            </>
          )}

          <button
            onClick={() => { setShowRecordings(v => !v); }}
            className="ml-auto px-3 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            📁 Recordings ({recordings.length})
          </button>
        </div>

        {/* Recordings Panel */}
        {showRecordings && (
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#06060c] max-h-36 overflow-y-auto">
            {recordings.length === 0 ? (
              <p className="text-xs text-zinc-600 p-3 text-center">No recordings yet — press ● Record to start</p>
            ) : (
              recordings.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/30 hover:bg-zinc-800/20">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate">{rec.name}</div>
                    <div className="text-[9px] text-zinc-600">{(rec.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <a href={rec.url} download={rec.name}
                    className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-400 hover:text-white transition-colors flex-shrink-0">
                    ↓ Download
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Template Info + Edit ──────────────────────────── */}
      <aside className="w-56 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="p-3">
          {/* Edit Toggle */}
          <button
            onClick={() => setShowEditPanel(v => !v)}
            className={`w-full mb-3 py-1.5 rounded text-xs font-bold border transition-all ${showEditPanel
              ? "bg-red-900/30 border-red-700/40 text-red-300"
              : "bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-red-700/30 hover:text-zinc-200"}`}
          >
            {showEditPanel ? "✎ Editing Mode ON" : "✎ Edit Template"}
          </button>

          {/* ── Edit Panel ─────────────────────────────────────────────── */}
          {showEditPanel && (
            <div className="space-y-3 mb-4 pb-3 border-b border-zinc-800/40">
              <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold" style={{ fontFamily: "Cinzel" }}>
                Edit Override
              </h2>

              {/* Animation */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Animation</label>
                <select
                  value={editAnimation || effAnimation}
                  onChange={e => setEditAnimation(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40"
                >
                  {ALL_ANIMATIONS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Font */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Font</label>
                <select
                  value={editFont || effFont}
                  onChange={e => setEditFont(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40"
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor || effColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-8 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-[10px] font-mono text-zinc-400">{editColor || effColor}</span>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Font Size <span className="text-zinc-700">(0 = auto)</span>
                </label>
                <input
                  type="number"
                  value={editFontSize}
                  onChange={e => setEditFontSize(Number(e.target.value))}
                  min={0} max={400}
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 focus:outline-none focus:border-red-700/40"
                />
              </div>

              {/* Text Y Position */}
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Text Position (Y) — {editTextY}%
                </label>
                <input
                  type="range"
                  min={5} max={95}
                  value={editTextY}
                  onChange={e => setEditTextY(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>

              {/* Glow / Shadow toggles */}
              <div className="flex gap-3">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Glow</label>
                  <button
                    onClick={() => setEditGlow(v => v === null ? !selectedTemplate.glow : !v)}
                    className={`px-3 py-1 rounded text-xs border font-bold transition-colors ${effGlow
                      ? "bg-green-900/30 border-green-700/40 text-green-300"
                      : "bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}
                  >{effGlow ? "On" : "Off"}</button>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">Shadow</label>
                  <button
                    onClick={() => setEditShadow(v => v === null ? !selectedTemplate.shadowEffect : !v)}
                    className={`px-3 py-1 rounded text-xs border font-bold transition-colors ${effShadow
                      ? "bg-green-900/30 border-green-700/40 text-green-300"
                      : "bg-zinc-800/40 border-zinc-700/30 text-zinc-500"}`}
                  >{effShadow ? "On" : "Off"}</button>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setEditFont(""); setEditColor(""); setEditAnimation(""); setEditFontSize(0); setEditGlow(null); setEditShadow(null); setEditTextY(50); }}
                className="w-full py-1 rounded bg-zinc-800/40 border border-zinc-700/30 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ↺ Reset to Template Defaults
              </button>
            </div>
          )}

          {/* ── Template Info ───────────────────────────────────────────── */}
          <h2 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-3" style={{ fontFamily: "Cinzel" }}>
            Template Info
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="text-zinc-600">Name</span><div className="text-zinc-200 font-medium mt-0.5">{selectedTemplate.name}</div></div>
            <div><span className="text-zinc-600">Animation</span><div className="text-purple-300 font-mono mt-0.5">{effAnimation}</div></div>
            <div><span className="text-zinc-600">Font</span><div className="text-zinc-300 mt-0.5">{effFont}</div></div>
            <div><span className="text-zinc-600">Category</span><div className="text-zinc-300 mt-0.5">{selectedTemplate.category}</div></div>
            <div>
              <span className="text-zinc-600">Colors</span>
              <div className="flex gap-1 mt-1">
                <div className="w-5 h-5 rounded border border-zinc-700/30" style={{ background: effColor, boxShadow: `0 0 4px ${effColor}88` }} />
                {selectedTemplate.colors.slice(1).map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded" style={{ background: c, boxShadow: `0 0 4px ${c}88` }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div><span className="text-zinc-600">Glow</span><div className={effGlow ? "text-green-400" : "text-zinc-500"}>{effGlow ? "On" : "Off"}</div></div>
              <div><span className="text-zinc-600">Shadow</span><div className={effShadow ? "text-green-400" : "text-zinc-500"}>{effShadow ? "On" : "Off"}</div></div>
            </div>
            <div>
              <span className="text-zinc-600">Canvas</span>
              <div className="text-zinc-300 font-mono text-[10px] mt-0.5">{canvasPreset.w}×{canvasPreset.h}</div>
            </div>
          </div>

          {/* OBS Tips */}
          <div className="mt-4 pt-3 border-t border-zinc-800/40">
            <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">OBS Usage</h3>
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Export PNG for static overlay. Record → Download .webm → add as OBS Media Source for animated overlay.
            </p>
          </div>

          {/* Animation Tips */}
          <div className="mt-3 pt-3 border-t border-zinc-800/40">
            <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Animation Tips</h3>
            <div className="space-y-1">
              {["glitch", "flicker", "blood-drip"].includes(effAnimation) && (
                <p className="text-[9px] text-red-400/70">Horror effect active — rapid distortion</p>
              )}
              {["neon-pulse", "fire-glow"].includes(effAnimation) && (
                <p className="text-[9px] text-orange-400/70">Glow pulsing in real-time</p>
              )}
              {["zoom-pulse", "bounce", "float"].includes(effAnimation) && (
                <p className="text-[9px] text-purple-400/70">Motion animation active</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

