"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signupBodySchema, type SignupInput } from "@/lib/validations/auth";
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
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  /** Email already in DB — show “log in” path instead of a scary error. */
  const [existingAccountEmail, setExistingAccountEmail] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupBodySchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    setExistingAccountEmail(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409) {
        setExistingAccountEmail(values.email);
        return;
      }
      if (data.fieldErrors && typeof data.fieldErrors === "object") {
        const fe = data.fieldErrors as Record<string, string[] | undefined>;
        (Object.keys(fe) as (keyof SignupInput)[]).forEach((key) => {
          const msg = fe[key]?.[0];
          if (msg) form.setError(key, { message: msg });
        });
      }
      setServerError(typeof data.error === "string" ? data.error : "Something went wrong");
      return;
    }

    toast.success(data.message ?? "Account created");
    router.push("/account");
    router.refresh();
  }

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
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground font-medium">
                Already have an account?
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md pt-20"
      >
        <div className="glass-card rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create account</h1>
            <p className="text-muted-foreground text-sm mt-2">Order medicines and track deliveries</p>
          </div>

          {existingAccountEmail && (
            <Alert className="mb-6 border-primary/30 bg-primary/5 text-foreground">
              <Mail className="text-primary" />
              <AlertTitle>You already have an account</AlertTitle>
              <AlertDescription className="space-y-3 pt-1">
                <p>
                  <span className="font-medium">{existingAccountEmail}</span> is registered. Log in
                  with your password, or use a different email to create another account.
                </p>
                <Button asChild className="btn-primary-gradient font-semibold">
                  <Link href={`/login?email=${encodeURIComponent(existingAccountEmail)}`}>
                    Go to log in
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {serverError && !existingAccountEmail && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Priya Sharma" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          autoComplete="new-password"
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showConfirm ? "text" : "password"}
                          className="pl-10 pr-10"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowConfirm((s) => !s)}
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                {form.formState.isSubmitting ? "Creating account…" : "Sign up"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing up you agree to our terms of service and privacy policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
