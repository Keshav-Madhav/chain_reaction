"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { ChainReactionLogo } from "./ChainReactionLogo";
import { motion } from "framer-motion";

interface MobileHeaderProps {
  roomId: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  roomId,
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

  const truncatedRoomId = roomId.length > 8 ? `${roomId.substring(0, 8)}...` : roomId;

  return (
    <motion.header 
      className="lg:hidden bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600 p-4 flex items-center justify-between"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <ChainReactionLogo size="lg" animated={false} />
      </div>

      {/* Right side - Truncated Room ID */}
      <motion.button
        onClick={copyRoomId}
        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
        whileTap={{ scale: 0.95 }}
        aria-label={`Room ID: ${roomId}. Click to copy`}
      >
        <span className="text-gray-300 text-sm font-mono">
          {truncatedRoomId}
        </span>
        {copiedRoomId ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </motion.button>
    </motion.header>
  );
};