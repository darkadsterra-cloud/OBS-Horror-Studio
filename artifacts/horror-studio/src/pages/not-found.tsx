import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div
          className="text-8xl font-black text-red-600 mb-4"
          style={{ fontFamily: "Cinzel, serif", textShadow: "0 0 30px rgba(220,20,60,0.6)" }}
        >
          404
        </div>
        <p className="text-zinc-500 mb-6">This page was consumed by darkness</p>
        <Link href="/">
          <button className="px-6 py-2 rounded bg-red-900/30 border border-red-700/50 text-red-300 hover:bg-red-900/50 transition-colors">
            Return to Studio
          </button>
        </Link>
      </div>
    </div>
  );
}
