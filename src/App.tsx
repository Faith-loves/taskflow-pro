import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { AppProvider } from "@/lib/app-store";
import {
  checkSupabaseReachable,
  clearSupabaseSessionCache,
  isSupabaseConfigured,
  supabase,
  supabaseConnectionLabel,
} from "@/lib/supabase";
import { AppShell } from "@/components/AppShell";
import { TaskDetailDrawer } from "@/components/TaskDetailDrawer";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Dashboard } from "@/pages/Dashboard";
import { Workspace } from "@/pages/Workspace";
import { Projects } from "@/pages/Projects";
import { Calendar } from "@/pages/Calendar";
import { Notifications } from "@/pages/Notifications";
import { Team } from "@/pages/Team";
import { Settings } from "@/pages/Settings";
import { Analytics } from "@/pages/Analytics";
import { NotFound } from "@/pages/NotFound";
import { AuthPage } from "@/pages/Auth";
import { Landing } from "@/pages/Landing";
import { Button } from "@/components/ui/Button";

const queryClient = new QueryClient();

function Page({ activePage, setActivePage }: { activePage: string; setActivePage: (page: string) => void }) {
  if (activePage === "dashboard") return <Dashboard />;
  if (activePage === "workspace") return <Workspace />;
  if (activePage === "projects") return <Projects setActivePage={setActivePage} />;
  if (activePage === "board") return <KanbanBoard setActivePage={setActivePage} />;
  if (activePage === "calendar") return <Calendar />;
  if (activePage === "notifications") return <Notifications />;
  if (activePage === "team") return <Team />;
  if (activePage === "analytics") return <Analytics />;
  if (activePage === "settings") return <Settings />;
  return <NotFound setActivePage={setActivePage} />;
}

function SupabaseUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6">
      <section className="max-w-xl rounded-xl border border-[#dfe5ee] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-normal">Supabase is unreachable</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          TaskFlow Pro could not connect to {supabaseConnectionLabel}. Check that the Supabase project is active, the URL in `.env.local` is correct, and DNS/network access is available.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onRetry}>Retry connection</Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearSupabaseSessionCache();
              onRetry();
            }}
          >
            Clear cached session
          </Button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const [stage, setStage] = useState<"landing" | "auth" | "app">("landing");
  const [activePage, setActivePage] = useState(params.get("page") ?? "dashboard");
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [sessionCheckKey, setSessionCheckKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) {
      setCheckingSession(false);
      return undefined;
    }

    const client = supabase;

    setCheckingSession(true);
    setConnectionFailed(false);

    const startSessionCheck = async () => {
      const reachable = navigator.onLine && (await checkSupabaseReachable());
      if (cancelled) return;
      if (!reachable) {
        setSession(null);
        setStage("auth");
        setConnectionFailed(true);
        setCheckingSession(false);
        return;
      }

      try {
        const { data } = await client.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        if (data.session) setStage("app");
      } catch {
        if (cancelled) return;
        clearSupabaseSessionCache();
        setSession(null);
        setStage("auth");
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    void startSessionCheck();

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStage(nextSession ? "app" : "auth");
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [sessionCheckKey]);

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6">
        <section className="max-w-xl rounded-xl border border-[#dfe5ee] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black tracking-normal">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-[#667085]">
            TaskFlow Pro is now configured as a real project. Create a Supabase project, run the migration, then add
            `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.
          </p>
        </section>
      </main>
    );
  }

  if (connectionFailed) {
    return <SupabaseUnavailable onRetry={() => setSessionCheckKey((current) => current + 1)} />;
  }

  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm font-bold text-[#667085]">Checking session...</main>;
  }

  if (stage === "landing") {
    return <Landing onStart={() => setStage("auth")} />;
  }

  if (stage === "auth") {
    return <AuthPage onAuthenticated={() => setStage("app")} />;
  }

  if (!session) {
    return <AuthPage onAuthenticated={() => setStage("app")} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider userId={session.user.id} userEmail={session.user.email ?? ""}>
        <AppShell activePage={activePage} setActivePage={setActivePage}>
          <Page activePage={activePage} setActivePage={setActivePage} />
        </AppShell>
        <TaskDetailDrawer />
      </AppProvider>
    </QueryClientProvider>
  );
}
