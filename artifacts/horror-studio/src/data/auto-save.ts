// auto-save.ts — Auto-save and Draft Management
// Place at: artifacts/horror-studio/src/data/auto-save.ts
import { useState, useEffect, useRef, useCallback } from "react";
const DB_NAME = "HorrorStudioDB";
const STORE_NAME = "projects";
const DB_VERSION = 1;

interface AutoSaveData {
  id: string;
  name: string;
  data: any;
  timestamp: number;
  thumbnail?: string;
}

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// Save project to IndexedDB
export async function autoSaveProject(projectData: any, projectId?: string): Promise<string> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const id = projectId || `draft-${Date.now()}`;
    const data: AutoSaveData = {
      id,
      name: projectData.name || `Draft ${new Date().toLocaleString()}`,
      data: projectData,
      timestamp: Date.now(),
      thumbnail: projectData.thumbnail
    };
    
    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
    
    // Keep only last 10 drafts
    const allDrafts = await getAllDrafts();
    if (allDrafts.length > 10) {
      const toDelete = allDrafts.slice(10);
      for (const draft of toDelete) {
        await deleteDraft(draft.id);
      }
    }
    
    return id;
  } catch (error) {
    console.error("Auto-save failed:", error);
    // Fallback to localStorage
    const id = projectId || `draft-${Date.now()}`;
    localStorage.setItem(`horror-draft-${id}`, JSON.stringify({
      data: projectData,
      timestamp: Date.now()
    }));
    return id;
  }
}

// Get all drafts
export async function getAllDrafts(): Promise<AutoSaveData[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    const result = await new Promise<AutoSaveData[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return result.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    // Fallback to localStorage
    const drafts: AutoSaveData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("horror-draft-")) {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        drafts.push({
          id: key.replace("horror-draft-", ""),
          name: `Draft ${new Date(data.timestamp).toLocaleString()}`,
          data: data.data,
          timestamp: data.timestamp
        });
      }
    }
    return drafts.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Load specific draft
export async function loadDraft(id: string): Promise<any | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);
    const result = await new Promise<AutoSaveData | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return result?.data || null;
  } catch (error) {
    const data = localStorage.getItem(`horror-draft-${id}`);
    return data ? JSON.parse(data).data : null;
  }
}

// Delete draft
export async function deleteDraft(id: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    localStorage.removeItem(`horror-draft-${id}`);
  }
}

// Auto-save hook
export function useAutoSave(
  getProjectData: () => any,
  interval: number = 30000, // 30 seconds
  projectId?: string
): { lastSaved: Date | null; isSaving: boolean; saveNow: () => Promise<void> } {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const saveNow = useCallback(async () => {
    setIsSaving(true);
    try {
      const data = getProjectData();
      await autoSaveProject(data, projectId);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [getProjectData, projectId]);
  
  useEffect(() => {
    intervalRef.current = setInterval(saveNow, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [saveNow, interval]);
  
  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = getProjectData();
      autoSaveProject(data, projectId);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [getProjectData, projectId]);
  
  return { lastSaved, isSaving, saveNow };
}

// Export for backup
export function exportProjectBackup(projectData: any): void {
  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `horror-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import from backup
export function importProjectBackup(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
