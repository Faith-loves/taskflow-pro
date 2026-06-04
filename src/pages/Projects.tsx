import { useState } from "react";
import { Archive, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { formatShortDate } from "@/lib/utils";

export function Projects() {
  const { projects, members, createProject, archiveProject, deleteProject } = useAppStore();
  const [title, setTitle] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-normal">Projects</h1>
          <p className="text-sm text-[#667085]">Create, assign, archive, and track workspace initiatives.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            createProject(title.trim());
            setTitle("");
          }}
        >
          <TextField value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New project title" />
          <Button type="submit"><Plus className="size-4" />Project</Button>
        </form>
      </div>
      <div className="soft-panel overflow-hidden rounded-lg">
        <table className="w-full min-w-[760px] border-collapse text-left">
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
