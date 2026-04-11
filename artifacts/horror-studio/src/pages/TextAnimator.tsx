import { useState, useRef, useEffect } from "react";
import { useListTemplates, useCreateTemplate, useDeleteTemplate, useGetRandomTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PRESET_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateData } from "@/data/templates";

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
  const style: React.CSSProperties = {
    fontFamily: `'${template.font}', sans-serif`,
    color: template.colors[0],
    textShadow: template.glow
      ? `0 0 10px ${template.colors[0]}, 0 0 20px ${template.colors[0]}88`
      : template.shadowEffect
      ? "2px 2px 8px rgba(0,0,0,0.8)"
      : "none",
    background: template.backgroundStyle === "dark-gradient"
      ? "linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)"
      : "transparent",
  };

  return (
    <div className="h-full flex items-center justify-center overflow-hidden" style={style.background ? { background: style.background as string } : {}}>
      <span
        key={key}
        className={`${animClass} text-sm font-bold block text-center px-2 leading-tight`}
        style={{ ...style, background: undefined }}
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

export default function TextAnimator() {
  const [text, setText] = useState("STARTING SOON");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData>(PRESET_TEMPLATES[0]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const animTimeRef = useRef(0);
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

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    const render = () => {
      frameCount++;
      animTimeRef.current = frameCount;

      canvas.width = 1280;
      canvas.height = 360;

      if (selectedTemplate.backgroundStyle === "dark-gradient") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#0a0808");
        grad.addColorStop(1, "#150a1a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const primaryColor = selectedTemplate.colors[0];
      const t = frameCount / 60;

      ctx.save();
      ctx.font = `bold 72px '${selectedTemplate.font}', Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Apply animation
      const anim = selectedTemplate.animation;
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      let alpha = 1;
      let scaleX = 1;
      let scaleY = 1;

      if (anim === "zoom-pulse") {
        const s = 1 + Math.sin(t * 2) * 0.05;
        scaleX = scaleY = s;
      } else if (anim === "neon-pulse" || anim === "fire-glow") {
        const intensity = (Math.sin(t * 3) + 1) / 2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20 + intensity * 30;
      } else if (anim === "flicker") {
        alpha = Math.random() > 0.05 ? 1 : 0.3;
      } else if (anim === "shake") {
        x += (Math.random() - 0.5) * 6;
        y += (Math.random() - 0.5) * 3;
      } else if (anim === "float") {
        y += Math.sin(t * 2) * 10;
      } else if (anim === "glitch") {
        if (Math.random() > 0.9) {
          x += (Math.random() - 0.5) * 8;
          ctx.fillStyle = Math.random() > 0.5 ? "#ff0066" : "#00fff0";
          ctx.globalAlpha = 0.5;
          ctx.fillText(text || "HORROR STUDIO", x + 2, y);
        }
      } else if (anim === "blood-drip") {
        y = canvas.height * 0.3;
      }

      ctx.globalAlpha = alpha;
      ctx.transform(scaleX, 0, 0, scaleY, x * (1 - scaleX), y * (1 - scaleY));

      if (selectedTemplate.shadowEffect) {
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillStyle = primaryColor;
      if (selectedTemplate.glow) {
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20;
      }

      ctx.fillText(text || "HORROR STUDIO", x, y);

      // Secondary color stroke
      if (selectedTemplate.colors.length > 1) {
        ctx.strokeStyle = selectedTemplate.colors[1];
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.strokeText(text || "HORROR STUDIO", x, y);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
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
    const stream = canvas.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setLastExport(URL.createObjectURL(blob));
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const handleSurpriseMe = () => {
    const random = allTemplates[Math.floor(Math.random() * allTemplates.length)];
    setSelectedTemplate(random);
  };

  const categories = ["All", ...TEMPLATE_CATEGORIES];

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel */}
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

        {/* Category tabs */}
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

        {/* Search */}
        <div className="p-2 border-b border-zinc-800/30">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/30"
          />
        </div>

        {/* Template grid */}
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

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-purple-400" style={{ fontFamily: "Cinzel" }}>TEXT OVERLAY ANIMATOR</h1>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="text-zinc-600">Template:</span>
            <span className="text-zinc-300 font-medium">{selectedTemplate.name}</span>
          </div>
        </div>

        <div
          className="flex-1 relative rounded border border-purple-900/30 overflow-hidden bg-[#05050a]"
          style={{ boxShadow: "0 0 30px rgba(100,0,200,0.15)" }}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 mt-3">
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
            {recording ? "◼ Stop Record" : "● Record MP4"}
          </button>
          {lastExport && (
            <a
              href={lastExport}
              download="text-animation.webm"
              className="px-4 py-1.5 rounded text-xs border border-zinc-700/30 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Download
            </a>
          )}
        </div>
      </div>

      {/* Right Panel - Controls */}
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
            Export PNG for static overlay, or use Record to capture an animated clip for OBS media source.
          </p>
        </div>
      </aside>
    </div>
  );
}
