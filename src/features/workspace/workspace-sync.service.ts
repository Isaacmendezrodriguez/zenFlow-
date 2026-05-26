import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase";
import { userSettings as mockUserSettings } from "../../mocks/mock-data";
import type { ActivityLog, CalendarBlock, Notification, Organization, Project, Subtask, Task, TaskLink, UserSettings } from "../../types/domain";
import type { CalendarBlockStatusDb, CalendarBlockTypeDb, Database, Json } from "../../types/database";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type SubtaskRow = Database["public"]["Tables"]["subtasks"]["Row"];
type TaskLinkRow = Database["public"]["Tables"]["task_links"]["Row"];
type CalendarBlockRow = Database["public"]["Tables"]["calendar_blocks"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type UserSettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

export interface WorkspaceSnapshot {
  organizations: Organization[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  taskLinks: TaskLink[];
  calendarBlocks: CalendarBlock[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  userSettings: UserSettings;
}

export async function loadOrSeedWorkspace(): Promise<WorkspaceSnapshot | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) return null;

  return loadWorkspace();
}

async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  const client = getSupabaseClient();
  const [
    organizationsResult,
    projectsResult,
    tagsResult,
    tasksResult,
    subtasksResult,
    linksResult,
    blocksResult,
    notificationsResult,
    activityLogsResult,
    settingsResult,
  ] = await Promise.all([
    client.from("organizations").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    client.from("projects").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    client.from("project_tags").select("*"),
    client.from("tasks").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    client.from("subtasks").select("*").is("deleted_at", null),
    client.from("task_links").select("*"),
    client.from("calendar_blocks").select("*").is("deleted_at", null),
    client.from("notifications").select("*").order("created_at", { ascending: false }),
    client.from("activity_logs").select("*").order("created_at", { ascending: false }),
    client.from("user_settings").select("*").single(),
  ]);

  const errors = [organizationsResult.error, projectsResult.error, tagsResult.error, tasksResult.error, subtasksResult.error, linksResult.error, blocksResult.error, notificationsResult.error, activityLogsResult.error, settingsResult.error].filter(Boolean);
  if (errors.length) throw errors[0];

  const tagsByProject = new Map<string, string[]>();
  for (const tag of tagsResult.data ?? []) {
    tagsByProject.set(tag.project_id, [...(tagsByProject.get(tag.project_id) ?? []), tag.name]);
  }

  return {
    organizations: (organizationsResult.data ?? []).map(mapOrganization),
    projects: (projectsResult.data ?? []).map((project) => mapProject(project, tagsByProject.get(project.id) ?? [])),
    tasks: (tasksResult.data ?? []).map(mapTask),
    subtasks: (subtasksResult.data ?? []).map(mapSubtask),
    taskLinks: (linksResult.data ?? []).map(mapTaskLink),
    calendarBlocks: (blocksResult.data ?? []).map(mapCalendarBlock),
    notifications: (notificationsResult.data ?? []).map(mapNotification),
    activityLogs: (activityLogsResult.data ?? []).map(mapActivityLog),
    userSettings: settingsResult.data ? mapUserSettings(settingsResult.data) : mockUserSettings,
  };
}

function mapOrganization(row: OrganizationRow): Organization {
  return { id: row.id, userId: row.user_id, name: row.name, description: row.description ?? undefined, createdAt: row.created_at, deletedAt: row.deleted_at ?? undefined };
}

function mapProject(row: ProjectRow, tags: string[]): Project {
  return { id: row.id, userId: row.user_id, organizationId: row.organization_id, name: row.name, description: row.description ?? undefined, color: row.color, tags, createdAt: row.created_at, deletedAt: row.deleted_at ?? undefined };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id ?? undefined,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    statusIndex: toNumber(row.status_index),
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    estimatedHours: toNumber(row.estimated_hours),
    realHours: toNumber(row.real_hours),
    progress: toNumber(row.progress),
    notes: row.notes ?? undefined,
    tags: [],
    isArchived: row.is_archived,
    archivedAt: row.archived_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapSubtask(row: SubtaskRow): Subtask {
  return { id: row.id, userId: row.user_id, taskId: row.task_id, title: row.title, description: row.description ?? undefined, priority: row.priority, status: row.status, estimatedHours: toNumber(row.estimated_hours), realHours: toNumber(row.real_hours), progress: toNumber(row.progress), completedAt: row.completed_at ?? undefined };
}

function mapTaskLink(row: TaskLinkRow): TaskLink {
  return { id: row.id, userId: row.user_id, taskId: row.task_id, title: row.title, url: row.url, type: row.type, description: row.description ?? undefined };
}

function mapCalendarBlock(row: CalendarBlockRow): CalendarBlock {
  const status = ["scheduled", "in_progress", "completed", "cancelled"].includes(row.status) ? row.status as CalendarBlock["status"] : "scheduled";
  const blockType = ["free", "meeting", "personal", "simple_task", "complex_task", "subtask"].includes(row.block_type) ? row.block_type as CalendarBlock["blockType"] : "free";
  return { id: row.id, userId: row.user_id, organizationId: row.organization_id ?? undefined, projectId: row.project_id ?? undefined, taskId: row.task_id ?? undefined, subtaskId: row.subtask_id ?? undefined, title: row.title, description: row.description ?? undefined, blockType, status, startAt: row.start_at, endAt: row.end_at, durationHours: toNumber(row.duration_hours), completedAt: row.completed_at ?? undefined, realHoursApplied: toNumber(row.real_hours_applied), color: row.color, deletedAt: row.deleted_at ?? undefined };
}

function mapNotification(row: NotificationRow): Notification {
  return { id: row.id, userId: row.user_id, title: row.title, message: row.message, type: row.type, isRead: row.is_read, relatedTaskId: row.related_task_id ?? undefined, relatedCalendarBlockId: row.related_calendar_block_id ?? undefined, createdAt: row.created_at };
}

function mapActivityLog(row: ActivityLogRow): ActivityLog {
  return { id: row.id, userId: row.user_id, taskId: row.task_id ?? undefined, eventType: row.event_type, message: row.message, createdAt: row.created_at };
}

function mapUserSettings(row: UserSettingsRow): UserSettings {
  return {
    id: row.id,
    userId: row.user_id,
    theme: row.theme,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    priorityColors: row.priority_colors as UserSettings["priorityColors"],
    enableReviewColumn: row.enable_review_column,
    enableBlockedColumn: row.enable_blocked_column,
    enableWaitingColumn: row.enable_waiting_column,
    enableInternalNotifications: row.enable_internal_notifications,
    notifyBeforeBlockMinutes: toNumber(row.notify_before_block_minutes),
    dailySummary: row.daily_summary,
    timerBreakMinutes: toNumber(row.timer_break_minutes),
    backlogView: row.backlog_view,
  };
}

function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
