import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { getHourStatusLabel } from "../../lib/calculations";
import type { CalendarBlock } from "../../types/domain";
import { useEffect, useState } from "react";

interface ConfirmHoursModalProps {
  block: CalendarBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (realHours: number) => void;
}

export function ConfirmHoursModal({ block, isOpen, onClose, onConfirm }: ConfirmHoursModalProps) {
  const estimatedHours = block?.durationHours ?? 0;
  const [realHours, setRealHours] = useState(estimatedHours);
  const statusLabel = getHourStatusLabel(estimatedHours, realHours);

  useEffect(() => {
    setRealHours(block?.realHoursApplied || block?.durationHours || 0);
  }, [block]);

  return (
    <Modal
      isOpen={isOpen}
      title="Confirmar horas reales"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(realHours)}>Aplicar horas</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Esta confirmacion sigue la regla de bloques completados: solo los bloques vinculados aplican horas reales.
        </p>
        <label className="block text-sm font-medium text-on-surface">
          Horas reales trabajadas
          <Input className="mt-2" type="number" min={0} step={0.25} value={realHours} onChange={(event) => setRealHours(Number(event.target.value))} />
        </label>
        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <p className="text-sm text-on-surface-variant">Estado de consumo</p>
          <p className="mt-1 text-lg font-semibold text-on-surface">{statusLabel}</p>
        </div>
      </div>
    </Modal>
  );
}
