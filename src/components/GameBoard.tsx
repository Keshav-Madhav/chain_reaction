"use client";

import { Grid3X3 } from "lucide-react";
import { useGameWithPeers } from "@/hooks/useGameWithPeers";
import { PeerManager } from "@/PeerJsConnectivity/peerManager";
import { WinnerModal } from "@/components/WinnerModal";
import { useUserStore } from "@/stores/userStore";

interface GameBoardProps {
  roomId: string;
  localUserName?: string;
  localUserColor?: string;
  peerManager: PeerManager | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  roomId,
  peerManager,
}) => {
  const {
    board,
    status,
    winner,
    handleMakeMove,
    handleNewGame,
    canMakeMove,
    isHost,
    getCurrentTurnPlayerName,
  } = useGameWithPeers(peerManager);
  
  const participants = useUserStore((state) => state.participants);

  // Get winner information for modal
  const getWinnerInfo = () => {
    if (!winner) return null;
    const winnerData = participants.get(winner);
    return winnerData ? {
      name: winnerData.name,
      color: winnerData.color,
    } : null;
  };

  const handleCellClick = (row: number, col: number) => {
    if (status !== "playing" || !canMakeMove) {
      return;
    }
    
    handleMakeMove(row, col);
  };

  const renderAtoms = (dots: number, color: string | null) => {
    if (dots === 0) return null;
    
    // SVG Atom component
    const AtomSVG = ({ atomColor }: { atomColor: string }) => (
      <svg 
        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rotate-45" 
        viewBox="0 0 32 32" 
        fill="none"
      >
        {/* Nucleus */}
        <circle 
          cx="16" 
          cy="16" 
          r="3" 
          fill={atomColor}
          opacity="0.9"
        />
        {/* Electron orbits */}
        <ellipse 
          cx="16" 
          cy="16" 
          rx="12" 
          ry="6" 
          stroke={atomColor} 
          strokeWidth="1.5" 
          fill="none"
          opacity="0.6"
        />
        <ellipse 
          cx="16" 
          cy="16" 
          rx="6" 
          ry="12" 
          stroke={atomColor} 
          strokeWidth="1.5" 
          fill="none"
          opacity="0.6"
        />
        {/* Electrons */}
        <circle 
          cx="4" 
          cy="16" 
          r="1.5" 
          fill={atomColor}
          opacity="0.8"
        />
        <circle 
          cx="28" 
          cy="16" 
          r="1.5" 
          fill={atomColor}
          opacity="0.8"
        />
        <circle 
          cx="16" 
          cy="4" 
          r="1.5" 
          fill={atomColor}
          opacity="0.8"
        />
        <circle 
          cx="16" 
          cy="28" 
          r="1.5" 
          fill={atomColor}
          opacity="0.8"
        />
      </svg>
    );
    
    const atomElements = [];
    const atomColor = color || "#6B7280";
    
    for (let i = 0; i < dots; i++) {
      atomElements.push(
        <AtomSVG key={i} atomColor={atomColor} />
      );
    }
    
    // Arrange atoms in a 2x2 grid
    return (
      <div className="flex flex-wrap w-fit h-fit max-w-full max-h-full items-center justify-center">
        {atomElements}
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
      {/* Game Header - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block p-6 border-b border-gray-700/50">
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
                {/* Replace RotateCcw with custom icon for consistency */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Game
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 p-2 sm:p-4 lg:p-6 flex items-center justify-center overflow-auto">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 sm:p-4 lg:p-6 backdrop-blur-sm w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-3 lg:mb-4">
            <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            <span className="text-xs sm:text-sm lg:text-lg text-center">
              {status === "waiting" && "Waiting for game to start"}
              {status === "playing" && `Game in progress - ${canMakeMove ? "Your turn" : "Waiting for turn"}`}
              {status === "finished" && winner && "Game finished"}
            </span>
          </div>

          <div 
            className="grid gap-1 sm:gap-2 w-fit mx-auto touch-manipulation"
            style={{ gridTemplateColumns: `repeat(${board[0]?.length || 8}, 1fr)` }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-md lg:rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                    ${getCellTypeColor(rowIndex, colIndex)}
                    ${status === "playing" && canMakeMove 
                      ? "cursor-pointer active:scale-95 hover:scale-105" 
                      : "cursor-not-allowed opacity-60"
                    }
                    touch-manipulation select-none
                  `}
                  disabled={status !== "playing" || !canMakeMove}
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  {renderAtoms(cell.dots, cell.playerColor)}
                </button>
              ))
            )}
          </div>
          
          {/* Game Info */}
          <div className="mt-4 lg:mt-6 text-center">
            {status === "playing" && getCurrentTurnPlayerName && (
              <div className="text-center">
                <span className="text-blue-400 text-xs lg:text-sm font-medium">
                  {getCurrentTurnPlayerName()} is making a move
                </span>
              </div>
            )}
            
            {/* Mobile New Game Button */}
            {isHost && (
              <div className="lg:hidden mt-4">
                <button
                  onClick={handleNewGame}
                  className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-4 py-2 text-blue-400 hover:text-blue-300 transition-all duration-200 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Game
                </button>
              </div>
            )}
            
            {/* Mobile Turn Indicator */}
            <div className="lg:hidden mt-4">
              {status === "playing" && canMakeMove && (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">Your Turn</span>
                </div>
              )}
              {status === "finished" && winner && (
                <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 justify-center">
                  <span className="text-blue-400 text-sm font-medium">Game Finished!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Info */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            {status === "waiting" && (
              <span className="text-gray-400 text-sm">Waiting for game to start</span>
            )}
          </div>
          {/* Whose turn indicator */}
          {status === "playing" && getCurrentTurnPlayerName && (
            <div className="text-center">
              <span className="text-cyan-400 text-lg">
                Current turn: {getCurrentTurnPlayerName()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Winner Modal */}
      {status === "finished" && winner && (() => {
        const winnerInfo = getWinnerInfo();
        return winnerInfo ? (
          <WinnerModal
            winnerName={winnerInfo.name}
            winnerColor={winnerInfo.color}
            onNewGame={handleNewGame}
            isHost={isHost}
          />
        ) : null;
      })()}
    </div>
  );
};