"use client";

import { Users, Crown, Copy, Check, LogOut } from "lucide-react";
import { useState } from "react";
import { UserData } from "@/stores/userStore";

interface GameSidebarProps {
  participants: UserData[];
  roomId: string;
  localUserId: string;
  onLeaveRoom: () => void;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({
  participants,
  roomId,
  localUserId,
  onLeaveRoom,
}) => {
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  };

  const localUser = participants.find(p => p.id === localUserId);

  return (
    <div className="w-80 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Chain Reaction</h1>
            <p className="text-gray-400 text-sm">Multiplayer Game</p>
          </div>
        </div>

        {/* Room Info */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Room ID</span>
            <button
              onClick={copyRoomId}
              className="bg-gray-600/50 hover:bg-gray-600/70 text-white px-2 py-1 rounded text-xs transition-all duration-200 flex items-center gap-1"
            >
              {copiedRoomId ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-cyan-400 font-mono text-sm break-all">{roomId}</p>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Players ({participants.length})
          </h2>
        </div>
        
        <div className="space-y-3">
          {participants.map((participant) => {
            const isYou = participant.id === localUserId;
            
            return (
              <div 
                key={participant.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${isYou 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'bg-gray-700/30'
                  }
                `}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium text-sm">
                      {participant.name}
                      {isYou && <span className="text-blue-400 text-xs">(You)</span>}
                    </h3>
                    {participant.isHost && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    {participant.isHost ? "Host" : "Player"}
                  </p>
                </div>
                
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: participant.color }}
                />
              </div>
            );
          })}
        </div>
        
        {participants.length === 1 && (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Waiting for players...</p>
            <p className="text-gray-500 text-xs mt-1">Share the room ID above</p>
          </div>
        )}
      </div>

      {/* Game Status & Leave Button */}
      <div className="p-6 border-t border-gray-700/50 space-y-3">
        {/* Game Status */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Game Status</span>
          </div>
          <p className="text-gray-400 text-xs">Waiting for game to start</p>
          {localUser?.isHost && (
            <p className="text-blue-400 text-xs mt-1">You can start the game when ready</p>
          )}
        </div>

        {/* Leave Button */}
        <button
          onClick={onLeaveRoom}
          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Leave Game
        </button>
      </div>
    </div>
  );
};