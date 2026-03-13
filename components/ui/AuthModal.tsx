"use client";
import { useState } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthModal() {
  const { isModalOpen, closeModal, login } = useMockAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md bg-card border border-amber-500/20 shadow-[0_0_40px_-15px_#f59e0b]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight text-foreground">Sign In</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your details to access Resume Refine Pro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="bg-black/50 border-white/10 focus-visible:ring-amber-500 focus-visible:border-amber-500 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus-visible:ring-amber-500 focus-visible:border-amber-500 text-white"
            />
          </div>
          <Button type="submit" className="w-full bg-amber-500 text-black hover:bg-amber-400 font-medium tracking-wide">
            Sign In
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 hover:bg-white/5 hover:text-white"
            onClick={() => alert("Google Auth coming soon!")}
          >
            Google
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
