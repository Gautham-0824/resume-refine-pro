"use client";
import { useEffect, useState, useRef } from "react";
import { useScroll, useTransform, motion, useSpring } from "framer-motion";

export function FrameAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const frameIndex = useTransform(smoothProgress, [0, 1], [1, 188]);
  const [currentFrame, setCurrentFrame] = useState(1);

  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      const idx = Math.min(Math.max(Math.floor(latest), 1), 188);
      setCurrentFrame(idx);
    });
    return unsubscribe;
  }, [frameIndex]);

  const frameStr = currentFrame.toString().padStart(4, "0");
  const fallbackFrame = "0001";

  return (
    <div ref={containerRef} className="h-[300vh] relative bg-black">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
        {/* Soft vignette overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "radial-gradient(circle at center, transparent 30%, #000 90%)" }} />
        
        <motion.div 
          className="relative w-[90vw] max-w-5xl aspect-[16/9] shadow-[0_0_100px_rgba(245,158,11,0.05)]"
          style={{
            scale: useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.95]),
            opacity: useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
          }}
        >
          <img 
            src={`/frames/${frameStr}.jpg`} 
            onError={(e) => { e.currentTarget.src = `/frames/${fallbackFrame}.jpg` }}
            alt="Resume Animation Frame"
            className="w-full h-full object-cover rounded-xl"
          />
        </motion.div>

        <motion.div 
          className="absolute bottom-20 z-20 text-white/40 tracking-[0.3em] text-sm font-light uppercase"
          style={{ opacity: useTransform(smoothProgress, [0.3, 0.4, 0.8, 0.9], [0, 1, 1, 0]) }}
        >
          Watch your resume transform.
        </motion.div>
      </div>
    </div>
  );
}
