"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Package, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoseuppLogo } from "@/components/DoseuppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

type MeUser = { id: string; name: string; email: string };

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user: MeUser | null }) => {
        setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?from=/account");
    }
  }, [loading, user, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-48 h-8 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-48 h-8 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <DoseuppLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => void logout()} className="gap-1.5">
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick links
          </h2>
          <div className="space-y-2">
            <Link
              href="/order"
              className="flex items-center justify-between glass-card rounded-xl px-4 py-4 hover:bg-card/80 transition-colors"
            >
              <span className="flex items-center gap-3 font-medium">
                <Package className="w-5 h-5 text-primary" />
                Order medicines
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            <Link
              href="/track"
              className="flex items-center justify-between glass-card rounded-xl px-4 py-4 hover:bg-card/80 transition-colors"
            >
              <span className="flex items-center gap-3 font-medium">
                <Package className="w-5 h-5 text-accent" />
                Track an order
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
