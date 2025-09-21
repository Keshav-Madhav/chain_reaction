"use client";

import { create } from "zustand";

// Available bright colors for participants
export const AVAILABLE_COLORS = [
  "#FF6B6B", // Bright Red
  "#4ECDC4", // Bright Teal
  "#45B7D1", // Bright Blue
  "#96CEB4", // Bright Green
  "#FFEAA7", // Bright Yellow
  "#DDA0DD", // Bright Purple
] as const;

export type UserColor = typeof AVAILABLE_COLORS[number];

export interface UserData {
  id: string;
  name: string;
  color: UserColor;
  isHost: boolean;
}

export interface UserState {
  // Local user data
  localUser: UserData | null;
  
  // All participants in the room (including local user)
  participants: Map<string, UserData>;
  
  // Available colors (colors not taken by other users)
  availableColors: UserColor[];
  
  // Actions
  setLocalUser: (userData: Partial<UserData>) => void;
  updateLocalUser: (updates: Partial<UserData>) => void;
  addParticipant: (userData: UserData) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<UserData>) => void;
  getParticipantsList: () => UserData[];
  isColorAvailable: (color: UserColor) => boolean;
  clearAllData: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  localUser: null,
  participants: new Map(),
  availableColors: [...AVAILABLE_COLORS],

  setLocalUser: (userData) => {
    set((state) => {
      const newLocalUser: UserData = {
        id: userData.id || "",
        name: userData.name || "",
        color: userData.color || AVAILABLE_COLORS[0],
        isHost: userData.isHost || false,
      };
      
      // Update participants map with local user
      const newParticipants = new Map(state.participants);
      newParticipants.set(newLocalUser.id, newLocalUser);
      
      return {
        localUser: newLocalUser,
        participants: newParticipants,
        availableColors: state.availableColors.filter(c => c !== newLocalUser.color),
      };
    });
  },

  updateLocalUser: (updates) => {
    set((state) => {
      if (!state.localUser) return state;
      
      const updatedUser = { ...state.localUser, ...updates };
      const newParticipants = new Map(state.participants);
      newParticipants.set(updatedUser.id, updatedUser);
      
      // Update available colors if color changed
      let newAvailableColors = [...state.availableColors];
      if (updates.color && updates.color !== state.localUser.color) {
        // Add back the old color and remove the new one
        newAvailableColors = newAvailableColors.filter(c => c !== updates.color);
        const oldColor = state.localUser.color;
        if (oldColor && !Array.from(state.participants.values()).some(p => p.id !== updatedUser.id && p.color === oldColor)) {
          newAvailableColors.push(oldColor);
        }
      }
      
      return {
        localUser: updatedUser,
        participants: newParticipants,
        availableColors: newAvailableColors,
      };
    });
  },

  addParticipant: (userData) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.set(userData.id, userData);
      
      return {
        participants: newParticipants,
        availableColors: state.availableColors.filter(c => c !== userData.color),
      };
    });
  },

  removeParticipant: (userId) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      const removedUser = newParticipants.get(userId);
      newParticipants.delete(userId);
      
      // Add back the color to available colors if no one else is using it
      const newAvailableColors = [...state.availableColors];
      if (removedUser && !Array.from(newParticipants.values()).some(p => p.color === removedUser.color)) {
        newAvailableColors.push(removedUser.color);
      }
      
      return {
        participants: newParticipants,
        availableColors: newAvailableColors,
      };
    });
  },

  updateParticipant: (userId, updates) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      const existingUser = newParticipants.get(userId);
      
      if (!existingUser) return state;
      
      const updatedUser = { ...existingUser, ...updates };
      newParticipants.set(userId, updatedUser);
      
      return {
        participants: newParticipants,
      };
    });
  },

  getParticipantsList: () => {
    const state = get();
    return Array.from(state.participants.values()).sort((a, b) => {
      // Host first, then alphabetical by name
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return a.name.localeCompare(b.name);
    });
  },

  isColorAvailable: (color) => {
    const state = get();
    return state.availableColors.includes(color);
  },

  clearAllData: () => {
    set({
      localUser: null,
      participants: new Map(),
      availableColors: [...AVAILABLE_COLORS],
    });
  },
}));