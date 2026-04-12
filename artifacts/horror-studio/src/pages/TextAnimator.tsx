import { useState, useRef, useEffect, useCallback } from "react";
import { useListTemplates, useCreateTemplate, useDeleteTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const MAX_RECORDING_SECS = 5 * 60;

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
  template: TemplateData;
  selected: boolean;
  onClick: () => void;
  text: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded border cursor-pointer transition-all overflow-hidden ${selected
        ? "border-red-600/60 ring-1 ring-red-500/30"
        : "border-zinc-800/40 hover:border-zinc-600/40"
        }`}
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

export default function TextAnimator() {
  const [text, setText] = useState("STARTING SOON");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastRecordingName, setLastRecordingName] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [savedRecordings, setSavedRecordings] = useState<Array<{ filename: string; size: number; createdAt: string; url: string }>>([]);
  const [showRecordings, setShowRecordings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const qc = useQueryClient();

  const { data: dbTemplates = [] } = useListTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const allTemplates: TemplateData[] = [
    ...PRESET_TEMPLATES,
    ...dbTemplates.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      font: t.font,
      animation: t.animation,
      colors: t.colors as string[],
      glow: t.glow,
      shadowEffect: t.shadowEffect,
      backgroundStyle: t.backgroundStyle,
      motionBehavior: t.motionBehavior,
      isPreset: t.isPreset,
    })),
  ];

  const filtered = allTemplates.filter(t => {
    const catMatch = activeCategory === "All" || t.category === activeCategory;
    const searchMatch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  const fetchRecordings = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/recordings`);
      if (r.ok) setSavedRecordings(await r.json());
    } catch {}
  }, []);

  useEffect(() => { fetchRecordings(); }, [fetchRecordings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    let running = true;

    const render = () => {
      if (!running) return;
      frameCount++;

      const W = canvas.offsetWidth || 1280;
      const H = canvas.offsetHeight || 360;

      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      const t = frameCount / 60;
      const primaryColor = selectedTemplate.colors[0];
      const secondaryColor = selectedTemplate.colors[1] ?? primaryColor;
      const anim = selectedTemplate.animation;

      if (selectedTemplate.backgroundStyle === "dark-gradient") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#0a0808");
        grad.addColorStop(1, "#150a1a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.clearRect(0, 0, W, H);
      }

      const fontSize = Math.min(W * 0.08, H * 0.3);
      const displayText = text || "HORROR STUDIO";

      ctx.save();

      let x = W / 2;
      let y = H / 2;
      let alpha = 1;
      let scale = 1;
      ctx.font = `bold ${fontSize}px '${selectedTemplate.font}', Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (anim === "zoom-pulse") {
        scale = 1 + Math.sin(t * 3) * 0.12;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20 + Math.sin(t * 3) * 15;

      } else if (anim === "neon-pulse") {
        const intensity = (Math.sin(t * 4) + 1) / 2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10 + intensity * 60;
        const flicker = 0.7 + intensity * 0.3;
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = flicker;
        ctx.fillText(displayText, x, y);
        ctx.shadowBlur = 40 + intensity * 40;
        ctx.globalAlpha = intensity * 0.6;
        ctx.fillText(displayText, x, y);
        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render);
        return;

      } else if (anim === "fire-glow") {
        ctx.shadowColor = "#ff6600";
        ctx.shadowBlur = 20 + Math.sin(t * 2) * 20;
        ctx.fillStyle = primaryColor;
        ctx.fillText(displayText, x, y);
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 5 + Math.sin(t * 5) * 5;
        ctx.fillStyle = "#ffcc00";
        ctx.globalAlpha = 0.4 + Math.random() * 0.2;
        ctx.fillText(displayText, x, y + Math.sin(t * 8) * 3);
        const fireGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
        fireGrad.addColorStop(0, "transparent");
        fireGrad.addColorStop(1, "rgba(255,80,0,0.5)");
        ctx.fillStyle = fireGrad;
        ctx.globalAlpha = 1;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);
        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render);
        return;

      } else if (anim === "flicker") {
        const flick = Math.random();
        alpha = flick > 0.1 ? (flick > 0.05 ? 1 : 0.15) : 0;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 15;

      } else if (anim === "shake") {
        x += (Math.random() - 0.5) * 12;
        y += (Math.random() - 0.5) * 6;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 8;

      } else if (anim === "glitch") {
        ctx.fillStyle = primaryColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        ctx.fillText(displayText, x, y);

        if (Math.random() > 0.6) {
          const sliceY = (Math.random() * H * 0.6) + H * 0.2;
          const sliceH2 = 4 + Math.random() * 20;
          const offsetX = (Math.random() - 0.5) * 60;
          try {
            const slice = ctx.getImageData(0, sliceY, W, sliceH2);
            ctx.putImageData(slice, offsetX, sliceY);
          } catch {}
        }

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = Math.random() > 0.5 ? "#ff0066" : "#00ffff";
        ctx.fillText(displayText, x + (Math.random() - 0.5) * 8, y);
        ctx.fillStyle = Math.random() > 0.5 ? "#00ffff" : "#ff0066";
        ctx.fillText(displayText, x - (Math.random() - 0.5) * 8, y + 2);

        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render);
        return;

      } else if (anim === "blood-drip") {
        y = H * 0.35;
        ctx.shadowColor = "#cc0000";
        ctx.shadowBlur = 20;
        ctx.fillStyle = primaryColor;
        ctx.fillText(displayText, x, y);

        const dropCount = 5;
        for (let i = 0; i < dropCount; i++) {
          const dropX = x - fontSize * 1.5 + i * (fontSize * 3 / (dropCount - 1));
          const dropOffset = ((t * 80 + i * 37) % (H * 0.65));
          const dropH = 10 + Math.sin(t + i) * 5;
          ctx.fillStyle = `rgba(180,0,0,${0.6 + Math.sin(t + i) * 0.3})`;
          ctx.beginPath();
          ctx.ellipse(dropX, H * 0.38 + dropOffset, 3, dropH, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        animFrameRef.current = requestAnimationFrame(render);
        return;

      } else if (anim === "float") {
        y = H / 2 + Math.sin(t * 1.5) * (H * 0.1);
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 15 + Math.sin(t * 2) * 10;

      } else if (anim === "bounce") {
        const bounceAmt = Math.abs(Math.sin(t * 3)) * (H * 0.12);
        y = H / 2 - bounceAmt;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10 + bounceAmt * 0.5;

      } else if (anim === "cinematic-fade") {
        const cycle = (t % 4) / 4;
        alpha = cycle < 0.25 ? cycle * 4 : cycle < 0.75 ? 1 : (1 - cycle) * 4;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20;

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, H * 0.18, W, H * 0.12);
        ctx.fillRect(0, H * 0.7, W, H * 0.12);

      } else if (anim === "slide-left") {
        const cycle = (t * 0.5) % 2;
        x = cycle < 1 ? W + (W / 2) * (1 - cycle * 2) : W / 2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 15;

      } else if (anim === "spin-reveal") {
        const cycle = (t * 0.5) % Math.PI;
        scale = Math.abs(Math.cos(cycle));
        alpha = 0.3 + scale * 0.7;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20;
      }

      if (selectedTemplate.shadowEffect) {
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      } else if (selectedTemplate.glow) {
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 25 + Math.sin(t * 2) * 10;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = primaryColor;

      if (scale !== 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillText(displayText, 0, 0);
        if (selectedTemplate.colors.length > 1) {
          ctx.strokeStyle = secondaryColor;
          ctx.lineWidth = Math.max(1, fontSize * 0.03);
          ctx.shadowBlur = 0;
          ctx.strokeText(displayText, 0, 0);
        }
        ctx.restore();
      } else {
        ctx.fillText(displayText, x, y);
        if (selectedTemplate.colors.length > 1) {
          ctx.strokeStyle = secondaryColor;
          ctx.lineWidth = Math.max(1, fontSize * 0.03);
          ctx.shadowBlur = 0;
          ctx.strokeText(displayText, x, y);
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [text, selectedTemplate]);

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "horror-overlay.png";
    a.click();
  };

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chunksRef.current = [];
    const stream = canvas.captureStream(30);

    const mimeType =
      MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" :
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" :
          "video/webm";

    const mr = new MediaRecorder(stream, { mimeType });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("video", blob, `text-anim.${ext}`);
      try {
        const res = await fetch(`${API_BASE}/api/recordings/upload`, { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setLastRecordingName(data.filename);
          fetchRecordings();
        }
      } catch {}
    };
    mr.start(1000);
    setMediaRecorder(mr);
    setRecording(true);
    setRecordingTime(0);
    setLastRecordingName(null);

    let elapsed = 0;
    recordingTimerRef.current = setInterval(() => {
      elapsed++;
      setRecordingTime(elapsed);
      if (elapsed >= MAX_RECORDING_SECS) stopRecording();
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    mediaRecorder?.requestData?.();
    setTimeout(() => mediaRecorder?.stop(), 150);
    setRecording(false);
  };

  const handleSurpriseMe = () => {
    const random = allTemplates[Math.floor(Math.random() * allTemplates.length)];
    setSelectedTemplate(random);
  };

  const categories = ["All", ...TEMPLATE_CATEGORIES];

  return (
    <div className="h-full flex overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Text Input</h2>
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

        <div className="p-2 border-b border-red-900/20">
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all border ${activeCategory === cat
                  ? "bg-red-900/30 border-red-700/40 text-red-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 border-b border-zinc-800/30">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wider">{filtered.length} templates</div>
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                selected={selectedTemplate.id === tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                text={text}
              />
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-purple-400" style={{ fontFamily: "Cinzel" }}>TEXT OVERLAY ANIMATOR</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-600">Template:</span>
            <span className="text-zinc-300 font-medium">{selectedTemplate.name}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-purple-400 font-mono text-[10px]">{selectedTemplate.animation}</span>
          </div>
        </div>

        <div
          className="flex-1 relative rounded border border-purple-900/30 overflow-hidden bg-[#05050a]"
          style={{ boxShadow: "0 0 30px rgba(100,0,200,0.15)" }}
        >
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
          {recording && (
            <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/50 border border-red-700/60">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-300 font-mono font-bold">REC {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={handleExportPng}
            className="px-4 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 hover:border-purple-700/30 transition-colors"
          >
            Export PNG
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-1.5 rounded text-xs font-bold border transition-all ${recording
              ? "bg-red-600/30 border-red-500/50 text-red-300 animate-pulse"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-purple-700/30"
              }`}
          >
            {recording ? `◼ Stop Recording` : "● Record"}
          </button>
          {lastRecordingName && (
            <span className="text-[10px] text-green-400">✓ Saved: {lastRecordingName}</span>
          )}
          <button
            onClick={() => { setShowRecordings(v => !v); fetchRecordings(); }}
            className="ml-auto px-3 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            📁 Recordings ({savedRecordings.length})
          </button>
        </div>

        {showRecordings && (
          <div className="mt-2 rounded border border-zinc-800/40 bg-[#06060c] max-h-36 overflow-y-auto">
            {savedRecordings.length === 0 ? (
              <p className="text-xs text-zinc-600 p-3 text-center">No recordings yet</p>
            ) : (
              savedRecordings.map(rec => (
                <div key={rec.filename} className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/30 hover:bg-zinc-800/20">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate">{rec.filename}</div>
                    <div className="text-[9px] text-zinc-600">{(rec.size / 1024 / 1024).toFixed(1)} MB · {new Date(rec.createdAt).toLocaleString()}</div>
                  </div>
                  <a
                    href={`${API_BASE}${rec.url}`}
                    download={rec.filename}
                    className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    ↓ Download
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <aside className="w-52 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col p-3 overflow-y-auto">
        <h2 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-3" style={{ fontFamily: "Cinzel" }}>Template Info</h2>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-zinc-600">Name</span>
            <div className="text-zinc-200 font-medium mt-0.5">{selectedTemplate.name}</div>
          </div>
          <div>
            <span className="text-zinc-600">Animation</span>
            <div className="text-purple-300 font-mono mt-0.5">{selectedTemplate.animation}</div>
          </div>
          <div>
            <span className="text-zinc-600">Font</span>
            <div className="text-zinc-300 mt-0.5">{selectedTemplate.font}</div>
          </div>
          <div>
            <span className="text-zinc-600">Category</span>
            <div className="text-zinc-300 mt-0.5">{selectedTemplate.category}</div>
          </div>
          <div>
            <span className="text-zinc-600">Colors</span>
            <div className="flex gap-1 mt-1">
              {selectedTemplate.colors.map((c, i) => (
                <div key={i} className="w-5 h-5 rounded" style={{ background: c, boxShadow: `0 0 4px ${c}88` }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div>
              <span className="text-zinc-600">Glow</span>
              <div className={selectedTemplate.glow ? "text-green-400" : "text-zinc-500"}>{selectedTemplate.glow ? "On" : "Off"}</div>
            </div>
            <div>
              <span className="text-zinc-600">Shadow</span>
              <div className={selectedTemplate.shadowEffect ? "text-green-400" : "text-zinc-500"}>{selectedTemplate.shadowEffect ? "On" : "Off"}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/40">
          <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">OBS Usage</h3>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Export PNG for static overlay, or Record to capture an animated clip for OBS media source.
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/40">
          <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Animation Tips</h3>
          <div className="space-y-1">
            {["glitch", "flicker", "blood-drip"].includes(selectedTemplate.animation) && (
              <p className="text-[9px] text-red-400/70">Horror effect active — rapid distortion applied</p>
            )}
            {["neon-pulse", "fire-glow"].includes(selectedTemplate.animation) && (
              <p className="text-[9px] text-orange-400/70">Glow pulsing in real-time</p>
            )}
            {["zoom-pulse", "bounce", "float"].includes(selectedTemplate.animation) && (
              <p className="text-[9px] text-purple-400/70">Motion animation active</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
