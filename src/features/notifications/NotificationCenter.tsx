import { Clock3, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { calendarBlocks, notifications } from "../../mocks/mock-data";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  if (!isOpen) return null;

  const activeBlock = calendarBlocks.find((block) => block.status === "in_progress");

  return (
    <aside className="fixed inset-x-3 top-20 z-50 max-h-[calc(100vh-6rem)] animate-modal-in overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-lift sm:left-auto sm:right-6 sm:w-96">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Notificaciones</h2>
          <p className="text-sm text-on-surface-variant">Recordatorios internos de ZenFlow</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar notificaciones">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-2">
        {activeBlock ? (
          <div className="rounded-lg border border-primary/30 bg-primary-container p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-on-primary-container">Estas por cumplir el bloque asignado</p>
                <p className="mt-1 text-sm text-on-primary-container/80">
                  {activeBlock.title}: revisa si debes confirmar horas reales, extender el bloque o tomar descanso.
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-lg border border-outline-variant bg-surface p-3 transition hover:bg-surface-container-low">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2 w-2 rounded-full ${notification.isRead ? "bg-outline-variant" : "bg-error"}`} />
              <div>
                <p className="text-sm font-semibold text-on-surface">{notification.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
