import { Link } from "wouter";
import { useGetStreamStats, useGetRecentEvents } from "@workspace/api-client-react";

const TOOLS = [
  {
    path: "/character-transformer",
    icon: "◉",
    title: "Character Transformer",
    desc: "Transform your webcam feed with AI character overlays using real-time face & body tracking",
    color: "red",
    borderColor: "border-red-800/40",
    glowColor: "rgba(220,20,60,0.3)",
    textColor: "text-red-400",
    bgColor: "bg-red-900/10",
  },
  {
    path: "/text-animator",
    icon: "◎",
    title: "Text Overlay Animator",
    desc: "100+ cinematic templates with real-time animated text overlays for streaming",
    color: "purple",
    borderColor: "border-purple-800/40",
    glowColor: "rgba(139,0,255,0.3)",
    textColor: "text-purple-400",
    bgColor: "bg-purple-900/10",
  },
  {
    path: "/stream-alerts",
    icon: "◆",
    title: "Stream Alert Engine",
    desc: "Real-time animated alerts for TikTok, YouTube and Twitch events with OBS integration",
    color: "cyan",
    borderColor: "border-cyan-800/40",
    glowColor: "rgba(0,180,255,0.3)",
    textColor: "text-cyan-400",
    bgColor: "bg-cyan-900/10",
  },
  {
    path: "/image-generator",
    icon: "◑",
    title: "AI Image Generator",
    desc: "Generate cinematic AI images with style presets — Horror, Cyberpunk, Superhero and more",
    color: "red",
    borderColor: "border-red-800/40",
    glowColor: "rgba(220,20,60,0.3)",
    textColor: "text-red-400",
    bgColor: "bg-red-900/10",
  },
  {
    path: "/local-generator",
    icon: "⚡",
    title: "Local AI Studio",
    desc: "RTX 5070 powered image & video generation — unlimited, free, via your local ComfyUI server",
    color: "purple",
    borderColor: "border-purple-800/40",
    glowColor: "rgba(139,0,255,0.3)",
    textColor: "text-purple-400",
    bgColor: "bg-purple-900/10",
  },
];

const EVENT_COLORS: Record<string, string> = {
  follow: "text-cyan-400",
  gift: "text-yellow-400",
  donation: "text-yellow-400",
  subscription: "text-purple-400",
  like: "text-pink-400",
  raid: "text-orange-400",
  default: "text-zinc-400",
};

export default function Dashboard() {
  const { data: stats } = useGetStreamStats();
  const { data: events } = useGetRecentEvents();

  const statCards = [
    { label: "Templates", value: stats?.totalTemplates ?? 0, color: "text-purple-400" },
    { label: "Characters", value: stats?.totalCharacters ?? 0, color: "text-red-400" },
    { label: "Active Alerts", value: stats?.activeAlerts ?? 0, color: "text-cyan-400" },
    { label: "Events Fired", value: stats?.recentEventCount ?? 0, color: "text-yellow-400" },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-black mb-1 text-red-400"
          style={{ fontFamily: "Cinzel, serif", textShadow: "0 0 20px rgba(220,20,60,0.7), 0 0 40px rgba(220,20,60,0.3)" }}
        >
          COMMAND CENTER
        </h1>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Horror Animation Studio — Creepy-Zone AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="panel-glass rounded p-3"
          >
            <div className={`text-2xl font-bold mb-0.5 ${s.color}`} style={{ fontFamily: "Orbitron, sans-serif" }}>
              {s.value}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Tool cards */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Studio Tools</h2>
          {TOOLS.map((tool) => (
            <Link key={tool.path} href={tool.path}>
              <div
                className={`${tool.bgColor} rounded border ${tool.borderColor} p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] group`}
                style={{ boxShadow: `0 0 12px ${tool.glowColor}` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${tool.textColor} mt-0.5`}>{tool.icon}</div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-sm mb-1 ${tool.textColor} group-hover:brightness-125 transition-all`} style={{ fontFamily: "Cinzel, serif" }}>
                      {tool.title}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{tool.desc}</p>
                  </div>
                  <span className={`text-xs ${tool.textColor} opacity-60 group-hover:opacity-100 transition-opacity mt-1`}>→</span>
                </div>
              </div>
            </Link>
          ))}

          {/* OBS Info */}
          <div className="panel-glass rounded border border-zinc-800/40 p-4 mt-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">OBS Integration</h3>
            <p className="text-xs text-zinc-600 mb-2">Add your overlay as a browser source in OBS Studio:</p>
            <div className="bg-black/40 rounded px-3 py-2 font-mono text-xs text-green-400 border border-zinc-800">
              {window.location.origin}/overlay/my-stream
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="panel-glass rounded border border-red-900/20 p-3">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 blink" />
            Live Activity
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-[400px]">
            {Array.isArray(events) && events.length > 0 ? (
              events.map((ev) => (
                <div key={ev.id} className="border-b border-zinc-800/40 pb-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] font-bold uppercase ${EVENT_COLORS[ev.eventType] ?? EVENT_COLORS.default}`}>
                      {ev.eventType}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300">{ev.username}</div>
                  {ev.value && <div className="text-[10px] text-yellow-600">{ev.value} coins</div>}
                  {ev.message && <div className="text-[10px] text-zinc-500 truncate">{ev.message}</div>}
                  <div className="text-[9px] text-zinc-700 mt-0.5">
                    {new Date(ev.triggeredAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-2xl text-zinc-700 mb-2">◈</div>
                <p className="text-xs text-zinc-600">No events yet</p>
                <p className="text-[10px] text-zinc-700 mt-1">Events appear when alerts trigger</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

