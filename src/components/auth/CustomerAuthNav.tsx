"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type MeUser = { id: string; name: string; email: string };

export function CustomerAuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user: MeUser | null }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    toast.success("Signed out");
    router.refresh();
    router.push("/");
  }

  if (user === undefined) {
    return (
      <span className="text-muted-foreground text-sm w-24 h-9 inline-block animate-pulse rounded bg-muted/50" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-muted-foreground font-medium">
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" variant="outline" className="font-medium border-primary/50">
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/account">
        <Button variant="ghost" size="sm" className="font-medium gap-1.5 max-w-[140px]">
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">{user.name}</span>
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => void logout()}
        type="button"
        aria-label="Log out"
      >
        <LogOut className="w-4 h-4" />
        <span>Log out</span>
      </Button>
    </div>
  );
}
