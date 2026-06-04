import { initials } from "@/lib/utils";
import type { Member } from "@/data/types";

export function Avatar({ member, className = "size-8" }: { member: Member; className?: string }) {
  return (
    <span className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-[#dcebe8] text-xs font-bold text-[#0f766e]`}>
      {member.avatarUrl ? <img className="size-full rounded-full object-cover" src={member.avatarUrl} alt="" /> : initials(member.name)}
    </span>
  );
}
