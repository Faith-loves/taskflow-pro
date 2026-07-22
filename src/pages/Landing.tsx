import { ArrowRight, CalendarDays, CheckCircle2, Edit3, KanbanSquare, MessageSquareText, MousePointer2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Landing({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-[#172033]">
      <header className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button className="flex items-center gap-3" onClick={onDemo} aria-label="Open TaskFlow Pro recruiter demo">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#0f766e] text-sm font-black text-white shadow-sm">TF</span>
          <span className="text-lg font-black">TaskFlow Pro</span>
        </button>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#596579] md:flex">
          <a href="#review" className="transition hover:text-[#172033]">Built to be inspected</a>
          <a href="#workflow" className="transition hover:text-[#172033]">Editable demo workspace</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:inline-flex" onClick={onStart}>Sign in</Button>
          <Button onClick={onDemo}>Recruiter demo <ArrowRight className="size-4" /></Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:px-8 lg:pb-14 lg:pt-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black leading-[1.02] tracking-normal text-[#121927] sm:text-6xl lg:text-7xl">Project work that feels ready for review.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#596579] sm:text-lg sm:leading-8">
            Plan launches, move tasks, comment, assign, and track momentum in one polished workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 px-5 text-base shadow-[0_14px_28px_rgba(15,118,110,0.22)]" onClick={onDemo}>
              Recruiter demo <MousePointer2 className="size-4" />
            </Button>
            <Button variant="outline" className="h-12 px-5 text-base" onClick={onStart}>Sign in</Button>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              [Edit3, "Edit tasks", "Rename, assign, comment, and attach files."],
              [KanbanSquare, "Move work", "Drag cards across the board in demo mode."],
              [Sparkles, "Generate ideas", "Create a task set from a quick launch idea."],
            ].map(([Icon, title, body]) => (
              <div key={title as string} className="border-l border-[#d7dee8] pl-4">
                <Icon className="mb-3 size-5 text-[#0f766e]" />
                <p className="text-sm font-black">{title as string}</p>
                <p className="mt-1 text-sm leading-6 text-[#667085]">{body as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[650px]">
          <div className="absolute inset-x-0 top-0 rounded-xl border border-[#dfe5ee] bg-white shadow-[0_28px_70px_rgba(23,32,51,0.13)]">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#e5ebf2] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#172033] text-xs font-black text-white">TF</span>
                <div>
                  <p className="text-sm font-black">Editable demo workspace</p>
                  <p className="text-xs font-semibold text-[#667085]">Website Redesign / Today</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-md border border-[#d7dee8] px-3 py-1.5 text-xs font-bold text-[#596579] sm:inline-flex">Live preview</span>
                <span className="rounded-md bg-[#fff3e8] px-3 py-1.5 text-xs font-black text-[#b54708]">Editable</span>
              </div>
            </div>
            <div className="grid gap-0 lg:grid-cols-[168px_1fr]">
              <aside className="hidden border-r border-[#e5ebf2] bg-[#fbfcfe] p-4 lg:block">
                {["Dashboard", "Projects", "Kanban", "Calendar", "Team"].map((item, index) => (
                  <div key={item} className={`mb-2 flex h-9 items-center rounded-md px-3 text-xs font-bold ${index === 0 ? "bg-[#e8f7f4] text-[#0f766e]" : "text-[#667085]"}`}>{item}</div>
                ))}
              </aside>
              <div className="p-4 sm:p-5">
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Active tasks", "24", "#0f766e"],
                    ["Due this week", "9", "#b54708"],
                    ["Team comments", "38", "#172033"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="rounded-lg border border-[#e5ebf2] bg-[#fbfcfe] p-3">
                      <p className="text-xs font-bold text-[#667085]">{label}</p>
                      <p className="mt-2 text-2xl font-black" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["To Do", "Create launch checklist", "High", "#fef3f2"],
                    ["In Progress", "Design onboarding screen", "Urgent", "#fff7e6"],
                    ["In Review", "Finalize landing page copy", "Medium", "#e8f7f4"],
                  ].map(([column, task, priority, bg]) => (
                    <section key={column} className="min-h-56 rounded-lg border border-[#dfe5ee] bg-[#f8fafc] p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-[#667085]">{column}</p>
                        <span className="size-2 rounded-full bg-[#0f766e]" />
                      </div>
                      <article className="rounded-lg border border-[#e5ebf2] bg-white p-3 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="rounded-md px-2 py-1 text-[11px] font-black text-[#172033]" style={{ backgroundColor: bg }}>{priority}</span>
                          <Edit3 className="size-3.5 text-[#8a96a8]" />
                        </div>
                        <p className="text-sm font-black leading-5">{task}</p>
                        <div className="mt-4 flex items-center justify-between text-[#8a96a8]">
                          <span className="flex items-center gap-1 text-xs font-bold"><MessageSquareText className="size-3.5" /> 4</span>
                          <span className="flex -space-x-2">
                            <span className="size-6 rounded-full border-2 border-white bg-[#0f766e]" />
                            <span className="size-6 rounded-full border-2 border-white bg-[#f97066]" />
                          </span>
                        </div>
                      </article>
                    </section>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.85fr]">
                  <div className="rounded-lg border border-[#dfe5ee] bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-black"><CalendarDays className="size-4 text-[#0f766e]" /> Calendar lane</div>
                    <div className="grid grid-cols-5 gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
                        <div key={day} className="rounded-md bg-[#f1f5f8] p-2 text-center text-xs font-bold text-[#667085]">
                          {day}
                          <div className={`mx-auto mt-2 h-12 w-full rounded ${index === 2 ? "bg-[#0f766e]" : index === 4 ? "bg-[#f97066]" : "bg-white"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#dfe5ee] bg-[#172033] p-4 text-white">
                    <div className="mb-3 flex items-center gap-2 text-sm font-black"><Users className="size-4 text-[#4fd1c5]" /> Team activity</div>
                    <p className="text-xs leading-5 text-white/70">Sarah edited copy / Jamal moved API task / Olivia reviewed launch notes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="review" className="border-t border-[#dfe5ee] bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-black tracking-normal">Built to be inspected</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#667085]">The recruiter demo opens the product with realistic projects, tasks, files, comments, notifications, analytics, and local edits that respond immediately.</p>
          </div>
          <div id="workflow" className="grid gap-3 md:grid-cols-3">
            {["Open demo instantly", "Change tasks and projects", "Review product breadth"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-[#dfe5ee] bg-[#fbfcfe] p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0f766e]" />
                <p className="text-sm font-bold leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
