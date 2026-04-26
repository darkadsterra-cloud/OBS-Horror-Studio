import { useState, useRef } from "react";

const VOICES = [
  { id: "horror", name: "Horror Host", emoji: "👻", desc: "Dark, creepy, dramatic", speed: 0.8, pitch: 0.7 },
  { id: "vampire", name: "Vampire Lord", emoji: "🧛", desc: "Deep, aristocratic", speed: 0.75, pitch: 0.6 },
  { id: "demon", name: "Demon", emoji: "😈", desc: "Raspy, menacing", speed: 0.9, pitch: 0.5 },
  { id: "ghost", name: "Ghost", emoji: "👁", desc: "Whisper, ethereal", speed: 0.85, pitch: 1.2 },
  { id: "narrator", name: "Epic Narrator", emoji: "🎙", desc: "Cinematic, powerful", speed: 0.9, pitch: 0.8 },
  { id: "normal", name: "Normal", emoji: "🤖", desc: "Standard TTS", speed: 1.0, pitch: 1.0 },
];

const PRESETS = [
  "Welcome to my domain, mortal...",
  "The darkness welcomes you.",
  "You should not have come here.",
  "Mwahahaha! None can escape!",
  "Subscribe... or face the consequences.",
  "Tonight, we feast on your attention.",
];

