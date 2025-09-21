"use client";

import { Users, MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { ChainReactionLogo } from "./ChainReactionLogo";
import { motion } from "framer-motion";

interface MobileHeaderProps {
  roomId: string;
  onToggleLeftDrawer: () => void;
  onToggleChatDrawer: () => void;
  leftDrawerOpen: boolean;
  chatDrawerOpen: boolean;
  unreadCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  roomId,
  onToggleLeftDrawer,
  onToggleChatDrawer,
  leftDrawerOpen,
  chatDrawerOpen,
  unreadCount = 0,
}) => {
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch (error) {
      console.error("Failed to copy room ID:", error);
    }
  };

  return (
    <motion.header 
      className="lg:hidden bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600 p-4 flex items-center justify-between"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left side - Menu button */}
      <motion.button
        onClick={onToggleLeftDrawer}
        className={`p-2 rounded-lg transition-colors drawer-toggle ${
          leftDrawerOpen 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle participants menu"
      >
        <Users className="w-6 h-6" />
      </motion.button>

      {/* Center - Logo and Room ID */}
      <div className="flex items-center space-x-3">
        <ChainReactionLogo size="lg" showname={false} />
        
        <motion.button
          onClick={copyRoomId}
          className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
          whileTap={{ scale: 0.95 }}
          aria-label={`Room ID: ${roomId}. Click to copy`}
        >
          <span className="text-gray-300 text-sm font-mono">
            {roomId}
          </span>
          {copiedRoomId ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </motion.button>
      </div>

      {/* Right side - Chat button */}
      <motion.button
        onClick={onToggleChatDrawer}
        className={`relative p-2 rounded-lg transition-colors drawer-toggle ${
          chatDrawerOpen 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle chat"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>
    </motion.header>
  );
};