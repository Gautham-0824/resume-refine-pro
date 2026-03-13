"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { setSessionData } from "@/lib/sessionStore";

interface ATSResultsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis: any;
  resumeText: string;
}

export function ATSResults({ analysis, resumeText }: ATSResultsProps) {
  const router = useRouter();
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Animate score from 0
    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    const targetScore = analysis.atsScore || 0;
    
    let current = 0;
    const timer = setInterval(() => {
      current += targetScore / steps;
      if (current >= targetScore) {
        setScore(targetScore);
        clearInterval(timer);
      } else {
        setScore(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [analysis.atsScore]);

  const circleLength = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circleLength - (score / 100) * circleLength;

  const handleRefine = () => {
    // Save state and navigate to editor
    setSessionData("resume_raw", resumeText);
    setSessionData("resume_analysis", analysis);
    router.push("/editor");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Score Ring */}
        <div className="md:col-span-1 bg-card rounded-2xl p-8 border border-amber-500/20 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
          <h3 className="text-xl font-light tracking-wide mb-6">ATS Match</h3>
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="45" className="stroke-white/10" strokeWidth="8" fill="none" />
              <motion.circle 
                cx="80" cy="80" r="45" 
                className="stroke-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                strokeWidth="8" fill="none" 
                strokeDasharray={circleLength}
                strokeDashoffset={circleLength} // Start empty
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-light tracking-tighter text-foreground">{score}</span>
              <span className="text-xs text-muted-foreground tracking-widest uppercase mt-1">/ 100</span>
            </div>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="md:col-span-2 bg-card rounded-2xl p-8 border border-border flex flex-col justify-center gap-6">
           {Object.entries(analysis.scoreBreakdown).map(([key, value], idx) => (
             <div key={key} className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="capitalize text-muted-foreground font-light">{key}</span>
                 <span className="text-foreground tracking-wide">{value as number}/25</span>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((value as number) / 25) * 100}%` }}
                   transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                   className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                 />
               </div>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weaknesses */}
        <div className="space-y-4">
          <h3 className="text-xl font-light tracking-wide flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" /> Area for Improvement
          </h3>
          <div className="space-y-3">
            {analysis.weaknesses?.map((w: {category: string, issue: string, suggestion: string}, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                key={idx} className="bg-black/50 border-l-2 border-red-500/50 p-4 rounded-r-xl border-y border-r border-white/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-amber-500 font-medium">{w.category}</span>
                </div>
                <p className="text-sm text-foreground/90 mb-1 font-medium">{w.issue}</p>
                <p className="text-xs text-muted-foreground font-light">{w.suggestion}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="space-y-4">
          <h3 className="text-xl font-light tracking-wide flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" /> Strengths
          </h3>
          <div className="space-y-3">
             {analysis.strengths?.map((s: string, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                key={idx} className="bg-black/50 border-l-2 border-green-500/50 p-4 rounded-r-xl border-y border-r border-white/5"
              >
                <p className="text-sm text-foreground/90 font-light">{s}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button 
          onClick={handleRefine}
          className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-10 py-6 text-lg tracking-wide shadow-[0_0_20px_-5px_#f59e0b] hover:shadow-[0_0_30px_#f59e0b] transition-all duration-300 group"
        >
          Refine with AI <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

    </motion.div>
  );
}
