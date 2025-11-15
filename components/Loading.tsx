// // app/loading.jsx
// import { Bot } from 'lucide-react';

// export default function Loading() {
//   return (
//     <div className="flex h-screen items-center justify-center bg-slate-50">
//       <div className="flex flex-col items-center">
//         <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
//           <Bot className="h-8 w-8 text-white" />
//         </div>
//         <div className="mt-6 text-center">
//           <h3 className="text-xl font-medium text-slate-900">Loading</h3>
//           <div className="mt-2 flex justify-center space-x-2">
//             <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0ms' }}></div>
//             <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '150ms' }}></div>
//             <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '300ms' }}></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// app/loading.jsx
"use client";

import { Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 relative overflow-hidden">

      {/* Ambient floating lights */}
      <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-blue-400/20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-purple-400/20 blur-3xl animate-pulse"></div>

      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="backdrop-blur-xl bg-white/30 p-10 rounded-3xl shadow-2xl border border-white/40 flex flex-col items-center"
      >
        {/* Bot Icon Container */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="relative"
        >
          {/* Animated glowing ring */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full border-4 border-blue-500/40"
          />

          {/* Floating bot icon */}
          <motion.div
            animate={{
              y: [-10, 10, -10],
            }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl"
          >
            <Bot className="h-10 w-10 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-2xl font-semibold text-slate-800"
        >
          <span className="animate-pulse">Loading your AI workspace</span>
        </motion.h3>

        {/* Shimmer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-[shimmer_2s_infinite]"
        >
          Optimizing neural pathways…
        </motion.p>

        {/* Dot-wave loader */}
        <div className="mt-6 flex space-x-2">
          {[0, 150, 300].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: delay / 1000,
              }}
              className="h-3 w-3 rounded-full bg-blue-600"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
