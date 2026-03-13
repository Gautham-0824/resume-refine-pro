import { useState, useEffect, useRef } from "react";

export function useTypewriter(targetText: string, typingSpeedMs = 25) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const queueRef = useRef(targetText);
  const currentIndex = useRef(0);

  useEffect(() => {
    // Force string coercion just in case the AI returns an array or object for a section
    const safeTarget = typeof targetText === 'string' 
        ? targetText 
        : (typeof targetText === 'object' ? JSON.stringify(targetText) : String(targetText || ""));

    // When target text changes, start typing
    if (safeTarget !== queueRef.current) {
        queueRef.current = safeTarget;
        currentIndex.current = displayedText.length > safeTarget.length ? 0 : currentIndex.current; // Simple heuristic to restart
        // If entirely different, clear and type
        if (!safeTarget.startsWith(displayedText)) {
            setDisplayedText("");
            currentIndex.current = 0;
        }
        setIsTyping(true);
    }
  }, [targetText, displayedText]);

  useEffect(() => {
    if (!isTyping) return;

    if (currentIndex.current < queueRef.current.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(queueRef.current.slice(0, currentIndex.current + 1));
        currentIndex.current++;
      }, typingSpeedMs);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayedText, isTyping, typingSpeedMs]);

  // If initial state
  useEffect(() => {
      const safeTarget = typeof targetText === 'string' 
          ? targetText 
          : (typeof targetText === 'object' ? JSON.stringify(targetText) : String(targetText || ""));

      if(safeTarget && !isTyping && displayedText === "") {
          setDisplayedText(safeTarget);
          currentIndex.current = safeTarget.length;
      }
  }, []);

  return { displayedText, isTyping };
}
