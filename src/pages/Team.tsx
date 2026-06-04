import { useState } from "react";
import { MailPlus } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { Role } from "@/data/types";

export function Team() {
  const { members, inviteMember, updateMemberRole } = useAppStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Member");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-normal">Team Members</h1>
        <p className="text-sm text-[#667085]">Invite teammates and control workspace permissions.</p>
      </div>
      <form
        className="soft-panel flex flex-wrap gap-2 rounded-lg p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.trim()) return;
          inviteMember(email.trim(), role);
          setEmail("");
        }}
      >
        <TextField className="max-w-md" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" />
        <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="h-10 rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold">
          {["Owner", "Admin", "Member", "Viewer"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <Button type="submit"><MailPlus className="size-4" />Invite</Button>
      </form>
      <section className="soft-panel rounded-lg">
        {members.map((member) => (
          <article key={member.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1f5] p-4 last:border-b-0">
            <div className="flex items-center gap-3">
              <Avatar member={member} className="size-10" />
              <div>
                <p className="font-black">{member.name}</p>
                <p className="text-sm text-[#667085]">{member.email} · {member.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={member.role === "Owner" ? "green" : "default"}>{member.role}</Badge>
              <select value={member.role} onChange={(event) => updateMemberRole(member.id, event.target.value as Role)} className="h-9 rounded-md border border-[#d7dee8] bg-white px-3 text-sm font-semibold">
                {["Owner", "Admin", "Member", "Viewer"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
