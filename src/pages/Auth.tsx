import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const authSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Use at least 6 characters"),
  name: z.string().min(2).optional(),
});

type AuthValues = z.infer<typeof authSchema>;

export function AuthPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "verify">("login");
  const [message, setMessage] = useState("");
  const { register, handleSubmit, formState } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "temi@fiberone.design", password: "password123", name: "Temi Ade" },
  });

  async function submit(values: AuthValues) {
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local before using TaskFlow Pro.");
      return;
    }
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.name },
          emailRedirectTo: window.location.origin,
        },
      });
      setMessage(error?.message ?? "Check your inbox to verify your email.");
      return;
    }
    if (mode === "verify") {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: values.email,
        options: { emailRedirectTo: window.location.origin },
      });
      setMessage(error?.message ?? "Verification email sent again. Check inbox and spam.");
      return;
    }
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: window.location.origin });
      setMessage(error?.message ?? "Password reset email sent.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    setMessage(error?.message ?? "Logged in successfully.");
    if (!error) onAuthenticated();
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4">
      <div className="mx-auto grid min-h-[calc(100vh-32px)] max-w-6xl overflow-hidden rounded-xl border border-[#dfe5ee] bg-white lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between bg-[#172033] p-8 text-white">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-[#0f766e] text-sm font-black">TF</div>
              <div>
                <h1 className="text-xl font-black">TaskFlow Pro</h1>
                <p className="text-sm text-white/65">Full-stack project management SaaS</p>
              </div>
            </div>
            <h2 className="max-w-lg text-4xl font-black leading-tight tracking-normal">Manage projects, tasks, deadlines, teams, and productivity in one real workspace.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Built for portfolio review with real auth wiring, role-based permissions, Kanban drag-and-drop, comments, files, activity logs, analytics, and Supabase-ready persistence.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/75">
            {["Supabase Auth and Storage", "Workspace roles and invitations", "Realtime-ready Kanban collaboration"].map((item) => (
              <p key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#4fd1c5]" />{item}</p>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h2 className="text-3xl font-black tracking-normal">
                {mode === "signup" ? "Create account" : mode === "reset" ? "Reset password" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm text-[#667085]">
                {isSupabaseConfigured ? "Connected to Supabase." : "Supabase is required for this real project."}
              </p>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
              {mode === "signup" ? (
                <label className="flex flex-col gap-2 text-sm font-bold">
                  Full name
                  <TextField {...register("name")} placeholder="Temi Ade" />
                </label>
              ) : null}
              <label className="flex flex-col gap-2 text-sm font-bold">
                Email
                <TextField {...register("email")} type="email" placeholder="you@company.com" />
              </label>
              {mode !== "reset" && mode !== "verify" ? (
                <label className="flex flex-col gap-2 text-sm font-bold">
                  Password
                  <TextField {...register("password")} type="password" />
                </label>
              ) : null}
              {formState.errors.email ? <p className="text-sm font-semibold text-[#b42318]">{formState.errors.email.message}</p> : null}
              {message ? <p className="rounded-md bg-[#e8f7f4] px-3 py-2 text-sm font-semibold text-[#0f766e]">{message}</p> : null}
              <Button type="submit" className="w-full">
                {mode === "signup" ? <UserPlus className="size-4" /> : mode === "reset" || mode === "verify" ? <Mail className="size-4" /> : <KeyRound className="size-4" />}
                {mode === "signup" ? "Sign up" : mode === "reset" ? "Send reset email" : mode === "verify" ? "Resend verification email" : "Login"}
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["login", "Login"],
                ["signup", "Sign up"],
                ["reset", "Forgot password"],
                ["verify", "Verify email"],
              ].map(([id, label]) => (
                <Button key={id} size="sm" variant={mode === id ? "secondary" : "ghost"} onClick={() => setMode(id as typeof mode)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
