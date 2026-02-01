"use client";

import { useEffect, useCallback } from "react";

/**
 * Hook to manage session ID in the URL
 * When in a game, the room ID will be in the URL hash so refreshing will rejoin
 */
export function useSessionUrl() {
  /**
   * Set the room ID in the URL hash
   */
  const setRoomInUrl = useCallback((roomId: string) => {
    if (typeof window === "undefined") return;
    
    // Use hash for client-side routing without page reload
    const newUrl = `${window.location.pathname}#room=${roomId}`;
    window.history.replaceState(null, "", newUrl);
  }, []);

  /**
   * Get the room ID from the URL hash
   */
  const getRoomFromUrl = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    
    const hash = window.location.hash;
    if (!hash) return null;
    
    // Parse hash: #room=<roomId>
    const match = hash.match(/^#room=(.+)$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    
    return null;
  }, []);

  /**
   * Clear the room ID from the URL
   */
  const clearRoomFromUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    
    // Remove hash from URL
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return {
    setRoomInUrl,
    getRoomFromUrl,
    clearRoomFromUrl,
  };
}

/**
 * Hook to detect if we're rejoining from a URL or saved session
 */
export function useSessionDetection() {
  const { getRoomFromUrl } = useSessionUrl();

  const detectSession = useCallback((): { roomId: string | null; source: "url" | "storage" | null } => {
    // First check URL
    const urlRoomId = getRoomFromUrl();
    if (urlRoomId) {
      return { roomId: urlRoomId, source: "url" };
    }
    
    return { roomId: null, source: null };
  }, [getRoomFromUrl]);

  return { detectSession };
}
