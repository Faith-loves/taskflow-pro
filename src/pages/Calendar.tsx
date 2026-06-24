import { useAppStore } from "@/lib/app-store";
import { Badge } from "@/components/ui/Badge";
import { formatShortDate } from "@/lib/utils";

export function Calendar() {
  const { tasks, members } = useAppStore();
  const now = new Date();
  const week = new Date();
  week.setDate(now.getDate() + 7);
  const groups = [
    { label: "Overdue", tasks: tasks.filter((task) => new Date(task.dueDate) < now) },
    { label: "Today", tasks: tasks.filter((task) => new Date(task.dueDate).toDateString() === now.toDateString()) },
    { label: "This week", tasks: tasks.filter((task) => new Date(task.dueDate) >= now && new Date(task.dueDate) <= week) },
    { label: "Upcoming", tasks: tasks.filter((task) => new Date(task.dueDate) > week) },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Calendar</h1>
        <p className="text-sm text-[#667085]">Tasks grouped by due date and deadline risk.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {groups.map((group) => (
          <section key={group.label} className="rounded-lg border border-[#dfe5ee] bg-white p-4">
            <h2 className="mb-4 text-lg font-black">{group.label}</h2>
            <div className="flex flex-col gap-3">
              {group.tasks.map((task) => (
                <article key={task.id} className="rounded-md border border-[#edf1f5] p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-bold">{task.title}</p>
                    <Badge tone={task.priority === "Urgent" ? "red" : task.priority === "High" ? "amber" : "default"}>{task.priority}</Badge>
                  </div>
                  <p className="break-words text-xs text-[#667085]">{formatShortDate(task.dueDate)} · {members.find((member) => member.id === task.assigneeId)?.name}</p>
                </article>
              ))}
              {group.tasks.length === 0 ? <p className="text-sm text-[#667085]">No tasks.</p> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
