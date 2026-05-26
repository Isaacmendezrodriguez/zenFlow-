import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { CalendarBlock } from "../../types/domain";

interface CalendarBlockModalProps {
  block: CalendarBlock | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarBlockModal({ block, isOpen, onClose }: CalendarBlockModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar bloque"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onClose}>Guardar bloque</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input defaultValue={block?.title ?? ""} placeholder="Nombre del bloque" />
        <div className="grid gap-4 md:grid-cols-3">
          <Select defaultValue={block?.blockType ?? "free"}>
            <option value="free">Libre</option>
            <option value="meeting">Meeting</option>
            <option value="personal">Personal</option>
            <option value="simple_task">Card sencilla</option>
            <option value="complex_task">Card compleja</option>
            <option value="subtask">Subtarea</option>
          </Select>
          <Input type="time" defaultValue={block?.startAt.slice(11, 16) ?? "09:00"} />
          <Input type="time" defaultValue={block?.endAt.slice(11, 16) ?? "10:00"} />
        </div>
        <Textarea placeholder="Notas o agenda..." defaultValue={block?.description ?? ""} />
      </div>
    </Modal>
  );
}
