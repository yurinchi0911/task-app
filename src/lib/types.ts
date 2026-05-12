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

// Supabase createBrowserClient / createServerClient が期待する Database 型
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: { id: string; name?: string | null; email?: string | null; created_at?: string }
        Update: { name?: string | null; email?: string | null }
      }
      projects: {
        Row: Project
        Insert: { id?: string; name: string; color?: string; owner_id: string; created_at?: string }
        Update: { name?: string; color?: string; owner_id?: string }
      }
      project_members: {
        Row: Omit<ProjectMember, 'profiles'>
        Insert: { project_id: string; user_id: string; role?: ProjectRole; created_at?: string }
        Update: { role?: ProjectRole }
      }
      tasks: {
        Row: Omit<Task, 'profiles'>
        Insert: { id?: string; project_id: string; title: string; assignee_id?: string | null; due_date?: string | null; status?: TaskStatus; priority?: TaskPriority; created_at?: string }
        Update: { title?: string; assignee_id?: string | null; due_date?: string | null; status?: TaskStatus; priority?: TaskPriority }
      }
      project_invites: {
        Row: Omit<ProjectInvite, 'projects'>
        Insert: { id?: string; project_id: string; email: string; role?: ProjectRole; invited_by: string; token: string; accepted_at?: string | null; created_at?: string }
        Update: { accepted_at?: string | null }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      project_role: ProjectRole
      task_status: TaskStatus
      task_priority: TaskPriority
    }
    CompositeTypes: Record<string, never>
  }
}
