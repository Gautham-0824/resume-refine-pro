"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/hooks/useMockAuth";
import { useRouter } from "next/navigation";

export function HeroText() {
  const [show, setShow] = useState(false);
  const { user, openModal } = useMockAuth();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  const text = "Resume Refine Pro";

  if (!show) return <div className="h-screen w-full bg-black z-50 fixed inset-0" />;

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden bg-[url('/noise.png')]">
      <div className="absolute top-8 right-8 z-50">
        {user?.loggedIn ? (
          <Button variant="ghost" className="text-white border-white/20 hover:bg-white/10 hover:text-white" onClick={() => router.push("/dashboard")}>
            Dashboard →
          </Button>
        ) : (
          <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10 hover:text-white transition-colors" onClick={openModal}>
            Sign In
          </Button>
        )}
      </div>

      <motion.div className="flex z-10 font-[family-name:var(--font-geist-sans)]">
        {text.split("").map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="text-6xl md:text-7xl lg:text-8xl font-light text-foreground tracking-tight"
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="mt-6 text-muted-foreground tracking-[0.2em] text-xs sm:text-sm uppercase z-10 text-center px-4"
      >
        Your resume, refined to beat every ATS. Powered by AI.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
        className="mt-12 z-10"
      >
        <Button 
          className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-8 py-6 text-lg tracking-wide shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_0px_rgba(245,158,11,0.6)] transition-all duration-300 transform motion-safe:hover:-translate-y-1"
          onClick={() => router.push("/dashboard")}
        >
          Refine My Resume →
        </Button>
      </motion.div>
    </div>
  );
}
