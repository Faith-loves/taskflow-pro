import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppState, Column, Member, Priority, Project, Task } from "@/data/types";
import { supabase } from "./supabase";
import { initialState } from "@/data/seed";
import { daysFromNow } from "./utils";

type AppStore = AppState & {
  activeProject: Project;
  activeTask?: Task;
  activeTaskId?: string;
  setActiveProjectId: (id: string) => void;
  search: string;
  setSearch: (value: string) => void;
  priorityFilter: Priority | "All";
  setPriorityFilter: (value: Priority | "All") => void;
  setActiveTaskId: (id?: string) => void;
  moveTask: (taskId: string, columnId: string, position?: number) => void;
  createTask: (columnId: string, title: string) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  addComment: (taskId: string, body: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  deleteTask: (taskId: string) => void;
  createColumn: (title: string) => void;
  renameColumn: (columnId: string, title: string) => void;
  deleteColumn: (columnId: string) => void;
  inviteMember: (email: string, role: Member["role"]) => void;
  updateMemberRole: (memberId: string, role: Member["role"]) => void;
  createProject: (title: string) => void;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  archiveProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  updateWorkspaceName: (name: string) => void;
  deleteWorkspace: () => void;
  uploadWorkspaceLogo: (file: File) => void;
  uploadProfilePicture: (file: File) => void;
  uploadTaskAttachment: (taskId: string, file: File) => void;
  deleteTaskAttachment: (attachmentId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  addSubtask: (taskId: string, title: string) => void;
  markNotificationsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  generateAiTasks: (idea: string) => void;
  refresh: () => Promise<void>;
};

const AppContext = createContext<AppStore | null>(null);

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is required.");
  return supabase;
}

function mapProject(row: any): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description ?? "",
    startDate: row.start_date ?? new Date().toISOString(),
    dueDate: row.due_date ?? new Date().toISOString(),
    status: row.status,
    memberIds: row.project_members?.map((member: any) => member.user_id) ?? [],
  };
}

function mapTask(row: any, children: { comments: any[]; subtasks: any[]; attachments: any[]; activity: any[] }): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    columnId: row.column_id,
    title: row.title,
    description: row.description ?? "",
    assigneeId: row.assignee_id,
    priority: row.priority,
    dueDate: row.due_date ?? new Date().toISOString(),
    labels: row.labels ?? [],
    position: row.position ?? 0,
    comments: children.comments
      .filter((comment) => comment.task_id === row.id)
      .map((comment) => ({
        id: comment.id,
        taskId: comment.task_id,
        authorId: comment.author_id,
        body: comment.body,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      })),
    subtasks: children.subtasks
      .filter((subtask) => subtask.task_id === row.id)
      .map((subtask) => ({ id: subtask.id, title: subtask.title, completed: subtask.completed })),
    attachments: children.attachments
      .filter((attachment) => attachment.task_id === row.id)
      .map((attachment) => ({
        id: attachment.id,
        taskId: attachment.task_id,
        name: attachment.file_name,
        type: attachment.file_type ?? "File",
        url: supabase?.storage.from("task-attachments").getPublicUrl(attachment.file_path).data.publicUrl ?? attachment.file_path,
        path: attachment.file_path,
        size: attachment.file_size ? `${Math.ceil(attachment.file_size / 1024)} KB` : "0 KB",
      })),
    activity: children.activity
      .filter((activity) => activity.task_id === row.id)
      .map((activity) => ({
        id: activity.id,
        taskId: activity.task_id,
        actorId: activity.actor_id,
        message: activity.action,
        createdAt: activity.created_at,
      })),
  };
}

async function ensureStarterWorkspace(userId: string, userEmail: string) {
  const client = requireSupabase();
  const { data: membership } = await client.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  if (membership) return membership.workspace_id as string;
  const { data: workspaceId, error } = await client.rpc("create_initial_workspace", {
    workspace_name: "My TaskFlow Workspace",
    user_email: userEmail,
  });
  if (error) throw error;
  return workspaceId as string;
}

async function seedWorkspaceIfEmpty(workspaceId: string) {
  const client = requireSupabase();
  const getSeedState = async () => {
    const [tasksResult, projectsResult] = await Promise.all([
      client.from("tasks").select("id, title, projects!inner(workspace_id)").eq("projects.workspace_id", workspaceId),
      client.from("projects").select("id").eq("workspace_id", workspaceId),
    ]);
    return {
      hasStarterMarker: tasksResult.data?.some((task) => task.title === "Prepare stakeholder kickoff brief") ?? false,
      projectCount: projectsResult.data?.length ?? 0,
    };
  };

  const before = await getSeedState();
  if (before.hasStarterMarker && before.projectCount >= 4) return;

  const { error } = await client.rpc("seed_workspace_demo_data", { target_workspace_id: workspaceId });
  if (!error) {
    const after = await getSeedState();
    if (after.hasStarterMarker && after.projectCount >= 4) return;
  }

  await seedWorkspaceFromClient(workspaceId);
}

