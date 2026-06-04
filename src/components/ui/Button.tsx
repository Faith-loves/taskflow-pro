import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "icon";
};

const variants = {
  primary: "bg-[#0f766e] text-white border-[#0f766e] hover:bg-[#115e59]",
  secondary: "bg-[#172033] text-white border-[#172033] hover:bg-[#28344d]",
  ghost: "border-transparent bg-transparent text-[#4e5c72] hover:bg-[#eef3f7]",
  danger: "bg-[#b42318] text-white border-[#b42318] hover:bg-[#912018]",
  outline: "bg-white text-[#172033] border-[#d7dee8] hover:bg-[#f6f8fb]",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "size-9 p-0",
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
