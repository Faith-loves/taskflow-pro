import type { Member, Project, Task } from "@/data/types";
import { supabase } from "./supabase";

export type AssistantContext = {
  project: Project;
  tasks: Task[];
  members: Member[];
};

export async function askTaskFlowAssistant(message: string, context: AssistantContext) {
  const grokContext = {
    project: context.project.title,
    status: context.project.status,
    tasks: context.tasks.map((task) => ({
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      labels: task.labels,
      assignee: context.members.find((member) => member.id === task.assigneeId)?.name ?? "Unassigned",
    })),
  };

  if (supabase) {
    const { data, error } = await supabase.functions.invoke("ai-assistant", {
      body: { message, context: grokContext },
    });
    const answer = data?.answer as string | undefined;
    if (!error && answer && !answer.includes("XAI_API_KEY is not set")) {
      return answer;
    }
  }

  const urgent = context.tasks.filter((task) => task.priority === "Urgent" || task.priority === "High");
  const overdue = context.tasks.filter((task) => new Date(task.dueDate) < new Date());
  const completed = context.tasks.filter((task) => task.columnId.toLowerCase().includes("done"));
  const completionRate = Math.round((completed.length / Math.max(context.tasks.length, 1)) * 100);
  const workload = context.members
    .map((member) => ({
      name: member.name,
      count: context.tasks.filter((task) => task.assigneeId === member.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const nextDue = [...context.tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);
  const projectSummary = `${context.project.title} has ${context.tasks.length} tasks and is ${completionRate}% complete.`;

  if (/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening)\b/i.test(message)) {
    return `Hey. I am here with you on ${context.project.title}. ${projectSummary} You can ask me what to do next, who is busy, what is overdue, or tell me an idea and I will turn it into tasks.`;
  }
  if (/who are you|what can you do|help|how do you work/i.test(message)) {
    return [
      "I am TaskFlow AI, your project assistant inside this workspace.",
      "I can answer normal questions, but I will keep my answers useful for this app.",
      "Try asking: “what should I do today?”, “who is overloaded?”, “summarize progress”, or “generate tasks for a login redesign”.",
    ].join("\n");
  }
  if (/thank|thanks|appreciate/i.test(message)) {
    return "Anytime. Keep the board moving and I will help you stay on top of the work.";
  }
  if (/joke|funny/i.test(message)) {
    return "Tiny project joke: the task said it was Done, but QA said “let us just check one small thing.” Anyway, back to shipping.";
  }
  if (/generate|break|create|plan|tasks|idea|build/i.test(message)) {
    return [
      "Here is a strong task breakdown:",
      "1. Define scope and acceptance criteria - High",
      "2. Design the main user flow - High",
      "3. Build the core screens and states - Medium",
      "4. Connect database and permissions - High",
      "5. Test edge cases and mobile layout - Medium",
    ].join("\n");
  }
  if (/summar|progress|status|how.*project|where.*we/i.test(message)) {
    return `${context.project.title} has ${context.tasks.length} tasks and is ${completionRate}% complete. ${urgent.length} tasks are high-priority and ${overdue.length} are overdue. Focus first on overdue work, then move high-priority tasks into review.`;
  }
  if (/priority|urgent|important|focus|today|next|do first|what should/i.test(message)) {
    const top = urgent.slice(0, 5).map((task, index) => `${index + 1}. ${task.title} - ${task.priority}`).join("\n");
    return top ? `Focus on these first:\n${top}` : "No urgent or high-priority tasks right now. Good time to clear review and overdue items.";
  }
  if (/workload|busy|team|member|who.*doing|assigned/i.test(message)) {
    return workload.map((item) => `${item.name}: ${item.count} task${item.count === 1 ? "" : "s"}`).join("\n");
  }
  if (/overdue|late|deadline|due|calendar|meeting|time/i.test(message)) {
    if (/meeting|time/i.test(message)) {
      const meetingTasks = context.tasks.filter((task) => /meeting|review|kickoff|call|sync/i.test(`${task.title} ${task.description} ${task.labels.join(" ")}`));
      return meetingTasks.length
        ? meetingTasks.map((task, index) => `${index + 1}. ${task.title} - due ${new Date(task.dueDate).toLocaleDateString()}`).join("\n")
        : "I do not see meeting tasks yet. You can create one like “Schedule design review for Thursday 2 PM”.";
    }
    return overdue.length
      ? overdue.map((task, index) => `${index + 1}. ${task.title} - due ${new Date(task.dueDate).toLocaleDateString()}`).join("\n")
      : "No overdue tasks. Nice.";
  }
  if (/risk|block|problem|issue/i.test(message)) {
    return overdue.length || urgent.length
      ? `Main risks: ${overdue.length} overdue task(s), ${urgent.length} high-priority task(s), and any review work that has not moved to Done. I would clear the oldest due date first.`
      : "No major risk stands out from the board. Keep checking review items and upcoming due dates.";
  }
  if (/explain|what is|why|how/i.test(message)) {
    return `Short answer: I can help, but I will tie it back to ${context.project.title}. Right now, the next visible deadlines are:\n${nextDue
      .map((task, index) => `${index + 1}. ${task.title} - ${new Date(task.dueDate).toLocaleDateString()}`)
      .join("\n")}`;
  }
  return `I hear you. For this workspace, I would connect that back to ${context.project.title}. ${projectSummary} The most useful next move is to check urgent tasks, upcoming deadlines, and review blockers.`;
}
