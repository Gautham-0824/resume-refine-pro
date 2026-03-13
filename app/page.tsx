import { HeroText } from "@/components/landing/HeroText";
import { FrameAnimation } from "@/components/landing/FrameAnimation";
import { Button } from "@/components/ui/button";
import { ScanSearch, Wand2, Download } from "lucide-react";
import Link from "next/link";
import { AuthModal } from "@/components/ui/AuthModal";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-foreground selection:bg-amber-500/30">
      <AuthModal />
      
      <HeroText />
      
      <FrameAnimation />

      {/* Feature Highlights Section */}
      <section className="py-32 px-6 lg:px-12 bg-black border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-6">
              Three Steps to <span className="text-amber-500">Perfection</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ScanSearch className="w-8 h-8 text-amber-500" strokeWidth={1} />}
              title="ATS Score Analysis"
              desc="We parse your resume exactly like enterprise applicant tracking systems do, identifying critical keyword gaps and formatting pitfalls."
            />
            <FeatureCard 
              icon={<Wand2 className="w-8 h-8 text-amber-500" strokeWidth={1} />}
              title="AI-Powered Rewriting"
              desc="An intelligent agent suggests precise rewrites field-by-field, optimizing impact while maintaining your professional voice."
            />
            <FeatureCard 
              icon={<Download className="w-8 h-8 text-amber-500" strokeWidth={1} />}
              title="Live Preview & Export"
              desc="Watch changes unfold in a split-screen live editor. Export a beautifully formatted, ATS-friendly PDF instantly."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-[#050505] border-t border-amber-500/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
          <h2 className="text-5xl md:text-7xl font-light tracking-tighter mb-8 font-[family-name:var(--font-geist-sans)]">
            Stop getting <br className="hidden md:block"/> filtered out.
          </h2>
          <p className="text-muted-foreground text-lg mb-12 tracking-wide font-light max-w-xl mx-auto">
            Join thousands of candidates who bypassed the bots and landed interviews at top tier companies.
          </p>
          <Link href="/dashboard">
            <Button className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-12 py-8 text-xl font-medium tracking-wide shadow-[0_0_30px_-5px_#f59e0b] hover:shadow-[0_0_50px_0px_#f59e0b] transition-all duration-300">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 text-center text-xs text-white/20 border-t border-white/5 bg-black tracking-widest uppercase">
        Resume Refine Pro • Powered by AI
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group relative p-8 rounded-2xl bg-card border-t border-border hover:border-amber-500/50 transition-all duration-500 hover:shadow-[0_0_30px_-15px_#f59e0b] hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
      <div className="relative z-10">
        <div className="mb-6 p-4 rounded-xl bg-black/50 inline-block border border-white/5 group-hover:border-amber-500/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-medium mb-3 tracking-wide">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed font-light">
          {desc}
        </p>
      </div>
    </div>
  );
}
