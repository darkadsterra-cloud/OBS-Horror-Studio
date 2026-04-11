import { useRef, useState, useEffect, useCallback } from "react";
import { useListCharacters, useCreateCharacter, useDeleteCharacter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const PRESET_CHARS = [
  { id: "preset-1", name: "Demon Lord", category: "Horror", imageUrl: "", isPreset: true },
  { id: "preset-2", name: "Phantom Witch", category: "Horror", imageUrl: "", isPreset: true },
  { id: "preset-3", name: "Cyber Ghost", category: "Sci-Fi", imageUrl: "", isPreset: true },
  { id: "preset-4", name: "Dark Reaper", category: "Horror", imageUrl: "", isPreset: true },
];

const PERFORMANCE_MODES = [
  { id: "low", label: "Low", desc: "Face swap only", color: "text-green-400" },
  { id: "medium", label: "Medium", desc: "Face + upper body", color: "text-yellow-400" },
  { id: "high", label: "High", desc: "Full body mapping", color: "text-red-400" },
];

const EFFECTS = [
  { id: "glitch", label: "Glitch", color: "#00fff0" },
  { id: "fire", label: "Fire Aura", color: "#ff6400" },
  { id: "aura", label: "Dark Aura", color: "#8b00ff" },
];

export default function CharacterTransformer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [webcamActive, setWebcamActive] = useState(false);
  const [characterMode, setCharacterMode] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [perfMode, setPerfMode] = useState("low");
  const [activeEffects, setActiveEffects] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [lastRecording, setLastRecording] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [charImageCache, setCharImageCache] = useState<Record<string, HTMLImageElement>>({});

  const { data: dbChars = [] } = useListCharacters();
  const createChar = useCreateCharacter();
  const deleteChar = useDeleteCharacter();
  const qc = useQueryClient();

  const allChars = [
    ...PRESET_CHARS,
    ...dbChars.filter(c => !c.isPreset).map(c => ({ id: c.id, name: c.name, category: c.category, imageUrl: c.imageUrl, isPreset: c.isPreset })),
  ];

  const selectedChar = allChars.find(c => c.id === selectedCharId);

  // Preload character image
  useEffect(() => {
    if (selectedChar?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setCharImageCache(p => ({ ...p, [selectedChar.id]: img }));
      img.src = selectedChar.imageUrl;
    }
  }, [selectedChar]);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setWebcamActive(true);
    } catch (err) {
      console.error("Webcam error", err);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
    setIsTracking(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    if (characterMode && selectedChar) {
      const charImg = charImageCache[selectedChar.id];
      const faceX = canvas.width * 0.3;
      const faceY = canvas.height * 0.1;
      const faceW = canvas.width * 0.4;
      const faceH = canvas.height * 0.5;

      if (charImg) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = 0.85;
        ctx.drawImage(charImg, faceX, faceY, faceW, faceH);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.fillStyle = "rgba(139, 0, 0, 0.5)";
        ctx.fillRect(faceX, faceY, faceW, faceH);
        ctx.fillStyle = "#ff2222";
        ctx.font = `bold ${faceW * 0.1}px Orbitron`;
        ctx.textAlign = "center";
        ctx.fillText(selectedChar.name, faceX + faceW / 2, faceY + faceH / 2);
      }

      // Tracking dots overlay
      setIsTracking(true);
      const dotPositions = perfMode === "high"
        ? [[0.5, 0.15], [0.35, 0.25], [0.65, 0.25], [0.45, 0.35], [0.55, 0.35], [0.5, 0.45], [0.3, 0.55], [0.7, 0.55], [0.4, 0.7], [0.6, 0.7]]
        : perfMode === "medium"
        ? [[0.5, 0.15], [0.35, 0.25], [0.65, 0.25], [0.45, 0.35], [0.55, 0.35]]
        : [[0.5, 0.2], [0.4, 0.3], [0.6, 0.3]];

      dotPositions.forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx * canvas.width, ry * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 65, 0.9)";
        ctx.shadowColor = "#00ff41";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    } else {
      setIsTracking(false);
    }

    // Effects overlay
    if (activeEffects.has("glitch")) {
      ctx.fillStyle = "rgba(0, 255, 240, 0.04)";
      ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 2);
    }
    if (activeEffects.has("fire")) {
      const grad = ctx.createLinearGradient(0, canvas.height * 0.8, 0, canvas.height);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, "rgba(255, 100, 0, 0.3)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);
    }
    if (activeEffects.has("aura")) {
      const radGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.height * 0.7);
      radGrad.addColorStop(0, "transparent");
      radGrad.addColorStop(1, "rgba(139, 0, 255, 0.2)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [characterMode, selectedChar, activeEffects, perfMode, charImageCache]);

  useEffect(() => {
    if (webcamActive) {
      rafRef.current = requestAnimationFrame(drawFrame);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [webcamActive, drawFrame]);

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setLastRecording(url);
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const handleUploadChar = async () => {
    if (!uploadUrl || !uploadName) return;
    await createChar.mutateAsync({ data: { name: uploadName, imageUrl: uploadUrl, category: "Custom" } });
    qc.invalidateQueries({ queryKey: ["listCharacters"] });
    setUploadUrl("");
    setUploadName("");
  };

  const toggleEffect = (id: string) => {
    setActiveEffects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Webcam</h2>
          <button
            onClick={webcamActive ? stopWebcam : startWebcam}
            className={`w-full py-1.5 rounded text-xs font-bold transition-all border ${webcamActive
              ? "bg-red-900/30 border-red-700/50 text-red-300 hover:bg-red-900/50"
              : "bg-zinc-800/50 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"
              }`}
          >
            {webcamActive ? "Stop Webcam" : "Start Webcam"}
          </button>
        </div>

        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Characters</h2>
          <div className="space-y-1">
            {allChars.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedCharId(char.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all border ${selectedCharId === char.id
                  ? "bg-red-900/20 border-red-700/40 text-red-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
              >
                <div className="font-medium">{char.name}</div>
                <div className="text-[9px] text-zinc-600">{char.category}</div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/40">
            <p className="text-[9px] text-zinc-600 mb-1 uppercase tracking-wider">Upload Character</p>
            <input
              value={uploadName}
              onChange={e => setUploadName(e.target.value)}
              placeholder="Name"
              className="w-full mb-1 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40"
            />
            <input
              value={uploadUrl}
              onChange={e => setUploadUrl(e.target.value)}
              placeholder="Image URL"
              className="w-full mb-1 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40"
            />
            <button
              onClick={handleUploadChar}
              disabled={!uploadUrl || !uploadName}
              className="w-full py-1 rounded bg-red-900/20 border border-red-700/30 text-xs text-red-300 disabled:opacity-30 hover:bg-red-900/40 transition-colors"
            >
              Upload
            </button>
          </div>
        </div>

        <div className="p-3">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Performance</h2>
          <div className="space-y-1">
            {PERFORMANCE_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setPerfMode(m.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all border ${perfMode === m.id
                  ? "bg-zinc-800/60 border-zinc-600/40 text-zinc-200"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <span className={`font-bold ${m.color}`}>{m.label}</span>
                <span className="text-zinc-600 ml-1.5 text-[9px]">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-red-400" style={{ fontFamily: "Cinzel" }}>CHARACTER TRANSFORMER</h1>
            {isTracking && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-900/20 border border-green-800/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 blink" />
                <span className="text-[10px] text-green-400 font-mono">LIVE TRACKING</span>
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Real</span>
            <button
              onClick={() => setCharacterMode(c => !c)}
              disabled={!webcamActive}
              className={`relative w-12 h-6 rounded-full border transition-all ${characterMode
                ? "bg-red-900/40 border-red-700/60"
                : "bg-zinc-800/60 border-zinc-700/30"
                } disabled:opacity-30`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${characterMode ? "left-6 bg-red-500" : "left-0.5 bg-zinc-500"}`} />
            </button>
            <span className="text-xs text-red-400">Character</span>
          </div>
        </div>

        <div
          className="flex-1 relative rounded border border-red-900/30 overflow-hidden bg-black"
          style={{ boxShadow: "0 0 30px rgba(139,0,0,0.2)" }}
        >
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {!webcamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl text-zinc-700 mb-3">◉</div>
              <p className="text-sm text-zinc-500">Start your webcam to begin tracking</p>
              <button
                onClick={startWebcam}
                className="mt-4 px-6 py-2 rounded bg-red-900/30 border border-red-700/50 text-red-300 text-sm hover:bg-red-900/50 transition-colors"
              >
                Start Webcam
              </button>
            </div>
          )}
          {!selectedCharId && webcamActive && characterMode && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-yellow-900/30 border border-yellow-700/30 text-[10px] text-yellow-400">
              Select a character from the sidebar
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!webcamActive}
            className={`px-4 py-1.5 rounded text-xs font-bold border transition-all disabled:opacity-30 ${recording
              ? "bg-red-600/30 border-red-500/50 text-red-300 animate-pulse"
              : "bg-zinc-800/60 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"
              }`}
          >
            {recording ? "◼ Stop Recording" : "● Record"}
          </button>
          {lastRecording && (
            <a
              href={lastRecording}
              download="horror-studio-recording.webm"
              className="px-4 py-1.5 rounded text-xs font-bold border border-zinc-700/30 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Download Recording
            </a>
          )}
        </div>
      </div>

      {/* Right Sidebar - Effects */}
      <aside className="w-44 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col p-3 overflow-y-auto">
        <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-3" style={{ fontFamily: "Cinzel" }}>Effects</h2>
        <div className="space-y-2 mb-4">
          {EFFECTS.map(ef => (
            <button
              key={ef.id}
              onClick={() => toggleEffect(ef.id)}
              className={`w-full text-left px-2 py-2 rounded text-xs transition-all border ${activeEffects.has(ef.id)
                ? "border-zinc-600/60 bg-zinc-800/40 text-zinc-200"
                : "border-zinc-800/30 text-zinc-500 hover:text-zinc-300"
                }`}
              style={activeEffects.has(ef.id) ? { boxShadow: `0 0 8px ${ef.color}33` } : {}}
            >
              <span className="font-medium" style={activeEffects.has(ef.id) ? { color: ef.color } : {}}>
                {ef.label}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-zinc-800/40 pt-3">
          <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Info</h3>
          <div className="space-y-1 text-[10px] text-zinc-500">
            <div>Mode: <span className="text-zinc-300">{perfMode}</span></div>
            <div>Effects: <span className="text-zinc-300">{activeEffects.size}</span></div>
            <div>Char: <span className="text-zinc-300 truncate block">{selectedChar?.name ?? "None"}</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
