import { BellRing, CheckCheck, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatShortDate } from "@/lib/utils";

export function Notifications() {
  const { notifications, markNotificationsRead, deleteNotification, clearNotifications } = useAppStore();
  const unread = notifications.filter((notification) => !notification.read).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Notifications</h1>
          <p className="text-sm text-[#667085]">Assignments, comments, mentions, due dates, and project changes.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" onClick={markNotificationsRead} disabled={unread === 0}><CheckCheck className="size-4" />Mark read</Button>
          <Button variant="danger" onClick={clearNotifications} disabled={notifications.length === 0}><Trash2 className="size-4" />Clear all</Button>
        </div>
      </div>
      <section className="rounded-lg border border-[#dfe5ee] bg-white">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#e8f7f4] text-[#0f766e]"><BellRing className="size-6" /></div>
            <h2 className="font-black">No notifications</h2>
            <p className="max-w-sm text-sm text-[#667085]">Assignments, mentions, comments, due dates, and project updates will appear here.</p>
          </div>
        ) : null}
        {notifications.map((notification) => (
          <article key={notification.id} className="flex gap-3 border-b border-[#edf1f5] p-3 last:border-b-0 sm:p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f4] text-[#0f766e]"><BellRing className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black">{notification.title}</h2>
                {!notification.read ? <Badge tone="red">New</Badge> : null}
              </div>
              <p className="break-words text-sm text-[#667085]">{notification.body}</p>
              <p className="mt-1 text-xs text-[#8a96a8]">{formatShortDate(notification.createdAt)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteNotification(notification.id)} aria-label={`Delete ${notification.title}`}>
              <Trash2 className="size-4" />
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
