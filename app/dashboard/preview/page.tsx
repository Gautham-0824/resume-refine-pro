"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/hooks/useMockAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit3, FileWarning } from "lucide-react";
import { getSessionData, setSessionData } from "@/lib/sessionStore";
import { scanResumeWithGemini } from "@/lib/gemini";
import { ATSResults } from "@/components/dashboard/ATSResults";

export default function PreviewPage() {
  const { user } = useMockAuth();
  const router = useRouter();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeData, setResumeData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetRole, setTargetRole] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [isGeneratingATS, setIsGeneratingATS] = useState(true);
  
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user === null) router.push("/");
    
    const data = getSessionData("generated_resume");
    const builderData = getSessionData("builder_data");
    
    if (!data) {
      router.push("/dashboard");
      return;
    }

    setResumeData(data);
    setTargetRole(builderData?.targetRole || { jobTitle: "Custom Resume" });
  }, [user, router]);

  useEffect(() => {
    if (!resumeData) return;

    // 1. Build plain text version for ATS scan
    let plainText = "";
    if (resumeData.contactInfo) plainText += `${resumeData.contactInfo.name}\n${resumeData.contactInfo.email}\n`;
    if (resumeData.summary) plainText += `\nSUMMARY\n${resumeData.summary}\n`;
    if (resumeData.experience) {
       plainText += "\nEXPERIENCE\n";
       resumeData.experience.forEach((e: any) => {
         plainText += `${e.title} at ${e.company}\n`;
         if (e.bullets) e.bullets.forEach((b: string) => plainText += `- ${b}\n`);
       });
    }
    // ... we don't need a PERFECT text rendering, just enough for the AI to parse
    if (resumeData.skills) plainText += `\nSKILLS\n${JSON.stringify(resumeData.skills)}\n`;

    // 2. Run ATS Scan
    const runATS = async () => {
      setIsGeneratingATS(true);
      try {
        const analysis = await scanResumeWithGemini(plainText);
        setAtsAnalysis(analysis);
        
        // 3. Save to localStorage once ATS comes back
        const newResume = {
          id: crypto.randomUUID(),
          name: targetRole?.jobTitle ? `${targetRole.jobTitle} Resume.pdf` : "Generated Resume.pdf",
          timestamp: Date.now(),
          atsScore: analysis.atsScore,
          scoreBreakdown: analysis.scoreBreakdown,
          weaknesses: analysis.weaknesses || [],
          strengths: analysis.strengths || [],
          rawText: plainText,
          // Mapped parsed sections for editor compatibility
          parsedSections: {
             contact: resumeData.contactInfo ? `${resumeData.contactInfo.name} | ${resumeData.contactInfo.email} | ${resumeData.contactInfo.phone || ''}` : '',
             summary: resumeData.summary || '',
             experience: resumeData.experience && resumeData.experience.length ? resumeData.experience.map((e:any) => `${e.title} at ${e.company}`).join('\n') : '',
             education: resumeData.education && resumeData.education.length ? resumeData.education.map((e:any) => `${e.degree} from ${e.institution}`).join('\n') : '',
             skills: resumeData.skills ? Object.values(resumeData.skills).join(', ') : '',
             projects: resumeData.projects && resumeData.projects.length ? resumeData.projects.map((p:any) => p.name).join('\n') : ''
          }
        };
        
        const stored = localStorage.getItem("resumerefine_saved_resumes");
        let savedList = stored ? JSON.parse(stored) : [];
        savedList.unshift(newResume);
        if (savedList.length > 20) savedList = savedList.slice(0, 20);
        localStorage.setItem("resumerefine_saved_resumes", JSON.stringify(savedList));
        
      } catch(e) {
        console.error("ATS Scan failed", e);
      } finally {
        setIsGeneratingATS(false);
      }
    };
    
    runATS();
  }, [resumeData, targetRole]);

  const handleExportPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = resumeRef.current;
    
    if (element) {
       const opt = {
         margin:       0,
         filename:     `${resumeData?.contactInfo?.name?.replace(/\s+/g, '_') || 'Resume'}.pdf`,
         image:        { type: 'jpeg', quality: 0.98 },
         html2canvas:  { scale: 2, useCORS: true },
         jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
       };

       // @ts-expect-error type missing
       html2pdf().set(opt).from(element).save();
    }
  };

  const handleOpenEditor = () => {
    if (!resumeData || !atsAnalysis) return;
    
    const sections = {
       contact: resumeData.contactInfo ? `${resumeData.contactInfo.name} | ${resumeData.contactInfo.email} | ${resumeData.contactInfo.phone || ''}` : '',
       summary: resumeData.summary || '',
       experience: resumeData.experience && resumeData.experience.length ? resumeData.experience.map((e:any) => `${e.title} at ${e.company}\n${e.bullets ? e.bullets.map((b:string)=>'- '+b).join('\n') : ''}`).join('\n\n') : '',
       education: resumeData.education && resumeData.education.length ? resumeData.education.map((e:any) => `${e.degree} from ${e.institution}`).join('\n') : '',
       skills: resumeData.skills ? Object.values(resumeData.skills).join(', ') : '',
       projects: resumeData.projects && resumeData.projects.length ? resumeData.projects.map((p:any) => `${p.name}\n${p.bullets ? p.bullets.map((b:string)=>'- '+b).join('\n') : ''}`).join('\n\n') : ''
    };
    
    const plainText = Object.values(sections).join('\n\n');
    
    setSessionData("resume_raw", plainText);
    setSessionData("resume_analysis", atsAnalysis);
    setSessionData("resume_sections", sections);
    
    router.push("/editor");
  };

  if (!user || !resumeData) return <div className="min-h-screen bg-black" />;

  const c = resumeData.contactInfo;

  return (
    <div className="h-screen w-full flex bg-black text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
         
         {/* Left Side: Printed Resume Preview (60%) */}
         <div className="w-full lg:w-[60%] h-full overflow-y-auto bg-[#1a1a1a] p-8 flex justify-center custom-scrollbar">
            <div 
              ref={resumeRef}
              className="bg-white text-black shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] print-exact w-[8.5in] min-h-[11in] px-[0.75in] py-[0.6in]"
              style={{ fontFamily: "'Georgia', serif" }} // Jake Ryan template uses standard serifs and sans combo usually, we'll use Georgia as requested
            >
               {/* Name */}
               <h1 className="text-4xl font-bold text-center mb-1 placeholder:text-gray-300">{c?.name || "Your Name"}</h1>
               
               {/* Contact Info */}
               <div className="text-center text-sm mb-6 flex flex-wrap justify-center items-center gap-x-2 text-gray-800">
                  {c?.phone && <span>{c.phone}</span>}
                  {c?.phone && (c.email || c.linkedin || c.github || c.portfolio) && <span>|</span>}
                  
                  {c?.email && <span>{c.email}</span>}
                  {c?.email && (c.linkedin || c.github || c.portfolio) && <span>|</span>}
                  
                  {c?.linkedin && <span>{c.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                  {c?.linkedin && (c.github || c.portfolio) && <span>|</span>}
                  
                  {c?.github && <span>{c.github.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                  {c?.github && c.portfolio && <span>|</span>}
                  
                  {c?.portfolio && <span>{c.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>}
               </div>

               {/* Education */}
               {resumeData.education && resumeData.education.length > 0 && (
                 <div className="mb-4">
                   <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Education</h2>
                   {resumeData.education.map((ed: any, i: number) => (
                     <div key={i} className="mb-2">
                       <div className="flex justify-between items-baseline font-bold">
                         <span>{ed.institution}</span>
                         <span className="font-normal text-sm">{ed.location}</span>
                       </div>
                       <div className="flex justify-between items-baseline italic text-sm">
                         <span>{ed.degree}</span>
                         <span>{ed.startDate} - {ed.endDate}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {/* Experience */}
               {resumeData.experience && resumeData.experience.length > 0 && (
                 <div className="mb-4">
                   <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Experience</h2>
                   {resumeData.experience.map((exp: any, i: number) => (
                     <div key={i} className="mb-3">
                       <div className="flex justify-between items-baseline font-bold">
                         <span>{exp.title}</span>
                         <span className="font-normal text-sm">{exp.startDate} - {exp.endDate}</span>
                       </div>
                       <div className="flex justify-between items-baseline italic text-sm mb-1">
                         <span>{exp.company}</span>
                         <span>{exp.location}</span>
                       </div>
                       {exp.bullets && exp.bullets.length > 0 && (
                         <ul className="list-disc pl-5 text-sm space-y-0.5">
                           {exp.bullets.map((b: string, j: number) => (
                             <li key={j} className="pl-1 leading-snug">{b}</li>
                           ))}
                         </ul>
                       )}
                     </div>
                   ))}
                 </div>
               )}

               {/* Projects */}
               {resumeData.projects && resumeData.projects.length > 0 && (
                 <div className="mb-4">
                   <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Projects</h2>
                   {resumeData.projects.map((proj: any, i: number) => (
                     <div key={i} className="mb-3">
                       <div className="flex justify-between items-baseline">
                         <span>
                           <span className="font-bold">{proj.name}</span>
                           {proj.technologies && <span className="italic ml-1 border-l border-black pl-1 ml-1"> {proj.technologies}</span>}
                         </span>
                         <span className="text-sm">{proj.startDate} - {proj.endDate}</span>
                       </div>
                       {proj.bullets && proj.bullets.length > 0 && (
                         <ul className="list-disc pl-5 text-sm space-y-0.5 mt-1">
                           {proj.bullets.map((b: string, j: number) => (
                             <li key={j} className="pl-1 leading-snug">{b}</li>
                           ))}
                         </ul>
                       )}
                     </div>
                   ))}
                 </div>
               )}
               
               {/* Certifications */}
               {resumeData.certifications && resumeData.certifications.length > 0 && (
                 <div className="mb-4">
                   <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Certifications</h2>
                   {resumeData.certifications.map((cert: any, i: number) => (
                     <div key={i} className="flex justify-between items-baseline text-sm mb-1">
                       <span className="font-bold">{cert.name} <span className="font-normal italic">({cert.issuer})</span></span>
                       <span>{cert.date}</span>
                     </div>
                   ))}
                 </div>
               )}

               {/* Technical Skills */}
               {resumeData.skills && Object.keys(resumeData.skills).length > 0 && (
                 <div className="mb-4 text-sm">
                   <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Technical Skills</h2>
                   {resumeData.skills.languages && <div><span className="font-bold">Languages:</span> {resumeData.skills.languages}</div>}
                   {resumeData.skills.frameworks && <div><span className="font-bold">Frameworks:</span> {resumeData.skills.frameworks}</div>}
                   {resumeData.skills.developerTools && <div><span className="font-bold">Developer Tools:</span> {resumeData.skills.developerTools}</div>}
                   {resumeData.skills.libraries && <div><span className="font-bold">Libraries:</span> {resumeData.skills.libraries}</div>}
                 </div>
               )}

            </div>
         </div>

         {/* Right Side: ATS Panel (40%) */}
         <div className="w-full lg:w-[40%] h-full overflow-y-auto bg-black border-l border-white/5 p-6 md:p-10 custom-scrollbar relative">
            
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl pb-6 border-b border-white/5 mb-8">
               <h2 className="text-2xl font-light tracking-tight flex items-center gap-3">
                 <FileText className="text-amber-500 w-6 h-6" /> Resume Overview
               </h2>
            </div>
            
            {isGeneratingATS ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-6" />
                  <p className="text-amber-500 font-medium tracking-wide">Scoring against ATS...</p>
                  <p className="text-muted-foreground text-sm mt-2 max-w-[250px]">Analyzing keywords, formatting, impact, and completeness.</p>
               </div>
            ) : atsAnalysis ? (
               <div className="mb-12">
                 <ATSResults analysis={atsAnalysis} resumeText="..." />
               </div>
            ) : (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3 mb-10">
                 <FileWarning className="w-5 h-5 shrink-0 mt-0.5" />
                 <p className="text-sm">Failed to generate ATS score. You can still export your resume below.</p>
               </div>
            )}

            <div className="space-y-4">
               <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Export & Actions</h3>
               
               <Button onClick={handleExportPDF} className="w-full justify-start text-left bg-[#0a0a0a] border border-white/10 hover:border-amber-500/50 hover:bg-white/5 text-foreground h-14 rounded-xl group transition-all">
                 <div className="p-2 bg-amber-500/10 rounded-lg mr-4 group-hover:bg-amber-500/20">
                   <Download className="w-5 h-5 text-amber-500" />
                 </div>
                 <div>
                   <p className="font-medium">Export as PDF</p>
                   <p className="text-xs text-muted-foreground">Download standard print format</p>
                 </div>
               </Button>
               
               <Button variant="outline" className="w-full justify-start text-left border-white/5 bg-transparent opacity-60 h-14 rounded-xl cursor-default relative overflow-hidden">
                 <div className="p-2 bg-white/5 rounded-lg mr-4">
                   <Download className="w-5 h-5 text-muted-foreground" />
                 </div>
                 <div>
                   <p className="font-medium text-muted-foreground">Export as Word</p>
                   <p className="text-xs text-muted-foreground opacity-50">.docx format</p>
                 </div>
                 <div className="absolute top-1/2 -translate-y-1/2 right-4 bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                   Coming Soon
                 </div>
               </Button>
               
               <Button onClick={handleOpenEditor} disabled={!atsAnalysis} className="w-full justify-start text-left bg-amber-500 hover:bg-amber-400 text-black h-14 rounded-xl shadow-[0_0_15px_-5px_#f59e0b] group transition-all mt-4">
                 <div className="p-2 bg-black/10 rounded-lg mr-4">
                   <Edit3 className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                   <p className="font-medium">Open in Editor</p>
                   <p className="text-xs opacity-70">Manually tweak content with AI chat</p>
                 </div>
               </Button>
               
               <p className="text-center text-xs text-muted-foreground/50 pt-6">This resume has been saved to My Resumes automatically.</p>
            </div>
            
         </div>
         
      </main>
    </div>
  );
}
