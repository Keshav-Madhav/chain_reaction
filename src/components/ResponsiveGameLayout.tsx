"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileHeader } from "./MobileHeader";
import { GameSidebar } from "./GameSidebar";
import { ChatSidebar } from "./ChatSidebar";
import { GameBoard } from "./GameBoard";
import { UserData } from "@/stores/userStore";
import { PeerManager } from "@/PeerJsConnectivity/peerManager";
import { useChatStore } from "@/stores/chatStore";
import { useGameStore } from "@/stores/gameStore";

interface ResponsiveGameLayoutProps {
  participants: UserData[];
  roomId: string;
  localUserId: string;
  localUser: UserData | null;
  onLeaveRoom: () => void;
  peerManager: PeerManager | null;
}

export const ResponsiveGameLayout: React.FC<ResponsiveGameLayoutProps> = ({
  participants,
  roomId,
  localUserId,
  localUser,
  onLeaveRoom,
  peerManager,
}) => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isInitialized = useRef(false);

  const { unreadCount } = useChatStore();
  const { initializeBoard, board } = useGameStore();

  // Initialize game board once
  useEffect(() => {
    if (!isInitialized.current && board.length === 0) {
      initializeBoard(9, 6);
      isInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.length]); // Only depend on board.length, initializeBoard is stable

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close drawers when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile) return;
      
      const target = event.target as Element;
      if (!target.closest('.drawer-content') && !target.closest('.drawer-toggle')) {
        setLeftDrawerOpen(false);
        setChatDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // Backdrop component
  const Backdrop = ({ onClick }: { onClick: () => void }) => (
    <motion.div
      className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
    />
  );

  return (
    <div className="h-dvh min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          roomId={roomId}
          onToggleLeftDrawer={() => setLeftDrawerOpen(!leftDrawerOpen)}
          onToggleChatDrawer={() => setChatDrawerOpen(!chatDrawerOpen)}
          leftDrawerOpen={leftDrawerOpen}
          chatDrawerOpen={chatDrawerOpen}
          unreadCount={unreadCount}
        />
      )}

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Left Sidebar - Desktop */}
            <div className="w-80 border-r border-gray-700">
              <GameSidebar
                participants={participants}
                roomId={roomId}
                localUserId={localUserId}
                onLeaveRoom={onLeaveRoom}
                peerManager={peerManager}
              />
            </div>

            {/* Center - Game Board - Desktop */}
            <div className="flex-1">
              <GameBoard
                roomId={roomId}
                localUserName={localUser?.name}
                localUserColor={localUser?.color}
                peerManager={peerManager}
              />
            </div>

            {/* Right Sidebar - Chat - Desktop */}
            <div className="w-80 border-l border-gray-700">
              <ChatSidebar
                localUserId={localUserId}
                localUserName={localUser?.name}
                localUserColor={localUser?.color}
                peerManager={peerManager}
              />
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <>
            {/* Full Screen Game Board - Mobile */}
            <div className="flex-1">
              <GameBoard
                roomId={roomId}
                localUserName={localUser?.name}
                localUserColor={localUser?.color}
                peerManager={peerManager}
              />
            </div>

            {/* Left Drawer - Mobile */}
            <AnimatePresence>
              {leftDrawerOpen && (
                <motion.div
                  className="fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-gray-800 border-r border-gray-600 z-50 drawer-content shadow-2xl"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <GameSidebar
                    participants={participants}
                    roomId={roomId}
                    localUserId={localUserId}
                    onLeaveRoom={onLeaveRoom}
                    peerManager={peerManager}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right Drawer - Chat - Mobile */}
            <AnimatePresence>
              {chatDrawerOpen && (
                <motion.div
                  className="fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-gray-800 border-l border-gray-600 z-50 drawer-content shadow-2xl"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ChatSidebar
                    localUserId={localUserId}
                    localUserName={localUser?.name}
                    localUserColor={localUser?.color}
                    peerManager={peerManager}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Backdrop for mobile drawers */}
            <AnimatePresence>
              {(leftDrawerOpen || chatDrawerOpen) && (
                <Backdrop onClick={() => {
                  setLeftDrawerOpen(false);
                  setChatDrawerOpen(false);
                }} />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};