"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PeerManager, createRoomId } from "@/PeerJsConnectivity/peerManager";
import { useUserStore, UserData } from "@/stores/userStore";
import { useChatStore } from "@/stores/chatStore";

export const useRoomWithUsers = (opts?: { maxParticipants?: number }) => {
  const managerRef = useRef<PeerManager | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

  const { addParticipant, removeParticipant, clearAllData } = useUserStore();
  const { addMessage, setUserTyping, removeUserTyping, addSystemMessage } = useChatStore();

  useEffect(() => {
    // Handle browser close/refresh events
    const handleBeforeUnload = () => {
      const mgr = managerRef.current;
      if (mgr) {
        mgr.leaveRoom();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (tab switch, minimize, etc.)
        // We could implement a timeout here to leave after being hidden for too long
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
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
      });
    }
    return managerRef.current;
  }, [opts?.maxParticipants, addParticipant, removeParticipant, addMessage, setUserTyping, removeUserTyping, addSystemMessage]);

  const createRoom = useCallback(async (customRoomId?: string): Promise<string> => {
    if (typeof window === "undefined") {
      throw new Error("createRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    const id = customRoomId ?? createRoomId();
    const mgr = ensureManager();
    try {
      await mgr.createHost(id);
      setRoomId(id);
      setIsHost(true);
      setLocalPeerId(mgr.peer?.id ?? null);
      setLoading(false);
      return id;
    } catch (e) {
      setError(e);
      setLoading(false);
      throw e;
    }
  }, [ensureManager]);

  const joinRoom = useCallback(async (roomIdToJoin: string, preferredId?: string): Promise<void> => {
    if (typeof window === "undefined") {
      throw new Error("joinRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    const mgr = ensureManager();
    try {
      await mgr.joinRoom(roomIdToJoin, preferredId);
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
    clearAllData();
  }, [clearAllData]);

  return {
    createRoom,
    joinRoom,
    joinRoomWithUserData,
    leaveRoom,
    broadcastUserData,
    setUserData,
    roomId,
    localPeerId,
    isHost,
    loading,
    error,
    peerManager: managerRef.current,
  };
};