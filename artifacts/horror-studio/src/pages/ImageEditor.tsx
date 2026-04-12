import { useState, useRef, useCallback } from "react";

type Tool = "bg-remove" | "adjust";

const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "hard-light"];

export default function ImageEditor() {
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("bg-remove");
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurAmount, setBlurAmount] = useState(0);
  const [overlayColor, setOverlayColor] = useState("#ff0000");
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [blendMode, setBlendMode] = useState("normal");
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setOriginalSrc(src);
      setProcessedSrc(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalSrc(ev.target?.result as string);
      setProcessedSrc(null);
    };
    reader.readAsDataURL(file);
  };

  const removeBackground = useCallback(async () => {
    if (!originalSrc) return;
    setProcessing(true);
    setProcessingMsg("Loading AI model (first time may take ~15 seconds)...");

    try {
      const { removeBackground: removeBg } = await import("@imgly/background-removal");

      setProcessingMsg("Running background removal AI...");

      const blob = await fetch(originalSrc).then(r => r.blob());
      const resultBlob = await removeBg(blob, {
        publicPath: "https://unpkg.com/@imgly/background-removal@1.4.5/dist/",
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setProcessingMsg(`Processing: ${pct}%`);
          }
        },
      });

      const url = URL.createObjectURL(resultBlob);
      setProcessedSrc(url);
      setProcessingMsg("");
    } catch (err) {
      console.error("Background removal failed:", err);
      setProcessingMsg("Error — try again or use a different image");
      setTimeout(() => setProcessingMsg(""), 3000);
    } finally {
      setProcessing(false);
    }
  }, [originalSrc]);

  const applyAdjustments = useCallback(() => {
    const src = processedSrc || originalSrc;
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      if (flipH || flipV) {
        ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      }
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blurAmount}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      if (overlayOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = overlayOpacity / 100;
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      const url = canvas.toDataURL("image/png");
      setProcessedSrc(url);
    };
    img.src = src;
  }, [processedSrc, originalSrc, brightness, contrast, saturation, blurAmount, flipH, flipV, overlayColor, overlayOpacity, blendMode]);

  const downloadResult = () => {
    const src = processedSrc || originalSrc;
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = "edited-image.png";
    a.click();
  };

  const reset = () => {
    setProcessedSrc(null);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlurAmount(0);
    setOverlayOpacity(0);
    setFlipH(false);
    setFlipV(false);
  };

  const displaySrc = processedSrc || originalSrc;

  return (
    <div className="h-full flex overflow-hidden">
      <aside className="w-60 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Tools</h2>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTool("bg-remove")}
              className={`w-full text-left px-3 py-2 rounded text-xs border transition-all ${activeTool === "bg-remove" ? "bg-orange-900/20 border-orange-700/40 text-orange-300" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              <div className="font-bold">Background Removal</div>
              <div className="text-[9px] text-zinc-600 mt-0.5">AI-powered instant BG remove</div>
            </button>
            <button
              onClick={() => setActiveTool("adjust")}
              className={`w-full text-left px-3 py-2 rounded text-xs border transition-all ${activeTool === "adjust" ? "bg-orange-900/20 border-orange-700/40 text-orange-300" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              <div className="font-bold">Image Adjustments</div>
              <div className="text-[9px] text-zinc-600 mt-0.5">Brightness, contrast, color</div>
            </button>
          </div>
        </div>

        {activeTool === "bg-remove" && (
          <div className="p-3 flex-1">
            <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
              Upload any image — our AI model will automatically detect and remove the background in seconds.
            </p>
            <button
              onClick={removeBackground}
              disabled={!originalSrc || processing}
              className="w-full py-2.5 rounded bg-orange-900/20 border border-orange-700/40 text-orange-300 text-xs font-bold hover:bg-orange-900/40 transition-colors disabled:opacity-30"
            >
              {processing ? "Processing..." : "Remove Background"}
            </button>
            {processingMsg && (
              <p className="text-[10px] text-yellow-400 mt-2 animate-pulse">{processingMsg}</p>
            )}
            <div className="mt-4 pt-3 border-t border-zinc-800/40">
              <p className="text-[9px] text-zinc-600 leading-relaxed">
                Works best with clear subject photos. Supports PNG, JPG, WebP. Output is PNG with transparent background.
              </p>
            </div>
          </div>
        )}

        {activeTool === "adjust" && (
          <div className="p-3 flex-1 space-y-3">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Brightness: {brightness}%</label>
              <input type="range" min={0} max={200} value={brightness} onChange={e => setBrightness(+e.target.value)} className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Contrast: {contrast}%</label>
              <input type="range" min={0} max={200} value={contrast} onChange={e => setContrast(+e.target.value)} className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Saturation: {saturation}%</label>
              <input type="range" min={0} max={200} value={saturation} onChange={e => setSaturation(+e.target.value)} className="w-full accent-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Blur: {blurAmount}px</label>
              <input type="range" min={0} max={20} value={blurAmount} onChange={e => setBlurAmount(+e.target.value)} className="w-full accent-orange-500" />
            </div>

            <div className="border-t border-zinc-800/40 pt-2">
              <label className="block text-[10px] text-zinc-500 mb-1">Color Overlay</label>
              <div className="flex gap-2 items-center mb-1">
                <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)}
                  className="w-7 h-6 rounded border border-zinc-700/30 bg-zinc-800/60 cursor-pointer" />
                <span className="text-[10px] text-zinc-500">Opacity: {overlayOpacity}%</span>
              </div>
              <input type="range" min={0} max={100} value={overlayOpacity} onChange={e => setOverlayOpacity(+e.target.value)} className="w-full accent-orange-500 mb-1" />
              <select value={blendMode} onChange={e => setBlendMode(e.target.value)}
                className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 text-xs focus:outline-none">
                {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="border-t border-zinc-800/40 pt-2">
              <label className="block text-[10px] text-zinc-500 mb-1">Flip</label>
              <div className="flex gap-2">
                <button onClick={() => setFlipH(v => !v)}
                  className={`flex-1 py-1 rounded text-[10px] border transition-all ${flipH ? "bg-orange-900/30 border-orange-700/40 text-orange-300" : "border-zinc-700/30 text-zinc-500 hover:text-zinc-300"}`}>
                  ↔ Horizontal
                </button>
                <button onClick={() => setFlipV(v => !v)}
                  className={`flex-1 py-1 rounded text-[10px] border transition-all ${flipV ? "bg-orange-900/30 border-orange-700/40 text-orange-300" : "border-zinc-700/30 text-zinc-500 hover:text-zinc-300"}`}>
                  ↕ Vertical
                </button>
              </div>
            </div>

            <button
              onClick={applyAdjustments}
              disabled={!originalSrc}
              className="w-full py-2 rounded bg-orange-900/20 border border-orange-700/40 text-orange-300 text-xs font-bold hover:bg-orange-900/40 transition-colors disabled:opacity-30"
            >
              Apply Adjustments
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-orange-400" style={{ fontFamily: "Cinzel" }}>IMAGE EDITOR</h1>
          <div className="flex items-center gap-2">
            {originalSrc && (
              <>
                <button onClick={reset} className="px-3 py-1.5 rounded bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  Reset
                </button>
                <button onClick={downloadResult} className="px-3 py-1.5 rounded bg-orange-900/20 border border-orange-700/40 text-xs text-orange-300 font-bold hover:bg-orange-900/40 transition-colors">
                  ↓ Download PNG
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className="flex-1 rounded border border-orange-900/20 bg-[#050508] overflow-hidden relative"
          style={{ boxShadow: "0 0 30px rgba(180,60,0,0.12)" }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {!originalSrc ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <div className="text-5xl text-zinc-700 mb-4">🖼</div>
              <p className="text-sm text-zinc-400 mb-2">Drop an image here or choose a file</p>
              <p className="text-xs text-zinc-600 mb-5">Supports PNG, JPG, WebP, GIF</p>
              <label className="cursor-pointer px-6 py-2.5 rounded bg-orange-900/20 border border-orange-700/40 text-orange-300 text-xs font-bold hover:bg-orange-900/40 transition-colors">
                Choose Image
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4 relative">
              {displaySrc && (
                <img
                  src={displaySrc}
                  alt="Edited"
                  className="max-w-full max-h-full object-contain rounded"
                  style={{ background: "repeating-conic-gradient(#1a1a2e 0% 25%, #0d0d1a 0% 50%) 0 0 / 16px 16px" }}
                />
              )}
              {processing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded">
                  <div className="w-12 h-12 border-4 border-orange-700/40 border-t-orange-400 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-orange-300 font-bold">{processingMsg}</p>
                </div>
              )}
              <label
                className="absolute bottom-4 right-4 cursor-pointer px-3 py-1.5 rounded bg-zinc-900/80 border border-zinc-700/40 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Change Image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {originalSrc && (
          <div className="flex items-center gap-3 mt-3 text-[10px] text-zinc-600">
            <span className={processedSrc ? "text-green-400" : ""}>
              {processedSrc ? "✓ Processed" : "Original image loaded"}
            </span>
            <span>·</span>
            <span>PNG output preserves transparency</span>
          </div>
        )}
      </div>
    </div>
  );
}
