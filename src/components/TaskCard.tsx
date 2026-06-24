import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, MessageSquare, Paperclip, Trash2 } from "lucide-react";
import type { Task } from "@/data/types";
import { useAppStore } from "@/lib/app-store";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { formatShortDate } from "@/lib/utils";

const priorityTone = {
  Low: "gray",
  Medium: "blue",
  High: "amber",
  Urgent: "red",
} as const;

export function TaskCard({ task }: { task: Task }) {
  const { members, setActiveTaskId, deleteTask } = useAppStore();
  const assignee = members.find((member) => member.id === task.assigneeId) ?? members[0];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`w-full cursor-pointer rounded-lg border border-[#dfe5ee] bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]/35 hover:shadow-lg ${
        isDragging ? "opacity-60" : ""
      }`}
      onClick={() => setActiveTaskId(task.id)}
      {...attributes}
      {...listeners}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-bold leading-5 text-[#172033]">{task.title}</p>
        <div className="flex items-center gap-1">
          <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-[#8a96a8] hover:bg-[#fee4e2] hover:text-[#b42318]"
            onClick={(event) => {
              event.stopPropagation();
              deleteTask(task.id);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="mb-3 line-clamp-2 text-xs leading-5 text-[#667085]">{task.description}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {task.labels.map((label) => (
          <Badge key={label} tone="default">
            {label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-col gap-2 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar member={assignee} className="size-7" />
          <span className="truncate">{assignee.name.split(" ")[0]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatShortDate(task.dueDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {task.comments.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3.5" />
            {task.attachments.length}
          </span>
        </div>
      </div>
    </article>
  );
}
