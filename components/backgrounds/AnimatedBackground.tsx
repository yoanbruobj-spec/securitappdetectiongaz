'use client'

import { motion } from 'framer-motion'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient Mesh de base */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-cyan-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

      {/* Blobs animés - Emerald */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 dark:opacity-10"
      />

      {/* Blobs animés - Cyan */}
      <motion.div
        animate={{
          x: [0, -150, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 dark:opacity-10"
      />

      {/* Blobs animés - Purple */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -80, 0],
          scale: [1, 1.1, 1],
          rotate: [0, 180, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-0 left-1/3 w-[550px] h-[550px] bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 dark:opacity-10"
      />

      {/* Grille de points subtile */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
    </div>
  )
}
