'use client'

import { useState, useEffect, useRef } from 'react'
import { Context, Priority, CONTEXT_LABELS, CONTEXT_COLORS, PRIORITY_LABELS } from '@/lib/types'

interface QuickAddProps {
  defaultContext?: Context
  onAdd: (data: {
    title: string
    context: Context
    priority: Priority
    dueDate?: string
  }) => void
}

export default function QuickAdd({ defaultContext = 'nowa', onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('')
  const [context, setContext] = useState<Context>(defaultContext)
  const [priority, setPriority] = useState<Priority>('media')
  const [dueDate, setDueDate] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) setSpeechSupported(true)
  }, [])

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'pt-PT'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setTitle((prev) => (prev ? prev + ' ' + transcript : transcript))
      setShowOptions(true)
    }
    recognition.onend = () => setRecording(false)
    recognition.onerror = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  function handleSubmit() {
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd({ title: trimmed, context, priority, dueDate: dueDate || undefined })
    setTitle('')
    setDueDate('')
    setShowOptions(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setShowOptions(false)
  }

  const CONTEXTS: Context[] = ['nowa', 'markseg', 'pessoal', 'projetos']
  const PRIORITIES: Priority[] = ['alta', 'media', 'baixa']

  const priorityStyles: Record<Priority, string> = {
    alta: 'bg-red-500/20 text-red-400 border-red-500/40',
    media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    baixa: 'bg-slate-600/40 text-slate-400 border-slate-600',
  }

  return (
    <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700/50">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
        Adicionar tarefa
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowOptions(true)}
          placeholder="Nova tarefa... (Enter para adicionar)"
          className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
        />
        {speechSupported && (
          <button
            onClick={toggleVoice}
            title={recording ? 'A gravar… clica para parar' : 'Gravar áudio'}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
              recording
                ? 'border-red-500 text-red-400 animate-pulse'
                : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
        >
          Adicionar
        </button>
      </div>

      {showOptions && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-slate-500 text-xs mb-1.5">Contexto</p>
            <div className="flex gap-1.5 flex-wrap">
              {CONTEXTS.map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => setContext(ctx)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    context === ctx ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{
                    backgroundColor: `${CONTEXT_COLORS[ctx]}20`,
                    borderColor: `${CONTEXT_COLORS[ctx]}50`,
                    color: CONTEXT_COLORS[ctx],
                  }}
                >
                  {CONTEXT_LABELS[ctx]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-slate-500 text-xs mb-1.5">Prioridade</p>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                      priority === p ? priorityStyles[p] : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-slate-500 text-xs mb-1.5">Data limite</p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-slate-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
