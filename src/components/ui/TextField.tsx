import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-md border border-[#d7dee8] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#8a96a8] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15",
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full resize-none rounded-md border border-[#d7dee8] bg-white px-3 py-2 text-sm text-[#172033] outline-none transition placeholder:text-[#8a96a8] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15",
        props.className,
      )}
    />
  );
}
