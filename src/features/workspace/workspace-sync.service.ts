import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase";
import {
  activityLogs as mockActivityLogs,
  calendarBlocks as mockCalendarBlocks,
  notifications as mockNotifications,
  organizations as mockOrganizations,
  projects as mockProjects,
  subtasks as mockSubtasks,
  taskLinks as mockTaskLinks,
  tasks as mockTasks,
  userSettings as mockUserSettings,
} from "../../mocks/mock-data";
import type { ActivityLog, CalendarBlock, Notification, Organization, Project, Subtask, Task, TaskLink, UserSettings } from "../../types/domain";
import type { CalendarBlockStatusDb, CalendarBlockTypeDb, Database, Json } from "../../types/database";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectTagRow = Database["public"]["Tables"]["project_tags"]["Row"];
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

  const { count, error: countError } = await client
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if (countError) throw countError;

  if (!count) {
    await seedWorkspace(userId);
  }

  return loadWorkspace();
}

async function seedWorkspace(userId: string) {
  const client = getSupabaseClient();
  const organizationIdMap = new Map<string, string>();
  const projectIdMap = new Map<string, string>();
  const taskIdMap = new Map<string, string>();
  const subtaskIdMap = new Map<string, string>();
  const calendarBlockIdMap = new Map<string, string>();

  for (const organization of mockOrganizations) {
    const { data, error } = await client
      .from("organizations")
      .insert({ user_id: userId, name: organization.name, description: organization.description ?? null })
      .select("id")
      .single();
    if (error) throw error;
    organizationIdMap.set(organization.id, data.id);
  }

  for (const project of mockProjects) {
    const organizationId = organizationIdMap.get(project.organizationId);
    if (!organizationId) continue;
    const { data, error } = await client
      .from("projects")
      .insert({ user_id: userId, organization_id: organizationId, name: project.name, description: project.description ?? null, color: project.color })
      .select("id")
      .single();
    if (error) throw error;
    projectIdMap.set(project.id, data.id);

    if (project.tags.length) {
      const { error: tagError } = await client.from("project_tags").insert(project.tags.map((tag) => ({ user_id: userId, project_id: data.id, name: tag })));
      if (tagError) throw tagError;
    }
  }

  for (const task of mockTasks) {
    const { data, error } = await client
      .from("tasks")
      .insert({
        user_id: userId,
        organization_id: task.organizationId ? organizationIdMap.get(task.organizationId) ?? null : null,
        project_id: task.projectId ? projectIdMap.get(task.projectId) ?? null : null,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate ?? null,
        estimated_hours: task.estimatedHours,
        real_hours: task.realHours,
        progress: task.progress,
        notes: task.notes ?? null,
        is_archived: task.isArchived,
        archived_at: task.archivedAt ?? null,
        completed_at: task.completedAt ?? null,
        deleted_at: task.deletedAt ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    taskIdMap.set(task.id, data.id);
  }

  for (const subtask of mockSubtasks) {
    const taskId = taskIdMap.get(subtask.taskId);
    if (!taskId) continue;
    const { data, error } = await client
      .from("subtasks")
      .insert({
        user_id: userId,
        task_id: taskId,
        title: subtask.title,
        description: subtask.description ?? null,
        priority: subtask.priority,
        status: subtask.status,
        estimated_hours: subtask.estimatedHours,
        real_hours: subtask.realHours,
        progress: subtask.progress,
        completed_at: subtask.completedAt ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    subtaskIdMap.set(subtask.id, data.id);
  }

  for (const link of mockTaskLinks) {
    const taskId = taskIdMap.get(link.taskId);
    if (!taskId) continue;
    const { error } = await client.from("task_links").insert({
      user_id: userId,
      task_id: taskId,
      title: link.title,
      url: link.url,
      type: link.type,
      description: link.description ?? null,
    });
    if (error) throw error;
  }

  for (const block of mockCalendarBlocks) {
    const taskId = block.taskId ? taskIdMap.get(block.taskId) ?? null : null;
    const subtaskId = block.subtaskId ? subtaskIdMap.get(block.subtaskId) ?? null : null;
    const { data, error } = await client
      .from("calendar_blocks")
      .insert({
        user_id: userId,
        organization_id: block.organizationId ? organizationIdMap.get(block.organizationId) ?? null : null,
        project_id: block.projectId ? projectIdMap.get(block.projectId) ?? null : null,
        task_id: taskId,
        subtask_id: subtaskId,
        title: block.title,
        description: block.description ?? null,
        block_type: block.blockType as CalendarBlockTypeDb,
        status: block.status,
        start_at: block.startAt,
        end_at: block.endAt,
        duration_hours: block.durationHours,
        real_hours_applied: block.realHoursApplied,
        affects_backlog: Boolean(taskId || subtaskId),
        completed_at: block.completedAt ?? null,
        deleted_at: block.deletedAt ?? null,
        color: block.color,
      })
      .select("id")
      .single();
    if (error) throw error;
    calendarBlockIdMap.set(block.id, data.id);
  }

  for (const notification of mockNotifications) {
    const { error } = await client.from("notifications").insert({
      user_id: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      is_read: notification.isRead,
      related_task_id: notification.relatedTaskId ? taskIdMap.get(notification.relatedTaskId) ?? null : null,
      related_calendar_block_id: notification.relatedCalendarBlockId ? calendarBlockIdMap.get(notification.relatedCalendarBlockId) ?? null : null,
    });
    if (error) throw error;
  }

  for (const log of mockActivityLogs) {
    const { error } = await client.from("activity_logs").insert({
      user_id: userId,
      task_id: log.taskId ? taskIdMap.get(log.taskId) ?? null : null,
      event_type: log.eventType,
      message: log.message,
    });
    if (error) throw error;
  }

  const { error: settingsError } = await client.from("user_settings").upsert({
    user_id: userId,
    theme: mockUserSettings.theme,
    primary_color: mockUserSettings.primaryColor,
    secondary_color: mockUserSettings.secondaryColor,
    priority_colors: mockUserSettings.priorityColors,
    enable_review_column: mockUserSettings.enableReviewColumn,
    enable_blocked_column: mockUserSettings.enableBlockedColumn,
    enable_waiting_column: mockUserSettings.enableWaitingColumn,
    enable_internal_notifications: mockUserSettings.enableInternalNotifications,
    notify_before_block_minutes: mockUserSettings.notifyBeforeBlockMinutes,
    daily_summary: mockUserSettings.dailySummary,
    timer_break_minutes: mockUserSettings.timerBreakMinutes,
    backlog_view: mockUserSettings.backlogView,
  }, { onConflict: "user_id" });
  if (settingsError) throw settingsError;
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
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    estimatedHours: row.estimated_hours,
    realHours: row.real_hours,
    progress: row.progress,
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
  return { id: row.id, userId: row.user_id, taskId: row.task_id, title: row.title, description: row.description ?? undefined, priority: row.priority, status: row.status, estimatedHours: row.estimated_hours, realHours: row.real_hours, progress: row.progress, completedAt: row.completed_at ?? undefined };
}

function mapTaskLink(row: TaskLinkRow): TaskLink {
  return { id: row.id, userId: row.user_id, taskId: row.task_id, title: row.title, url: row.url, type: row.type, description: row.description ?? undefined };
}

function mapCalendarBlock(row: CalendarBlockRow): CalendarBlock {
  const status = ["scheduled", "in_progress", "completed", "cancelled"].includes(row.status) ? row.status as CalendarBlock["status"] : "scheduled";
  const blockType = ["free", "meeting", "personal", "simple_task", "complex_task", "subtask"].includes(row.block_type) ? row.block_type as CalendarBlock["blockType"] : "free";
  return { id: row.id, userId: row.user_id, organizationId: row.organization_id ?? undefined, projectId: row.project_id ?? undefined, taskId: row.task_id ?? undefined, subtaskId: row.subtask_id ?? undefined, title: row.title, description: row.description ?? undefined, blockType, status, startAt: row.start_at, endAt: row.end_at, durationHours: row.duration_hours, completedAt: row.completed_at ?? undefined, realHoursApplied: row.real_hours_applied, color: row.color, deletedAt: row.deleted_at ?? undefined };
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
    notifyBeforeBlockMinutes: row.notify_before_block_minutes,
    dailySummary: row.daily_summary,
    timerBreakMinutes: row.timer_break_minutes,
    backlogView: row.backlog_view,
  };
}
