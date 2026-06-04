import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo, UserCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "@/lib/app-store";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/Badge";
import { FloatingAiRobot } from "@/components/FloatingAiRobot";
import { formatShortDate } from "@/lib/utils";

export function Dashboard() {
  const { projects, tasks, currentUserId, members, columns } = useAppStore();
  const doneColumnIds = new Set(columns.filter((column) => column.title.toLowerCase() === "done").map((column) => column.id));
  const completed = tasks.filter((task) => doneColumnIds.has(task.columnId)).length;
  const overdue = tasks.filter((task) => new Date(task.dueDate) < new Date() && !doneColumnIds.has(task.columnId)).length;
  const mine = tasks.filter((task) => task.assigneeId === currentUserId).length;
  const chartData = members.map((member) => ({
    name: member.name.split(" ")[0],
    tasks: tasks.filter((task) => task.assigneeId === member.id).length,
    done: tasks.filter((task) => task.assigneeId === member.id && doneColumnIds.has(task.columnId)).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-normal">Dashboard</h1>
        <p className="text-sm text-[#667085]">Projects, deadlines, workload, and recent team activity.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total projects" value={projects.length} icon={FolderKanban} hint="Across this workspace" />
        <StatCard label="Active tasks" value={tasks.length - completed} icon={ListTodo} hint="Open board items" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} hint="Finished tasks" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} hint="Needs attention" />
        <StatCard label="Assigned to me" value={mine} icon={UserCheck} hint="Your workload" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="soft-panel rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-lg font-black">Team productivity</h2>
            <p className="text-sm text-[#667085]">Workload and completed tasks by member.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf2" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {chartData.map((member) => {
              const progress = Math.round((member.done / Math.max(member.tasks, 1)) * 100);
              return (
                <div key={member.name} className="rounded-md border border-[#edf1f5] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-[#172033]">{member.name}</span>
                    <span className="font-bold text-[#0f766e]">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e8eef5]">
                    <div className="h-2 rounded-full bg-[#0f766e]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[#667085]">
                    {member.done} completed of {member.tasks} tasks
                  </p>
                </div>
              );
            })}
          </div>
        </section>
        <section className="soft-panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-black">Recent activity</h2>
          <div className="flex flex-col gap-3">
            {tasks.flatMap((task) => task.activity.map((item) => ({ task, item }))).slice(0, 6).map(({ task, item }) => (
              <div key={item.id} className="rounded-md border border-[#edf1f5] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold">{task.title}</p>
                  <Badge>{formatShortDate(item.createdAt)}</Badge>
                </div>
                <p className="text-sm text-[#667085]">{item.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <FloatingAiRobot />
    </div>
  );
}
