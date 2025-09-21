"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useUserStore, UserColor } from "@/stores/userStore";
import { PeerManager } from "@/PeerJsConnectivity/peerManager";

export const useGameWithPeers = (peerManager: PeerManager | null) => {
  const {
    board,
    status,
    currentTurn,
    winner,
    firstPlayer,
    moveHistory,
    initializeBoard,
    startGame,
    makeMove,
    setCurrentTurn,
    setFirstPlayer,
    resetGame,
    updateGameState,
    getGameState,
    isValidMove,
  } = useGameStore();

  const { localUser, getParticipantsList } = useUserStore();
  const isInitialized = useRef(false);

  // Initialize board when component mounts
  useEffect(() => {
    if (!isInitialized.current) {
      initializeBoard(9, 6); // Standard Chain Reaction board
      isInitialized.current = true;
    }
  }, [initializeBoard]);

  // Set up peer manager callbacks for game events
  useEffect(() => {
    if (!peerManager) return;

    // Override game callbacks
    peerManager.onGameStart = (firstPlayerId: string) => {
      startGame(firstPlayerId);
    };

    peerManager.onGameMove = (row: number, col: number, playerId: string, playerColor: string) => {
      // Make the move locally
      makeMove(row, col, playerId, playerColor as UserColor);
    };

    peerManager.onGameStateSync = (gameState) => {
      updateGameState(gameState);
    };

    peerManager.onNextTurn = (playerId: string) => {
      setCurrentTurn(playerId);
    };

  }, [peerManager, startGame, makeMove, updateGameState, setCurrentTurn]);

  // Handle starting the game (host only)
  const handleStartGame = useCallback((firstPlayerId: string) => {
    if (!peerManager || !peerManager.isHost) return;
    
    // Start game locally
    startGame(firstPlayerId);
    
    // Broadcast to peers
    peerManager.broadcastGameStart(firstPlayerId);
  }, [peerManager, startGame]);

  // Handle making a move
  const handleMakeMove = useCallback((row: number, col: number) => {
    if (!peerManager || !localUser) return false;

    // Check if it's a valid move
    if (!isValidMove(row, col, localUser.id)) {
      return false;
    }

    // Make move locally
    const success = makeMove(row, col, localUser.id, localUser.color);
    
    if (success) {
      // Broadcast move to peers
      peerManager.broadcastGameMove(row, col, localUser.id, localUser.color);
      
      // Determine next player
      const participants = getParticipantsList();
      const currentIndex = participants.findIndex(p => p.id === localUser.id);
      const nextIndex = (currentIndex + 1) % participants.length;
      const nextPlayer = participants[nextIndex];
      
      if (nextPlayer) {
        setCurrentTurn(nextPlayer.id);
        peerManager.broadcastNextTurn(nextPlayer.id);
      }
    }
    
    return success;
  }, [peerManager, localUser, isValidMove, makeMove, getParticipantsList, setCurrentTurn]);

  // Handle new game (host only)
  const handleNewGame = useCallback(() => {
    if (!peerManager || !peerManager.isHost) return;
    
    // Reset game locally
    resetGame();
    initializeBoard(9, 6);
    
    // Sync state to peers
    const newGameState = getGameState();
    peerManager.broadcastGameStateSync(newGameState);
  }, [peerManager, resetGame, initializeBoard, getGameState]);

  // Set first player (host only)
  const handleSetFirstPlayer = useCallback((playerId: string) => {
    if (!peerManager || !peerManager.isHost) return;
    
    setFirstPlayer(playerId);
  }, [peerManager, setFirstPlayer]);

  // Check if current user can make moves
  const canMakeMove = useCallback(() => {
    return (
      status === "playing" &&
      localUser &&
      currentTurn === localUser.id
    );
  }, [status, localUser, currentTurn]);

  // Check if current user is host
  const isHost = peerManager?.isHost ?? false;

  // Check if game can be started
  const canStartGame = useCallback(() => {
    const participants = getParticipantsList();
    return (
      isHost &&
      status === "waiting" &&
      participants.length >= 2 &&
      firstPlayer !== null
    );
  }, [isHost, status, getParticipantsList, firstPlayer]);

  // Get current turn player name
  const getCurrentTurnPlayerName = useCallback(() => {
    if (!currentTurn) return null;
    const participants = getParticipantsList();
    const currentPlayer = participants.find(p => p.id === currentTurn);
    return currentPlayer?.name || null;
  }, [currentTurn, getParticipantsList]);

  return {
    // Game state
    board,
    status,
    currentTurn,
    winner,
    firstPlayer,
    moveHistory,
    
    // Game actions
    handleStartGame,
    handleMakeMove,
    handleNewGame,
    handleSetFirstPlayer,
    
    // Utilities
    canMakeMove: canMakeMove(),
    canStartGame: canStartGame(),
    isHost,
    getGameState,
    getCurrentTurnPlayerName,
  };
};