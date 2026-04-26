import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { path: "/", label: "Command Center", icon: "◈" },
  { path: "/character-transformer", label: "Character Transform", icon: "◉" },
  { path: "/text-animator", label: "Text Animator", icon: "◎" },
  { path: "/stream-alerts", label: "Stream Alerts", icon: "◆" },
  { path: "/image-editor", label: "Image Editor", icon: "◧" },
  { path: "/image-generator", label: "AI Image Generator", icon: "◑" },
  { path: "/local-generator", label: "Local Generator ⚡", icon: "⚡" },
];
export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ${collapsed ? "w-14" : "w-56"} flex-shrink-0 border-r border-red-900/30 bg-[#050508] relative`}
        style={{ boxShadow: "4px 0 20px rgba(139,0,0,0.15)" }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2 px-3 py-4 border-b border-red-900/30 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center bg-red-900/30 border border-red-700/50"
            style={{ boxShadow: "0 0 12px rgba(220,20,60,0.4)" }}>
            <span className="text-red-400 text-lg">☠</span>
          </div>
          {!collapsed && (
            <div>
              <div className="text-xs font-bold text-red-400 leading-tight" style={{ fontFamily: "Cinzel, serif", textShadow: "0 0 8px rgba(220,20,60,0.6)" }}>
                HORROR
              </div>
              <div className="text-[9px] text-red-900 uppercase tracking-widest">Animation Studio</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 mx-2 mb-1 rounded cursor-pointer transition-all duration-200
                    ${active
                      ? "bg-red-900/25 border border-red-700/40 text-red-300"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                    }`}
                  style={active ? { boxShadow: "0 0 12px rgba(220,20,60,0.2)" } : {}}
                >
                  <span className={`text-base flex-shrink-0 ${active ? "text-red-400" : "text-zinc-600"}`}>{item.icon}</span>
                  {!collapsed && (
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  )}
                  {active && !collapsed && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-red-500" style={{ boxShadow: "0 0 6px rgba(220,20,60,0.8)" }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="mx-2 mb-3 px-2 py-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/5 border border-transparent text-xs transition-colors"
        >
          {collapsed ? "»" : "«"}
        </button>

        {/* Bottom particle decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden opacity-30">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-red-600"
              style={{
                left: `${20 + i * 20}%`,
                bottom: `${Math.random() * 60}%`,
                animation: `ember-float ${3 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-red-900/20 bg-[#06060a]/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Creepy-Zone AI</span>
            <span className="text-zinc-700">|</span>
            <span className="text-[10px] text-red-700 uppercase tracking-widest">Studio v1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-900/20 border border-green-800/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 blink" />
              <span className="text-[10px] text-green-400">LIVE</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
