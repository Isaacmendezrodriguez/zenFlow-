import { useLocation } from "react-router-dom";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { BLOCK_STATUSES, STATUS_LABELS, TASK_STATUSES } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useZenflowStore } from "../../state/zenflow-store";
import type { CalendarBlockStatus, TaskStatus } from "../../types/domain";

const blockStatusLabels: Record<CalendarBlockStatus, string> = {
  scheduled: "Programado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

interface GlobalFiltersProps {
  isOpen: boolean;
  isCompact?: boolean;
}

export function GlobalFilters({ isOpen, isCompact = false }: GlobalFiltersProps) {
  const location = useLocation();
  const organizations = useZenflowStore((state) => state.organizations);
  const projects = useZenflowStore((state) => state.projects);
  const filters = useZenflowStore((state) => state.filters);
  const updateFilters = useZenflowStore((state) => state.updateFilters);
  const resetFilters = useZenflowStore((state) => state.resetFilters);
  const scopedProjects = projects.filter((project) => filters.organizationId === "all" || project.organizationId === filters.organizationId);
  const isCalendar = location.pathname.startsWith("/todo-weekly");
  const showOrganization = !location.pathname.startsWith("/trash") && !location.pathname.startsWith("/settings");
  const showProject = !location.pathname.startsWith("/organizations") && !location.pathname.startsWith("/trash") && !location.pathname.startsWith("/settings");
  const showStatus = location.pathname.startsWith("/dashboard")
    || location.pathname.startsWith("/backlog")
    || location.pathname.startsWith("/todo-weekly")
    || location.pathname.startsWith("/archive")
    || location.pathname.startsWith("/tasks");
  const statusOptions = isCalendar ? BLOCK_STATUSES : TASK_STATUSES;
  const statusValue = filters.status === "all" || (statusOptions as readonly string[]).includes(filters.status) ? filters.status : "all";

  if (!isOpen) return null;

  return (
    <div className={cn("fixed right-0 top-16 z-20 border-b border-outline-variant bg-surface-container-lowest/95 px-4 py-3 shadow-sm backdrop-blur transition-[left] md:px-8", isCompact ? "left-0 md:left-16" : "left-0 md:left-64")}>
      <div className="mx-auto grid max-w-[1600px] gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        {showOrganization ? (
          <Select value={filters.organizationId} onChange={(event) => updateFilters({ organizationId: event.target.value })}>
            <option value="all">Todas las organizaciones</option>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </Select>
        ) : null}
        {showProject ? (
          <Select value={filters.projectId} onChange={(event) => updateFilters({ projectId: event.target.value })}>
            <option value="all">Todos los proyectos</option>
            {scopedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
        ) : null}
        {showStatus ? (
          <Select value={statusValue} onChange={(event) => updateFilters({ status: event.target.value as TaskStatus | CalendarBlockStatus | "all" })}>
            <option value="all">Todos los estados</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{isCalendar ? blockStatusLabels[status as CalendarBlockStatus] : STATUS_LABELS[status as TaskStatus]}</option>
            ))}
          </Select>
        ) : null}
        <Button variant="outline" onClick={resetFilters}>Limpiar filtros</Button>
      </div>
    </div>
  );
}
