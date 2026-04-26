import { useState } from "react";

const APPS = [
  {
    id: "comfyui",
    name: "ComfyUI",
    emoji: "🎨",
    desc: "Image & Video generation — Stable Diffusion, Flux, Wan2.1",
    color: "blue",
    borderColor: "border-blue-800/40",
    textColor: "text-blue-400",
    bgColor: "bg-blue-900/10",
    glowColor: "rgba(59,130,246,0.3)",
    defaultPort: 8188,
    pinokioCmd: "comfyui",
    status: "ready",
    setupSteps: [
      "Pinokio install karo: pinokio.computer",
      "ComfyUI dhundho Store mein",
      "Install click karo",
      "Start button dabao",
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    emoji: "🦙",
    desc: "Local LLM — Chat AI, Code AI, Horror characters",
    color: "green",
    borderColor: "border-green-800/40",
    textColor: "text-green-400",
    bgColor: "bg-green-900/10",
    glowColor: "rgba(34,197,94,0.3)",
    defaultPort: 11434,
    pinokioCmd: "ollama",
    status: "ready",
    setupSteps: [
      "ollama.com/download se install karo",
      "Git Bash: ollama pull llama3.2",
      "Ollama Chat page pe jao",
      "Connect karo",
    ],
  },
  {
    id: "voicebox",
    name: "Kokoro TTS",
    emoji: "🎙",
    desc: "AI Voice generation — Horror voices, TTS",
    color: "orange",
    borderColor: "border-orange-800/40",
    textColor: "text-orange-400",
    bgColor: "bg-orange-900/10",
    glowColor: "rgba(249,115,22,0.3)",
    defaultPort: 8880,
    pinokioCmd: "kokoro",
    status: "optional",
    setupSteps: [
      "Pinokio mein Kokoro-FastAPI dhundho",
      "Ya: pip install kokoro-fastapi",
      "Port 8880 pe chalu karo",
      "Voice Generator page pe connect karo",
    ],
  },
  {
    id: "automatic1111",
    name: "Automatic1111",
    emoji: "🖼",
    desc: "Stable Diffusion WebUI — Advanced image generation",
    color: "purple",
    borderColor: "border-purple-800/40",
    textColor: "text-purple-400",
    bgColor: "bg-purple-900/10",
    glowColor: "rgba(139,92,246,0.3)",
    defaultPort: 7860,
    pinokioCmd: "automatic1111",
    status: "optional",
    setupSteps: [
      "Pinokio mein AUTOMATIC1111 dhundho",
      "Install karo",
      "Start karo — port 7860",
      "Local Generator pe URL dalo",
    ],
  },
  {
    id: "wan",
    name: "Wan2.1 Video",
    emoji: "🎬",
    desc: "Best open-source video generation model",
    color: "red",
    borderColor: "border-red-800/40",
    textColor: "text-red-400",
    bgColor: "bg-red-900/10",
    glowColor: "rgba(220,38,38,0.3)",
    defaultPort: 8188,
    pinokioCmd: "wan2.1",
    status: "coming",
    setupSteps: [
      "ComfyUI install karo pehle",
      "Wan2.1 model download karo (~14GB)",
      "ComfyUI Wan workflow load karo",
      "Local Generator se use karo",
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Tunnel",
    emoji: "🌐",
    desc: "Local server ko internet pe expose karo — team access",
    color: "yellow",
    borderColor: "border-yellow-800/40",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-900/10",
    glowColor: "rgba(234,179,8,0.3)",
    defaultPort: null,
    pinokioCmd: null,
    status: "ready",
    setupSteps: [
      "cloudflared download karo",
      "Git Bash: cloudflared tunnel --url http://localhost:8188",
      "URL copy karo",
      "Local Generator mein paste karo",
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  ready: "text-green-400 border-green-700 bg-green-900/20",
  optional: "text-yellow-400 border-yellow-700 bg-yellow-900/20",
  coming: "text-zinc-500 border-zinc-700 bg-zinc-900/20",
};

const STATUS_LABELS: Record<string, string> = {
  ready: "✓ Ready",
  optional: "Optional",
  coming: "Coming Soon",
};

export default function PinokioLauncher() {
  const [expandedApp, setExpandedApp] = useState<string | null>("comfyui");
  const [portChecks, setPortChecks] = useState<Record<string, "checking" | "online" | "offline">>({});

  const checkPort = async (app: typeof APPS[0]) => {
    if (!app.defaultPort) return;
    setPortChecks(prev => ({ ...prev, [app.id]: "checking" }));
    try {
      const res = await fetch(`http://localhost:${app.defaultPort}`, { signal: AbortSignal.timeout(2000) });
      setPortChecks(prev => ({ ...prev, [app.id]: res.ok || res.status < 500 ? "online" : "offline" }));
    } catch {
      setPortChecks(prev => ({ ...prev, [app.id]: "offline" }));
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#04040a] text-white">
      {/* Header */}
      <div className="border-b border-yellow-900/30 px-6 py-4 bg-[#06060e]">
        <h1 className="text-xl font-black text-yellow-400" style={{ fontFamily: "Cinzel" }}>
          AI APP LAUNCHER
        </h1>
        <p className="text-xs text-zinc-600">Local AI apps manage karo — Pinokio / Manual setup</p>
      </div>

      <div className="p-4 space-y-4">

        {/* Pinokio Banner */}
        <div className="rounded border border-yellow-800/40 bg-yellow-900/10 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-yellow-400 mb-1">🚀 Pinokio — One Click Launcher</h2>
            <p className="text-xs text-zinc-500">Sab AI apps ek jagah install aur manage karo. Windows pe best option.</p>
          </div>
          <a
            href="https://pinokio.computer"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded bg-yellow-700 hover:bg-yellow-600 text-black text-xs font-black transition-all shrink-0"
          >
            Download Pinokio →
          </a>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 gap-3">
          {APPS.map((app) => (
            <div
              key={app.id}
              className={`rounded border ${app.borderColor} ${app.bgColor} overflow-hidden transition-all`}
              style={{ boxShadow: expandedApp === app.id ? `0 0 12px ${app.glowColor}` : "none" }}
            >
              {/* App Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{app.emoji}</span>
                  <div>
                    <div className={`font-bold text-sm ${app.textColor}`} style={{ fontFamily: "Cinzel" }}>
                      {app.name}
                    </div>
                    <div className="text-xs text-zinc-500">{app.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Port check */}
                  {app.defaultPort && (
                    <button
                      onClick={(e) => { e.stopPropagation(); checkPort(app); }}
                      className="px-2 py-1 rounded border border-zinc-700 text-zinc-500 text-xs hover:border-zinc-500 transition-all"
                    >
                      {portChecks[app.id] === "checking" ? "..." :
                       portChecks[app.id] === "online" ? "🟢 Online" :
                       portChecks[app.id] === "offline" ? "🔴 Offline" :
                       `Check :${app.defaultPort}`}
                    </button>
                  )}
                  <span className={`px-2 py-1 rounded border text-xs ${STATUS_COLORS[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                  <span className={`text-xs ${app.textColor} transition-transform ${expandedApp === app.id ? "rotate-90" : ""}`}>→</span>
                </div>
              </div>

              {/* Expanded Setup */}
              {expandedApp === app.id && (
                <div className="px-4 pb-4 border-t border-zinc-800/40">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-widest mt-3 mb-2">Setup Steps</h3>
                  <div className="space-y-2">
                    {app.setupSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border ${app.borderColor} ${app.textColor} flex items-center justify-center text-xs shrink-0 mt-0.5`}>
                          {i + 1}
                        </div>
                        <p className="text-xs text-zinc-400">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick links */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {app.id === "comfyui" && (
                      <a href="https://github.com/comfyanonymous/ComfyUI" target="_blank" rel="noopener noreferrer"
                        className={`px-3 py-1.5 rounded border ${app.borderColor} ${app.textColor} text-xs hover:opacity-80`}>
                        GitHub →
                      </a>
                    )}
                    {app.id === "ollama" && (
                      <>
                        <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer"
                          className={`px-3 py-1.5 rounded border ${app.borderColor} ${app.textColor} text-xs hover:opacity-80`}>
                          Download →
                        </a>
                        <a href="/ollama-chat"
                          className={`px-3 py-1.5 rounded border ${app.borderColor} ${app.textColor} text-xs hover:opacity-80`}>
                          Open Chat →
                        </a>
                      </>
                    )}
                    {app.id === "voicebox" && (
                      <a href="/voice-generator"
                        className={`px-3 py-1.5 rounded border ${app.borderColor} ${app.textColor} text-xs hover:opacity-80`}>
                        Voice Generator →
                      </a>
                    )}
                    {app.id === "cloudflare" && (
                      <a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" target="_blank" rel="noopener noreferrer"
                        className={`px-3 py-1.5 rounded border ${app.borderColor} ${app.textColor} text-xs hover:opacity-80`}>
                        Download cloudflared →
                      </a>
                    )}
                    {app.defaultPort && (
                      <a href={`http://localhost:${app.defaultPort}`} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-500 text-xs hover:border-zinc-500">
                        Open localhost:{app.defaultPort} →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* System Info */}
        <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-4">
          <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Tumhara Setup</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 text-center">
              <div className="text-lg mb-1">⚡</div>
              <div className="text-xs font-bold text-zinc-300">RTX 5070</div>
              <div className="text-xs text-zinc-600">GPU Ready</div>
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 text-center">
              <div className="text-lg mb-1">💾</div>
              <div className="text-xs font-bold text-zinc-300">16GB RAM</div>
              <div className="text-xs text-zinc-600">Sufficient</div>
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 text-center">
              <div className="text-lg mb-1">💿</div>
              <div className="text-xs font-bold text-zinc-300">D: Drive</div>
              <div className="text-xs text-zinc-600">AI Data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
