import { useState, useRef } from "react";

const MODELS = [
  { id: "wan2.1-t2v", label: "Wan2.1 T2V", type: "t2v", desc: "Text to Video — Best quality" },
  { id: "wan2.1-i2v", label: "Wan2.1 I2V", type: "i2v", desc: "Image to Video — 14B params" },
  { id: "ltx-video", label: "LTX-Video", type: "t2v", desc: "Fast generation" },
  { id: "ltx-distilled", label: "LTX Distilled", type: "t2v", desc: "Fastest — 4 steps" },
  { id: "hunyuan-i2v", label: "HunyuanVideo I2V", type: "i2v", desc: "Best image-to-video" },
  { id: "skyreels", label: "SkyReels V2", type: "i2v", desc: "720P videos" },
];

const ASPECT_RATIOS = [
  { label: "16:9", w: 1280, h: 720, icon: "▬" },
  { label: "9:16", w: 720, h: 1280, icon: "▮" },
  { label: "1:1", w: 720, h: 720, icon: "■" },
  { label: "4:3", w: 960, h: 720, icon: "▭" },
  { label: "21:9", w: 1280, h: 548, icon: "━" },
];

const DURATIONS = [2, 3, 4, 5, 6, 8, 10];
const FPS_OPTIONS = [8, 12, 16, 24];

