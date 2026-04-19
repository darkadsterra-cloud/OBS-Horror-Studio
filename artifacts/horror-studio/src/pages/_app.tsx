// _app.tsx — Root app with error boundary and recovery
// Location: artifacts/horror-studio/src/pages/_app.tsx

import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  useEffect(() => {
    // Auto-save on error
    const autoSave = async () => {
      try {
        const { autoSaveProject } = await import("@/data/auto-save");
        const projectData = JSON.parse(localStorage.getItem("last-project-state") || "{}");
        await autoSaveProject(projectData, "error-recovery");
      } catch (e) {
        console.error("Emergency save failed:", e);
      }
    };
    autoSave();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl text-red-500 mb-4">Something went wrong</h1>
        <p className="text-zinc-400 mb-4 text-sm">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-900/40 border border-red-700/40 text-red-300 rounded hover:bg-red-900/60"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: any) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
