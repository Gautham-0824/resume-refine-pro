"use client";
import { useEffect, useState } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";

interface ResumePanelProps {
  sections: { [key: string]: string };
  isTypingField: { section: string | null };
}

export function ResumePanel({ sections, isTypingField }: ResumePanelProps) {
  
  return (
    <div id="resume-export-container" className="h-full w-full bg-[#111] overflow-y-auto no-scrollbar p-12">
      <div className="bg-black border border-white/5 rounded-none shadow-[0_0_50px_-20px_rgba(255,255,255,0.05)] w-full max-w-[800px] mx-auto min-h-[1056px] p-12 shrink-0">
        
        {/* Contact Info */}
        <SectionBlock 
          title="Contact" 
          content={sections.contact || ""} 
          isTyping={isTypingField.section === "contact"} 
        />

        {/* Summary */}
        <SectionBlock 
          title="Summary" 
          content={sections.summary || ""} 
          isTyping={isTypingField.section === "summary"} 
        />

        {/* Experience */}
        <SectionBlock 
          title="Experience" 
          content={sections.experience || ""} 
          isTyping={isTypingField.section === "experience"} 
        />

        {/* Education */}
        <SectionBlock 
          title="Education" 
          content={sections.education || ""} 
          isTyping={isTypingField.section === "education"} 
        />

        {/* Skills */}
        <SectionBlock 
          title="Skills" 
          content={sections.skills || ""} 
          isTyping={isTypingField.section === "skills"} 
        />

        {/* Projects */}
        <SectionBlock 
          title="Projects" 
          content={sections.projects || ""} 
          isTyping={isTypingField.section === "projects"} 
        />

      </div>
    </div>
  );
}

function SectionBlock({ title, content, isTyping }: { title: string; content: string; isTyping: boolean }) {
  // Use a typewriter specifically for this block if it's the active one
  const { displayedText, isTyping: hookIsTyping } = useTypewriter(isTyping ? content : "", 20);

  const displayText = isTyping ? displayedText : content;

  if (!displayText) return null;

  return (
    <div className="mb-8 relative group">
      <h3 className="text-amber-600 text-[11px] font-medium tracking-[0.2em] uppercase mb-4 border-b border-white/10 pb-2">
        {title}
      </h3>
      <div 
        className="text-[14px] leading-relaxed text-[#eee] font-light whitespace-pre-wrap outline-none relative"
        contentEditable
        suppressContentEditableWarning
      >
         {displayText}
         {(isTyping && hookIsTyping) && (
           <span className="inline-block w-[6px] h-[16px] bg-amber-500 translate-y-[2px] ml-[2px] animate-pulse" />
         )}
      </div>
      <div className="absolute -inset-x-4 -inset-y-4 rounded-xl border border-amber-500/0 group-hover:border-amber-500/20 pointer-events-none transition-colors" />
    </div>
  );
}
