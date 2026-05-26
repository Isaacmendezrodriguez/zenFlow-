import { Bell, Moon, Search, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";
import { useZenflowStore } from "../../state/zenflow-store";

interface TopbarProps {
  onAddTask: () => void;
  onOpenNotifications: () => void;
  isCompact?: boolean;
}

export function Topbar({ onAddTask, onOpenNotifications, isCompact = false }: TopbarProps) {
  const [isDark, setIsDark] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const filters = useZenflowStore((state) => state.filters);
  const updateFilters = useZenflowStore((state) => state.updateFilters);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === "F7") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <header className={cn("fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest/85 px-4 backdrop-blur-md transition-[left] md:px-8", isCompact ? "md:left-16" : "md:left-64")}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-on-surface md:hidden">ZenFlow</h2>
        <div className="relative hidden w-full max-w-sm sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            ref={searchRef}
            className="h-9 rounded-full bg-surface-container-low pl-9"
            placeholder="Buscar por nombre... Ctrl+F7"
            value={filters.searchQuery}
            onChange={(event) => updateFilters({ searchQuery: event.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onOpenNotifications} aria-label="Abrir notificaciones" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button className="hidden sm:inline-flex" onClick={onAddTask}>
          Agregar
        </Button>
        <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-sm font-semibold text-on-surface">AR</div>
      </div>
    </header>
  );
}
