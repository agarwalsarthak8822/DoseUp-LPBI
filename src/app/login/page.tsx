"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginBodySchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DoseuppLogo } from "@/components/DoseuppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerAuthNav } from "@/components/auth/CustomerAuthNav";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/account";
  const prefilledEmail = searchParams.get("email")?.trim() ?? "";
  const oauthError = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: prefilledEmail, password: "" },
  });

  useEffect(() => {
    form.setValue("email", prefilledEmail);
  }, [prefilledEmail, form]);

  useEffect(() => {
    if (oauthError) {
      toast.error(oauthError);
    }
  }, [oauthError]);

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.fieldErrors && typeof data.fieldErrors === "object") {
        const fe = data.fieldErrors as Record<string, string[] | undefined>;
        (Object.keys(fe) as (keyof LoginInput)[]).forEach((key) => {
          const msg = fe[key]?.[0];
          if (msg) form.setError(key, { message: msg });
        });
      }
      setServerError(typeof data.error === "string" ? data.error : "Something went wrong");
      return;
    }

    toast.success(data.message ?? "Signed in");
    const dest = from.startsWith("/") ? from : "/account";
    router.push(dest);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md pt-20"
    >
      <div className="glass-card rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Log in</h1>
          <p className="text-muted-foreground text-sm mt-2">Use your customer account</p>
        </div>

        {(serverError || oauthError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle />
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{serverError ?? oauthError}</AlertDescription>
          </Alert>
        )}

        <GoogleSignInButton redirectTo={from.startsWith("/") ? from : "/account"} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or with email</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        className="pl-10"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full btn-primary-gradient font-semibold"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Log in"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          No account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background mesh-gradient flex items-center justify-center p-6">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <DoseuppLogo size="md" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <CustomerAuthNav />
            <ThemeToggle />
            <Link href="/signup">
              <Button variant="ghost" className="text-muted-foreground font-medium">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <Suspense
        fallback={
          <div className="w-full max-w-md pt-20 glass-card rounded-3xl p-8 h-96 animate-pulse bg-muted/20" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
