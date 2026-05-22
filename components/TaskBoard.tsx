'use client'

import { useState } from 'react'
import {
  Task,
  Context,
  Status,
  Priority,
  CONTEXT_LABELS,
  CONTEXT_COLORS,
  CONTEXT_BG,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
} from '@/lib/types'

interface TaskBoardProps {
  tasks: Task[]
  activeContext: Context | 'todas'
  onContextChange: (ctx: Context | 'todas') => void
  onStatusChange: (id: string, status: Status) => void
  onDelete: (id: string) => void
}

type SortKey = 'prioridade' | 'data' | 'criacao'
type ViewMode = 'lista' | 'semana'

const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 }
const STATUS_FILTER_OPTIONS: { key: Status | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'todo', label: 'A fazer' },
  { key: 'em-progresso', label: 'Em progresso' },
  { key: 'concluido', label: 'Concluídas' },
]

const TABS: { key: Context | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'nowa', label: 'Nowa' },
  { key: 'markseg', label: 'Markseg' },
  { key: 'pessoal', label: 'Pessoal' },
  { key: 'projetos', label: 'Projetos' },
]

const DAY_ABBREVS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_ABBREVS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getWeekDaysInline(): Date[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isoKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'concluido') return false
  return task.dueDate < new Date().toISOString().split('T')[0]
}

function isToday(task: Task): boolean {
  if (!task.dueDate) return false
  return task.dueDate === new Date().toISOString().split('T')[0]
}

