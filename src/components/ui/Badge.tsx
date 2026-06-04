import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "green" | "amber" | "red" | "blue" | "gray";
};

const tones = {
  default: "bg-[#eef3f7] text-[#4e5c72] border-[#d7dee8]",
  green: "bg-[#e8f7f4] text-[#06766e] border-[#b7e3dc]",
  amber: "bg-[#fff6df] text-[#9a6500] border-[#f1d28b]",
  red: "bg-[#fff0ed] text-[#b42318] border-[#f2beb6]",
  blue: "bg-[#edf4ff] text-[#1d4ed8] border-[#c7d8fe]",
  gray: "bg-[#f4f6f8] text-[#5f6b7a] border-[#d9e0e8]",
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