export default function VoiceGenerator() {
  const [serverUrl, setServerUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem("voicebox_url") || "http://localhost:8880" : "http://localhost:8880"
  );
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(0.8);
  const [pitch, setPitch] = useState(0.7);
  const [history, setHistory] = useState<{ text: string; url: string; voice: string }[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Browser TTS fallback
  const [useBrowserTTS, setUseBrowserTTS] = useState(false);

  const testConnection = async () => {
    setConnecting(true);
    setError("");
    try {
      const res = await fetch(`${serverUrl}/health`);
      if (res.ok) {
        setConnected(true);
        localStorage.setItem("voicebox_url", serverUrl);
      } else {
        setError("Server response galat hai");
        setConnected(false);
      }
    } catch {
      setError("Voicebox connect nahi hua — Browser TTS use kar sakte ho abhi");
      setConnected(false);
    }
    setConnecting(false);
  };

  const generateVoice = async () => {
    if (!text.trim()) return alert("Text likho pehle!");

    setLoading(true);
    setError("");
    setAudioUrl(null);

    if (useBrowserTTS || !connected) {
      // Browser TTS fallback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = pitch;
      utterance.volume = 1;
      const voices = speechSynthesis.getVoices();
      const deepVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.lang === "en-US");
      if (deepVoice) utterance.voice = deepVoice;
      speechSynthesis.speak(utterance);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/v1/audio/speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "kokoro",
          input: text,
          voice: selectedVoice.id,
          speed: speed,
          response_format: "mp3",
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setHistory(prev => [{ text: text.slice(0, 40) + "...", url, voice: selectedVoice.name }, ...prev.slice(0, 9)]);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err: any) {
      setError(err.message || "Error aaya");
    }
    setLoading(false);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "horror-voice.mp3";
    a.click();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#04040a] text-white">
      {/* Header */}
      <div className="border-b border-orange-900/30 px-6 py-4 flex items-center justify-between bg-[#06060e]">
        <div>
          <h1 className="text-xl font-black text-orange-400" style={{ fontFamily: "Cinzel" }}>
            AI VOICE GENERATOR
          </h1>
          <p className="text-xs text-zinc-600">Horror voices for streaming — Voicebox / Browser TTS</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : useBrowserTTS ? "bg-yellow-500" : "bg-red-500"}`} />
          <span className="text-xs text-zinc-400">
            {connected ? "Voicebox Connected" : useBrowserTTS ? "Browser TTS" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-12 gap-4">
        {/* LEFT */}
        <div className="col-span-3 space-y-4">

          {/* Server */}
          <div className="rounded border border-orange-900/40 bg-orange-900/10 p-3">
            <label className="text-xs text-orange-400 uppercase tracking-widest block mb-2">Voicebox Server</label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:8880"
              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-xs focus:outline-none focus:border-orange-700 mb-2"
            />
            <button
              onClick={testConnection}
              disabled={connecting}
              className={`w-full py-2 rounded text-xs font-bold border transition-all mb-2 ${
                connected
                  ? "bg-green-900/40 border-green-700 text-green-300"
                  : "bg-orange-900/30 border-orange-700 text-orange-300 hover:bg-orange-900/50"
              }`}
            >
              {connecting ? "Connecting..." : connected ? "✓ Connected" : "Connect"}
            </button>

            {/* Browser TTS toggle */}
            <button
              onClick={() => setUseBrowserTTS(!useBrowserTTS)}
              className={`w-full py-2 rounded text-xs font-bold border transition-all ${
                useBrowserTTS
                  ? "bg-yellow-900/40 border-yellow-600 text-yellow-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-yellow-700"
              }`}
            >
              {useBrowserTTS ? "✓ Browser TTS ON" : "Browser TTS (No Setup)"}
            </button>

            {!connected && !useBrowserTTS && (
              <div className="mt-2 text-xs text-zinc-600 space-y-1">
                <p>Setup: github.com/remsky/Kokoro-FastAPI</p>
                <p className="text-yellow-600">Abhi ke liye Browser TTS use karo ↑</p>
              </div>
            )}
          </div>

          {/* Voice Select */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Voice Character</label>
            <div className="space-y-1">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVoice(v); setSpeed(v.speed); setPitch(v.pitch); }}
                  className={`w-full text-left px-2 py-2 rounded text-xs border transition-all ${
                    selectedVoice.id === v.id
                      ? "bg-orange-900/40 border-orange-600 text-orange-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <span className="mr-2">{v.emoji}</span>
                  <span className="font-bold">{v.name}</span>
                  <div className="text-xs opacity-50 ml-5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3 space-y-3">
            <label className="text-xs text-zinc-500 uppercase tracking-widest block">Controls</label>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Speed: <span className="text-zinc-300">{speed.toFixed(2)}</span></label>
              <input type="range" min={0.5} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full accent-orange-600" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Pitch: <span className="text-zinc-300">{pitch.toFixed(2)}</span></label>
              <input type="range" min={0.3} max={2} step={0.05} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full accent-orange-600" />
            </div>
          </div>
        </div>

        {/* MIDDLE */}
        <div className="col-span-6 space-y-4">

          {/* Presets */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Quick Presets</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setText(p)}
                  className="text-left px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:border-orange-700 hover:text-orange-300 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Text</label>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Yahan apna horror script likho..."
              className="w-full p-3 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-orange-700 resize-none"
            />
            <div className="text-xs text-zinc-700 mt-1 text-right">{text.length} chars</div>
          </div>

          {/* Generate */}
          <button
            onClick={generateVoice}
            disabled={loading || !text.trim()}
            className={`w-full py-4 rounded text-sm font-black border transition-all ${
              loading
                ? "bg-orange-900/30 border-orange-700 text-orange-400 cursor-wait"
                : "bg-orange-700 hover:bg-orange-600 border-orange-500 text-white"
            }`}
            style={{ fontFamily: "Cinzel" }}
          >
            {loading ? "🎙 Generating..." : `🎙 GENERATE ${selectedVoice.emoji} ${selectedVoice.name} VOICE`}
          </button>

          {error && (
            <div className="p-3 rounded border border-red-700 bg-red-900/20 text-red-300 text-xs">{error}</div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="rounded border border-orange-900/40 bg-orange-900/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-orange-400 uppercase tracking-widest">Generated Audio</label>
                <button onClick={downloadAudio} className="px-3 py-1 rounded bg-green-900/40 border border-green-700 text-green-300 text-xs font-bold">
                  ↓ Download
                </button>
              </div>
              <audio ref={audioRef} controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>

        {/* RIGHT — History */}
        <div className="col-span-3">
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3 h-full">
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-3">History</label>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <div className="text-3xl">🎙</div>
                <p className="text-zinc-600 text-xs">Generated voices yahan aayengi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="rounded border border-zinc-800 bg-zinc-900/40 p-2">
                    <div className="text-xs text-zinc-400 mb-1 truncate">{h.text}</div>
                    <div className="text-xs text-orange-500 mb-1">{h.voice}</div>
                    <audio src={h.url} controls className="w-full h-8" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
