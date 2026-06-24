import { useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";

export function Workspace() {
  const { workspace, projects, members, updateWorkspaceName } = useAppStore();
  const [name, setName] = useState(workspace.name);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl tracking-normal">Workspace</h1>
        <p className="text-sm text-[#667085]">Manage workspace identity, projects, and members.</p>
      </div>
      <section className="soft-panel rounded-lg p-5">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-lg bg-[#0f766e] text-xl font-black text-white">
            {workspace.logo.startsWith("http") ? <img src={workspace.logo} alt="" className="size-full rounded-lg object-cover" /> : workspace.logo}
          </div>
          <div>
            <h2 className="text-xl font-black">{workspace.name}</h2>
            <p className="text-sm text-[#667085]">{members.length} members · {projects.length} projects</p>
          </div>
        </div>
        <div className="flex max-w-xl flex-col gap-2 sm:flex-row">
          <TextField value={name} onChange={(event) => setName(event.target.value)} />
          <Button className="w-full sm:w-auto" onClick={() => updateWorkspaceName(name)}>Save</Button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="soft-panel rounded-lg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black">{project.title}</h3>
              <Badge tone={project.status === "Active" ? "green" : project.status === "Completed" ? "blue" : "gray"}>{project.status}</Badge>
            </div>
            <p className="text-sm leading-6 text-[#667085]">{project.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
