'use client'

import { Context, CONTEXT_LABELS, CONTEXT_COLORS } from '@/lib/types'

interface SidebarProps {
  activeContext: Context | 'todas'
  onContextChange: (ctx: Context | 'todas') => void
  taskCounts: Record<string, number>
}

const NAV_ITEMS: { key: Context | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas as tarefas' },
  { key: 'nowa', label: 'Nowa Company' },
  { key: 'markseg', label: 'Markseg' },
  { key: 'pessoal', label: 'Pessoal' },
  { key: 'projetos', label: 'Projetos' },
]

export default function Sidebar({ activeContext, onContextChange, taskCounts }: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen bg-[#1E293B] border-r border-slate-700/50 flex flex-col py-6 px-4 gap-2">
      <div className="mb-6 px-2">
        <span className="text-white font-bold text-lg tracking-tight">meu-agente</span>
        <p className="text-slate-400 text-xs mt-0.5">Gestor de Tráfego Pago</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeContext === item.key
          const color = item.key !== 'todas' ? CONTEXT_COLORS[item.key as Context] : '#94A3B8'
          const count = taskCounts[item.key] ?? 0

          return (
            <button
              key={item.key}
              onClick={() => onContextChange(item.key)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{item.key === 'todas' ? 'Todas' : CONTEXT_LABELS[item.key as Context]}</span>
              </div>
              {count > 0 && (
                <span className="text-xs bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto px-2 pt-4 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs">Rafael</p>
        <p className="text-slate-600 text-xs">Gestor de Tráfego</p>
      </div>
    </aside>
  )
}
