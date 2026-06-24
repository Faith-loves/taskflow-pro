import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo, UserCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  const teamPerformance = members.map((member) => {
    const assigned = tasks.filter((task) => task.assigneeId === member.id);
    const done = assigned.filter((task) => doneColumnIds.has(task.columnId)).length;
    const late = assigned.filter((task) => new Date(task.dueDate) < new Date() && !doneColumnIds.has(task.columnId)).length;
    return {
      id: member.id,
      name: member.name.split(" ")[0],
      assigned: assigned.length,
      open: assigned.length - done,
      done,
      overdue: late,
      progress: Math.round((done / Math.max(assigned.length, 1)) * 100),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl tracking-normal">Dashboard</h1>
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
            <h2 className="text-lg font-black">Team performance</h2>
            <p className="text-sm text-[#667085]">Open, completed, overdue, and progress by teammate.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf2" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="open" name="Open" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" name="Done" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#b42318" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-[#667085]">The chart uses the exact same numbers as the table: Assigned, Open, Done, and Overdue.</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#edf1f5] md:overflow-x-auto">
            <div className="grid gap-3 p-3 md:hidden">
              {teamPerformance.map((member) => (
                <article key={member.id} className="rounded-lg border border-[#edf1f5] bg-white p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-black text-[#172033]">{member.name}</h3>
                    <span className="font-bold text-[#0f766e]">{member.progress}%</span>
                  </div>
                  <div className="mb-3 h-2 rounded-full bg-[#e8eef5]">
                    <div className="h-2 rounded-full bg-[#0f766e]" style={{ width: `${member.progress}%` }} />
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm text-[#667085]">
                    <div><dt className="font-bold text-[#172033]">Assigned</dt><dd>{member.assigned}</dd></div>
                    <div><dt className="font-bold text-[#172033]">Open</dt><dd>{member.open}</dd></div>
                    <div><dt className="font-bold text-[#172033]">Done</dt><dd>{member.done}</dd></div>
                    <div><dt className="font-bold text-[#172033]">Overdue</dt><dd className="text-[#b42318]">{member.overdue}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <table className="hidden w-full min-w-[640px] text-left text-sm md:table">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.08em] text-[#667085]">
                <tr>
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Assigned</th>
                  <th className="px-3 py-2">Open</th>
                  <th className="px-3 py-2">Done</th>
                  <th className="px-3 py-2">Overdue</th>
                  <th className="px-3 py-2">Progress</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((member) => (
                  <tr key={member.id} className="border-t border-[#edf1f5]">
                    <td className="px-3 py-3 font-bold text-[#172033]">{member.name}</td>
                    <td className="px-3 py-3">{member.assigned}</td>
                    <td className="px-3 py-3">{member.open}</td>
                    <td className="px-3 py-3">{member.done}</td>
                    <td className="px-3 py-3 text-[#b42318]">{member.overdue}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-[#e8eef5]">
                          <div className="h-2 rounded-full bg-[#0f766e]" style={{ width: `${member.progress}%` }} />
                        </div>
                        <span className="font-bold text-[#0f766e]">{member.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
