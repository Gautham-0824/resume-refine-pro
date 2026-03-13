"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMockAuth } from "@/hooks/useMockAuth";
import { FileText, Settings, UserCircle, LogOut, Briefcase } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useMockAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: FileText },
    { name: "My Resumes", href: "/my-resumes", icon: UserCircle },
    { name: "Apply for Jobs", href: "/jobs", icon: Briefcase },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-white/5 p-6 flex flex-col hidden md:flex bg-black">
      <Link href="/" className="text-xl font-light tracking-tighter mb-12">
        Resume <span className="text-amber-500 font-medium tracking-tight">Pro</span>
      </Link>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors \${
                isActive 
                  ? "bg-white/5 text-amber-500 font-medium" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" /> {item.name}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/5">
          <Link 
            href="/settings" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors \${
              pathname === "/settings" 
                ? "bg-white/5 text-amber-500 font-medium" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </div>
      </nav>

      <div 
        onClick={() => { logout(); router.push("/"); }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors mt-auto"
      >
         <LogOut className="w-4 h-4" /> Sign out
      </div>
    </aside>
  );
}
