"use client";

import { motion } from "framer-motion";

interface FlyingAtomProps {
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

export const FlyingAtom: React.FC<FlyingAtomProps> = ({
  color,
  startX,
  startY,
  endX,
  endY,
  duration = 0.25,
  delay = 0,
  onComplete,
}) => {
  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      initial={{
        x: startX,
        y: startY,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: endX,
        y: endY,
        scale: [1, 1.3, 1],
        opacity: 1,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad for smooth deceleration
      }}
      onAnimationComplete={onComplete}
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 relative">
        {/* Glowing trail effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-md"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0.8, scale: 1.2 }}
          animate={{ opacity: [0.8, 0.4, 0.8], scale: [1.2, 1.5, 1.2] }}
          transition={{ duration: duration * 0.8, ease: "easeOut" }}
        />
        
        {/* Main atom body */}
        <svg 
          className="w-full h-full rotate-45 relative z-10" 
          viewBox="0 0 32 32" 
          fill="none"
        >
          {/* Nucleus */}
          <motion.circle 
            cx="16" 
            cy="16" 
            r="4" 
            fill={color}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: duration * 0.5, ease: "easeOut" }}
          />
          
          {/* Electron orbits */}
          <ellipse 
            cx="16" 
            cy="16" 
            rx="13" 
            ry="6" 
            stroke={color} 
            strokeWidth="1.5" 
            fill="none"
            opacity="0.7"
          />
          <ellipse 
            cx="16" 
            cy="16" 
            rx="6" 
            ry="13" 
            stroke={color} 
            strokeWidth="1.5" 
            fill="none"
            opacity="0.7"
          />
          
          {/* Fast spinning electrons */}
          <motion.circle 
            r="2" 
            fill={color}
            animate={{
              cx: [3, 29, 3],
              cy: 16
            }}
            transition={{
              duration: 0.15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.circle 
            r="2" 
            fill={color}
            animate={{
              cx: 16,
              cy: [3, 29, 3]
            }}
            transition={{
              duration: 0.12,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
};
