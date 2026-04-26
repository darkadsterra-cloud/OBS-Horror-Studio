import { useState, useEffect, useRef } from "react";
import { useListAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert, useTriggerAlert, useGetRecentEvents } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const EVENT_TYPES = ["follow", "gift", "donation", "subscription", "like", "raid", "chat"];
const ANIMATIONS = ["bounce", "glitch", "fire-glow", "neon-pulse", "shake", "cinematic-fade", "flicker"];
const FONTS = ["Exo 2", "Bebas Neue", "Cinzel", "Creepster", "Orbitron", "Rajdhani"];

const PLATFORM_TABS = [
  { id: "tiktok", label: "TikTok", color: "text-pink-400" },
  { id: "youtube", label: "YouTube", color: "text-red-400" },
  { id: "twitch", label: "Twitch", color: "text-purple-400" },
];

const EVENT_COLORS: Record<string, string> = {
  follow: "#00e5ff",
  gift: "#ffd700",
  donation: "#ffd700",
  subscription: "#e040fb",
  like: "#ff4081",
  raid: "#ff9100",
  chat: "#69ff47",
};

interface AlertPreview {
  animation: string;
  text: string;
  color: string;
  font: string;
}

export default function StreamAlerts() {
  const [activePlatform, setActivePlatform] = useState("tiktok");
  const [platformsConnected, setPlatformsConnected] = useState<Record<string, boolean>>({ tiktok: false, youtube: false, twitch: false });
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [preview, setPreview] = useState<AlertPreview | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animFrameRef = useRef<number>(0);

  const { data: alertsRaw } = useListAlerts();
  const alerts = Array.isArray(alertsRaw) ? alertsRaw : [];
  const { data: eventsRaw } = useGetRecentEvents();
  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();
  const triggerAlert = useTriggerAlert();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    eventType: "follow",
    threshold: "",
    animation: "bounce",
    soundEffect: "",
    textTemplate: "{username} just followed!",
    font: "Exo 2",
    color: "#00e5ff",
    duration: "5",
    isActive: true,
  });

  // WebSocket connection
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/stream/ws`;
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(url);
      ws.onopen = () => console.log("WS connected");
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "alert_event" && msg.data) {
            const d = msg.data;
            setPreview({
              animation: d.alertConfig?.animation ?? "bounce",
              text: (d.alertConfig?.textTemplate ?? "{username}!").replace("{username}", d.username),
              color: d.alertConfig?.color ?? "#ff2222",
              font: d.alertConfig?.font ?? "Exo 2",
            });
            setPreviewKey(k => k + 1);
            qc.invalidateQueries({ queryKey: ["getRecentEvents"] });
          }
        } catch {}
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
      wsRef.current = ws;
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [qc]);

  // Canvas alert animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    cancelAnimationFrame(animFrameRef.current);
    let frame = 0;
    const duration = 5 * 60;

    const render = () => {
      frame++;
      canvas.width = 600;
      canvas.height = 120;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = Math.min(frame / duration, 1);
      let alpha = 1;
      if (progress > 0.7) alpha = 1 - ((progress - 0.7) / 0.3);

      ctx.globalAlpha = alpha;
      ctx.font = `bold 36px '${preview.font}', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = preview.color;
      ctx.shadowColor = preview.color;
      ctx.shadowBlur = 20 + Math.sin(frame * 0.1) * 10;

      let x = canvas.width / 2;
      let y = canvas.height / 2;

      if (preview.animation === "bounce") {
        y = canvas.height / 2 - Math.max(0, 20 * Math.exp(-frame * 0.05) * Math.abs(Math.sin(frame * 0.3)));
      } else if (preview.animation === "shake") {
        x += (Math.random() - 0.5) * 4;
      } else if (preview.animation === "glitch") {
        if (Math.random() > 0.92) x += (Math.random() - 0.5) * 8;
      }

      ctx.fillText(preview.text, x, y);

      if (frame < duration) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [preview, previewKey]);

  const handleSave = async () => {
    const data = {
      name: form.name || `${form.eventType} Alert`,
      eventType: form.eventType,
      threshold: form.threshold ? Number(form.threshold) : undefined,
      animation: form.animation,
      soundEffect: form.soundEffect || undefined,
      textTemplate: form.textTemplate,
      font: form.font,
      color: form.color,
      duration: Number(form.duration),
      isActive: form.isActive,
    };

    if (editingAlert) {
      await updateAlert.mutateAsync({ id: editingAlert.id, data });
    } else {
      await createAlert.mutateAsync({ data });
    }
    qc.invalidateQueries({ queryKey: ["listAlerts"] });
    setEditingAlert(null);
    setForm({ name: "", eventType: "follow", threshold: "", animation: "bounce", soundEffect: "", textTemplate: "{username} just followed!", font: "Exo 2", color: "#00e5ff", duration: "5", isActive: true });
  };

  const handleTestAlert = async (eventType: string) => {
    await triggerAlert.mutateAsync({
      data: { eventType, username: "TestUser666", value: 100, message: "Test alert from studio!" }
    });
    qc.invalidateQueries({ queryKey: ["getRecentEvents"] });
  };

  const handleDelete = async (id: string) => {
    await deleteAlert.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["listAlerts"] });
  };

  const startEdit = (alert: any) => {
    setEditingAlert(alert);
    setForm({
      name: alert.name,
      eventType: alert.eventType,
      threshold: alert.threshold?.toString() ?? "",
      animation: alert.animation,
      soundEffect: alert.soundEffect ?? "",
      textTemplate: alert.textTemplate,
      font: alert.font,
      color: alert.color,
      duration: alert.duration?.toString() ?? "5",
      isActive: alert.isActive,
    });
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel */}
      <aside className="w-56 flex-shrink-0 border-r border-red-900/20 bg-[#050508] flex flex-col overflow-y-auto">
        <div className="p-3 border-b border-red-900/20">
          <h2 className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-3" style={{ fontFamily: "Cinzel" }}>Stream Sources</h2>
          <div className="space-y-2">
            {PLATFORM_TABS.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded bg-zinc-800/30 border border-zinc-800/40">
                <span className={`text-xs font-bold ${p.color}`}>{p.label}</span>
                <button
                  onClick={() => setPlatformsConnected(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                  className={`w-8 h-4 rounded-full border transition-all ${platformsConnected[p.id]
                    ? "bg-green-900/40 border-green-700/60"
                    : "bg-zinc-800/60 border-zinc-700/30"
                    }`}
                >
                  <div className={`w-3 h-3 rounded-full mx-0.5 transition-all ${platformsConnected[p.id] ? "translate-x-4 bg-green-400" : "bg-zinc-500"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 flex-1">
          <h2 className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "Cinzel" }}>Recent Events</h2>
          <div className="space-y-1.5 overflow-y-auto max-h-64">
            {events.map(ev => (
              <div key={ev.id} className="px-2 py-1.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-[10px]">
                <div className="font-bold" style={{ color: EVENT_COLORS[ev.eventType] ?? "#fff" }}>
                  {ev.eventType.toUpperCase()}
                </div>
                <div className="text-zinc-300">{ev.username}</div>
                <div className="text-zinc-600">{new Date(ev.triggeredAt).toLocaleTimeString()}</div>
              </div>
            ))}
            {events.length === 0 && <p className="text-[10px] text-zinc-600">No events yet</p>}
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/40">
            <h3 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2">Test Events</h3>
            <div className="grid grid-cols-2 gap-1">
              {EVENT_TYPES.slice(0, 6).map(et => (
                <button
                  key={et}
                  onClick={() => handleTestAlert(et)}
                  className="px-1.5 py-1 rounded text-[9px] border border-zinc-800/40 hover:border-cyan-700/40 text-zinc-500 hover:text-cyan-300 transition-colors"
                >
                  {et}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-cyan-400" style={{ fontFamily: "Cinzel" }}>STREAM ALERT ENGINE</h1>
        </div>

        {/* Alert preview canvas */}
        <div
          className="rounded border border-cyan-900/30 bg-[#050510] mb-3 overflow-hidden relative"
          style={{ height: 130, boxShadow: "0 0 20px rgba(0,180,255,0.1)" }}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" key={previewKey} />
          {!preview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-zinc-600">Alert preview will appear here when triggered</p>
            </div>
          )}
          <div className="absolute top-2 right-2 text-[9px] text-zinc-700 font-mono">PREVIEW</div>
        </div>

        {/* OBS URL */}
        <div className="panel-glass rounded border border-zinc-800/40 p-3 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest">OBS Overlay URL</h3>
            <span className="text-[9px] text-zinc-600">Browser Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/40 rounded px-2 py-1.5 font-mono text-xs text-green-400 border border-zinc-800">
              {window.location.origin}/overlay/my-stream
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/overlay/my-stream`)}
              className="px-2 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{alerts.length} Configured Alerts</h3>
          <div className="space-y-1.5">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-center gap-3 px-3 py-2 rounded border border-zinc-800/40 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: EVENT_COLORS[alert.eventType] ?? "#fff", boxShadow: `0 0 6px ${EVENT_COLORS[alert.eventType] ?? "#fff"}` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-200 truncate">{alert.name}</div>
                  <div className="text-[9px] text-zinc-500">{alert.eventType} · {alert.animation}</div>
                </div>
                <div className={`text-[9px] px-1.5 py-0.5 rounded border ${alert.isActive ? "text-green-400 border-green-800/40 bg-green-900/10" : "text-zinc-500 border-zinc-800/30"}`}>
                  {alert.isActive ? "Active" : "Off"}
                </div>
                <button onClick={() => startEdit(alert)} className="text-[10px] text-zinc-500 hover:text-cyan-400 px-1 transition-colors">Edit</button>
                <button onClick={() => handleDelete(alert.id)} className="text-[10px] text-zinc-500 hover:text-red-400 px-1 transition-colors">Del</button>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-6 text-zinc-600 text-xs">No alerts configured. Create one using the panel.</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Alert Editor */}
      <aside className="w-60 flex-shrink-0 border-l border-red-900/20 bg-[#050508] flex flex-col p-3 overflow-y-auto">
        <h2 className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-3" style={{ fontFamily: "Cinzel" }}>
          {editingAlert ? "Edit Alert" : "New Alert"}
        </h2>

        <div className="space-y-2 text-xs flex-1">
          <div>
            <label className="block text-zinc-600 mb-0.5">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Follow Alert"
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-700/40 text-xs"
            />
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Event Type</label>
            <select
              value={form.eventType}
              onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 focus:outline-none text-xs"
            >
              {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Threshold (optional)</label>
            <input
              value={form.threshold}
              onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
              placeholder="e.g. 100"
              type="number"
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 placeholder:text-zinc-600 focus:outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Message Template</label>
            <input
              value={form.textTemplate}
              onChange={e => setForm(f => ({ ...f, textTemplate: e.target.value }))}
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 focus:outline-none text-xs"
            />
            <div className="text-[9px] text-zinc-600 mt-0.5">Use {"{username}"} for name</div>
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Animation</label>
            <select
              value={form.animation}
              onChange={e => setForm(f => ({ ...f, animation: e.target.value }))}
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 focus:outline-none text-xs"
            >
              {ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Font</label>
            <select
              value={form.font}
              onChange={e => setForm(f => ({ ...f, font: e.target.value }))}
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 focus:outline-none text-xs"
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-8 h-6 rounded border border-zinc-700/30 bg-zinc-800/60 cursor-pointer"
              />
              <input
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="flex-1 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-zinc-600 mb-0.5">Duration (secs)</label>
            <input
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              type="number"
              min="1"
              max="30"
              className="w-full px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-200 focus:outline-none text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`w-8 h-4 rounded-full border transition-all ${form.isActive ? "bg-green-900/40 border-green-700/60" : "bg-zinc-800/60 border-zinc-700/30"}`}
            >
              <div className={`w-3 h-3 rounded-full mx-0.5 transition-all ${form.isActive ? "translate-x-4 bg-green-400" : "bg-zinc-500"}`} />
            </button>
            <span className="text-zinc-500">Active</span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <button
            onClick={handleSave}
            className="w-full py-2 rounded bg-cyan-900/20 border border-cyan-700/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900/40 transition-colors"
          >
            {editingAlert ? "Update Alert" : "Create Alert"}
          </button>
          {editingAlert && (
            <button
              onClick={() => { setEditingAlert(null); setForm({ name: "", eventType: "follow", threshold: "", animation: "bounce", soundEffect: "", textTemplate: "{username} just followed!", font: "Exo 2", color: "#00e5ff", duration: "5", isActive: true }); }}
              className="w-full py-1.5 rounded border border-zinc-700/30 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
