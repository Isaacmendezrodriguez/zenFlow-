import { AlertCircle, CalendarDays, Clock3, Flame, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { createDailySummary } from "../../lib/business-rules";
import { useZenflowStore } from "../../state/zenflow-store";

export function DaySummaryPanel() {
  const tasks = useZenflowStore((state) => state.tasks);
  const calendarBlocks = useZenflowStore((state) => state.calendarBlocks);
  const summary = createDailySummary(tasks, calendarBlocks, new Date());
  const activeBlock = calendarBlocks.find((block) => block.status === "in_progress");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Hoy</p>
        <h2 className="mt-1 text-xl font-semibold text-on-surface">Plan semanal</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Bloques, foco y pendientes conectados al backlog.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SummaryMetric icon={<CalendarDays className="h-4 w-4" />} label="Bloques" value={summary.scheduledBlocksToday} />
        <SummaryMetric icon={<Clock3 className="h-4 w-4" />} label="Horas" value={`${summary.plannedHoursToday}h`} />
        <SummaryMetric icon={<Flame className="h-4 w-4" />} label="Urgentes" value={summary.urgentTasks} />
        <SummaryMetric icon={<ListChecks className="h-4 w-4" />} label="Manana" value={summary.tasksDueTomorrow} />
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-on-surface">Carga planeada</span>
          <Badge tone="secondary">62%</Badge>
        </div>
        <ProgressBar value={62} />
        <p className="mt-3 text-xs leading-5 text-on-surface-variant">La carga se calcula con los bloques programados para hoy.</p>
      </div>

      {activeBlock ? (
        <div className="rounded-lg border border-primary/30 bg-primary-container p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-primary-container">Alerta de horas</p>
              <p className="mt-1 break-words text-xs leading-5 text-on-primary-container/80">
                {activeBlock.title} esta activo. Cuando el timer se acerque al tiempo asignado, confirma horas o ajusta el bloque.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <div className="mb-2 text-on-surface-variant">{icon}</div>
      <p className="text-lg font-semibold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
