import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/lib/app-store";
import { supabase } from "@/lib/supabase";
import { cn, initials } from "@/lib/utils";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "workspace", label: "Workspace", icon: CheckSquare },
  { id: "projects", label: "Projects", icon: CheckSquare },
  { id: "board", label: "Kanban Board", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team Members", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AppShell({
  activePage,
  setActivePage,
  children,
}: {
  activePage: string;
  setActivePage: (page: string) => void;
  children: React.ReactNode;
}) {
  const { workspace, members, currentUserId, notifications, search, setSearch } = useAppStore();
  const currentUser = members.find((member) => member.id === currentUserId)!;
  const unread = notifications.filter((notification) => !notification.read).length;

  async function logout() {
    if (supabase) await supabase.auth.signOut();
  }

  return (
    <div className="app-surface min-h-screen text-[#172033]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dfe5ee] bg-white/92 shadow-[8px_0_34px_rgba(23,32,51,0.04)] backdrop-blur lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-[#e5ebf2] px-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#0f766e] text-sm font-black text-white">
            {workspace.logo.startsWith("http") ? <img src={workspace.logo} alt="" className="size-full rounded-lg object-cover" /> : workspace.logo}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{workspace.name}</p>
            <p className="text-xs text-[#667085]">Project Management SaaS</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#596579] transition hover:bg-[#f1f5f8]",
                  activePage === item.id && "bg-[#e8f7f4] text-[#0f766e]",
                )}
                onClick={() => setActivePage(item.id)}
              >
                <Icon className="size-4" />
                {item.label}
                {item.id === "notifications" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-[#b42318] px-1.5 text-[10px] text-white">{unread}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#e5ebf2] p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar member={currentUser} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{currentUser.name}</p>
              <p className="truncate text-xs text-[#667085]">{currentUser.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#dfe5ee] bg-white/82 px-4 shadow-sm backdrop-blur-xl lg:px-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#0f766e] text-sm font-black text-white lg:hidden">
            {workspace.logo.startsWith("http") ? <img src={workspace.logo} alt="" className="size-full rounded-lg object-cover" /> : initials(workspace.name)}
          </div>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a96a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, assignees, labels, projects..."
              className="h-10 w-full rounded-md border border-[#d7dee8] bg-[#f8fafc] pl-9 pr-3 text-sm outline-none focus:border-[#0f766e] focus:bg-white focus:ring-2 focus:ring-[#0f766e]/15"
            />
          </div>
          <Button variant="outline" size="icon" className="relative" onClick={() => setActivePage("notifications")}>
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-[#b42318] px-1.5 text-[10px] text-white">{unread}</span>
            ) : null}
          </Button>
          <Avatar member={currentUser} />
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
