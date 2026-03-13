"use client";
import { useEffect, useState } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Edit, RefreshCw, Download, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { getSessionData, setSessionData } from "@/lib/sessionStore";
import { scanResumeWithGemini } from "@/lib/gemini";

// The structure of a saved resume
type SavedResume = {
  id: string;
  name: string;
  timestamp: number;
  atsScore: number;
  scoreBreakdown: any;
  weaknesses: any[];
  strengths: string[];
  rawText: string;
  parsedSections: any;
};

export default function MyResumesPage() {
  const { user } = useMockAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [isScanningId, setIsScanningId] = useState<string | null>(null);
  const [scoreChanges, setScoreChanges] = useState<{ [key: string]: number }>({});
  
  useEffect(() => {
    if (user === null) {
      router.push("/");
      return;
    }
    
    // Load from local storage
    const stored = localStorage.getItem("resumerefine_saved_resumes");
    if (stored) {
      try {
         setResumes(JSON.parse(stored));
      } catch (e) {
         console.error("Failed to parse saved resumes", e);
      }
    }
  }, [user, router]);

  if (!user) return <div className="min-h-screen bg-black" />;

  const formatDistanceToNow = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const deleteResume = (id: string) => {
     const updated = resumes.filter(r => r.id !== id);
     setResumes(updated);
     localStorage.setItem("resumerefine_saved_resumes", JSON.stringify(updated));
  };

  const openInEditor = (resume: SavedResume) => {
     setSessionData("resume_raw", resume.rawText);
     setSessionData("resume_sections", resume.parsedSections);
     setSessionData("resume_analysis", { atsScore: resume.atsScore, scoreBreakdown: resume.scoreBreakdown, weaknesses: resume.weaknesses, strengths: resume.strengths });
     router.push("/editor");
  };

  const handleRescan = async (resume: SavedResume) => {
     if (isScanningId) return;
     setIsScanningId(resume.id);
     try {
        const result = await scanResumeWithGemini(resume.rawText);
        const oldScore = resume.atsScore;
        const newScore = result.atsScore;
        const diff = newScore - oldScore;
        
        if (diff !== 0) {
           setScoreChanges(prev => ({ ...prev, [resume.id]: diff }));
           setTimeout(() => {
              setScoreChanges(prev => { const copy = {...prev}; delete copy[resume.id]; return copy; });
           }, 4000);
        }

        const updated = resumes.map(r => r.id === resume.id ? { ...r, atsScore: newScore, scoreBreakdown: result.scoreBreakdown, weaknesses: result.weaknesses || [], strengths: result.strengths || [] } : r);
        setResumes(updated);
        localStorage.setItem("resumerefine_saved_resumes", JSON.stringify(updated));
     } catch (e) {
        alert("Failed to rescan resume.");
     } finally {
        setIsScanningId(null);
     }
  };

  const handleExportPdf = async (resume: SavedResume) => {
     const html2pdf = (await import("html2pdf.js")).default;
     
     // Create a temporary hidden div to render the resume content into it for PDF generation
     const container = document.createElement("div");
     container.style.position = "absolute";
     container.style.left = "-9999px";
     container.style.width = "800px"; // Print width
     container.style.color = "black";
     container.style.backgroundColor = "white";
     container.style.padding = "40px";
     container.style.fontFamily = "sans-serif";
     
     // Construct simple printable HTML based on the saved sections
     const s = resume.parsedSections || {};
     container.innerHTML = `
        <div style="margin-bottom: 20px;">
           <h1 style="font-size: 24px; margin-bottom: 5px;">${resume.name.replace('.pdf', '').replace('.docx', '')}</h1>
           <p style="font-size: 14px; color: #444;">${s.contact || ""}</p>
        </div>
        ${s.summary ? `<div><h2 style="font-size: 18px; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px;">Summary</h2><p style="font-size: 14px; white-space: pre-wrap;">${s.summary}</p></div>` : ""}
        ${s.experience ? `<div style="margin-top: 20px;"><h2 style="font-size: 18px; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px;">Experience</h2><p style="font-size: 14px; white-space: pre-wrap;">${s.experience}</p></div>` : ""}
        ${s.education ? `<div style="margin-top: 20px;"><h2 style="font-size: 18px; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px;">Education</h2><p style="font-size: 14px; white-space: pre-wrap;">${s.education}</p></div>` : ""}
        ${s.skills ? `<div style="margin-top: 20px;"><h2 style="font-size: 18px; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px;">Skills</h2><p style="font-size: 14px; white-space: pre-wrap;">${s.skills}</p></div>` : ""}
        ${s.projects ? `<div style="margin-top: 20px;"><h2 style="font-size: 18px; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px;">Projects</h2><p style="font-size: 14px; white-space: pre-wrap;">${s.projects}</p></div>` : ""}
     `;
     document.body.appendChild(container);

     const opt = {
       margin:       0.5,
       filename:     `${resume.name.split('.')[0]}_Refined.pdf`,
       image:        { type: 'jpeg', quality: 0.98 },
       html2canvas:  { scale: 2, useCORS: true },
       jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
     };

     try {
       // @ts-expect-error html2pdf untyped
       await html2pdf().set(opt).from(container).save();
     } finally {
       document.body.removeChild(container);
     }
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex">
      <Sidebar />
      <main className="flex-1 flex flex-col p-8 md:p-12 relative overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">My <span className="text-amber-500">Resumes</span></h1>
              <p className="text-muted-foreground font-light">{resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} saved to your device.</p>
            </div>
            <Button 
              onClick={() => router.push("/dashboard")}
              className="mt-4 md:mt-0 bg-amber-500 hover:bg-amber-400 text-black font-medium tracking-wide shadow-[0_0_15px_-3px_#f59e0b]"
            >
              Upload New
            </Button>
          </div>

          {resumes.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]"
            >
               <div className="p-4 rounded-full bg-white/5 mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
               </div>
               <h3 className="text-xl font-medium tracking-wide text-foreground mb-2">No resumes yet</h3>
               <p className="text-muted-foreground font-light text-center max-w-sm mb-6">You need to upload and scan a resume on the dashboard before it will appear here.</p>
               <Button onClick={() => router.push("/dashboard")} variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                 Go to Dashboard
               </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               <AnimatePresence>
                 {resumes.map((resume, idx) => (
                   <motion.div
                     key={resume.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col group hover:border-amber-500/30 transition-colors relative overflow-hidden"
                   >
                     {/* Scanning Overlay */}
                     {isScanningId === resume.id && (
                        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                           <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                           <span className="text-amber-500 text-xs font-medium tracking-widest uppercase">Re-scanning...</span>
                        </div>
                     )}

                     {/* Card Header */}
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 pr-4">
                           <h3 className="font-medium text-lg leading-tight truncate mb-1" title={resume.name}>{resume.name}</h3>
                           <p className="text-xs text-muted-foreground">{formatDistanceToNow(resume.timestamp)}</p>
                        </div>
                        {/* Mini ATS Score Ring */}
                        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                           <svg className="w-full h-full transform -rotate-90 pointer-events-none">
                             <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                             <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                               strokeDasharray={`${2 * Math.PI * 20}`}
                               strokeDashoffset={`${2 * Math.PI * 20 * (1 - resume.atsScore / 100)}`}
                               strokeLinecap="round"
                               className={resume.atsScore >= 75 ? "text-green-500" : resume.atsScore >= 50 ? "text-amber-500" : "text-red-500"}
                               style={{ transition: "stroke-dashoffset 1s ease-out" }}
                             />
                           </svg>
                           <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{resume.atsScore}</span>
                           
                           {/* Score Change Indicator */}
                           <AnimatePresence>
                             {scoreChanges[resume.id] !== undefined && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: -20 }}
                                 exit={{ opacity: 0 }}
                                 className={`absolute top-0 right-0 font-bold text-sm \${scoreChanges[resume.id] > 0 ? "text-green-400" : "text-red-400"}`}
                               >
                                 {scoreChanges[resume.id] > 0 ? "+" : ""}{scoreChanges[resume.id]}
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                     </div>

                     {/* Weaknesses Tags */}
                     <div className="flex flex-wrap gap-2 mb-6 flex-1 items-start">
                        {resume.weaknesses.slice(0, 2).map((w: any, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-500/90 border border-amber-500/20 font-medium">
                            {w.category} Issue
                          </span>
                        ))}
                        {resume.weaknesses.length === 0 && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-500/90 border border-green-500/20 font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Excellent Shape
                          </span>
                        )}
                     </div>

                     {/* Actions */}
                     <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <Button onClick={() => openInEditor(resume)} variant="ghost" className="flex-1 h-9 bg-white/5 hover:bg-white/10 text-xs text-foreground">
                           <Edit className="w-3 h-3 mr-2" /> Editor
                        </Button>
                        <Button 
                           variant="ghost" 
                           onClick={() => handleRescan(resume)}
                           disabled={isScanningId !== null}
                           className="h-9 px-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                           title="Re-scan"
                        >
                           <RefreshCw className="w-3 h-3" />
                        </Button>
                        <Button 
                           variant="ghost" 
                           onClick={() => handleExportPdf(resume)}
                           className="h-9 px-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                           title="Download PDF"
                        >
                           <Download className="w-3 h-3" />
                        </Button>
                        <Button 
                           onClick={() => deleteResume(resume.id)}
                           variant="ghost" 
                           className="h-9 px-3 bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                           title="Delete"
                        >
                           <Trash2 className="w-3 h-3" />
                        </Button>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
