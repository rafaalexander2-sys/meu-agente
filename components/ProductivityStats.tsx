'use client'

import { Task, Context, CONTEXT_LABELS, CONTEXT_COLORS } from '@/lib/types'

interface ProductivityStatsProps {
  tasks: Task[]
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso + 'T12:00:00')
  return date.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3)
}

function getStreakDays(tasks: Task[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const hadActivity = tasks.some(
      (t) => t.completedAt && t.completedAt.startsWith(iso)
    )
    if (hadActivity) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export default function ProductivityStats({ tasks }: ProductivityStatsProps) {
  const today = todayISO()
  const last7 = getLast7Days()

  // Completed today
  const completedToday = tasks.filter(
    (t) => t.completedAt && t.completedAt.startsWith(today)
  ).length

  // Completed this week
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const completedThisWeek = tasks.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= startOfWeek
  ).length

  // Total non-done tasks
  const totalActive = tasks.filter((t) => t.status !== 'concluido').length
  const totalAll = tasks.length
  const completionRate = totalAll > 0 ? Math.round((tasks.filter((t) => t.status === 'concluido').length / totalAll) * 100) : 0

  // Last 7 days bar chart data
  const dailyData: Record<string, number> = {}
  last7.forEach((d) => (dailyData[d] = 0))
  tasks.forEach((t) => {
    if (t.completedAt) {
      const day = t.completedAt.split('T')[0]
      if (day in dailyData) dailyData[day]++
    }
  })
  const maxDaily = Math.max(...Object.values(dailyData), 1)

  // Top context this week
  const weekTasks = tasks.filter((t) => t.completedAt && new Date(t.completedAt) >= startOfWeek)
  const ctxCounts: Record<string, number> = {}
  weekTasks.forEach((t) => {
    ctxCounts[t.context] = (ctxCounts[t.context] || 0) + 1
  })
  const topCtxEntry = Object.entries(ctxCounts).sort((a, b) => b[1] - a[1])[0]
  const topCtx = topCtxEntry ? (topCtxEntry[0] as Context) : null

  // Streak
  const streak = getStreakDays(tasks)

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 p-5 space-y-5">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Produtividade</p>

      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-2xl font-bold text-white">{completedToday}</p>
          <p className="text-slate-400 text-xs mt-0.5">concluídas hoje</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-2xl font-bold text-white">{completedThisWeek}</p>
          <p className="text-slate-400 text-xs mt-0.5">esta semana</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-2xl font-bold text-white">{completionRate}%</p>
          <p className="text-slate-400 text-xs mt-0.5">taxa de conclusão</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-amber-400">{streak}</p>
            <p className="text-slate-500 text-xs">{streak === 1 ? 'dia' : 'dias'}</p>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">streak ativo</p>
        </div>
      </div>

      {/* Bar chart - last 7 days */}
      <div>
        <p className="text-slate-500 text-xs mb-3">Concluídas nos últimos 7 dias</p>
        <div className="flex items-end gap-1.5 h-16">
          {last7.map((day) => {
            const count = dailyData[day] || 0
            const heightPct = Math.round((count / maxDaily) * 100)
            const isToday = day === today

            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '48px' }}>
                  {count > 0 ? (
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                      style={{ height: `${Math.max(heightPct, 8)}%` }}
                      title={`${count} tarefa${count !== 1 ? 's' : ''}`}
                    />
                  ) : (
                    <div className="w-full rounded-t bg-slate-700/40" style={{ height: '4px' }} />
                  )}
                </div>
                <span className={`text-xs ${isToday ? 'text-blue-400 font-medium' : 'text-slate-600'}`}>
                  {formatDayLabel(day)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top context */}
      {topCtx && (
        <div className="border-t border-slate-700/40 pt-4">
          <p className="text-slate-500 text-xs mb-2">Top contexto esta semana</p>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
            style={{
              backgroundColor: `${CONTEXT_COLORS[topCtx]}10`,
              borderColor: `${CONTEXT_COLORS[topCtx]}30`,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: CONTEXT_COLORS[topCtx] }}
            />
            <span className="text-sm font-medium" style={{ color: CONTEXT_COLORS[topCtx] }}>
              {CONTEXT_LABELS[topCtx]}
            </span>
            <span className="ml-auto text-slate-400 text-xs">
              {ctxCounts[topCtx]} tarefa{ctxCounts[topCtx] !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Pending by context */}
      <div className="border-t border-slate-700/40 pt-4">
        <p className="text-slate-500 text-xs mb-3">Pendentes por contexto</p>
        <div className="space-y-2">
          {(['nowa', 'markseg', 'pessoal', 'projetos'] as Context[]).map((ctx) => {
            const pending = tasks.filter((t) => t.context === ctx && t.status !== 'concluido').length
            const total = tasks.filter((t) => t.context === ctx).length
            const pct = total > 0 ? Math.round((pending / total) * 100) : 0

            return (
              <div key={ctx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{CONTEXT_LABELS[ctx]}</span>
                  <span className="text-xs text-slate-500">
                    {pending}/{total}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${total > 0 ? Math.round(((total - pending) / total) * 100) : 0}%`,
                      backgroundColor: CONTEXT_COLORS[ctx],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
