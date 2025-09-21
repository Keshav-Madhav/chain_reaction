"use client";

import { Grid3X3, RotateCcw } from "lucide-react";
import { useGameWithPeers } from "@/hooks/useGameWithPeers";
import { PeerManager } from "@/PeerJsConnectivity/peerManager";

interface GameBoardProps {
  roomId: string;
  localUserName?: string;
  localUserColor?: string;
  peerManager: PeerManager | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  roomId,
  localUserName = "Player",
  localUserColor = "#4ECDC4",
  peerManager,
}) => {
  const {
    board,
    status,
    currentTurn,
    winner,
    handleMakeMove,
    handleNewGame,
    canMakeMove,
    isHost,
  } = useGameWithPeers(peerManager);

  const handleCellClick = (row: number, col: number) => {
    if (status !== "playing" || !canMakeMove) {
      return;
    }
    
    handleMakeMove(row, col);
  };

  const renderDots = (dots: number, color: string | null) => {
    if (dots === 0) return null;
    
    const dotElements = [];
    for (let i = 0; i < dots; i++) {
      dotElements.push(
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color || "#6B7280" }}
        />
      );
    }
    
    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {dotElements}
      </div>
    );
  };

  const getCellTypeColor = (row: number, col: number) => {
    const rows = board.length;
    const cols = board[0]?.length || 0;
    const isCorner = (row === 0 || row === rows - 1) && (col === 0 || col === cols - 1);
    const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
    
    if (isCorner) return "border-yellow-500/30 bg-yellow-500/10 hover:border-yellow-500/50 hover:bg-yellow-500/20";
    if (isEdge) return "border-orange-500/30 bg-orange-500/10 hover:border-orange-500/50 hover:bg-orange-500/20";
    return "border-gray-600/50 bg-gray-700/30 hover:border-gray-500/50 hover:bg-gray-600/30";
  };

  if (board.length === 0) {
    return (
      <div className="flex-1 bg-gray-900/50 backdrop-blur-xl flex items-center justify-center">
        <div className="text-gray-400">Loading game board...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900/50 backdrop-blur-xl flex flex-col h-full">
      {/* Game Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Chain Reaction</h1>
            <p className="text-gray-400 text-sm">Room: {roomId}</p>
          </div>
          <div className="flex items-center gap-4">
            {status === "playing" && canMakeMove && (
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Your Turn</span>
              </div>
            )}
            {status === "finished" && winner && (
              <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-1">
                <span className="text-blue-400 text-sm font-medium">Game Finished!</span>
              </div>
            )}
            {isHost && (
              <button
                onClick={handleNewGame}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-4 py-2 text-blue-400 hover:text-blue-300 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                New Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div 
            className="grid gap-2 w-fit mx-auto"
            style={{ gridTemplateColumns: `repeat(${board[0]?.length || 8}, 1fr)` }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all duration-200
                    ${getCellTypeColor(rowIndex, colIndex)}
                    ${status === "playing" && canMakeMove 
                      ? "cursor-pointer" 
                      : "cursor-not-allowed opacity-60"
                    }
                  `}
                  disabled={status !== "playing" || !canMakeMove}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    {renderDots(cell.dots, cell.playerColor)}
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* Game Info */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm">
                {status === "waiting" && "Waiting for game to start"}
                {status === "playing" && `Game in progress - ${canMakeMove ? "Your turn" : "Waiting for turn"}`}
                {status === "finished" && winner && "Game finished"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-sm" />
                <span>Corner (1 atom limit)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-sm" />
                <span>Edge (2 atoms limit)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-sm" />
                <span>Center (3 atoms limit)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Info */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center justify-center gap-3">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ backgroundColor: localUserColor }}
          />
          <span className="text-white font-medium">{localUserName}</span>
          {status === "playing" && (
            canMakeMove ? (
              <div className="flex items-center gap-1 text-green-400">
                <span className="text-sm">Make your move</span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Waiting for turn</span>
            )
          )}
          {status === "waiting" && (
            <span className="text-gray-400 text-sm">Waiting for game to start</span>
          )}
        </div>
      </div>
    </div>
  );
};