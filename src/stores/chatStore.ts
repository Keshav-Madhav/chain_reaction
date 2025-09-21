import { create } from "zustand";
import { UserColor } from "./userStore";

export type MessageType = "text" | "system" | "game-event";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: UserColor | string; // Allow any color string for system messages
  content: string;
  type: MessageType;
  timestamp: number;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface ChatState {
  messages: ChatMessage[];
  typingUsers: Map<string, TypingIndicator>;
  unreadCount: number;
  isVisible: boolean;
}

interface ChatActions {
  // Message management
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  addSystemMessage: (content: string) => void;
  addGameEventMessage: (content: string) => void;
  clearMessages: () => void;

  // Typing indicators
  setUserTyping: (userId: string, userName: string) => void;
  removeUserTyping: (userId: string) => void;
  clearTypingIndicators: () => void;

  // UI state
  markAsRead: () => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;

  // Utilities
  getMessageHistory: () => ChatMessage[];
}

export type ChatStore = ChatState & ChatActions;

// Generate unique message ID
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  typingUsers: new Map(),
  unreadCount: 0,
  isVisible: true,

  // Message management
  addMessage: (messageData) => {
    const message: ChatMessage = {
      ...messageData,
      id: generateMessageId(),
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: state.isVisible ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  addSystemMessage: (content) => {
    const message: ChatMessage = {
      id: generateMessageId(),
      senderId: "system",
      senderName: "System",
      senderColor: "#6B7280",
      content,
      type: "system",
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  addGameEventMessage: (content) => {
    const message: ChatMessage = {
      id: generateMessageId(),
      senderId: "game",
      senderName: "Game",
      senderColor: "#3B82F6",
      content,
      type: "game-event",
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({
      messages: [],
      unreadCount: 0,
    });
  },

  // Typing indicators
  setUserTyping: (userId, userName) => {
    const typingIndicator: TypingIndicator = {
      userId,
      userName,
      timestamp: Date.now(),
    };

    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.set(userId, typingIndicator);
      return { typingUsers: newTypingUsers };
    });

    // Auto-remove typing indicator after 3 seconds
    setTimeout(() => {
      const currentTime = Date.now();
      set((state) => {
        const typingUser = state.typingUsers.get(userId);
        if (typingUser && currentTime - typingUser.timestamp >= 3000) {
          const newTypingUsers = new Map(state.typingUsers);
          newTypingUsers.delete(userId);
          return { typingUsers: newTypingUsers };
        }
        return state;
      });
    }, 3000);
  },

  removeUserTyping: (userId) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.delete(userId);
      return { typingUsers: newTypingUsers };
    });
  },

  clearTypingIndicators: () => {
    set({ typingUsers: new Map() });
  },

  // UI state
  markAsRead: () => {
    set({ unreadCount: 0 });
  },

  toggleVisibility: () => {
    set((state) => ({
      isVisible: !state.isVisible,
      unreadCount: !state.isVisible ? 0 : state.unreadCount, // Clear unread when showing
    }));
  },

  setVisibility: (visible) => {
    set({
      isVisible: visible,
      unreadCount: visible ? 0 : get().unreadCount, // Clear unread when showing
    });
  },

  // Utilities
  getMessageHistory: () => {
    return get().messages;
  },
}));