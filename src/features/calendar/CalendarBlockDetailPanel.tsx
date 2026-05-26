import { CheckCircle2, Clock3, Link2, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { calculateBlockDurationHours, canApplyBlockHours, getAppliedRealHoursFromBlock } from "../../lib/business-rules";
import { useZenflowStore } from "../../state/zenflow-store";
import type { CalendarBlock } from "../../types/domain";

interface CalendarBlockDetailPanelProps {
  block: CalendarBlock | null;
  onClose: () => void;
  onConfirmHours: () => void;
}

export function CalendarBlockDetailPanel({ block, onClose, onConfirmHours }: CalendarBlockDetailPanelProps) {
  const tasks = useZenflowStore((state) => state.tasks);
  const projects = useZenflowStore((state) => state.projects);
  if (!block) return null;

  const linkedTask = tasks.find((task) => task.id === block.taskId);
  const linkedProject = projects.find((project) => project.id === block.projectId);
  const duration = calculateBlockDurationHours(block);
  const appliesHours = canApplyBlockHours(block);

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md animate-modal-in flex-col border-l border-outline-variant bg-surface-container-lowest shadow-lift">
      <div className="flex items-start justify-between border-b border-outline-variant p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Detalle de bloque</p>
          <h2 className="mt-1 text-xl font-semibold text-on-surface">{block.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar detalle">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{block.status}</Badge>
          <Badge>{block.blockType}</Badge>
          <Badge tone={appliesHours ? "secondary" : "neutral"}>{appliesHours ? "Afecta backlog" : "No afecta backlog"}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoTile icon={<Clock3 className="h-4 w-4" />} label="Duracion" value={`${duration}h`} />
          <InfoTile icon={<CheckCircle2 className="h-4 w-4" />} label="Horas reales" value={`${getAppliedRealHoursFromBlock(block)}h`} />
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <p className="text-sm font-medium text-on-surface">Vinculo</p>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">{linkedTask?.title ?? "Bloque libre"}</p>
              <p className="truncate text-xs text-on-surface-variant">{linkedProject?.name ?? "Sin proyecto vinculado"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <p className="text-sm font-medium text-on-surface">Regla aplicada</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Los bloques completados vinculados a tarea o subtarea aplican horas reales. Los bloques libres no modifican progreso.
          </p>
        </div>
      </div>

      <div className="border-t border-outline-variant p-5">
        <div className="grid grid-cols-2 gap-2">
          <Button className="w-full" onClick={onConfirmHours} disabled={block.status === "cancelled" || block.status === "completed"}>
            Completar
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-3">
      <div className="mb-2 text-on-surface-variant">{icon}</div>
      <p className="text-lg font-semibold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
