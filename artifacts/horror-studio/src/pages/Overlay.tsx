import { useEffect, useRef, useState } from "react";

interface AlertData {
  animation: string;
  text: string;
  color: string;
  font: string;
  duration: number;
}

export default function Overlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/stream/ws`;
    let ws: WebSocket;
    let timer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(url);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "alert_event" && msg.data) {
            const d = msg.data;
            setAlerts(prev => [
              ...prev,
              {
                animation: d.alertConfig?.animation ?? "bounce",
                text: (d.alertConfig?.textTemplate ?? "{username}!").replace("{username}", d.username),
                color: d.alertConfig?.color ?? "#ff2222",
                font: d.alertConfig?.font ?? "Exo 2",
                duration: d.alertConfig?.duration ?? 5,
              }
            ]);
          }
        } catch {}
      };
      ws.onclose = () => { timer = setTimeout(connect, 2000); };
    };

    connect();
    return () => { clearTimeout(timer); ws?.close(); };
  }, []);

  // Remove old alerts
  useEffect(() => {
    if (alerts.length === 0) return;
    const last = alerts[alerts.length - 1];
    const t = setTimeout(() => setAlerts(prev => prev.slice(1)), (last.duration ?? 5) * 1000);
    return () => clearTimeout(t);
  }, [alerts]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ background: "transparent" }}
    >
      <style>{`
        body { background: transparent !important; }
        * { box-sizing: border-box; }
      `}</style>
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="absolute bottom-16 left-0 right-0 flex justify-center"
          style={{ bottom: `${60 + i * 80}px` }}
        >
          <div
            className={`px-6 py-3 rounded-lg text-2xl font-black animate-bounce`}
            style={{
              fontFamily: `'${alert.font}', sans-serif`,
              color: alert.color,
              textShadow: `0 0 20px ${alert.color}, 0 0 40px ${alert.color}88`,
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${alert.color}44`,
              backdropFilter: "blur(8px)",
            }}
          >
            {alert.text}
          </div>
        </div>
      ))}
    </div>
  );
}
