"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PeerManager, createRoomId } from "@/PeerJsConnectivity/peerManager";
import { useUserStore, UserData } from "@/stores/userStore";
import { useChatStore } from "@/stores/chatStore";
import { useGameStore, GameState } from "@/stores/gameStore";

export const useRoomWithUsers = (opts?: { maxParticipants?: number }) => {
  const managerRef = useRef<PeerManager | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isRejoin, setIsRejoin] = useState<boolean>(false);

  const { addParticipant, removeParticipant, clearAllData, setLocalUser } = useUserStore();
  const { addMessage, setUserTyping, removeUserTyping, addSystemMessage } = useChatStore();
  const { updateGameState } = useGameStore();

  useEffect(() => {
    // NOTE: We intentionally do NOT leave room on beforeunload/refresh
    // This allows users to rejoin with their saved session after a refresh
    // The host will clean up disconnected peers after a timeout
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (tab switch, minimize, etc.)
        // We could implement a timeout here to leave after being hidden for too long
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only leave room when component is truly unmounting (not on refresh)
      // This happens when navigating away in a SPA
      managerRef.current?.leaveRoom();
      managerRef.current = null;
    };
  }, []);

  const ensureManager = useCallback((): PeerManager => {
    if (!managerRef.current) {
      managerRef.current = new PeerManager({
        maxParticipants: opts?.maxParticipants ?? 4,
        onPeerListUpdate: (peers) => {
          // Update basic peer tracking
          console.log("Peer list updated:", peers);
        },
        onMessage: (msg) => {
          // Handle game messages
          console.log("Message received:", msg);
        },
        onError: (e) => setError(e),
        onUserDataUpdate: (userData: UserData) => {
          // Handle user data updates from other peers
          console.log("User data update received:", userData);
          const isNewUser = !useUserStore.getState().participants.has(userData.id);
          addParticipant(userData);
          
          // Add system message for new user joining
          if (isNewUser) {
            addSystemMessage(`${userData.name} joined the room`);
          }
        },
        onUserListUpdate: (usersData: UserData[]) => {
          // Handle bulk user data updates (e.g., when joining)
          console.log("User list update received:", usersData);
          usersData.forEach(userData => addParticipant(userData));
          
          // Add welcome message for the current user
          if (usersData.length > 0) {
            addSystemMessage("Welcome to Chain Reaction! Chat is now active.");
          }
        },
        onPeerLeft: (peerId: string) => {
          // Handle peer disconnection
          console.log("Peer left:", peerId);
          const user = useUserStore.getState().participants.get(peerId);
          removeParticipant(peerId);

          if (user) {
            addSystemMessage(`${user.name} left the room `);
          }
        },
        onChatMessage: (message) => {
          // Handle incoming chat messages
          addMessage({
            senderId: message.senderId,
            senderName: message.senderName,
            senderColor: message.senderColor,
            content: message.content,
            type: "text",
          });
        },
        onUserTyping: (userId, userName, isTyping) => {
          // Handle typing indicators
          if (isTyping) {
            setUserTyping(userId, userName);
          } else {
            removeUserTyping(userId);
          }
        },
        onRejoinSuccess: (originalPeerId: string, newPeerId: string, gameState?: GameState) => {
          // Handle successful rejoin
          console.log("Rejoin successful:", { originalPeerId, newPeerId, gameState });
          
          // Sync game state if provided
          if (gameState) {
            updateGameState(gameState);
            addSystemMessage("Welcome back! Game state has been restored.");
          } else {
            addSystemMessage("Welcome back to Chain Reaction!");
          }
        },
      });
    }
    return managerRef.current;
  }, [opts?.maxParticipants, addParticipant, removeParticipant, addMessage, setUserTyping, removeUserTyping, addSystemMessage, updateGameState]);

  const createRoom = useCallback(async (customRoomId?: string): Promise<string> => {
    if (typeof window === "undefined") {
      throw new Error("createRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    setConnectionStatus("Initializing room...");
    const id = customRoomId ?? createRoomId();
    const mgr = ensureManager();
    
    // Retry logic for creating room
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        setConnectionStatus(attempt > 0 ? `Retrying (${attempt + 1}/${maxRetries})...` : "Creating room...");
        await mgr.createHost(id);
        setRoomId(id);
        setIsHost(true);
        setLocalPeerId(mgr.peer?.id ?? null);
        setLoading(false);
        setConnectionStatus(null);
        return id;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        
        // Don't retry on certain types of errors or last attempt
        if (lastError.message.includes('ID taken') || attempt === maxRetries - 1) {
          break;
        }
        
        setConnectionStatus(`Connection failed, retrying in ${Math.pow(2, attempt)} seconds...`);
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setError(lastError);
    setLoading(false);
    setConnectionStatus(null);
    throw lastError;
  }, [ensureManager]);

  const joinRoom = useCallback(async (roomIdToJoin: string, preferredId?: string): Promise<void> => {
    if (typeof window === "undefined") {
      throw new Error("joinRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    setConnectionStatus("Connecting to signaling server...");
    const mgr = ensureManager();
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        setConnectionStatus(
          attempt > 0 
            ? `Retrying connection (${attempt + 1}/${maxRetries})...` 
            : `Joining room "${roomIdToJoin}"...`
        );
        await mgr.joinRoom(roomIdToJoin, preferredId);
        setRoomId(roomIdToJoin);
        setIsHost(false);
        setLocalPeerId(mgr.peer?.id ?? null);
        setLoading(false);
        setConnectionStatus(null);
        return;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        
        // Don't retry on certain types of errors
        if (lastError.message.includes('room may not exist') || 
            lastError.message.includes('ID taken') ||
            attempt === maxRetries - 1) {
          break;
        }
        
        setConnectionStatus(`Connection failed, retrying in ${Math.pow(2, attempt)} seconds...`);
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setError(lastError);
    setLoading(false);
    setConnectionStatus(null);
    throw lastError;
  }, [ensureManager]);

  const joinRoomWithUserData = useCallback(async (roomIdToJoin: string, userData: UserData, preferredId?: string): Promise<void> => {
    if (typeof window === "undefined") {
      throw new Error("joinRoomWithUserData must be called client-side");
    }
    setLoading(true);
    setError(null);
    const mgr = ensureManager();
    try {
      await mgr.joinRoomWithUserData(roomIdToJoin, userData, preferredId);
      setRoomId(roomIdToJoin);
      setIsHost(false);
      setLocalPeerId(mgr.peer?.id ?? null);
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
      throw e;
    }
  }, [ensureManager]);

  const broadcastUserData = useCallback((userData: UserData): void => {
    const mgr = managerRef.current;
    if (!mgr) {
      throw new Error("Not connected to a room");
    }
    mgr.broadcastUserData(userData);
  }, []);

  const setUserData = useCallback((userData: UserData): void => {
    const mgr = managerRef.current;
    if (!mgr) {
      throw new Error("Not connected to a room");
    }
    mgr.setUserData(userData);
  }, []);

  const leaveRoom = useCallback((): void => {
    const mgr = managerRef.current;
    if (mgr) {
      // Use graceful leave method that notifies others
      mgr.leaveRoom();
      managerRef.current = null;
    }
    setRoomId(null);
    setLocalPeerId(null);
    setIsHost(false);
    setConnectionStatus(null);
    setIsRejoin(false);
    clearAllData();
  }, [clearAllData]);

  // Rejoin a room with saved session data
  const rejoinRoom = useCallback(async (
    roomIdToJoin: string, 
    originalPeerId: string, 
    userData: UserData
  ): Promise<void> => {
    if (typeof window === "undefined") {
      throw new Error("rejoinRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    setConnectionStatus("Reconnecting to room...");
    const mgr = ensureManager();
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        setConnectionStatus(
          attempt > 0 
            ? `Retrying reconnection (${attempt + 1}/${maxRetries})...` 
            : `Rejoining room "${roomIdToJoin}"...`
        );
        await mgr.rejoinRoom(roomIdToJoin, originalPeerId, userData);
        setRoomId(roomIdToJoin);
        setIsHost(false);
        setLocalPeerId(mgr.peer?.id ?? null);
        setIsRejoin(true);
        
        // Update local user with new peer ID
        const updatedUserData = {
          ...userData,
          id: mgr.peer?.id ?? userData.id,
        };
        setLocalUser(updatedUserData);
        
        setLoading(false);
        setConnectionStatus(null);
        return;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        
        // Don't retry on certain types of errors
        if (lastError.message.includes('no longer exist') || 
            attempt === maxRetries - 1) {
          break;
        }
        
        setConnectionStatus(`Reconnection failed, retrying in ${Math.pow(2, attempt)} seconds...`);
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setError(lastError);
    setLoading(false);
    setConnectionStatus(null);
    throw lastError;
  }, [ensureManager, setLocalUser]);

  return {
    createRoom,
    joinRoom,
    joinRoomWithUserData,
    rejoinRoom,
    leaveRoom,
    broadcastUserData,
    setUserData,
    roomId,
    localPeerId,
    isHost,
    isRejoin,
    loading,
    error,
    connectionStatus,
    peerManager: managerRef.current,
  };
};