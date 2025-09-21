"use client";

import { useState, FormEvent } from "react";
import { User, Palette, ArrowRight, Check } from "lucide-react";
import { AVAILABLE_COLORS, UserColor } from "@/stores/userStore";

interface UserSetupProps {
  roomId: string;
  isHost: boolean;
  availableColors: UserColor[];
  onComplete: (name: string, color: UserColor) => void;
  loading?: boolean;
}

export const UserSetup: React.FC<UserSetupProps> = ({
  roomId,
  isHost,
  availableColors,
  onComplete,
  loading = false,
}) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<UserColor | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedColor) return;
    onComplete(name.trim(), selectedColor);
  };

  const isFormValid = name.trim().length > 0 && selectedColor !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to the Game!
          </h1>
          <p className="text-gray-300 text-lg">Set up your profile</p>
          
          {/* Room Info */}
          <div className="mt-4 p-3 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 inline-block">
            <p className="text-sm text-gray-400">
              Room: <span className="text-cyan-400 font-mono">{roomId}</span>
            </p>
            <p className="text-sm text-gray-400">
              Role: <span className="text-purple-400">{isHost ? "Host" : "Member"}</span>
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <User className="w-5 h-5" />
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                required
              />
              <p className="text-gray-400 text-sm mt-2">
                {name.length}/20 characters
              </p>
            </div>

            {/* Color Selection */}
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <Palette className="w-5 h-5" />
                Choose Your Color
              </label>
              <div className="grid grid-cols-3 gap-4">
                {AVAILABLE_COLORS.map((color) => {
                  const isAvailable = availableColors.includes(color);
                  const isSelected = selectedColor === color;
                  
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => isAvailable && setSelectedColor(color)}
                      disabled={!isAvailable}
                      className={`
                        relative w-full aspect-square rounded-xl border-2 transition-all duration-200 flex items-center justify-center
                        ${isSelected 
                          ? 'border-white shadow-2xl scale-105' 
                          : isAvailable 
                            ? 'border-gray-600 hover:border-gray-400 hover:scale-105' 
                            : 'border-gray-700 opacity-50 cursor-not-allowed'
                        }
                      `}
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && (
                        <Check className="w-8 h-8 text-white drop-shadow-lg" />
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-gray-900/70 rounded-xl flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-medium">Taken</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-400 text-sm mt-3">
                {availableColors.length} of {AVAILABLE_COLORS.length} colors available
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Join Game
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Your name and color will be visible to all players
          </p>
        </div>
      </div>
    </div>
  );
};