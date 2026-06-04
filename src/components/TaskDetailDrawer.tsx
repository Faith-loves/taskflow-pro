import { CalendarDays, Paperclip, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { TextArea, TextField } from "./ui/TextField";
import { formatShortDate } from "@/lib/utils";

function renderMentionText(body: string) {
  return body.split(/(@\w+)/g).map((part, index) =>
    part.startsWith("@") ? (
      <span className="mention" key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function TaskDetailDrawer() {
  const {
    activeTask,
    setActiveTaskId,
    members,
    addComment,
    deleteComment,
    deleteTask,
    updateTask,
    uploadTaskAttachment,
    deleteTaskAttachment,
    toggleSubtask,
    addSubtask,
  } = useAppStore();
  const [comment, setComment] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  if (!activeTask) return null;
  const completedSubtasks = activeTask.subtasks.filter((subtask) => subtask.completed).length;

  function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    addComment(activeTask!.id, comment.trim());
    setComment("");
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-[#dfe5ee] bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-[#e5ebf2] px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Task detail</p>
          <h2 className="text-lg font-black text-[#172033]">{activeTask.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" size="icon" onClick={() => deleteTask(activeTask.id)} aria-label={`Delete ${activeTask.title}`}>
            <Trash2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTaskId(undefined)}>
            <X className="size-4" />
          </Button>
        </div>
      </header>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
            Assignee
            <select
              value={activeTask.assigneeId}
              onChange={(event) => updateTask(activeTask.id, { assigneeId: event.target.value })}
              className="h-10 rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#172033]"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
            Priority
            <select
              value={activeTask.priority}
              onChange={(event) => updateTask(activeTask.id, { priority: event.target.value as typeof activeTask.priority })}
              className="h-10 rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#172033]"
            >
              {["Low", "Medium", "High", "Urgent"].map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>

        <section className="mb-6 rounded-lg border border-[#dfe5ee] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black">Description</h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#667085]">
              <CalendarDays className="size-3.5" />
              Due {formatShortDate(activeTask.dueDate)}
            </span>
          </div>
          <TextArea value={activeTask.description} onChange={(event) => updateTask(activeTask.id, { description: event.target.value })} />
          <div className="mt-3 flex flex-wrap gap-2">
            {activeTask.labels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-[#dfe5ee] p-4">
          <h3 className="mb-3 text-sm font-black">Subtasks {completedSubtasks}/{activeTask.subtasks.length}</h3>
          <div className="flex flex-col gap-2">
            {activeTask.subtasks.map((subtask) => (
              <label key={subtask.id} className="flex items-center gap-2 rounded-md border border-[#edf1f5] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => toggleSubtask(activeTask.id, subtask.id, !subtask.completed)}
                />
                <span className={subtask.completed ? "text-[#667085] line-through" : ""}>{subtask.title}</span>
              </label>
            ))}
            {activeTask.subtasks.length === 0 ? <p className="text-sm text-[#667085]">No subtasks yet.</p> : null}
            <form
              className="flex gap-2 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!subtaskTitle.trim()) return;
                addSubtask(activeTask.id, subtaskTitle.trim());
                setSubtaskTitle("");
              }}
            >
              <TextField value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} placeholder="Add subtask" />
              <Button type="submit">Add</Button>
            </form>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-[#dfe5ee] p-4">
          <h3 className="mb-3 text-sm font-black">Attachments</h3>
          <div className="flex flex-col gap-2">
            {activeTask.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border border-[#edf1f5] px-3 py-2 text-sm">
                <a href={attachment.url} className="inline-flex min-w-0 items-center gap-2 font-semibold hover:text-[#0f766e]">
                  <Paperclip className="size-4 shrink-0 text-[#0f766e]" />
                  <span className="truncate">{attachment.name}</span>
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#667085]">{attachment.size}</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteTaskAttachment(attachment.id)} aria-label={`Delete ${attachment.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <TextField type="file" onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              uploadTaskAttachment(activeTask.id, file);
            }} />
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-[#dfe5ee] p-4">
          <h3 className="mb-3 text-sm font-black">Comments</h3>
          <form className="mb-4 flex gap-2" onSubmit={submitComment}>
            <TextField value={comment} onChange={(event) => setComment(event.target.value)} placeholder="@Sarah please check the landing page copy." />
            <Button size="icon" type="submit">
              <Send className="size-4" />
            </Button>
          </form>
          <div className="flex flex-col gap-3">
            {activeTask.comments.map((item) => {
              const author = members.find((member) => member.id === item.authorId) ?? members[0];
              return (
                <article key={item.id} className="rounded-lg bg-[#f8fafc] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar member={author} className="size-7" />
                      <div>
                        <p className="text-sm font-bold">{author.name}</p>
                        <p className="text-xs text-[#667085]">{formatShortDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteComment(activeTask.id, item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <p className="text-sm leading-6 text-[#3e495c]">{renderMentionText(item.body)}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-[#dfe5ee] p-4">
          <h3 className="mb-3 text-sm font-black">Activity log</h3>
          <div className="flex flex-col gap-3">
            {activeTask.activity.map((item) => {
              const actor = members.find((member) => member.id === item.actorId) ?? members[0];
              return (
                <div key={item.id} className="flex gap-3 text-sm">
                  <Avatar member={actor} className="size-7" />
                  <p className="leading-6 text-[#4e5c72]">
                    <strong className="text-[#172033]">{actor.name}</strong> {item.message}
                    <span className="ml-2 text-xs text-[#8a96a8]">{formatShortDate(item.createdAt)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
