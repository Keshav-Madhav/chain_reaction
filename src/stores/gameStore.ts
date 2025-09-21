import { create } from "zustand";
import { UserColor } from "./userStore";

export type GameStatus = "waiting" | "playing" | "finished";
export type CellType = "corner" | "edge" | "center";

export interface GameCell {
  dots: number;
  playerId: string | null;
  playerColor: UserColor | null;
}

export interface GameState {
  // Board configuration
  board: GameCell[][];
  rows: number;
  cols: number;
  
  // Game status
  status: GameStatus;
  currentTurn: string | null; // Player ID whose turn it is
  winner: string | null;
  
  // Game history
  moveHistory: Array<{
    playerId: string;
    row: number;
    col: number;
    timestamp: number;
  }>;
  
  // Game settings
  firstPlayer: string | null; // Player ID who goes first
}

interface GameActions {
  // Board management
  initializeBoard: (rows: number, cols: number) => void;
  resetGame: () => void;
  
  // Game flow
  startGame: (firstPlayerId: string) => void;
  makeMove: (row: number, col: number, playerId: string, playerColor: UserColor) => boolean;
  setCurrentTurn: (playerId: string) => void;
  setFirstPlayer: (playerId: string) => void;
  
  // Utility functions
  getCellType: (row: number, col: number) => CellType;
  getCellLimit: (row: number, col: number) => number;
  isValidMove: (row: number, col: number, playerId: string) => boolean;
  checkWinner: () => string | null;
  
  // State synchronization
  updateGameState: (newState: Partial<GameState>) => void;
  getGameState: () => GameState;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  board: [],
  rows: 9,
  cols: 6,
  status: "waiting",
  currentTurn: null,
  winner: null,
  moveHistory: [],
  firstPlayer: null,

  // Initialize board with empty cells
  initializeBoard: (rows: number, cols: number) => {
    const board = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        dots: 0,
        playerId: null,
        playerColor: null,
      }))
    );
    
    set({ board, rows, cols });
  },

  // Reset game to initial state
  resetGame: () => {
    const { rows, cols } = get();
    get().initializeBoard(rows, cols);
    set({
      status: "waiting",
      currentTurn: null,
      winner: null,
      moveHistory: [],
      firstPlayer: null,
    });
  },

  // Start the game
  startGame: (firstPlayerId: string) => {
    set({
      status: "playing",
      currentTurn: firstPlayerId,
      firstPlayer: firstPlayerId,
      winner: null,
    });
  },

  // Get cell type based on position
  getCellType: (row: number, col: number) => {
    const { rows, cols } = get();
    const isCorner = (row === 0 || row === rows - 1) && (col === 0 || col === cols - 1);
    const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
    
    if (isCorner) return "corner";
    if (isEdge) return "edge";
    return "center";
  },

  // Get cell limit based on type
  getCellLimit: (row: number, col: number) => {
    const cellType = get().getCellType(row, col);
    switch (cellType) {
      case "corner": return 1;
      case "edge": return 2;
      case "center": return 3;
      default: return 1;
    }
  },

  // Check if move is valid
  isValidMove: (row: number, col: number, playerId: string) => {
    const { board, status, currentTurn, rows, cols } = get();
    
    // Check game status
    if (status !== "playing") return false;
    if (currentTurn !== playerId) return false;
    
    // Check bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
    
    const cell = board[row][col];
    
    // Can only play on empty cells or own cells
    return cell.playerId === null || cell.playerId === playerId;
  },

  // Make a move
  makeMove: (row: number, col: number, playerId: string, playerColor: UserColor) => {
    const { board, isValidMove, getCellLimit, moveHistory } = get();
    
    if (!isValidMove(row, col, playerId)) {
      return false;
    }

    // Create new board state
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const cell = newBoard[row][col];
    
    // Add dot to cell
    cell.dots += 1;
    cell.playerId = playerId;
    cell.playerColor = playerColor;
    
    // Handle chain reactions
    const explosionQueue: Array<{row: number, col: number}> = [];
    const limit = getCellLimit(row, col);
    
    if (cell.dots > limit) {
      explosionQueue.push({row, col});
    }
    
    // Process explosions
    while (explosionQueue.length > 0) {
      const {row: explodeRow, col: explodeCol} = explosionQueue.shift()!;
      const explodingCell = newBoard[explodeRow][explodeCol];
      
      // Reset exploding cell
      explodingCell.dots = 0;
      explodingCell.playerId = null;
      explodingCell.playerColor = null;
      
      // Spread to adjacent cells
      const directions = [
        {row: -1, col: 0}, // up
        {row: 1, col: 0},  // down
        {row: 0, col: -1}, // left
        {row: 0, col: 1}   // right
      ];
      
      directions.forEach(({row: dRow, col: dCol}) => {
        const newRow = explodeRow + dRow;
        const newCol = explodeCol + dCol;
        
        if (newRow >= 0 && newRow < get().rows && newCol >= 0 && newCol < get().cols) {
          const adjacentCell = newBoard[newRow][newCol];
          adjacentCell.dots += 1;
          adjacentCell.playerId = playerId;
          adjacentCell.playerColor = playerColor;
          
          const adjacentLimit = getCellLimit(newRow, newCol);
          if (adjacentCell.dots > adjacentLimit) {
            explosionQueue.push({row: newRow, col: newCol});
          }
        }
      });
    }
    
    // Update move history
    const newMoveHistory = [...moveHistory, {
      playerId,
      row,
      col,
      timestamp: Date.now(),
    }];
    
    // Check for winner
    const winner = get().checkWinner();
    
    set({
      board: newBoard,
      moveHistory: newMoveHistory,
      winner,
      status: winner ? "finished" : "playing",
    });
    
    return true;
  },

  // Set current turn
  setCurrentTurn: (playerId: string) => {
    set({ currentTurn: playerId });
  },

  // Set first player
  setFirstPlayer: (playerId: string) => {
    set({ firstPlayer: playerId });
  },

  // Check for winner
  checkWinner: () => {
    const { board, moveHistory } = get();
    const playerIds = new Set<string>();
    
    // Collect all players who have dots on the board
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.playerId && cell.dots > 0) {
          playerIds.add(cell.playerId);
        }
      });
    });
    
    // Get unique players who have made moves
    const playersWhoMoved = new Set(moveHistory.map(move => move.playerId));
    
    // Winner conditions:
    // 1. Game has started (moves have been made)
    // 2. At least 2 different players have made moves (not just initial setup)
    // 3. Only one player has dots remaining on the board
    if (playerIds.size === 1 && 
        moveHistory.length > 0 && 
        playersWhoMoved.size >= 2) {
      return Array.from(playerIds)[0];
    }
    
    return null;
  },

  // Update game state (for peer sync)
  updateGameState: (newState: Partial<GameState>) => {
    set(newState);
  },

  // Get current game state
  getGameState: () => {
    const state = get();
    return {
      board: state.board,
      rows: state.rows,
      cols: state.cols,
      status: state.status,
      currentTurn: state.currentTurn,
      winner: state.winner,
      moveHistory: state.moveHistory,
      firstPlayer: state.firstPlayer,
    };
  },
}));
