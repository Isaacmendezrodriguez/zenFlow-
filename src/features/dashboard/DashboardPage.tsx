import { BarChart3, CalendarCheck, Clock, FolderKanban, Target } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { TASK_STATUSES } from "../../lib/constants";
import { useZenflowStore } from "../../state/zenflow-store";
import { calculateHourDifference } from "../../lib/calculations";
import type { ActivityLog, CalendarBlock, Task } from "../../types/domain";

const chartDays = [
  ["Mon", 42],
  ["Tue", 68],
  ["Wed", 90],
  ["Thu", 54],
  ["Fri", 76],
];

export function DashboardPage() {
  const projects = useZenflowStore((state) => state.projects);
  const tasks = useZenflowStore((state) => state.tasks);
  const calendarBlocks = useZenflowStore((state) => state.calendarBlocks);
  const activityLogs = useZenflowStore((state) => state.activityLogs);
  const filters = useZenflowStore((state) => state.filters);
  const searchQuery = filters.searchQuery.trim().toLowerCase();
  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filters.organizationId !== "all" && task.organizationId !== filters.organizationId) return false;
    if (filters.projectId !== "all" && task.projectId !== filters.projectId) return false;
    if (filters.status !== "all" && (TASK_STATUSES as readonly string[]).includes(filters.status) && task.status !== filters.status) return false;
    if (searchQuery && !`${task.title} ${task.description}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  }), [filters, searchQuery, tasks]);
  const filteredCalendarBlocks = useMemo(() => calendarBlocks.filter((block) => {
    if (filters.organizationId !== "all" && block.organizationId !== filters.organizationId) return false;
    if (filters.projectId !== "all" && block.projectId !== filters.projectId) return false;
    return true;
  }), [calendarBlocks, filters]);
  const visibleProjects = useMemo(() => projects.filter((project) => {
    if (filters.organizationId !== "all" && project.organizationId !== filters.organizationId) return false;
    if (filters.projectId !== "all" && project.id !== filters.projectId) return false;
    if (searchQuery && !`${project.name} ${project.description ?? ""} ${project.tags.join(" ")}`.toLowerCase().includes(searchQuery)) return false;
    return true;
  }), [filters, projects, searchQuery]);
  const metrics = useMemo(() => calculateDashboardMetrics(filteredTasks, filteredCalendarBlocks, activityLogs), [filteredTasks, filteredCalendarBlocks, activityLogs]);

  const metricCards = [
    { label: "Proyectos trabajados", value: metrics.projectsWorked, detail: "con horas reales", tone: "secondary" as const },
    { label: "Horas reales / estimadas", value: `${metrics.realHours} / ${metrics.estimatedHours}h`, detail: "desde store", tone: "primary" as const },
    { label: "Terminadas en tiempo", value: metrics.completedOnTime, detail: "cards", tone: "secondary" as const },
    { label: "Terminadas tarde", value: metrics.completedLate, detail: "cards", tone: "tertiary" as const },
    { label: "Vencidas", value: metrics.overdueTasks, detail: "requieren accion", tone: "error" as const },
    { label: "Sobreconsumo", value: `${metrics.overconsumption}h`, detail: "horas extra", tone: "error" as const },
    { label: "Horas ahorradas", value: `${metrics.savedHours}h`, detail: "vs estimado", tone: "secondary" as const },
    { label: "Bloques completados", value: metrics.calendarBlocksCompleted, detail: `${metrics.backlogLinkedHoursCompleted}h backlog`, tone: "primary" as const },
    { label: "Horas libres/personales", value: `${metrics.freePersonalHoursCompleted}h`, detail: "no afectan backlog", tone: "neutral" as const },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-container px-5 py-4 text-on-primary-container">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-5 w-5" />
          <p className="text-sm font-medium">
            Resumen vivo: {metrics.calendarBlocksCompleted} bloques completados, {metrics.activitiesCompletedThisWeek} eventos esta semana.
          </p>
        </div>
      </div>

      <header>
        <h1 className="text-4xl font-bold text-on-background">Overview</h1>
        <p className="mt-2 text-lg text-on-surface-variant">Metricas calculadas desde el estado mock compartido.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                {metric.tone === "primary" ? <Clock className="h-5 w-5" /> : <Target className="h-5 w-5" />}
              </div>
              <Badge tone={metric.tone}>{metric.detail}</Badge>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{metric.label}</p>
            <h2 className="mt-1 text-3xl font-bold">{metric.value}</h2>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Weekly Productivity</h2>
            <BarChart3 className="h-5 w-5 text-on-surface-variant" />
          </div>
          <div className="flex h-48 items-end gap-3">
            {chartDays.map(([day, height]) => (
              <div key={day} className="group flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t bg-primary-container transition-colors group-hover:bg-primary" style={{ height: `${height}%` }} />
                <span className="text-xs font-semibold text-on-surface-variant">{day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Horas por proyecto</h2>
            <FolderKanban className="h-5 w-5 text-on-surface-variant" />
          </div>
          <div className="space-y-4">
            {visibleProjects.slice(0, 4).map((project) => {
              const projectTasks = filteredTasks.filter((task) => task.projectId === project.id && !task.deletedAt);
              const hours = projectTasks.reduce((total, task) => total + task.realHours, 0);
              return (
                <div key={project.id} className="rounded-lg p-2 transition hover:bg-surface-container-low">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-1.5 rounded-full" style={{ background: project.color }} />
                      <div>
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-sm text-on-surface-variant">{project.tags.join(", ")}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold">{hours}h</span>
                  </div>
                  <ProgressBar value={Math.min(hours * 12, 100)} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}

function calculateDashboardMetrics(tasks: Task[], calendarBlocks: CalendarBlock[], activityLogs: ActivityLog[]) {
  const activeTasks = tasks.filter((task) => !task.deletedAt && !task.isArchived);
  const completedTasks = activeTasks.filter((task) => task.status === "done");
  const completedBlocks = calendarBlocks.filter((block) => block.status === "completed" && !block.deletedAt);
  const linkedBlocks = completedBlocks.filter((block) => block.taskId || block.subtaskId);
  const freeBlocks = completedBlocks.filter((block) => !block.taskId && !block.subtaskId);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  return {
    projectsWorked: new Set(activeTasks.filter((task) => task.realHours > 0).map((task) => task.projectId).filter(Boolean)).size,
    estimatedHours: activeTasks.reduce((total, task) => total + task.estimatedHours, 0),
    realHours: activeTasks.reduce((total, task) => total + task.realHours, 0),
    completedOnTime: completedTasks.filter((task) => task.completedAt && task.dueDate && new Date(task.completedAt) <= new Date(`${task.dueDate}T23:59:59`)).length,
    completedLate: completedTasks.filter((task) => task.completedAt && task.dueDate && new Date(task.completedAt) > new Date(`${task.dueDate}T23:59:59`)).length,
    overdueTasks: activeTasks.filter((task) => task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date()).length,
    overconsumption: activeTasks.reduce((total, task) => total + Math.max(calculateHourDifference(task.estimatedHours, task.realHours), 0), 0),
    savedHours: activeTasks.reduce((total, task) => total + Math.max(calculateHourDifference(task.estimatedHours, task.realHours) * -1, 0), 0),
    activitiesCompletedThisWeek: activityLogs.filter((log) => new Date(log.createdAt) >= weekStart).length,
    calendarBlocksCompleted: completedBlocks.length,
    backlogLinkedHoursCompleted: linkedBlocks.reduce((total, block) => total + block.realHoursApplied, 0),
    freePersonalHoursCompleted: freeBlocks.reduce((total, block) => total + block.durationHours, 0),
  };
}