async function seedWorkspaceFromClient(workspaceId: string) {
  const client = requireSupabase();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { data: existingTasks } = await client.from("tasks").select("id, title, projects!inner(workspace_id)").eq("projects.workspace_id", workspaceId);
  if (existingTasks?.some((task) => task.title === "Prepare stakeholder kickoff brief")) {
    const { data: existingProjects } = await client.from("projects").select("id").eq("workspace_id", workspaceId);
    if ((existingProjects?.length ?? 0) >= 4) return;
  }

  const inviteRows = [
    { workspace_id: workspaceId, email: "sarah.design@example.com", role: "Admin", invited_by: userId },
    { workspace_id: workspaceId, email: "jamal.engineering@example.com", role: "Member", invited_by: userId },
    { workspace_id: workspaceId, email: "olivia.client@example.com", role: "Viewer", invited_by: userId },
  ];
  for (const invite of inviteRows) {
    const { data: existingInvite } = await client
      .from("workspace_invitations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", invite.email)
      .maybeSingle();
    if (!existingInvite) await client.from("workspace_invitations").insert(invite);
  }

  const ensureProject = async (project: { title: string; description: string; status: string; startOffset: number; dueOffset: number }) => {
    const { data: existing } = await client.from("projects").select("id").eq("workspace_id", workspaceId).eq("title", project.title).maybeSingle();
    if (existing?.id) {
      await client
        .from("projects")
        .update({
          description: project.description,
          start_date: daysFromNow(project.startOffset),
          due_date: daysFromNow(project.dueOffset),
          status: project.status,
        })
        .eq("id", existing.id);
      return existing.id as string;
    }

    const { data: created } = await client
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        title: project.title,
        description: project.description,
        start_date: daysFromNow(project.startOffset),
        due_date: daysFromNow(project.dueOffset),
        status: project.status,
        created_by: userId,
      })
      .select("id")
      .single();
    if (created?.id) await client.from("project_members").insert({ project_id: created.id, user_id: userId });
    return created?.id as string | undefined;
  };

  const ensureColumns = async (projectId: string) => {
    const defaultColumns = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
    const { data: columns } = await client.from("board_columns").select("id,title").eq("project_id", projectId);
    const columnMap = new Map((columns ?? []).map((column) => [column.title, column.id]));
    for (const [position, title] of defaultColumns.entries()) {
      if (!columnMap.has(title)) {
        const { data: created } = await client.from("board_columns").insert({ project_id: projectId, title, position }).select("id,title").single();
        if (created) columnMap.set(created.title, created.id);
      }
    }
    return columnMap;
  };

  const projects = [
    {
      title: "Website Redesign",
      description: "Refresh the customer-facing website, onboarding flow, launch copy, and analytics dashboard.",
      status: "Active",
      startOffset: -7,
      dueOffset: 21,
    },
    {
      title: "Mobile App Launch",
      description: "Prepare beta release tasks, store assets, QA checks, notifications, and release readiness.",
      status: "Active",
      startOffset: -12,
      dueOffset: 14,
    },
    {
      title: "Marketing Campaign",
      description: "Coordinate launch email, social calendar, landing copy, and campaign reporting.",
      status: "Completed",
      startOffset: -28,
      dueOffset: -2,
    },
    {
      title: "Backend API Integration",
      description: "Connect activity feed, file upload, realtime events, and reliability checks for production.",
      status: "Active",
      startOffset: -4,
      dueOffset: 18,
    },
  ];

  const projectIds = new Map<string, string>();
  for (const project of projects) {
    const projectId = await ensureProject(project);
    if (projectId) projectIds.set(project.title, projectId);
  }

  const taskPlans = [
    {
      project: "Website Redesign",
      column: "Backlog",
      title: "Prepare stakeholder kickoff brief",
      description: "Collect goals, launch constraints, decision makers, and open questions for the Monday kickoff meeting at 10:00 AM.",
      priority: "High",
      dueOffset: 1,
      labels: ["Meeting", "Planning"],
      position: 0,
    },
    {
      project: "Website Redesign",
      column: "In Progress",
      title: "Design onboarding screen",
      description: "Create the first-run onboarding flow for new workspace owners, including empty states and invite prompts.",
      priority: "High",
      dueOffset: 4,
      labels: ["Design", "Onboarding"],
      position: 0,
    },
    {
      project: "Website Redesign",
      column: "To Do",
      title: "Schedule design review with Sarah and Jamal",
      description: "Book a 30-minute review for homepage sections, API handoff, and responsive edge cases.",
      priority: "Medium",
      dueOffset: 2,
      labels: ["Meeting", "Review"],
      position: 0,
    },
    {
      project: "Website Redesign",
      column: "In Review",
      title: "Finalize landing page copy",
      description: "Review hero message, feature language, proof points, and conversion CTA before handoff.",
      priority: "Medium",
      dueOffset: 3,
      labels: ["Copy", "Marketing"],
      position: 0,
    },
    {
      project: "Website Redesign",
      column: "Done",
      title: "QA responsive board layout",
      description: "Verify desktop, tablet, and mobile board behavior with detail drawer open and closed.",
      priority: "Medium",
      dueOffset: -1,
      labels: ["QA", "Responsive"],
      position: 0,
    },
    {
      project: "Website Redesign",
      column: "To Do",
      title: "Create launch checklist for Friday",
      description: "Confirm assets, analytics events, sign-off owners, deployment window, and rollback plan.",
      priority: "Urgent",
      dueOffset: 5,
      labels: ["Launch", "Ops"],
      position: 1,
    },
    {
      project: "Mobile App Launch",
      column: "In Progress",
      title: "Fix onboarding crash before beta review",
      description: "Investigate the beta crash report, patch the onboarding flow, and retest before the 4:00 PM review.",
      priority: "Urgent",
      dueOffset: -2,
      labels: ["Bug", "Beta"],
      position: 0,
    },
    {
      project: "Mobile App Launch",
      column: "To Do",
      title: "Prepare App Store screenshots",
      description: "Export polished screenshots for onboarding, dashboard, calendar, and notifications.",
      priority: "High",
      dueOffset: 3,
      labels: ["Release", "Design"],
      position: 0,
    },
    {
      project: "Mobile App Launch",
      column: "Done",
      title: "QA push notification flow",
      description: "Test assignment, mention, comment, and due-date notification paths on staging.",
      priority: "Medium",
      dueOffset: -3,
      labels: ["QA", "Notifications"],
      position: 0,
    },
    {
      project: "Marketing Campaign",
      column: "Done",
      title: "Publish launch announcement draft",
      description: "Draft and approve the launch announcement for LinkedIn, email, and the homepage banner.",
      priority: "Medium",
      dueOffset: -5,
      labels: ["Copy", "Launch"],
      position: 0,
    },
    {
      project: "Marketing Campaign",
      column: "Done",
      title: "Review email campaign schedule",
      description: "Finalize the launch drip sequence, owner list, send windows, and reporting tags.",
      priority: "Low",
      dueOffset: -2,
      labels: ["Email", "Meeting"],
      position: 1,
    },
    {
      project: "Backend API Integration",
      column: "In Progress",
      title: "Connect activity feed endpoint",
      description: "Wire task movement, comments, and project status changes into the activity feed query.",
      priority: "High",
      dueOffset: 1,
      labels: ["API", "Activity"],
      position: 0,
    },
    {
      project: "Backend API Integration",
      column: "Backlog",
      title: "Add retry handling for file uploads",
      description: "Handle upload failures, show progress feedback, and keep attachment metadata consistent.",
      priority: "Medium",
      dueOffset: 6,
      labels: ["Files", "Reliability"],
      position: 0,
    },
  ];

  const columnMaps = new Map<string, Map<string, string>>();
  for (const projectId of projectIds.values()) {
    columnMaps.set(projectId, await ensureColumns(projectId));
  }

  const createdTaskIds = new Map<string, string>();
  for (const task of taskPlans) {
    const projectId = projectIds.get(task.project);
    const columnId = projectId ? columnMaps.get(projectId)?.get(task.column) : undefined;
    if (!projectId || !columnId) continue;

    const { data: existing } = await client.from("tasks").select("id").eq("project_id", projectId).eq("title", task.title).maybeSingle();
    if (existing?.id) {
      createdTaskIds.set(task.title, existing.id as string);
      continue;
    }

    const { data: created } = await client
      .from("tasks")
      .insert({
        project_id: projectId,
        column_id: columnId,
        title: task.title,
        description: task.description,
        assignee_id: userId,
        priority: task.priority,
        due_date: daysFromNow(task.dueOffset),
        labels: task.labels,
        position: task.position,
        created_by: userId,
      })
      .select("id")
      .single();
    if (created?.id) createdTaskIds.set(task.title, created.id);
  }

  const subtaskRows = [
    ["Prepare stakeholder kickoff brief", "Write agenda for kickoff meeting", true, 0],
    ["Prepare stakeholder kickoff brief", "List blockers and decisions needed", false, 1],
    ["Design onboarding screen", "Sketch invite teammate empty state", true, 0],
    ["Design onboarding screen", "Prepare mobile version", false, 1],
    ["Schedule design review with Sarah and Jamal", "Send calendar hold for 2:30 PM", false, 0],
    ["Create launch checklist for Friday", "Confirm production checklist owner", false, 0],
    ["Fix onboarding crash before beta review", "Reproduce crash on staging account", true, 0],
    ["Fix onboarding crash before beta review", "Ship patched beta build", false, 1],
    ["Connect activity feed endpoint", "Map task activity events", false, 0],
  ];
  const subtasksToInsert = subtaskRows
    .filter(([title]) => createdTaskIds.has(title as string))
    .map(([title, subtaskTitle, completed, position]) => ({
      task_id: createdTaskIds.get(title as string),
      title: subtaskTitle,
      completed,
      position,
    }));
  if (subtasksToInsert.length) await client.from("subtasks").insert(subtasksToInsert);

  const commentsToInsert = [
    ["Prepare stakeholder kickoff brief", "@Sarah please add the brand goals before the kickoff meeting."],
    ["Design onboarding screen", "@Jamal I updated the onboarding notes. Please check engineering handoff."],
    ["Schedule design review with Sarah and Jamal", "Design review is planned for 2:30 PM tomorrow. Bring mobile screenshots."],
    ["Finalize landing page copy", "@Olivia please review the pricing CTA before final approval."],
    ["Fix onboarding crash before beta review", "This is overdue. I moved it to urgent so it stays visible on the dashboard."],
    ["Connect activity feed endpoint", "Backend sync is almost ready for the next demo."],
  ]
    .filter(([title]) => createdTaskIds.has(title))
    .map(([title, body]) => ({ task_id: createdTaskIds.get(title), author_id: userId, body }));
  if (commentsToInsert.length) await client.from("task_comments").insert(commentsToInsert);

  const activityToInsert = [
    ["Prepare stakeholder kickoff brief", "created kickoff planning task."],
    ["Design onboarding screen", "moved this task from To Do to In Progress."],
    ["Schedule design review with Sarah and Jamal", "scheduled a design review meeting."],
    ["Finalize landing page copy", "added copy review notes."],
    ["QA responsive board layout", "completed responsive QA."],
    ["Create launch checklist for Friday", "marked launch checklist as urgent."],
    ["Fix onboarding crash before beta review", "flagged this task as overdue and urgent."],
    ["QA push notification flow", "completed notification QA."],
    ["Publish launch announcement draft", "completed launch announcement draft."],
    ["Connect activity feed endpoint", "started backend activity integration."],
  ]
    .filter(([title]) => createdTaskIds.has(title))
    .map(([title, action]) => ({ task_id: createdTaskIds.get(title), actor_id: userId, action }));
  if (activityToInsert.length) await client.from("task_activity").insert(activityToInsert);

  await client.from("notifications").insert([
    { user_id: userId, title: "Design review tomorrow", body: "Review homepage sections with Sarah and Jamal at 2:30 PM.", type: "deadline" },
    { user_id: userId, title: "You were mentioned", body: "Sarah was mentioned in the kickoff brief task.", type: "mention" },
    { user_id: userId, title: "Launch task is urgent", body: "Create launch checklist for Friday needs attention.", type: "assignment" },
    { user_id: userId, title: "Overdue mobile task", body: "Fix onboarding crash before beta review is overdue.", type: "deadline" },
  ]);
}

