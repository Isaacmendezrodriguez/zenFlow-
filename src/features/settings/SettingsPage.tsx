import { Bell, Gavel, Palette, Timer, Workflow } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useZenflowStore } from "../../state/zenflow-store";
import type { Priority } from "../../types/domain";
import { updateUserSettings } from "./services/settings.service";

export function SettingsPage() {
  const userSettings = useZenflowStore((state) => state.userSettings);
  const updateSettings = useZenflowStore((state) => state.updateSettings);

  function updateTheme(theme: "light" | "dark") {
    document.documentElement.classList.toggle("dark", theme === "dark");
    updateSettings({ theme });
  }

  function updateCssColor(variable: string, value: string) {
    document.documentElement.style.setProperty(variable, value);
  }

  async function saveSettings() {
    if (!isSupabaseConfigured) {
      window.alert("Configuracion guardada en estado mock.");
      return;
    }

    const result = await updateUserSettings({
      theme: userSettings.theme,
      primary_color: userSettings.primaryColor,
      secondary_color: userSettings.secondaryColor,
      priority_colors: userSettings.priorityColors,
      enable_review_column: userSettings.enableReviewColumn,
      enable_blocked_column: userSettings.enableBlockedColumn,
      enable_waiting_column: userSettings.enableWaitingColumn,
      enable_internal_notifications: userSettings.enableInternalNotifications,
      notify_before_block_minutes: userSettings.notifyBeforeBlockMinutes,
      daily_summary: userSettings.dailySummary,
      timer_break_minutes: userSettings.timerBreakMinutes,
      backlog_view: userSettings.backlogView,
    });
    window.alert(result.error ? result.error : "Configuracion guardada en Supabase.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Configuracion</h1>
        <p className="mt-1 text-on-surface-variant">Personaliza tu flujo de trabajo y la interfaz de ZenFlow.</p>
      </header>

      <SettingsSection icon={<Palette className="h-5 w-5" />} title="Visual">
        <div className="grid gap-4 md:grid-cols-2">
          <button className={`rounded-lg text-left ${userSettings.theme === "light" ? "ring-2 ring-primary" : ""}`} onClick={() => updateTheme("light")}>
            <Card className="p-4">
              <div className="mb-3 aspect-video rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <div className="mb-2 h-2 w-1/2 rounded bg-primary/20" />
                <div className="mb-2 h-5 rounded bg-white shadow-sm" />
                <div className="h-5 w-3/4 rounded bg-white shadow-sm" />
              </div>
              <p className="font-semibold">Modo claro</p>
            </Card>
          </button>
          <button className={`rounded-lg text-left ${userSettings.theme === "dark" ? "ring-2 ring-primary" : ""}`} onClick={() => updateTheme("dark")}>
            <Card className="bg-zinc-900 p-4 text-white">
              <div className="mb-3 aspect-video rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                <div className="mb-2 h-2 w-1/2 rounded bg-primary/40" />
                <div className="mb-2 h-5 rounded bg-zinc-700" />
                <div className="h-5 w-3/4 rounded bg-zinc-700" />
              </div>
              <p className="font-semibold">Modo oscuro</p>
            </Card>
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ColorInput label="Color primario" value={userSettings.primaryColor} onChange={(value) => { updateSettings({ primaryColor: value }); updateCssColor("--color-primary", value); }} />
          <ColorInput label="Color secundario" value={userSettings.secondaryColor} onChange={(value) => { updateSettings({ secondaryColor: value }); updateCssColor("--color-secondary", value); }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.entries(userSettings.priorityColors) as Array<[Priority, string]>).map(([priority, color]) => (
            <Card key={priority} className="p-4">
              <Badge tone={priority === "urgent" ? "error" : priority === "medium" ? "tertiary" : "secondary"}>{priority}</Badge>
              <ColorInput label="" value={color} onChange={(value) => updateSettings({ priorityColors: { ...userSettings.priorityColors, [priority]: value } })} />
            </Card>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection icon={<Bell className="h-5 w-5" />} title="Productividad">
        <SettingToggle label="Notificaciones internas" checked={userSettings.enableInternalNotifications} onChange={() => updateSettings({ enableInternalNotifications: !userSettings.enableInternalNotifications })} />
        <SettingToggle label={`Avisar ${userSettings.notifyBeforeBlockMinutes} minutos antes de bloques`} checked={userSettings.notifyBeforeBlockMinutes > 0} onChange={() => updateSettings({ notifyBeforeBlockMinutes: userSettings.notifyBeforeBlockMinutes > 0 ? 0 : 5 })} />
        <SettingToggle label="Resumen diario" checked={userSettings.dailySummary} onChange={() => updateSettings({ dailySummary: !userSettings.dailySummary })} />
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <div className="flex items-center gap-2 font-semibold"><Timer className="h-4 w-4" /> Temporizador</div>
          <div className="mt-3 flex items-center gap-3">
            <Input type="number" min={0} max={30} value={userSettings.timerBreakMinutes} onChange={(event) => updateSettings({ timerBreakMinutes: Number(event.target.value) })} />
            <p className="text-sm text-on-surface-variant">minutos por hora.</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={<Workflow className="h-5 w-5" />} title="Backlog">
        <SettingToggle label="Activar columna En revision" checked={userSettings.enableReviewColumn} onChange={() => updateSettings({ enableReviewColumn: !userSettings.enableReviewColumn })} />
        <SettingToggle label="Activar columna Bloqueadas" checked={userSettings.enableBlockedColumn} onChange={() => updateSettings({ enableBlockedColumn: !userSettings.enableBlockedColumn })} />
        <SettingToggle label="Activar columna En espera" checked={userSettings.enableWaitingColumn} onChange={() => updateSettings({ enableWaitingColumn: !userSettings.enableWaitingColumn })} />
        <SettingToggle label="Vista compacta" checked={userSettings.backlogView === "compact"} onChange={() => updateSettings({ backlogView: "compact" })} />
        <SettingToggle label="Vista amplia" checked={userSettings.backlogView === "expanded"} onChange={() => updateSettings({ backlogView: "expanded" })} />
      </SettingsSection>

      <SettingsSection icon={<Gavel className="h-5 w-5" />} title="Reglas de cards">
        {["Una card terminada no se puede editar", "Una card archivada no se puede reabrir", "Una card no puede cambiar de proyecto", "Una card sencilla no puede convertirse en compleja", "Una card compleja no puede convertirse en sencilla"].map((rule) => (
          <div key={rule} className="rounded-lg bg-surface-container p-3 text-sm text-on-surface-variant">{rule}</div>
        ))}
      </SettingsSection>

      <footer className="flex justify-end gap-3 border-t border-outline-variant pt-6">
        <Button variant="outline" onClick={() => updateSettings({ theme: "light", backlogView: "expanded", timerBreakMinutes: 5 })}>Restaurar valores</Button>
        <Button onClick={saveSettings}>Guardar cambios</Button>
      </footer>
    </div>
  );
}

function SettingsSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 rounded-lg border border-outline-variant bg-transparent" />
      <div>
        {label ? <p className="text-xs text-on-surface-variant">{label}</p> : null}
        <p className="font-mono text-sm font-semibold uppercase">{value}</p>
      </div>
    </label>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition hover:bg-surface-container-low" onClick={onChange}>
      <p className="font-medium">{label}</p>
      <span className={`relative h-6 w-11 rounded-full border transition ${checked ? "border-primary bg-primary" : "border-outline-variant bg-surface-container"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}
