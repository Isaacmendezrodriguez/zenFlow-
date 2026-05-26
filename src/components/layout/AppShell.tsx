import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AddTaskModal } from "../../features/tasks/AddTaskModal";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";
import { TimerWidget } from "../../features/timer/TimerWidget";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "../../lib/utils";

export function AppShell() {
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isCompact, setCompact] = useState(() => localStorage.getItem("zenflow-shell-compact") === "true");

  function toggleCompact() {
    setCompact((current) => {
      localStorage.setItem("zenflow-shell-compact", String(!current));
      return !current;
    });
  }

  return (
    <div className={cn("min-h-screen bg-background text-on-background", isCompact && "zenflow-compact")}>
      <Sidebar onAddTask={() => setAddTaskOpen(true)} isCompact={isCompact} onToggleCompact={toggleCompact} />
      <div className={cn("min-h-screen transition-[padding]", isCompact ? "md:pl-16" : "md:pl-64")}>
        <Topbar
          isCompact={isCompact}
          onAddTask={() => setAddTaskOpen(true)}
          onOpenNotifications={() => setNotificationsOpen((open) => !open)}
        />
        <main className={cn("mx-auto w-full pb-10 pt-24 transition-all", isCompact ? "max-w-none px-3 md:px-5" : "max-w-[1600px] px-4 md:px-10")}>
          <div className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
      <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <TimerWidget />
      <AddTaskModal isOpen={isAddTaskOpen} onClose={() => setAddTaskOpen(false)} />
    </div>
  );
}