export default function TaskBoard({
  tasks,
  activeContext,
  onContextChange,
  onStatusChange,
  onDelete,
}: TaskBoardProps) {
  const [statusFilter, setStatusFilter] = useState<Status | 'todas'>('todas')
  const [sortKey, setSortKey] = useState<SortKey>('criacao')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('lista')

  const contextFiltered = tasks.filter(
    (t) => activeContext === 'todas' || t.context === activeContext
  )

  const filtered = contextFiltered
    .filter((t) => statusFilter === 'todas' || t.status === statusFilter)
    .sort((a, b) => {
      if (sortKey === 'prioridade') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortKey === 'data') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  function handleDelete(id: string) {
    setDeletingId(id)
    setTimeout(() => {
      onDelete(id)
      setDeletingId(null)
    }, 200)
  }

  function handleCheckbox(task: Task) {
    if (task.status === 'concluido') {
      onStatusChange(task.id, 'todo')
    } else {
      onStatusChange(task.id, 'concluido')
    }
  }

  function cycleStatus(task: Task) {
    const next: Record<Status, Status> = {
      todo: 'em-progresso',
      'em-progresso': 'concluido',
      concluido: 'todo',
    }
    onStatusChange(task.id, next[task.status])
  }

  // Week view helpers
  const weekDays = getWeekDaysInline()
  const today = todayKey()

  // Group context-filtered tasks by dueDate for the week view
  const tasksByDay: Record<string, Task[]> = {}
  const tasksNoDate: Task[] = []
  for (const task of contextFiltered) {
    if (!task.dueDate) {
      tasksNoDate.push(task)
    } else {
      if (!tasksByDay[task.dueDate]) tasksByDay[task.dueDate] = []
      tasksByDay[task.dueDate].push(task)
    }
  }

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 flex flex-col min-h-0">
      {/* View toggle + Tabs row */}
      <div className="flex items-center justify-between border-b border-slate-700/50">
        {/* Context tabs */}
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeContext === tab.key
            const color = tab.key !== 'todas' ? CONTEXT_COLORS[tab.key as Context] : undefined
            return (
              <button
                key={tab.key}
                onClick={() => onContextChange(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-current text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
                style={isActive && color ? { color, borderColor: color } : undefined}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 px-3 flex-shrink-0">
          <button
            onClick={() => setViewMode('lista')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'lista'
                ? 'bg-slate-600 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('semana')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'semana'
                ? 'bg-slate-600 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      {viewMode === 'lista' ? (
        <>
          {/* Filters row */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/30 flex-wrap gap-2">
            <div className="flex gap-1.5">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    statusFilter === opt.key
                      ? 'bg-slate-600 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 text-xs">Ordenar:</span>
              {(['criacao', 'prioridade', 'data'] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    sortKey === k ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {k === 'criacao' ? 'Criação' : k === 'prioridade' ? 'Prioridade' : 'Data'}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[480px]">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-slate-600 text-sm">Sem tarefas aqui.</p>
                <p className="text-slate-700 text-xs mt-1">Adiciona uma acima para começar.</p>
              </div>
            )}

            {filtered.map((task) => {
              const overdue = isOverdue(task)
              const todayTask = isToday(task)
              const done = task.status === 'concluido'
              const deleting = deletingId === task.id

              return (
                <div
                  key={task.id}
                  className={`group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    deleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  } ${
                    done
                      ? 'bg-slate-800/40 border-slate-700/30'
                      : overdue
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-slate-800/60 border-slate-700/40 hover:border-slate-600/60'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleCheckbox(task)}
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                      done
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {done && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug transition-all ${
                        done ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Context badge */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CONTEXT_BG[task.context]}`}
                      >
                        {CONTEXT_LABELS[task.context]}
                      </span>

                      {/* Priority */}
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span
                          className={`text-xs ${
                            overdue
                              ? 'text-red-400 font-medium'
                              : todayTask
                              ? 'text-yellow-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {overdue ? 'Atrasada — ' : todayTask ? 'Hoje — ' : ''}
                          {formatDate(task.dueDate)}
                        </span>
                      )}

                      {/* Status badge (click to cycle) */}
                      <button
                        onClick={() => cycleStatus(task)}
                        className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer transition-all hover:opacity-80 ${
                          task.status === 'todo'
                            ? 'bg-slate-700 text-slate-400 border-slate-600'
                            : task.status === 'em-progresso'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}
                      >
                        {STATUS_LABELS[task.status]}
                      </button>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer flex-shrink-0"
                    title="Eliminar tarefa"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 7.5a1 1 0 001 1h5a1 1 0 001-1L11 3.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-2 border-t border-slate-700/30">
            <p className="text-slate-600 text-xs">{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </>
      ) : (
        /* Week view */
        <div className="overflow-x-auto p-3">
          <div className="flex gap-2 min-w-max">
            {/* 7 day columns */}
            {weekDays.map((day, i) => {
              const key = isoKey(day)
              const isCurrentDay = key === today
              const dayTasks = tasksByDay[key] || []
              return (
                <div
                  key={key}
                  className={`w-44 flex flex-col rounded-lg border ${
                    isCurrentDay
                      ? 'border-blue-500/40 border-t-2 border-t-blue-500'
                      : 'border-slate-700/50'
                  }`}
                >
                  {/* Column header */}
                  <div
                    className={`px-3 py-2 rounded-t-lg text-xs font-medium ${
                      isCurrentDay
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <span className="font-semibold">{DAY_ABBREVS[i]}</span>
                    <span className="ml-1.5">{day.getDate()}</span>
                    <span className="ml-1 text-[10px] opacity-70">{MONTH_ABBREVS[day.getMonth()]}</span>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 min-h-32 max-h-96 overflow-y-auto p-1.5 space-y-1.5 bg-slate-800/20 rounded-b-lg">
                    {dayTasks.length === 0 ? (
                      <p className="text-slate-700 text-xs text-center py-3">—</p>
                    ) : (
                      dayTasks.map((task) => {
                        const done = task.status === 'concluido'
                        const deleting = deletingId === task.id
                        return (
                          <div
                            key={task.id}
                            className={`group relative p-2 rounded-md border transition-all duration-200 ${
                              deleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            } ${
                              done
                                ? 'bg-slate-800/40 border-slate-700/30'
                                : 'bg-slate-800/70 border-slate-700/40 hover:border-slate-600/60'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              {/* Checkbox */}
                              <button
                                onClick={() => handleCheckbox(task)}
                                className={`mt-0.5 w-3.5 h-3.5 rounded border-2 flex-shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                                  done
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {done && (
                                  <svg className="w-2 h-2 text-white" viewBox="0 0 10 8" fill="none">
                                    <path
                                      d="M1 4L3.5 6.5L9 1"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </button>
                              {/* Title */}
                              <p
                                className={`text-xs leading-snug flex-1 min-w-0 ${
                                  done ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}
                              >
                                {task.title}
                              </p>
                              {/* Delete on hover */}
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-600 hover:text-red-400 transition-all cursor-pointer"
                                title="Eliminar"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none">
                                  <path
                                    d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 7.5a1 1 0 001 1h5a1 1 0 001-1L11 3.5"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                            {/* Context badge */}
                            <div className="mt-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CONTEXT_BG[task.context]}`}
                              >
                                {CONTEXT_LABELS[task.context]}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}

            {/* No date column */}
            <div className="w-44 flex flex-col rounded-lg border border-slate-700/50">
              <div className="px-3 py-2 rounded-t-lg bg-slate-800/60 text-xs font-medium text-slate-500">
                Sem data
              </div>
              <div className="flex-1 min-h-32 max-h-96 overflow-y-auto p-1.5 space-y-1.5 bg-slate-800/20 rounded-b-lg">
                {tasksNoDate.length === 0 ? (
                  <p className="text-slate-700 text-xs text-center py-3">—</p>
                ) : (
                  tasksNoDate.map((task) => {
                    const done = task.status === 'concluido'
                    const deleting = deletingId === task.id
                    return (
                      <div
                        key={task.id}
                        className={`group relative p-2 rounded-md border transition-all duration-200 ${
                          deleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                        } ${
                          done
                            ? 'bg-slate-800/40 border-slate-700/30'
                            : 'bg-slate-800/70 border-slate-700/40 hover:border-slate-600/60'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <button
                            onClick={() => handleCheckbox(task)}
                            className={`mt-0.5 w-3.5 h-3.5 rounded border-2 flex-shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                              done
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {done && (
                              <svg className="w-2 h-2 text-white" viewBox="0 0 10 8" fill="none">
                                <path
                                  d="M1 4L3.5 6.5L9 1"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                          <p
                            className={`text-xs leading-snug flex-1 min-w-0 ${
                              done ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-600 hover:text-red-400 transition-all cursor-pointer"
                            title="Eliminar"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 7.5a1 1 0 001 1h5a1 1 0 001-1L11 3.5"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CONTEXT_BG[task.context]}`}
                          >
                            {CONTEXT_LABELS[task.context]}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
