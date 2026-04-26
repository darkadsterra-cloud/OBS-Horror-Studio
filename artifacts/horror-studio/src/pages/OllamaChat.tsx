import { useState, useRef, useEffect } from "react";

const CHARACTERS = [
  { id: "horror", name: "Horror Host", avatar: "👻", system: "You are a creepy horror host named Viktor. Speak in a dark, mysterious, theatrical way. Use horror themes and dramatic pauses. Keep responses short and atmospheric." },
  { id: "vampire", name: "Vampire Lord", avatar: "🧛", system: "You are an ancient vampire lord. Speak formally and eloquently with a dark aristocratic tone. Reference your centuries of existence." },
  { id: "demon", name: "Demon", avatar: "😈", system: "You are a chaos demon. Speak cryptically, make dark jokes, reference hellish things. Be menacing but entertaining." },
  { id: "assistant", name: "AI Assistant", avatar: "🤖", system: "You are a helpful AI assistant." },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OllamaChat() {
  const [serverUrl, setServerUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem("ollama_url") || "http://localhost:11434" : "http://localhost:11434"
  );
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama3.2");
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const testConnection = async () => {
    setConnecting(true);
    setError("");
    try {
      const res = await fetch(`${serverUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const modelList = data.models?.map((m: any) => m.name) || [];
        setModels(modelList);
        if (modelList.length > 0) setSelectedModel(modelList[0]);
        setConnected(true);
        localStorage.setItem("ollama_url", serverUrl);
      } else {
        setError("Server response galat hai");
        setConnected(false);
      }
    } catch {
      setError("Connect nahi hua — Ollama chalu hai? (ollama serve)");
      setConnected(false);
    }
    setConnecting(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!connected) return alert("Pehle Ollama connect karo!");

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${serverUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: selectedChar.system },
            ...newMessages,
          ],
          stream: false,
        }),
      });

      const data = await res.json();
      const reply = data.message?.content || "...";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setError(err.message || "Error aaya");
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="h-full overflow-hidden bg-[#04040a] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-red-900/30 px-6 py-4 flex items-center justify-between bg-[#06060e] shrink-0">
        <div>
          <h1 className="text-xl font-black text-red-400" style={{ fontFamily: "Cinzel" }}>
            OLLAMA AI CHAT
          </h1>
          <p className="text-xs text-zinc-600">Local AI — No internet required</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs text-zinc-400">{connected ? `Connected · ${models.length} models` : "Disconnected"}</span>
          {messages.length > 0 && (
            <button onClick={clearChat} className="px-3 py-1 rounded border border-zinc-700 text-zinc-400 text-xs hover:border-red-700 hover:text-red-400">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Settings */}
        <div className="w-64 shrink-0 border-r border-zinc-800/40 p-4 space-y-4 overflow-y-auto">

          {/* Server */}
          <div className="rounded border border-red-900/40 bg-red-900/10 p-3">
            <label className="text-xs text-red-400 uppercase tracking-widest block mb-2">Ollama Server</label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-xs focus:outline-none focus:border-red-700 mb-2"
            />
            <button
              onClick={testConnection}
              disabled={connecting}
              className={`w-full py-2 rounded text-xs font-bold border transition-all ${
                connected
                  ? "bg-green-900/40 border-green-700 text-green-300"
                  : "bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50"
              }`}
            >
              {connecting ? "Connecting..." : connected ? "✓ Connected" : "Connect"}
            </button>
          </div>

          {/* Model */}
          {models.length > 0 && (
            <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Model</label>
              <div className="space-y-1">
                {models.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className={`w-full text-left px-2 py-2 rounded text-xs border transition-all ${
                      selectedModel === m
                        ? "bg-red-900/40 border-red-600 text-red-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!connected && (
            <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Setup Guide</label>
              <div className="space-y-2 text-xs text-zinc-600">
                <p>1. Ollama install karo:</p>
                <code className="block bg-black/40 px-2 py-1 rounded text-green-500 text-xs">ollama.com/download</code>
                <p>2. Model download karo:</p>
                <code className="block bg-black/40 px-2 py-1 rounded text-green-500 text-xs">ollama pull llama3.2</code>
                <p>3. Connect button dabao</p>
              </div>
            </div>
          )}

          {/* Character */}
          <div className="rounded border border-zinc-800/40 bg-zinc-900/20 p-3">
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Character</label>
            <div className="space-y-1">
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedChar(c); setMessages([]); }}
                  className={`w-full text-left px-2 py-2 rounded text-xs border transition-all flex items-center gap-2 ${
                    selectedChar.id === c.id
                      ? "bg-red-900/40 border-red-600 text-red-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  <span>{c.avatar}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="text-5xl">{selectedChar.avatar}</div>
                <p className="text-zinc-500 text-sm">{selectedChar.name} se baat karo</p>
                <p className="text-zinc-700 text-xs max-w-xs">{selectedChar.system.slice(0, 80)}...</p>
                {!connected && (
                  <p className="text-red-500 text-xs">Ollama connect karo pehle</p>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  msg.role === "user" ? "bg-zinc-800" : "bg-red-900/40"
                }`}>
                  {msg.role === "user" ? "👤" : selectedChar.avatar}
                </div>
                <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-zinc-200"
                    : "bg-red-900/20 border border-red-900/30 text-zinc-200"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center text-sm">{selectedChar.avatar}</div>
                <div className="bg-red-900/20 border border-red-900/30 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 p-3 rounded border border-red-700 bg-red-900/20 text-red-300 text-xs">{error}</div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-zinc-800/40 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={connected ? `${selectedChar.name} se kuch poocho...` : "Pehle Ollama connect karo..."}
                disabled={!connected || loading}
                className="flex-1 p-3 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-red-700 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!connected || loading || !input.trim()}
                className="px-5 py-3 rounded bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-sm font-bold transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
