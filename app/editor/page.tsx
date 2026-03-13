"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/hooks/useMockAuth";
import { getSessionData, setSessionData } from "@/lib/sessionStore";
import { TopBar } from "@/components/editor/TopBar";
import { ChatPanel } from "@/components/editor/ChatPanel";
import { ResumePanel } from "@/components/editor/ResumePanel";
import { parseResumeToSections, editResumeWithGemini, scanResumeWithGemini } from "@/lib/gemini";

export default function EditorPage() {
  const router = useRouter();
  const { user } = useMockAuth();
  
  // Handle parsed text in state if genuinely needed, but currently just parsed into sections
  const [sections, setSections] = useState<{ [key: string]: string }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null);
  
  const [isTypingField, setIsTypingField] = useState<{ section: string | null }>({ section: null });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push("/");
      return;
    }

    // Load from session
    const text = getSessionData("resume_raw");
    const anlys = getSessionData("resume_analysis");

    if (!text || !anlys) {
      router.push("/dashboard");
      return;
    }

    // Removed rawtext tracking
    setAnalysis(anlys);

    // Initial parse of raw text to sections if not already done
    const savedSections = getSessionData("resume_sections");
    if (savedSections && Object.keys(savedSections).length > 0 && (savedSections.contact || savedSections.summary || savedSections.experience)) {
      setSections(savedSections);
    } else {
      initializeSections(text);
    }
  }, [user, router]);

  const initializeSections = async (text: string) => {
    setIsProcessing(true);
    try {
      const parsed = await parseResumeToSections(text);
      setSections(parsed);
      setSessionData("resume_sections", parsed);
    } catch (e) {
      console.error(e);
      // Fallback
      setSections({ summary: text.substring(0, 500) + "..." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstruction = async (instruction: string) => {
    setIsProcessing(true);
    try {
      const result = await editResumeWithGemini(sections, instruction);
      
      // Apply changes sequentially with typewriter effect
      const updatedSections = { ...sections };
      for (const change of result.changes) {
         if (change.section && updatedSections[change.section] !== undefined) {
            updatedSections[change.section] = change.newContent;
            setIsTypingField({ section: change.section });
            // Small delay to simulate focus shift before typing starts
            await new Promise(r => setTimeout(r, 500));
         }
      }
      
      setSections(updatedSections);
      setSessionData("resume_sections", updatedSections);
      
      // Clear typing indicator after a while
      setTimeout(() => setIsTypingField({ section: null }), 3000);

    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecalculate = async () => {
    // Collect text from current sections
    setIsProcessing(true);
    const combinedText = Object.values(sections).join("\n\n");
    try {
      const result = await scanResumeWithGemini(combinedText);
      setAnalysis(result);
      setSessionData("resume_analysis", result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("resume-export-container");
    
    if (element) {
       // Temporarily adjust styles for pure print
       const opt = {
         margin:       0,
         filename:     'Resume_Refined.pdf',
         image:        { type: 'jpeg', quality: 0.98 },
         html2canvas:  { scale: 2, useCORS: true, backgroundColor: "#000000" },
         jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
       };

       // @ts-expect-error html2pdf lacks strict typings here
       html2pdf().set(opt).from(element).save();
    }
  };

  if (!user || (!sections.contact && !sections.summary && !sections.experience)) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-amber-500 animate-pulse">Loading Workspace...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden selection:bg-amber-500/30">
      <TopBar 
        score={analysis?.atsScore || 0} 
        onRecalculate={handleRecalculate} 
        onExport={handleExport} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Resume Editor (55%) */}
        <div className="w-[55%] h-full shrink-0 relative bg-[#0a0a0a]">
          <ResumePanel sections={sections} isTypingField={isTypingField} />
        </div>

        {/* Right Panel: AI Chat (45%) */}
        <div className="w-[45%] h-full shrink-0">
          <ChatPanel 
             weaknesses={analysis?.weaknesses || []} 
             onInstruction={handleInstruction} 
             isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
