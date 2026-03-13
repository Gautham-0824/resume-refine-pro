"use client";
import { Button } from "@/components/ui/button";
import { Download, IterationCcw, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/hooks/useMockAuth";

interface TopBarProps {
  score: number;
  onRecalculate: () => void;
  onExport: () => void;
}

export function TopBar({ score, onRecalculate, onExport }: TopBarProps) {
  const router = useRouter();
  
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black z-50 shrink-0">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/dashboard")}
          className="text-muted-foreground hover:text-white hover:bg-white/5"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-xl font-light tracking-tighter">
          Resume <span className="text-amber-500 font-medium tracking-tight">Pro</span>
        </div>
      </div>

      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">ATS Score</span>
          <span className="font-medium text-amber-500">{score}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRecalculate}
          className="text-xs tracking-wider uppercase text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 h-8"
        >
          <IterationCcw className="w-3.5 h-3.5 mr-2" /> Recalculate
        </Button>
      </div>

      <div>
        <Button 
          onClick={onExport}
          className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm tracking-wide shadow-[0_0_15px_-3px_#f59e0b] shadow-amber-500/20 px-6 h-9 rounded-full"
        >
          <Download className="w-4 h-4 mr-2" /> Export PDF
        </Button>
      </div>
    </header>
  );
}
