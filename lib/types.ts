export type Context = 'nowa' | 'markseg' | 'pessoal' | 'projetos'
export type Priority = 'alta' | 'media' | 'baixa'
export type Status = 'todo' | 'em-progresso' | 'concluido'

export interface Task {
  id: string
  title: string
  context: Context
  priority: Priority
  status: Status
  dueDate?: string
  notes?: string
  createdAt: string
  completedAt?: string
}

export const CONTEXT_LABELS: Record<Context, string> = {
  nowa: 'Nowa Company',
  markseg: 'Markseg',
  pessoal: 'Pessoal',
  projetos: 'Projetos',
}

export const CONTEXT_COLORS: Record<Context, string> = {
  nowa: '#3B82F6',
  markseg: '#F97316',
  pessoal: '#22C55E',
  projetos: '#A855F7',
}

export const CONTEXT_BG: Record<Context, string> = {
  nowa: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  markseg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pessoal: 'bg-green-500/20 text-green-400 border-green-500/30',
  projetos: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  alta: 'text-red-400',
  media: 'text-yellow-400',
  baixa: 'text-slate-400',
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'A fazer',
  'em-progresso': 'Em progresso',
  concluido: 'Concluído',
}
