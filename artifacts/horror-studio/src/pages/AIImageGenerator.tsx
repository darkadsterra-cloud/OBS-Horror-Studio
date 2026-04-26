import { useState } from "react";

const STYLE_PRESETS = [
  { label: "Cinematic", value: "cinematic, film still, dramatic lighting, 8k" },
  { label: "Dark Horror", value: "dark horror, gothic, scary, atmospheric, fog" },
  { label: "Cyberpunk", value: "cyberpunk, neon lights, futuristic city, rain" },
  { label: "Superhero", value: "superhero, comic book style, dynamic pose, epic" },
  { label: "Anime", value: "anime style, detailed, vibrant colors" },
  { label: "Realistic", value: "photorealistic, ultra detailed, sharp focus" },
];

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted");
  const [style, setStyle] = useState(STYLE_PRESETS[0].value);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

 const generateImages = async () => {
  if (!prompt.trim()) return alert("Prompt likho pehle!");
  setLoading(true);
  setError("");
  setImages([]);

  try {
    const results: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  prompt: referenceImage 
    ? `${prompt}, ${style}, character reference consistency, same person`
    : `${prompt}, ${style}`,
  index: i,
}),
      });

      const data = await res.json();
      if (data.output && data.output.length > 0) {
        results.push(data.output[0]);
        setImages([...results]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    }
  } catch (err: any) {
    setError(err.message || "Kuch error aayi");
  }
  setLoading(false);
};
  const downloadImage = async (url: string, index: number) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `generated-${index + 1}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-6">
      <h1
        className="text-3xl font-black mb-6 text-red-400"
        style={{ fontFamily: "Cinzel, serif", textShadow: "0 0 20px rgba(220,20,60,0.7)" }}
      >
        AI IMAGE GENERATOR
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Prompt</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene..."
              className="w-full p-3 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-red-700"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Style Preset</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-2 rounded text-xs border transition-all ${
                    style === s.value
                      ? "bg-red-900/40 border-red-600 text-red-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-red-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Negative Prompt</label>
            <textarea
              rows={2}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full p-3 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-red-700"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">
              Reference Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setReferenceImage(await toBase64(file));
              }}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700"
            />
            {referenceImage && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={`data:image/jpeg;base64,${referenceImage}`}
                  className="w-12 h-12 rounded object-cover border border-zinc-700"
                />
                <button
                  onClick={() => setReferenceImage(null)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button
            onClick={generateImages}
            disabled={loading}
            className="w-full py-3 rounded bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 font-bold text-sm transition-all"
          >
            {loading ? "Generating... (this takes ~2 min)" : "Generate 4 Images"}
          </button>

          {error && (
            <div className="p-3 rounded bg-red-900/30 border border-red-700 text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">Generating 4 images... please wait</p>
            </div>
          )}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {images.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 group relative">
<img 
  src={img} 
  className="w-full object-cover" 
  alt={`Generated ${i + 1}`}
  onError={(e) => {
    (e.target as HTMLImageElement).src = "";
  }}
  onLoad={(e) => {
    (e.target as HTMLImageElement).style.opacity = "1";
  }}
  style={{opacity: 0.5, transition: "opacity 0.3s"}}
/>
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
            <div className="flex items-center justify-center h-64 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-600 text-sm">Images yahan aayengi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
