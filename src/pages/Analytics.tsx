import { Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAppStore } from "@/lib/app-store";

export function Analytics() {
  const { tasks, members, columns } = useAppStore();
  const doneColumnIds = new Set(columns.filter((column) => column.title.toLowerCase() === "done").map((column) => column.id));
  const completed = tasks.filter((task) => doneColumnIds.has(task.columnId)).length;
  const progress = Math.round((completed / Math.max(tasks.length, 1)) * 100);
  const weekly = [
    { week: "W1", completed: 2, overdue: 1 },
    { week: "W2", completed: 4, overdue: 1 },
    { week: "W3", completed: completed, overdue: tasks.filter((task) => new Date(task.dueDate) < new Date()).length },
    { week: "W4", completed: completed + 3, overdue: 0 },
  ];
  const workload = members.map((member) => ({ name: member.name.split(" ")[0], value: tasks.filter((task) => task.assigneeId === member.id).length }));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Analytics</h1>
        <p className="text-sm text-[#667085]">Progress, workload, overdue risk, and member activity.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-black">Completed tasks per week</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid stroke="#e5ebf2" strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#0f766e" strokeWidth={3} />
                <Line type="monotone" dataKey="overdue" stroke="#b42318" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-black">Team workload</h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={workload} dataKey="value" nameKey="name" outerRadius={72} label>
                  {workload.map((_, index) => <Cell key={index} fill={["#0f766e", "#f59e0b", "#2563eb", "#6b7280"][index % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-3xl font-black text-[#0f766e] sm:text-4xl">{progress}%</p>
          <p className="text-center text-sm text-[#667085]">Project progress</p>
        </section>
      </div>
    </div>
  );
}
