"use client";
import { useEffect, useState } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";

interface ResumePanelProps {
  sections: { [key: string]: string };
  isTypingField: { section: string | null };
}

export function ResumePanel({ sections, isTypingField }: ResumePanelProps) {
  
  // Try to parse out details from the raw string sections to better fit the Jake Ryan layout
  // Note: During the Builder flow, sections are formatted a specific way. If they just uploaded a raw resume,
  // it might just be blocks of text. We'll handle both gracefully.

  const contactLine = sections.contact || "";
  const nameMatch = contactLine.split('|')[0]?.trim() || "Your Name";
  const otherContact = contactLine.split('|').slice(1).join(' | ').trim();

  return (
    <div className="h-full w-full bg-[#111] overflow-y-auto custom-scrollbar p-6 md:p-12 flex justify-center">
      <div 
        id="resume-export-container" 
        className="bg-white text-black shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[8.5in] min-h-[11in] px-[0.75in] py-[0.6in]"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        
        {/* Contact Info Group */}
        <div className="text-center mb-6">
           <h1 className="text-4xl font-bold mb-1">
             <SectionBlock text={nameMatch} isTyping={isTypingField.section === 'contact'} asSpan />
           </h1>
           <div className="text-sm text-gray-800">
             <SectionBlock text={otherContact} isTyping={isTypingField.section === 'contact'} />
           </div>
        </div>

        {/* Summary */}
        {(sections.summary || isTypingField.section === 'summary') && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Summary</h2>
            <div className="text-sm leading-snug">
              <SectionBlock text={sections.summary || ""} isTyping={isTypingField.section === 'summary'} />
            </div>
          </div>
        )}

        {/* Experience */}
        {(sections.experience || isTypingField.section === 'experience') && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Experience</h2>
            <div className="text-sm leading-snug">
              <SectionBlock text={sections.experience || ""} isTyping={isTypingField.section === 'experience'} />
            </div>
          </div>
        )}

        {/* Education */}
        {(sections.education || isTypingField.section === 'education') && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Education</h2>
            <div className="text-sm leading-snug">
              <SectionBlock text={sections.education || ""} isTyping={isTypingField.section === 'education'} />
            </div>
          </div>
        )}

        {/* Projects */}
        {(sections.projects || isTypingField.section === 'projects') && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Projects</h2>
            <div className="text-sm leading-snug">
              <SectionBlock text={sections.projects || ""} isTyping={isTypingField.section === 'projects'} />
            </div>
          </div>
        )}

        {/* Skills */}
        {(sections.skills || isTypingField.section === 'skills') && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 mb-2">Skills</h2>
            <div className="text-sm leading-snug">
              <SectionBlock text={sections.skills || ""} isTyping={isTypingField.section === 'skills'} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SectionBlock({ text, isTyping, asSpan = false }: { text: string; isTyping: boolean; asSpan?: boolean }) {
  const { displayedText, isTyping: hookIsTyping } = useTypewriter(isTyping ? text : "", 20);
  const displayText = isTyping ? displayedText : text;

  const content = (
    <>
      <span className="whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning>
        {displayText}
      </span>
      {(isTyping && hookIsTyping) && (
        <span className="inline-block w-[4px] h-[1em] bg-amber-500 translate-y-[2px] ml-[2px] animate-pulse" />
      )}
    </>
  );

  return asSpan ? content : <div>{content}</div>;
}
