"use client";

import { MessageCircle, Send, Smile } from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  localUserId: string;
  localUserName?: string;
  localUserColor?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  localUserId,
  localUserName = "Player",
  localUserColor = "#4ECDC4",
}) => {
  const [message, setMessage] = useState("");
  const [messages] = useState<Array<{id: string, user: string, text: string, color: string, timestamp: Date}>>([
    // Placeholder messages
    {
      id: "1",
      user: "System",
      text: "Welcome to Chain Reaction! Chat will be available soon.",
      color: "#6B7280",
      timestamp: new Date(),
    }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // TODO: Implement actual message sending
    console.log("Sending message:", message);
    setMessage("");
  };

  return (
    <div className="w-80 bg-gray-800/50 backdrop-blur-xl border-l border-gray-700/50 flex flex-col h-full">
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
          const isSystem = msg.user === "System";
          const isLocalUser = msg.user === localUserName;
          
          return (
            <div 
              key={msg.id}
              className={`flex ${isLocalUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-lg p-3 
                  ${isSystem 
                    ? "bg-gray-700/50 border border-gray-600/50" 
                    : isLocalUser 
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "bg-gray-700/30"
                  }
                `}
              >
                {!isSystem && !isLocalUser && (
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: msg.color }}
                    />
                    <span className="text-white text-xs font-medium">{msg.user}</span>
                  </div>
                )}
                <p className={`text-sm ${isSystem ? "text-gray-400" : "text-white"}`}>
                  {msg.text}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm"
              disabled={true} // Disabled for now since chat is not implemented
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                className="text-gray-400 hover:text-white transition-colors p-1"
                disabled={true}
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!message.trim() || true} // Disabled for now
                className="text-gray-400 hover:text-blue-400 transition-colors p-1 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-500 text-xs text-center">
            Chat functionality coming soon
          </p>
        </form>
      </div>
    </div>
  );
};