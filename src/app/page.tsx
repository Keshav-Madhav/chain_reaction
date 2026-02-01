"use client";

import { useState, useEffect, useCallback } from "react";
import { useRoomWithUsers } from "@/hooks/useRoomWithUsers";
import { useUserStore, UserColor } from "@/stores/userStore";
import { JoinCreateRoom } from "@/components/JoinCreateRoom";
import { UserSetup } from "@/components/UserSetup";
import { ResponsiveGameLayout } from "@/components/ResponsiveGameLayout";
import { useSessionUrl } from "@/hooks/useSessionUrl";
import { 
  saveGameSession, 
  getSessionForRoom, 
  clearGameSession,
  GameSessionData 
} from "@/utils/sessionStorage";

type AppPhase = "join-create" | "user-setup" | "in-game" | "rejoining";

const ChatPage = () => {
  const {
    createRoom,
    joinRoom,
    rejoinRoom,
    leaveRoom,
    broadcastUserData,
    setUserData,
    localPeerId,
    isHost,
    isRejoin,
    roomId,
    loading,
    error,
    connectionStatus,
    peerManager,
  } = useRoomWithUsers();

  const {
    localUser,
    availableColors,
    setLocalUser,
    clearAllData,
    getParticipantsList,
  } = useUserStore();

  const { setRoomInUrl, getRoomFromUrl, clearRoomFromUrl } = useSessionUrl();

  const [phase, setPhase] = useState<AppPhase>("join-create");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [initialUrlRoomId, setInitialUrlRoomId] = useState<string | undefined>(undefined);

  // Helper function to safely convert error to string
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      try {
        return JSON.stringify(error);
      } catch {
        return "An unknown error occurred";
      }
    }
    return String(error);
  };

  // Handle connection errors
  useEffect(() => {
    if (error) {
      setConnectionError(getErrorMessage(error));
    } else {
      setConnectionError(null);
    }
  }, [error]);

  // Check for session in URL on mount
  useEffect(() => {
    if (sessionChecked) return;
    
    const checkSession = async () => {
      const urlRoomId = getRoomFromUrl();
      
      // Store the URL room ID for the join form
      if (urlRoomId) {
        setInitialUrlRoomId(urlRoomId);
      }
      
      if (urlRoomId) {
        // Check if we have saved session data for this room
        const savedSession = getSessionForRoom(urlRoomId);
        
        if (savedSession) {
          // We have a saved session - attempt to rejoin
          setPhase("rejoining");
          try {
            const userData = {
              id: savedSession.peerId,
              name: savedSession.userName,
              color: savedSession.userColor,
              isHost: false, // Never rejoin as host
            };
            
            await rejoinRoom(urlRoomId, savedSession.peerId, userData);
            // Success - will transition to in-game phase
          } catch (e) {
            // Rejoin failed - clear session and go to join/create
            console.warn("Failed to rejoin session:", e);
            clearGameSession();
            clearRoomFromUrl();
            setConnectionError("Could not rejoin the game. The room may no longer exist.");
            setPhase("join-create");
          }
        } else {
          // No saved session for this room - just pre-fill the room ID
          // User can join as a new participant
          setPhase("join-create");
        }
      }
      
      setSessionChecked(true);
    };
    
    checkSession();
  }, [sessionChecked, getRoomFromUrl, rejoinRoom, clearRoomFromUrl]);

  // Move to user setup phase after successful room connection (not rejoin)
  useEffect(() => {
    if (roomId && localPeerId && phase === "join-create" && !isRejoin) {
      setPhase("user-setup");
    }
  }, [roomId, localPeerId, phase, isRejoin]);

  // Move to in-game phase after user setup is complete
  useEffect(() => {
    if (localUser && localUser.name && localUser.color && phase === "user-setup") {
      setPhase("in-game");
    }
  }, [localUser, phase]);

  // Handle successful rejoin - go directly to in-game
  useEffect(() => {
    if (roomId && localPeerId && isRejoin && localUser && phase === "rejoining") {
      setPhase("in-game");
    }
  }, [roomId, localPeerId, isRejoin, localUser, phase]);

  // Update URL when entering a game
  useEffect(() => {
    if (phase === "in-game" && roomId) {
      setRoomInUrl(roomId);
    }
  }, [phase, roomId, setRoomInUrl]);

  // Save session when entering a game
  useEffect(() => {
    if (phase === "in-game" && roomId && localPeerId && localUser) {
      const sessionData: GameSessionData = {
        roomId,
        peerId: localPeerId,
        userName: localUser.name,
        userColor: localUser.color,
        isHost,
        lastConnectedAt: Date.now(),
      };
      saveGameSession(sessionData);
    }
  }, [phase, roomId, localPeerId, localUser, isHost]);

  const handleCreateRoom = async (): Promise<string> => {
    try {
      setConnectionError(null);
      const newRoomId = await createRoom();
      return newRoomId;
    } catch (e) {
      const errorMsg = getErrorMessage(e);
      setConnectionError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const handleJoinRoom = async (roomIdToJoin: string): Promise<void> => {
    try {
      setConnectionError(null);
      await joinRoom(roomIdToJoin);
    } catch (e) {
      const errorMsg = getErrorMessage(e);
      setConnectionError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const handleUserSetupComplete = (name: string, color: UserColor) => {
    if (!localPeerId || !roomId) return;

    // Create local user data
    const userData = {
      id: localPeerId,
      name,
      color,
      isHost,
    };

    // Update local user in store
    setLocalUser(userData);

    // If host, store locally in PeerManager first
    if (isHost) {
      try {
        setUserData(userData);
      } catch (e) {
        console.warn("Failed to set host user data:", e);
      }
    }

    // Broadcast user data to other peers
    try {
      broadcastUserData(userData);
    } catch (e) {
      console.warn("Failed to broadcast user data:", e);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    clearAllData();
    clearGameSession();
    clearRoomFromUrl();
    setPhase("join-create");
    setConnectionError(null);
  };

  // Render based on current phase
  switch (phase) {
    case "join-create":
      return (
        <JoinCreateRoom
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          loading={loading}
          error={connectionError}
          connectionStatus={connectionStatus}
          initialRoomId={initialUrlRoomId}
        />
      );

    case "rejoining":
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Reconnecting...</h2>
            <p className="text-gray-300">{connectionStatus || "Rejoining your game session"}</p>
            {connectionError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300">{connectionError}</p>
              </div>
            )}
            <button
              onClick={() => {
                clearGameSession();
                clearRoomFromUrl();
                setPhase("join-create");
                setConnectionError(null);
              }}
              className="mt-6 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel and start fresh
            </button>
          </div>
        </div>
      );

    case "user-setup":
      if (!roomId) {
        // Fallback to join-create if no room
        setPhase("join-create");
        return null;
      }
      return (
        <UserSetup
          roomId={roomId}
          isHost={isHost}
          availableColors={availableColors}
          onComplete={handleUserSetupComplete}
          loading={loading}
        />
      );

    case "in-game":
      if (!roomId || !localPeerId) {
        // Fallback to join-create if no room or peer
        setPhase("join-create");
        return null;
      }
      
      const participantsList = getParticipantsList();
      
      return (
        <ResponsiveGameLayout
          participants={participantsList}
          roomId={roomId}
          localUserId={localPeerId}
          localUser={localUser}
          onLeaveRoom={handleLeaveRoom}
          peerManager={peerManager}
        />
      );

    default:
      return null;
  }
};

export default ChatPage;