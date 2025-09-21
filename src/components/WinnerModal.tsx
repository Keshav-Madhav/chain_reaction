'use client';

import React, { useMemo } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGameStore } from '@/stores/gameStore';

interface WinnerModalProps {
  winnerName: string;
  winnerColor: string;
  onNewGame: () => void;
  isHost: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winnerName,
  winnerColor,
  onNewGame,
  isHost,
}) => {
  const gameStats = useGameStore((state) => state.gameStats);
  const board = useGameStore((state) => state.board);
  const participants = useUserStore((state) => state.participants);

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

  // Calculate game duration
  const gameDuration = gameStats.gameEndTime && gameStats.gameStartTime 
    ? Math.round((gameStats.gameEndTime - gameStats.gameStartTime) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get player stats
  const playerStats = Array.from(participants.values()).map(user => ({
    name: user.name,
    color: user.color,
    id: user.id,
    maxAtoms: gameStats.maxAtomsAchieved.get(user.id) || 0,
    currentAtoms: playerAtomCounts.get(user.id) || 0,
  })).sort((a, b) => b.maxAtoms - a.maxAtoms);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Winner Announcement */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: winnerColor }}
            />
            <span className="text-xl font-semibold" style={{ color: winnerColor }}>
              {winnerName}
            </span>
            <span className="text-xl text-white">wins!</span>
          </div>
          {gameDuration > 0 && (
            <p className="text-gray-400 text-sm">
              Game duration: {formatDuration(gameDuration)}
            </p>
          )}
        </div>

        {/* Player Statistics */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3 text-center">
            Player Statistics
          </h3>
          <div className="space-y-2">
            {playerStats.map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-700/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-4">
                    #{index + 1}
                  </span>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span 
                    className="font-medium"
                    style={{ color: player.color }}
                  >
                    {player.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {player.maxAtoms} atoms
                  </div>
                  <div className="text-gray-400 text-xs">
                    max achieved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={onNewGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Start New Game
            </button>
          ) : (
            <div className="text-center py-3 px-6 bg-gray-700/50 rounded-xl">
              <span className="text-gray-300">
                Waiting for host to start new game...
              </span>
            </div>
          )}
          
          {!isHost && (
            <div className="text-center">
              <span className="text-gray-400 text-sm">
                Only the host can start a new game
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};