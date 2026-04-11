import { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";

const MODELS_URL = "/models";
const STORAGE_KEY = "horror-studio-custom-chars";

interface LocalChar {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  isPreset: boolean;
}

const PRESET_CHARS: LocalChar[] = [
  { id: "preset-1", name: "Demon Lord", category: "Horror", imageUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=demon&backgroundColor=8b0000", isPreset: true },
  { id: "preset-2", name: "Phantom Witch", category: "Horror", imageUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=witch&backgroundColor=4a0080", isPreset: true },
  { id: "preset-3", name: "Cyber Ghost", category: "Sci-Fi", imageUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=ghost&backgroundColor=003366", isPreset: true },
  { id: "preset-4", name: "Dark Reaper", category: "Horror", imageUrl: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=reaper&backgroundColor=1a0000", isPreset: true },
];

const EFFECTS = [
  { id: "glitch", label: "Glitch", color: "#00fff0" },
  { id: "fire", label: "Fire Aura", color: "#ff6400" },
  { id: "aura", label: "Dark Aura", color: "#8b00ff" },
];

const PERFORMANCE_MODES = [
  { id: "low", label: "Low", desc: "Face swap only", color: "text-green-400" },
  { id: "medium", label: "Medium", desc: "Face + tracking dots", color: "text-yellow-400" },
  { id: "high", label: "High", desc: "Full landmark overlay", color: "text-red-400" },
];

function loadLocalChars(): LocalChar[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveLocalChars(chars: LocalChar[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
}

export default function CharacterTransformer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const charImageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDetectionRef = useRef<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | null>(null);

  const [webcamActive, setWebcamActive] = useState(false);
  const [characterMode, setCharacterMode] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [perfMode, setPerfMode] = useState("low");
  const [activeEffects, setActiveEffects] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadPending, setUploadPending] = useState<string | null>(null);
  const [localChars, setLocalChars] = useState<LocalChar[]>(loadLocalChars);
  const [charOpacity, setCharOpacity] = useState(85);

  const allChars = [...PRESET_CHARS, ...localChars];
  const selectedChar = allChars.find(c => c.id === selectedCharId) ?? null;

  // Load face-api.js models
  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      setModelLoading(true);
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
        ]);
        if (!cancelled) setModelReady(true);
      } catch (err) {
        console.error("face-api model load error:", err);
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    }
    loadModels();
    return () => { cancelled = true; };
  }, []);

  // Preload character images
  const preloadImage = useCallback((char: LocalChar) => {
    if (charImageCacheRef.current[char.id]) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { charImageCacheRef.current[char.id] = img; };
    img.src = char.imageUrl;
  }, []);

  useEffect(() => { allChars.forEach(preloadImage); }, [allChars, preloadImage]);

  // Face detection runs on interval (not every frame for performance)
  useEffect(() => {
    if (!webcamActive || !modelReady || !characterMode) {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      lastDetectionRef.current = null;
      setFaceDetected(false);
      return;
    }

    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);
        if (result) {
          lastDetectionRef.current = result;
          setFaceDetected(true);
        } else {
          lastDetectionRef.current = null;
          setFaceDetected(false);
        }
      } catch { /* ignore */ }
    }, 80); // ~12 detections/sec

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [webcamActive, modelReady, characterMode]);

  const webcamActive_ref = useRef(webcamActive);
  useEffect(() => { webcamActive_ref.current = webcamActive; }, [webcamActive]);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = video.videoWidth || 640;
    const H = video.videoHeight || 360;
    canvas.width = W;
    canvas.height = H;

    // Draw mirrored webcam
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -W, 0, W, H);
    ctx.restore();

    if (characterMode && selectedChar) {
      const charImg = charImageCacheRef.current[selectedChar.id];
      const det = lastDetectionRef.current;

      if (det) {
        const lms = det.landmarks.positions;
        // face-api landmarks: 0-16=jaw, 17-21=leftBrow, 22-26=rightBrow,
        // 27-35=nose, 36-41=leftEye, 42-47=rightEye, 48-67=mouth
        // Video is mirrored on screen — flip X to match
        const mirrorX = (x: number) => W - x;

        // Eye centers
        const eyeLandmarks = [36, 37, 38, 39, 40, 41];
        const rightEyeLandmarks = [42, 43, 44, 45, 46, 47];
        const leftEyeCenter = {
          x: mirrorX(eyeLandmarks.reduce((s, i) => s + lms[i].x, 0) / eyeLandmarks.length),
          y: eyeLandmarks.reduce((s, i) => s + lms[i].y, 0) / eyeLandmarks.length,
        };
        const rightEyeCenter = {
          x: mirrorX(rightEyeLandmarks.reduce((s, i) => s + lms[i].x, 0) / rightEyeLandmarks.length),
          y: rightEyeLandmarks.reduce((s, i) => s + lms[i].y, 0) / rightEyeLandmarks.length,
        };

        // Chin and forehead estimate
        const chin = { x: mirrorX(lms[8].x), y: lms[8].y };
        // Forehead estimated above eye midpoint
        const eyeMidY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const faceHeight = (chin.y - eyeMidY) * 2.6;
        const faceWidth = Math.hypot(rightEyeCenter.x - leftEyeCenter.x, rightEyeCenter.y - leftEyeCenter.y) * 2.2;
        const charSize = Math.max(faceHeight, faceWidth);

        // Rotation angle
        const angle = Math.atan2(
          rightEyeCenter.y - leftEyeCenter.y,
          rightEyeCenter.x - leftEyeCenter.x
        );

        // Center of face
        const fx = eyeMidX;
        const fy = eyeMidY + (chin.y - eyeMidY) * 0.15;

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(angle);
        ctx.globalAlpha = charOpacity / 100;

        if (charImg) {
          const aspect = charImg.naturalWidth / charImg.naturalHeight || 1;
          const dw = charSize * aspect;
          const dh = charSize;
          ctx.drawImage(charImg, -dw / 2, -dh / 2, dw, dh);
        } else {
          ctx.fillStyle = "rgba(139,0,0,0.55)";
          ctx.beginPath();
          ctx.ellipse(0, 0, charSize * 0.45, charSize * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ff4444";
          ctx.font = `bold ${charSize * 0.12}px Orbitron`;
          ctx.textAlign = "center";
          ctx.fillText(selectedChar.name, 0, charSize * 0.08);
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // Landmark dots based on performance mode
        if (perfMode !== "low") {
          const dotIndices = perfMode === "high"
            ? [0, 4, 8, 12, 16, 17, 21, 22, 26, 27, 30, 33, 36, 39, 42, 45, 48, 54, 57]
            : [36, 39, 42, 45, 33, 8];

          ctx.shadowColor = "#00ff41";
          ctx.shadowBlur = 5;
          ctx.fillStyle = "rgba(0,255,65,0.85)";
          dotIndices.forEach(i => {
            if (!lms[i]) return;
            ctx.beginPath();
            ctx.arc(mirrorX(lms[i].x), lms[i].y, 3, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.shadowBlur = 0;
        }

      } else if (!modelReady) {
        // Fallback center overlay
        const charImg = charImageCacheRef.current[selectedChar.id];
        drawCenteredOverlay(ctx, W, H, charImg, selectedChar.name, charOpacity);
      }
    }

    // Effects
    if (activeEffects.has("glitch") && Math.random() > 0.65) {
      const y = Math.random() * H;
      const sliceH = 2 + Math.random() * 8;
      const offsetX = (Math.random() - 0.5) * 30;
      ctx.save();
      const slice = ctx.getImageData(0, y, W, sliceH);
      ctx.putImageData(slice, offsetX, y);
      ctx.fillStyle = `rgba(0,255,240,0.04)`;
      ctx.fillRect(0, Math.random() * H, W, 1.5);
      ctx.restore();
    }
    if (activeEffects.has("fire")) {
      const grad = ctx.createLinearGradient(0, H * 0.7, 0, H);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, "rgba(255,100,0,0.38)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.7, W, H * 0.3);
    }
    if (activeEffects.has("aura")) {
      const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.72);
      rg.addColorStop(0, "transparent");
      rg.addColorStop(1, "rgba(139,0,255,0.25)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [characterMode, selectedChar, activeEffects, perfMode, modelReady, charOpacity]);

  useEffect(() => {
    if (webcamActive) rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [webcamActive, drawFrame]);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setWebcamActive(true);
    } catch (err) {
      console.error("Webcam error", err);
      alert("Could not access webcam. Please allow camera permission.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    lastDetectionRef.current = null;
    setWebcamActive(false);
    setFaceDetected(false);
  }, []);

  // File upload from PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPending(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmUpload = () => {
    if (!uploadPending || !uploadName.trim()) return;
    const newChar: LocalChar = {
      id: `custom-${Date.now()}`,
      name: uploadName.trim(),
      imageUrl: uploadPending,
      category: "Custom",
      isPreset: false,
    };
    const updated = [...localChars, newChar];
    setLocalChars(updated);
    saveLocalChars(updated);
    setSelectedCharId(newChar.id);
    setCharacterMode(true);
    setUploadName("");
    setUploadPending(null);
  };

  const deleteLocalChar = (id: string) => {
    const updated = localChars.filter(c => c.id !== id);
    setLocalChars(updated);
    saveLocalChars(updated);
    if (selectedCharId === id) setSelectedCharId(null);
    delete charImageCacheRef.current[id];
  };

  // Recording — captures the canvas (transformed output)
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    chunksRef.current = [];
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const mr = new MediaRecorder(stream, { mimeType });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
      setLastRecordingUrl(URL.createObjectURL(blob));
    };
    mr.start(100);
    mediaRecorderRef.current = mr;
    setRecording(true);
    setLastRecordingUrl(null);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.requestData();
    setTimeout(() => mediaRecorderRef.current?.stop(), 150);
    setRecording(false);
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
      <aside className="w-56 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        {/* Webcam control */}
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Webcam</h2>
          <button
            onClick={webcamActive ? stopWebcam : startWebcam}
            className={`w-full py-1.5 rounded text-xs font-bold transition-all border ${webcamActive
              ? "bg-red-900/30 border-red-700/50 text-red-300 hover:bg-red-900/50"
              : "bg-zinc-800/50 border-zinc-700/30 text-zinc-300 hover:border-red-700/30"
            }`}
          >
            {webcamActive ? "⏹ Stop Webcam" : "▶ Start Webcam"}
          </button>
          {modelLoading && <p className="text-[9px] text-yellow-500 mt-1 animate-pulse">Loading face model...</p>}
          {modelReady && <p className="text-[9px] text-green-500 mt-1">✓ Face tracking ready</p>}
        </div>

        {/* Characters */}
        <div className="p-3 border-b border-red-900/20 flex-1 min-h-0 overflow-y-auto">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Characters</h2>
          <div className="space-y-1 mb-3">
            {allChars.map(char => (
              <div key={char.id} className="flex items-center gap-1.5">
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className="w-8 h-8 rounded object-cover flex-shrink-0 border border-zinc-700/40 bg-zinc-900"
                  onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect fill='%23200' width='40' height='40'/%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%23c00' font-size='18'%3E👤%3C/text%3E%3C/svg%3E"; }}
                />
                <button
                  onClick={() => { setSelectedCharId(char.id); setCharacterMode(true); }}
                  className={`flex-1 text-left px-1.5 py-1 rounded text-xs transition-all border ${selectedCharId === char.id
                    ? "bg-red-900/20 border-red-700/40 text-red-300"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium truncate">{char.name}</div>
                  <div className="text-[9px] text-zinc-600">{char.category}</div>
                </button>
                {!char.isPreset && (
                  <button onClick={() => deleteLocalChar(char.id)} className="text-zinc-700 hover:text-red-500 text-[10px] px-0.5" title="Remove">✕</button>
                )}
              </div>
            ))}
          </div>

          {/* Upload from PC */}
          <div className="border-t border-zinc-800/40 pt-2">
            <p className="text-[9px] text-zinc-500 mb-1.5 uppercase tracking-wider font-bold">Upload from PC</p>
            {!uploadPending ? (
              <label className="flex items-center justify-center w-full py-2 rounded border border-dashed border-zinc-700/40 text-[11px] text-zinc-500 hover:border-red-700/40 hover:text-zinc-300 cursor-pointer transition-colors gap-1.5">
                <span>📁</span> Choose Image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="space-y-1.5">
                <img src={uploadPending} alt="preview" className="w-full h-20 object-cover rounded border border-zinc-700/30" />
                <input
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="Name this character..."
                  className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-700/40"
                />
                <div className="flex gap-1">
                  <button
                    onClick={confirmUpload}
                    disabled={!uploadName.trim()}
                    className="flex-1 py-1.5 rounded bg-red-900/30 border border-red-700/40 text-[11px] text-red-300 disabled:opacity-30 hover:bg-red-900/50 font-bold transition-colors"
                  >
                    ✓ Add
                  </button>
                  <button onClick={() => setUploadPending(null)} className="px-2 rounded border border-zinc-700/30 text-xs text-zinc-500 hover:text-zinc-300">✕</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance */}
        <div className="p-3">
          <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Performance</h2>
          <div className="space-y-1">
            {PERFORMANCE_MODES.map(m => (
              <button key={m.id} onClick={() => setPerfMode(m.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all border ${perfMode === m.id ? "bg-zinc-800/60 border-zinc-600/40 text-zinc-200" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                <span className={`font-bold ${m.color}`}>{m.label}</span>
                <span className="text-zinc-600 ml-1.5 text-[9px]">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col p-4 min-w-0">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-red-400" style={{ fontFamily: "Cinzel" }}>CHARACTER TRANSFORMER</h1>
            {faceDetected && characterMode && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-900/20 border border-green-800/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-400 font-mono">FACE LOCKED</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {characterMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">Opacity</span>
                <input type="range" min={20} max={100} value={charOpacity}
                  onChange={e => setCharOpacity(Number(e.target.value))}
                  className="w-20 accent-red-500" />
                <span className="text-[10px] text-zinc-400 w-6">{charOpacity}%</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Real</span>
              <button
                onClick={() => setCharacterMode(c => !c)}
                disabled={!webcamActive}
                className={`relative w-12 h-6 rounded-full border transition-all ${characterMode ? "bg-red-900/40 border-red-700/60" : "bg-zinc-800/60 border-zinc-700/30"} disabled:opacity-30`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${characterMode ? "left-6 bg-red-500" : "left-0.5 bg-zinc-500"}`} />
              </button>
              <span className="text-xs text-red-400">Character</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative rounded border border-red-900/30 overflow-hidden bg-black" style={{ boxShadow: "0 0 30px rgba(139,0,0,0.2)" }}>
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {!webcamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <div className="text-6xl text-zinc-700 mb-4">◉</div>
              <p className="text-sm text-zinc-400 mb-1">Real-time Face Tracking + Character Swap</p>
              <p className="text-xs text-zinc-600 mb-5">Upload any image from your PC → your face becomes that character live</p>
              <button onClick={startWebcam}
                className="px-8 py-2.5 rounded bg-red-900/30 border border-red-700/50 text-red-300 text-sm hover:bg-red-900/50 transition-colors font-bold">
                ▶ Start Webcam
              </button>
            </div>
          )}
          {webcamActive && characterMode && !selectedChar && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded bg-yellow-900/30 border border-yellow-700/30 text-xs text-yellow-400">
              ← Select or upload a character to apply
            </div>
          )}
          {webcamActive && characterMode && selectedChar && !faceDetected && modelReady && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded bg-blue-900/30 border border-blue-700/30 text-xs text-blue-400 animate-pulse">
              Looking for your face...
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {selectedChar && webcamActive && (
            <button
              onClick={() => setCharacterMode(true)}
              className="px-5 py-1.5 rounded text-xs font-bold border border-red-700/50 bg-red-900/20 text-red-300 hover:bg-red-900/40 transition-colors"
              style={{ fontFamily: "Orbitron" }}
            >
              ⚡ Apply Character
            </button>
          )}

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

          {lastRecordingUrl && (
            <a href={lastRecordingUrl} download="horror-studio.webm"
              className="px-4 py-1.5 rounded text-xs font-bold border border-green-700/40 text-green-400 hover:bg-green-900/20 transition-colors">
              ⬇ Download Video
            </a>
          )}

          <div className="ml-auto text-[10px] text-zinc-600">
            {selectedChar && <span>Active: <span className="text-zinc-400">{selectedChar.name}</span></span>}
          </div>
        </div>
      </div>

      {/* Effects sidebar */}
      <aside className="w-44 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col p-3 overflow-y-auto">
        <h2 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-3" style={{ fontFamily: "Cinzel" }}>Effects</h2>
        <div className="space-y-2 mb-4">
          {EFFECTS.map(ef => (
            <button key={ef.id} onClick={() => toggleEffect(ef.id)}
              className={`w-full text-left px-2 py-2 rounded text-xs transition-all border ${activeEffects.has(ef.id) ? "border-zinc-600/60 bg-zinc-800/40" : "border-zinc-800/30 text-zinc-500 hover:text-zinc-300"}`}
              style={activeEffects.has(ef.id) ? { boxShadow: `0 0 8px ${ef.color}33`, color: ef.color } : {}}
            >
              {ef.label}
            </button>
          ))}
        </div>

        <div className="border-t border-zinc-800/40 pt-3">
          <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Status</h3>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">Face</span>
              <span className={faceDetected ? "text-green-400" : "text-zinc-600"}>{faceDetected ? "✓ Locked" : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Model</span>
              <span className={modelReady ? "text-green-400" : modelLoading ? "text-yellow-400" : "text-zinc-600"}>
                {modelReady ? "Ready" : modelLoading ? "Loading" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Mode</span>
              <span className="text-zinc-400">{perfMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">FX</span>
              <span className="text-zinc-400">{activeEffects.size}</span>
            </div>
            <div className="mt-1">
              <span className="text-zinc-600">Character</span>
              <div className="text-zinc-300 truncate mt-0.5">{selectedChar?.name ?? "—"}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function drawCenteredOverlay(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  img: HTMLImageElement | undefined,
  name: string,
  opacity: number
) {
  const size = H * 0.55;
  const cx = W / 2;
  const cy = H * 0.38;
  ctx.save();
  ctx.globalAlpha = opacity / 100;
  if (img) {
    const aspect = img.naturalWidth / img.naturalHeight || 1;
    ctx.drawImage(img, cx - (size * aspect) / 2, cy - size / 2, size * aspect, size);
  } else {
    ctx.fillStyle = "rgba(139,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff4444";
    ctx.font = `bold ${size * 0.1}px Orbitron`;
    ctx.textAlign = "center";
    ctx.fillText(name, cx, cy + size * 0.08);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
