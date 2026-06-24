import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen bg-white text-[#172033]">
      <header className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#0f766e] text-sm font-black text-white">TF</div>
          <span className="text-lg font-black">TaskFlow Pro</span>
        </div>
        <Button className="shrink-0" onClick={onStart}>Open app</Button>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h1 className="text-4xl font-black leading-tight tracking-normal sm:text-5xl">TaskFlow Pro</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#596579] sm:text-lg sm:leading-8">
            A full-stack project management SaaS for teams to manage projects, tasks, deadlines, collaboration, and productivity analytics.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={onStart}>Try the SaaS <ArrowRight className="size-4" /></Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={onStart}>Login</Button>
          </div>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-[#4e5c72]">
            {["Real Supabase auth and database schema", "Drag-and-drop Kanban with task details", "Roles, comments, files, notifications, calendar, analytics"].map((item) => (
              <p key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0f766e]" />{item}</p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#dfe5ee] bg-[#f8fafc] p-3 shadow-xl sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {["Backlog", "To Do", "In Progress", "In Review", "Done"].map((column, index) => (
              <div key={column} className="rounded-lg border border-[#dfe5ee] bg-white p-3">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-[#667085]">{column}</p>
                {[0, 1, 2].slice(0, index === 4 ? 1 : 2).map((item) => (
                  <div key={item} className="mb-2 rounded-md border border-[#edf1f5] p-3">
                    <div className="mb-2 h-2 w-16 rounded bg-[#0f766e]" />
                    <div className="h-2 w-full rounded bg-[#dfe5ee]" />
                    <div className="mt-2 h-2 w-2/3 rounded bg-[#edf1f5]" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
