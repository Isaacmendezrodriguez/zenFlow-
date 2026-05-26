import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { getTrashRemainingDays } from "../../lib/business-rules";
import { useZenflowStore } from "../../state/zenflow-store";

export function TrashPage() {
  const trashItems = useZenflowStore((state) => state.trashItems);
  const restoreTrashItem = useZenflowStore((state) => state.restoreTrashItem);
  const permanentlyDeleteTrashItem = useZenflowStore((state) => state.permanentlyDeleteTrashItem);
  const emptyTrash = useZenflowStore((state) => state.emptyTrash);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-bold">Papelera</h1>
          <p className="mt-1 text-on-surface-variant">Los elementos permanecen 3 dias antes de eliminarse permanentemente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!selectedIds.length} onClick={() => {
            selectedIds.forEach((id) => permanentlyDeleteTrashItem(id));
            setSelectedIds([]);
          }}>Eliminar seleccion</Button>
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => {
            if (window.confirm("Vaciar papelera permanentemente?")) emptyTrash();
          }}>Vaciar papelera</Button>
        </div>
      </header>
      <Card className="overflow-hidden">
        {trashItems.map((item) => {
          const remainingDays = getTrashRemainingDays(item);
          return (
            <div key={item.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-outline-variant px-4 py-4 last:border-b-0">
              <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} className="rounded border-outline-variant text-primary focus:ring-primary" />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-on-surface-variant">{item.entityType} eliminado el {item.deletedAt.slice(0, 10)}</p>
              </div>
              <Badge tone={remainingDays === 0 ? "error" : "neutral"}>{remainingDays} dias restantes</Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => {
                  const result = restoreTrashItem(item.id);
                  if (!result.ok) window.alert(result.message);
                }}>Restaurar</Button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => {
                  if (window.confirm(`Eliminar permanentemente "${item.name}"?`)) permanentlyDeleteTrashItem(item.id);
                }}>Eliminar</Button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
