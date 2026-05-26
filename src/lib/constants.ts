import type { CalendarBlockStatus, CalendarBlockType, LinkType, Priority, TaskStatus, TaskType } from "../types/domain";

export const APP_NAME = "ZenFlow";

export const ROUTES = {
  login: "/login",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  backlog: "/backlog",
  todoWeekly: "/todo-weekly",
  organizations: "/organizations",
  projects: "/projects",
  archive: "/archive",
  trash: "/trash",
  settings: "/settings",
} as const;

export const TASK_TYPES = ["simple", "complex"] as const satisfies readonly TaskType[];

export const TASK_STATUSES = ["not_started", "in_progress", "done", "review", "blocked", "waiting"] as const satisfies readonly TaskStatus[];

export const TASK_STATUS_INDEX: Record<TaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  review: 2,
  blocked: 3,
  waiting: 3,
  done: 4,
};

export const BASE_STATUSES = ["not_started", "in_progress", "done"] as const satisfies readonly TaskStatus[];
export const BASE_COLUMNS = BASE_STATUSES;

export const OPTIONAL_STATUSES = ["review", "blocked", "waiting"] as const satisfies readonly TaskStatus[];
export const OPTIONAL_COLUMNS = OPTIONAL_STATUSES;
export const PAUSED_STATUSES = OPTIONAL_STATUSES;

export const PRIORITIES = ["urgent", "medium", "low"] as const satisfies readonly Priority[];

export const DEFAULT_PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "#ba1a1a",
  medium: "#f59e0b",
  low: "#22c55e",
};

export const BLOCK_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const satisfies readonly CalendarBlockStatus[];

export const BLOCK_TYPES = ["free", "meeting", "personal", "simple_task", "complex_task", "subtask"] as const satisfies readonly CalendarBlockType[];

export const LINK_TYPES = ["figma", "document", "meeting", "sharepoint", "youtube", "website", "other"] as const satisfies readonly LinkType[];

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgente",
  medium: "Intermedia",
  low: "Baja",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Tareas sin iniciar",
  in_progress: "Tareas en proceso",
  done: "Tareas terminadas",
  review: "En revision",
  blocked: "Bloqueadas",
  waiting: "En espera",
};

export const SIMPLE_TASK_PROGRESS_BY_STATUS: Record<TaskStatus, number | null> = {
  not_started: 0,
  in_progress: 50,
  done: 100,
  review: null,
  blocked: null,
  waiting: null,
};

export const HOUR_STATUS_LABELS = {
  overconsumption: "Sobreconsumo",
  saved: "Ahorro",
  exact: "Exacto",
} as const;

export const TRASH_RETENTION_DAYS = 3;
export const DEFAULT_TIMER_BREAK_MINUTES_PER_HOUR = 5;

export const TASK_DUE_DATE_SCHEDULE_ERROR =
  "No puedes programar horas despues de la fecha de entrega. Modifica la fecha para continuar.";

export const CALENDAR_OVERLAP_WARNING = "Ya tienes una actividad programada en este horario. Quieres continuar?";

export const CREATE_ORGANIZATION_OPTION = "__create_organization__";
export const CREATE_PROJECT_OPTION = "__create_project__";
