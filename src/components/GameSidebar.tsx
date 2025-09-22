"use client";

import { Users, Crown, Copy, Check, LogOut, Play } from "lucide-react";
import { useState, useMemo } from "react";
import { UserData } from "@/stores/userStore";
import { useGameWithPeers } from "@/hooks/useGameWithPeers";
import { PeerManager } from "@/PeerJsConnectivity/peerManager";
import { useGameStore } from "@/stores/gameStore";
import { ChainReactionLogo } from "./ChainReactionLogo";

interface GameSidebarProps {
  participants: UserData[];
  roomId: string;
  localUserId: string;
  onLeaveRoom: () => void;
  peerManager: PeerManager | null;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({
  participants,
  roomId,
  localUserId,
  onLeaveRoom,
  peerManager,
}) => {
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  
  const {
    status,
    firstPlayer,
    currentTurn,
    handleStartGame,
    handleSetFirstPlayer,
    canStartGame,
    isHost,
  } = useGameWithPeers(peerManager);

  // Get board state to calculate atom counts
  const board = useGameStore((state) => state.board);

  // Calculate player atom counts with useMemo to prevent infinite loops
  const playerAtomCounts = useMemo(() => {
    const atomCounts = new Map<string, number>();
    
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.playerId && cell.dots > 0) {
          const currentCount = atomCounts.get(cell.playerId) || 0;
          atomCounts.set(cell.playerId, currentCount + cell.dots);
        }
      });
    });
    
    return atomCounts;
  }, [board]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  };

  return (
    <div className="w-full lg:w-80 bg-gray-800/50 backdrop-blur-xl lg:border-r border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <ChainReactionLogo size="lg" />
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
            const isCurrentTurn = currentTurn === participant.id && status === "playing";
            const atomCount = playerAtomCounts.get(participant.id) || 0;
            
            return (
              <div 
                key={participant.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${isYou 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : isCurrentTurn
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-gray-700/30'
                  }
                `}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg relative"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                  {isCurrentTurn && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium text-sm">
                      {participant.name}
                      {isYou && <span className="text-blue-400 text-xs"> (You)</span>}
                    </h3>
                    {participant.isHost && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrentTurn && <span className="text-green-400 text-xs">Turn</span>}

                    {status === "playing" && (
                      <span className="text-cyan-400 text-xs">
                        • {atomCount} atoms
                      </span>
                    )}
                  </div>
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
        {/* Game Controls */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              status === "waiting" ? "bg-yellow-400 animate-pulse" :
              status === "playing" ? "bg-green-400" :
              "bg-blue-400"
            }`} />
            <span className="text-white text-sm font-medium">Game Status</span>
          </div>
          
          <p className="text-gray-400 text-xs mb-3">
            {status === "waiting" && "Waiting for game to start"}
            {status === "playing" && "Game in progress"}
            {status === "finished" && "Game finished"}
          </p>
          
          {/* Host Controls */}
          {isHost && status === "waiting" && (
            <div className="space-y-2">
              {/* First Player Selection */}
              <div>
                <label className="text-gray-300 text-xs mb-1 block">First Player:</label>
                <select
                  value={firstPlayer || ""}
                  onChange={(e) => handleSetFirstPlayer(e.target.value)}
                  className="w-full h-10 bg-gray-800/70 text-gray-200 text-xs rounded px-2 py-1 border border-gray-600/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 hover:bg-gray-800/90 transition-all duration-200"
                >
                  <option value="" className="bg-gray-800 text-gray-400 !h-10">Select first player...</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id} className="bg-gray-800 text-gray-200 h-10">
                      {p.name} {p.id === localUserId ? "(You)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Start Game Button */}
              <button
                onClick={() => firstPlayer && handleStartGame(firstPlayer)}
                // disabled={!canStartGame}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  canStartGame
                    ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    : "bg-gray-600/20 text-gray-500 border border-gray-600/30 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4" />
                Start Game
              </button>
              
              {!canStartGame && participants.length < 2 && (
                <p className="text-gray-500 text-xs mt-1">Need at least 2 players to start</p>
              )}
            </div>
          )}
          
          {/* Non-host waiting message */}
          {!isHost && status === "waiting" && (
            <p className="text-blue-400 text-xs">Waiting for host to start the game</p>
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