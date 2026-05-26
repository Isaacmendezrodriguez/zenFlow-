import { Archive, Building2, CalendarDays, Gauge, Inbox, LayoutDashboard, PanelRightClose, PanelRightOpen, Plus, Settings, Trash2, Workflow } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface SidebarProps {
  onAddTask: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/backlog", label: "Backlog", icon: Inbox },
  { to: "/todo-weekly", label: "To-do semanal", icon: CalendarDays },
  { to: "/organizations", label: "Organizaciones", icon: Building2 },
  { to: "/projects", label: "Proyectos", icon: Workflow },
  { to: "/archive", label: "Archivo", icon: Archive },
  { to: "/trash", label: "Papelera", icon: Trash2 },
  { to: "/settings", label: "Configuracion", icon: Settings },
];

export function Sidebar({ onAddTask, isCompact, onToggleCompact }: SidebarProps) {
  if (isCompact) {
    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col items-center border-r border-outline-variant bg-surface-container-lowest px-2 py-4 md:flex">
        <button
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm transition hover:opacity-90"
          onClick={onToggleCompact}
          aria-label="Mostrar sidebar de ZenFlow"
          title="Mostrar sidebar"
        >
          <Gauge className="h-5 w-5" />
        </button>

        <button
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
          onClick={onAddTask}
          aria-label="Agregar tarea"
          title="Agregar tarea"
        >
          <Plus className="h-4 w-4" />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const separator = index === 3 || index === 5;

            return (
              <div key={item.to} className="w-full">
                {separator ? <div className="mx-auto my-2 h-px w-8 bg-outline-variant/60" /> : null}
                <NavLink
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-container text-on-primary-container"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                </NavLink>
              </div>
            );
          })}
        </nav>

        <button
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
          onClick={onToggleCompact}
          aria-label="Expandir sidebar"
          title="Expandir sidebar"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface-container-lowest p-4 md:flex">
      <div className="mb-6 flex items-center justify-between gap-3 px-2 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Gauge className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-on-surface">ZenFlow</h1>
            <p className="truncate text-xs font-medium uppercase tracking-wide text-on-surface-variant">Productivity Suite</p>
          </div>
        </div>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
          onClick={onToggleCompact}
          aria-label={isCompact ? "Vista completa" : "Vista compacta"}
          title={isCompact ? "Vista completa" : "Vista compacta"}
        >
          {isCompact ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </button>
      </div>

      <Button className="mb-6 w-full" icon={<Plus className="h-4 w-4" />} onClick={onAddTask}>
        Agregar tarea
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const separator = index === 3 || index === 5;

          return (
            <div key={item.to}>
              {separator ? <div className="my-2 h-px bg-outline-variant/60" /> : null}
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "scale-[0.98] bg-primary-container text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
