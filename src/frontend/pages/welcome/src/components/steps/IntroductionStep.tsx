import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Eye, Zap, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroductionStepProps {
  onContinue: () => void;
}

const distractions = [
  {
    text: "Ronaldo vs Messi",
    color: "from-red-500 to-orange-500",
    delay: 0,
    size: 160,
    x: -300,
    y: -200,
  },
  {
    text: "US Elections",
    color: "from-blue-500 to-cyan-500",
    delay: 0.1,
    size: 140,
    x: 350,
    y: -250,
  },
  {
    text: "Gemini AI",
    color: "from-purple-500 to-pink-500",
    delay: 0.2,
    size: 120,
    x: -400,
    y: 100,
  },
  { text: "Bitcoin", color: "from-yellow-500 to-amber-500", delay: 0.3, size: 110, x: 400, y: 150 },
  {
    text: "Vision Pro",
    color: "from-cyan-500 to-blue-500",
    delay: 0.4,
    size: 150,
    x: -350,
    y: 250,
  },
  {
    text: "Diet Plans",
    color: "from-green-500 to-emerald-500",
    delay: 0.5,
    size: 130,
    x: 380,
    y: -100,
  },
  {
    text: "Doomscrolling",
    color: "from-orange-500 to-red-500",
    delay: 0.6,
    size: 170,
    x: 100,
    y: 280,
  },
  { text: "AI Drama", color: "from-pink-500 to-rose-500", delay: 0.7, size: 115, x: -200, y: -280 },
  { text: "Crypto", color: "from-amber-500 to-yellow-500", delay: 0.8, size: 105, x: 250, y: 200 },
  {
    text: "Politics",
    color: "from-indigo-500 to-purple-500",
    delay: 0.9,
    size: 125,
    x: -450,
    y: -50,
  },
  { text: "Trends", color: "from-teal-500 to-cyan-500", delay: 1.0, size: 95, x: 450, y: 50 },
  { text: "Drama", color: "from-rose-500 to-pink-500", delay: 1.1, size: 100, x: -100, y: 300 },
];

// Small decorative circles without text
const decorativeCircles = [
  { color: "from-red-400 to-orange-400", size: 60, x: -500, y: -150, delay: 0.2 },
  { color: "from-blue-400 to-cyan-400", size: 50, x: 500, y: -200, delay: 0.4 },
  { color: "from-purple-400 to-pink-400", size: 70, x: -480, y: 200, delay: 0.6 },
  { color: "from-green-400 to-emerald-400", size: 55, x: 480, y: 250, delay: 0.8 },
  { color: "from-yellow-400 to-amber-400", size: 65, x: -250, y: -320, delay: 1.0 },
  { color: "from-cyan-400 to-blue-400", size: 45, x: 300, y: -300, delay: 1.2 },
  { color: "from-pink-400 to-rose-400", size: 75, x: -520, y: 50, delay: 1.4 },
  { color: "from-indigo-400 to-purple-400", size: 50, x: 520, y: -50, delay: 1.6 },
  { color: "from-teal-400 to-cyan-400", size: 60, x: 200, y: 320, delay: 1.8 },
  { color: "from-orange-400 to-red-400", size: 55, x: -300, y: 320, delay: 2.0 },
];

