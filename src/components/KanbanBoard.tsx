import { DndContext, type DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Archive, CheckCircle2, Clock3, Flame, MoreHorizontal, Paperclip, Plus, Settings, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "@/lib/app-store";
import { Button } from "./ui/Button";
import { TextArea, TextField } from "./ui/TextField";
import { TaskCard } from "./TaskCard";
import type { Column } from "@/data/types";
import { StatCard } from "./StatCard";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { formatShortDate } from "@/lib/utils";

function BoardColumn({ column }: { column: Column }) {
  const { tasks, search, priorityFilter, createTask, renameColumn, deleteColumn } = useAppStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(column.title);
  const { setNodeRef } = useDroppable({ id: column.id });
  const columnTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.columnId === column.id)
        .filter((task) => (priorityFilter === "All" ? true : task.priority === priorityFilter))
        .filter((task) => {
          const haystack = `${task.title} ${task.description} ${task.labels.join(" ")} ${task.priority}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
        .sort((a, b) => a.position - b.position),
    [column.id, priorityFilter, search, tasks],
  );

  function submitTask(event: React.FormEvent) {
    event.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask(column.id, newTaskTitle.trim());
    setNewTaskTitle("");
  }

  return (
    <section ref={setNodeRef} className="flex h-[calc(100vh-210px)] min-w-[300px] flex-col rounded-lg border border-[#dfe5ee] bg-[#f8fafc]/90 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-[#e5ebf2] px-3 py-3">
        {isRenaming ? (
          <TextField
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              renameColumn(column.id, title);
              setIsRenaming(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                renameColumn(column.id, title);
                setIsRenaming(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button className="text-sm font-black text-[#172033]" onClick={() => setIsRenaming(true)}>
            {column.title}
          </button>
        )}
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#667085]">{columnTasks.length}</span>
          <Button variant="ghost" size="icon" onClick={() => setIsRenaming(true)}>
            <MoreHorizontal className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteColumn(column.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <SortableContext items={columnTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {columnTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
      <form className="border-t border-[#e5ebf2] p-3" onSubmit={submitTask}>
        <div className="flex gap-2">
          <TextField value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Add task" />
          <Button size="icon" type="submit">
            <Plus className="size-4" />
          </Button>
        </div>
      </form>
    </section>
  );
}

const boardTabs = [
  "Board",
  "List",
  "Timeline",
  "Calendar",
  "Reports",
  "Files",
  "Settings",
];

export function KanbanBoard({ setActivePage }: { setActivePage: (page: string) => void }) {
  const {
    columns,
    projects,
    tasks,
    activeProject,
    setActiveProjectId,
    moveTask,
    createColumn,
    createTask,
    priorityFilter,
    setPriorityFilter,
    members,
    setActiveTaskId,
    deleteTask,
    updateProject,
    archiveProject,
    deleteProject,
    uploadTaskAttachment,
    deleteTaskAttachment,
  } = useAppStore();
  const [columnTitle, setColumnTitle] = useState("");
  const [projectView, setProjectView] = useState("Board");
  const [projectDraft, setProjectDraft] = useState({
    title: activeProject.title,
    description: activeProject.description,
    status: activeProject.status,
    startDate: activeProject.startDate.slice(0, 10),
    dueDate: activeProject.dueDate.slice(0, 10),
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const boardColumns = columns.filter((column) => column.projectId === activeProject.id).sort((a, b) => a.position - b.position);
  const projectTasks = tasks.filter((task) => task.projectId === activeProject.id);
  const doneColumnIds = boardColumns.filter((column) => column.title.toLowerCase().includes("done")).map((column) => column.id);
  const columnTitleById = new Map(boardColumns.map((column) => [column.id, column.title]));
  const completed = projectTasks.filter((task) => doneColumnIds.includes(task.columnId)).length;
  const overdue = projectTasks.filter((task) => new Date(task.dueDate) < new Date() && !doneColumnIds.includes(task.columnId)).length;
  const inProgress = projectTasks.filter((task) => boardColumns.find((column) => column.id === task.columnId)?.title === "In Progress").length;
  const completionRate = Math.round((completed / Math.max(projectTasks.length, 1)) * 100);
  const workload = members.map((member) => ({
    name: member.name.split(" ")[0],
    tasks: projectTasks.filter((task) => task.assigneeId === member.id).length,
  }));
  const now = new Date();
  const week = new Date();
  week.setDate(now.getDate() + 7);
  const deadlineGroups = [
    { label: "Overdue", tasks: projectTasks.filter((task) => new Date(task.dueDate) < now && !doneColumnIds.includes(task.columnId)) },
    { label: "Today", tasks: projectTasks.filter((task) => new Date(task.dueDate).toDateString() === now.toDateString()) },
    { label: "This week", tasks: projectTasks.filter((task) => new Date(task.dueDate) >= now && new Date(task.dueDate) <= week) },
    { label: "Upcoming", tasks: projectTasks.filter((task) => new Date(task.dueDate) > week) },
  ];
  const timelineData = boardColumns.map((column) => ({ name: column.title, tasks: projectTasks.filter((task) => task.columnId === column.id).length }));
  const projectAttachments = projectTasks.flatMap((task) => task.attachments.map((attachment) => ({ ...attachment, task })));

  useEffect(() => {
    setProjectDraft({
      title: activeProject.title,
      description: activeProject.description,
      status: activeProject.status,
      startDate: activeProject.startDate.slice(0, 10),
      dueDate: activeProject.dueDate.slice(0, 10),
    });
  }, [activeProject.description, activeProject.dueDate, activeProject.startDate, activeProject.status, activeProject.title]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const overColumn = boardColumns.find((column) => column.id === over.id);
    const overTask = tasks.find((task) => task.id === over.id);
    const targetColumnId = overColumn?.id ?? overTask?.columnId ?? boardColumns[0].id;
    const targetPosition = overTask?.position ?? 0;
    moveTask(active.id.toString(), targetColumnId, targetPosition);
  }

  function shareBoard() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      window.prompt("Copy board link", url);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-panel rounded-lg px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#667085]">Projects / {activeProject.title}</p>
            <h1 className="mt-1 text-2xl font-black tracking-normal">{activeProject.title}</h1>
            <p className="text-sm text-[#667085]">{activeProject.description || "Plan, assign, review, and ship work from one board."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeProject.id}
              onChange={(event) => {
                setActiveProjectId(event.target.value);
                setProjectView("Board");
              }}
              className="h-10 min-w-[230px] rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold text-[#172033]"
              aria-label="Select project board"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} - {project.status}
                </option>
              ))}
            </select>
            <Button variant="outline" type="button" onClick={shareBoard}>
              Share
            </Button>
            <Button variant="outline" type="button" onClick={() => setPriorityFilter(priorityFilter === "High" ? "All" : "High")}>
              {priorityFilter === "High" ? "Clear filter" : "Filter"}
            </Button>
            <Button type="button" onClick={() => boardColumns[0] && createTask(boardColumns[0].id, "New task")} disabled={!boardColumns[0]}>
              <Plus className="size-4" />
              New
            </Button>
          </div>
        </div>
        <div className="mt-4 flex gap-6 border-t border-[#edf1f5] pt-3 text-sm font-bold text-[#667085]">
          {boardTabs.map((tab) => (
            <button
              key={tab}
              className={projectView === tab ? "border-b-2 border-[#0f766e] pb-2 text-[#0f766e]" : "pb-2 hover:text-[#172033]"}
              type="button"
              onClick={() => setProjectView(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total tasks" value={projectTasks.length} icon={Target} hint="In this project" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} hint={`${completionRate}% completion rate`} />
        <StatCard label="In progress" value={inProgress} icon={Clock3} hint="Currently moving" />
        <StatCard label="Overdue" value={overdue} icon={Flame} hint="Needs attention" />
        <StatCard label="Completion rate" value={`${completionRate}%`} icon={CheckCircle2} hint="Based on Done column" />
      </div>

      {projectView === "Board" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-normal">Kanban board</h2>
              <p className="text-sm text-[#667085]">Drag tasks between columns and open any card for full details.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
                className="h-10 rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold"
              >
                {["All", "Low", "Medium", "High", "Urgent"].map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!columnTitle.trim()) return;
                  createColumn(columnTitle.trim());
                  setColumnTitle("");
                }}
              >
                <TextField value={columnTitle} onChange={(event) => setColumnTitle(event.target.value)} placeholder="New column" />
                <Button type="submit">
                  <Plus className="size-4" />
                  Column
                </Button>
              </form>
            </div>
          </div>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-3">
              {boardColumns.map((column) => (
                <BoardColumn key={column.id} column={column} />
              ))}
            </div>
          </DndContext>
        </>
      ) : null}

      {projectView === "List" ? (
        <section className="soft-panel overflow-hidden rounded-lg">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.08em] text-[#667085]">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectTasks.map((task) => {
                const assignee = members.find((member) => member.id === task.assigneeId) ?? members[0];
                return (
                  <tr key={task.id} className="border-t border-[#edf1f5]">
                    <td className="px-4 py-4">
                      <p className="font-bold">{task.title}</p>
                      <p className="line-clamp-1 text-sm text-[#667085]">{task.description}</p>
                    </td>
                    <td className="px-4 py-4"><Badge>{columnTitleById.get(task.columnId) ?? "Unknown"}</Badge></td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold"><Avatar member={assignee} className="size-7" />{assignee.name}</span>
                    </td>
                    <td className="px-4 py-4"><Badge tone={task.priority === "Urgent" ? "red" : task.priority === "High" ? "amber" : "default"}>{task.priority}</Badge></td>
                    <td className="px-4 py-4 text-sm">{formatShortDate(task.dueDate)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setActiveTaskId(task.id)}>Open</Button>
                        <Button variant="danger" size="sm" onClick={() => deleteTask(task.id)}><Trash2 className="size-4" />Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {projectView === "Timeline" ? (
        <section className="grid gap-4 lg:grid-cols-5">
          {boardColumns.map((column) => (
            <div key={column.id} className="soft-panel rounded-lg p-4">
              <h3 className="mb-3 text-sm font-black">{column.title}</h3>
              <div className="flex flex-col gap-3">
                {projectTasks.filter((task) => task.columnId === column.id).map((task) => (
                  <button key={task.id} className="rounded-md border border-[#edf1f5] p-3 text-left hover:border-[#0f766e]/40" onClick={() => setActiveTaskId(task.id)}>
                    <p className="text-sm font-bold">{task.title}</p>
                    <p className="mt-1 text-xs text-[#667085]">Due {formatShortDate(task.dueDate)}</p>
                  </button>
                ))}
                {projectTasks.filter((task) => task.columnId === column.id).length === 0 ? <p className="text-sm text-[#667085]">No tasks here.</p> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {projectView === "Calendar" ? (
        <section className="grid gap-4 lg:grid-cols-4">
          {deadlineGroups.map((group) => (
            <div key={group.label} className="soft-panel rounded-lg p-4">
              <h3 className="mb-3 text-sm font-black">{group.label}</h3>
              <div className="flex flex-col gap-3">
                {group.tasks.map((task) => (
                  <button key={task.id} className="rounded-md border border-[#edf1f5] p-3 text-left hover:border-[#0f766e]/40" onClick={() => setActiveTaskId(task.id)}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{task.title}</p>
                      <Badge tone={task.priority === "Urgent" ? "red" : "default"}>{task.priority}</Badge>
                    </div>
                    <p className="text-xs text-[#667085]">{formatShortDate(task.dueDate)}</p>
                  </button>
                ))}
                {group.tasks.length === 0 ? <p className="text-sm text-[#667085]">No tasks.</p> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {projectView === "Reports" ? (
        <div className="grid gap-4 xl:grid-cols-2">
        <section className="soft-panel rounded-lg p-5">
          <h3 className="mb-4 text-sm font-black">Task distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={boardColumns.map((column) => ({ name: column.title, tasks: projectTasks.filter((task) => task.columnId === column.id).length }))}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="tasks" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="soft-panel rounded-lg p-5">
          <h3 className="mb-4 text-sm font-black">Team workload</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={80} />
                <Bar dataKey="tasks" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
          <section className="soft-panel rounded-lg p-5 xl:col-span-2">
            <h3 className="mb-4 text-sm font-black">Progress trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData.map((item, index) => ({ ...item, completed: index + completed }))}>
                  <CartesianGrid stroke="#e5ebf2" strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tasks" stroke="#0f766e" strokeWidth={3} />
                  <Line type="monotone" dataKey="completed" stroke="#f59e0b" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : null}

      {projectView === "Files" ? (
        <section className="soft-panel rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Project files</h3>
              <p className="text-sm text-[#667085]">Attachments uploaded to tasks in this project.</p>
            </div>
            <label className="inline-flex">
              <input
                className="sr-only"
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  const firstTask = projectTasks[0];
                  if (file && firstTask) uploadTaskAttachment(firstTask.id, file);
                }}
              />
              <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#0f766e] bg-[#0f766e] px-4 text-sm font-semibold text-white">
                <Paperclip className="size-4" />
                Upload file
              </span>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {projectAttachments.map(({ task, ...attachment }) => (
              <article key={attachment.id} className="rounded-md border border-[#edf1f5] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <a href={attachment.url} className="font-bold text-[#172033] hover:text-[#0f766e]">{attachment.name}</a>
                    <p className="mt-1 text-sm text-[#667085]">{attachment.size} · {task.title}</p>
                  </div>
                  <Button variant="danger" size="icon" onClick={() => deleteTaskAttachment(attachment.id)}><Trash2 className="size-4" /></Button>
                </div>
              </article>
            ))}
            {projectAttachments.length === 0 ? <p className="text-sm text-[#667085]">No files yet. Upload a file or attach one inside a task.</p> : null}
          </div>
        </section>
      ) : null}

      {projectView === "Settings" ? (
        <section className="soft-panel rounded-lg p-5">
          <h3 className="mb-4 text-lg font-black">Project settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-bold">
              Project title
              <TextField value={projectDraft.title} onChange={(event) => setProjectDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold">
              Status
              <select
                value={projectDraft.status}
                onChange={(event) => setProjectDraft((current) => ({ ...current, status: event.target.value as typeof activeProject.status }))}
                className="h-10 rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold"
              >
                {["Active", "Completed", "Archived"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold">
              Start date
              <TextField type="date" value={projectDraft.startDate} onChange={(event) => setProjectDraft((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold">
              Due date
              <TextField type="date" value={projectDraft.dueDate} onChange={(event) => setProjectDraft((current) => ({ ...current, dueDate: event.target.value }))} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold md:col-span-2">
              Description
              <TextArea value={projectDraft.description} onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                updateProject(activeProject.id, {
                  title: projectDraft.title,
                  description: projectDraft.description,
                  status: projectDraft.status,
                  startDate: projectDraft.startDate,
                  dueDate: projectDraft.dueDate,
                })
              }
            >
              Save project
            </Button>
            <Button variant="outline" onClick={() => archiveProject(activeProject.id)}><Archive className="size-4" />Archive project</Button>
            <Button variant="danger" onClick={() => deleteProject(activeProject.id)}><Trash2 className="size-4" />Delete project</Button>
            <Button variant="outline" onClick={() => setActivePage("projects")}><Settings className="size-4" />Workspace projects</Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
