import { useState } from "react";

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

  const generateImages = async () => {
    if (!prompt) return alert("Enter prompt");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("negativePrompt", negativePrompt);
      formData.append("style", style);
      formData.append("variants", "4");
      if (referenceImage) {
        formData.append("reference", referenceImage);
      }
      const res = await fetch("/api/ai-images/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">AI Character Scene Generator</h1>
      <div className="space-y-6 max-w-4xl">
        <textarea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe cinematic scene..."
          className="w-full p-4 rounded bg-zinc-900 border border-zinc-700"
        />
        <textarea
          rows={3}
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Negative prompt"
          className="w-full p-4 rounded bg-zinc-900 border border-zinc-700"
        />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="p-3 rounded bg-zinc-900"
        >
          <option value="cinematic">Cinematic</option>
          <option value="horror">Dark Horror</option>
          <option value="cyberpunk">Cyberpunk</option>
          <option value="superhero">Superhero</option>
        </select>
        <div>
          <p className="mb-2">Upload Reference Character</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReferenceImage(e.target.files?.[0] || null)}
          />
        </div>
        <button
          onClick={generateImages}
          disabled={loading}
          className="px-8 py-4 rounded bg-red-600"
        >
          {loading ? "Generating..." : "Generate 4 Variants"}
        </button>
      </div>
      {images.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {images.map((img, i) => (
            <div key={i}>
              <img src={img} className="rounded-xl w-full" alt="generated" />
              
                href={img}
                download={true}
                className="inline-block mt-4 bg-white text-black px-4 py-2 rounded"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
