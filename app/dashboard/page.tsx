"use client";
import { useEffect, useState } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { ATSResults } from "@/components/dashboard/ATSResults";
import { motion, AnimatePresence } from "framer-motion";
import { scanResumeWithGemini, parseResumeToSections } from "@/lib/gemini";
// Removed unused Link import
import { Sidebar } from "@/components/layout/Sidebar";

export default function Dashboard() {
  const { user, logout } = useMockAuth();
  const router = useRouter();
  const [resumeText, setResumeText] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null);

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
                   <p className="text-muted-foreground font-light">Upload your latest PDF or DOCX format resume to begin.</p>
                </div>
                <UploadZone onFileScanned={handleFileScanned} />
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
