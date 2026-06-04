import type { Column, Member, Project, Task } from "@/data/types";
import { supabase } from "./supabase";

export type AssistantContext = {
  currentProject: Project;
  projects: Project[];
  tasks: Task[];
  members: Member[];
  columns: Column[];
};

export async function askTaskFlowAssistant(message: string, context: AssistantContext) {
  const doneColumnIds = new Set(context.columns.filter((column) => column.title.toLowerCase() === "done").map((column) => column.id));
  const columnName = (task: Task) => context.columns.find((column) => column.id === task.columnId)?.title ?? "Unknown";
  const projectName = (task: Task) => context.projects.find((project) => project.id === task.projectId)?.title ?? context.currentProject.title;
  const assigneeName = (task: Task) => context.members.find((member) => member.id === task.assigneeId)?.name ?? "Unassigned";
  const isDone = (task: Task) => doneColumnIds.has(task.columnId);
  const openTasks = context.tasks.filter((task) => !isDone(task));
  const completedTasks = context.tasks.filter(isDone);
  const overdueTasks = context.tasks.filter((task) => new Date(task.dueDate) < new Date() && !isDone(task));
  const priorityTasks = openTasks.filter((task) => task.priority === "Urgent" || task.priority === "High");
  const completionRate = Math.round((completedTasks.length / Math.max(context.tasks.length, 1)) * 100);
  const cleanMessage = message.trim().toLowerCase();

  const projectRows = context.projects.map((project) => {
    const projectTasks = context.tasks.filter((task) => task.projectId === project.id);
    const done = projectTasks.filter(isDone).length;
    return {
      title: project.title,
      status: project.status,
      total: projectTasks.length,
      done,
      open: projectTasks.length - done,
      progress: Math.round((done / Math.max(projectTasks.length, 1)) * 100),
    };
  });

  const workload = context.members
    .map((member) => {
      const assigned = context.tasks.filter((task) => task.assigneeId === member.id);
      const done = assigned.filter(isDone).length;
      const overdue = assigned.filter((task) => new Date(task.dueDate) < new Date() && !isDone(task)).length;
      return {
        name: member.name,
        assigned: assigned.length,
        open: assigned.length - done,
        done,
        overdue,
        progress: Math.round((done / Math.max(assigned.length, 1)) * 100),
      };
    })
    .sort((a, b) => b.assigned - a.assigned);

  const taskLine = (task: Task, index: number) =>
    `${index + 1}. ${task.title} - ${projectName(task)} - ${columnName(task)} - ${task.priority} - ${assigneeName(task)} - due ${new Date(task.dueDate).toLocaleDateString()}`;

  const workspaceSummary = `Workspace summary: ${context.projects.length} projects, ${context.tasks.length} total tasks, ${openTasks.length} open, ${completedTasks.length} completed, ${overdueTasks.length} overdue, ${completionRate}% overall progress.`;
  const projectSummary = projectRows.map((project) => `${project.title}: ${project.done}/${project.total} done (${project.progress}%, ${project.status})`).join("\n");
  const nextDue = [...openTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

  const grokContext = {
    workspace: "TaskFlow Pro",
    currentProject: context.currentProject.title,
    totals: {
      projects: context.projects.length,
      tasks: context.tasks.length,
      open: openTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      completionRate,
    },
    projects: projectRows,
    team: workload,
    tasks: context.tasks.map((task) => ({
      project: projectName(task),
      title: task.title,
      status: columnName(task),
      priority: task.priority,
      dueDate: task.dueDate,
      labels: task.labels,
      assignee: assigneeName(task),
    })),
  };

  if (supabase) {
    const { data, error } = await supabase.functions.invoke("ai-assistant", {
      body: { message, context: grokContext },
    });
    const answer = data?.answer as string | undefined;
    if (!error && answer && !answer.includes("XAI_API_KEY is not set") && answer.length > 20) {
      return answer;
    }
  }

  if (/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening)\b/i.test(cleanMessage)) {
    return `Hey. I am looking at the whole TaskFlow Pro workspace, not only one task. ${workspaceSummary} Ask me about priorities, overdue work, team workload, notifications, files, settings, or a project idea.`;
  }

  if (/who are you|what can you do|help|how do you work/i.test(cleanMessage)) {
    return [
      "I am TaskFlow AI, your workspace assistant.",
      "I can talk about projects, tasks, assignees, overdue work, team progress, notifications, files, settings, and what to do next.",
      "Try: summarize all projects, who is overloaded, what is overdue, what should I do today, or suggest tasks for a new feature.",
    ].join("\n");
  }

  if (/thank|thanks|appreciate/i.test(cleanMessage)) {
    return "Anytime. I will keep watching the workspace context and help you move the right work forward.";
  }

  if (/joke|funny/i.test(cleanMessage)) {
    return "Tiny project joke: the task said it was Done, then QA opened the app on mobile. Anyway, back to shipping.";
  }

  if (/(generate|break down|create|plan|suggest).*(task|tasks)|idea|build/i.test(cleanMessage)) {
    return [
      "Here is a workspace-ready task breakdown:",
      "1. Define scope and acceptance criteria - High - assign to product/owner",
      "2. Design the main user flow and empty states - High - assign to design",
      "3. Build the core screens, loading states, and error states - High - assign to engineering",
      "4. Connect Supabase data, permissions, and activity logging - High - assign to engineering",
      "5. Test mobile layout, deletion, notifications, and edge cases - Medium - assign to QA/reviewer",
    ].join("\n");
  }

  if (/summar|progress|status|whole app|workspace|all project|all projects|where.*we/i.test(cleanMessage)) {
    return `${workspaceSummary}\n\nProject progress:\n${projectSummary}\n\nBest next move: clear overdue work first, then move high-priority In Progress items into Review.`;
  }

  if (/priority|urgent|important|focus|today|next|do first|what should|another task/i.test(cleanMessage)) {
    const ordered = [...overdueTasks, ...priorityTasks.filter((task) => !overdueTasks.some((overdue) => overdue.id === task.id))].slice(0, 6);
    return ordered.length
      ? `Focus on these workspace tasks first:\n${ordered.map(taskLine).join("\n")}`
      : "No overdue or urgent work is standing out. A good next task would be moving one In Review item to Done after QA.";
  }

  if (/workload|busy|team|member|who.*doing|assigned|performance/i.test(cleanMessage)) {
    return workload.map((item) => `${item.name}: ${item.assigned} assigned, ${item.open} open, ${item.done} done, ${item.overdue} overdue, ${item.progress}% progress`).join("\n");
  }

  if (/overdue|late|deadline|due|calendar|meeting|time/i.test(cleanMessage)) {
    if (/meeting|time/i.test(cleanMessage)) {
      const meetingTasks = context.tasks.filter((task) => /meeting|review|kickoff|call|sync/i.test(`${task.title} ${task.description} ${task.labels.join(" ")}`));
      return meetingTasks.length ? meetingTasks.map(taskLine).join("\n") : "I do not see meeting tasks yet. You can create one like: Schedule design review for Thursday 2 PM.";
    }
    return overdueTasks.length ? overdueTasks.map(taskLine).join("\n") : "No overdue tasks. Nice.";
  }

  if (/risk|block|problem|issue/i.test(cleanMessage)) {
    return overdueTasks.length || priorityTasks.length
      ? `Main risks: ${overdueTasks.length} overdue task(s), ${priorityTasks.length} high-priority open task(s), and any review work that has not moved to Done. I would clear the oldest due date first.`
      : "No major risk stands out from the board. Keep checking review items and upcoming due dates.";
  }

  if (/notification|notify|bell/i.test(cleanMessage)) {
    return "Notifications in TaskFlow Pro cover assignments, comments, mentions, deadline reminders, and project changes. Use the bell to review them, mark them read, delete one, or clear all.";
  }

  if (/file|attachment|upload|document/i.test(cleanMessage)) {
    return "Files live on task attachments. Open a task or the project Files tab to upload, inspect, and delete attachments.";
  }

  if (/list|timeline|report|calendar|setting|board|tab/i.test(cleanMessage)) {
    return "The project tabs are real views: Board for drag-and-drop, List for task table actions, Timeline and Calendar for scheduling, Reports for progress, Files for attachments, and Settings for project admin.";
  }

  if (/explain|what is|why|how/i.test(cleanMessage)) {
    return `Short answer: I can help and I will connect it to the full workspace. Next deadlines:\n${nextDue.map(taskLine).join("\n") || "No upcoming open deadlines found."}`;
  }

  return `I hear you. Looking at the whole workspace: ${workspaceSummary} If you want action, start with overdue tasks, then high-priority work, then anything stuck in Review.`;
}