export function AppProvider({ children, userId, userEmail }: { children: ReactNode; userId: string; userEmail: string }) {
  const [state, setState] = useState<AppState | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>();
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [error, setError] = useState("");

  async function refresh() {
    const client = requireSupabase();
    const workspaceId = await ensureStarterWorkspace(userId, userEmail);
    const { data: workspace, error: workspaceError } = await client.from("workspaces").select("*").eq("id", workspaceId).single();
    if (workspaceError) throw workspaceError;

    await seedWorkspaceIfEmpty(workspaceId).catch(() => undefined);

    const [membersResult, invitationsResult, projectsResult, columnsResult, tasksResult, commentsResult, subtasksResult, attachmentsResult, activityResult, notificationsResult] =
      await Promise.all([
        client.from("workspace_members").select("role, profiles(id, full_name, email, avatar_url, title)").eq("workspace_id", workspaceId),
        client.from("workspace_invitations").select("id, email, role, created_at, accepted_at").eq("workspace_id", workspaceId).is("accepted_at", null),
        client.from("projects").select("*, project_members(user_id)").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
        client.from("board_columns").select("*, projects!inner(workspace_id)").eq("projects.workspace_id", workspaceId).order("position"),
        client.from("tasks").select("*, projects!inner(workspace_id)").eq("projects.workspace_id", workspaceId).order("position"),
        client.from("task_comments").select("*, tasks!inner(projects!inner(workspace_id))").eq("tasks.projects.workspace_id", workspaceId).order("created_at", { ascending: false }),
        client.from("subtasks").select("*, tasks!inner(projects!inner(workspace_id))").eq("tasks.projects.workspace_id", workspaceId).order("position"),
        client.from("task_attachments").select("*, tasks!inner(projects!inner(workspace_id))").eq("tasks.projects.workspace_id", workspaceId),
        client.from("task_activity").select("*, tasks!inner(projects!inner(workspace_id))").eq("tasks.projects.workspace_id", workspaceId).order("created_at", { ascending: false }),
        client.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

    for (const result of [membersResult, invitationsResult, projectsResult, columnsResult, tasksResult, commentsResult, subtasksResult, attachmentsResult, activityResult, notificationsResult]) {
      if (result.error) throw result.error;
    }

    const profileMembers: Member[] = (membersResult.data ?? []).map((row: any) => ({
        id: row.profiles.id,
        name: row.profiles.full_name,
        email: row.profiles.email,
        role: row.role,
        avatarUrl: row.profiles.avatar_url,
        title: row.profiles.title ?? "Team member",
      }));
    const existingEmails = new Set(profileMembers.map((member) => member.email.toLowerCase()));
    const invitationMembers = new Map<string, Member>();
    for (const row of invitationsResult.data ?? []) {
      const email = row.email.toLowerCase();
      if (existingEmails.has(email) || invitationMembers.has(email)) continue;
      const displayName =
        email === "sarah.design@example.com"
          ? "Sarah Kim"
          : email === "jamal.engineering@example.com"
            ? "Jamal Reed"
            : email === "olivia.client@example.com"
              ? "Olivia Chen"
              : row.email
                  .split("@")[0]
                  .replace(/[._-]/g, " ")
                  .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
      invitationMembers.set(email, {
        id: `invite-${row.id}`,
        name: displayName,
        email: row.email,
        role: row.role,
        title: "Invited teammate",
      });
    }
    const members: Member[] = [...profileMembers, ...invitationMembers.values()];
    const invitedMemberByEmail = new Map(members.filter((member) => member.id.startsWith("invite-")).map((member) => [member.email, member.id]));
    const visibleAssignees = new Map<string, string | undefined>([
      ["Design onboarding screen", invitedMemberByEmail.get("sarah.design@example.com")],
      ["Finalize landing page copy", invitedMemberByEmail.get("sarah.design@example.com")],
      ["Prepare App Store screenshots", invitedMemberByEmail.get("sarah.design@example.com")],
      ["Publish launch announcement draft", invitedMemberByEmail.get("sarah.design@example.com")],
      ["Fix onboarding crash before beta review", invitedMemberByEmail.get("jamal.engineering@example.com")],
      ["QA push notification flow", invitedMemberByEmail.get("jamal.engineering@example.com")],
      ["Connect activity feed endpoint", invitedMemberByEmail.get("jamal.engineering@example.com")],
      ["Add retry handling for file uploads", invitedMemberByEmail.get("jamal.engineering@example.com")],
      ["Schedule design review with Sarah and Jamal", invitedMemberByEmail.get("olivia.client@example.com")],
      ["Create launch checklist for Friday", invitedMemberByEmail.get("olivia.client@example.com")],
      ["Review email campaign schedule", invitedMemberByEmail.get("olivia.client@example.com")],
    ]);
    const projects = (projectsResult.data ?? []).map(mapProject);
    const columns: Column[] = (columnsResult.data ?? []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      position: row.position,
    }));
    const childrenData = {
      comments: commentsResult.data ?? [],
      subtasks: subtasksResult.data ?? [],
      attachments: attachmentsResult.data ?? [],
      activity: activityResult.data ?? [],
    };
    const tasks = (tasksResult.data ?? []).map((row) => {
      const task = mapTask(row, childrenData);
      return { ...task, assigneeId: visibleAssignees.get(task.title) ?? task.assigneeId };
    });

    setState({
      currentUserId: userId,
      workspace: { id: workspace.id, name: workspace.name, logo: workspace.logo_url ?? "TF", ownerId: workspace.owner_id },
      members,
      projects,
      columns,
      tasks,
      notifications: (notificationsResult.data ?? []).map((notification: any) => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        read: notification.read,
        createdAt: notification.created_at,
      })),
    });
    setActiveProjectId((current) => current ?? projects[0]?.id);
  }

  useEffect(() => {
    refresh().catch((caught) => setError(caught.message));
    const client = requireSupabase();
    const channel = client
      .channel(`workspace-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => refresh())
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [userEmail, userId]);

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6 text-sm font-bold text-[#b42318]">{error}</main>;
  }
  if (!state) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm font-bold text-[#667085]">Loading workspace...</main>;
  }

  const activeProject = state.projects.find((project) => project.id === activeProjectId) ?? state.projects[0];
  const activeTask = state.tasks.find((task) => task.id === activeTaskId);

  const store: AppStore = {
    ...state,
    activeProject,
    activeTask,
    activeTaskId,
    setActiveProjectId,
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    setActiveTaskId,
    refresh,
    moveTask(taskId, columnId, position = 0) {
      const client = requireSupabase();
      const task = state.tasks.find((item) => item.id === taskId);
      const fromColumn = state.columns.find((column) => column.id === task?.columnId);
      const toColumn = state.columns.find((column) => column.id === columnId);
      client.from("tasks").update({ column_id: columnId, position, updated_at: new Date().toISOString() }).eq("id", taskId).then(() => refresh());
      if (task && fromColumn && toColumn && fromColumn.id !== toColumn.id) {
        client.from("task_activity").insert({ task_id: taskId, actor_id: userId, action: `moved this task from ${fromColumn.title} to ${toColumn.title}.` });
      }
    },
    createTask(columnId, title) {
      const client = requireSupabase();
      client
        .from("tasks")
        .insert({
          project_id: activeProject.id,
          column_id: columnId,
          title,
          description: "",
          assignee_id: userId,
          priority: "Medium",
          due_date: daysFromNow(7),
          labels: ["New"],
          position: state.tasks.filter((task) => task.columnId === columnId).length,
          created_by: userId,
        })
        .select("id")
        .single()
        .then(async ({ data }) => {
          if (data) await client.from("task_activity").insert({ task_id: data.id, actor_id: userId, action: "created this task." });
          await refresh();
        });
    },
    updateTask(taskId, patch) {
      const client = requireSupabase();
      if (patch.assigneeId?.startsWith("invite-")) {
        setState((current) =>
          current
            ? {
                ...current,
                tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, assigneeId: patch.assigneeId! } : task)),
              }
            : current,
        );
        return;
      }
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) payload.title = patch.title;
      if (patch.description !== undefined) payload.description = patch.description;
      if (patch.assigneeId !== undefined) payload.assignee_id = patch.assigneeId;
      if (patch.priority !== undefined) payload.priority = patch.priority;
      if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
      if (patch.labels !== undefined) payload.labels = patch.labels;
      client.from("tasks").update(payload).eq("id", taskId).then(() => refresh());
      client.from("task_activity").insert({ task_id: taskId, actor_id: userId, action: "updated task details." });
    },
    addComment(taskId, body) {
      const client = requireSupabase();
      client
        .from("task_comments")
        .insert({ task_id: taskId, author_id: userId, body })
        .then(async () => {
          await client.from("task_activity").insert({ task_id: taskId, actor_id: userId, action: "added a comment." });
          const mentioned = state.members.find((member) => body.includes(`@${member.name.split(" ")[0]}`));
          if (mentioned && !mentioned.id.startsWith("invite-")) {
            await client.from("notifications").insert({
              user_id: mentioned.id,
              title: "You were mentioned",
              body: "You were mentioned in a task comment.",
              type: "mention",
            });
          }
          await refresh();
        });
    },
    deleteComment(taskId, commentId) {
      if (!window.confirm("Delete this comment?")) return;
      requireSupabase().from("task_comments").delete().eq("id", commentId).then(() => refresh());
      requireSupabase().from("task_activity").insert({ task_id: taskId, actor_id: userId, action: "deleted a comment." });
    },
    deleteTask(taskId) {
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task || !window.confirm(`Delete "${task.title}" and all comments, subtasks, attachments, and activity?`)) return;
      requireSupabase()
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .then(() => {
          if (activeTaskId === taskId) setActiveTaskId(undefined);
          refresh();
        });
    },
    createColumn(title) {
      requireSupabase()
        .from("board_columns")
        .insert({ project_id: activeProject.id, title, position: state.columns.filter((column) => column.projectId === activeProject.id).length })
        .then(() => refresh());
    },
    renameColumn(columnId, title) {
      requireSupabase().from("board_columns").update({ title }).eq("id", columnId).then(() => refresh());
    },
    deleteColumn(columnId) {
      const fallbackColumn = state.columns.find((column) => column.projectId === activeProject.id && column.id !== columnId);
      const column = state.columns.find((item) => item.id === columnId);
      if (!window.confirm(`Delete "${column?.title ?? "this column"}"? Tasks in it will move to another column.`)) return;
      const client = requireSupabase();
      Promise.resolve()
        .then(async () => {
          if (fallbackColumn) await client.from("tasks").update({ column_id: fallbackColumn.id }).eq("column_id", columnId);
          await client.from("board_columns").delete().eq("id", columnId);
        })
        .then(() => refresh());
    },
    inviteMember(email, role) {
      requireSupabase().from("workspace_invitations").insert({ workspace_id: state.workspace.id, email, role, invited_by: userId }).then(() => refresh());
    },
    updateMemberRole(memberId, role) {
      if (memberId.startsWith("invite-")) {
        requireSupabase().from("workspace_invitations").update({ role }).eq("id", memberId.replace("invite-", "")).then(() => refresh());
        return;
      }
      requireSupabase().from("workspace_members").update({ role }).eq("workspace_id", state.workspace.id).eq("user_id", memberId).then(() => refresh());
    },
    createProject(title) {
      const client = requireSupabase();
      client
        .from("projects")
        .insert({ workspace_id: state.workspace.id, title, description: "", start_date: new Date().toISOString(), due_date: daysFromNow(21), created_by: userId })
        .select("id")
        .single()
        .then(async ({ data }) => {
          if (!data) return;
          await client.from("project_members").insert({ project_id: data.id, user_id: userId });
          await client.from("board_columns").insert(["Backlog", "To Do", "In Progress", "In Review", "Done"].map((title, position) => ({ project_id: data.id, title, position })));
          setActiveProjectId(data.id);
          await refresh();
        });
    },
    updateProject(projectId, patch) {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) payload.title = patch.title;
      if (patch.description !== undefined) payload.description = patch.description;
      if (patch.status !== undefined) payload.status = patch.status;
      if (patch.startDate !== undefined) payload.start_date = patch.startDate;
      if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
      requireSupabase().from("projects").update(payload).eq("id", projectId).then(() => refresh());
    },
    archiveProject(projectId) {
      const project = state.projects.find((item) => item.id === projectId);
      if (!window.confirm(`Archive "${project?.title ?? "this project"}"?`)) return;
      requireSupabase().from("projects").update({ status: "Archived", updated_at: new Date().toISOString() }).eq("id", projectId).then(() => refresh());
    },
    deleteProject(projectId) {
      const project = state.projects.find((item) => item.id === projectId);
      if (state.projects.length <= 1) {
        window.alert("Create another project before deleting the last one.");
        return;
      }
      if (!project || !window.confirm(`Delete "${project.title}" and every task inside it?`)) return;
      requireSupabase()
        .from("projects")
        .delete()
        .eq("id", projectId)
        .then(() => {
          if (activeProjectId === projectId) setActiveProjectId(state.projects.find((item) => item.id !== projectId)?.id);
          setActiveTaskId(undefined);
          refresh();
        });
    },
    updateWorkspaceName(name) {
      requireSupabase().from("workspaces").update({ name, updated_at: new Date().toISOString() }).eq("id", state.workspace.id).then(() => refresh());
    },
    deleteWorkspace() {
      if (!window.confirm("Delete this workspace and everything inside it?")) return;
      requireSupabase()
        .from("workspaces")
        .delete()
        .eq("id", state.workspace.id)
        .then(async () => {
          await supabase?.auth.signOut();
        });
    },
    uploadWorkspaceLogo(file) {
      const client = requireSupabase();
      const path = `${state.workspace.id}/${crypto.randomUUID()}-${file.name}`;
      client.storage
        .from("workspace-logos")
        .upload(path, file, { upsert: true })
        .then(async ({ data, error }) => {
          if (error) throw error;
          const { data: publicUrl } = client.storage.from("workspace-logos").getPublicUrl(data.path);
          await client.from("workspaces").update({ logo_url: publicUrl.publicUrl }).eq("id", state.workspace.id);
          await refresh();
        });
    },
    uploadProfilePicture(file) {
      const client = requireSupabase();
      const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
      client.storage
        .from("profile-avatars")
        .upload(path, file, { upsert: true })
        .then(async ({ data, error }) => {
          if (error) throw error;
          const { data: publicUrl } = client.storage.from("profile-avatars").getPublicUrl(data.path);
          await client.from("profiles").update({ avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() }).eq("id", userId);
          await refresh();
        });
    },
    uploadTaskAttachment(taskId, file) {
      const client = requireSupabase();
      const path = `${taskId}/${crypto.randomUUID()}-${file.name}`;
      client.storage
        .from("task-attachments")
        .upload(path, file, { upsert: true })
        .then(async ({ data, error }) => {
          if (error) throw error;
          await client.from("task_attachments").insert({
            task_id: taskId,
            uploaded_by: userId,
            file_name: file.name,
            file_path: data.path,
            file_type: file.type,
            file_size: file.size,
          });
          await client.from("task_activity").insert({ task_id: taskId, actor_id: userId, action: `uploaded ${file.name}.` });
          await refresh();
        });
    },
    deleteTaskAttachment(attachmentId) {
      const attachment = state.tasks.flatMap((task) => task.attachments).find((item) => item.id === attachmentId);
      if (!attachment || !window.confirm(`Delete "${attachment.name}"?`)) return;
      const client = requireSupabase();
      Promise.resolve()
        .then(async () => {
          if (attachment.path) await client.storage.from("task-attachments").remove([attachment.path]).catch(() => undefined);
          await client.from("task_attachments").delete().eq("id", attachmentId);
          await client.from("task_activity").insert({ task_id: attachment.taskId, actor_id: userId, action: `deleted ${attachment.name}.` });
        })
        .then(() => refresh());
    },
    toggleSubtask(taskId, subtaskId, completed) {
      requireSupabase().from("subtasks").update({ completed }).eq("id", subtaskId).then(() => refresh());
      requireSupabase().from("task_activity").insert({ task_id: taskId, actor_id: userId, action: completed ? "completed a subtask." : "reopened a subtask." });
    },
    addSubtask(taskId, title) {
      requireSupabase()
        .from("subtasks")
        .insert({ task_id: taskId, title, position: state.tasks.find((task) => task.id === taskId)?.subtasks.length ?? 0 })
        .then(async () => {
          await requireSupabase().from("task_activity").insert({ task_id: taskId, actor_id: userId, action: "added a subtask." });
          await refresh();
        });
    },
    markNotificationsRead() {
      requireSupabase().from("notifications").update({ read: true }).eq("user_id", userId).then(() => refresh());
    },
    deleteNotification(notificationId) {
      requireSupabase().from("notifications").delete().eq("id", notificationId).then(() => refresh());
    },
    clearNotifications() {
      if (!window.confirm("Clear all notifications?")) return;
      requireSupabase().from("notifications").delete().eq("user_id", userId).then(() => refresh());
    },
    generateAiTasks(idea) {
      const client = requireSupabase();
      const firstColumn = state.columns.find((column) => column.projectId === activeProject.id)?.id ?? state.columns[0].id;
      const generated = ["Define scope", "Design core flow", "Build primary screens", "Connect data layer", "QA launch checklist"];
      Promise.all(
        generated.map((title, index) =>
          client.from("tasks").insert({
            project_id: activeProject.id,
            column_id: firstColumn,
            title: `${title}: ${idea}`,
            description: `AI-generated task for ${idea}.`,
            assignee_id: userId,
            priority: index === 0 ? "High" : "Medium",
            due_date: daysFromNow(index + 3),
            labels: ["AI"],
            position: index,
            created_by: userId,
          }),
        ),
      ).then(() => refresh());
    },
  };

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}


const cloneInitialState = () => structuredClone(initialState) as AppState;
const demoId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;

export function DemoAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => cloneInitialState());
  const [activeProjectId, setActiveProjectId] = useState<string>(initialState.projects[0]?.id ?? "");
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");

  const activeProject = state.projects.find((project) => project.id === activeProjectId) ?? state.projects[0];
  const activeTask = state.tasks.find((task) => task.id === activeTaskId);
  const store: AppStore = {
    ...state,
    activeProject,
    activeTask,
    activeTaskId,
    setActiveProjectId,
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    setActiveTaskId,
    refresh: async () => undefined,
    moveTask(taskId, columnId, position = 0) {
      let activityMessage = "updated task position.";
      setState((current) => {
        const task = current.tasks.find((item) => item.id === taskId);
        const fromColumn = current.columns.find((column) => column.id === task?.columnId);
        const toColumn = current.columns.find((column) => column.id === columnId);
        if (task && fromColumn && toColumn && fromColumn.id !== toColumn.id) activityMessage = `moved this task from ${fromColumn.title} to ${toColumn.title}.`;
        return {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  columnId,
                  position,
                  activity: [
                    { id: demoId("activity"), taskId, actorId: current.currentUserId, message: activityMessage, createdAt: new Date().toISOString() },
                    ...item.activity,
                  ],
                }
              : item,
          ),
        };
      });
    },
    createTask(columnId, title) {
      const taskId = demoId("task");
      setState((current) => ({
        ...current,
        tasks: [
          ...current.tasks,
          {
            id: taskId,
            projectId: activeProject.id,
            columnId,
            title,
            description: "Created in recruiter demo mode.",
            assigneeId: current.currentUserId,
            priority: "Medium",
            dueDate: daysFromNow(7),
            labels: ["Demo"],
            attachments: [],
            comments: [],
            subtasks: [],
            activity: [{ id: demoId("activity"), taskId, actorId: current.currentUserId, message: "created this task.", createdAt: new Date().toISOString() }],
            position: current.tasks.filter((task) => task.columnId === columnId).length,
          },
        ],
      }));
    },
    updateTask(taskId, patch) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...patch,
                activity: [
                  { id: demoId("activity"), taskId, actorId: current.currentUserId, message: "updated task details.", createdAt: new Date().toISOString() },
                  ...task.activity,
                ],
              }
            : task,
        ),
      }));
    },
    addComment(taskId, body) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                comments: [...task.comments, { id: demoId("comment"), taskId, authorId: current.currentUserId, body, createdAt: new Date().toISOString() }],
                activity: [
                  { id: demoId("activity"), taskId, actorId: current.currentUserId, message: "added a comment.", createdAt: new Date().toISOString() },
                  ...task.activity,
                ],
              }
            : task,
        ),
      }));
    },
    deleteComment(taskId, commentId) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, comments: task.comments.filter((comment) => comment.id !== commentId) } : task)),
      }));
    },
    deleteTask(taskId) {
      if (!window.confirm("Delete this demo task?")) return;
      setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
      if (activeTaskId === taskId) setActiveTaskId(undefined);
    },
    createColumn(title) {
      setState((current) => ({
        ...current,
        columns: [...current.columns, { id: demoId("column"), projectId: activeProject.id, title, position: current.columns.filter((column) => column.projectId === activeProject.id).length }],
      }));
    },
    renameColumn(columnId, title) {
      setState((current) => ({ ...current, columns: current.columns.map((column) => (column.id === columnId ? { ...column, title } : column)) }));
    },
    deleteColumn(columnId) {
      const fallbackColumn = state.columns.find((column) => column.projectId === activeProject.id && column.id !== columnId);
      if (!fallbackColumn) return;
      setState((current) => ({
        ...current,
        columns: current.columns.filter((column) => column.id !== columnId),
        tasks: current.tasks.map((task) => (task.columnId === columnId ? { ...task, columnId: fallbackColumn.id } : task)),
      }));
    },
    inviteMember(email, role) {
      const id = demoId("member");
      setState((current) => ({
        ...current,
        members: [...current.members, { id, name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), email, role, title: "Invited reviewer" }],
      }));
    },
    updateMemberRole(memberId, role) {
      setState((current) => ({ ...current, members: current.members.map((member) => (member.id === memberId ? { ...member, role } : member)) }));
    },
    createProject(title) {
      const projectId = demoId("project");
      const columnTitles = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
      setState((current) => ({
        ...current,
        projects: [
          ...current.projects,
          { id: projectId, workspaceId: current.workspace.id, title, description: "Editable demo project.", startDate: new Date().toISOString(), dueDate: daysFromNow(21), status: "Active", memberIds: [current.currentUserId] },
        ],
        columns: [...current.columns, ...columnTitles.map((columnTitle, position) => ({ id: demoId("column"), projectId, title: columnTitle, position }))],
      }));
      setActiveProjectId(projectId);
    },
    updateProject(projectId, patch) {
      setState((current) => ({ ...current, projects: current.projects.map((project) => (project.id === projectId ? { ...project, ...patch } : project)) }));
    },
    archiveProject(projectId) {
      setState((current) => ({ ...current, projects: current.projects.map((project) => (project.id === projectId ? { ...project, status: "Archived" } : project)) }));
    },
    deleteProject(projectId) {
      if (state.projects.length <= 1) return;
      setState((current) => ({
        ...current,
        projects: current.projects.filter((project) => project.id !== projectId),
        columns: current.columns.filter((column) => column.projectId !== projectId),
        tasks: current.tasks.filter((task) => task.projectId !== projectId),
      }));
      if (activeProjectId === projectId) setActiveProjectId(state.projects.find((project) => project.id !== projectId)?.id ?? "");
    },
    updateWorkspaceName(name) {
      setState((current) => ({ ...current, workspace: { ...current.workspace, name } }));
    },
    deleteWorkspace() {
      if (!window.confirm("Reset the demo workspace?")) return;
      const fresh = cloneInitialState();
      setState(fresh);
      setActiveProjectId(fresh.projects[0]?.id ?? "");
      setActiveTaskId(undefined);
    },
    uploadWorkspaceLogo(file) {
      const logo = URL.createObjectURL(file);
      setState((current) => ({ ...current, workspace: { ...current.workspace, logo } }));
    },
    uploadProfilePicture(file) {
      const avatarUrl = URL.createObjectURL(file);
      setState((current) => ({ ...current, members: current.members.map((member) => (member.id === current.currentUserId ? { ...member, avatarUrl } : member)) }));
    },
    uploadTaskAttachment(taskId, file) {
      const url = URL.createObjectURL(file);
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                attachments: [...task.attachments, { id: demoId("attachment"), taskId, name: file.name, type: file.type || "File", url, size: `${Math.ceil(file.size / 1024)} KB` }],
              }
            : task,
        ),
      }));
    },
    deleteTaskAttachment(attachmentId) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => ({ ...task, attachments: task.attachments.filter((attachment) => attachment.id !== attachmentId) })),
      }));
    },
    toggleSubtask(taskId, subtaskId, completed) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === taskId ? { ...task, subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, completed } : subtask)) } : task,
        ),
      }));
    },
    addSubtask(taskId, title) {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, subtasks: [...task.subtasks, { id: demoId("subtask"), title, completed: false }] } : task)),
      }));
    },
    markNotificationsRead() {
      setState((current) => ({ ...current, notifications: current.notifications.map((notification) => ({ ...notification, read: true })) }));
    },
    deleteNotification(notificationId) {
      setState((current) => ({ ...current, notifications: current.notifications.filter((notification) => notification.id !== notificationId) }));
    },
    clearNotifications() {
      setState((current) => ({ ...current, notifications: [] }));
    },
    generateAiTasks(idea) {
      const firstColumn = state.columns.find((column) => column.projectId === activeProject.id)?.id ?? state.columns[0].id;
      ["Define scope", "Design core flow", "Build primary screens", "Connect data layer", "QA launch checklist"].forEach((title, index) => {
        store.createTask(firstColumn, `${title}: ${idea}`);
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) => (task.title === `${title}: ${idea}` ? { ...task, priority: index === 0 ? "High" : "Medium", labels: ["AI", "Demo"] } : task)),
        }));
      });
    },
  };

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used inside AppProvider");
  return context;
}
