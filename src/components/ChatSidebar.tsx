"use client";

import { MessageCircle, Send, Smile } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { PeerManager } from "@/PeerJsConnectivity/peerManager";

interface ChatSidebarProps {
  localUserId: string;
  localUserName?: string;
  localUserColor?: string;
  peerManager: PeerManager | null;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  localUserId,
  localUserName = "Player",
  localUserColor = "#4ECDC4",
  peerManager,
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    typingUsers,
    addMessage,
    markAsRead,
  } = useChatStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when component is visible
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !peerManager) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    // Add message to local store
    addMessage({
      senderId: localUserId,
      senderName: localUserName,
      senderColor: localUserColor,
      content: message.trim(),
      type: "text",
    });

    // Broadcast to other peers
    peerManager.broadcastChatMessage(
      messageId,
      localUserId,
      localUserName,
      localUserColor,
      message.trim(),
      timestamp
    );

    // Clear input and stop typing
    setMessage("");
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim() && peerManager) {
      setIsTyping(true);
      peerManager.broadcastUserTyping(localUserId, localUserName, true);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping && peerManager) {
      setIsTyping(false);
      peerManager.broadcastUserTyping(localUserId, localUserName, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Get list of users currently typing (excluding self)
  const typingUsersList = Array.from(typingUsers.values())
    .filter(user => user.userId !== localUserId)
    .map(user => user.userName);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-full lg:w-80 bg-gray-800/50 backdrop-blur-xl lg:border-l border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Game Chat</h2>
            <p className="text-gray-400 text-xs">Stay connected with your team</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const isSystem = msg.type === "system" || msg.type === "game-event";
          const isLocalUser = msg.senderId === localUserId;
          
          // Get appropriate icon for system messages
          const getSystemIcon = () => {
            const content = msg.content.toLowerCase();
            if (content.includes("joined")) return "👋";
            if (content.includes("left")) return "👋";
            if (content.includes("wins") || content.includes("won")) return "🏆";
            if (content.includes("game started")) return "🎮";
            if (content.includes("new game")) return "🔄";
            if (content.includes("welcome")) return "✨";
            return "ℹ️";
          };
          
          return (
            <div 
              key={msg.id}
              className={`flex ${isLocalUser && !isSystem ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-lg p-3 
                  ${isSystem 
                    ? msg.type === "game-event"
                      ? "bg-blue-600/20 border border-blue-500/30" 
                      : "bg-gray-700/50 border border-gray-600/50"
                    : isLocalUser 
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "bg-gray-700/30"
                  }
                `}
              >
                {isSystem ? (
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">{getSystemIcon()}</span>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        msg.type === "game-event" 
                          ? "text-blue-300 font-medium" 
                          : "text-gray-400"
                      }`}>
                        {msg.content}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: msg.senderColor }}
                      />

                      <span 
                        className="text-sm font-medium mr-4"
                        style={{ color: msg.senderColor }}
                      >
                        {isLocalUser ? "You" : msg.senderName}
                      </span>
                      
                      <p className="text-gray-500 text-xs ml-auto">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-white">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Typing indicators */}
        {typingUsersList.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-700/30 rounded-lg p-3 max-w-[80%]">
              <p className="text-gray-400 text-xs italic">
                {typingUsersList.length === 1 
                  ? `${typingUsersList[0]} is typing...`
                  : `${typingUsersList.slice(0, -1).join(", ")} and ${typingUsersList[typingUsersList.length - 1]} are typing...`
                }
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm"
              disabled={!peerManager}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                className="text-gray-400 hover:text-white transition-colors p-1"
                disabled={!peerManager}
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!message.trim() || !peerManager}
                className="text-gray-400 hover:text-blue-400 transition-colors p-1 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          {!peerManager && (
            <p className="text-gray-500 text-xs text-center">
              Chat will be available once connected
            </p>
          )}
        </form>
      </div>
    </div>
  );
};