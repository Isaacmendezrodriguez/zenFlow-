import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, footer, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/40 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl animate-modal-in flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lift"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface px-6 py-4">
          <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar modal">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-outline-variant bg-surface-container-lowest px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
