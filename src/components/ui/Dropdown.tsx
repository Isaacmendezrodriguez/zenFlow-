import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "./Button";

interface DropdownProps {
  label: string;
  children: ReactNode;
}

export function Dropdown({ label, children }: DropdownProps) {
  return (
    <details className="relative">
      <summary className="list-none">
        <Button type="button" variant="outline" size="sm" icon={<ChevronDown className="h-4 w-4" />}>
          {label}
        </Button>
      </summary>
      <div className="absolute right-0 top-10 z-20 min-w-52 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-lift animate-modal-in">
        {children}
      </div>
    </details>
  );
}
