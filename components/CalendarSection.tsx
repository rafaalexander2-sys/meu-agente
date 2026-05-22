'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CalendarEvent,
  getStoredToken,
  initTokenClient,
  revokeToken,
  fetchTodayEvents,
  formatEventTime,
  isEventNow,
  isEventSoon,
} from '@/lib/google-calendar'

export default function CalendarSection() {
  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gsiReady, setGsiReady] = useState(false)
  const tokenClientRef = useRef<any>(null)

  useEffect(() => {
    const check = () => {
      if ((window as any).google?.accounts?.oauth2) {
        setGsiReady(true)
        const stored = getStoredToken()
        if (stored) setToken(stored)
      } else {
        setTimeout(check, 500)
      }
    }
    check()
  }, [])

  useEffect(() => {
    if (!gsiReady) return
    tokenClientRef.current = initTokenClient(
      (t) => { setToken(t); setError(null) },
      () => setError('Não foi possível conectar. Tenta novamente.')
    )
  }, [gsiReady])

  useEffect(() => {
    if (!token) return
    loadEvents(token)
  }, [token])

  async function loadEvents(t: string) {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTodayEvents(t)
      setEvents(data)
    } catch (e: any) {
      if (e.message === 'token_expired') {
        setToken(null)
        setError('Sessão expirada. Reconecta.')
      } else {
        setError('Erro ao carregar eventos.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDisconnect() {
    revokeToken()
    setToken(null)
    setEvents([])
    setError(null)
  }

  if (!token) {
    return (
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 p-4">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Google Calendar</p>
        <button
          onClick={() => tokenClientRef.current?.requestAccessToken()}
          disabled={!gsiReady}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 text-sm font-medium rounded-lg transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Conectar Google Calendar
        </button>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Agenda hoje</p>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-3 h-3 rounded-full border border-blue-400 border-t-transparent animate-spin" />
          )}
          <button
            onClick={() => loadEvents(token)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
            title="Atualizar"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8A5.5 5.5 0 112.5 5.5M2.5 2v3.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={handleDisconnect}
            className="text-slate-600 hover:text-red-400 text-xs transition-all cursor-pointer"
          >
            Desconectar
          </button>
        </div>
      </div>

      {!loading && events.length === 0 && (
        <p className="text-slate-600 text-sm">Sem eventos hoje.</p>
      )}

      <div className="space-y-2">
        {events.map((event) => {
          const now = isEventNow(event)
          const soon = isEventSoon(event)
          return (
            <div
              key={event.id}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                now
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : soon
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-slate-800/40 border-slate-700/30'
              }`}
            >
              <div
                className={`w-1 rounded-full flex-shrink-0 self-stretch min-h-[28px] ${
                  now ? 'bg-blue-400' : soon ? 'bg-yellow-400' : 'bg-slate-600'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${now ? 'text-blue-100' : 'text-slate-200'}`}>
                  {event.summary || '(sem título)'}
                </p>
                <p className={`text-xs mt-0.5 ${now ? 'text-blue-400' : soon ? 'text-yellow-400' : 'text-slate-500'}`}>
                  {formatEventTime(event)}
                  {now && ' · A decorrer'}
                  {!now && soon && ' · Em breve'}
                </p>
                {event.location && (
                  <p className="text-xs text-slate-600 truncate mt-0.5">{event.location}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