export default function LocalGenerator() {
  const [serverUrl, setServerUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem("comfyui_url") || "" : ""
  );
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Mode
  const [mode, setMode] = useState<"t2v" | "i2v" | "image">("t2v");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

  // Prompt
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(
    "blurry, low quality, distorted, watermark, ugly, duplicate frames"
  );

  // Video settings
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [duration, setDuration] = useState(4);
  const [fps, setFps] = useState(16);
  const [motionStrength, setMotionStrength] = useState(0.7);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(25);

  // Images
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  const [startImagePreview, setStartImagePreview] = useState<string | null>(null);
  const [endImagePreview, setEndImagePreview] = useState<string | null>(null);

  // Output
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [outputImages, setOutputImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "start" | "end"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    if (type === "start") {
      setStartImage(b64);
      setStartImagePreview(b64);
    } else {
      setEndImage(b64);
      setEndImagePreview(b64);
    }
  };

  const saveUrl = () => {
    localStorage.setItem("comfyui_url", serverUrl);
  };

  const testConnection = async () => {
    setConnecting(true);
    setError("");
    try {
      const res = await fetch(`${serverUrl}/system_stats`);
      if (res.ok) {
        setConnected(true);
        const data = await res.json();
        console.log("ComfyUI connected:", data);
      } else {
        setError("Server response galat hai");
        setConnected(false);
      }
    } catch {
      setError("Connect nahi hua — Cloudflare tunnel chalu hai?");
      setConnected(false);
    }
    setConnecting(false);
  };

  const generate = async () => {
    if (!prompt.trim()) return alert("Prompt daalo!");
    if (!serverUrl) return alert("Server URL daalo!");
    if (!connected) return alert("Pehle server connect karo!");

    setLoading(true);
    setError("");
    setOutputVideo(null);
    setOutputImages([]);
    setProgress(0);
    setProgressMsg("Queue mein bhej raha hun...");

    try {
      let workflow: any;

      if (mode === "image") {
        // Image generation workflow
        workflow = {
          "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
          "2": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1", 1] } },
          "3": { class_type: "CLIPTextEncode", inputs: { text: negativePrompt, clip: ["1", 1] } },
          "4": { class_type: "EmptyLatentImage", inputs: { width: aspectRatio.w, height: aspectRatio.h, batch_size: 1 } },
          "5": { class_type: "KSampler", inputs: { seed: Math.floor(Math.random() * 999999999), steps, cfg: guidanceScale, sampler_name: "euler", scheduler: "normal", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
          "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
          "7": { class_type: "SaveImage", inputs: { filename_prefix: "horror-studio", images: ["6", 0] } },
        };
      } else {
        // Video workflow — basic wan2.1 t2v
        workflow = {
          "1": {
            class_type: "UNETLoader",
            inputs: {
              unet_name: "wan2.1_t2v_14B_bf16.safetensors",
              weight_dtype: "bf16",
            },
          },
          "2": {
            class_type: "CLIPLoader",
            inputs: { clip_name: "umt5-xxl-enc-bf16.safetensors", type: "wan" },
          },
          "3": {
            class_type: "CLIPTextEncode",
            inputs: { text: prompt, clip: ["2", 0] },
          },
          "4": {
            class_type: "CLIPTextEncode",
            inputs: { text: negativePrompt, clip: ["2", 0] },
          },
          "5": {
            class_type: "AutoencoderKLWan",
            inputs: { vae_name: "wan_2.1_vae.safetensors" },
          },
          "6": {
            class_type: "EmptyWanLatentVideo",
            inputs: {
              width: aspectRatio.w,
              height: aspectRatio.h,
              length: duration * fps,
              batch_size: 1,
            },
          },
          "7": {
            class_type: "KSampler",
            inputs: {
              seed: Math.floor(Math.random() * 999999999),
              steps,
              cfg: guidanceScale,
              sampler_name: "euler",
              scheduler: "normal",
              denoise: 1,
              model: ["1", 0],
              positive: ["3", 0],
              negative: ["4", 0],
              latent_image: ["6", 0],
            },
          },
          "8": {
            class_type: "VAEDecode",
            inputs: { samples: ["7", 0], vae: ["5", 0] },
          },
          "9": {
            class_type: "VHS_VideoCombine",
            inputs: {
              frame_rate: fps,
              loop_count: 0,
              filename_prefix: "horror-video",
              format: "video/h264-mp4",
              images: ["8", 0],
            },
          },
        };
      }

      const res = await fetch(`${serverUrl}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow }),
      });

      const data = await res.json();
      const promptId = data.prompt_id;

      if (!promptId) throw new Error("Prompt ID nahi mila — workflow check karo");

      setProgressMsg("ComfyUI pe generate ho raha hai...");

      // Poll
      for (let i = 0; i < 300; i++) {
        await new Promise((r) => setTimeout(r, 2000));

        // Queue check
        const qRes = await fetch(`${serverUrl}/queue`);
        const qData = await qRes.json();
        const running = qData.queue_running || [];
        if (running.length > 0) {
          setProgressMsg(`RTX 5070 generate kar raha hai... (${i * 2}s)`);
          setProgress(Math.min(90, i * 2));
        }

        const histRes = await fetch(`${serverUrl}/history/${promptId}`);
        const hist = await histRes.json();

        if (hist[promptId]) {
          const outputs = hist[promptId].outputs;
          setProgress(100);

          if (mode === "image" && outputs["7"]?.images) {
            const imgs = outputs["7"].images.map(
              (img: any) =>
                `${serverUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`
            );
            setOutputImages(imgs);
            break;
          } else if (outputs["9"]?.gifs || outputs["9"]?.videos) {
            const vids = outputs["9"]?.gifs || outputs["9"]?.videos || [];
            if (vids.length > 0) {
              const videoUrl = `${serverUrl}/view?filename=${vids[0].filename}&subfolder=${vids[0].subfolder}&type=${vids[0].type}`;
              setOutputVideo(videoUrl);
            }
            break;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Error aaya");
    }

    setLoading(false);
    setProgress(0);
    setProgressMsg("");
  };

  const downloadOutput = async () => {
    const url = outputVideo || outputImages[0];
    if (!url) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = outputVideo ? "generated-video.mp4" : "generated-image.png";
    a.click();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#04040a] text-white">
      {/* Header */}
      <div className="border-b border-purple-900/30 px-6 py-3 flex items-center justify-between bg-[#06060e]">
        <div>
          <h1 className="text-xl font-black text-purple-400" style={{ fontFamily: "Cinzel" }}>
            LOCAL AI STUDIO
          </h1>
          <p className="text-[10px] text-zinc-600">RTX 5070 — ComfyUI Local Server</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs text-zinc-400">{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-12 gap-4 h-full">
        {/* LEFT PANEL */}
        <div className="col-span-3 space-y-3">

          {/* Server */}
          <div className="rounded border border-purple-900/40 bg-purple-900/10 p-3">
            <label className="text-[9px] text-purple-400 uppercase tracking-widest block mb-1.5">Server URL</label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onBlur={saveUrl}
              placeholder="https://abc.trycloudflare.com"
              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-xs focus:outline-none focus:border-purple-700 mb-2"
            />
            <button
              onClick={testConnection}
              disabled={connecting}
              className={`w-full py-1.5 rounded text-xs font-bold border transition-all ${
                connected
                  ? "bg-green-900/40 border-green-700 text-green-300"
                  : "bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-900/50"
              }`}
            >
              {connecting ? "Connecting..." : connected ? "✓ Connected" : "Connect"}
            </button>
          </div>

          {/* Mode */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">Generation Mode</label>
            <div className="grid grid-cols-3 gap-1">
              {(["t2v", "i2v", "image"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-1.5 rounded text-[10px] font-bold border transition-all ${
                    mode === m
                      ? "bg-purple-900/50 border-purple-600 text-purple-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  }`}
                >
                  {m === "t2v" ? "🎬 T2V" : m === "i2v" ? "🖼→🎬 I2V" : "🖼 IMG"}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">Model</label>
            <div className="space-y-1">
              {MODELS.filter(m => mode === "image" || m.type === mode || mode === "t2v").map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[10px] border transition-all ${
                    selectedModel.id === m.id
                      ? "bg-blue-900/40 border-blue-600 text-blue-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <div className="font-bold">{m.label}</div>
                  <div className="text-[9px] opacity-60">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-1">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.label}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-1.5 rounded text-[10px] border transition-all flex flex-col items-center gap-0.5 ${
                    aspectRatio.label === ar.label
                      ? "bg-cyan-900/40 border-cyan-600 text-cyan-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <span>{ar.icon}</span>
                  <span>{ar.label}</span>
                </button>
              ))}
            </div>
            <div className="text-[9px] text-zinc-600 mt-1 text-center">{aspectRatio.w} × {aspectRatio.h}</div>
          </div>
        </div>

        {/* MIDDLE PANEL */}
        <div className="col-span-5 space-y-3">

          {/* Prompt */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1.5">Prompt</label>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cinematic scene of a dark forest, fog rolling in, horror atmosphere, dramatic lighting..."
              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-purple-700 resize-none"
            />
            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1.5 mt-2">Negative Prompt</label>
            <textarea
              rows={2}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-xs focus:outline-none focus:border-red-700 resize-none"
            />
          </div>

          {/* Start / End Image */}
          {(mode === "i2v") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">Start Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "start")} className="hidden" id="start-img" />
                <label htmlFor="start-img" className="block cursor-pointer">
                  {startImagePreview ? (
                    <img src={startImagePreview} className="w-full h-28 object-cover rounded border border-zinc-700" />
                  ) : (
                    <div className="w-full h-28 rounded border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs hover:border-purple-700">
                      + Upload
                    </div>
                  )}
                </label>
                {startImagePreview && (
                  <button onClick={() => { setStartImage(null); setStartImagePreview(null); }} className="w-full mt-1 text-[9px] text-red-400">Remove</button>
                )}
              </div>
              <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">End Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "end")} className="hidden" id="end-img" />
                <label htmlFor="end-img" className="block cursor-pointer">
                  {endImagePreview ? (
                    <img src={endImagePreview} className="w-full h-28 object-cover rounded border border-zinc-700" />
                  ) : (
                    <div className="w-full h-28 rounded border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs hover:border-purple-700">
                      + Upload
                    </div>
                  )}
                </label>
                {endImagePreview && (
                  <button onClick={() => { setEndImage(null); setEndImagePreview(null); }} className="w-full mt-1 text-[9px] text-red-400">Remove</button>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3 grid grid-cols-2 gap-3">
            {mode !== "image" && (
              <>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Duration: <span className="text-zinc-300">{duration}s</span></label>
                  <div className="flex gap-1 flex-wrap">
                    {DURATIONS.map((d) => (
                      <button key={d} onClick={() => setDuration(d)} className={`px-2 py-0.5 rounded text-[9px] border ${duration === d ? "bg-purple-900/40 border-purple-600 text-purple-300" : "border-zinc-700 text-zinc-500"}`}>{d}s</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">FPS: <span className="text-zinc-300">{fps}</span></label>
                  <div className="flex gap-1">
                    {FPS_OPTIONS.map((f) => (
                      <button key={f} onClick={() => setFps(f)} className={`px-2 py-0.5 rounded text-[9px] border ${fps === f ? "bg-cyan-900/40 border-cyan-600 text-cyan-300" : "border-zinc-700 text-zinc-500"}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 block mb-1">Motion: <span className="text-zinc-300">{motionStrength.toFixed(1)}</span></label>
                  <input type="range" min={0.1} max={1} step={0.1} value={motionStrength} onChange={(e) => setMotionStrength(Number(e.target.value))} className="w-full accent-purple-600" />
                </div>
              </>
            )}
            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Steps: <span className="text-zinc-300">{steps}</span></label>
              <input type="range" min={4} max={50} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-purple-600" />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Guidance: <span className="text-zinc-300">{guidanceScale.toFixed(1)}</span></label>
              <input type="range" min={1} max={15} step={0.5} value={guidanceScale} onChange={(e) => setGuidanceScale(Number(e.target.value))} className="w-full accent-cyan-600" />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={loading || !connected}
            className={`w-full py-4 rounded text-sm font-black border transition-all ${
              loading
                ? "bg-purple-900/30 border-purple-700 text-purple-400 cursor-wait"
                : connected
                ? "bg-purple-700 hover:bg-purple-600 border-purple-500 text-white"
                : "bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Cinzel" }}
          >
            {loading ? `⚡ ${progressMsg || "Generating..."}` : `⚡ GENERATE ${mode === "image" ? "IMAGE" : "VIDEO"}`}
          </button>

          {/* Progress */}
          {loading && (
            <div className="rounded border border-purple-900/40 bg-purple-900/10 p-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-purple-300">{progressMsg}</span>
                <span className="text-xs text-purple-400">{progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded border border-red-700 bg-red-900/20 text-red-300 text-xs">{error}</div>
          )}
        </div>

        {/* RIGHT PANEL — Output */}
        <div className="col-span-4">
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Output</label>
              {(outputVideo || outputImages.length > 0) && (
                <button
                  onClick={downloadOutput}
                  className="px-3 py-1 rounded bg-green-900/40 border border-green-700 text-green-300 text-xs font-bold hover:bg-green-900/60"
                >
                  ↓ Download
                </button>
              )}
            </div>

            {outputVideo && (
              <div className="flex-1 flex flex-col gap-2">
                <video
                  ref={videoRef}
                  src={outputVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded border border-zinc-700"
                  style={{ maxHeight: "400px" }}
                />
                <div className="text-[9px] text-zinc-600 text-center">
                  {aspectRatio.w}×{aspectRatio.h} · {duration}s · {fps}fps
                </div>
              </div>
            )}

            {outputImages.length > 0 && !outputVideo && (
              <div className="grid grid-cols-2 gap-2">
                {outputImages.map((img, i) => (
                  <div key={i} className="rounded overflow-hidden border border-zinc-700">
                    <img src={img} className="w-full object-cover" alt={`Output ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {!outputVideo && outputImages.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-800 rounded">
                <div className="text-4xl">⚡</div>
                <p className="text-zinc-600 text-sm">Output yahan aayega</p>
                <p className="text-zinc-700 text-xs">RTX 5070 ready hai!</p>
                {!connected && (
                  <p className="text-red-500 text-xs">Server connect karo pehle</p>
                )}
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-purple-400 text-sm font-bold">RTX 5070 generating...</p>
                <p className="text-zinc-600 text-xs">{progressMsg}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
