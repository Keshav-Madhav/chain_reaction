"use client";

import { motion } from "framer-motion";

interface AnimatedAtomProps {
  atomColor: string;
  className?: string;
  speedMultiplier?: number; // Multiplier for animation speed (1 = normal, higher = faster)
}

export const AnimatedAtom: React.FC<AnimatedAtomProps> = ({ 
  atomColor, 
  className = "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6",
  speedMultiplier = 1
}) => {
  // Generate random vibration pattern for each atom instance
  const randomVibration = {
    x: [
      Math.random() * 2 - 1, // Random between -1 and 1
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      0
    ],
    y: [
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      0
    ],
    duration: 0.1 + Math.random() * 0.3
  };

  return (
    <motion.div 
      className={className}
      animate={speedMultiplier > 1 ? {
        x: randomVibration.x,
        y: randomVibration.y,
      } : {}}
      transition={speedMultiplier > 1 ? {
        duration: randomVibration.duration,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      <svg 
        className="w-full h-full rotate-45" 
        viewBox="0 0 32 32" 
        fill="none"
      >
        {/* Nucleus - slightly pulsing */}
        <motion.circle 
          cx="16" 
          cy="16" 
          r="3.5" 
          fill={atomColor}
          opacity="0.9"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2 / speedMultiplier,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Electron orbits - static */}
        <ellipse 
          cx="16" 
          cy="16" 
          rx="14" 
          ry="7" 
          stroke={atomColor} 
          strokeWidth="1.5" 
          fill="none"
          opacity="0.6"
        />
        <ellipse 
          cx="16" 
          cy="16" 
          rx="7" 
          ry="14" 
          stroke={atomColor} 
          strokeWidth="1.5" 
          fill="none"
          opacity="0.6"
        />
        
        {/* Electron 1 - Horizontal orbit */}
        <motion.circle 
          r="1.8" 
          fill={atomColor}
          opacity="0.8"
          animate={{
            cx: [2, 30, 2],
            cy: 16
          }}
          transition={{
            duration: 3 / speedMultiplier,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Electron 2 - Horizontal orbit (opposite) */}
        <motion.circle 
          r="1.8" 
          fill={atomColor}
          opacity="0.8"
          animate={{
            cx: [30, 2, 30],
            cy: 16
          }}
          transition={{
            duration: 3 / speedMultiplier,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Electron 3 - Vertical orbit */}
        <motion.circle 
          r="1.8" 
          fill={atomColor}
          opacity="0.8"
          animate={{
            cx: 16,
            cy: [2, 30, 2]
          }}
          transition={{
            duration: 2.5 / speedMultiplier,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Electron 4 - Vertical orbit (opposite) */}
        <motion.circle 
          r="1.8" 
          fill={atomColor}
          opacity="0.8"
          animate={{
            cx: 16,
            cy: [30, 2, 30]
          }}
          transition={{
            duration: 2.5 / speedMultiplier,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </svg>
    </motion.div>
  );
};