export const IntroductionStep: React.FC<IntroductionStepProps> = ({ onContinue }) => {
  const [scene, setScene] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowText(true), 5500), // Show text after 5.5 seconds (2 seconds longer)
      setTimeout(() => setScene(1), 7500),
      setTimeout(() => setScene(2), 11500),
      setTimeout(() => setScene(3), 15500),
      setTimeout(() => setScene(4), 19500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Scene 0: Chaos - Overwhelming Content */}
      <AnimatePresence>
        {scene === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Animated distraction circles - different sizes filling the screen */}
            {distractions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.15, 1],
                  opacity: [0, 1, 0.95],
                  x: [0, item.x * 0.7, item.x],
                  y: [0, item.y * 0.7, item.y],
                }}
                transition={{
                  duration: 4,
                  delay: item.delay,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  width: item.size,
                  height: item.size,
                }}
              >
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${item.color} text-white font-semibold flex items-center justify-center text-center shadow-2xl p-4`}
                  style={{
                    fontSize: item.size > 140 ? "15px" : item.size > 120 ? "13px" : "11px",
                  }}
                >
                  {item.text}
                </div>
              </motion.div>
            ))}

            {/* Small decorative circles without text */}
            {decorativeCircles.map((item, i) => (
              <motion.div
                key={`deco-${i}`}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.2, 1],
                  opacity: [0, 0.7, 0.5],
                  x: [0, item.x * 0.6, item.x],
                  y: [0, item.y * 0.6, item.y],
                }}
                transition={{
                  duration: 5,
                  delay: item.delay,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  width: item.size,
                  height: item.size,
                }}
              >
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${item.color} shadow-xl blur-sm`}
                />
              </motion.div>
            ))}

            {/* Center message - appears after 3 seconds */}
            <AnimatePresence>
              {showText && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative z-10"
                >
                  <div className="backdrop-blur-xl bg-slate-900/90 rounded-3xl px-16 py-12 border border-slate-700/50 shadow-2xl">
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-6xl font-bold text-white text-center"
                    >
                      Drowning in
                    </motion.p>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl font-bold bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent text-center mt-2"
                    >
                      endless noise?
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 1: The Problem - Scattered Attention */}
      <AnimatePresence>
        {scene === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative">
              {/* Exploding/Fragmenting visualization */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {/* Center broken pieces */}
                {[...Array(20)].map((_, i) => {
                  const angle = (i / 20) * Math.PI * 2;
                  const distance = 180 + Math.random() * 60;
                  const size = 30 + Math.random() * 40;
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
                      animate={{
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        scale: [0, 1.2, 1],
                        opacity: [0, 0.9, 0.7],
                        rotate: [0, Math.random() * 360, Math.random() * 720],
                      }}
                      transition={{
                        duration: 2.5,
                        delay: i * 0.05,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeOut",
                      }}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        width: size,
                        height: size,
                        marginLeft: -size / 2,
                        marginTop: -size / 2,
                      }}
                    >
                      <div
                        className="w-full h-full rounded-lg bg-gradient-to-br shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, hsl(${i * 18}, 70%, 60%), hsl(${i * 18 + 30}, 70%, 50%))`,
                        }}
                      />
                    </motion.div>
                  );
                })}

                {/* Chaotic lines connecting fragments */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ width: 600, height: 600, left: -300, top: -300 }}
                >
                  {[...Array(8)].map((_, i) => {
                    const angle1 = (i / 8) * Math.PI * 2;
                    return (
                      <motion.line
                        key={i}
                        x1="300"
                        y1="300"
                        x2={300 + Math.cos(angle1) * 200}
                        y2={300 + Math.sin(angle1) * 200}
                        stroke={`hsl(${i * 45}, 70%, 60%)`}
                        strokeWidth="2"
                        opacity="0.3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1, 0] }}
                        transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                      />
                    );
                  })}
                </svg>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ zIndex: 9999 }}
                className="text-center mt-32 space-y-4 z-999"
              >
                <h2 className="text-7xl font-bold text-white">
                  Your attention is{" "}
                  <span className="bg-gradient-to-r from-red-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                    scattered
                  </span>
                </h2>
                <p className="text-3xl text-slate-400 font-light">
                  Pulled in every direction, never truly present
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 2: The Transformation */}
      <AnimatePresence>
        {scene === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative w-full max-w-7xl px-8">
              {/* Transformation visualization - Chaos to Order */}
              <div className="flex items-center justify-center gap-32 mb-20">
                {/* Before - Chaotic scattered pieces */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="flex flex-col items-center space-y-8"
                >
                  <div className="relative w-48 h-48">
                    {/* Scattered chaotic pieces */}
                    {[...Array(12)].map((_, i) => {
                      const angle = (i / 12) * Math.PI * 2;
                      const distance = 60;
                      return (
                        <motion.div
                          key={i}
                          animate={{
                            x: Math.cos(angle) * distance,
                            y: Math.sin(angle) * distance,
                            rotate: [0, 360],
                            scale: [0.8, 1.2, 0.8],
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute top-1/2 left-1/2 w-8 h-8 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, hsl(${i * 30}, 70%, 60%), hsl(${i * 30 + 30}, 70%, 50%))`,
                            marginLeft: -16,
                            marginTop: -16,
                          }}
                        />
                      );
                    })}
                    {/* Chaotic lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-30">
                      {[...Array(6)].map((_, i) => (
                        <motion.line
                          key={i}
                          x1="96"
                          y1="96"
                          x2={96 + Math.cos((i / 6) * Math.PI * 2) * 60}
                          y2={96 + Math.sin((i / 6) * Math.PI * 2) * 60}
                          stroke="#ef4444"
                          strokeWidth="2"
                          animate={{ opacity: [0.3, 0.7, 0.3] }}
                          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </svg>
                  </div>
                  <p className="text-3xl text-slate-500 font-light">Chaos</p>
                </motion.div>

                {/* Transformation arrow */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-28 h-28 text-emerald-400 drop-shadow-lg" />
                  </motion.div>
                </motion.div>

                {/* After - Organized focused structure */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-col items-center space-y-8"
                >
                  <div className="relative w-48 h-48">
                    {/* Organized pieces forming a pattern */}
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"
                    />

                    {/* Center core */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg" />
                    </motion.div>

                    {/* Orbiting organized pieces */}
                    {[...Array(8)].map((_, i) => {
                      const angle = (i / 8) * Math.PI * 2;
                      const distance = 70;
                      return (
                        <motion.div
                          key={i}
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.1,
                          }}
                          className="absolute top-1/2 left-1/2"
                          style={{
                            width: 50,
                            height: 50,
                            marginLeft: -25,
                            marginTop: -25,
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg"
                            style={{
                              position: "absolute",
                              left: Math.cos(angle) * distance + 22,
                              top: Math.sin(angle) * distance + 22,
                            }}
                          />
                        </motion.div>
                      );
                    })}

                    {/* Connecting rings */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-36 h-36 border-2 border-emerald-400/40 rounded-full" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-44 h-44 border-2 border-emerald-400/20 rounded-full" />
                    </motion.div>

                    <Sparkles className="w-14 h-14 absolute -top-3 -right-3 text-yellow-300 animate-pulse" />
                  </div>
                  <p className="text-3xl text-emerald-400 font-bold">Focus</p>
                </motion.div>
              </div>

              {/* Text */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-6"
              >
                <h2 className="text-7xl font-bold text-white">
                  Transform your{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    browsing
                  </span>
                </h2>
                <p className="text-3xl text-slate-400 font-light">
                  From mindless scrolling to mindful engagement
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 3: How It Works */}
      <AnimatePresence>
        {scene === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-7xl px-8">
              {/* Brand */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <div className="flex items-center justify-center gap-5 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Brain className="w-20 h-20 text-violet-400" />
                  </motion.div>
                  <h1 className="text-8xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                    NeuroPilot
                  </h1>
                </div>
                <p className="text-2xl text-slate-400">Your journey to mindful browsing</p>
              </motion.div>

              {/* Flowing Journey Path - Creative Design */}
              <div className="relative h-[500px]">
                {/* Animated flowing path */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 500">
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M 100 250 Q 400 100, 600 250 T 1100 250"
                    stroke="url(#pathGradient)"
                    strokeWidth="4"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </svg>

                {/* Step 1 - Track */}
                <motion.div
                  initial={{ scale: 0, x: -100, opacity: 0 }}
                  animate={{ scale: 1, x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                  className="absolute left-[8%] top-[35%]"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className="relative group cursor-pointer"
                  >
                    {/* Pulsing glow */}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-full"
                    />

                    {/* Main circle */}
                    <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl border-4 border-cyan-300/50">
                      <Eye className="w-16 h-16 text-white" />
                    </div>

                    {/* Number badge */}
                    <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-white text-cyan-600 flex items-center justify-center font-black text-xl shadow-lg">
                      1
                    </div>

                    {/* Info card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="absolute top-48 left-1/2 -translate-x-1/2 w-64"
                    >
                      <div className="backdrop-blur-xl bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                        <h3 className="text-2xl font-bold text-white mb-2">Track</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Watch your attention patterns emerge as you browse naturally
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Step 2 - Focus */}
                <motion.div
                  initial={{ scale: 0, y: -100, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
                  className="absolute left-1/2 -translate-x-1/2 top-[15%]"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    className="relative group cursor-pointer"
                  >
                    {/* Pulsing glow */}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full"
                    />

                    {/* Main circle */}
                    <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center shadow-2xl border-4 border-purple-300/50">
                      <Brain className="w-20 h-20 text-white" />
                    </div>

                    {/* Number badge */}
                    <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-white text-purple-600 flex items-center justify-center font-black text-xl shadow-lg">
                      2
                    </div>

                    {/* Info card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 }}
                      className="absolute top-56 left-1/2 -translate-x-1/2 w-64"
                    >
                      <div className="backdrop-blur-xl bg-slate-900/80 rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                        <h3 className="text-2xl font-bold text-white mb-2">Focus</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Build deep knowledge through sustained, meaningful engagement
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Step 3 - Grow */}
                <motion.div
                  initial={{ scale: 0, x: 100, opacity: 0 }}
                  animate={{ scale: 1, x: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.8, type: "spring" }}
                  className="absolute right-[8%] top-[35%]"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className="relative group cursor-pointer"
                  >
                    {/* Pulsing glow */}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full"
                    />

                    {/* Main circle */}
                    <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl border-4 border-emerald-300/50">
                      <TrendingUp className="w-16 h-16 text-white" />
                    </div>

                    {/* Number badge */}
                    <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black text-xl shadow-lg">
                      3
                    </div>

                    {/* Info card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.6 }}
                      className="absolute top-48 left-1/2 -translate-x-1/2 w-64"
                    >
                      <div className="backdrop-blur-xl bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/30 shadow-xl">
                        <h3 className="text-2xl font-bold text-white mb-2">Grow</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Reinforce learning with AI-powered quizzes and insights
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Connecting particles */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: [100 + i * 50, 1100],
                      y: [250, 250 + Math.sin(i) * 100],
                    }}
                    transition={{
                      duration: 4,
                      delay: 2 + i * 0.1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 4: CTA */}
      <AnimatePresence>
        {scene === 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Animated background orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              className="absolute w-80 h-80 rounded-full bg-violet-500/30 blur-3xl"
            />

            {/* Immersive CTA Design */}
            <div className="relative z-10 max-w-5xl mx-auto">
              {/* Dramatic text */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-center space-y-8 mb-16"
              >
                <div className="space-y-4">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-8xl font-black leading-tight"
                  >
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Ready to
                    </span>
                  </motion.h2>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-8xl font-black leading-tight"
                  >
                    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                      reclaim focus?
                    </span>
                  </motion.h2>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-3xl text-slate-300 font-light max-w-2xl mx-auto"
                >
                  Transform every moment you spend online into an opportunity for growth
                </motion.p>
              </motion.div>

              {/* Magnetic button */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  {/* Button glow */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 blur-2xl rounded-3xl"
                  />

                  <Button
                    size="lg"
                    onClick={onContinue}
                    className="relative text-3xl px-24 py-14 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-2xl border-0 font-black rounded-3xl overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-4">
                      Begin Your Journey
                      <motion.span
                        animate={{ x: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-4xl"
                      >
                        →
                      </motion.span>
                    </span>

                    {/* Shimmer effect */}
                    <motion.div
                      animate={{ x: [-200, 200] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-32 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
