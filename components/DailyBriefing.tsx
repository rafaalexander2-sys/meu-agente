'use client'

import { Task, Context, CONTEXT_LABELS, CONTEXT_COLORS } from '@/lib/types'

interface DailyBriefingProps {
  tasks: Task[]
  onFilterContext: (ctx: Context | 'todas') => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDatePT(): string {
  return new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function DailyBriefing({ tasks, onFilterContext }: DailyBriefingProps) {
  const today = todayISO()

  const todayTasks = tasks.filter(
    (t) => t.dueDate === today && t.status !== 'concluido'
  )

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'concluido'
  )

  const pendingByContext = (['nowa', 'markseg', 'pessoal', 'projetos'] as Context[]).map(
    (ctx) => ({
      ctx,
      count: tasks.filter((t) => t.context === ctx && t.status !== 'concluido').length,
    })
  )

  return (
    <div className="bg-[#1E293B] rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-white text-xl font-semibold">
            {getGreeting()}, Rafael
          </h2>
          <p className="text-slate-400 text-sm mt-0.5 capitalize">{formatDatePT()}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{todayTasks.length}</p>
            <p className="text-slate-400 text-xs">para hoje</p>
          </div>
          {overdueTasks.length > 0 && (
            <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5">
              <p className="text-2xl font-bold text-red-400">{overdueTasks.length}</p>
              <p className="text-red-400 text-xs">em atraso</p>
            </div>
          )}
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-xs font-medium mb-1">Tarefas em atraso:</p>
          <ul className="space-y-0.5">
            {overdueTasks.slice(0, 3).map((t) => (
              <li key={t.id} className="text-red-300 text-xs truncate">
                — {t.title}
              </li>
            ))}
            {overdueTasks.length > 3 && (
              <li className="text-red-400 text-xs">+ {overdueTasks.length - 3} mais</li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap">
        {pendingByContext.map(({ ctx, count }) => (
          <button
            key={ctx}
            onClick={() => onFilterContext(ctx)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: `${CONTEXT_COLORS[ctx]}20`,
              borderColor: `${CONTEXT_COLORS[ctx]}40`,
              color: CONTEXT_COLORS[ctx],
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: CONTEXT_COLORS[ctx] }}
            />
            {CONTEXT_LABELS[ctx]}
            <span className="ml-0.5 opacity-70">{count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
