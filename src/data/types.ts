export type Role = "Owner" | "Admin" | "Member" | "Viewer";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type ProjectStatus = "Active" | "Completed" | "Archived";
export type TaskStatus = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  title: string;
};

export type Workspace = {
  id: string;
  name: string;
  logo: string;
  ownerId: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  memberIds: string[];
};

export type Column = {
  id: string;
  projectId: string;
  title: TaskStatus | string;
  position: number;
};

export type Comment = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Attachment = {
  id: string;
  taskId: string;
  name: string;
  type: string;
  url: string;
  path?: string;
  size: string;
};

export type Activity = {
  id: string;
  taskId: string;
  actorId: string;
  message: string;
  createdAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: Priority;
  dueDate: string;
  labels: string[];
  attachments: Attachment[];
  comments: Comment[];
  subtasks: Subtask[];
  activity: Activity[];
  position: number;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: "assignment" | "comment" | "mention" | "deadline" | "project";
};

export type AppState = {
  currentUserId: string;
  workspace: Workspace;
  members: Member[];
  projects: Project[];
  columns: Column[];
  tasks: Task[];
  notifications: Notification[];
};
