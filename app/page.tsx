'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import DailyBriefing from '@/components/DailyBriefing'
import QuickAdd from '@/components/QuickAdd'
import TaskBoard from '@/components/TaskBoard'
import ProductivityStats from '@/components/ProductivityStats'
import CalendarSection from '@/components/CalendarSection'
import { Task, Context, Status, Priority } from '@/lib/types'
import { initStorage, addTask, updateTask, deleteTask, getTasks } from '@/lib/storage'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeContext, setActiveContext] = useState<Context | 'todas'>('todas')
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const loaded = initStorage()
    setTasks(loaded)
    setMounted(true)
  }, [])

  function refreshTasks() {
    setTasks(getTasks())
  }

  function handleAddTask(data: {
    title: string
    context: Context
    priority: Priority
    dueDate?: string
  }) {
    addTask({ ...data, status: 'todo' })
    refreshTasks()
  }

  function handleStatusChange(id: string, status: Status) {
    updateTask(id, { status })
    refreshTasks()
  }

  function handleDelete(id: string) {
    deleteTask(id)
    refreshTasks()
  }

  function handleContextChange(ctx: Context | 'todas') {
    setActiveContext(ctx)
    setSidebarOpen(false)
  }

  // Task counts for sidebar
  const taskCounts: Record<string, number> = {
    todas: tasks.filter((t) => t.status !== 'concluido').length,
    nowa: tasks.filter((t) => t.context === 'nowa' && t.status !== 'concluido').length,
    markseg: tasks.filter((t) => t.context === 'markseg' && t.status !== 'concluido').length,
    pessoal: tasks.filter((t) => t.context === 'pessoal' && t.status !== 'concluido').length,
    projetos: tasks.filter((t) => t.context === 'projetos' && t.status !== 'concluido').length,
  }

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-screen bg-[#0F172A]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-30 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeContext={activeContext}
          onContextChange={handleContextChange}
          taskCounts={taskCounts}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#1E293B] border-b border-slate-700/50 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">meu-agente</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {/* Daily briefing */}
          <div className="mb-5">
            <DailyBriefing tasks={tasks} onFilterContext={handleContextChange} />
          </div>

          {/* Middle grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
            {/* Left column: QuickAdd + TaskBoard */}
            <div className="flex flex-col gap-4 min-w-0">
              <QuickAdd
                defaultContext={activeContext === 'todas' ? 'nowa' : activeContext}
                onAdd={handleAddTask}
              />
              <TaskBoard
                tasks={tasks}
                activeContext={activeContext}
                onContextChange={handleContextChange}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </div>

            {/* Right column: Calendar + ProductivityStats */}
            <div className="xl:sticky xl:top-6 xl:self-start flex flex-col gap-4">
              <CalendarSection />
              <ProductivityStats tasks={tasks} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
