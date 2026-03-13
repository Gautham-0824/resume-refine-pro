"use client";
import { useEffect, useState } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { ATSResults } from "@/components/dashboard/ATSResults";
import { motion, AnimatePresence } from "framer-motion";
import { scanResumeWithGemini, parseResumeToSections } from "@/lib/gemini";
import { Sidebar } from "@/components/layout/Sidebar";
import { UploadCloud, FilePlus2 } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useMockAuth();
  const router = useRouter();
  const [resumeText, setResumeText] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null);
  
  const [selectedCard, setSelectedCard] = useState<'upload' | 'build' | null>(null);

  useEffect(() => {
    // If not logged in, redirect
    if (user === null) {
      router.push("/");
    }
  }, [user, router]);

  const handleFileScanned = async (text: string, fileName: string) => {
    setResumeText(text);
    try {
      const result = await scanResumeWithGemini(text);
      setAnalysis(result);

      // Parse sections for the editor right now so it's ready in localStorage
      let parsedSections = {};
      try {
         parsedSections = await parseResumeToSections(text);
      } catch (parseError) {
         console.error("Failed to parse sections, using fallback", parseError);
         parsedSections = { summary: text.substring(0, 500) + "..." };
      }

      // Save to localStorage
      const newResume = {
        id: crypto.randomUUID(),
        name: fileName,
        timestamp: Date.now(),
        atsScore: result.atsScore,
        scoreBreakdown: result.scoreBreakdown,
        weaknesses: result.weaknesses || [],
        strengths: result.strengths || [],
        rawText: text,
        parsedSections: parsedSections,
      };
      
      const stored = localStorage.getItem("resumerefine_saved_resumes");
      let savedList = stored ? JSON.parse(stored) : [];
      savedList.unshift(newResume);
      if (savedList.length > 20) savedList = savedList.slice(0, 20);
      localStorage.setItem("resumerefine_saved_resumes", JSON.stringify(savedList));

    } catch (err) {
      console.error("Dashboard scan catch:", err);
      alert("Error scanning resume. Please try again.");
    }
  };

  if (!user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-foreground flex">
      {/* Shared Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-20 px-6 relative overflow-y-auto">
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {!analysis ? (
              <motion.div 
                key="upload-view"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
                className="pt-12"
              >
                <div className="text-center mb-12">
                   <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">Let&apos;s refine your <span className="text-amber-500">resume</span>.</h1>
                   <p className="text-muted-foreground font-light mb-8">Choose how you want to start.</p>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                     {/* Upload Card */}
                     <div 
                       onClick={() => setSelectedCard(selectedCard === 'upload' ? null : 'upload')}
                       className={`bg-[#0a0a0a] border ${selectedCard === 'upload' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]'} rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center justify-center text-center group`}
                     >
                       <UploadCloud className={`w-8 h-8 mb-4 ${selectedCard === 'upload' ? 'text-amber-500' : 'text-muted-foreground group-hover:text-amber-500/70'} transition-colors`} />
                       <h3 className="text-xl font-medium mb-2">Upload Resume</h3>
                       <p className="text-sm text-muted-foreground/80 font-light">Scan your existing resume and refine it with AI.</p>
                     </div>

                     {/* Build Card */}
                     <div 
                       onClick={() => {
                         setSelectedCard('build');
                         router.push('/dashboard/builder');
                       }}
                       className={`bg-[#0a0a0a] border ${selectedCard === 'build' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]'} rounded-2xl p-6 cursor-pointer transition-all flex flex-col items-center justify-center text-center group`}
                     >
                       <FilePlus2 className={`w-8 h-8 mb-4 ${selectedCard === 'build' ? 'text-amber-500' : 'text-muted-foreground group-hover:text-amber-500/70'} transition-colors`} />
                       <h3 className="text-xl font-medium mb-2">Build from Blank</h3>
                       <p className="text-sm text-muted-foreground/80 font-light">Answer a few questions and let AI build you a perfect resume.</p>
                     </div>
                   </div>
                </div>

                <AnimatePresence>
                  {selectedCard === 'upload' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <UploadZone onFileScanned={handleFileScanned} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                key="results-view"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-12">
                   <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">Analysis <span className="text-amber-500">Complete</span>.</h1>
                   <p className="text-muted-foreground font-light">Here is how your resume stacks up against modern ATS requirements.</p>
                </div>
                <ATSResults analysis={analysis} resumeText={resumeText!} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
