"use client";

import { Crown, Users, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { UserData } from "@/stores/userStore";

interface ParticipantsListProps {
  participants: UserData[];
  roomId: string;
  localUserId: string;
  onLeaveRoom: () => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
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
  const hostUser = participants.find(p => p.isHost);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Game Lobby
          </h1>
          <p className="text-gray-300 text-lg">Waiting for game to start...</p>
        </div>

        {/* Room Info Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Room Information</h2>
              <p className="text-gray-400 text-sm">Share this ID with friends</p>
            </div>
            <button
              onClick={copyRoomId}
              className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border border-gray-600/50"
            >
              {copiedRoomId ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy ID
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
            <p className="text-cyan-400 font-mono text-lg font-medium break-all">
              {roomId}
            </p>
          </div>
        </div>

        {/* Your Info Card */}
        {localUser && (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: localUser.color }}
              />
              Your Profile
            </h2>
            
            <div className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{ backgroundColor: localUser.color }}
              >
                {localUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium text-lg">{localUser.name}</h3>
                  {localUser.isHost && (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {localUser.isHost ? "Host" : "Member"} • ID: {localUser.id.substring(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-6">
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
                    flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                    ${isYou 
                      ? 'bg-blue-500/20 border border-blue-500/30' 
                      : 'bg-gray-700/30 hover:bg-gray-700/50'
                    }
                  `}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">
                        {participant.name}
                        {isYou && <span className="text-blue-400 text-sm">(You)</span>}
                      </h3>
                      {participant.isHost && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {participant.isHost ? "Host" : "Member"} • ID: {participant.id.substring(0, 8)}...
                    </p>
                  </div>
                  
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: participant.color }}
                  />
                </div>
              );
            })}
          </div>
          
          {participants.length === 1 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Waiting for other players to join...</p>
              <p className="text-gray-500 text-sm mt-1">Share the room ID above</p>
            </div>
          )}
        </div>

        {/* Game Status */}
        {hostUser && (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Game Status</h2>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              <p className="text-gray-300">Waiting for host to start the game</p>
            </div>
            {localUser?.isHost && (
              <p className="text-blue-400 text-sm mt-2">
                As the host, you can start the game when ready
              </p>
            )}
          </div>
        )}

        {/* Leave Room Button */}
        <div className="text-center">
          <button
            onClick={onLeaveRoom}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-5 h-5" />
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};