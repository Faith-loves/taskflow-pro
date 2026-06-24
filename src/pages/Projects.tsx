import { useState } from "react";
import { Archive, KanbanSquare, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { formatShortDate } from "@/lib/utils";

export function Projects({ setActivePage }: { setActivePage: (page: string) => void }) {
  const { projects, members, createProject, archiveProject, deleteProject, setActiveProjectId } = useAppStore();
  const [title, setTitle] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl tracking-normal">Projects</h1>
          <p className="text-sm text-[#667085]">Create, assign, archive, and track workspace initiatives.</p>
        </div>
        <form
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            createProject(title.trim());
            setTitle("");
          }}
        >
          <TextField className="w-full sm:w-64" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New project title" />
          <Button className="w-full sm:w-auto" type="submit"><Plus className="size-4" />Project</Button>
        </form>
      </div>
      <div className="soft-panel overflow-hidden rounded-lg md:overflow-x-auto">
        <div className="grid gap-3 p-3 md:hidden">
          {projects.map((project) => (
            <article key={project.id} className="rounded-lg border border-[#edf1f5] bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words font-black">{project.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">{project.description}</p>
                </div>
                <Badge tone={project.status === "Active" ? "green" : "gray"}>{project.status}</Badge>
              </div>
              <dl className="grid gap-2 text-sm text-[#667085]">
                <div>
                  <dt className="font-bold text-[#172033]">Timeline</dt>
                  <dd>{formatShortDate(project.startDate)} - {formatShortDate(project.dueDate)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#172033]">Team</dt>
                  <dd>{project.memberIds.map((id) => members.find((member) => member.id === id)?.name.split(" ")[0]).join(", ")}</dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setActivePage("board");
                  }}
                >
                  <KanbanSquare className="size-4" />
                  Open board
                </Button>
                <Button variant="outline" size="sm" onClick={() => archiveProject(project.id)} disabled={project.status === "Archived"}>
                  <Archive className="size-4" />
                  {project.status === "Archived" ? "Archived" : "Archive"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => deleteProject(project.id)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
        <table className="hidden w-full min-w-[760px] border-collapse text-left md:table">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.08em] text-[#667085]">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Timeline</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t border-[#edf1f5]">
                <td className="px-4 py-4">
                  <p className="font-bold">{project.title}</p>
                  <p className="text-sm text-[#667085]">{project.description}</p>
                </td>
                <td className="px-4 py-4"><Badge tone={project.status === "Active" ? "green" : "gray"}>{project.status}</Badge></td>
                <td className="px-4 py-4 text-sm">{formatShortDate(project.startDate)} - {formatShortDate(project.dueDate)}</td>
                <td className="px-4 py-4 text-sm">{project.memberIds.map((id) => members.find((member) => member.id === id)?.name.split(" ")[0]).join(", ")}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveProjectId(project.id);
                        setActivePage("board");
                      }}
                    >
                      <KanbanSquare className="size-4" />
                      Open board
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => archiveProject(project.id)} disabled={project.status === "Archived"}>
                      <Archive className="size-4" />
                      {project.status === "Archived" ? "Archived" : "Archive"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteProject(project.id)}>
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
