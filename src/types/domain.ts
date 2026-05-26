export type ID = string;

export type TaskType = "simple" | "complex";
export type TaskStatus = "not_started" | "in_progress" | "done" | "review" | "blocked" | "waiting";
export type SubtaskStatus = "not_started" | "in_progress" | "done";
export type Priority = "urgent" | "medium" | "low";
export type CalendarBlockStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type CalendarBlockType = "free" | "meeting" | "personal" | "simple_task" | "complex_task" | "subtask";
export type LinkType = "figma" | "document" | "meeting" | "sharepoint" | "youtube" | "website" | "other";
export type ThemeMode = "light" | "dark";

export interface Organization {
  id: ID;
  userId: ID;
  name: string;
  description?: string;
  createdAt: string;
  deletedAt?: string;
}

export interface Project {
  id: ID;
  userId: ID;
  organizationId: ID;
  name: string;
  description?: string;
  color: string;
  tags: string[];
  createdAt: string;
  deletedAt?: string;
}

export interface Task {
  id: ID;
  userId: ID;
  organizationId?: ID;
  projectId?: ID;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  statusIndex: number;
  priority: Priority;
  dueDate?: string;
  estimatedHours: number;
  realHours: number;
  progress: number;
  notes?: string;
  tags: string[];
  isArchived: boolean;
  archivedAt?: string;
  completedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface Subtask {
  id: ID;
  userId: ID;
  taskId: ID;
  title: string;
  description?: string;
  priority: Priority;
  status: SubtaskStatus;
  estimatedHours: number;
  realHours: number;
  progress: number;
  completedAt?: string;
}

export interface TaskLink {
  id: ID;
  userId: ID;
  taskId: ID;
  title: string;
  url: string;
  type: LinkType;
  description?: string;
}

export interface CalendarBlock {
  id: ID;
  userId: ID;
  organizationId?: ID;
  projectId?: ID;
  taskId?: ID;
  subtaskId?: ID;
  title: string;
  description?: string;
  blockType: CalendarBlockType;
  status: CalendarBlockStatus;
  startAt: string;
  endAt: string;
  durationHours: number;
  completedAt?: string;
  realHoursApplied: number;
  color: string;
  deletedAt?: string;
}

export interface Notification {
  id: ID;
  userId: ID;
  title: string;
  message: string;
  type: "reminder" | "due" | "timer" | "summary";
  isRead: boolean;
  relatedTaskId?: ID;
  relatedCalendarBlockId?: ID;
  createdAt: string;
}

export interface ActivityLog {
  id: ID;
  userId: ID;
  taskId?: ID;
  eventType: string;
  message: string;
  createdAt: string;
}

export interface UserSettings {
  id: ID;
  userId: ID;
  theme: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  priorityColors: Record<Priority, string>;
  enableReviewColumn: boolean;
  enableBlockedColumn: boolean;
  enableWaitingColumn: boolean;
  enableInternalNotifications: boolean;
  notifyBeforeBlockMinutes: number;
  dailySummary: boolean;
  timerBreakMinutes: number;
  backlogView: "compact" | "expanded";
}

export interface TrashItem {
  id: ID;
  userId: ID;
  entityType: "task" | "organization" | "project";
  entityId: ID;
  name: string;
  deletedAt: string;
  permanentDeleteAt: string;
  entitySnapshot?: Task | Organization | Project;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  tone: "primary" | "secondary" | "tertiary" | "error" | "neutral";
}
