import { cn } from "../../lib/utils";

interface TabItem {
  label: string;
  value: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
      {items.map((item) => (
        <button
          key={item.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            item.value === value ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface",
          )}
          onClick={() => onChange?.(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
