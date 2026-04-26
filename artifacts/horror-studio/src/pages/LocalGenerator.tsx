import { useState } from "react";

export default function LocalGenerator() {
  const [serverUrl, setServerUrl] = useState(
    localStorage.getItem("comfyui_url") || ""
  );
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<"image" | "video">("image");

  const saveUrl = () => {
    localStorage.setItem("comfyui_url", serverUrl);
    alert("URL saved!");
  };

  const testConnection = async () => {
    try {
      const res = await fetch(`${serverUrl}/system_stats`);
      if (res.ok) {
        setConnected(true);
        setError("");
        alert("Connected!");
      } else {
        setError("Server response galat hai");
      }
    } catch {
      setError("Connect nahi hua — URL check karo ya Cloudflare tunnel chalu hai?");
      setConnected(false);
    }
  };

  const generate = async () => {
    if (!prompt.trim()) return alert("Prompt likho!");
    if (!serverUrl) return alert("Server URL daalo!");
    setLoading(true);
    setError("");
    setImages([]);

    try {
      const workflow = {
        "3": {
          inputs: {
            seed: Math.floor(Math.random() * 999999999),
            steps: 20,
            cfg: 7,
            sampler_name: "euler",
            scheduler: "normal",
            denoise: 1,
            model: ["4", 0],
            positive: ["6", 0],
            negative: ["7", 0],
            latent_image: ["5", 0],
          },
          class_type: "KSampler",
        },
        "4": {
          inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" },
          class_type: "CheckpointLoaderSimple",
        },
        "5": {
          inputs: { width: 1024, height: 1024, batch_size: 1 },
          class_type: "EmptyLatentImage",
        },
        "6": {
          inputs: { text: `${prompt}, high quality, detailed`, clip: ["4", 1] },
          class_type: "CLIPTextEncode",
        },
        "7": {
          inputs: { text: negativePrompt, clip: ["4", 1] },
          class_type: "CLIPTextEncode",
        },
        "8": {
          inputs: { samples: ["3", 0], vae: ["4", 2] },
          class_type: "VAEDecode",
        },
        "9": {
          inputs: {
            filename_prefix: "horror-studio",
            images: ["8", 0],
          },
          class_type: "SaveImage",
        },
      };

      const res = await fetch(`${serverUrl}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow }),
      });

      const data = await res.json();
      const promptId = data.prompt_id;

      // Poll for result
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const histRes = await fetch(`${serverUrl}/history/${promptId}`);
        const hist = await histRes.json();

        if (hist[promptId]?.outputs?.["9"]?.images) {
          const imgs = hist[promptId].outputs["9"].images;
          const urls = imgs.map(
            (img: any) =>
              `${serverUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`
          );
          setImages(urls);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || "Error aaya");
    }
    setLoading(false);
  };

  const downloadImage = async (url: string, i: number) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `local-gen-${i + 1}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-6">
      <h1
        className="text-3xl font-black mb-2 text-purple-400"
        style={{ fontFamily: "Cinzel, serif", textShadow: "0 0 20px rgba(139,0,255,0.7)" }}
      >
        LOCAL AI GENERATOR
      </h1>
      <p className="text-zinc-500 text-xs mb-6">RTX 5070 — ComfyUI Local Server</p>

      {/* Server URL */}
      <div className="mb-6 p-4 rounded border border-purple-900/40 bg-purple-900/10">
        <label className="text-xs text-purple-400 uppercase tracking-widest block mb-2">
          ComfyUI Server URL (Cloudflare Tunnel)
        </label>
        <div className="flex gap-2">
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://abc123.trycloudflare.com"
            className="flex-1 p-2 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-purple-700"
          />
          <button
            onClick={saveUrl}
            className="px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:border-purple-700"
          >
            Save
          </button>
          <button
            onClick={testConnection}
            className={`px-3 py-2 rounded text-xs border font-bold transition-all ${
              connected
                ? "bg-green-900/40 border-green-700 text-green-300"
                : "bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-900/50"
            }`}
          >
            {connected ? "✓ Connected" : "Test"}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("image")}
              className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                mode === "image"
                  ? "bg-purple-900/40 border-purple-600 text-purple-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400"
              }`}
            >
              🖼 Image
            </button>
            <button
              onClick={() => setMode("video")}
              className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${
                mode === "video"
                  ? "bg-blue-900/40 border-blue-600 text-blue-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400"
              }`}
            >
              🎬 Video
            </button>
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Prompt</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene..."
              className="w-full p-3 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-purple-700"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Negative Prompt</label>
            <textarea
              rows={2}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full p-3 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-purple-700"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 rounded bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-800 disabled:text-zinc-600 font-bold text-sm transition-all"
          >
            {loading ? "Generating on RTX 5070..." : `Generate ${mode === "image" ? "Image" : "Video"}`}
          </button>

          {mode === "video" && (
            <div className="p-3 rounded border border-blue-900/40 bg-blue-900/10 text-xs text-blue-300">
              Video generation ke liye Wan2.1 model install karna hoga ComfyUI mein. Image pehle test karo!
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">RTX 5070 generating...</p>
            </div>
          )}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {images.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 group relative">
                  <img src={img} className="w-full object-cover" alt={`Generated ${i + 1}`} />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadImage(img, i)}
                      className="w-full py-1.5 rounded bg-white text-black text-xs font-bold"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-800 rounded-xl gap-3">
              <p className="text-zinc-600 text-sm">Server connect karo aur generate karo</p>
              <p className="text-zinc-700 text-xs">RTX 5070 ready hai!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
