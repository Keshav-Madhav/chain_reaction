"use client";

import { useState, useEffect } from "react";
import { useRoomWithUsers } from "@/hooks/useRoomWithUsers";
import { useUserStore, UserColor } from "@/stores/userStore";
import { JoinCreateRoom } from "@/components/JoinCreateRoom";
import { UserSetup } from "@/components/UserSetup";
import { ParticipantsList } from "@/components/ParticipantsList";

type AppPhase = "join-create" | "user-setup" | "in-game";

const ChatPage = () => {
  const {
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastUserData,
    setUserData,
    localPeerId,
    isHost,
    roomId,
    loading,
    error,
  } = useRoomWithUsers();

  const {
    localUser,
    availableColors,
    setLocalUser,
    clearAllData,
    getParticipantsList,
  } = useUserStore();

  const [phase, setPhase] = useState<AppPhase>("join-create");
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  // Move to user setup phase after successful room connection
  useEffect(() => {
    if (roomId && localPeerId && phase === "join-create") {
      setPhase("user-setup");
    }
  }, [roomId, localPeerId, phase]);

  // Move to in-game phase after user setup is complete
  useEffect(() => {
    if (localUser && localUser.name && localUser.color && phase === "user-setup") {
      setPhase("in-game");
    }
  }, [localUser, phase]);

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
        />
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
        <ParticipantsList
          participants={participantsList}
          roomId={roomId}
          localUserId={localPeerId}
          onLeaveRoom={handleLeaveRoom}
        />
      );

    default:
      return null;
  }
};

export default ChatPage;