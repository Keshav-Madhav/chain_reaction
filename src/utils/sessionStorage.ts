"use client";

import { UserColor } from "@/stores/userStore";

const SESSION_KEY = "chain_reaction_session";

export interface GameSessionData {
  roomId: string;
  peerId: string;
  userName: string;
  userColor: UserColor;
  isHost: boolean;
  lastConnectedAt: number;
}

// Session expires after 2 hours
const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000;

/**
 * Save game session data to localStorage
 */
export function saveGameSession(data: GameSessionData): void {
  if (typeof window === "undefined") return;
  
  try {
    const sessionData = {
      ...data,
      lastConnectedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn("Failed to save game session:", error);
  }
}

/**
 * Get saved game session data from localStorage
 * Returns null if no session exists or session has expired
 */
export function getGameSession(): GameSessionData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    const data: GameSessionData = JSON.parse(stored);
    
    // Check if session has expired
    const now = Date.now();
    if (now - data.lastConnectedAt > SESSION_EXPIRY_MS) {
      clearGameSession();
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn("Failed to retrieve game session:", error);
    return null;
  }
}

/**
 * Get session for a specific room
 * Returns null if no session for that room or session expired
 */
export function getSessionForRoom(roomId: string): GameSessionData | null {
  const session = getGameSession();
  if (!session) return null;
  
  // Return session only if it matches the requested room
  if (session.roomId === roomId) {
    return session;
  }
  
  return null;
}

/**
 * Clear the saved game session
 */
export function clearGameSession(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn("Failed to clear game session:", error);
  }
}

/**
 * Update the last connected timestamp for the current session
 */
export function updateSessionTimestamp(): void {
  const session = getGameSession();
  if (session) {
    saveGameSession(session);
  }
}

/**
 * Check if there's a valid session for a given room
 */
export function hasValidSessionForRoom(roomId: string): boolean {
  return getSessionForRoom(roomId) !== null;
}
