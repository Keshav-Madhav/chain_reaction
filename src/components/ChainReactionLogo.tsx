"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ChainReactionLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showname?: boolean;
  animated?: boolean;
  flexcol?: boolean;
}

export const ChainReactionLogo: React.FC<ChainReactionLogoProps> = ({
  size = 'md',
  showname = true,
  animated = true,
  flexcol = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
    '2xl': 'w-40 h-40',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl',
  };

  return (
    <motion.div 
      className={`${flexcol ? 'flex-col' : ''} flex items-center space-x-2`}
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Chain Reaction Logo SVG */}
      <motion.svg
        className={sizeClasses[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={animated ? { rotate: 360 } : {}}
        transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
      >
        {/* Central atom */}
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill="#4ECDC4"
          initial={animated ? { scale: 0 } : {}}
          animate={animated ? { scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.3, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        
        {/* Surrounding atoms */}
        <motion.circle
          cx="30"
          cy="30"
          r="6"
          fill="#F7DC6F"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.3, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.circle
          cx="70"
          cy="30"
          r="6"
          fill="#F7DC6F"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.3, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.circle
          cx="70"
          cy="70"
          r="6"
          fill="#F7DC6F"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.3, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.circle
          cx="30"
          cy="70"
          r="6"
          fill="#F7DC6F"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.3, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        
        {/* Connection lines */}
        <motion.line
          x1="50"
          y1="50"
          x2="30"
          y2="30"
          stroke="#85C1E9"
          strokeWidth="2"
          initial={animated ? { pathLength: 0, opacity: 0 } : {}}
          animate={animated ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.4, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.line
          x1="50"
          y1="50"
          x2="70"
          y2="30"
          stroke="#85C1E9"
          strokeWidth="2"
          initial={animated ? { pathLength: 0, opacity: 0 } : {}}
          animate={animated ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.4, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.line
          x1="50"
          y1="50"
          x2="70"
          y2="70"
          stroke="#85C1E9"
          strokeWidth="2"
          initial={animated ? { pathLength: 0, opacity: 0 } : {}}
          animate={animated ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ delay: 1.0, duration: 0.4, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.line
          x1="50"
          y1="50"
          x2="30"
          y2="70"
          stroke="#85C1E9"
          strokeWidth="2"
          initial={animated ? { pathLength: 0, opacity: 0 } : {}}
          animate={animated ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ delay: 1.1, duration: 0.4, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        
        {/* Outer energy rings */}
        <motion.circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke="#AED6F1"
          strokeWidth="1"
          strokeDasharray="5,5"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 0.6 } : {}}
          transition={{ delay: 1.2, duration: 0.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="#D5DBDB"
          strokeWidth="1"
          strokeDasharray="3,7"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 0.4 } : {}}
          transition={{ delay: 1.4, duration: 0.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
      </motion.svg>
      
      {showname && (
        <motion.span 
          className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${textSizeClasses[size]}`}
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Chain Reaction
        </motion.span>
      )}
    </motion.div>
  );
};