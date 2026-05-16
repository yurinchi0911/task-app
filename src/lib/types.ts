export type ProjectRole = 'owner' | 'admin' | 'member'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  name: string | null
  email: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  color: string
  owner_id: string
  created_at: string
}

export interface ProjectMember {
  project_id: string
  user_id: string
  role: ProjectRole
  created_at: string
  profiles?: Profile | null
}

export interface Task {
  id: string
  project_id: string
  title: string
  assignee_id: string | null
  due_date: string | null
  status: TaskStatus
  priority: TaskPriority
  notes: string | null
  parent_task_id: string | null
  created_at: string
  profiles?: Profile | null
  children?: Task[]
}

export interface Feedback {
  id: string
  user_id: string
  category: string
  content: string
  rating: number | null
  created_at: string
}

export interface Standup {
  id: string
  project_id: string
  user_id: string
  standup_date: string
  yesterday: string | null
  today: string
  blockers: string | null
  created_at: string
  profiles?: Profile | null
}

export interface ProjectInvite {
  id: string
  project_id: string
  email: string
  role: ProjectRole
  invited_by: string
  token: string
  accepted_at: string | null
  created_at: string
  projects?: { id: string; name: string; color: string } | null
}

