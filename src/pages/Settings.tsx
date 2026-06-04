import { useState } from "react";
import { Upload } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function Settings() {
  const { workspace, updateWorkspaceName, deleteWorkspace, uploadWorkspaceLogo, uploadProfilePicture } = useAppStore();
  const [name, setName] = useState(workspace.name);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-normal">Settings</h1>
        <p className="text-sm text-[#667085]">Profile, workspace, storage, security, and admin controls.</p>
      </div>
      <section className="soft-panel rounded-lg p-5">
        <h2 className="mb-4 text-lg font-black">Workspace settings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-bold">
            Workspace name
            <TextField value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold">
            Logo/avatar
            <TextField
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) uploadWorkspaceLogo(file);
              }}
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => updateWorkspaceName(name)}>Save changes</Button>
          <Button variant="danger" onClick={deleteWorkspace}>Delete workspace</Button>
        </div>
      </section>
      <section className="soft-panel rounded-lg p-5">
        <h2 className="mb-3 text-lg font-black">Profile and auth</h2>
        <p className="mb-4 text-sm leading-6 text-[#667085]">
          Supabase mode supports real email/password auth, reset emails, email verification, profile updates, and avatar uploads through Storage. Current status: configured.
        </p>
        <label className="inline-flex">
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) uploadProfilePicture(file);
            }}
          />
          <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#d7dee8] bg-white px-4 text-sm font-semibold text-[#172033] transition hover:bg-[#f6f8fb]">
            <Upload className="size-4" />
            Upload profile picture
          </span>
        </label>
      </section>
    </div>
  );
}
