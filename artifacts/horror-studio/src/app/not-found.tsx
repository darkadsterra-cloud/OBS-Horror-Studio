// 404-fix.ts — Handle refresh and routing
// Place at: artifacts/horror-studio/src/app/not-found.tsx or _error.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if we have a saved draft
    const checkDraft = async () => {
      try {
        const { getAllDrafts } = await import("@/data/auto-save");
        const drafts = await getAllDrafts();
        
        if (drafts.length > 0) {
          // Redirect to home with draft restoration
          const mostRecent = drafts[0];
          const url = new URL(window.location.href);
          url.pathname = "/";
          url.searchParams.set("restore", mostRecent.id);
          window.location.href = url.toString();
        } else {
          // No drafts, go home
          router.push("/");
        }
      } catch (error) {
        router.push("/");
      }
    };
    
    checkDraft();
  }, [router]);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl text-red-500 mb-4">Restoring Session...</h1>
        <p className="text-zinc-500">Please wait while we recover your work</p>
      </div>
    </div>
  );
}

// next.config.js — Add for static export with SPA behavior
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: true,
  // Handle client-side routing
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/index.html',
      },
    ];
  },
  // Fallback for 404
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
