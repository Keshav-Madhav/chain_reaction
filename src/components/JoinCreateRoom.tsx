"use client";

import { useState, FormEvent } from "react";
import { Plus, ArrowRight, Copy, Check } from "lucide-react";
import { ChainReactionLogo } from "./ChainReactionLogo";

interface JoinCreateRoomProps {
  onCreateRoom: () => Promise<string>;
  onJoinRoom: (roomId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  connectionStatus?: string | null;
  initialRoomId?: string;
}

export const JoinCreateRoom: React.FC<JoinCreateRoomProps> = ({
  onCreateRoom,
  onJoinRoom,
  loading,
  error,
  connectionStatus,
  initialRoomId,
}) => {
  const [inputRoomId, setInputRoomId] = useState(initialRoomId ?? "");
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  // Helper function to safely convert error to string
  const getErrorMessage = (error: string | null): string => {
    if (!error) return "An unknown error occurred";
    return error;
  };

  const handleCreateRoom = async () => {
    if (loading) return;
    try {
      const roomId = await onCreateRoom();
      // Auto-copy room ID to clipboard
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (e) {
      console.error("Failed to create room:", e);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || !inputRoomId.trim()) return;
    try {
      await onJoinRoom(inputRoomId.trim());
    } catch (e) {
      console.error("Failed to join room:", e);
    }
  };

  const copyRoomId = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <ChainReactionLogo size="2xl" flexcol/>
          <p className="text-gray-300 text-lg">Connect and play with friends</p>
        </div>

        {/* Create Room Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Create New Room</h2>
              <p className="text-gray-400 text-sm">Start a new game session</p>
            </div>
          </div>
          
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Room
              </>
            )}
          </button>
          
          {copiedRoomId && (
            <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Room ID copied to clipboard!</span>
            </div>
          )}
          
          {loading && connectionStatus && (
            <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm text-center">{connectionStatus}</p>
            </div>
          )}
        </div>

        {/* Join Room Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Join Existing Room</h2>
              <p className="text-gray-400 text-sm">Enter a room ID to join</p>
            </div>
          </div>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
              {inputRoomId && (
                <button
                  type="button"
                  onClick={() => copyRoomId(inputRoomId)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {copiedRoomId === inputRoomId ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || !inputRoomId.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Join Room
                </>
              )}
            </button>
          </form>
        </div>

        {/* Connection Status Display */}
        {loading && connectionStatus && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-sm text-center">{connectionStatus}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-sm text-center">
              {getErrorMessage(error)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Share the Room ID with friends to play together
          </p>
        </div>
      </div>
    </div>
  );
};