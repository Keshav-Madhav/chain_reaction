"use client";

import { Users, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FloatingActionButtonsProps {
  onToggleLeftDrawer: () => void;
  onToggleChatDrawer: () => void;
  leftDrawerOpen: boolean;
  chatDrawerOpen: boolean;
  unreadCount?: number;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onToggleLeftDrawer,
  onToggleChatDrawer,
  leftDrawerOpen,
  chatDrawerOpen,
  unreadCount = 0,
}) => {
  return (
    <>
      {/* Left Bottom - Participants Button */}
      <motion.button
        onClick={onToggleLeftDrawer}
        className={`fixed bottom-6 left-6 z-40 p-4 rounded-full shadow-lg transition-all duration-200 drawer-toggle ${
          leftDrawerOpen 
            ? 'bg-blue-600 text-white shadow-blue-500/30' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 shadow-gray-900/50'
        } border border-gray-600 lg:hidden`}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        aria-label="Toggle participants menu"
      >
        <Users className="w-6 h-6" />
      </motion.button>

      {/* Right Bottom - Chat Button */}
      <motion.button
        onClick={onToggleChatDrawer}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-200 drawer-toggle ${
          chatDrawerOpen 
            ? 'bg-blue-600 text-white shadow-blue-500/30' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 shadow-gray-900/50'
        } border border-gray-600 lg:hidden`}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        aria-label="Toggle chat"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            className="fixed bottom-[5.5rem] right-[1.25rem] z-50 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>
    </>
  );
};