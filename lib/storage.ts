import { Task, Context, Priority, Status } from './types'

const STORAGE_KEY = 'meu_agente_tasks'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function endOfWeekISO(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = 7 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

const SEED_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Criar relatório de performance Meta Ads',
    context: 'nowa',
    priority: 'alta',
    status: 'todo',
    dueDate: todayISO(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Reunião de briefing campanha Google',
    context: 'markseg',
    priority: 'media',
    status: 'todo',
    dueDate: tomorrowISO(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    title: 'Commit app de games - tela de login',
    context: 'projetos',
    priority: 'baixa',
    status: 'todo',
    dueDate: endOfWeekISO(),
    createdAt: new Date().toISOString(),
  },
]

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Task[]
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function initStorage(): Task[] {
  if (typeof window === 'undefined') return []
  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    saveTasks(SEED_TASKS)
    return SEED_TASKS
  }
  try {
    return JSON.parse(existing) as Task[]
  } catch {
    saveTasks(SEED_TASKS)
    return SEED_TASKS
  }
}

export function addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
  const newTask: Task = {
    ...task,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  const tasks = getTasks()
  saveTasks([newTask, ...tasks])
  return newTask
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  const updated = { ...tasks[idx], ...updates }
  if (updates.status === 'concluido' && !tasks[idx].completedAt) {
    updated.completedAt = new Date().toISOString()
  }
  if (updates.status && updates.status !== 'concluido') {
    updated.completedAt = undefined
  }
  tasks[idx] = updated
  saveTasks(tasks)
  return updated
}

export function deleteTask(id: string): void {
  const tasks = getTasks()
  saveTasks(tasks.filter((t) => t.id !== id))
}

export function getTasksDueToday(): Task[] {
  const today = todayISO()
  return getTasks().filter((t) => t.dueDate === today && t.status !== 'concluido')
}

export function getOverdueTasks(): Task[] {
  const today = todayISO()
  return getTasks().filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'concluido'
  )
}

export function getTasksCompletedThisWeek(): Task[] {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return getTasks().filter(
    (t) =>
      t.completedAt && new Date(t.completedAt) >= startOfWeek
  )
}

export function getTasksCompletedLast7Days(): Record<string, number> {
  const result: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    result[key] = 0
  }
  const tasks = getTasks()
  tasks.forEach((t) => {
    if (t.completedAt) {
      const day = t.completedAt.split('T')[0]
      if (day in result) result[day]++
    }
  })
  return result
}
