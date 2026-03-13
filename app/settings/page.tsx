"use client";
import { useEffect, useState, useRef } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Trash2, LogOut, Shield, Info, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useMockAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("privacy");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ isOpen: false, title: "", description: "", action: () => {} });

  // Refs for scroll spying
  const privacyRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user === null) router.push("/");
  }, [user, router]);

  useEffect(() => {
    const handleScroll = () => {
      if (!privacyRef.current || !aboutRef.current) return;
      const privacyTop = privacyRef.current.getBoundingClientRect().top;
      const aboutTop = aboutRef.current.getBoundingClientRect().top;
      
      // Simple spy logic based on which section is closer to top of viewport
      if (aboutTop < 300) {
        setActiveSection("about");
      } else {
        setActiveSection("privacy");
      }
    };
    
    // Add scroll listener to the main scrolling container.
    // In our layout, the `<main>` is the scrolling element.
    const mainEl = document.getElementById("settings-scroll-container");
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll);
      return () => mainEl.removeEventListener("scroll", handleScroll);
    }
  }, []);

  if (!user) return <div className="min-h-screen bg-black" />;

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
       el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClearResumes = () => {
     setConfirmDialog({
       isOpen: true,
       title: "Clear all saved resumes",
       description: "Are you sure? This cannot be undone.",
       action: () => {
          localStorage.removeItem("resumerefine_saved_resumes");
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
       }
     });
  };

  const handleClearSession = () => {
     setConfirmDialog({
       isOpen: true,
       title: "Clear session data",
       description: "Are you sure? This cannot be undone.",
       action: () => {
          sessionStorage.clear();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
       }
     });
  };

  const handleSignout = () => {
     logout();
     router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex">
      <Sidebar />
      
      <main id="settings-scroll-container" className="flex-1 overflow-y-auto relative scroll-smooth flex">
        
        {/* Settings Inner Sidebar */}
        <div className="w-64 border-r border-white/5 p-8 flex flex-col hidden lg:flex sticky top-0 h-screen shrink-0">
           <h2 className="text-xl font-medium tracking-tight mb-8">Settings</h2>
           <nav className="space-y-2">
             <button 
               onClick={() => scrollTo("privacy")}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left ${activeSection === "privacy" ? 'bg-white/5 text-amber-500 font-medium' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
             >
               <Shield className="w-4 h-4" /> Data & Privacy
             </button>
             <button 
               onClick={() => scrollTo("about")}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left ${activeSection === "about" ? 'bg-white/5 text-amber-500 font-medium' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
             >
               <Info className="w-4 h-4" /> About
             </button>
           </nav>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 max-w-4xl">
          
          <div className="lg:hidden mb-12">
             <h2 className="text-3xl font-light tracking-tight mb-4 border-b border-white/10 pb-4">Settings</h2>
          </div>

          {/* Privacy Section */}
          <section id="privacy" ref={privacyRef} className="mb-24 pt-4">
             <div className="mb-8">
               <h3 className="text-2xl font-medium tracking-tight mb-3">Data & Privacy</h3>
               <p className="text-muted-foreground font-light text-sm leading-relaxed max-w-2xl">
                 All your data is stored entirely locally in your browser's localStorage and sessionStorage. We do not store your resumes on any external servers. The only time data leaves your device is when the raw text is sent securely to the AI model for ATS analysis and editing.
               </p>
             </div>

             <div className="space-y-4">
                {/* Row 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-white/5 bg-[#0a0a0a]">
                   <div className="mb-4 sm:mb-0 pr-4">
                      <p className="font-medium text-foreground mb-1">Clear all saved resumes</p>
                      <p className="text-sm text-muted-foreground">Permanently removes all resumes and their ATS scores from this device</p>
                   </div>
                   <Button onClick={handleClearResumes} variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 shrink-0">
                      <Trash2 className="w-4 h-4 mr-2" /> Clear Resumes
                   </Button>
                </div>
                
                {/* Row 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-white/5 bg-[#0a0a0a]">
                   <div className="mb-4 sm:mb-0 pr-4">
                      <p className="font-medium text-foreground mb-1">Clear session data</p>
                      <p className="text-sm text-muted-foreground">Clears your current editor session and any temporary data</p>
                   </div>
                   <Button onClick={handleClearSession} variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 shrink-0">
                      <Trash2 className="w-4 h-4 mr-2" /> Clear Session
                   </Button>
                </div>

                {/* Row 3 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-white/5 bg-[#0a0a0a]">
                   <div className="mb-4 sm:mb-0 pr-4">
                      <p className="font-medium text-foreground mb-1">Sign out</p>
                      <p className="text-sm text-muted-foreground">Signs you out and returns you to the home page</p>
                   </div>
                   <Button onClick={handleSignout} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white shrink-0">
                      <LogOut className="w-4 h-4 mr-2" /> Sign out
                   </Button>
                </div>
             </div>
          </section>

          {/* About Section */}
          <section id="about" ref={aboutRef} className="mb-12 pt-4">
             <div className="mb-8">
               <h3 className="text-2xl font-medium tracking-tight mb-2">About</h3>
               <p className="text-muted-foreground font-light text-sm">System information and tech stack details.</p>
             </div>

             <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                   <span className="text-muted-foreground text-sm">Version</span>
                   <span className="font-medium text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                   <span className="text-muted-foreground text-sm">AI Model</span>
                   <span className="font-medium text-sm text-amber-500">Gemini 2.0 Flash</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                   <span className="text-muted-foreground text-sm">Job Data</span>
                   <span className="font-medium text-sm text-amber-500">JSearch API (RapidAPI)</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                   <span className="text-muted-foreground text-sm">Framework</span>
                   <span className="font-medium text-sm">Next.js 14</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                   <span className="text-muted-foreground text-sm">UI Components</span>
                   <span className="font-medium text-sm">shadcn/ui</span>
                </div>
                <div className="flex justify-between items-center p-4">
                   <span className="text-muted-foreground text-sm">Animations</span>
                   <span className="font-medium text-sm">Framer Motion</span>
                </div>
             </div>

             <div className="mt-8 flex justify-center">
                <a href="mailto:feedback@resumerefinepro.com" className="text-xs text-muted-foreground/60 hover:text-amber-500 transition-colors underline underline-offset-4">
                   Give Feedback
                </a>
             </div>
             
             <div className="mt-20 text-center">
                <p className="text-xs italic text-muted-foreground/40 font-serif">Built to help you land your next role.</p>
             </div>
          </section>

        </div>
      </main>

      {/* Confirmation Dialog Overlay */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
           <div className="bg-[#111] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center gap-3 mb-4 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-medium text-foreground">{confirmDialog.title}</h3>
             </div>
             <p className="text-muted-foreground text-sm mb-6">{confirmDialog.description}</p>
             <div className="flex justify-end gap-3">
                <Button variant="ghost" className="hover:bg-white/5" onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}>
                   Cancel
                </Button>
                <Button variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" onClick={confirmDialog.action}>
                   Confirm
                </Button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
